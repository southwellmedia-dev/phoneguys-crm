-- Make ticket_id nullable to allow notifications for appointments without tickets
ALTER TABLE notifications 
ALTER COLUMN ticket_id DROP NOT NULL;

-- Add comment explaining the change
COMMENT ON COLUMN notifications.ticket_id IS 'Reference to repair ticket. Can be null for appointment confirmations or other non-ticket notifications';