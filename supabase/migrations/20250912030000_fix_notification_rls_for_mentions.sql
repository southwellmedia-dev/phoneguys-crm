-- Fix RLS policy for internal_notifications to allow mention notifications
-- This allows users to create notifications for others when mentioning them in comments

-- Drop the existing restrictive INSERT policy
DROP POLICY IF EXISTS "Users can receive real-time notification inserts" ON internal_notifications;

-- Create a new policy that allows users to create notifications for mentions
-- This allows users to create notifications for others when the type is COMMENT_MENTION or COMMENT_REPLY
CREATE POLICY "Users can create mention notifications" 
ON internal_notifications 
FOR INSERT 
TO authenticated 
WITH CHECK (
  -- Allow users to create notifications for others if it's a comment-related notification
  -- This includes mentions, replies, and new comments on entities
  (type IN ('comment_mention', 'comment_reply', 'comment_new'))
  OR
  -- Users can still create notifications for themselves for other types
  (user_id = auth.uid())
);

-- Ensure the SELECT policy still exists (users can only view their own)
-- This should already exist but let's make sure
DROP POLICY IF EXISTS "Notifications viewable by recipient" ON internal_notifications;
CREATE POLICY "Notifications viewable by recipient" 
ON internal_notifications 
FOR SELECT 
TO authenticated 
USING (user_id = auth.uid());

-- Ensure the UPDATE policy still exists (users can only update their own)
DROP POLICY IF EXISTS "Notifications updatable by recipient" ON internal_notifications;
CREATE POLICY "Notifications updatable by recipient" 
ON internal_notifications 
FOR UPDATE 
TO authenticated 
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Keep service role full access
-- This policy should already exist
DROP POLICY IF EXISTS "Service role full access" ON internal_notifications;
CREATE POLICY "Service role full access" 
ON internal_notifications 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);