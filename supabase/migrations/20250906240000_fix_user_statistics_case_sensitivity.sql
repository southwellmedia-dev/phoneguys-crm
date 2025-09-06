-- Fix user statistics calculation to handle uppercase status values
-- and include NEW tickets in workload

CREATE OR REPLACE FUNCTION public.update_user_statistics(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
    -- Insert or update basic statistics
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
        appointments_cancelled,
        appointments_no_show,
        notes_created,
        total_time_logged_minutes,
        stats_updated_at
    )
    SELECT 
        p_user_id,
        (SELECT COUNT(*) FROM public.repair_tickets WHERE created_by = p_user_id),
        (SELECT COUNT(*) FROM public.repair_tickets WHERE assigned_to = p_user_id),
        (SELECT COUNT(*) FROM public.repair_tickets WHERE assigned_to = p_user_id AND UPPER(status) = 'COMPLETED'),
        -- Include both NEW and IN_PROGRESS tickets in workload
        (SELECT COUNT(*) FROM public.repair_tickets WHERE assigned_to = p_user_id AND UPPER(status) IN ('NEW', 'IN_PROGRESS')),
        (SELECT COUNT(*) FROM public.repair_tickets WHERE assigned_to = p_user_id AND UPPER(status) = 'CANCELLED'),
        (SELECT COUNT(*) FROM public.repair_tickets WHERE assigned_to = p_user_id AND UPPER(status) = 'ON_HOLD'),
        (SELECT COUNT(*) FROM public.appointments WHERE created_by = p_user_id),
        (SELECT COUNT(*) FROM public.appointments WHERE assigned_to = p_user_id),
        (SELECT COUNT(*) FROM public.appointments WHERE assigned_to = p_user_id AND converted_to_ticket_id IS NOT NULL),
        (SELECT COUNT(*) FROM public.appointments WHERE assigned_to = p_user_id AND UPPER(status::text) = 'CANCELLED'),
        (SELECT COUNT(*) FROM public.appointments WHERE assigned_to = p_user_id AND UPPER(status::text) = 'NO_SHOW'),
        (SELECT COUNT(*) FROM public.ticket_notes WHERE user_id = p_user_id),
        COALESCE((SELECT SUM(total_time_minutes) FROM public.repair_tickets WHERE assigned_to = p_user_id), 0),
        NOW()
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
        appointments_cancelled = EXCLUDED.appointments_cancelled,
        appointments_no_show = EXCLUDED.appointments_no_show,
        notes_created = EXCLUDED.notes_created,
        total_time_logged_minutes = EXCLUDED.total_time_logged_minutes,
        stats_updated_at = NOW();

    -- Update calculated fields separately to avoid division by zero
    UPDATE public.user_statistics
    SET 
        -- Calculate average completion time based on ACTUAL LOGGED TIME (not elapsed time)
        -- Convert minutes to hours for display
        avg_completion_time_hours = (
            SELECT 
                CASE 
                    WHEN COUNT(*) > 0 THEN (AVG(total_time_minutes) / 60.0)::DECIMAL(10,2)
                    ELSE 0
                END
            FROM public.repair_tickets
            WHERE assigned_to = p_user_id
                AND UPPER(status) = 'COMPLETED'
                AND total_time_minutes IS NOT NULL
                AND total_time_minutes > 0
        ),
        
        -- Calculate conversion rate as percentage
        conversion_rate = CASE 
            WHEN (SELECT COUNT(*) FROM public.appointments WHERE assigned_to = p_user_id) > 0
            THEN ((SELECT COUNT(*) FROM public.appointments WHERE assigned_to = p_user_id AND converted_to_ticket_id IS NOT NULL)::DECIMAL 
                  / (SELECT COUNT(*) FROM public.appointments WHERE assigned_to = p_user_id) * 100)::INTEGER
            ELSE 0
        END,
        
        -- Calculate daily average (tickets completed per day since user created)
        daily_completion_avg = CASE
            WHEN (SELECT EXTRACT(EPOCH FROM (NOW() - created_at))/86400 FROM public.users WHERE id = p_user_id) > 0
            THEN ((SELECT COUNT(*) FROM public.repair_tickets WHERE assigned_to = p_user_id AND UPPER(status) = 'COMPLETED')::DECIMAL 
                  / GREATEST(1, (SELECT EXTRACT(EPOCH FROM (NOW() - created_at))/86400 FROM public.users WHERE id = p_user_id)::INTEGER))::DECIMAL(10,2)
            ELSE 0
        END,
        
        updated_at = NOW()
    WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recalculate all user statistics with the fixed function
DO $$
DECLARE
    user_record RECORD;
    stats_count INTEGER := 0;
BEGIN
    FOR user_record IN SELECT id, email FROM public.users
    LOOP
        PERFORM public.update_user_statistics(user_record.id);
        stats_count := stats_count + 1;
    END LOOP;
    
    RAISE NOTICE 'Updated statistics for % users', stats_count;
    
    -- Log a sample of the statistics for verification
    FOR user_record IN 
        SELECT 
            u.email,
            us.tickets_assigned,
            us.tickets_completed,
            us.tickets_in_progress,
            us.avg_completion_time_hours,
            us.total_time_logged_minutes
        FROM public.users u
        JOIN public.user_statistics us ON u.id = us.user_id
        WHERE u.email = 'admin@phoneguys.com'
        LIMIT 1
    LOOP
        RAISE NOTICE 'Admin stats - Assigned: %, Completed: %, In Progress: %, Avg Time: %h, Total Time: %m',
            user_record.tickets_assigned,
            user_record.tickets_completed,
            user_record.tickets_in_progress,
            user_record.avg_completion_time_hours,
            user_record.total_time_logged_minutes;
    END LOOP;
END $$;