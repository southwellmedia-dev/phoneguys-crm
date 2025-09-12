-- Fix get_public_ticket_info to use correct column names from repair_tickets table

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
  
  -- Return filtered ticket information using correct column names
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
      'device', CASE 
        WHEN cd.id IS NOT NULL THEN json_build_object(
          'brand', d.brand,
          'model', d.model,
          'color', cd.color
        )
        WHEN rt.device_brand IS NOT NULL THEN json_build_object(
          'brand', rt.device_brand,
          'model', rt.device_model
        )
        ELSE NULL
      END,
      'repair_issues', rt.repair_issues,  -- Changed from 'issues'
      'description', rt.description,
      'estimated_cost', rt.estimated_cost,  -- Changed from total_cost
      'actual_cost', rt.actual_cost,
      'deposit_amount', rt.deposit_amount,  -- Changed from amount_paid
      'customer_name', c.name,
      'assigned_technician', u.full_name,
      'serial_number', rt.serial_number,
      'imei', rt.imei
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

-- Grant execute permissions to anon role
GRANT EXECUTE ON FUNCTION public.get_public_ticket_info TO anon;