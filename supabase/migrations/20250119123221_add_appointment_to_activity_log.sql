-- Add the most recent appointment submission to activity log
-- This simulates what would happen when an appointment is submitted through the website form

INSERT INTO user_activity_logs (
  user_id,
  activity_type,
  entity_type,
  entity_id,
  details,
  created_at
) VALUES (
  '11111111-1111-1111-1111-111111111111', -- Admin user UUID (system activities)
  'appointment_created',
  'appointment',
  'fdf37c32-5cdb-4d59-873e-0918c21aa493', -- The appointment ID
  jsonb_build_object(
    'appointment_number', 'APT0012',
    'customer_name', 'Jason DuBois',
    'appointment_date', '2025-09-20 11:00:00',
    'status', 'scheduled',
    'source', 'website',
    'services', ARRAY['Service selection pending review']
  ),
  NOW() -- Set to current time so it shows as recent
);