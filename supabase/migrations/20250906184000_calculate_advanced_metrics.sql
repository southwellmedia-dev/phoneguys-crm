-- Update the user statistics function to calculate advanced metrics
-- This includes average completion time, conversion rate, and daily averages

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
        appointments_no_show,
        appointments_cancelled,
        notes_created,
        total_time_logged_minutes,
        last_activity_at,
        stats_updated_at
    )
    SELECT
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
        (SELECT MAX(created_at) FROM public.user_activity_logs WHERE user_id = p_user_id),
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
        appointments_no_show = EXCLUDED.appointments_no_show,
        appointments_cancelled = EXCLUDED.appointments_cancelled,
        notes_created = EXCLUDED.notes_created,
        total_time_logged_minutes = EXCLUDED.total_time_logged_minutes,
        last_activity_at = EXCLUDED.last_activity_at,
        stats_updated_at = EXCLUDED.stats_updated_at;

    -- Calculate and update advanced metrics
    UPDATE public.user_statistics
    SET
        -- Calculate average completion time in hours
        avg_completion_time_hours = (
            SELECT AVG(EXTRACT(EPOCH FROM (completed_at - created_at)) / 3600)::DECIMAL(10,2)
            FROM public.repair_tickets
            WHERE assigned_to = p_user_id
                AND status = 'completed'
                AND completed_at IS NOT NULL
        ),
        -- Calculate conversion rate (appointments to tickets)
        conversion_rate = CASE
            WHEN appointments_assigned > 0 THEN
                (appointments_converted::DECIMAL / appointments_assigned * 100)::DECIMAL(5,2)
            ELSE NULL
        END,
        -- Calculate daily completion average (last 30 days)
        daily_completion_avg = (
            SELECT (COUNT(*)::DECIMAL / GREATEST(COUNT(DISTINCT DATE(completed_at)), 1))::DECIMAL(10,2)
            FROM public.repair_tickets
            WHERE assigned_to = p_user_id
                AND status = 'completed'
                AND completed_at >= NOW() - INTERVAL '30 days'
        ),
        -- Calculate weekly completion average (last 12 weeks)
        weekly_completion_avg = (
            SELECT (COUNT(*)::DECIMAL / GREATEST(COUNT(DISTINCT DATE_TRUNC('week', completed_at)), 1))::DECIMAL(10,2)
            FROM public.repair_tickets
            WHERE assigned_to = p_user_id
                AND status = 'completed'
                AND completed_at >= NOW() - INTERVAL '12 weeks'
        ),
        -- Calculate monthly completion average (last 12 months)
        monthly_completion_avg = (
            SELECT (COUNT(*)::DECIMAL / GREATEST(COUNT(DISTINCT DATE_TRUNC('month', completed_at)), 1))::DECIMAL(10,2)
            FROM public.repair_tickets
            WHERE assigned_to = p_user_id
                AND status = 'completed'
                AND completed_at >= NOW() - INTERVAL '12 months'
        )
    WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update completed_at for existing completed tickets if missing
UPDATE public.repair_tickets
SET completed_at = updated_at
WHERE status = 'completed' AND completed_at IS NULL;

-- Now recalculate statistics for all users to get the advanced metrics
DO $$
DECLARE
    user_record RECORD;
BEGIN
    FOR user_record IN SELECT id FROM public.users
    LOOP
        PERFORM update_user_statistics(user_record.id);
    END LOOP;
END $$;