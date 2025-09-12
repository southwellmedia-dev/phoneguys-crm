-- Fix RLS policy to allow users to create notifications for others when it's comment-related
-- The previous policy was still too restrictive

-- Drop the existing INSERT policy
DROP POLICY IF EXISTS "Users can create mention notifications" ON internal_notifications;

-- Create a new policy that properly allows creating notifications for others
-- Key insight: We need to check the created_by field, not the user_id field
CREATE POLICY "Users can create comment notifications for others" 
ON internal_notifications 
FOR INSERT 
TO authenticated 
WITH CHECK (
  -- Allow if it's a comment-related notification AND created_by is the current user
  -- This allows the current user to create notifications for other users
  (
    type IN ('comment_mention', 'comment_reply', 'comment_added', 'comment_reaction')
    AND created_by = auth.uid()
  )
  OR
  -- Users can still create notifications for themselves (backward compatibility)
  (user_id = auth.uid())
);