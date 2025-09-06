-- Migration to sync auth users with users table
-- This creates a function that automatically creates a user record when someone signs up

-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Check if user already exists with this email
  IF EXISTS (SELECT 1 FROM public.users WHERE email = NEW.email) THEN
    -- Update existing user to use the auth user's ID
    -- Note: This only works if there are no foreign key constraints
    -- Otherwise, just skip and let the app handle it
    RETURN NEW;
  ELSE
    -- Insert new user
    INSERT INTO public.users (id, email, full_name, role)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
      COALESCE(NEW.raw_user_meta_data->>'role', 'technician')
    )
    ON CONFLICT (id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create user record on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Sync existing auth users with users table
-- This will create user records for any auth users that don't have them
INSERT INTO public.users (id, email, full_name, role)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'full_name', split_part(au.email, '@', 1)),
  'technician'
FROM auth.users au
LEFT JOIN public.users u ON au.id = u.id
WHERE u.id IS NULL
ON CONFLICT (email) DO NOTHING;

-- For existing users with mismatched IDs, we need a mapping table
-- This is a workaround for when seed data uses different IDs than auth
CREATE TABLE IF NOT EXISTS public.user_id_mapping (
  auth_user_id UUID PRIMARY KEY,
  app_user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create an index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_id_mapping_app_user_id 
ON public.user_id_mapping(app_user_id);