-- Fix the auto-update trigger to handle the correct activity types
-- The trigger was looking for 'ticket_completed' but actual activity type is 'ticket_status_changed'

CREATE OR REPLACE FUNCTION public.trigger_update_user_stats_on_activity()
RETURNS TRIGGER AS $$
BEGIN
    -- Update stats for activity types that affect metrics
    -- Include the actual activity types being logged by the system
    IF NEW.activity_type IN (
        'ticket_created', 
        'ticket_updated', 
        'ticket_status_changed',  -- This is the actual activity type for status changes
        'ticket_completed',       -- Keep this for potential future use
        'appointment_created', 
        'appointment_converted',
        'appointment_status_changed', -- Also handle appointment status changes
        'note_created', 
        'time_logged'
    ) THEN
        -- Call the update function to recalculate statistics
        PERFORM update_user_statistics(NEW.user_id);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- The trigger is already created, no need to recreate it