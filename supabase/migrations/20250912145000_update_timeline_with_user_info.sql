-- Update timeline functions to include user information and remove Customer: prefix

-- Drop and recreate get_ticket_timeline with user information
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
  IF NOT public.validate_ticket_lookup(p_ticket_number, p_email) THEN
    RETURN NULL;
  END IF;
  
  -- Get ticket ID
  SELECT id INTO v_ticket_id
  FROM repair_tickets rt
  JOIN customers c ON rt.customer_id = c.id
  WHERE rt.ticket_number = p_ticket_number
  AND LOWER(c.email) = LOWER(p_email);
  
  -- Build timeline
  SELECT json_agg(
    json_build_object(
      'timestamp', to_char(event.created_at, 'Mon DD, YYYY at HH12:MI AM'),
      'type', event.type,
      'description', event.description,
      'status', event.status,
      'is_customer', event.is_customer,
      'user', event.user_name
    ) ORDER BY event.created_at DESC
  ) INTO v_timeline
  FROM (
    -- Status changes from activity log if available
    SELECT 
      created_at,
      'status_change' as type,
      'Status changed to ' || status as description,
      status,
      false as is_customer,
      NULL as user_name
    FROM repair_tickets
    WHERE ticket_number = p_ticket_number
    
    UNION ALL
    
    -- All comments (including customer comments)
    SELECT 
      c.created_at,
      'comment' as type,
      c.content as description,
      NULL as status,
      (c.visibility = 'customer') as is_customer,
      CASE 
        WHEN c.visibility = 'customer' THEN 
          COALESCE(cust.full_name, cust.email, 'Customer')
        ELSE 
          COALESCE(u.full_name, u.email, 'Staff')
      END as user_name
    FROM comments c
    LEFT JOIN users u ON c.author_id = u.id AND c.visibility != 'customer'
    LEFT JOIN customers cust ON c.entity_id::uuid IN (
      SELECT id FROM repair_tickets WHERE id = v_ticket_id
    ) AND c.visibility = 'customer'
    WHERE c.entity_type = 'ticket'
    AND c.entity_id = v_ticket_id
    AND (c.is_public = true OR c.visibility = 'customer')
  ) event;
  
  RETURN COALESCE(v_timeline, '[]'::json);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop and recreate get_appointment_timeline with user information
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
  IF NOT public.validate_appointment_lookup(p_appointment_number, p_email) THEN
    RETURN NULL;
  END IF;
  
  -- Get appointment ID
  SELECT id INTO v_appointment_id
  FROM appointments a
  JOIN customers c ON a.customer_id = c.id
  WHERE a.appointment_number = p_appointment_number
  AND LOWER(c.email) = LOWER(p_email);
  
  -- Build timeline
  SELECT json_agg(
    json_build_object(
      'timestamp', to_char(event.created_at, 'Mon DD, YYYY at HH12:MI AM'),
      'type', event.type,
      'description', event.description,
      'status', event.status,
      'is_customer', event.is_customer,
      'user', event.user_name
    ) ORDER BY event.created_at DESC
  ) INTO v_timeline
  FROM (
    -- Status changes
    SELECT 
      created_at,
      'status_change' as type,
      'Status changed to ' || status as description,
      status,
      false as is_customer,
      NULL as user_name
    FROM appointments
    WHERE appointment_number = p_appointment_number
    
    UNION ALL
    
    -- All comments (including customer comments)
    SELECT 
      c.created_at,
      'comment' as type,
      c.content as description,
      NULL as status,
      (c.visibility = 'customer') as is_customer,
      CASE 
        WHEN c.visibility = 'customer' THEN 
          COALESCE(cust.full_name, cust.email, 'Customer')
        ELSE 
          COALESCE(u.full_name, u.email, 'Staff')
      END as user_name
    FROM comments c
    LEFT JOIN users u ON c.author_id = u.id AND c.visibility != 'customer'
    LEFT JOIN customers cust ON c.entity_id::uuid IN (
      SELECT id FROM appointments WHERE id = v_appointment_id
    ) AND c.visibility = 'customer'
    WHERE c.entity_type = 'appointment'
    AND c.entity_id = v_appointment_id
    AND (c.is_public = true OR c.visibility = 'customer')
  ) event;
  
  RETURN COALESCE(v_timeline, '[]'::json);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_ticket_timeline TO anon;
GRANT EXECUTE ON FUNCTION public.get_appointment_timeline TO anon;