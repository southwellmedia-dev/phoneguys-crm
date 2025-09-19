-- Fix the system admin email to use the correct domain
-- Update both the public users table and auth.users table

-- Update the public users table
UPDATE users
SET 
  email = 'info@phoneguysrepair.com',
  updated_at = NOW()
WHERE id = '11111111-1111-1111-1111-111111111111';

-- Update the auth.users table using the mapping
UPDATE auth.users
SET 
  email = 'info@phoneguysrepair.com',
  raw_user_meta_data = jsonb_set(
    COALESCE(raw_user_meta_data, '{}'::jsonb),
    '{full_name}',
    '"System Admin"'::jsonb,
    true
  ),
  updated_at = NOW()
WHERE id = '241d165f-cf6c-4836-97ae-8fe1152583d9';