-- Drop existing notification_preferences if it exists with wrong structure
DROP TABLE IF EXISTS notification_preferences CASCADE;

-- Add SMS Queue Table
CREATE TABLE IF NOT EXISTS sms_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  to_numbers TEXT[] NOT NULL,
  body TEXT NOT NULL,
  from_number TEXT,
  template_name TEXT,
  template_data JSONB,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('high', 'normal', 'low')),
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error TEXT,
  message_id TEXT,
  scheduled_for TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB
);

-- Create indexes for SMS queue
CREATE INDEX IF NOT EXISTS idx_sms_queue_status ON sms_queue(status);
CREATE INDEX IF NOT EXISTS idx_sms_queue_scheduled ON sms_queue(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_sms_queue_priority ON sms_queue(priority DESC);

-- Add Notification Preferences Table
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  email_enabled BOOLEAN DEFAULT true,
  sms_enabled BOOLEAN DEFAULT true,
  email_address TEXT,
  phone_number TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_customer_prefs UNIQUE(customer_id),
  CONSTRAINT unique_user_prefs UNIQUE(user_id),
  CONSTRAINT has_identifier CHECK (
    (customer_id IS NOT NULL AND user_id IS NULL) OR 
    (customer_id IS NULL AND user_id IS NOT NULL)
  )
);

-- Create indexes for notification preferences
CREATE INDEX IF NOT EXISTS idx_notification_prefs_customer ON notification_preferences(customer_id);
CREATE INDEX IF NOT EXISTS idx_notification_prefs_user ON notification_preferences(user_id);

-- Add Notification Logs Table for audit trail
CREATE TABLE IF NOT EXISTS notification_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL,
  recipient_email TEXT,
  recipient_phone TEXT,
  recipient_name TEXT,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  channels_used JSONB,
  success BOOLEAN DEFAULT false,
  error TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for notification logs
CREATE INDEX IF NOT EXISTS idx_notification_logs_type ON notification_logs(type);
CREATE INDEX IF NOT EXISTS idx_notification_logs_customer ON notification_logs(customer_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_user ON notification_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_created ON notification_logs(created_at DESC);

-- Add column to email_queue if it doesn't exist for SendGrid message ID
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'email_queue' 
    AND column_name = 'sendgrid_message_id'
  ) THEN
    ALTER TABLE email_queue ADD COLUMN sendgrid_message_id TEXT;
  END IF;
END $$;

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for notification_preferences
DROP TRIGGER IF EXISTS update_notification_preferences_updated_at ON notification_preferences;
CREATE TRIGGER update_notification_preferences_updated_at 
  BEFORE UPDATE ON notification_preferences 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies for notification_preferences
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- Customers can view and update their own preferences
CREATE POLICY "Customers can view own preferences" ON notification_preferences
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM customers WHERE id = notification_preferences.customer_id
    )
  );

CREATE POLICY "Customers can update own preferences" ON notification_preferences
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT user_id FROM customers WHERE id = notification_preferences.customer_id
    )
  );

-- Users can view and update their own preferences
CREATE POLICY "Users can view own preferences" ON notification_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences" ON notification_preferences
  FOR UPDATE USING (auth.uid() = user_id);

-- Service role can do everything
CREATE POLICY "Service role has full access to preferences" ON notification_preferences
  FOR ALL USING (auth.role() = 'service_role');

-- RLS Policies for notification_logs (read-only for users, full for service)
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notification logs" ON notification_logs
  FOR SELECT USING (
    auth.uid() = user_id OR
    auth.uid() IN (
      SELECT user_id FROM customers WHERE id = notification_logs.customer_id
    )
  );

CREATE POLICY "Service role has full access to logs" ON notification_logs
  FOR ALL USING (auth.role() = 'service_role');

-- RLS Policies for sms_queue (service role only)
ALTER TABLE sms_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role has full access to SMS queue" ON sms_queue
  FOR ALL USING (auth.role() = 'service_role');

-- Add some default notification preferences for existing customers
INSERT INTO notification_preferences (customer_id, email_enabled, sms_enabled, email_address, phone_number)
SELECT 
  c.id,
  true,
  true,
  c.email,
  c.phone
FROM customers c
WHERE NOT EXISTS (
  SELECT 1 FROM notification_preferences np WHERE np.customer_id = c.id
)
ON CONFLICT DO NOTHING;

-- Add some default notification preferences for existing users
INSERT INTO notification_preferences (user_id, email_enabled, sms_enabled, email_address)
SELECT 
  u.id,
  true,
  false, -- Default SMS off for staff users
  u.email
FROM users u
WHERE NOT EXISTS (
  SELECT 1 FROM notification_preferences np WHERE np.user_id = u.id
)
ON CONFLICT DO NOTHING;