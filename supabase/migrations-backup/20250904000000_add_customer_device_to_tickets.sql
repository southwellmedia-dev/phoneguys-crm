-- Add customer_device_id to repair_tickets table
ALTER TABLE repair_tickets
ADD COLUMN IF NOT EXISTS customer_device_id UUID REFERENCES customer_devices(id) ON DELETE SET NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_repair_tickets_customer_device_id ON repair_tickets(customer_device_id);

-- Add comment
COMMENT ON COLUMN repair_tickets.customer_device_id IS 'Reference to the customer device being repaired';