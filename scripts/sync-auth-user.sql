-- Script to sync authenticated user with users table
-- Run this in Supabase SQL Editor after logging in with your test account

-- First, check if the authenticated user exists in the users table
DO $$
DECLARE
    auth_user_id uuid;
    auth_user_email text;
BEGIN
    -- Get the current auth user (you need to be logged in)
    -- In Supabase Studio, this will be the user you're logged in as
    SELECT id, email INTO auth_user_id, auth_user_email
    FROM auth.users
    WHERE email = 'admin@phoneguys.com'
    LIMIT 1;
    
    IF auth_user_id IS NOT NULL THEN
        -- Check if user exists in users table
        IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = auth_user_id) THEN
            -- Insert the user with the auth UUID
            INSERT INTO public.users (id, email, full_name, role)
            VALUES (auth_user_id, auth_user_email, 'Admin User', 'admin')
            ON CONFLICT (id) DO UPDATE
            SET email = EXCLUDED.email,
                full_name = EXCLUDED.full_name,
                role = EXCLUDED.role;
            
            RAISE NOTICE 'User synchronized: %', auth_user_email;
        ELSE
            RAISE NOTICE 'User already exists: %', auth_user_email;
        END IF;
    ELSE
        RAISE NOTICE 'No auth user found with email admin@phoneguys.com';
    END IF;
END $$;

-- Alternative: Update the existing seed user to use the auth user's ID
-- This is useful if you want to keep the seed data but use the actual auth user ID
-- Run this after creating an auth user with email admin@phoneguys.com

-- UPDATE public.users 
-- SET id = (SELECT id FROM auth.users WHERE email = 'admin@phoneguys.com' LIMIT 1)
-- WHERE email = 'admin@phoneguys.com';