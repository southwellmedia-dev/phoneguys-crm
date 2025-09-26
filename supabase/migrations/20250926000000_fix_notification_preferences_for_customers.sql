-- Fix notification_preferences table to properly support customer consent
-- This migration adds customer_id column and ensures proper structure for consent tracking

-- First, add customer_id column if it doesn't exist
ALTER TABLE public.notification_preferences 
ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE;

-- Add SMS enabled column if it doesn't exist
ALTER TABLE public.notification_preferences 
ADD COLUMN IF NOT EXISTS sms_enabled BOOLEAN DEFAULT false;

-- Add email and phone columns to store contact info at time of consent
ALTER TABLE public.notification_preferences 
ADD COLUMN IF NOT EXISTS email_address VARCHAR(255),
ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20);

-- Remove any existing unique constraints that might conflict
ALTER TABLE public.notification_preferences 
DROP CONSTRAINT IF EXISTS notification_preferences_user_id_notification_type_key;

-- Create a unique constraint for customer_id (only one preferences row per customer)
CREATE UNIQUE INDEX IF NOT EXISTS idx_notification_preferences_customer_unique
ON public.notification_preferences(customer_id)
WHERE customer_id IS NOT NULL;

-- Create a partial unique constraint for user_id (when customer_id is null)
-- Only one preference row per user when it's not a customer preference
CREATE UNIQUE INDEX IF NOT EXISTS idx_notification_preferences_user_unique
ON public.notification_preferences(user_id)
WHERE customer_id IS NULL AND user_id IS NOT NULL;

-- Add index for customer_id for performance
CREATE INDEX IF NOT EXISTS idx_notification_preferences_customer_id 
ON public.notification_preferences(customer_id);

-- Update RLS policies to include customer access
DROP POLICY IF EXISTS "Users can view their notification preferences" ON public.notification_preferences;
DROP POLICY IF EXISTS "Users can update their notification preferences" ON public.notification_preferences;

-- Create new RLS policies that handle both users and customers
CREATE POLICY "Users and service role can view notification preferences" 
ON public.notification_preferences FOR SELECT 
USING (
  auth.uid() = user_id 
  OR auth.jwt() ->> 'role' = 'service_role'
  OR EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() 
    AND users.role IN ('admin', 'manager', 'staff')
  )
);

CREATE POLICY "Users and service role can manage notification preferences" 
ON public.notification_preferences FOR ALL 
USING (
  auth.uid() = user_id 
  OR auth.jwt() ->> 'role' = 'service_role'
  OR EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() 
    AND users.role IN ('admin', 'manager')
  )
);

-- Service role (public API) can insert customer preferences
CREATE POLICY "Service role can insert customer preferences" 
ON public.notification_preferences FOR INSERT
WITH CHECK (
  auth.jwt() ->> 'role' = 'service_role'
);

-- Update existing function to handle updated_at if it doesn't exist
CREATE OR REPLACE FUNCTION update_notification_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'trigger_update_notification_preferences_updated_at'
  ) THEN
    CREATE TRIGGER trigger_update_notification_preferences_updated_at
      BEFORE UPDATE ON public.notification_preferences
      FOR EACH ROW
      EXECUTE FUNCTION update_notification_preferences_updated_at();
  END IF;
END $$;

-- Add comments for documentation
COMMENT ON COLUMN public.notification_preferences.customer_id IS 'Reference to customer for external form consent tracking';
COMMENT ON COLUMN public.notification_preferences.email_enabled IS 'Whether customer has opted in to receive email notifications';
COMMENT ON COLUMN public.notification_preferences.sms_enabled IS 'Whether customer has opted in to receive SMS notifications';
COMMENT ON COLUMN public.notification_preferences.email_address IS 'Email address at time of consent';
COMMENT ON COLUMN public.notification_preferences.phone_number IS 'Phone number at time of consent';

-- Migrate any existing customer consent data from customers table
-- Only if the notification_preferences columns exist in customers table
DO $$
BEGIN
  -- Check if notification_preferences column exists in customers table
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'customers' 
    AND column_name = 'notification_preferences'
  ) THEN
    -- Migrate existing customer preferences
    INSERT INTO public.notification_preferences (
      customer_id,
      email_enabled,
      sms_enabled,
      email_address,
      phone_number,
      created_at,
      updated_at
    )
    SELECT 
      c.id,
      COALESCE((c.notification_preferences->>'email')::boolean, false),
      COALESCE((c.notification_preferences->>'sms')::boolean, false),
      c.email,
      c.phone,
      NOW(),
      NOW()
    FROM public.customers c
    WHERE c.notification_preferences IS NOT NULL
    ON CONFLICT (customer_id) WHERE customer_id IS NOT NULL DO UPDATE SET
      email_enabled = EXCLUDED.email_enabled,
      sms_enabled = EXCLUDED.sms_enabled,
      email_address = EXCLUDED.email_address,
      phone_number = EXCLUDED.phone_number,
      updated_at = NOW();
  END IF;
END $$;