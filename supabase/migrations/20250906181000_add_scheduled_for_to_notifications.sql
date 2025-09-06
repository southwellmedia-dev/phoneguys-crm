-- Add scheduled_for column to notifications table
-- This column is needed for the notification service to schedule notifications

ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS scheduled_for timestamp with time zone DEFAULT now();

-- Add comment to explain the column
COMMENT ON COLUMN public.notifications.scheduled_for IS 'When the notification should be sent/processed';