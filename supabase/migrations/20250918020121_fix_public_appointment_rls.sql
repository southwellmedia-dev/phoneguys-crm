-- Fix RLS policies for public appointment creation
-- This allows the public API to create appointments and related records

-- 1. Fix notification_preferences RLS policy
-- Allow public API to insert notification preferences for new customers
DROP POLICY IF EXISTS "notification_preferences_insert_policy" ON notification_preferences;

CREATE POLICY "notification_preferences_insert_policy" ON notification_preferences
    FOR INSERT
    WITH CHECK (true);  -- Allow public inserts

-- Allow public API to update notification preferences 
DROP POLICY IF EXISTS "notification_preferences_update_policy" ON notification_preferences;

CREATE POLICY "notification_preferences_update_policy" ON notification_preferences
    FOR UPDATE
    USING (true)  -- Allow public updates
    WITH CHECK (true);

-- 2. Fix appointment_slots RLS policy (if it exists)
-- First check if the table exists and drop any restrictive policies
DO $$
BEGIN
    -- Check if appointment_slots table exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'appointment_slots') THEN
        -- Drop existing policies
        DROP POLICY IF EXISTS "appointment_slots_insert_policy" ON appointment_slots;
        DROP POLICY IF EXISTS "appointment_slots_select_policy" ON appointment_slots;
        DROP POLICY IF EXISTS "appointment_slots_update_policy" ON appointment_slots;
        
        -- Create new policies that allow public access
        CREATE POLICY "appointment_slots_insert_policy" ON appointment_slots
            FOR INSERT
            WITH CHECK (true);
            
        CREATE POLICY "appointment_slots_select_policy" ON appointment_slots
            FOR SELECT
            USING (true);
            
        CREATE POLICY "appointment_slots_update_policy" ON appointment_slots
            FOR UPDATE
            USING (true)
            WITH CHECK (true);
    END IF;
END
$$;

-- 3. Ensure appointments table allows public inserts from website source
DROP POLICY IF EXISTS "appointments_public_insert_policy" ON appointments;

CREATE POLICY "appointments_public_insert_policy" ON appointments
    FOR INSERT
    WITH CHECK (source = 'website');  -- Only allow website source appointments

-- 4. Ensure customers table allows public inserts
DROP POLICY IF EXISTS "customers_public_insert_policy" ON customers;

CREATE POLICY "customers_public_insert_policy" ON customers
    FOR INSERT
    WITH CHECK (true);  -- Allow public customer creation

-- 5. Ensure customer_devices table allows public inserts
DROP POLICY IF EXISTS "customer_devices_public_insert_policy" ON customer_devices;

CREATE POLICY "customer_devices_public_insert_policy" ON customer_devices
    FOR INSERT
    WITH CHECK (true);  -- Allow public device creation

-- 6. Ensure form_submissions table allows public inserts
DROP POLICY IF EXISTS "form_submissions_public_insert_policy" ON form_submissions;
DROP POLICY IF EXISTS "form_submissions_insert_policy" ON form_submissions;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON form_submissions;

CREATE POLICY "form_submissions_public_insert_policy" ON form_submissions
    FOR INSERT
    WITH CHECK (true);  -- Allow public form submission logging

-- Add comments for documentation
COMMENT ON POLICY "notification_preferences_insert_policy" ON notification_preferences IS 'Allows public API to store customer notification consent';
COMMENT ON POLICY "appointments_public_insert_policy" ON appointments IS 'Allows public API to create appointments from website forms';
COMMENT ON POLICY "customers_public_insert_policy" ON customers IS 'Allows public API to create customer records from website forms';
COMMENT ON POLICY "customer_devices_public_insert_policy" ON customer_devices IS 'Allows public API to create customer device records from website forms';
COMMENT ON POLICY "form_submissions_public_insert_policy" ON form_submissions IS 'Allows public API to log form submissions for analytics';