-- Add INSERT and UPDATE policies for customer_devices table

-- Allow authenticated users to insert customer devices
CREATE POLICY "Authenticated users can insert customer_devices" 
ON "public"."customer_devices" 
FOR INSERT 
TO "authenticated" 
WITH CHECK (true);

-- Allow authenticated users to update customer devices
CREATE POLICY "Authenticated users can update customer_devices" 
ON "public"."customer_devices" 
FOR UPDATE 
TO "authenticated" 
USING (true)
WITH CHECK (true);

-- Note: In production, you might want more restrictive policies like:
-- WITH CHECK (auth.uid() IN (SELECT id FROM users WHERE role IN ('admin', 'manager', 'technician')))
-- or
-- WITH CHECK (customer_id IN (SELECT id FROM customers WHERE created_by = auth.uid()))