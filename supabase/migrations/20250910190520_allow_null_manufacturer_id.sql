-- Allow manufacturer_id to be NULL in devices table
-- This fixes the issue where devices without manufacturers cause the list to be empty

ALTER TABLE devices 
ALTER COLUMN manufacturer_id DROP NOT NULL;

-- Ensure the foreign key constraint is correct
ALTER TABLE devices 
DROP CONSTRAINT IF EXISTS devices_manufacturer_id_fkey;

ALTER TABLE devices 
ADD CONSTRAINT devices_manufacturer_id_fkey 
FOREIGN KEY (manufacturer_id) 
REFERENCES manufacturers(id) 
ON DELETE SET NULL;