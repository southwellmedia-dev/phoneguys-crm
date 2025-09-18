-- Fix form_submissions table RLS policy for public API access

-- Drop any existing restrictive policies
DROP POLICY IF EXISTS "form_submissions_public_insert_policy" ON form_submissions;
DROP POLICY IF EXISTS "form_submissions_insert_policy" ON form_submissions;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON form_submissions;
DROP POLICY IF EXISTS "Users can insert their own form_submissions" ON form_submissions;

-- Create new policy that allows public inserts
CREATE POLICY "form_submissions_public_insert_policy" ON form_submissions
    FOR INSERT
    WITH CHECK (true);

-- Add comment for documentation
COMMENT ON POLICY "form_submissions_public_insert_policy" ON form_submissions IS 'Allows public API to log form submissions for analytics and debugging';