-- Check if appointments table already exists
DO $$ 
BEGIN
    -- Only create the type if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'appointment_status') THEN
        CREATE TYPE appointment_status AS ENUM (
          'scheduled',    -- Initial booking
          'confirmed',    -- Customer confirmed
          'arrived',      -- Customer checked in
          'no_show',      -- Didn't arrive
          'cancelled',    -- Cancelled by customer/staff
          'converted'     -- Converted to repair ticket
        );
    END IF;
END$$;

-- Only create table if it doesn't exist
CREATE TABLE IF NOT EXISTS appointments (
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_appointments_customer ON appointments(customer_id);
CREATE INDEX IF NOT EXISTS idx_appointments_device ON appointments(device_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(scheduled_date, scheduled_time);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_number ON appointments(appointment_number);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_appointments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Only create trigger if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_appointments_timestamp'
    ) THEN
        CREATE TRIGGER update_appointments_timestamp
            BEFORE UPDATE ON appointments
            FOR EACH ROW
            EXECUTE FUNCTION update_appointments_updated_at();
    END IF;
END$$;

-- Create sequence for appointment numbers
CREATE SEQUENCE IF NOT EXISTS appointment_number_seq START WITH 1;

-- Create trigger to auto-generate appointment numbers
CREATE OR REPLACE FUNCTION generate_appointment_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.appointment_number := 'APT' || LPAD(nextval('appointment_number_seq')::text, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Only create trigger if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'set_appointment_number'
    ) THEN
        CREATE TRIGGER set_appointment_number
            BEFORE INSERT ON appointments
            FOR EACH ROW
            WHEN (NEW.appointment_number IS NULL)
            EXECUTE FUNCTION generate_appointment_number();
    END IF;
END$$;

-- Disable RLS for now
ALTER TABLE appointments DISABLE ROW LEVEL SECURITY;

-- Add comment
COMMENT ON TABLE appointments IS 'Customer appointments and bookings for repairs';

-- Verify table was created
SELECT 'Appointments table created successfully' AS status
WHERE EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'appointments'
);