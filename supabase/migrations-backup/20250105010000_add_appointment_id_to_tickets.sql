-- Add appointment_id to repair_tickets to track tickets created from appointments
ALTER TABLE repair_tickets 
ADD COLUMN IF NOT EXISTS appointment_id UUID REFERENCES appointments(id);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_repair_tickets_appointment ON repair_tickets(appointment_id);

-- Add comment
COMMENT ON COLUMN repair_tickets.appointment_id IS 'Reference to the appointment this ticket was created from';