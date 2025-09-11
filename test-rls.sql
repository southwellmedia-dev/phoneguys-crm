-- Test RLS policies for appointments table
-- Switch to anon role
SET ROLE anon;

-- Try to insert an appointment
INSERT INTO appointments (
  customer_id,
  device_id,
  scheduled_date,
  scheduled_time,
  duration_minutes,
  status,
  source,
  urgency,
  created_at,
  updated_at
) VALUES (
  NULL, -- no customer yet
  NULL, -- no device yet
  '2025-09-15',
  '10:00:00',
  30,
  'scheduled',
  'website', -- This should match the RLS policy
  'scheduled',
  NOW(),
  NOW()
) RETURNING id, appointment_number, source;

-- Reset role
RESET ROLE;