-- Debug appointment RLS issues
-- Create a diagnostic function to test what's happening

-- First, let's check and potentially recreate the policy with better logging
DROP POLICY IF EXISTS "Public can create appointments" ON appointments;

-- Recreate with a simpler check first
CREATE POLICY "Public can create appointments"
ON appointments FOR INSERT
TO anon
WITH CHECK (source = 'website');

-- Create a diagnostic function that can tell us what's happening
CREATE OR REPLACE FUNCTION debug_appointment_insert(
  p_customer_id uuid,
  p_device_id uuid,
  p_customer_device_id uuid,
  p_scheduled_date date,
  p_scheduled_time time,
  p_source text
)
RETURNS jsonb
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_result jsonb;
  v_appointment_id uuid;
  v_error text;
BEGIN
  -- Test 1: Check if we can generate an appointment number
  BEGIN
    v_result = jsonb_build_object(
      'appointment_number_test', generate_appointment_number()
    );
  EXCEPTION WHEN OTHERS THEN
    v_result = jsonb_build_object(
      'appointment_number_error', SQLERRM
    );
  END;
  
  -- Test 2: Try to insert with minimal fields
  BEGIN
    INSERT INTO appointments (
      customer_id,
      scheduled_date,
      scheduled_time,
      source
    ) VALUES (
      p_customer_id,
      p_scheduled_date,
      p_scheduled_time,
      p_source
    ) RETURNING id INTO v_appointment_id;
    
    v_result = v_result || jsonb_build_object(
      'minimal_insert_success', true,
      'appointment_id', v_appointment_id
    );
    
    -- Clean up test insert
    DELETE FROM appointments WHERE id = v_appointment_id;
  EXCEPTION WHEN OTHERS THEN
    v_result = v_result || jsonb_build_object(
      'minimal_insert_error', SQLERRM,
      'minimal_insert_detail', SQLSTATE
    );
  END;
  
  -- Test 3: Try full insert
  BEGIN
    INSERT INTO appointments (
      customer_id,
      device_id,
      customer_device_id,
      scheduled_date,
      scheduled_time,
      source,
      status
    ) VALUES (
      p_customer_id,
      p_device_id,
      p_customer_device_id,
      p_scheduled_date,
      p_scheduled_time,
      p_source,
      'scheduled'
    ) RETURNING id INTO v_appointment_id;
    
    v_result = v_result || jsonb_build_object(
      'full_insert_success', true,
      'appointment_id', v_appointment_id
    );
    
    -- Clean up test insert
    DELETE FROM appointments WHERE id = v_appointment_id;
  EXCEPTION WHEN OTHERS THEN
    v_result = v_result || jsonb_build_object(
      'full_insert_error', SQLERRM,
      'full_insert_detail', SQLSTATE
    );
  END;
  
  -- Test 4: Check RLS policies
  v_result = v_result || jsonb_build_object(
    'current_user', current_user,
    'session_user', session_user,
    'source_value', p_source,
    'source_equals_website', (p_source = 'website')
  );
  
  RETURN v_result;
END;
$$;

-- Grant execute permission to anon
GRANT EXECUTE ON FUNCTION debug_appointment_insert(uuid, uuid, uuid, date, time, text) TO anon;

-- Also, let's make absolutely sure the trigger functions have the right permissions
ALTER FUNCTION set_appointment_number() SECURITY DEFINER;
ALTER FUNCTION generate_appointment_number() SECURITY DEFINER;

-- And ensure all related functions that might be called have SECURITY DEFINER
ALTER FUNCTION update_appointment_timestamps() SECURITY DEFINER;
ALTER FUNCTION trigger_log_appointment_activity() SECURITY DEFINER;
ALTER FUNCTION update_slot_on_appointment_change() SECURITY DEFINER;