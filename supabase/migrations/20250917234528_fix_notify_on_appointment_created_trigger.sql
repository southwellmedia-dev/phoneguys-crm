-- Fix the notify_on_appointment_created function to use brand instead of manufacturer
CREATE OR REPLACE FUNCTION public.notify_on_appointment_created()
RETURNS TRIGGER AS $$
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
    
    -- Notify all admins and staff about new appointment
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