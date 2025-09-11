-- Fix appointment number generation for public API
-- The generate_appointment_number function needs to SELECT from appointments table
-- but anon role doesn't have SELECT permission, causing RLS policy violation

-- Option 1: Add SECURITY DEFINER to the function so it runs with owner privileges
CREATE OR REPLACE FUNCTION generate_appointment_number()
RETURNS text
SECURITY DEFINER
SET search_path = public
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

-- Also update the set_appointment_number trigger function to use SECURITY DEFINER
-- This ensures it can call generate_appointment_number successfully
CREATE OR REPLACE FUNCTION set_appointment_number()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.appointment_number IS NULL OR NEW.appointment_number = '' THEN
    NEW.appointment_number := generate_appointment_number();
  END IF;
  RETURN NEW;
END;
$$;

-- Grant execute permissions to anon (if not already granted)
GRANT EXECUTE ON FUNCTION generate_appointment_number() TO anon;
GRANT EXECUTE ON FUNCTION set_appointment_number() TO anon;