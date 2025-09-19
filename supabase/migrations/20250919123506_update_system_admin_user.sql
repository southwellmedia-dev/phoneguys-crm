-- Update the admin user to be more appropriate for system-generated activities
-- This user is used for automated processes like website form submissions

UPDATE users
SET 
  full_name = 'System Admin',
  email = 'info@phoneguys.com',
  updated_at = NOW()
WHERE id = '11111111-1111-1111-1111-111111111111';

-- Note: This user doesn't exist in auth.users as it's a system user that doesn't need authentication
-- It's only used for tracking system-generated activities in the activity log