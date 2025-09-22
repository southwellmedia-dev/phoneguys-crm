-- Fix permissions for public users to access and generate appointment slots
-- This migration ensures the public API can work with appointment slots

-- 1. Enable RLS on appointment_slots if not already enabled
ALTER TABLE appointment_slots ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing restrictive policies
DROP POLICY IF EXISTS "appointment_slots_insert_policy" ON appointment_slots;
DROP POLICY IF EXISTS "appointment_slots_select_policy" ON appointment_slots;
DROP POLICY IF EXISTS "appointment_slots_update_policy" ON appointment_slots;
DROP POLICY IF EXISTS "appointment_slots_delete_policy" ON appointment_slots;

-- 3. Create permissive policies for public access
-- Allow public to read all appointment slots (needed for availability checking)
CREATE POLICY "appointment_slots_public_select" ON appointment_slots
    FOR SELECT
    USING (true);

-- Allow public to insert appointment slots (for fallback generation)
CREATE POLICY "appointment_slots_public_insert" ON appointment_slots
    FOR INSERT
    WITH CHECK (true);

-- Allow public to update appointment slots (for reservation)
CREATE POLICY "appointment_slots_public_update" ON appointment_slots
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- Allow public to delete appointment slots (for regeneration)
CREATE POLICY "appointment_slots_public_delete" ON appointment_slots
    FOR DELETE
    USING (true);

-- 4. Enable RLS on business_hours and special_dates for public access
ALTER TABLE business_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE special_dates ENABLE ROW LEVEL SECURITY;

-- 5. Drop existing policies on business_hours
DROP POLICY IF EXISTS "business_hours_select_policy" ON business_hours;
DROP POLICY IF EXISTS "business_hours_public_select" ON business_hours;

-- 6. Create permissive read policies for business_hours
CREATE POLICY "business_hours_public_select" ON business_hours
    FOR SELECT
    USING (true);

-- 7. Drop existing policies on special_dates
DROP POLICY IF EXISTS "special_dates_select_policy" ON special_dates;
DROP POLICY IF EXISTS "special_dates_public_select" ON special_dates;

-- 8. Create permissive read policies for special_dates
CREATE POLICY "special_dates_public_select" ON special_dates
    FOR SELECT
    USING (true);

-- 9. Grant execute permission on the slot generation function to anon role
GRANT EXECUTE ON FUNCTION public.generate_appointment_slots(DATE, INTEGER) TO anon;
GRANT EXECUTE ON FUNCTION public.generate_appointment_slots_range(DATE, DATE, INTEGER) TO anon;

-- 10. Grant execute permission on any helper functions that might exist
DO $$
BEGIN
    -- Check if generate_slots_for_date_range exists and grant permission
    IF EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'generate_slots_for_date_range' 
        AND pronamespace = 'public'::regnamespace
    ) THEN
        EXECUTE 'GRANT EXECUTE ON FUNCTION public.generate_slots_for_date_range(DATE, DATE, INTEGER) TO anon';
    END IF;
END
$$;

-- 11. Ensure appointment_settings is accessible
ALTER TABLE appointment_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "appointment_settings_select_policy" ON appointment_settings;
DROP POLICY IF EXISTS "appointment_settings_public_select" ON appointment_settings;

CREATE POLICY "appointment_settings_public_select" ON appointment_settings
    FOR SELECT
    USING (true);

-- 12. Add helpful comments
COMMENT ON POLICY "appointment_slots_public_select" ON appointment_slots 
    IS 'Allows public API to check slot availability';

COMMENT ON POLICY "appointment_slots_public_insert" ON appointment_slots 
    IS 'Allows public API to generate slots when RPC function is unavailable';

COMMENT ON POLICY "appointment_slots_public_update" ON appointment_slots 
    IS 'Allows public API to reserve slots for appointments';

COMMENT ON POLICY "business_hours_public_select" ON business_hours 
    IS 'Allows public API to read business hours for slot generation';

COMMENT ON POLICY "special_dates_public_select" ON special_dates 
    IS 'Allows public API to check for holidays and special hours';

COMMENT ON POLICY "appointment_settings_public_select" ON appointment_settings 
    IS 'Allows public API to read appointment configuration';