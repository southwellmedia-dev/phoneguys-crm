-- Add the recent appointment confirmation to activity log
-- This shows how appointment status changes will appear in the activity feed

INSERT INTO user_activity_logs (
  user_id,
  activity_type,
  entity_type,
  entity_id,
  details,
  created_at
) VALUES (
  '11111111-1111-1111-1111-111111111111', -- System/Admin user who confirmed it
  'appointment_confirmed',
  'appointment',
  'fdf37c32-5cdb-4d59-873e-0918c21aa493', -- APT0012's ID
  jsonb_build_object(
    'appointment_number', 'APT0012',
    'customer_name', 'Jason DuBois',
    'appointment_date', '2025-09-20 11:00:00',
    'old_status', 'scheduled',
    'new_status', 'confirmed'
  ),
  NOW() - INTERVAL '2 minutes' -- Set it to 2 minutes ago so it shows as recent
);