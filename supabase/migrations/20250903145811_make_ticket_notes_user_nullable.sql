-- Make user_id nullable in ticket_notes table to allow system-generated notes
ALTER TABLE public.ticket_notes 
ALTER COLUMN user_id DROP NOT NULL;

-- Fix existing ticket_notes data to comply with new constraint
-- Update any invalid note_type values to 'internal'
UPDATE ticket_notes 
SET note_type = 'internal' 
WHERE note_type IS NULL OR note_type NOT IN ('internal', 'customer', 'system');

-- Update the note_type check constraint to include 'system' type
ALTER TABLE public.ticket_notes 
DROP CONSTRAINT IF EXISTS ticket_notes_note_type_check;

ALTER TABLE public.ticket_notes 
ADD CONSTRAINT ticket_notes_note_type_check 
CHECK (note_type = ANY (ARRAY['internal'::text, 'customer'::text, 'system'::text]));