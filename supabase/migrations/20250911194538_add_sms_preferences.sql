-- Add SMS preferences and tracking

-- Add SMS notification preferences to customers table
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS sms_notifications_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{"email": true, "sms": true}';

-- Create SMS notifications tracking table
CREATE TABLE IF NOT EXISTS sms_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id UUID REFERENCES repair_tickets(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  phone_number VARCHAR(20) NOT NULL,
  message_content TEXT NOT NULL,
  template_used VARCHAR(50),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'undelivered')),
  twilio_message_id VARCHAR(100),
  error_message TEXT,
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_sms_notifications_customer_id ON sms_notifications(customer_id);
CREATE INDEX IF NOT EXISTS idx_sms_notifications_ticket_id ON sms_notifications(ticket_id);
CREATE INDEX IF NOT EXISTS idx_sms_notifications_status ON sms_notifications(status);
CREATE INDEX IF NOT EXISTS idx_sms_notifications_created_at ON sms_notifications(created_at);

-- Add RLS policies for SMS notifications
ALTER TABLE sms_notifications ENABLE ROW LEVEL SECURITY;

-- Users can only see SMS notifications for tickets they have access to
CREATE POLICY "Users can view SMS notifications for accessible tickets" 
ON sms_notifications FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM repair_tickets 
    WHERE repair_tickets.id = sms_notifications.ticket_id
    AND (
      repair_tickets.assigned_to = auth.uid()
      OR EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.role IN ('admin', 'manager')
      )
    )
  )
);

-- Only admins and managers can insert SMS notifications (typically done via service role)
CREATE POLICY "Admins can manage SMS notifications" 
ON sms_notifications FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role IN ('admin', 'manager')
  )
);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_sms_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER trigger_update_sms_notifications_updated_at
  BEFORE UPDATE ON sms_notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_sms_notifications_updated_at();

-- Add SMS settings to the settings table (if it exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'settings') THEN
    -- Add SMS-related settings
    INSERT INTO settings (key, value, description, category, created_at, updated_at) VALUES
    ('sms_notifications_enabled', 'true', 'Enable SMS notifications for customers', 'notifications', NOW(), NOW()),
    ('sms_business_phone', '+15551234567', 'Business phone number to include in SMS messages', 'notifications', NOW(), NOW()),
    ('sms_business_name', 'The Phone Guys', 'Business name to include in SMS messages', 'notifications', NOW(), NOW()),
    ('sms_use_detailed_templates', 'false', 'Use detailed SMS templates (longer messages)', 'notifications', NOW(), NOW()),
    ('sms_rate_limit_per_hour', '100', 'Maximum SMS messages per hour', 'notifications', NOW(), NOW())
    ON CONFLICT (key) DO NOTHING;
  END IF;
END $$;

-- Update existing customers to have SMS notifications enabled by default
UPDATE customers 
SET 
  sms_notifications_enabled = true,
  notification_preferences = '{"email": true, "sms": true}'
WHERE sms_notifications_enabled IS NULL 
   OR notification_preferences IS NULL;

-- Add comment for documentation
COMMENT ON TABLE sms_notifications IS 'Tracks SMS notifications sent to customers about ticket status updates';
COMMENT ON COLUMN customers.sms_notifications_enabled IS 'Whether customer has opted in to receive SMS notifications';
COMMENT ON COLUMN customers.notification_preferences IS 'JSON object storing customer notification preferences for different types';