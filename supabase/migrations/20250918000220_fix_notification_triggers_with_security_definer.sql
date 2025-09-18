-- Fix the notification functions to use SECURITY DEFINER so they can insert notifications
-- even when called from public/anonymous context

-- First, update create_internal_notification to use SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.create_internal_notification(
    p_user_id UUID,
    p_type TEXT,
    p_title TEXT,
    p_message TEXT,
    p_data JSONB DEFAULT NULL,
    p_priority TEXT DEFAULT 'normal',
    p_action_url TEXT DEFAULT NULL
)
RETURNS UUID 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_notification_id UUID;
BEGIN
    -- Create notification without checking preferences
    -- The notification_preferences table doesn't have a notification_type column
    INSERT INTO public.internal_notifications (
        user_id,
        type,
        title,
        message,
        data,
        priority,
        action_url,
        is_read,
        created_at
    ) VALUES (
        p_user_id,
        p_type,
        p_title,
        p_message,
        p_data,
        p_priority,
        p_action_url,
        false,
        NOW()
    )
    RETURNING id INTO v_notification_id;
    
    -- Force a commit to ensure the notification is visible to real-time subscribers
    -- This is important for notifications created within triggers
    PERFORM pg_notify(
        'notification_created',
        json_build_object(
            'notification_id', v_notification_id,
            'user_id', p_user_id,
            'type', p_type,
            'title', p_title
        )::text
    );
    
    RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql;

-- Update notify_on_appointment_created to use SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.notify_on_appointment_created()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_admin RECORD;
    v_customer_name TEXT;
    v_device_info TEXT;
BEGIN
    -- Get customer name for better notification message
    SELECT c.name INTO v_customer_name
    FROM public.customers c
    WHERE c.id = NEW.customer_id;
    
    -- Get device info if available (use brand instead of manufacturer)
    IF NEW.device_id IS NOT NULL THEN
        SELECT d.brand || ' ' || d.model_name INTO v_device_info
        FROM public.devices d
        WHERE d.id = NEW.device_id;
    END IF;
    
    -- Notify all admins and staff about new appointment (removed is_active check)
    FOR v_admin IN 
        SELECT id FROM public.users 
        WHERE role IN ('admin', 'staff', 'manager', 'technician')
    LOOP
        PERFORM public.create_internal_notification(
            v_admin.id,
            'new_appointment',  -- Use the correct enum value
            'New Appointment Created',
            'Appointment scheduled for ' || COALESCE(v_customer_name, 'Customer') || 
            ' on ' || NEW.scheduled_date::text || ' at ' || NEW.scheduled_time ||
            CASE WHEN v_device_info IS NOT NULL THEN ' - ' || v_device_info ELSE '' END,
            jsonb_build_object(
                'appointment_id', NEW.id,
                'appointment_number', NEW.appointment_number,
                'customer_id', NEW.customer_id,
                'customer_name', v_customer_name,
                'device_info', v_device_info,
                'source', NEW.source
            ),
            CASE WHEN NEW.urgency = 'urgent' THEN 'high' ELSE 'normal' END,
            '/appointments/' || NEW.id
        );
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update notify_appointment_created to use SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.notify_appointment_created() 
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
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
    
    -- Notify all admins and staff about new appointment (removed is_active check)
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