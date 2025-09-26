-- Fix notification_preferences table for customer consent tracking
-- This is a simplified migration that works with the existing table structure

-- Ensure customer_id column exists (it already does)
ALTER TABLE public.notification_preferences 
ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE;

-- Ensure SMS and email columns exist (they already do)
ALTER TABLE public.notification_preferences 
ADD COLUMN IF NOT EXISTS sms_enabled BOOLEAN DEFAULT false;
ALTER TABLE public.notification_preferences 
ADD COLUMN IF NOT EXISTS email_address VARCHAR(255);
ALTER TABLE public.notification_preferences 
ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20);

-- Create unique index for customer_id if it doesn't exist
-- This ensures only one preference row per customer
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_notification_preferences_customer_unique'
  ) THEN
    CREATE UNIQUE INDEX idx_notification_preferences_customer_unique
    ON public.notification_preferences(customer_id)
    WHERE customer_id IS NOT NULL;
  END IF;
END $$;

-- Create index for performance if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_notification_preferences_customer_id'
  ) THEN
    CREATE INDEX idx_notification_preferences_customer_id 
    ON public.notification_preferences(customer_id);
  END IF;
END $$;

-- Update RLS policies for customer access
DROP POLICY IF EXISTS "Service role can insert customer preferences" ON public.notification_preferences;

CREATE POLICY "Service role can insert customer preferences" 
ON public.notification_preferences FOR INSERT
WITH CHECK (
  auth.jwt() ->> 'role' = 'service_role'
);

-- Add documentation
COMMENT ON COLUMN public.notification_preferences.customer_id IS 'Reference to customer for external form consent tracking';
COMMENT ON COLUMN public.notification_preferences.email_enabled IS 'Whether customer has opted in to receive email notifications';
COMMENT ON COLUMN public.notification_preferences.sms_enabled IS 'Whether customer has opted in to receive SMS notifications';
COMMENT ON COLUMN public.notification_preferences.email_address IS 'Email address at time of consent';
COMMENT ON COLUMN public.notification_preferences.phone_number IS 'Phone number at time of consent';