-- Migration to import existing appointment notes and ticket notes into the unified comments system

-- First, add metadata column if it doesn't exist
ALTER TABLE comments 
ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Add a comment for documentation
COMMENT ON COLUMN comments.metadata IS 'JSON metadata for the comment. Can include imported_from, note_type, is_system_import, and other contextual data';

-- Now import appointment notes as comments
INSERT INTO comments (
  entity_type,
  entity_id,
  user_id,
  content,
  content_html,
  visibility,
  metadata,
  created_at,
  updated_at
)
SELECT 
  'appointment'::text as entity_type,
  a.id as entity_id,
  COALESCE(a.assigned_to, a.created_by, (SELECT id FROM users WHERE role = 'admin' LIMIT 1)) as user_id,
  'Initial Appointment Notes: ' || a.notes as content,
  '<p><strong>Initial Appointment Notes:</strong> ' || 
    REPLACE(REPLACE(a.notes, '<', '&lt;'), '>', '&gt;') || 
  '</p>' as content_html,
  'internal'::text as visibility,
  jsonb_build_object(
    'imported_from', 'appointment_notes',
    'original_created_at', a.created_at,
    'is_system_import', true,
    'note_type', 'appointment_initial'
  ) as metadata,
  a.created_at as created_at,
  a.created_at as updated_at
FROM appointments a
WHERE a.notes IS NOT NULL 
  AND a.notes != ''
  AND NOT EXISTS (
    -- Don't import if we already have a comment for this appointment with the same content
    SELECT 1 FROM comments c 
    WHERE c.entity_type = 'appointment' 
      AND c.entity_id = a.id 
      AND c.content LIKE 'Initial Appointment Notes:%'
  );

-- Import appointment notes for related tickets (when appointment was converted to ticket)
INSERT INTO comments (
  entity_type,
  entity_id,
  user_id,
  content,
  content_html,
  visibility,
  metadata,
  created_at,
  updated_at
)
SELECT 
  'ticket'::text as entity_type,
  a.converted_to_ticket_id as entity_id,
  COALESCE(a.assigned_to, a.created_by, (SELECT id FROM users WHERE role = 'admin' LIMIT 1)) as user_id,
  'Initial Appointment Notes: ' || a.notes as content,
  '<p><strong>Initial Appointment Notes:</strong> ' || 
    REPLACE(REPLACE(a.notes, '<', '&lt;'), '>', '&gt;') || 
  '</p>' as content_html,
  'internal'::text as visibility,
  jsonb_build_object(
    'imported_from', 'appointment_notes',
    'original_appointment_id', a.id,
    'original_created_at', a.created_at,
    'is_system_import', true,
    'note_type', 'appointment_initial'
  ) as metadata,
  a.created_at as created_at,
  a.created_at as updated_at
FROM appointments a
WHERE a.notes IS NOT NULL 
  AND a.notes != ''
  AND a.converted_to_ticket_id IS NOT NULL
  AND NOT EXISTS (
    -- Don't import if we already have a comment for this ticket with the same content
    SELECT 1 FROM comments c 
    WHERE c.entity_type = 'ticket' 
      AND c.entity_id = a.converted_to_ticket_id 
      AND c.content LIKE 'Initial Appointment Notes:%'
  );

-- Import existing ticket notes from ticket_notes table
INSERT INTO comments (
  entity_type,
  entity_id,
  user_id,
  content,
  content_html,
  visibility,
  metadata,
  created_at,
  updated_at
)
SELECT 
  'ticket'::text as entity_type,
  tn.ticket_id as entity_id,
  tn.user_id as user_id,
  CASE 
    WHEN tn.note_type = 'customer' THEN 'Customer Note: ' || tn.content
    WHEN tn.note_type = 'internal' THEN 'Internal Note: ' || tn.content
    WHEN tn.note_type = 'system' THEN 'System Note: ' || tn.content
    ELSE tn.content
  END as content,
  CASE 
    WHEN tn.note_type = 'customer' THEN '<p><strong>Customer Note:</strong> '
    WHEN tn.note_type = 'internal' THEN '<p><strong>Internal Note:</strong> '
    WHEN tn.note_type = 'system' THEN '<p><strong>System Note:</strong> '
    ELSE '<p>'
  END || REPLACE(REPLACE(tn.content, '<', '&lt;'), '>', '&gt;') || '</p>' as content_html,
  CASE 
    WHEN tn.note_type = 'customer' THEN 'customer'::text
    ELSE 'internal'::text
  END as visibility,
  jsonb_build_object(
    'imported_from', 'ticket_notes',
    'original_note_type', tn.note_type,
    'original_id', tn.id,
    'is_system_import', true,
    'note_type', 'ticket_' || tn.note_type
  ) as metadata,
  tn.created_at as created_at,
  tn.created_at as updated_at
FROM ticket_notes tn
WHERE NOT EXISTS (
  -- Don't import if we already imported this specific note
  SELECT 1 FROM comments c 
  WHERE c.entity_type = 'ticket' 
    AND c.entity_id = tn.ticket_id 
    AND (c.metadata->>'original_id')::uuid = tn.id
);

-- Import technician notes from ticket_services
INSERT INTO comments (
  entity_type,
  entity_id,
  user_id,
  content,
  content_html,
  visibility,
  metadata,
  created_at,
  updated_at
)
SELECT 
  'ticket'::text as entity_type,
  ts.ticket_id as entity_id,
  COALESCE(ts.performed_by, (SELECT id FROM users WHERE role = 'admin' LIMIT 1)) as user_id,
  'Service Note for ' || s.name || ': ' || ts.technician_notes as content,
  '<p><strong>Service Note for ' || s.name || ':</strong> ' || 
    REPLACE(REPLACE(ts.technician_notes, '<', '&lt;'), '>', '&gt;') || 
  '</p>' as content_html,
  'internal'::text as visibility,
  jsonb_build_object(
    'imported_from', 'ticket_services',
    'service_id', ts.service_id,
    'service_name', s.name,
    'original_id', ts.id,
    'is_system_import', true,
    'note_type', 'service_technician'
  ) as metadata,
  ts.created_at as created_at,
  ts.created_at as updated_at
FROM ticket_services ts
JOIN services s ON s.id = ts.service_id
WHERE ts.technician_notes IS NOT NULL 
  AND ts.technician_notes != ''
  AND NOT EXISTS (
    -- Don't import if we already imported this specific service note
    SELECT 1 FROM comments c 
    WHERE c.entity_type = 'ticket' 
      AND c.entity_id = ts.ticket_id 
      AND (c.metadata->>'original_id')::uuid = ts.id
  );

-- Add a comment to indicate the import was completed
INSERT INTO comments (
  entity_type,
  entity_id,
  user_id,
  content,
  content_html,
  visibility,
  metadata,
  created_at
)
SELECT DISTINCT
  'ticket'::text as entity_type,
  t.id as entity_id,
  (SELECT id FROM users WHERE role = 'admin' LIMIT 1) as user_id,
  '📝 Historical notes have been imported to the unified comments system' as content,
  '<p>📝 Historical notes have been imported to the unified comments system</p>' as content_html,
  'internal'::text as visibility,
  jsonb_build_object(
    'is_system_import', true,
    'note_type', 'migration_notice',
    'migration_date', NOW()
  ) as metadata,
  NOW() as created_at
FROM repair_tickets t
WHERE EXISTS (
  SELECT 1 FROM comments c 
  WHERE c.entity_type = 'ticket' 
    AND c.entity_id = t.id 
    AND c.metadata->>'is_system_import' = 'true'
)
AND NOT EXISTS (
  SELECT 1 FROM comments c 
  WHERE c.entity_type = 'ticket' 
    AND c.entity_id = t.id 
    AND c.metadata->>'note_type' = 'migration_notice'
);

-- Create an index for faster queries on imported comments
CREATE INDEX IF NOT EXISTS idx_comments_metadata_imported 
ON comments ((metadata->>'is_system_import')) 
WHERE metadata->>'is_system_import' = 'true';

-- Create an index for note type queries
CREATE INDEX IF NOT EXISTS idx_comments_metadata_note_type 
ON comments ((metadata->>'note_type'));