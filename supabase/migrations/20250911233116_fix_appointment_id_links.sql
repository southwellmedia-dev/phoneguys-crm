-- Fix existing repair tickets to link back to their source appointments
-- This migration updates tickets that were converted from appointments but don't have the appointment_id set

UPDATE repair_tickets t
SET appointment_id = a.id
FROM appointments a
WHERE a.converted_to_ticket_id = t.id
  AND a.status = 'converted'
  AND t.appointment_id IS NULL;

-- Add a comment to document the relationship
COMMENT ON COLUMN repair_tickets.appointment_id IS 'Reference to the appointment this ticket was converted from';