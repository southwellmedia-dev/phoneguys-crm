-- Trigger to automatically add appointment notes as comments when created or updated

-- Function to auto-add appointment notes as comments
CREATE OR REPLACE FUNCTION auto_add_appointment_notes_as_comment()
RETURNS TRIGGER AS $$
BEGIN
  -- Only proceed if notes field has content
  IF NEW.notes IS NOT NULL AND NEW.notes != '' AND (OLD IS NULL OR OLD.notes IS DISTINCT FROM NEW.notes) THEN
    -- Insert the notes as a comment
    INSERT INTO comments (
      entity_type,
      entity_id,
      user_id,
      content,
      content_html,
      visibility,
      metadata,
      created_at
    ) VALUES (
      'appointment'::text,
      NEW.id,
      COALESCE(NEW.assigned_to, NEW.created_by, auth.uid()),
      CASE 
        WHEN TG_OP = 'INSERT' THEN 'Initial Notes: ' || NEW.notes
        ELSE 'Updated Notes: ' || NEW.notes
      END,
      CASE 
        WHEN TG_OP = 'INSERT' THEN '<p><strong>Initial Notes:</strong> ' || REPLACE(REPLACE(NEW.notes, '<', '&lt;'), '>', '&gt;') || '</p>'
        ELSE '<p><strong>Updated Notes:</strong> ' || REPLACE(REPLACE(NEW.notes, '<', '&lt;'), '>', '&gt;') || '</p>'
      END,
      'internal'::text,
      jsonb_build_object(
        'auto_generated', true,
        'note_type', CASE WHEN TG_OP = 'INSERT' THEN 'appointment_initial' ELSE 'appointment_update' END,
        'trigger_source', 'appointment_notes_trigger'
      ),
      NOW()
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for appointments
DROP TRIGGER IF EXISTS auto_add_appointment_notes_trigger ON appointments;
CREATE TRIGGER auto_add_appointment_notes_trigger
AFTER INSERT OR UPDATE OF notes ON appointments
FOR EACH ROW
EXECUTE FUNCTION auto_add_appointment_notes_as_comment();

-- Function to auto-add ticket notes as comments when ticket is created from appointment
CREATE OR REPLACE FUNCTION auto_add_ticket_notes_as_comment()
RETURNS TRIGGER AS $$
DECLARE
  v_appointment_notes TEXT;
BEGIN
  -- Check if ticket was created from an appointment
  IF NEW.appointment_id IS NOT NULL THEN
    -- Get the appointment notes
    SELECT notes INTO v_appointment_notes
    FROM appointments
    WHERE id = NEW.appointment_id;
    
    -- If appointment had notes, add them as a comment on the ticket
    IF v_appointment_notes IS NOT NULL AND v_appointment_notes != '' THEN
      INSERT INTO comments (
        entity_type,
        entity_id,
        user_id,
        content,
        content_html,
        visibility,
        metadata,
        created_at
      ) VALUES (
        'ticket'::text,
        NEW.id,
        COALESCE(NEW.assigned_to, NEW.created_by, auth.uid()),
        'Appointment Notes: ' || v_appointment_notes,
        '<p><strong>Appointment Notes:</strong> ' || REPLACE(REPLACE(v_appointment_notes, '<', '&lt;'), '>', '&gt;') || '</p>',
        'internal'::text,
        jsonb_build_object(
          'auto_generated', true,
          'note_type', 'appointment_to_ticket',
          'source_appointment_id', NEW.appointment_id,
          'trigger_source', 'ticket_creation_trigger'
        ),
        NOW()
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for tickets created from appointments
DROP TRIGGER IF EXISTS auto_add_ticket_notes_trigger ON repair_tickets;
CREATE TRIGGER auto_add_ticket_notes_trigger
AFTER INSERT ON repair_tickets
FOR EACH ROW
WHEN (NEW.appointment_id IS NOT NULL)
EXECUTE FUNCTION auto_add_ticket_notes_as_comment();

-- Function to add customer/technician notes from ticket_notes table as comments
CREATE OR REPLACE FUNCTION auto_add_ticket_note_as_comment()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert the ticket note as a comment
  INSERT INTO comments (
    entity_type,
    entity_id,
    user_id,
    content,
    content_html,
    visibility,
    metadata,
    created_at
  ) VALUES (
    'ticket'::text,
    NEW.ticket_id,
    NEW.user_id,
    CASE 
      WHEN NEW.note_type = 'customer' THEN 'Customer Note: ' || NEW.content
      WHEN NEW.note_type = 'internal' THEN 'Technician Note: ' || NEW.content
      WHEN NEW.note_type = 'system' THEN 'System Note: ' || NEW.content
      ELSE NEW.content
    END,
    CASE 
      WHEN NEW.note_type = 'customer' THEN '<p><strong>Customer Note:</strong> ' 
      WHEN NEW.note_type = 'internal' THEN '<p><strong>Technician Note:</strong> '
      WHEN NEW.note_type = 'system' THEN '<p><strong>System Note:</strong> '
      ELSE '<p>'
    END || REPLACE(REPLACE(NEW.content, '<', '&lt;'), '>', '&gt;') || '</p>',
    CASE 
      WHEN NEW.note_type = 'customer' THEN 'customer'::text
      ELSE 'internal'::text
    END,
    jsonb_build_object(
      'auto_generated', true,
      'note_type', 'ticket_' || NEW.note_type,
      'source_ticket_note_id', NEW.id,
      'trigger_source', 'ticket_notes_trigger'
    ),
    NOW()
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for ticket_notes
DROP TRIGGER IF EXISTS auto_add_ticket_note_trigger ON ticket_notes;
CREATE TRIGGER auto_add_ticket_note_trigger
AFTER INSERT ON ticket_notes
FOR EACH ROW
EXECUTE FUNCTION auto_add_ticket_note_as_comment();

-- Function to add service technician notes as comments
CREATE OR REPLACE FUNCTION auto_add_service_notes_as_comment()
RETURNS TRIGGER AS $$
DECLARE
  v_service_name TEXT;
BEGIN
  -- Only proceed if technician_notes has content
  IF NEW.technician_notes IS NOT NULL AND NEW.technician_notes != '' AND 
     (OLD IS NULL OR OLD.technician_notes IS DISTINCT FROM NEW.technician_notes) THEN
    
    -- Get the service name
    SELECT name INTO v_service_name
    FROM services
    WHERE id = NEW.service_id;
    
    -- Insert the notes as a comment
    INSERT INTO comments (
      entity_type,
      entity_id,
      user_id,
      content,
      content_html,
      visibility,
      metadata,
      created_at
    ) VALUES (
      'ticket'::text,
      NEW.ticket_id,
      COALESCE(NEW.performed_by, auth.uid()),
      'Service Note for ' || COALESCE(v_service_name, 'Service') || ': ' || NEW.technician_notes,
      '<p><strong>Service Note for ' || COALESCE(v_service_name, 'Service') || ':</strong> ' || 
        REPLACE(REPLACE(NEW.technician_notes, '<', '&lt;'), '>', '&gt;') || '</p>',
      'internal'::text,
      jsonb_build_object(
        'auto_generated', true,
        'note_type', 'service_technician',
        'service_id', NEW.service_id,
        'service_name', v_service_name,
        'trigger_source', 'ticket_services_trigger'
      ),
      NOW()
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for ticket_services
DROP TRIGGER IF EXISTS auto_add_service_notes_trigger ON ticket_services;
CREATE TRIGGER auto_add_service_notes_trigger
AFTER INSERT OR UPDATE OF technician_notes ON ticket_services
FOR EACH ROW
EXECUTE FUNCTION auto_add_service_notes_as_comment();

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_appointments_notes_not_null 
ON appointments(id) 
WHERE notes IS NOT NULL AND notes != '';

CREATE INDEX IF NOT EXISTS idx_ticket_services_technician_notes_not_null 
ON ticket_services(ticket_id) 
WHERE technician_notes IS NOT NULL AND technician_notes != '';

-- Comments for documentation
COMMENT ON FUNCTION auto_add_appointment_notes_as_comment() IS 'Automatically creates a comment when appointment notes are added or updated';
COMMENT ON FUNCTION auto_add_ticket_notes_as_comment() IS 'Automatically creates a comment with appointment notes when a ticket is created from an appointment';
COMMENT ON FUNCTION auto_add_ticket_note_as_comment() IS 'Automatically creates a comment when a ticket note is added';
COMMENT ON FUNCTION auto_add_service_notes_as_comment() IS 'Automatically creates a comment when service technician notes are added';