-- Add public status lookup capabilities for customers to check their repair/appointment status

-- Create table to track lookup attempts for security and analytics
CREATE TABLE IF NOT EXISTS public.status_lookup_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lookup_type TEXT NOT NULL CHECK (lookup_type IN ('ticket', 'appointment')),
  identifier TEXT NOT NULL, -- ticket_number or appointment_number
  email TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  success BOOLEAN NOT NULL DEFAULT false,
  error_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_lookup_attempts_ip ON status_lookup_attempts(ip_address, created_at);
CREATE INDEX IF NOT EXISTS idx_lookup_attempts_identifier ON status_lookup_attempts(identifier);

-- Enable RLS on lookup attempts table
ALTER TABLE status_lookup_attempts ENABLE ROW LEVEL SECURITY;

-- Only allow inserts from anon role for tracking
CREATE POLICY "Public can insert lookup attempts"
ON status_lookup_attempts FOR INSERT
TO anon
WITH CHECK (true);

-- Only authenticated users can read lookup attempts (for admin dashboard)
CREATE POLICY "Authenticated users can read lookup attempts"
ON status_lookup_attempts FOR SELECT
TO authenticated
USING (true);

-- Create function to validate customer email for ticket lookup
CREATE OR REPLACE FUNCTION public.validate_ticket_lookup(
  p_ticket_number TEXT,
  p_email TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  v_customer_email TEXT;
BEGIN
  -- Get the customer email associated with the ticket
  SELECT c.email INTO v_customer_email
  FROM repair_tickets rt
  JOIN customers c ON c.id = rt.customer_id
  WHERE rt.ticket_number = p_ticket_number;
  
  -- Case-insensitive email comparison
  RETURN lower(v_customer_email) = lower(p_email);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to validate customer email for appointment lookup
CREATE OR REPLACE FUNCTION public.validate_appointment_lookup(
  p_appointment_number TEXT,
  p_email TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  v_customer_email TEXT;
BEGIN
  -- Get the customer email associated with the appointment
  SELECT c.email INTO v_customer_email
  FROM appointments a
  JOIN customers c ON c.id = a.customer_id
  WHERE a.appointment_number = p_appointment_number;
  
  -- Case-insensitive email comparison
  RETURN lower(v_customer_email) = lower(p_email);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get public ticket info (filters sensitive data)
CREATE OR REPLACE FUNCTION public.get_public_ticket_info(
  p_ticket_number TEXT,
  p_email TEXT
) RETURNS JSON AS $$
DECLARE
  v_result JSON;
BEGIN
  -- First validate the lookup
  IF NOT validate_ticket_lookup(p_ticket_number, p_email) THEN
    RETURN NULL;
  END IF;
  
  -- Return filtered ticket information
  SELECT json_build_object(
    'success', true,
    'type', 'ticket',
    'data', json_build_object(
      'ticket_number', rt.ticket_number,
      'status', rt.status,
      'priority', rt.priority,
      'created_at', rt.created_at,
      'updated_at', rt.updated_at,
      'estimated_completion', rt.estimated_completion,
      'device', json_build_object(
        'brand', d.brand,
        'model', d.model,
        'color', cd.color,
        'storage_capacity', cd.storage_capacity
      ),
      'services', rt.services,
      'issues', rt.issues,
      'total_cost', rt.total_cost,
      'amount_paid', rt.amount_paid,
      'customer_name', c.name,
      'assigned_technician', u.name
    )
  ) INTO v_result
  FROM repair_tickets rt
  LEFT JOIN customers c ON c.id = rt.customer_id
  LEFT JOIN customer_devices cd ON cd.id = rt.customer_device_id
  LEFT JOIN devices d ON d.id = cd.device_id
  LEFT JOIN users u ON u.id = rt.assigned_to
  WHERE rt.ticket_number = p_ticket_number;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get public appointment info (filters sensitive data)
CREATE OR REPLACE FUNCTION public.get_public_appointment_info(
  p_appointment_number TEXT,
  p_email TEXT
) RETURNS JSON AS $$
DECLARE
  v_result JSON;
BEGIN
  -- First validate the lookup
  IF NOT validate_appointment_lookup(p_appointment_number, p_email) THEN
    RETURN NULL;
  END IF;
  
  -- Return filtered appointment information
  SELECT json_build_object(
    'success', true,
    'type', 'appointment',
    'data', json_build_object(
      'appointment_number', a.appointment_number,
      'status', a.status,
      'scheduled_date', a.scheduled_date,
      'scheduled_time', a.scheduled_time,
      'duration_minutes', a.duration_minutes,
      'created_at', a.created_at,
      'updated_at', a.updated_at,
      'device', CASE 
        WHEN cd.id IS NOT NULL THEN json_build_object(
          'brand', d.brand,
          'model', d.model,
          'color', cd.color,
          'storage_capacity', cd.storage_capacity
        )
        WHEN a.device_id IS NOT NULL THEN json_build_object(
          'brand', d2.brand,
          'model', d2.model
        )
        ELSE NULL
      END,
      'issues', a.issues,
      'description', a.description,
      'urgency', a.urgency,
      'estimated_cost', a.estimated_cost,
      'customer_name', c.name,
      'assigned_technician', u.name,
      'converted_to_ticket', rt.ticket_number
    )
  ) INTO v_result
  FROM appointments a
  LEFT JOIN customers c ON c.id = a.customer_id
  LEFT JOIN customer_devices cd ON cd.id = a.customer_device_id
  LEFT JOIN devices d ON d.id = cd.device_id
  LEFT JOIN devices d2 ON d2.id = a.device_id
  LEFT JOIN users u ON u.id = a.assigned_to
  LEFT JOIN repair_tickets rt ON rt.id = a.converted_to_ticket_id
  WHERE a.appointment_number = p_appointment_number;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get status timeline for tickets
CREATE OR REPLACE FUNCTION public.get_ticket_timeline(
  p_ticket_number TEXT,
  p_email TEXT
) RETURNS JSON AS $$
DECLARE
  v_timeline JSON;
BEGIN
  -- First validate the lookup
  IF NOT validate_ticket_lookup(p_ticket_number, p_email) THEN
    RETURN NULL;
  END IF;
  
  -- Get timeline events (public comments only)
  SELECT json_agg(
    json_build_object(
      'timestamp', event.created_at,
      'type', event.type,
      'description', event.description,
      'status', event.status
    ) ORDER BY event.created_at DESC
  ) INTO v_timeline
  FROM (
    -- Status changes from activity log if available
    SELECT 
      created_at,
      'status_change' as type,
      'Status changed to ' || status as description,
      status
    FROM repair_tickets
    WHERE ticket_number = p_ticket_number
    
    UNION ALL
    
    -- Public comments
    SELECT 
      c.created_at,
      'comment' as type,
      c.content as description,
      NULL as status
    FROM comments c
    WHERE c.entity_type = 'ticket'
    AND c.entity_id = (SELECT id FROM repair_tickets WHERE ticket_number = p_ticket_number)
    AND c.is_public = true
  ) event;
  
  RETURN COALESCE(v_timeline, '[]'::json);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get status timeline for appointments
CREATE OR REPLACE FUNCTION public.get_appointment_timeline(
  p_appointment_number TEXT,
  p_email TEXT
) RETURNS JSON AS $$
DECLARE
  v_timeline JSON;
BEGIN
  -- First validate the lookup
  IF NOT validate_appointment_lookup(p_appointment_number, p_email) THEN
    RETURN NULL;
  END IF;
  
  -- Get timeline events
  SELECT json_agg(
    json_build_object(
      'timestamp', event.created_at,
      'type', event.type,
      'description', event.description,
      'status', event.status
    ) ORDER BY event.created_at DESC
  ) INTO v_timeline
  FROM (
    -- Status changes
    SELECT 
      created_at,
      'status_change' as type,
      'Status changed to ' || status as description,
      status
    FROM appointments
    WHERE appointment_number = p_appointment_number
    
    UNION ALL
    
    -- Public comments
    SELECT 
      c.created_at,
      'comment' as type,
      c.content as description,
      NULL as status
    FROM comments c
    WHERE c.entity_type = 'appointment'
    AND c.entity_id = (SELECT id FROM appointments WHERE appointment_number = p_appointment_number)
    AND c.is_public = true
  ) event;
  
  RETURN COALESCE(v_timeline, '[]'::json);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to anon role for public functions
GRANT EXECUTE ON FUNCTION public.validate_ticket_lookup TO anon;
GRANT EXECUTE ON FUNCTION public.validate_appointment_lookup TO anon;
GRANT EXECUTE ON FUNCTION public.get_public_ticket_info TO anon;
GRANT EXECUTE ON FUNCTION public.get_public_appointment_info TO anon;
GRANT EXECUTE ON FUNCTION public.get_ticket_timeline TO anon;
GRANT EXECUTE ON FUNCTION public.get_appointment_timeline TO anon;

-- Add index on repair_tickets for performance
CREATE INDEX IF NOT EXISTS idx_repair_tickets_ticket_number ON repair_tickets(ticket_number);

-- Add index on appointments for performance
CREATE INDEX IF NOT EXISTS idx_appointments_appointment_number ON appointments(appointment_number);

-- Add is_public column to comments if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'comments' 
    AND column_name = 'is_public'
  ) THEN
    ALTER TABLE comments ADD COLUMN is_public BOOLEAN DEFAULT false;
  END IF;
END $$;