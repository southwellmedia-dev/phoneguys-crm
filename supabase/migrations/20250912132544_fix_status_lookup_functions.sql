-- Fix the status lookup functions to remove non-existent columns

-- Drop and recreate the get_public_ticket_info function
DROP FUNCTION IF EXISTS public.get_public_ticket_info(text, text);

CREATE OR REPLACE FUNCTION public.get_public_ticket_info(
  p_ticket_number TEXT,
  p_email TEXT
) RETURNS JSON AS $$
DECLARE
  v_result JSON;
BEGIN
  -- First validate the lookup
  IF NOT validate_ticket_lookup(p_ticket_number, p_email) THEN
    RETURN NULL;
  END IF;
  
  -- Return filtered ticket information
  SELECT json_build_object(
    'success', true,
    'type', 'ticket',
    'data', json_build_object(
      'ticket_number', rt.ticket_number,
      'status', rt.status,
      'priority', rt.priority,
      'created_at', rt.created_at,
      'updated_at', rt.updated_at,
      'estimated_completion', rt.estimated_completion,
      'device', json_build_object(
        'brand', d.brand,
        'model', d.model,
        'color', cd.color
      ),
      'services', rt.services,
      'issues', rt.issues,
      'total_cost', rt.total_cost,
      'amount_paid', rt.amount_paid,
      'customer_name', c.name,
      'assigned_technician', u.name
    )
  ) INTO v_result
  FROM repair_tickets rt
  LEFT JOIN customers c ON c.id = rt.customer_id
  LEFT JOIN customer_devices cd ON cd.id = rt.customer_device_id
  LEFT JOIN devices d ON d.id = cd.device_id
  LEFT JOIN users u ON u.id = rt.assigned_to
  WHERE rt.ticket_number = p_ticket_number;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop and recreate the get_public_appointment_info function
DROP FUNCTION IF EXISTS public.get_public_appointment_info(text, text);

CREATE OR REPLACE FUNCTION public.get_public_appointment_info(
  p_appointment_number TEXT,
  p_email TEXT
) RETURNS JSON AS $$
DECLARE
  v_result JSON;
BEGIN
  -- First validate the lookup
  IF NOT validate_appointment_lookup(p_appointment_number, p_email) THEN
    RETURN NULL;
  END IF;
  
  -- Return filtered appointment information
  SELECT json_build_object(
    'success', true,
    'type', 'appointment',
    'data', json_build_object(
      'appointment_number', a.appointment_number,
      'status', a.status,
      'scheduled_date', a.scheduled_date,
      'scheduled_time', a.scheduled_time,
      'duration_minutes', a.duration_minutes,
      'created_at', a.created_at,
      'updated_at', a.updated_at,
      'device', CASE 
        WHEN cd.id IS NOT NULL THEN json_build_object(
          'brand', d.brand,
          'model', d.model,
          'color', cd.color
        )
        WHEN a.device_id IS NOT NULL THEN json_build_object(
          'brand', d2.brand,
          'model', d2.model
        )
        ELSE NULL
      END,
      'issues', a.issues,
      'description', a.description,
      'urgency', a.urgency,
      'estimated_cost', a.estimated_cost,
      'customer_name', c.name,
      'assigned_technician', u.name,
      'converted_to_ticket', rt.ticket_number
    )
  ) INTO v_result
  FROM appointments a
  LEFT JOIN customers c ON c.id = a.customer_id
  LEFT JOIN customer_devices cd ON cd.id = a.customer_device_id
  LEFT JOIN devices d ON d.id = cd.device_id
  LEFT JOIN devices d2 ON d2.id = a.device_id
  LEFT JOIN users u ON u.id = a.assigned_to
  LEFT JOIN repair_tickets rt ON rt.id = a.converted_to_ticket_id
  WHERE a.appointment_number = p_appointment_number;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to anon role
GRANT EXECUTE ON FUNCTION public.get_public_ticket_info TO anon;
GRANT EXECUTE ON FUNCTION public.get_public_appointment_info TO anon;