-- Fix user statistics population with proper data assignment
-- This ensures the statistics match what was shown during development

-- Step 1: Properly assign created_by based on assigned_to for existing tickets
DO $$
DECLARE
    admin_user_id UUID;
    updated_count INTEGER;
BEGIN
    -- Get the admin user ID
    SELECT id INTO admin_user_id 
    FROM public.users 
    WHERE id = '11111111-1111-1111-1111-111111111111'
    LIMIT 1;
    
    IF admin_user_id IS NULL THEN
        -- Fallback to any admin
        SELECT id INTO admin_user_id 
        FROM public.users 
        WHERE role = 'admin' 
        ORDER BY created_at 
        LIMIT 1;
    END IF;
    
    -- For tickets that have assigned_to but no created_by, use assigned_to as created_by
    UPDATE public.repair_tickets 
    SET created_by = COALESCE(created_by, assigned_to, admin_user_id)
    WHERE created_by IS NULL AND assigned_to IS NOT NULL;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    IF updated_count > 0 THEN
        RAISE NOTICE 'Updated created_by for % tickets using assigned_to', updated_count;
    END IF;
    
    -- For remaining tickets without created_by, assign to admin
    UPDATE public.repair_tickets 
    SET created_by = admin_user_id
    WHERE created_by IS NULL AND admin_user_id IS NOT NULL;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    IF updated_count > 0 THEN
        RAISE NOTICE 'Updated created_by for % remaining tickets to admin', updated_count;
    END IF;
END $$;

-- Step 2: Fix appointments created_by and converted_by
DO $$
DECLARE
    admin_user_id UUID;
    updated_count INTEGER;
BEGIN
    -- Get the admin user ID
    SELECT id INTO admin_user_id 
    FROM public.users 
    WHERE id = '11111111-1111-1111-1111-111111111111'
    LIMIT 1;
    
    -- Update appointments created_by
    UPDATE public.appointments 
    SET created_by = COALESCE(created_by, assigned_to, admin_user_id)
    WHERE created_by IS NULL;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    IF updated_count > 0 THEN
        RAISE NOTICE 'Updated created_by for % appointments', updated_count;
    END IF;
    
    -- Fix converted_by for converted appointments
    UPDATE public.appointments 
    SET converted_by = COALESCE(converted_by, assigned_to, created_by, admin_user_id)
    WHERE status = 'converted' AND converted_by IS NULL;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    IF updated_count > 0 THEN
        RAISE NOTICE 'Updated converted_by for % appointments', updated_count;
    END IF;
END $$;

-- Step 3: Recalculate all user statistics with the corrected data
DO $$
DECLARE
    user_record RECORD;
    stats_record RECORD;
BEGIN
    -- Clear existing statistics to recalculate fresh
    DELETE FROM public.user_statistics;
    
    -- Recalculate for all users
    FOR user_record IN SELECT id, email FROM public.users ORDER BY created_at
    LOOP
        PERFORM public.update_user_statistics(user_record.id);
        
        -- Get the stats for this user
        SELECT 
            tickets_assigned,
            tickets_completed,
            tickets_in_progress,
            total_time_logged_minutes,
            notes_created
        INTO stats_record
        FROM public.user_statistics
        WHERE user_id = user_record.id;
        
        IF stats_record IS NOT NULL AND 
           (stats_record.tickets_assigned > 0 OR 
            stats_record.notes_created > 0 OR 
            stats_record.total_time_logged_minutes > 0) THEN
            RAISE NOTICE 'User % - Assigned: %, Completed: %, In Progress: %, Time: % min, Notes: %', 
                user_record.email,
                COALESCE(stats_record.tickets_assigned, 0),
                COALESCE(stats_record.tickets_completed, 0),
                COALESCE(stats_record.tickets_in_progress, 0),
                COALESCE(stats_record.total_time_logged_minutes, 0),
                COALESCE(stats_record.notes_created, 0);
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Statistics recalculation completed';
END $$;

-- Step 4: Generate activity logs for historical data
DO $$
DECLARE
    log_count INTEGER;
BEGIN
    -- Clear existing activity logs to regenerate
    DELETE FROM public.user_activity_logs 
    WHERE activity_type IN ('ticket_created', 'ticket_completed', 'appointment_converted', 'note_created');
    
    -- Create activity logs for ticket creation
    INSERT INTO public.user_activity_logs (user_id, activity_type, entity_type, entity_id, details, created_at)
    SELECT 
        created_by as user_id,
        'ticket_created' as activity_type,
        'ticket' as entity_type,
        id as entity_id,
        jsonb_build_object(
            'ticket_number', ticket_number,
            'customer_id', customer_id,
            'device', device_brand || ' ' || device_model,
            'status', status
        ) as details,
        created_at
    FROM public.repair_tickets
    WHERE created_by IS NOT NULL
    ON CONFLICT DO NOTHING;
    
    GET DIAGNOSTICS log_count = ROW_COUNT;
    RAISE NOTICE 'Created % ticket creation logs', log_count;
    
    -- Create activity logs for completed tickets
    INSERT INTO public.user_activity_logs (user_id, activity_type, entity_type, entity_id, details, created_at)
    SELECT 
        assigned_to as user_id,
        'ticket_completed' as activity_type,
        'ticket' as entity_type,
        id as entity_id,
        jsonb_build_object(
            'ticket_number', ticket_number,
            'customer_id', customer_id,
            'device', device_brand || ' ' || device_model,
            'total_time_minutes', total_time_minutes,
            'actual_cost', actual_cost
        ) as details,
        COALESCE(completed_at, updated_at) as created_at
    FROM public.repair_tickets
    WHERE status = 'completed' AND assigned_to IS NOT NULL
    ON CONFLICT DO NOTHING;
    
    GET DIAGNOSTICS log_count = ROW_COUNT;
    RAISE NOTICE 'Created % ticket completion logs', log_count;
    
    -- Update last_activity_at
    UPDATE public.user_statistics us
    SET last_activity_at = (
        SELECT MAX(created_at)
        FROM public.user_activity_logs ual
        WHERE ual.user_id = us.user_id
    );
END $$;

-- Step 5: Final verification
DO $$
DECLARE
    admin_stats RECORD;
BEGIN
    -- Get admin user statistics for verification
    SELECT 
        u.email,
        s.*
    INTO admin_stats
    FROM public.users u
    JOIN public.user_statistics s ON u.id = s.user_id
    WHERE u.id = '11111111-1111-1111-1111-111111111111';
    
    IF admin_stats IS NOT NULL THEN
        RAISE NOTICE '====================================';
        RAISE NOTICE 'Admin User Statistics Summary:';
        RAISE NOTICE 'Email: %', admin_stats.email;
        RAISE NOTICE 'Tickets Created: %', admin_stats.tickets_created;
        RAISE NOTICE 'Tickets Assigned: %', admin_stats.tickets_assigned;
        RAISE NOTICE 'Tickets Completed: %', admin_stats.tickets_completed;
        RAISE NOTICE 'Tickets In Progress: %', admin_stats.tickets_in_progress;
        RAISE NOTICE 'Total Time Logged: % minutes', admin_stats.total_time_logged_minutes;
        RAISE NOTICE 'Notes Created: %', admin_stats.notes_created;
        RAISE NOTICE '====================================';
    END IF;
    
    -- Overall summary
    RAISE NOTICE 'Total users with statistics: %', (SELECT COUNT(*) FROM public.user_statistics);
    RAISE NOTICE 'Total activity logs: %', (SELECT COUNT(*) FROM public.user_activity_logs);
END $$;