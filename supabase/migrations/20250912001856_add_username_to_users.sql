-- Add username field to users table for @mentions functionality

-- Add username column to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS username VARCHAR(50) UNIQUE;

-- Create index for fast username lookups
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Function to generate username from full_name or email
CREATE OR REPLACE FUNCTION generate_username(full_name TEXT, email TEXT)
RETURNS TEXT AS $$
DECLARE
  base_username TEXT;
  final_username TEXT;
  counter INTEGER := 0;
BEGIN
  -- Try to generate from full_name first
  IF full_name IS NOT NULL AND full_name != '' THEN
    -- Extract first letter of first name + last name
    -- e.g., "John Doe" -> "jdoe"
    base_username := LOWER(
      SUBSTRING(SPLIT_PART(full_name, ' ', 1) FROM 1 FOR 1) || 
      COALESCE(SPLIT_PART(full_name, ' ', 2), SPLIT_PART(full_name, ' ', 1))
    );
  ELSE
    -- Fall back to email prefix
    base_username := LOWER(SPLIT_PART(email, '@', 1));
  END IF;
  
  -- Remove any non-alphanumeric characters
  base_username := REGEXP_REPLACE(base_username, '[^a-z0-9]', '', 'g');
  
  -- Ensure we have something
  IF base_username = '' OR base_username IS NULL THEN
    base_username := 'user';
  END IF;
  
  -- Check for uniqueness and add number if needed
  final_username := base_username;
  WHILE EXISTS (SELECT 1 FROM users WHERE username = final_username) LOOP
    counter := counter + 1;
    final_username := base_username || counter;
  END LOOP;
  
  RETURN final_username;
END;
$$ LANGUAGE plpgsql;

-- Generate usernames for existing users
UPDATE users 
SET username = generate_username(full_name, email)
WHERE username IS NULL;

-- Make username required for future inserts
ALTER TABLE users 
ALTER COLUMN username SET NOT NULL;

-- Create a trigger to auto-generate username for new users if not provided
CREATE OR REPLACE FUNCTION auto_generate_username()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.username IS NULL OR NEW.username = '' THEN
    NEW.username := generate_username(NEW.full_name, NEW.email);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_generate_username_trigger
  BEFORE INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_username();

-- Add function to search users by username for mentions
CREATE OR REPLACE FUNCTION search_users_by_username(search_query TEXT)
RETURNS TABLE (
  id UUID,
  username VARCHAR,
  full_name TEXT,
  email TEXT,
  avatar_url TEXT,
  role TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.username,
    u.full_name,
    u.email,
    u.avatar_url,
    u.role
  FROM users u
  WHERE 
    u.username ILIKE search_query || '%'
    OR u.full_name ILIKE '%' || search_query || '%'
  ORDER BY 
    CASE 
      WHEN u.username ILIKE search_query || '%' THEN 0
      ELSE 1
    END,
    u.username
  LIMIT 10;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission on the search function
GRANT EXECUTE ON FUNCTION search_users_by_username(TEXT) TO authenticated;