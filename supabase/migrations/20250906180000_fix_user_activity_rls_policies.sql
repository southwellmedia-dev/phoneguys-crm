-- Fix RLS policies for user activity logging
-- This migration fixes the missing INSERT policies that were preventing
-- activity logging triggers from working properly

-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Users can view own activity logs" ON public.user_activity_logs;
DROP POLICY IF EXISTS "Admins and managers can view all activity logs" ON public.user_activity_logs;

-- Recreate view policies with better names
CREATE POLICY "Users can view own activity" ON public.user_activity_logs
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins and managers can view all activity" ON public.user_activity_logs
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = ANY(ARRAY['admin', 'manager'])
  )
);

-- Add missing INSERT policies for activity logging (with IF NOT EXISTS logic)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_activity_logs' 
        AND policyname = 'System can log user activity'
    ) THEN
        CREATE POLICY "System can log user activity" ON public.user_activity_logs
        FOR INSERT 
        TO authenticated, service_role
        WITH CHECK (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_activity_logs' 
        AND policyname = 'Users can log their own activity'
    ) THEN
        CREATE POLICY "Users can log their own activity" ON public.user_activity_logs
        FOR INSERT 
        TO authenticated
        WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

-- Check if user_statistics needs similar policies
DO $$
BEGIN
    -- Add INSERT/UPDATE policies for user_statistics if they don't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_statistics' 
        AND policyname = 'System can manage user statistics'
    ) THEN
        CREATE POLICY "System can manage user statistics" ON public.user_statistics
        FOR ALL
        TO service_role
        WITH CHECK (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_statistics' 
        AND policyname = 'Users can view own statistics'
    ) THEN
        CREATE POLICY "Users can view own statistics" ON public.user_statistics
        FOR SELECT
        TO authenticated
        USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_statistics' 
        AND policyname = 'Admins can view all statistics'
    ) THEN
        CREATE POLICY "Admins can view all statistics" ON public.user_statistics
        FOR SELECT
        TO authenticated
        USING (
            EXISTS (
                SELECT 1 FROM users 
                WHERE users.id = auth.uid() 
                AND users.role = ANY(ARRAY['admin', 'manager'])
            )
        );
    END IF;
END $$;

-- Add trigger to auto-update user statistics when activity is logged
-- This ensures statistics stay current without manual intervention
CREATE OR REPLACE FUNCTION public.trigger_update_user_stats_on_activity()
RETURNS TRIGGER AS $$
BEGIN
    -- Only update stats for certain activity types that affect metrics
    IF NEW.activity_type IN (
        'ticket_created', 'ticket_updated', 'ticket_completed', 
        'appointment_created', 'appointment_converted', 
        'note_created', 'time_logged'
    ) THEN
        -- Call the update function asynchronously if possible, or directly
        PERFORM update_user_statistics(NEW.user_id);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-update statistics on activity
DROP TRIGGER IF EXISTS auto_update_user_stats ON public.user_activity_logs;
CREATE TRIGGER auto_update_user_stats
    AFTER INSERT ON public.user_activity_logs
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_update_user_stats_on_activity();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated, service_role;
GRANT ALL ON public.user_activity_logs TO service_role;
GRANT SELECT, INSERT ON public.user_activity_logs TO authenticated;
GRANT ALL ON public.user_statistics TO service_role;
GRANT SELECT ON public.user_statistics TO authenticated;