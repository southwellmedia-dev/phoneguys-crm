-- Fix the appointment notification trigger to use brand instead of manufacturer
CREATE OR REPLACE FUNCTION public.notify_appointment_created() 
RETURNS TRIGGER AS $$
DECLARE
    v_customer RECORD;
    v_admin RECORD;
    v_device_info TEXT;
BEGIN
    -- Get customer info
    SELECT * INTO v_customer 
    FROM public.customers 
    WHERE id = NEW.customer_id;
    
    -- Get device info if available (use brand instead of manufacturer)
    IF NEW.device_id IS NOT NULL THEN
        SELECT d.brand || ' ' || d.model_name INTO v_device_info
        FROM public.devices d
        WHERE d.id = NEW.device_id;
    END IF;
    
    -- Notify all admins and staff about new appointment
    FOR v_admin IN 
        SELECT id FROM public.users 
        WHERE role IN ('admin', 'staff', 'technician')
    LOOP
        INSERT INTO public.notifications (
            user_id,
            type,
            title,
            message,
            priority,
            related_appointment_id,
            metadata
        ) VALUES (
            v_admin.id,
            'appointment_created',
            'New Appointment Scheduled',
            'Customer ' || v_customer.name || ' has scheduled an appointment for ' || 
            to_char(NEW.scheduled_date, 'Mon DD, YYYY') || ' at ' || 
            to_char(NEW.scheduled_time, 'HH12:MI AM'),
            'medium',
            NEW.id,
            jsonb_build_object(
                'customer_name', v_customer.name,
                'customer_email', v_customer.email,
                'customer_phone', v_customer.phone,
                'appointment_date', NEW.scheduled_date,
                'appointment_time', NEW.scheduled_time,
                'device_info', v_device_info,
                'issues', NEW.issues,
                'description', NEW.description
            )
        );
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add missing consent columns to notification_preferences table
ALTER TABLE public.notification_preferences 
ADD COLUMN IF NOT EXISTS consent_given_at timestamptz,
ADD COLUMN IF NOT EXISTS consent_ip text;

-- Add comment for documentation
COMMENT ON COLUMN public.notification_preferences.consent_given_at IS 'Timestamp when consent was given for notifications';
COMMENT ON COLUMN public.notification_preferences.consent_ip IS 'IP address from which consent was given';