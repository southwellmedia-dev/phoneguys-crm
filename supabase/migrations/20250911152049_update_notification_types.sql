-- Drop the existing type constraint
ALTER TABLE internal_notifications 
DROP CONSTRAINT IF EXISTS internal_notifications_type_check;

-- Add a new, more comprehensive type constraint
ALTER TABLE internal_notifications 
ADD CONSTRAINT internal_notifications_type_check 
CHECK (type IN (
  -- Appointment notifications
  'new_appointment',
  'appointment_assigned',
  'appointment_unassigned',
  'appointment_transferred',
  'appointment_status_change',
  'appointment_created',
  'appointment_cancelled',
  'appointment_confirmed',
  'appointment_reminder',
  
  -- Ticket notifications  
  'new_ticket',
  'ticket_assigned',
  'ticket_unassigned',
  'ticket_transferred',
  'ticket_status_change',
  'ticket_completed',
  'ticket_on_hold',
  'ticket_created',
  'ticket_status_changed',
  
  -- Other notifications
  'user_mention',
  'system_alert',
  'custom',
  'form_submission'
));