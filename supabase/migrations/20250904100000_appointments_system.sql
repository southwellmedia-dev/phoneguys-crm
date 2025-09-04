-- Create appointments status enum
CREATE TYPE appointment_status AS ENUM (
  'scheduled',    -- Initial booking
  'confirmed',    -- Customer confirmed
  'arrived',      -- Customer checked in
  'no_show',      -- Didn't arrive
  'cancelled',    -- Cancelled by customer/staff
  'converted'     -- Converted to repair ticket
);

-- Create appointments table
CREATE TABLE appointments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_number VARCHAR(20) UNIQUE NOT NULL,
  
  -- Customer & Device Info
  customer_id UUID REFERENCES customers(id),
  device_id UUID REFERENCES devices(id),
  customer_device_id UUID REFERENCES customer_devices(id),
  
  -- Scheduling
  scheduled_date DATE NOT NULL,
  scheduled_time TIME NOT NULL,
  duration_minutes INTEGER DEFAULT 30,
  
  -- Service Planning
  service_ids UUID[], -- Array of planned services
  estimated_cost DECIMAL(10,2),
  
  -- Status & Workflow  
  status appointment_status DEFAULT 'scheduled',
  confirmation_sent_at TIMESTAMP WITH TIME ZONE,
  reminder_sent_at TIMESTAMP WITH TIME ZONE,
  arrived_at TIMESTAMP WITH TIME ZONE,
  converted_to_ticket_id UUID REFERENCES repair_tickets(id),
  
  -- Form Data
  issues TEXT[], -- From form submission
  description TEXT,
  urgency VARCHAR(50) CHECK (urgency IN ('walk-in', 'scheduled', 'emergency')),
  source VARCHAR(50) CHECK (source IN ('website', 'phone', 'walk-in', 'email')),
  
  -- Additional Info
  notes TEXT,
  cancellation_reason TEXT,
  created_by UUID REFERENCES users(id),
  assigned_to UUID REFERENCES users(id),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create function to generate appointment numbers (APT0001, APT0002, etc.)
CREATE OR REPLACE FUNCTION generate_appointment_number() RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  next_number integer;
  appointment_num text;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(appointment_number FROM 4) AS integer)), 0) + 1
  INTO next_number
  FROM appointments
  WHERE appointment_number ~ '^APT[0-9]+$';
  
  appointment_num := 'APT' || LPAD(next_number::text, 4, '0');
  RETURN appointment_num;
END;
$$;

-- Create trigger to set appointment number
CREATE OR REPLACE FUNCTION set_appointment_number() RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.appointment_number IS NULL OR NEW.appointment_number = '' THEN
    NEW.appointment_number := generate_appointment_number();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_appointment_number_trigger
BEFORE INSERT ON appointments
FOR EACH ROW
EXECUTE FUNCTION set_appointment_number();

-- Create updated_at trigger
CREATE TRIGGER update_appointments_updated_at
BEFORE UPDATE ON appointments
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_appointments_customer ON appointments(customer_id);
CREATE INDEX idx_appointments_scheduled_date ON appointments(scheduled_date);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointments_assigned_to ON appointments(assigned_to);
CREATE INDEX idx_appointments_converted_ticket ON appointments(converted_to_ticket_id);

-- Add RLS policies (disabled for now but ready for future use)
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Service role has full access (bypasses RLS)
CREATE POLICY "Service role has full access to appointments" ON appointments
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Add some test appointment data
INSERT INTO appointments (
  customer_id,
  scheduled_date,
  scheduled_time,
  duration_minutes,
  status,
  issues,
  description,
  urgency,
  source,
  notes
) 
SELECT 
  c.id,
  CURRENT_DATE + interval '1 day',
  '10:00:00'::time,
  30,
  'scheduled',
  ARRAY['screen_crack'],
  'Customer reports cracked screen after dropping phone',
  'scheduled',
  'website',
  'Customer prefers morning appointments'
FROM customers c
LIMIT 1;

INSERT INTO appointments (
  customer_id,
  scheduled_date,
  scheduled_time,
  duration_minutes,
  status,
  issues,
  description,
  urgency,
  source,
  notes
) 
SELECT 
  c.id,
  CURRENT_DATE + interval '2 days',
  '14:30:00'::time,
  45,
  'scheduled',
  ARRAY['battery_issue', 'charging_port'],
  'Phone not holding charge, may need new battery or charging port repair',
  'scheduled',
  'phone',
  'Customer will bring original charger for testing'
FROM customers c
LIMIT 1 OFFSET 1;

INSERT INTO appointments (
  customer_id,
  scheduled_date,
  scheduled_time,
  duration_minutes,
  status,
  issues,
  description,
  urgency,
  source,
  notes,
  confirmation_sent_at
) 
SELECT 
  c.id,
  CURRENT_DATE,
  '16:00:00'::time,
  30,
  'confirmed',
  ARRAY['water_damage'],
  'Phone fell in pool, needs water damage assessment',
  'emergency',
  'walk-in',
  'Urgent - customer needs phone for work',
  now() - interval '2 hours'
FROM customers c
LIMIT 1 OFFSET 2;