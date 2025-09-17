/**
 * Script to generate test audit data for demonstration
 * Run with: npx tsx scripts/generate-test-audit-data.ts
 */
import { createClient } from '@supabase/supabase-js';

// Use environment variables for Supabase connection
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function generateTestAuditData() {
  console.log('🔄 Generating test audit data...');

  // Get a test user ID (assume admin user exists)
  const { data: users } = await supabase
    .from('users')
    .select('id, name, email')
    .eq('role', 'admin')
    .limit(1);

  const testUserId = users?.[0]?.id;
  const testUserName = users?.[0]?.name || 'Admin User';

  if (!testUserId) {
    console.error('❌ No admin user found. Please ensure you have an admin user in the database.');
    return;
  }

  console.log(`✅ Using test user: ${testUserName} (${testUserId})`);

  // Generate various types of audit logs
  const testAuditLogs = [
    // User management activities
    {
      user_id: testUserId,
      activity_type: 'user_created',
      entity_type: 'user',
      entity_id: 'test-user-1',
      details: {
        name: 'John Technician',
        email: 'john@example.com',
        role: 'technician',
        created_by: testUserName,
        invitation_method: 'admin_panel'
      },
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() // 2 days ago
    },
    {
      user_id: testUserId,
      activity_type: 'user_updated',
      entity_type: 'user',
      entity_id: 'test-user-1',
      details: {
        changes: { role: 'manager' },
        previous_role: 'technician',
        updated_by: testUserName
      },
      created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() // 1 day ago
    },

    // Customer management activities
    {
      user_id: testUserId,
      activity_type: 'customer_created',
      entity_type: 'customer',
      entity_id: 'test-customer-1',
      details: {
        name: 'Alice Johnson',
        email: 'alice@example.com',
        phone: '555-1234',
        created_by: testUserName
      },
      created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString() // 12 hours ago
    },
    {
      user_id: testUserId,
      activity_type: 'customer_updated',
      entity_type: 'customer',
      entity_id: 'test-customer-1',
      details: {
        changes: { phone: '555-9876' },
        previous_phone: '555-1234',
        updated_by: testUserName
      },
      created_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString() // 8 hours ago
    },

    // Ticket management activities
    {
      user_id: testUserId,
      activity_type: 'ticket_created',
      entity_type: 'ticket',
      entity_id: 'test-ticket-1',
      details: {
        ticket_number: 'T000001',
        customer_id: 'test-customer-1',
        device: 'iPhone 15 Pro',
        priority: 'high',
        description: 'Cracked screen replacement'
      },
      created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString() // 6 hours ago
    },
    {
      user_id: testUserId,
      activity_type: 'ticket_status_changed',
      entity_type: 'ticket',
      entity_id: 'test-ticket-1',
      details: {
        from_status: 'new',
        to_status: 'in_progress',
        ticket_number: 'T000001',
        customer_id: 'test-customer-1'
      },
      created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString() // 4 hours ago
    },
    {
      user_id: testUserId,
      activity_type: 'ticket_assigned',
      entity_type: 'ticket',
      entity_id: 'test-ticket-1',
      details: {
        assigned_to: 'test-user-1',
        ticket_number: 'T000001',
        assigned_by: testUserName
      },
      created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString() // 3 hours ago
    },
    {
      user_id: testUserId,
      activity_type: 'ticket_status_changed',
      entity_type: 'ticket',
      entity_id: 'test-ticket-1',
      details: {
        from_status: 'in_progress',
        to_status: 'completed',
        ticket_number: 'T000001',
        customer_id: 'test-customer-1'
      },
      created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() // 2 hours ago
    },

    // Security events
    {
      user_id: testUserId,
      activity_type: 'security_login_success',
      entity_type: 'security',
      details: {
        email: users?.[0]?.email,
        ip_address: '192.168.1.100',
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        risk_level: 'low'
      },
      created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString() // 30 minutes ago
    },
    {
      user_id: null,
      activity_type: 'security_login_failure',
      entity_type: 'security',
      details: {
        email: 'attacker@badactors.com',
        reason: 'Invalid credentials',
        ip_address: '203.0.113.1',
        user_agent: 'curl/7.68.0',
        risk_level: 'medium'
      },
      created_at: new Date(Date.now() - 15 * 60 * 1000).toISOString() // 15 minutes ago
    },
    {
      user_id: null,
      activity_type: 'security_rate_limit_exceeded',
      entity_type: 'security',
      details: {
        endpoint: '/api/auth/reset-password',
        limit: 5,
        ip_address: '203.0.113.1',
        risk_level: 'high'
      },
      created_at: new Date(Date.now() - 10 * 60 * 1000).toISOString() // 10 minutes ago
    },
    {
      user_id: testUserId,
      activity_type: 'security_permission_denied',
      entity_type: 'security',
      details: {
        resource: 'admin_settings',
        action: 'update',
        ip_address: '192.168.1.101',
        risk_level: 'medium'
      },
      created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString() // 5 minutes ago
    },

    // System events
    {
      user_id: testUserId,
      activity_type: 'system_maintenance',
      entity_type: 'system',
      details: {
        operation: 'database_backup',
        duration: '45 seconds',
        status: 'completed'
      },
      created_at: new Date(Date.now() - 1 * 60 * 1000).toISOString() // 1 minute ago
    }
  ];

  // Insert test audit logs
  const { data, error } = await supabase
    .from('user_activity_logs')
    .insert(testAuditLogs);

  if (error) {
    console.error('❌ Error inserting test audit logs:', error);
    return;
  }

  console.log(`✅ Generated ${testAuditLogs.length} test audit log entries`);

  // Generate some API request logs as well
  const testApiLogs = [
    {
      endpoint: '/api/customers',
      method: 'POST',
      ip_address: '192.168.1.100',
      user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      response_status: 201,
      created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()
    },
    {
      endpoint: '/api/public/appointment',
      method: 'POST',
      ip_address: '203.0.113.50',
      user_agent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0)',
      response_status: 200,
      created_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString()
    },
    {
      endpoint: '/api/admin/users/invite',
      method: 'POST',
      ip_address: '192.168.1.100',
      user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      response_status: 201,
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      endpoint: '/api/auth/reset-password',
      method: 'POST',
      ip_address: '203.0.113.1',
      user_agent: 'curl/7.68.0',
      response_status: 429,
      error_message: 'Rate limit exceeded',
      created_at: new Date(Date.now() - 10 * 60 * 1000).toISOString()
    }
  ];

  const { error: apiError } = await supabase
    .from('api_request_logs')
    .insert(testApiLogs);

  if (apiError) {
    console.error('❌ Error inserting test API logs:', apiError);
    return;
  }

  console.log(`✅ Generated ${testApiLogs.length} test API request log entries`);
  console.log('🎉 Test audit data generation complete!');
  console.log('\n📊 You can now view the audit logs at: http://localhost:3000/admin/audit-logs');
}

// Run the script
generateTestAuditData().catch(console.error);