-- Populate User Statistics and Activity Data
-- This migration populates the user tracking fields and statistics tables with data

-- Step 1: Populate created_by and assigned_to fields for existing tickets
-- Assign all existing unassigned tickets to the first admin user for historical data
DO $$
DECLARE
    admin_user_id UUID;
BEGIN
    -- Get the first admin user (or any user if no admin exists)
    SELECT id INTO admin_user_id 
    FROM public.users 
    WHERE role = 'admin' 
    ORDER BY created_at 
    LIMIT 1;
    
    -- If no admin, get any user
    IF admin_user_id IS NULL THEN
        SELECT id INTO admin_user_id 
        FROM public.users 
        ORDER BY created_at 
        LIMIT 1;
    END IF;
    
    -- Update repair_tickets that don't have created_by
    UPDATE public.repair_tickets 
    SET created_by = COALESCE(created_by, admin_user_id)
    WHERE created_by IS NULL;
    
    -- Update repair_tickets that don't have assigned_to (optional - you may want to leave some unassigned)
    -- Uncomment if you want all tickets assigned
    -- UPDATE public.repair_tickets 
    -- SET assigned_to = COALESCE(assigned_to, admin_user_id)
    -- WHERE assigned_to IS NULL;
END $$;

-- Step 2: Populate appointment tracking fields
DO $$
DECLARE
    admin_user_id UUID;
BEGIN
    -- Get the first admin user
    SELECT id INTO admin_user_id 
    FROM public.users 
    WHERE role = 'admin' 
    ORDER BY created_at 
    LIMIT 1;
    
    -- If no admin, get any user
    IF admin_user_id IS NULL THEN
        SELECT id INTO admin_user_id 
        FROM public.users 
        ORDER BY created_at 
        LIMIT 1;
    END IF;
    
    -- Update appointments that don't have created_by
    UPDATE public.appointments 
    SET created_by = COALESCE(created_by, admin_user_id)
    WHERE created_by IS NULL;
    
    -- Update appointments that were converted but don't have converted_by
    UPDATE public.appointments 
    SET converted_by = COALESCE(converted_by, assigned_to, created_by, admin_user_id)
    WHERE status = 'converted' AND converted_by IS NULL;
END $$;

-- Step 3: Generate user statistics for all existing users
DO $$
DECLARE
    user_record RECORD;
BEGIN
    -- Loop through all users and calculate their statistics
    FOR user_record IN SELECT id FROM public.users
    LOOP
        -- Call the update_user_statistics function for each user
        PERFORM public.update_user_statistics(user_record.id);
    END LOOP;
    
    RAISE NOTICE 'User statistics populated for all users';
END $$;

-- Step 4: Generate historical activity logs from existing data
-- Create activity logs for completed tickets
INSERT INTO public.user_activity_logs (user_id, activity_type, entity_type, entity_id, details, created_at)
SELECT 
    COALESCE(assigned_to, created_by) as user_id,
    'ticket_completed' as activity_type,
    'ticket' as entity_type,
    id as entity_id,
    jsonb_build_object(
        'ticket_number', ticket_number,
        'customer_id', customer_id,
        'device', device_brand || ' ' || device_model,
        'total_time_minutes', total_time_minutes
    ) as details,
    COALESCE(completed_at, updated_at) as created_at
FROM public.repair_tickets
WHERE status = 'completed' 
    AND (assigned_to IS NOT NULL OR created_by IS NOT NULL)
ON CONFLICT DO NOTHING;

-- Create activity logs for created tickets
INSERT INTO public.user_activity_logs (user_id, activity_type, entity_type, entity_id, details, created_at)
SELECT 
    created_by as user_id,
    'ticket_created' as activity_type,
    'ticket' as entity_type,
    id as entity_id,
    jsonb_build_object(
        'ticket_number', ticket_number,
        'customer_id', customer_id,
        'device', device_brand || ' ' || device_model
    ) as details,
    created_at
FROM public.repair_tickets
WHERE created_by IS NOT NULL
ON CONFLICT DO NOTHING;

-- Create activity logs for converted appointments
INSERT INTO public.user_activity_logs (user_id, activity_type, entity_type, entity_id, details, created_at)
SELECT 
    converted_by as user_id,
    'appointment_converted' as activity_type,
    'appointment' as entity_type,
    id as entity_id,
    jsonb_build_object(
        'customer_id', customer_id,
        'scheduled_date', scheduled_date,
        'scheduled_time', scheduled_time::text
    ) as details,
    updated_at as created_at
FROM public.appointments
WHERE status = 'converted' AND converted_by IS NOT NULL
ON CONFLICT DO NOTHING;

-- Create activity logs for notes
INSERT INTO public.user_activity_logs (user_id, activity_type, entity_type, entity_id, details, created_at)
SELECT 
    user_id,
    'note_created' as activity_type,
    'note' as entity_type,
    id as entity_id,
    jsonb_build_object(
        'ticket_id', ticket_id,
        'note_type', note_type,
        'is_important', is_important
    ) as details,
    created_at
FROM public.ticket_notes
WHERE user_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- Step 5: Update last_activity_at for all users based on their most recent activity
UPDATE public.user_statistics us
SET last_activity_at = (
    SELECT MAX(created_at)
    FROM public.user_activity_logs ual
    WHERE ual.user_id = us.user_id
)
WHERE EXISTS (
    SELECT 1 FROM public.user_activity_logs ual
    WHERE ual.user_id = us.user_id
);

-- Step 6: Calculate average completion time for users with completed tickets
UPDATE public.user_statistics us
SET avg_completion_time_hours = subquery.avg_time
FROM (
    SELECT 
        assigned_to,
        ROUND(AVG(total_time_minutes) / 60.0, 2) as avg_time
    FROM public.repair_tickets
    WHERE status = 'completed' 
        AND assigned_to IS NOT NULL 
        AND total_time_minutes > 0
    GROUP BY assigned_to
) AS subquery
WHERE us.user_id = subquery.assigned_to;

-- Step 7: Calculate conversion rate for users with appointments
UPDATE public.user_statistics us
SET conversion_rate = subquery.rate
FROM (
    SELECT 
        assigned_to,
        ROUND(
            CAST(COUNT(CASE WHEN status = 'converted' THEN 1 END) AS DECIMAL) / 
            NULLIF(COUNT(*), 0) * 100, 
            2
        ) as rate
    FROM public.appointments
    WHERE assigned_to IS NOT NULL
    GROUP BY assigned_to
) AS subquery
WHERE us.user_id = subquery.assigned_to;

-- Final step: Log the migration completion
DO $$
BEGIN
    RAISE NOTICE 'User statistics data population completed successfully';
    RAISE NOTICE 'Statistics generated for % users', (SELECT COUNT(*) FROM public.user_statistics);
    RAISE NOTICE 'Activity logs created: % entries', (SELECT COUNT(*) FROM public.user_activity_logs);
END $$;