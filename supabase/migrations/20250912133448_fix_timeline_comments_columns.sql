-- Fix timeline functions to use correct comment columns (visibility instead of author_role)

-- Drop and recreate get_ticket_timeline
DROP FUNCTION IF EXISTS public.get_ticket_timeline(text, text);

CREATE OR REPLACE FUNCTION public.get_ticket_timeline(
  p_ticket_number TEXT,
  p_email TEXT
) RETURNS JSON AS $$
DECLARE
  v_timeline JSON;
  v_ticket_id UUID;
BEGIN
  -- First validate the lookup
  IF NOT validate_ticket_lookup(p_ticket_number, p_email) THEN
    RETURN NULL;
  END IF;
  
  -- Get the ticket ID
  SELECT id INTO v_ticket_id 
  FROM repair_tickets 
  WHERE ticket_number = p_ticket_number;
  
  -- Get timeline events including customer comments
  SELECT json_agg(
    json_build_object(
      'timestamp', event.created_at,
      'type', event.type,
      'description', event.description,
      'status', event.status,
      'is_customer', event.is_customer
    ) ORDER BY event.created_at DESC
  ) INTO v_timeline
  FROM (
    -- Status changes from activity log if available
    SELECT 
      created_at,
      'status_change' as type,
      'Status changed to ' || status as description,
      status,
      false as is_customer
    FROM repair_tickets
    WHERE ticket_number = p_ticket_number
    
    UNION ALL
    
    -- All comments (including customer comments)
    SELECT 
      c.created_at,
      'comment' as type,
      CASE 
        WHEN c.visibility = 'customer' THEN 'Customer: ' || c.content
        WHEN c.is_public = true THEN c.content
        ELSE 'Staff: ' || c.content
      END as description,
      NULL as status,
      (c.visibility = 'customer') as is_customer
    FROM comments c
    WHERE c.entity_type = 'ticket'
    AND c.entity_id = v_ticket_id
    AND (c.is_public = true OR c.visibility = 'customer')
  ) event;
  
  RETURN COALESCE(v_timeline, '[]'::json);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop and recreate get_appointment_timeline
DROP FUNCTION IF EXISTS public.get_appointment_timeline(text, text);

CREATE OR REPLACE FUNCTION public.get_appointment_timeline(
  p_appointment_number TEXT,
  p_email TEXT
) RETURNS JSON AS $$
DECLARE
  v_timeline JSON;
  v_appointment_id UUID;
BEGIN
  -- First validate the lookup
  IF NOT validate_appointment_lookup(p_appointment_number, p_email) THEN
    RETURN NULL;
  END IF;
  
  -- Get the appointment ID
  SELECT id INTO v_appointment_id 
  FROM appointments 
  WHERE appointment_number = p_appointment_number;
  
  -- Get timeline events including customer comments
  SELECT json_agg(
    json_build_object(
      'timestamp', event.created_at,
      'type', event.type,
      'description', event.description,
      'status', event.status,
      'is_customer', event.is_customer
    ) ORDER BY event.created_at DESC
  ) INTO v_timeline
  FROM (
    -- Status changes
    SELECT 
      created_at,
      'status_change' as type,
      'Status changed to ' || status as description,
      status,
      false as is_customer
    FROM appointments
    WHERE appointment_number = p_appointment_number
    
    UNION ALL
    
    -- All comments (including customer comments)
    SELECT 
      c.created_at,
      'comment' as type,
      CASE 
        WHEN c.visibility = 'customer' THEN 'Customer: ' || c.content
        WHEN c.is_public = true THEN c.content
        ELSE 'Staff: ' || c.content
      END as description,
      NULL as status,
      (c.visibility = 'customer') as is_customer
    FROM comments c
    WHERE c.entity_type = 'appointment'
    AND c.entity_id = v_appointment_id
    AND (c.is_public = true OR c.visibility = 'customer')
  ) event;
  
  RETURN COALESCE(v_timeline, '[]'::json);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to anon role
GRANT EXECUTE ON FUNCTION public.get_ticket_timeline TO anon;
GRANT EXECUTE ON FUNCTION public.get_appointment_timeline TO anon;