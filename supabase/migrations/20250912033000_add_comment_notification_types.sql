-- Add comment notification types to the check constraint
-- The current constraint is missing the comment-related notification types

-- Drop the existing check constraint
ALTER TABLE internal_notifications 
DROP CONSTRAINT IF EXISTS internal_notifications_type_check;

-- Add a new check constraint with all notification types including comment types
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
  
  -- Comment notifications (NEW)
  'comment_added',
  'comment_mention',
  'comment_reply',
  'comment_reaction',
  
  -- User and system notifications
  'user_mention',
  'system_alert',
  'custom',
  'form_submission'
));