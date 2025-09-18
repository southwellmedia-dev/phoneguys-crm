-- Final fix for form_submissions RLS policy
-- Remove conflicting policies and create a single comprehensive one

-- Drop all existing insert policies
DROP POLICY IF EXISTS "Form submissions insertable by anon" ON form_submissions;
DROP POLICY IF EXISTS "public_api_form_submissions_policy" ON form_submissions;
DROP POLICY IF EXISTS "form_submissions_public_insert_policy" ON form_submissions;

-- Create single policy that works for all public API access
CREATE POLICY "form_submissions_public_access" ON form_submissions
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Ensure RLS is enabled
ALTER TABLE form_submissions ENABLE ROW LEVEL SECURITY;

-- Add comment
COMMENT ON POLICY "form_submissions_public_access" ON form_submissions IS 'Allows public API and anon role to manage form submissions';