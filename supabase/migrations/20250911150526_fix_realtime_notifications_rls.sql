-- Fix RLS policies for internal_notifications to enable real-time subscriptions
-- Real-time subscriptions require SELECT policy to see the data

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Service role can insert notifications" ON internal_notifications;
DROP POLICY IF EXISTS "Service role full access" ON internal_notifications;

-- Allow users to see INSERT events for their own notifications (needed for real-time)
-- The existing SELECT policy already allows reading, but we need to ensure
-- the real-time subscription can see INSERT events
CREATE POLICY "Users can receive real-time notification inserts" 
ON internal_notifications FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Ensure service role has full access for creating notifications
CREATE POLICY "Service role full access" 
ON internal_notifications FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Enable real-time for the internal_notifications table if not already enabled
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'internal_notifications'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE internal_notifications;
    END IF;
END $$;

-- Also fix appointments table for real-time if needed
-- Check if appointments has proper RLS for real-time
DROP POLICY IF EXISTS "Service role appointments full access" ON appointments;

-- Ensure authenticated users can see appointment updates in real-time
-- This supplements existing policies
CREATE POLICY "Service role appointments full access" 
ON appointments FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Enable real-time for appointments if not already enabled
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'appointments'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE appointments;
    END IF;
END $$;