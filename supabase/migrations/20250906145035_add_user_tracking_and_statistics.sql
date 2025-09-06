-- Add user tracking fields to existing tables

-- Add tracking fields to appointments table
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES public.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS converted_by UUID REFERENCES public.users(id) ON DELETE SET NULL;

-- Add created_by to repair_tickets table
ALTER TABLE public.repair_tickets
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.users(id) ON DELETE SET NULL;

-- Add last_login_at to users table
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Create user activity logs table
CREATE TABLE IF NOT EXISTS public.user_activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL,
    entity_type TEXT,
    entity_id UUID,
    details JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for activity logs
CREATE INDEX idx_user_activity_user_id ON public.user_activity_logs(user_id);
CREATE INDEX idx_user_activity_created_at ON public.user_activity_logs(created_at);
CREATE INDEX idx_user_activity_type ON public.user_activity_logs(activity_type);

-- Create user statistics table for caching computed stats
CREATE TABLE IF NOT EXISTS public.user_statistics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
    
    -- Ticket statistics
    tickets_created INTEGER DEFAULT 0,
    tickets_assigned INTEGER DEFAULT 0,
    tickets_completed INTEGER DEFAULT 0,
    tickets_in_progress INTEGER DEFAULT 0,
    tickets_cancelled INTEGER DEFAULT 0,
    tickets_on_hold INTEGER DEFAULT 0,
    avg_completion_time_hours DECIMAL(10,2),
    
    -- Appointment statistics
    appointments_created INTEGER DEFAULT 0,
    appointments_assigned INTEGER DEFAULT 0,
    appointments_converted INTEGER DEFAULT 0,
    appointments_no_show INTEGER DEFAULT 0,
    appointments_cancelled INTEGER DEFAULT 0,
    conversion_rate DECIMAL(5,2),
    
    -- Notes and activity
    notes_created INTEGER DEFAULT 0,
    total_time_logged_minutes INTEGER DEFAULT 0,
    
    -- Performance metrics
    daily_completion_avg DECIMAL(10,2),
    weekly_completion_avg DECIMAL(10,2),
    monthly_completion_avg DECIMAL(10,2),
    customer_satisfaction_avg DECIMAL(3,2),
    
    -- Timestamps
    last_activity_at TIMESTAMPTZ,
    stats_updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Function to update user statistics
CREATE OR REPLACE FUNCTION public.update_user_statistics(p_user_id UUID)
RETURNS void AS $$
BEGIN
    INSERT INTO public.user_statistics (
        user_id,
        tickets_created,
        tickets_assigned,
        tickets_completed,
        tickets_in_progress,
        tickets_cancelled,
        tickets_on_hold,
        appointments_created,
        appointments_assigned,
        appointments_converted,
        appointments_no_show,
        appointments_cancelled,
        notes_created,
        total_time_logged_minutes,
        stats_updated_at
    )
    VALUES (
        p_user_id,
        (SELECT COUNT(*) FROM public.repair_tickets WHERE created_by = p_user_id),
        (SELECT COUNT(*) FROM public.repair_tickets WHERE assigned_to = p_user_id),
        (SELECT COUNT(*) FROM public.repair_tickets WHERE assigned_to = p_user_id AND status = 'completed'),
        (SELECT COUNT(*) FROM public.repair_tickets WHERE assigned_to = p_user_id AND status = 'in_progress'),
        (SELECT COUNT(*) FROM public.repair_tickets WHERE assigned_to = p_user_id AND status = 'cancelled'),
        (SELECT COUNT(*) FROM public.repair_tickets WHERE assigned_to = p_user_id AND status = 'on_hold'),
        (SELECT COUNT(*) FROM public.appointments WHERE created_by = p_user_id),
        (SELECT COUNT(*) FROM public.appointments WHERE assigned_to = p_user_id),
        (SELECT COUNT(*) FROM public.appointments WHERE converted_by = p_user_id AND status = 'converted'),
        (SELECT COUNT(*) FROM public.appointments WHERE assigned_to = p_user_id AND status = 'no_show'),
        (SELECT COUNT(*) FROM public.appointments WHERE assigned_to = p_user_id AND status = 'cancelled'),
        (SELECT COUNT(*) FROM public.ticket_notes WHERE user_id = p_user_id),
        (SELECT COALESCE(SUM(total_time_minutes), 0) FROM public.repair_tickets WHERE assigned_to = p_user_id),
        NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
        tickets_created = EXCLUDED.tickets_created,
        tickets_assigned = EXCLUDED.tickets_assigned,
        tickets_completed = EXCLUDED.tickets_completed,
        tickets_in_progress = EXCLUDED.tickets_in_progress,
        tickets_cancelled = EXCLUDED.tickets_cancelled,
        tickets_on_hold = EXCLUDED.tickets_on_hold,
        appointments_created = EXCLUDED.appointments_created,
        appointments_assigned = EXCLUDED.appointments_assigned,
        appointments_converted = EXCLUDED.appointments_converted,
        appointments_no_show = EXCLUDED.appointments_no_show,
        appointments_cancelled = EXCLUDED.appointments_cancelled,
        notes_created = EXCLUDED.notes_created,
        total_time_logged_minutes = EXCLUDED.total_time_logged_minutes,
        stats_updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to log user activity
CREATE OR REPLACE FUNCTION public.log_user_activity(
    p_user_id UUID,
    p_activity_type TEXT,
    p_entity_type TEXT DEFAULT NULL,
    p_entity_id UUID DEFAULT NULL,
    p_details JSONB DEFAULT '{}'
)
RETURNS void AS $$
BEGIN
    INSERT INTO public.user_activity_logs (
        user_id,
        activity_type,
        entity_type,
        entity_id,
        details,
        created_at
    )
    VALUES (
        p_user_id,
        p_activity_type,
        p_entity_type,
        p_entity_id,
        p_details,
        NOW()
    );
    
    -- Update last_activity_at in user_statistics
    UPDATE public.user_statistics 
    SET last_activity_at = NOW() 
    WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get user dashboard data based on role
CREATE OR REPLACE FUNCTION public.get_user_dashboard_data(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
    v_user_role TEXT;
    v_result JSON;
BEGIN
    -- Get user role
    SELECT role INTO v_user_role FROM public.users WHERE id = p_user_id;
    
    -- Build dashboard data based on role
    IF v_user_role = 'technician' THEN
        SELECT json_build_object(
            'role', v_user_role,
            'todaysTickets', (
                SELECT json_agg(row_to_json(t))
                FROM (
                    SELECT rt.*, c.name as customer_name
                    FROM public.repair_tickets rt
                    LEFT JOIN public.customers c ON rt.customer_id = c.id
                    WHERE rt.assigned_to = p_user_id
                    AND rt.status IN ('new', 'in_progress')
                    ORDER BY rt.priority DESC, rt.created_at ASC
                    LIMIT 10
                ) t
            ),
            'upcomingAppointments', (
                SELECT json_agg(row_to_json(a))
                FROM (
                    SELECT a.*, c.name as customer_name
                    FROM public.appointments a
                    LEFT JOIN public.customers c ON a.customer_id = c.id
                    WHERE a.assigned_to = p_user_id
                    AND a.status IN ('scheduled', 'confirmed')
                    AND a.scheduled_date >= CURRENT_DATE
                    ORDER BY a.scheduled_date, a.scheduled_time
                    LIMIT 5
                ) a
            ),
            'statistics', (
                SELECT row_to_json(s)
                FROM public.user_statistics s
                WHERE s.user_id = p_user_id
            ),
            'recentActivity', (
                SELECT json_agg(row_to_json(l))
                FROM (
                    SELECT *
                    FROM public.user_activity_logs
                    WHERE user_id = p_user_id
                    ORDER BY created_at DESC
                    LIMIT 10
                ) l
            )
        ) INTO v_result;
    ELSIF v_user_role = 'manager' THEN
        SELECT json_build_object(
            'role', v_user_role,
            'teamOverview', (
                SELECT json_agg(row_to_json(u))
                FROM (
                    SELECT 
                        u.id, 
                        u.full_name, 
                        u.role,
                        us.tickets_in_progress,
                        us.tickets_completed,
                        us.daily_completion_avg
                    FROM public.users u
                    LEFT JOIN public.user_statistics us ON u.id = us.user_id
                    WHERE u.role = 'technician'
                ) u
            ),
            'workloadDistribution', (
                SELECT json_build_object(
                    'unassigned', COUNT(*) FILTER (WHERE assigned_to IS NULL),
                    'assigned', COUNT(*) FILTER (WHERE assigned_to IS NOT NULL)
                )
                FROM public.repair_tickets
                WHERE status IN ('new', 'in_progress')
            ),
            'todaysMetrics', (
                SELECT json_build_object(
                    'ticketsCreated', COUNT(*) FILTER (WHERE DATE(created_at) = CURRENT_DATE),
                    'ticketsCompleted', COUNT(*) FILTER (WHERE DATE(completed_at) = CURRENT_DATE),
                    'appointmentsScheduled', (
                        SELECT COUNT(*) 
                        FROM public.appointments 
                        WHERE scheduled_date = CURRENT_DATE
                    )
                )
                FROM public.repair_tickets
            )
        ) INTO v_result;
    ELSE -- admin
        -- Return comprehensive data for admin
        SELECT json_build_object(
            'role', v_user_role,
            'systemStats', (
                SELECT json_build_object(
                    'totalUsers', (SELECT COUNT(*) FROM public.users),
                    'totalTickets', (SELECT COUNT(*) FROM public.repair_tickets),
                    'totalAppointments', (SELECT COUNT(*) FROM public.appointments),
                    'activeTickets', (SELECT COUNT(*) FROM public.repair_tickets WHERE status IN ('new', 'in_progress'))
                )
            ),
            'userActivity', (
                SELECT json_agg(row_to_json(a))
                FROM (
                    SELECT 
                        l.*,
                        u.full_name as user_name
                    FROM public.user_activity_logs l
                    JOIN public.users u ON l.user_id = u.id
                    ORDER BY l.created_at DESC
                    LIMIT 20
                ) a
            )
        ) INTO v_result;
    END IF;
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically log activities

-- Trigger for ticket creation
CREATE OR REPLACE FUNCTION public.trigger_log_ticket_activity()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.created_by IS NOT NULL THEN
            PERFORM log_user_activity(
                NEW.created_by,
                'ticket_created',
                'repair_ticket',
                NEW.id,
                jsonb_build_object('ticket_number', NEW.ticket_number)
            );
        END IF;
        IF NEW.assigned_to IS NOT NULL THEN
            PERFORM log_user_activity(
                NEW.assigned_to,
                'ticket_assigned',
                'repair_ticket',
                NEW.id,
                jsonb_build_object('ticket_number', NEW.ticket_number)
            );
        END IF;
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.status != NEW.status AND NEW.assigned_to IS NOT NULL THEN
            PERFORM log_user_activity(
                NEW.assigned_to,
                'ticket_status_changed',
                'repair_ticket',
                NEW.id,
                jsonb_build_object(
                    'ticket_number', NEW.ticket_number,
                    'old_status', OLD.status,
                    'new_status', NEW.status
                )
            );
        END IF;
        IF OLD.assigned_to IS DISTINCT FROM NEW.assigned_to AND NEW.assigned_to IS NOT NULL THEN
            PERFORM log_user_activity(
                NEW.assigned_to,
                'ticket_assigned',
                'repair_ticket',
                NEW.id,
                jsonb_build_object('ticket_number', NEW.ticket_number)
            );
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_ticket_activity
AFTER INSERT OR UPDATE ON public.repair_tickets
FOR EACH ROW EXECUTE FUNCTION public.trigger_log_ticket_activity();

-- Trigger for appointment activity
CREATE OR REPLACE FUNCTION public.trigger_log_appointment_activity()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.created_by IS NOT NULL THEN
            PERFORM log_user_activity(
                NEW.created_by,
                'appointment_created',
                'appointment',
                NEW.id,
                jsonb_build_object('appointment_number', NEW.appointment_number)
            );
        END IF;
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.status != NEW.status AND NEW.status = 'converted' AND NEW.converted_by IS NOT NULL THEN
            PERFORM log_user_activity(
                NEW.converted_by,
                'appointment_converted',
                'appointment',
                NEW.id,
                jsonb_build_object(
                    'appointment_number', NEW.appointment_number,
                    'ticket_id', NEW.converted_to_ticket_id
                )
            );
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_appointment_activity
AFTER INSERT OR UPDATE ON public.appointments
FOR EACH ROW EXECUTE FUNCTION public.trigger_log_appointment_activity();

-- Trigger for notes activity
CREATE OR REPLACE FUNCTION public.trigger_log_note_activity()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.user_id IS NOT NULL THEN
        PERFORM log_user_activity(
            NEW.user_id,
            'note_created',
            'ticket_note',
            NEW.id,
            jsonb_build_object(
                'ticket_id', NEW.ticket_id,
                'note_type', NEW.note_type
            )
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_note_activity
AFTER INSERT ON public.ticket_notes
FOR EACH ROW EXECUTE FUNCTION public.trigger_log_note_activity();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_repair_tickets_created_by ON public.repair_tickets(created_by);
CREATE INDEX IF NOT EXISTS idx_repair_tickets_assigned_to ON public.repair_tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_appointments_assigned_to ON public.appointments(assigned_to);
CREATE INDEX IF NOT EXISTS idx_appointments_created_by ON public.appointments(created_by);
CREATE INDEX IF NOT EXISTS idx_appointments_converted_by ON public.appointments(converted_by);

-- Update RLS policies for new tables
ALTER TABLE public.user_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_statistics ENABLE ROW LEVEL SECURITY;

-- Users can see their own activity logs
CREATE POLICY "Users can view own activity logs"
ON public.user_activity_logs FOR SELECT
USING (auth.uid() = user_id);

-- Admins and managers can view all activity logs
CREATE POLICY "Admins and managers can view all activity logs"
ON public.user_activity_logs FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid() 
        AND role IN ('admin', 'manager')
    )
);

-- Users can view their own statistics
CREATE POLICY "Users can view own statistics"
ON public.user_statistics FOR SELECT
USING (auth.uid() = user_id);

-- Admins and managers can view all statistics
CREATE POLICY "Admins and managers can view all statistics"
ON public.user_statistics FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid() 
        AND role IN ('admin', 'manager')
    )
);

-- Initialize statistics for existing users
INSERT INTO public.user_statistics (user_id)
SELECT id FROM public.users
ON CONFLICT (user_id) DO NOTHING;

-- Update statistics for all users
DO $$
DECLARE
    user_record RECORD;
BEGIN
    FOR user_record IN SELECT id FROM public.users
    LOOP
        PERFORM update_user_statistics(user_record.id);
    END LOOP;
END $$;