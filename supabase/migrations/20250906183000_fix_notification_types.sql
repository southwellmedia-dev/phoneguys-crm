-- Fix notification type mismatch between code and database constraint
-- The code uses types like 'repair_completed', 'status_update', 'custom' 
-- but the constraint only allows 'completion', 'status_change', 'on_hold', 'new_ticket'

-- Drop the existing constraint
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_notification_type_check;

-- Add the updated constraint with all the types the code actually uses
ALTER TABLE public.notifications 
ADD CONSTRAINT notifications_notification_type_check 
CHECK (notification_type = ANY (ARRAY[
    'status_change'::text,     -- Original
    'completion'::text,        -- Original  
    'on_hold'::text,          -- Original
    'new_ticket'::text,       -- Original
    'repair_completed'::text, -- Used by code
    'status_update'::text,    -- Used by code
    'custom'::text            -- Used by code
]));

-- Add comment explaining the notification types
COMMENT ON COLUMN public.notifications.notification_type IS 
'Type of notification: status_change, completion, on_hold, new_ticket, repair_completed, status_update, custom';