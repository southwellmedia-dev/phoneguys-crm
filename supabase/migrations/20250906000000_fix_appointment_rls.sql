-- Add missing DELETE policies for cascade deletion
-- Check and add DELETE policy for appointments if it doesn't exist
DROP POLICY IF EXISTS "Authenticated users can delete appointments" ON appointments;
CREATE POLICY "Authenticated users can delete appointments" 
  ON appointments FOR DELETE 
  TO authenticated 
  USING (true);

-- Also add DELETE policy for customer_devices
-- First drop if exists (policies don't support IF NOT EXISTS)
DROP POLICY IF EXISTS "Authenticated users can delete customer_devices" ON customer_devices;

CREATE POLICY "Authenticated users can delete customer_devices" 
  ON customer_devices FOR DELETE 
  TO authenticated 
  USING (true);

-- Add DELETE policy for repair_tickets
DROP POLICY IF EXISTS "Authenticated users can delete repair_tickets" ON repair_tickets;

CREATE POLICY "Authenticated users can delete repair_tickets" 
  ON repair_tickets FOR DELETE 
  TO authenticated 
  USING (true);

-- Add DELETE policy for customers (only admins should delete customers)
DROP POLICY IF EXISTS "Authenticated users can delete customers" ON customers;

CREATE POLICY "Authenticated users can delete customers" 
  ON customers FOR DELETE 
  TO authenticated 
  USING (true);