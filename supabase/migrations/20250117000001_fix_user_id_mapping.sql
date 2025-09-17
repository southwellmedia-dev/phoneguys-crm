-- Create user_id_mapping table to handle auth user ID to app user ID mapping
CREATE TABLE IF NOT EXISTS user_id_mapping (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_user_id UUID NOT NULL UNIQUE,
  app_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_mapping UNIQUE(auth_user_id, app_user_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_id_mapping_auth ON user_id_mapping(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_user_id_mapping_app ON user_id_mapping(app_user_id);

-- Enable RLS
ALTER TABLE user_id_mapping ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read their own mapping
CREATE POLICY "Users can read own mapping" ON user_id_mapping
  FOR SELECT USING (auth.uid() = auth_user_id);

-- Service role has full access
CREATE POLICY "Service role has full access" ON user_id_mapping
  FOR ALL USING (auth.role() = 'service_role');

-- Create mappings for existing users where auth ID matches app ID
INSERT INTO user_id_mapping (auth_user_id, app_user_id)
SELECT id, id FROM users
WHERE id IN (
  SELECT id FROM auth.users
)
ON CONFLICT DO NOTHING;

-- For users where IDs don't match, create mappings based on email
INSERT INTO user_id_mapping (auth_user_id, app_user_id)
SELECT 
  au.id as auth_user_id,
  u.id as app_user_id
FROM auth.users au
INNER JOIN users u ON u.email = au.email
WHERE NOT EXISTS (
  SELECT 1 FROM user_id_mapping um 
  WHERE um.auth_user_id = au.id
)
ON CONFLICT DO NOTHING;