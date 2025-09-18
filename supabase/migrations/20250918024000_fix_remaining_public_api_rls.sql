-- Fix remaining RLS issues for public API access
-- This allows public appointment forms to store customer preferences and form submissions

-- 1. Fix notification_preferences - clean up conflicting policies and create simple ones
DROP POLICY IF EXISTS "notification_preferences_insert_policy" ON notification_preferences;
DROP POLICY IF EXISTS "notification_preferences_update_policy" ON notification_preferences;

-- Create comprehensive policy for public API
CREATE POLICY "public_api_notification_preferences_policy" ON notification_preferences
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- 2. Fix form_submissions - ensure public API can log submissions
DROP POLICY IF EXISTS "form_submissions_public_insert_policy" ON form_submissions;

CREATE POLICY "public_api_form_submissions_policy" ON form_submissions
    FOR INSERT
    WITH CHECK (true);

-- Add comments for documentation
COMMENT ON POLICY "public_api_notification_preferences_policy" ON notification_preferences IS 'Allows public API to manage customer notification preferences for appointment forms';
COMMENT ON POLICY "public_api_form_submissions_policy" ON form_submissions IS 'Allows public API to log form submissions for analytics and debugging';