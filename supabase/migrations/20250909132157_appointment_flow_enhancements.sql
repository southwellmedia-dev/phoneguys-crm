-- Add tracking fields for appointment flow enhancements
-- These fields help track who performed actions and when

-- Add confirmed_at timestamp to track when appointment was actually confirmed
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS confirmed_at timestamp with time zone;

-- Add confirmed_by to track which user confirmed the appointment
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS confirmed_by uuid REFERENCES public.users(id);

-- Add checked_in_by to track which user checked in the customer
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS checked_in_by uuid REFERENCES public.users(id);

-- Add converted_by to track which user converted the appointment to a ticket
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS converted_by uuid REFERENCES public.users(id);

-- Add confirmation_notes for any notes added during confirmation
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS confirmation_notes text;

-- Add check_in_notes for any notes added during check-in
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS check_in_notes text;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_appointments_confirmed_by ON public.appointments(confirmed_by);
CREATE INDEX IF NOT EXISTS idx_appointments_checked_in_by ON public.appointments(checked_in_by);
CREATE INDEX IF NOT EXISTS idx_appointments_converted_by ON public.appointments(converted_by);
CREATE INDEX IF NOT EXISTS idx_appointments_confirmed_at ON public.appointments(confirmed_at);

-- Add a function to automatically set confirmed_at when status changes to confirmed
CREATE OR REPLACE FUNCTION update_appointment_timestamps()
RETURNS TRIGGER AS $$
BEGIN
    -- Set confirmed_at when status changes to confirmed
    IF NEW.status = 'confirmed' AND OLD.status != 'confirmed' AND NEW.confirmed_at IS NULL THEN
        NEW.confirmed_at = NOW();
    END IF;
    
    -- Set arrived_at when status changes to arrived
    IF NEW.status = 'arrived' AND OLD.status != 'arrived' AND NEW.arrived_at IS NULL THEN
        NEW.arrived_at = NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update timestamps
DROP TRIGGER IF EXISTS appointment_timestamp_update ON public.appointments;
CREATE TRIGGER appointment_timestamp_update
    BEFORE UPDATE ON public.appointments
    FOR EACH ROW
    EXECUTE FUNCTION update_appointment_timestamps();

-- Add comments for documentation
COMMENT ON COLUMN public.appointments.confirmed_at IS 'Timestamp when the appointment was confirmed';
COMMENT ON COLUMN public.appointments.confirmed_by IS 'User who confirmed the appointment';
COMMENT ON COLUMN public.appointments.checked_in_by IS 'User who checked in the customer';
COMMENT ON COLUMN public.appointments.converted_by IS 'User who converted the appointment to a ticket';
COMMENT ON COLUMN public.appointments.confirmation_notes IS 'Notes added during appointment confirmation';
COMMENT ON COLUMN public.appointments.check_in_notes IS 'Notes added during customer check-in';