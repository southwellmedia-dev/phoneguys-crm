-- Clear devices table for testing fresh sync
-- This will also clear related customer_devices due to CASCADE
TRUNCATE TABLE devices CASCADE;

-- Reset any sequences if needed
-- The devices table uses UUID so no sequence reset needed

-- Log the action
DO $$
BEGIN
  RAISE NOTICE 'Devices table cleared for testing fresh sync';
END $$;