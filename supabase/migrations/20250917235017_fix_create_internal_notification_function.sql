-- Fix create_internal_notification function to remove non-existent notification_type column check
CREATE OR REPLACE FUNCTION public.create_internal_notification(
    p_user_id UUID,
    p_type TEXT,
    p_title TEXT,
    p_message TEXT,
    p_data JSONB DEFAULT NULL,
    p_priority TEXT DEFAULT 'normal',
    p_action_url TEXT DEFAULT NULL
)
RETURNS UUID AS $$
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