-- Calendar and Availability System for Appointment Scheduling

-- 1. Business Hours Configuration
-- Stores regular business hours for each day of the week
CREATE TABLE IF NOT EXISTS public.business_hours (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Sunday, 6=Saturday
    open_time TIME,
    close_time TIME,
    is_active BOOLEAN DEFAULT true,
    break_start TIME, -- Optional lunch break
    break_end TIME,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT valid_hours CHECK (
        (is_active = false) OR 
        (open_time IS NOT NULL AND close_time IS NOT NULL AND open_time < close_time)
    ),
    CONSTRAINT valid_break CHECK (
        (break_start IS NULL AND break_end IS NULL) OR 
        (break_start IS NOT NULL AND break_end IS NOT NULL AND break_start < break_end)
    ),
    UNIQUE(day_of_week)
);

-- 2. Staff Availability
-- Tracks individual staff availability for specific dates
CREATE TABLE IF NOT EXISTS public.staff_availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    max_appointments INTEGER DEFAULT 10,
    current_appointments INTEGER DEFAULT 0,
    is_available BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT valid_availability_hours CHECK (start_time < end_time),
    CONSTRAINT valid_appointment_count CHECK (current_appointments >= 0 AND current_appointments <= max_appointments),
    UNIQUE(user_id, date)
);

-- 3. Appointment Slots
-- Pre-generated time slots for efficient querying
CREATE TABLE IF NOT EXISTS public.appointment_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    duration_minutes INTEGER DEFAULT 30,
    staff_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
    is_available BOOLEAN DEFAULT true,
    slot_type VARCHAR(20) DEFAULT 'regular' CHECK (slot_type IN ('regular', 'emergency', 'walk-in')),
    max_capacity INTEGER DEFAULT 1,
    current_capacity INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT valid_slot_times CHECK (start_time < end_time),
    CONSTRAINT valid_capacity CHECK (current_capacity >= 0 AND current_capacity <= max_capacity),
    UNIQUE(date, start_time, staff_id)
);

-- 4. Special Dates (Holidays, Closures)
CREATE TABLE IF NOT EXISTS public.special_dates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL UNIQUE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('holiday', 'closure', 'special_hours')),
    name VARCHAR(100),
    open_time TIME, -- NULL for closures
    close_time TIME, -- NULL for closures
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT valid_special_hours CHECK (
        (type = 'closure' AND open_time IS NULL AND close_time IS NULL) OR
        (type != 'closure' AND open_time IS NOT NULL AND close_time IS NOT NULL AND open_time < close_time)
    )
);

-- 5. Internal Notifications System
CREATE TABLE IF NOT EXISTS public.internal_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN (
        'appointment_created',
        'appointment_assigned',
        'appointment_cancelled',
        'appointment_confirmed',
        'appointment_reminder',
        'ticket_created',
        'ticket_assigned',
        'ticket_status_changed',
        'form_submission',
        'system_alert'
    )),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    data JSONB, -- Additional data (appointment_id, ticket_id, etc.)
    priority VARCHAR(10) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMPTZ,
    action_url TEXT, -- Optional link to related resource
    expires_at TIMESTAMPTZ, -- Optional expiration for time-sensitive notifications
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL
);

-- 6. Notification Preferences
CREATE TABLE IF NOT EXISTS public.notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    notification_type VARCHAR(50) NOT NULL,
    enabled BOOLEAN DEFAULT true,
    email_enabled BOOLEAN DEFAULT true,
    push_enabled BOOLEAN DEFAULT true,
    in_app_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, notification_type)
);

-- 7. Form Submissions (for tracking website form submissions)
CREATE TABLE IF NOT EXISTS public.form_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    form_type VARCHAR(50) DEFAULT 'appointment',
    submission_data JSONB NOT NULL,
    customer_name VARCHAR(255),
    customer_email VARCHAR(255),
    customer_phone VARCHAR(20),
    device_info JSONB,
    issues TEXT[],
    preferred_date DATE,
    preferred_time TIME,
    appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'rejected')),
    processed_at TIMESTAMPTZ,
    processed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    notes TEXT,
    source_url TEXT, -- Which website the form was embedded on
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_business_hours_day ON public.business_hours(day_of_week) WHERE is_active = true;
CREATE INDEX idx_staff_availability_date ON public.staff_availability(date, user_id) WHERE is_available = true;
CREATE INDEX idx_staff_availability_user ON public.staff_availability(user_id, date);
CREATE INDEX idx_appointment_slots_date ON public.appointment_slots(date, start_time) WHERE is_available = true;
CREATE INDEX idx_appointment_slots_staff ON public.appointment_slots(staff_id, date);
CREATE INDEX idx_special_dates_date ON public.special_dates(date);
CREATE INDEX idx_internal_notifications_user ON public.internal_notifications(user_id, is_read, created_at DESC);
CREATE INDEX idx_internal_notifications_unread ON public.internal_notifications(user_id) WHERE is_read = false;
CREATE INDEX idx_form_submissions_status ON public.form_submissions(status, created_at DESC);
CREATE INDEX idx_form_submissions_appointment ON public.form_submissions(appointment_id);

-- Functions for slot management

-- Function to generate appointment slots for a given date
CREATE OR REPLACE FUNCTION public.generate_appointment_slots(
    p_date DATE,
    p_slot_duration INTEGER DEFAULT 30
)
RETURNS VOID AS $$
DECLARE
    v_day_of_week INTEGER;
    v_business_hours RECORD;
    v_special_date RECORD;
    v_current_time TIME;
    v_end_time TIME;
    v_staff RECORD;
BEGIN
    -- Get day of week (0=Sunday, 6=Saturday)
    v_day_of_week := EXTRACT(DOW FROM p_date);
    
    -- Check for special dates first
    SELECT * INTO v_special_date
    FROM public.special_dates
    WHERE date = p_date;
    
    -- If it's a closure day, don't generate slots
    IF v_special_date.type = 'closure' THEN
        RETURN;
    END IF;
    
    -- Get business hours (use special hours if available)
    IF v_special_date.type = 'special_hours' THEN
        v_business_hours.open_time := v_special_date.open_time;
        v_business_hours.close_time := v_special_date.close_time;
    ELSE
        SELECT * INTO v_business_hours
        FROM public.business_hours
        WHERE day_of_week = v_day_of_week AND is_active = true;
        
        IF v_business_hours IS NULL THEN
            RETURN; -- No business hours for this day
        END IF;
    END IF;
    
    -- For each available staff member
    FOR v_staff IN 
        SELECT u.id, sa.start_time, sa.end_time, sa.max_appointments
        FROM public.users u
        LEFT JOIN public.staff_availability sa ON sa.user_id = u.id AND sa.date = p_date
        WHERE u.role IN ('admin', 'technician', 'staff')
        AND u.is_active = true
    LOOP
        -- Use staff-specific hours if available, otherwise use business hours
        v_current_time := COALESCE(v_staff.start_time, v_business_hours.open_time);
        v_end_time := COALESCE(v_staff.end_time, v_business_hours.close_time);
        
        -- Generate slots for this staff member
        WHILE v_current_time < v_end_time LOOP
            -- Skip if slot already exists
            INSERT INTO public.appointment_slots (
                date,
                start_time,
                end_time,
                duration_minutes,
                staff_id,
                is_available
            ) VALUES (
                p_date,
                v_current_time,
                v_current_time + (p_slot_duration || ' minutes')::INTERVAL,
                p_slot_duration,
                v_staff.id,
                true
            ) ON CONFLICT (date, start_time, staff_id) DO NOTHING;
            
            v_current_time := v_current_time + (p_slot_duration || ' minutes')::INTERVAL;
        END LOOP;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to check slot availability
CREATE OR REPLACE FUNCTION public.check_slot_availability(
    p_date DATE,
    p_time TIME,
    p_duration_minutes INTEGER DEFAULT 30
)
RETURNS TABLE (
    slot_id UUID,
    staff_id UUID,
    staff_name VARCHAR,
    is_available BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id as slot_id,
        s.staff_id,
        u.full_name as staff_name,
        s.is_available
    FROM public.appointment_slots s
    LEFT JOIN public.users u ON u.id = s.staff_id
    WHERE s.date = p_date
    AND s.start_time = p_time
    AND s.duration_minutes = p_duration_minutes
    AND s.is_available = true
    AND s.current_capacity < s.max_capacity;
END;
$$ LANGUAGE plpgsql;

-- Function to create internal notification
CREATE OR REPLACE FUNCTION public.create_internal_notification(
    p_user_id UUID,
    p_type VARCHAR,
    p_title TEXT,
    p_message TEXT,
    p_data JSONB DEFAULT NULL,
    p_priority VARCHAR DEFAULT 'normal',
    p_action_url TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_notification_id UUID;
    v_pref RECORD;
BEGIN
    -- Check user preferences
    SELECT * INTO v_pref
    FROM public.notification_preferences
    WHERE user_id = p_user_id
    AND notification_type = p_type;
    
    -- If preferences exist and in-app is disabled, don't create
    IF v_pref IS NOT NULL AND v_pref.in_app_enabled = false THEN
        RETURN NULL;
    END IF;
    
    -- Create notification
    INSERT INTO public.internal_notifications (
        user_id,
        type,
        title,
        message,
        data,
        priority,
        action_url
    ) VALUES (
        p_user_id,
        p_type,
        p_title,
        p_message,
        p_data,
        p_priority,
        p_action_url
    ) RETURNING id INTO v_notification_id;
    
    RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql;

-- Triggers

-- Update appointment slot when appointment is created/cancelled
CREATE OR REPLACE FUNCTION public.update_slot_on_appointment_change()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Mark slot as unavailable
        UPDATE public.appointment_slots
        SET 
            is_available = false,
            appointment_id = NEW.id,
            current_capacity = current_capacity + 1
        WHERE date = NEW.scheduled_date
        AND start_time = NEW.scheduled_time;
        
        -- Update staff availability count
        UPDATE public.staff_availability
        SET current_appointments = current_appointments + 1
        WHERE user_id = NEW.assigned_to
        AND date = NEW.scheduled_date;
        
    ELSIF TG_OP = 'DELETE' OR (TG_OP = 'UPDATE' AND NEW.status = 'cancelled') THEN
        -- Mark slot as available again
        UPDATE public.appointment_slots
        SET 
            is_available = true,
            appointment_id = NULL,
            current_capacity = GREATEST(0, current_capacity - 1)
        WHERE appointment_id = COALESCE(OLD.id, NEW.id);
        
        -- Update staff availability count
        UPDATE public.staff_availability
        SET current_appointments = GREATEST(0, current_appointments - 1)
        WHERE user_id = COALESCE(OLD.assigned_to, NEW.assigned_to)
        AND date = COALESCE(OLD.scheduled_date, NEW.scheduled_date);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_slot_on_appointment
AFTER INSERT OR UPDATE OR DELETE ON public.appointments
FOR EACH ROW EXECUTE FUNCTION public.update_slot_on_appointment_change();

-- Trigger to create notifications on appointment creation
CREATE OR REPLACE FUNCTION public.notify_on_appointment_created()
RETURNS TRIGGER AS $$
DECLARE
    v_admin RECORD;
BEGIN
    -- Notify all admins and staff about new appointment
    FOR v_admin IN 
        SELECT id FROM public.users 
        WHERE role IN ('admin', 'staff') 
        AND is_active = true
    LOOP
        PERFORM public.create_internal_notification(
            v_admin.id,
            'appointment_created',
            'New Appointment Created',
            'A new appointment has been scheduled for ' || NEW.scheduled_date || ' at ' || NEW.scheduled_time,
            jsonb_build_object(
                'appointment_id', NEW.id,
                'appointment_number', NEW.appointment_number,
                'customer_id', NEW.customer_id
            ),
            'normal',
            '/appointments/' || NEW.id
        );
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_appointment_created
AFTER INSERT ON public.appointments
FOR EACH ROW EXECUTE FUNCTION public.notify_on_appointment_created();

-- Updated_at triggers
CREATE TRIGGER update_business_hours_updated_at
BEFORE UPDATE ON public.business_hours
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_staff_availability_updated_at
BEFORE UPDATE ON public.staff_availability
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_appointment_slots_updated_at
BEFORE UPDATE ON public.appointment_slots
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_special_dates_updated_at
BEFORE UPDATE ON public.special_dates
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_notification_preferences_updated_at
BEFORE UPDATE ON public.notification_preferences
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Row Level Security Policies

-- Business hours (viewable by all, editable by admin only)
ALTER TABLE public.business_hours ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Business hours viewable by authenticated users"
ON public.business_hours FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Business hours editable by admin"
ON public.business_hours FOR ALL
TO authenticated
USING (auth.jwt() ->> 'role' = 'admin');

-- Staff availability (viewable by all staff, editable by self or admin)
ALTER TABLE public.staff_availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff availability viewable by staff"
ON public.staff_availability FOR SELECT
TO authenticated
USING (
    auth.jwt() ->> 'role' IN ('admin', 'staff', 'technician')
);

CREATE POLICY "Staff availability editable by self or admin"
ON public.staff_availability FOR ALL
TO authenticated
USING (
    user_id = auth.uid() OR 
    auth.jwt() ->> 'role' = 'admin'
);

-- Appointment slots (viewable by all, editable by admin/staff)
ALTER TABLE public.appointment_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Appointment slots viewable by all"
ON public.appointment_slots FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Appointment slots editable by admin/staff"
ON public.appointment_slots FOR ALL
TO authenticated
USING (auth.jwt() ->> 'role' IN ('admin', 'staff'));

-- Internal notifications (viewable by recipient, creatable by system)
ALTER TABLE public.internal_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Notifications viewable by recipient"
ON public.internal_notifications FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Notifications updatable by recipient"
ON public.internal_notifications FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

-- Form submissions (viewable by staff, public can insert)
ALTER TABLE public.form_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Form submissions viewable by staff"
ON public.form_submissions FOR SELECT
TO authenticated
USING (auth.jwt() ->> 'role' IN ('admin', 'staff', 'technician'));

CREATE POLICY "Form submissions insertable by anon"
ON public.form_submissions FOR INSERT
TO anon
WITH CHECK (true);

-- Seed initial business hours (Mon-Fri 9AM-6PM, Sat 10AM-4PM)
INSERT INTO public.business_hours (day_of_week, open_time, close_time, break_start, break_end, is_active) VALUES
(1, '09:00', '18:00', '12:00', '13:00', true), -- Monday
(2, '09:00', '18:00', '12:00', '13:00', true), -- Tuesday
(3, '09:00', '18:00', '12:00', '13:00', true), -- Wednesday
(4, '09:00', '18:00', '12:00', '13:00', true), -- Thursday
(5, '09:00', '18:00', '12:00', '13:00', true), -- Friday
(6, '10:00', '16:00', NULL, NULL, true),       -- Saturday
(0, NULL, NULL, NULL, NULL, false)             -- Sunday (closed)
ON CONFLICT (day_of_week) DO NOTHING;

-- Comments for documentation
COMMENT ON TABLE public.business_hours IS 'Regular business hours configuration for each day of the week';
COMMENT ON TABLE public.staff_availability IS 'Individual staff availability for specific dates';
COMMENT ON TABLE public.appointment_slots IS 'Pre-generated time slots for appointment booking';
COMMENT ON TABLE public.special_dates IS 'Holidays, closures, and special hours';
COMMENT ON TABLE public.internal_notifications IS 'In-app notification system for users';
COMMENT ON TABLE public.notification_preferences IS 'User preferences for different notification types';
COMMENT ON TABLE public.form_submissions IS 'Tracking of website form submissions';