-- Add test audit data for demonstration
-- This migration populates the audit tables with sample data

-- First, get an admin user ID for testing
DO $$
DECLARE
    test_user_id UUID;
    test_user_name TEXT := 'Admin User';
BEGIN
    -- Get the first admin user
    SELECT id, full_name INTO test_user_id, test_user_name
    FROM users 
    WHERE role = 'admin' 
    LIMIT 1;
    
    -- If no admin user exists, create one
    IF test_user_id IS NULL THEN
        INSERT INTO users (id, full_name, email, role, created_at)
        VALUES (
            gen_random_uuid(),
            'Test Admin',
            'test-admin@phoneguys.com',
            'admin',
            NOW()
        ) RETURNING id, full_name INTO test_user_id, test_user_name;
    END IF;

    -- Insert test audit logs
    INSERT INTO user_activity_logs (user_id, activity_type, entity_type, entity_id, details, created_at) VALUES
    -- User management activities
    (
        test_user_id,
        'user_created',
        'user',
        gen_random_uuid(),
        jsonb_build_object(
            'name', 'John Technician',
            'email', 'john@example.com',
            'role', 'technician',
            'created_by', test_user_name,
            'invitation_method', 'admin_panel'
        ),
        NOW() - INTERVAL '2 days'
    ),
    (
        test_user_id,
        'user_updated',
        'user',
        gen_random_uuid(),
        jsonb_build_object(
            'changes', jsonb_build_object('role', 'manager'),
            'previous_role', 'technician',
            'updated_by', test_user_name
        ),
        NOW() - INTERVAL '1 day'
    ),

    -- Customer management activities
    (
        test_user_id,
        'customer_created',
        'customer',
        gen_random_uuid(),
        jsonb_build_object(
            'name', 'Alice Johnson',
            'email', 'alice@example.com',
            'phone', '555-1234',
            'created_by', test_user_name
        ),
        NOW() - INTERVAL '12 hours'
    ),
    (
        test_user_id,
        'customer_updated',
        'customer',
        gen_random_uuid(),
        jsonb_build_object(
            'changes', jsonb_build_object('phone', '555-9876'),
            'previous_phone', '555-1234',
            'updated_by', test_user_name
        ),
        NOW() - INTERVAL '8 hours'
    ),

    -- Ticket management activities
    (
        test_user_id,
        'ticket_created',
        'ticket',
        gen_random_uuid(),
        jsonb_build_object(
            'ticket_number', 'T000001',
            'customer_id', 'test-customer-1',
            'device', 'iPhone 15 Pro',
            'priority', 'high',
            'description', 'Cracked screen replacement'
        ),
        NOW() - INTERVAL '6 hours'
    ),
    (
        test_user_id,
        'ticket_status_changed',
        'ticket',
        gen_random_uuid(),
        jsonb_build_object(
            'from_status', 'new',
            'to_status', 'in_progress',
            'ticket_number', 'T000001',
            'customer_id', 'test-customer-1'
        ),
        NOW() - INTERVAL '4 hours'
    ),
    (
        test_user_id,
        'ticket_assigned',
        'ticket',
        gen_random_uuid(),
        jsonb_build_object(
            'assigned_to', 'test-user-1',
            'ticket_number', 'T000001',
            'assigned_by', test_user_name
        ),
        NOW() - INTERVAL '3 hours'
    ),
    (
        test_user_id,
        'ticket_status_changed',
        'ticket',
        gen_random_uuid(),
        jsonb_build_object(
            'from_status', 'in_progress',
            'to_status', 'completed',
            'ticket_number', 'T000001',
            'customer_id', 'test-customer-1'
        ),
        NOW() - INTERVAL '2 hours'
    ),

    -- Security events
    (
        test_user_id,
        'security_login_success',
        'security',
        NULL,
        jsonb_build_object(
            'email', (SELECT email FROM users WHERE id = test_user_id),
            'ip_address', '192.168.1.100',
            'user_agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'risk_level', 'low'
        ),
        NOW() - INTERVAL '30 minutes'
    ),
    (
        test_user_id,
        'security_login_failure',
        'security',
        NULL,
        jsonb_build_object(
            'email', 'attacker@badactors.com',
            'reason', 'Invalid credentials',
            'ip_address', '203.0.113.1',
            'user_agent', 'curl/7.68.0',
            'risk_level', 'medium'
        ),
        NOW() - INTERVAL '15 minutes'
    ),
    (
        test_user_id,
        'security_rate_limit_exceeded',
        'security',
        NULL,
        jsonb_build_object(
            'endpoint', '/api/auth/reset-password',
            'limit', 5,
            'ip_address', '203.0.113.1',
            'risk_level', 'high'
        ),
        NOW() - INTERVAL '10 minutes'
    ),
    (
        test_user_id,
        'security_permission_denied',
        'security',
        NULL,
        jsonb_build_object(
            'resource', 'admin_settings',
            'action', 'update',
            'ip_address', '192.168.1.101',
            'risk_level', 'medium'
        ),
        NOW() - INTERVAL '5 minutes'
    ),

    -- System events
    (
        test_user_id,
        'system_maintenance',
        'system',
        NULL,
        jsonb_build_object(
            'operation', 'database_backup',
            'duration', '45 seconds',
            'status', 'completed'
        ),
        NOW() - INTERVAL '1 minute'
    );

    -- Insert test API request logs
    INSERT INTO api_request_logs (endpoint, method, ip_address, user_agent, response_status, created_at, error_message) VALUES
    (
        '/api/customers',
        'POST',
        '192.168.1.100',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        201,
        NOW() - INTERVAL '12 hours',
        NULL
    ),
    (
        '/api/public/appointment',
        'POST',
        '203.0.113.50',
        'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0)',
        200,
        NOW() - INTERVAL '8 hours',
        NULL
    ),
    (
        '/api/admin/users/invite',
        'POST',
        '192.168.1.100',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        201,
        NOW() - INTERVAL '2 days',
        NULL
    ),
    (
        '/api/auth/reset-password',
        'POST',
        '203.0.113.1',
        'curl/7.68.0',
        429,
        NOW() - INTERVAL '10 minutes',
        'Rate limit exceeded'
    );

    RAISE NOTICE 'Successfully added test audit data with admin user: % (%)', test_user_name, test_user_id;
END $$;