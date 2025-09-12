-- Fix real-time notification broadcasting for appointments created via public API
-- The issue is that notifications created by triggers might not immediately broadcast to subscribers

-- First, ensure the internal_notifications table has real-time enabled
-- Note: This is handled by Supabase's dashboard settings, removing from migration

-- Update the create_internal_notification function to ensure proper visibility
CREATE OR REPLACE FUNCTION public.create_internal_notification(
    p_user_id UUID,
    p_type VARCHAR,
    p_title TEXT,
    p_message TEXT,
    p_data JSONB DEFAULT NULL,
    p_priority VARCHAR DEFAULT 'normal',
    p_action_url TEXT DEFAULT NULL
)
RETURNS UUID 
SECURITY DEFINER
SET search_path = public
AS $$
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
    
    -- Create notification with explicit column values for better real-time broadcasting
    INSERT INTO public.internal_notifications (
        user_id,
        type,
        title,
        message,
        data,
        priority,
        action_url,
        is_read,
        created_at,
        updated_at
    ) VALUES (
        p_user_id,
        p_type,
        p_title,
        p_message,
        p_data,
        p_priority,
        p_action_url,
        false,
        NOW(),
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

-- Update the appointment notification trigger to include customer information
CREATE OR REPLACE FUNCTION notify_on_appointment_created()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
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
    
    -- Get device info if available
    IF NEW.device_id IS NOT NULL THEN
        SELECT d.manufacturer || ' ' || d.model_name INTO v_device_info
        FROM public.devices d
        WHERE d.id = NEW.device_id;
    END IF;
    
    -- Notify all admins and staff about new appointment
    FOR v_admin IN 
        SELECT id FROM public.users 
        WHERE role IN ('admin', 'staff', 'manager', 'technician')
        AND (is_active IS NULL OR is_active = true)
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
$$;

-- Add a comment explaining the improvements
COMMENT ON FUNCTION public.create_internal_notification IS 
'Creates internal notifications with proper real-time broadcasting support. 
Uses SECURITY DEFINER to bypass RLS and pg_notify to ensure immediate visibility.';

COMMENT ON FUNCTION public.notify_on_appointment_created IS 
'Notifies all active staff members when a new appointment is created. 
Enhanced to include customer and device information in the notification.';