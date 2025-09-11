-- Test what's blocking anon inserts
-- Create a test function that simulates anon role behavior

CREATE OR REPLACE FUNCTION test_anon_appointment_insert()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result jsonb = '{}';
  v_test_customer_id uuid;
  v_test_device_id uuid; 
  v_appointment_id uuid;
BEGIN
  -- Get a valid customer and device for testing
  SELECT id INTO v_test_customer_id FROM customers LIMIT 1;
  SELECT id INTO v_test_device_id FROM devices LIMIT 1;
  
  -- Test 1: Try insert as superuser (should work)
  BEGIN
    INSERT INTO appointments (
      customer_id,
      device_id,
      scheduled_date,
      scheduled_time,
      source,
      status
    ) VALUES (
      v_test_customer_id,
      v_test_device_id,
      '2025-12-01',
      '10:00',
      'website',
      'scheduled'
    ) RETURNING id INTO v_appointment_id;
    
    v_result = v_result || jsonb_build_object('superuser_insert', 'success', 'appointment_id', v_appointment_id);
    DELETE FROM appointments WHERE id = v_appointment_id;
  EXCEPTION WHEN OTHERS THEN
    v_result = v_result || jsonb_build_object('superuser_insert', 'failed', 'error', SQLERRM);
  END;
  
  -- Test 2: Check what the RLS policy evaluates to
  v_result = v_result || jsonb_build_object(
    'policy_check_website', 
    ('website' = 'website'),
    'source_datatype_check',
    pg_typeof('website'::text)
  );
  
  -- Test 3: Try to execute as anon role
  BEGIN
    SET LOCAL ROLE anon;
    
    INSERT INTO appointments (
      customer_id,
      device_id,
      scheduled_date,
      scheduled_time,
      source,
      status
    ) VALUES (
      v_test_customer_id,
      v_test_device_id,
      '2025-12-01',
      '10:00',
      'website',
      'scheduled'
    ) RETURNING id INTO v_appointment_id;
    
    v_result = v_result || jsonb_build_object('anon_insert', 'success', 'appointment_id', v_appointment_id);
    
    RESET ROLE;
    DELETE FROM appointments WHERE id = v_appointment_id;
  EXCEPTION WHEN OTHERS THEN
    RESET ROLE;
    v_result = v_result || jsonb_build_object(
      'anon_insert', 'failed', 
      'error', SQLERRM,
      'sqlstate', SQLSTATE
    );
  END;
  
  -- Test 4: Check if the issue is with the WITH CHECK clause evaluation
  BEGIN
    SET LOCAL ROLE anon;
    
    -- Try with explicit text casting
    INSERT INTO appointments (
      customer_id,
      device_id,
      scheduled_date,
      scheduled_time,
      source,
      status
    ) VALUES (
      v_test_customer_id,
      v_test_device_id,
      '2025-12-01',
      '10:00',
      'website'::text,
      'scheduled'
    ) RETURNING id INTO v_appointment_id;
    
    v_result = v_result || jsonb_build_object('anon_insert_with_cast', 'success');
    
    RESET ROLE;
    DELETE FROM appointments WHERE id = v_appointment_id;
  EXCEPTION WHEN OTHERS THEN
    RESET ROLE;
    v_result = v_result || jsonb_build_object(
      'anon_insert_with_cast', 'failed',
      'error', SQLERRM
    );
  END;
  
  RETURN v_result;
END;
$$;

-- Grant execute to anon for testing
GRANT EXECUTE ON FUNCTION test_anon_appointment_insert() TO anon;

-- Also, let's check if the policy might be comparing wrong data types
-- Drop and recreate the policy with explicit casting
DROP POLICY IF EXISTS "Public can create appointments" ON appointments;

CREATE POLICY "Public can create appointments"
ON appointments FOR INSERT
TO anon
WITH CHECK (source::text = 'website'::text);

-- Make sure all trigger functions that might be called have SECURITY DEFINER
ALTER FUNCTION set_appointment_number() SECURITY DEFINER;
ALTER FUNCTION generate_appointment_number() SECURITY DEFINER;
ALTER FUNCTION update_appointment_timestamps() SECURITY DEFINER;
ALTER FUNCTION trigger_log_appointment_activity() SECURITY DEFINER;
ALTER FUNCTION notify_on_appointment_created() SECURITY DEFINER;
ALTER FUNCTION update_slot_on_appointment_change() SECURITY DEFINER;