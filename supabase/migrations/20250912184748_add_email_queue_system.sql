-- Email Queue System Migration
-- Provides robust email queue with retry logic, scheduling, and tracking

-- Create email queue table
CREATE TABLE IF NOT EXISTS email_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Email content
  to_addresses TEXT[] NOT NULL,
  subject TEXT NOT NULL,
  html TEXT NOT NULL,
  text TEXT,
  from_email TEXT,
  from_name TEXT,
  reply_to TEXT,
  cc_addresses TEXT[],
  bcc_addresses TEXT[],
  
  -- Template information
  template_id TEXT,
  template_data JSONB,
  
  -- Queue management
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('high', 'normal', 'low')),
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error TEXT,
  
  -- Scheduling
  scheduled_for TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  
  -- Metadata
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Related entities (optional)
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  ticket_id UUID REFERENCES repair_tickets(id) ON DELETE SET NULL,
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL
);

-- Create indexes for performance
CREATE INDEX idx_email_queue_status ON email_queue(status) WHERE status IN ('pending', 'processing');
CREATE INDEX idx_email_queue_scheduled ON email_queue(scheduled_for) WHERE status = 'pending';
CREATE INDEX idx_email_queue_priority ON email_queue(priority DESC, scheduled_for ASC) WHERE status = 'pending';
CREATE INDEX idx_email_queue_user ON email_queue(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_email_queue_ticket ON email_queue(ticket_id) WHERE ticket_id IS NOT NULL;
CREATE INDEX idx_email_queue_customer ON email_queue(customer_id) WHERE customer_id IS NOT NULL;
CREATE INDEX idx_email_queue_created ON email_queue(created_at DESC);

-- Create email templates table
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  subject_template TEXT NOT NULL,
  html_template TEXT NOT NULL,
  text_template TEXT,
  variables JSONB, -- Expected variables and their descriptions
  category TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- Create index for template lookups
CREATE INDEX idx_email_templates_name ON email_templates(name) WHERE is_active = true;
CREATE INDEX idx_email_templates_category ON email_templates(category) WHERE is_active = true;

-- Create email log table for audit trail
CREATE TABLE IF NOT EXISTS email_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  queue_id UUID REFERENCES email_queue(id) ON DELETE SET NULL,
  
  -- Email details (denormalized for history)
  to_addresses TEXT[],
  subject TEXT,
  template_used TEXT,
  
  -- Status
  status TEXT NOT NULL,
  message_id TEXT, -- From email provider
  error_message TEXT,
  
  -- Tracking
  sent_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  bounced_at TIMESTAMPTZ,
  complained_at TIMESTAMPTZ,
  
  -- Metadata
  provider TEXT, -- sendgrid, ses, smtp, etc.
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for email log
CREATE INDEX idx_email_log_queue ON email_log(queue_id);
CREATE INDEX idx_email_log_status ON email_log(status);
CREATE INDEX idx_email_log_sent ON email_log(sent_at DESC);
CREATE INDEX idx_email_log_created ON email_log(created_at DESC);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_email_queue_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_email_queue_updated_at
  BEFORE UPDATE ON email_queue
  FOR EACH ROW
  EXECUTE FUNCTION update_email_queue_updated_at();

CREATE TRIGGER update_email_templates_updated_at
  BEFORE UPDATE ON email_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_email_queue_updated_at();

-- Function to clean old completed emails
CREATE OR REPLACE FUNCTION clean_old_email_queue(days_to_keep INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM email_queue
  WHERE status = 'completed'
    AND processed_at < NOW() - INTERVAL '1 day' * days_to_keep;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to retry failed emails
CREATE OR REPLACE FUNCTION retry_failed_emails()
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE email_queue
  SET status = 'pending',
      attempts = 0,
      scheduled_for = NOW(),
      error = NULL
  WHERE status = 'failed'
    AND attempts < max_attempts;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- Insert default email templates
INSERT INTO email_templates (name, description, subject_template, html_template, text_template, category, variables) VALUES
  ('appointment_confirmation', 'Sent when an appointment is confirmed', 
   'Appointment Confirmed - {{appointmentDate}} at {{appointmentTime}} | The Phone Guys',
   '<h2>Appointment Confirmed!</h2><p>Dear {{customerName}},</p><p>Your appointment on {{appointmentDate}} at {{appointmentTime}} has been confirmed.</p>',
   'Appointment Confirmed\n\nDear {{customerName}},\n\nYour appointment on {{appointmentDate}} at {{appointmentTime}} has been confirmed.',
   'appointments',
   '{"customerName": "Customer name", "appointmentDate": "Date of appointment", "appointmentTime": "Time of appointment"}'::jsonb),
   
  ('repair_status_update', 'Sent when repair status changes',
   'Repair Status Update - Ticket #{{ticketNumber}} | The Phone Guys',
   '<h2>Status Update</h2><p>Your repair ticket #{{ticketNumber}} status has been updated to: {{status}}</p>',
   'Status Update\n\nYour repair ticket #{{ticketNumber}} status has been updated to: {{status}}',
   'repairs',
   '{"ticketNumber": "Ticket number", "status": "New status", "customerName": "Customer name"}'::jsonb),
   
  ('repair_completed', 'Sent when repair is completed',
   'Your Device is Ready! - Ticket #{{ticketNumber}} | The Phone Guys',
   '<h2>Your Device is Ready!</h2><p>Great news! Your {{deviceBrand}} {{deviceModel}} repair has been completed.</p>',
   'Your Device is Ready!\n\nGreat news! Your {{deviceBrand}} {{deviceModel}} repair has been completed.',
   'repairs',
   '{"ticketNumber": "Ticket number", "deviceBrand": "Device brand", "deviceModel": "Device model", "totalCost": "Total cost"}'::jsonb)
ON CONFLICT (name) DO NOTHING;

-- RLS Policies
ALTER TABLE email_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_log ENABLE ROW LEVEL SECURITY;

-- Admin users can see all emails
CREATE POLICY "Admins can view all email queue" ON email_queue
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Users can see their own emails
CREATE POLICY "Users can view own emails" ON email_queue
  FOR SELECT USING (user_id = auth.uid());

-- Service role has full access (for backend processing)
CREATE POLICY "Service role full access to email queue" ON email_queue
  FOR ALL USING (auth.role() = 'service_role');

-- Email templates are viewable by all authenticated users
CREATE POLICY "Authenticated users can view active templates" ON email_templates
  FOR SELECT USING (is_active = true AND auth.role() = 'authenticated');

-- Only admins can manage templates
CREATE POLICY "Admins can manage templates" ON email_templates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Email log policies
CREATE POLICY "Admins can view all email logs" ON email_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Service role access for email log
CREATE POLICY "Service role can manage email logs" ON email_log
  FOR ALL USING (auth.role() = 'service_role');

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON email_queue TO authenticated;
GRANT SELECT ON email_templates TO authenticated;
GRANT SELECT ON email_log TO authenticated;

-- Add comments for documentation
COMMENT ON TABLE email_queue IS 'Email queue system with retry logic and scheduling';
COMMENT ON TABLE email_templates IS 'Reusable email templates with variable substitution';
COMMENT ON TABLE email_log IS 'Audit trail and tracking for sent emails';
COMMENT ON COLUMN email_queue.priority IS 'Email priority: high > normal > low';
COMMENT ON COLUMN email_queue.status IS 'Queue status: pending -> processing -> completed/failed';
COMMENT ON COLUMN email_queue.scheduled_for IS 'When the email should be sent (for delayed sending)';
COMMENT ON FUNCTION clean_old_email_queue IS 'Removes completed emails older than specified days';
COMMENT ON FUNCTION retry_failed_emails IS 'Resets failed emails to pending for retry';