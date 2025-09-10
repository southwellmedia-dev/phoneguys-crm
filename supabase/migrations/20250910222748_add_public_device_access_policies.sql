-- Add public read access to devices and manufacturers tables
-- This allows the public website to fetch device information without authentication

-- Enable RLS on tables if not already enabled
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manufacturers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointment_slots ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Public can view active devices" ON public.devices;
DROP POLICY IF EXISTS "Public can view manufacturers" ON public.manufacturers;
DROP POLICY IF EXISTS "Public can view available appointment slots" ON public.appointment_slots;

-- Allow anonymous users to view active devices
CREATE POLICY "Public can view active devices"
ON public.devices FOR SELECT
TO anon
USING (is_active = true);

-- Allow anonymous users to view all manufacturers
CREATE POLICY "Public can view manufacturers"
ON public.manufacturers FOR SELECT
TO anon
USING (true);

-- Allow anonymous users to view available appointment slots
CREATE POLICY "Public can view available appointment slots"
ON public.appointment_slots FOR SELECT
TO anon
USING (
  is_available = true 
  AND date >= CURRENT_DATE
);

-- Also need policies for creating appointments and related data from public forms
-- These already exist for form_submissions, but we need them for other tables

-- Allow anonymous users to create customers (for appointment booking)
DROP POLICY IF EXISTS "Public can create customers" ON public.customers;
CREATE POLICY "Public can create customers"
ON public.customers FOR INSERT
TO anon
WITH CHECK (true);

-- Allow anonymous users to create customer devices (for appointment booking)
DROP POLICY IF EXISTS "Public can create customer devices" ON public.customer_devices;
CREATE POLICY "Public can create customer devices"
ON public.customer_devices FOR INSERT
TO anon
WITH CHECK (true);

-- Allow anonymous users to create appointments
DROP POLICY IF EXISTS "Public can create appointments" ON public.appointments;
CREATE POLICY "Public can create appointments"
ON public.appointments FOR INSERT
TO anon
WITH CHECK (source = 'website');

-- Allow anonymous users to update appointment slots (to reserve them)
DROP POLICY IF EXISTS "Public can reserve appointment slots" ON public.appointment_slots;
CREATE POLICY "Public can reserve appointment slots"
ON public.appointment_slots FOR UPDATE
TO anon
USING (is_available = true)
WITH CHECK (is_available = false);

-- Allow public to check for existing customers by email (for duplicate prevention)
DROP POLICY IF EXISTS "Public can check customer emails" ON public.customers;
CREATE POLICY "Public can check customer emails"
ON public.customers FOR SELECT
TO anon
USING (true);

-- Allow public to view customer devices (for checking duplicates)
DROP POLICY IF EXISTS "Public can view customer devices" ON public.customer_devices;
CREATE POLICY "Public can view customer devices"
ON public.customer_devices FOR SELECT
TO anon
USING (true);

-- Grant necessary permissions to anon role for tables
GRANT SELECT ON public.devices TO anon;
GRANT SELECT ON public.manufacturers TO anon;
GRANT SELECT ON public.appointment_slots TO anon;
GRANT SELECT, INSERT ON public.customers TO anon;
GRANT SELECT, INSERT ON public.customer_devices TO anon;
GRANT INSERT ON public.appointments TO anon;
GRANT UPDATE ON public.appointment_slots TO anon;

-- Also grant access to the repair_tickets table for counting popular devices
GRANT SELECT ON public.repair_tickets TO anon;