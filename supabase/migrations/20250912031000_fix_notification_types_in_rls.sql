-- Fix the notification types in RLS policy to match actual enum values
-- The previous migration used 'comment_new' but the actual enum is 'comment_added'

-- Drop and recreate the INSERT policy with correct enum values
DROP POLICY IF EXISTS "Users can create mention notifications" ON internal_notifications;

CREATE POLICY "Users can create mention notifications" 
ON internal_notifications 
FOR INSERT 
TO authenticated 
WITH CHECK (
  -- Allow users to create notifications for others if it's a comment-related notification
  -- Using the actual enum values from InternalNotificationType
  (type IN ('comment_mention', 'comment_reply', 'comment_added', 'comment_reaction'))
  OR
  -- Users can still create notifications for themselves for other types
  (user_id = auth.uid())
);