-- Add RLS policies for admin users to manage devices

-- Policy for admins to insert devices
CREATE POLICY "admins_can_insert_devices" ON "public"."devices"
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Policy for admins to update devices
CREATE POLICY "admins_can_update_devices" ON "public"."devices"
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Policy for admins to delete devices
CREATE POLICY "admins_can_delete_devices" ON "public"."devices"
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Also add similar policies for manufacturers table if needed
-- First, drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "authenticated_users_can_view_manufacturers" ON "public"."manufacturers";
DROP POLICY IF EXISTS "admins_can_insert_manufacturers" ON "public"."manufacturers";
DROP POLICY IF EXISTS "admins_can_update_manufacturers" ON "public"."manufacturers";

-- Enable RLS on manufacturers if not already enabled
ALTER TABLE public.manufacturers ENABLE ROW LEVEL SECURITY;

-- Policy for all authenticated users to view manufacturers
CREATE POLICY "authenticated_users_can_view_manufacturers" ON "public"."manufacturers"
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy for admins to insert manufacturers
CREATE POLICY "admins_can_insert_manufacturers" ON "public"."manufacturers"
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Policy for admins to update manufacturers
CREATE POLICY "admins_can_update_manufacturers" ON "public"."manufacturers"
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );