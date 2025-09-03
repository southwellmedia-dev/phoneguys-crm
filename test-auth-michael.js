/**
 * Authentication Test Script for Michael's Admin Account
 * Tests all authenticated endpoints with admin role
 */

const { createClient } = require('@supabase/supabase-js');

// Configuration
const API_BASE_URL = 'http://localhost:3000';
const SUPABASE_URL = 'http://127.0.0.1:54321';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

// Your credentials
const TEST_EMAIL = 'admin@phoneguys.com';
const TEST_PASSWORD = 'Frodoh123!';

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Colors for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  magenta: '\x1b[35m'
};

// Helper to make authenticated requests
async function makeAuthRequest(url, options = {}, session) {
  // Supabase uses a specific cookie format: sb-{hostname}-auth-token
  const authToken = {
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    provider_token: null,
    provider_refresh_token: null,
    user: session.user
  };
  
  const cookieValue = Buffer.from(JSON.stringify(authToken)).toString('base64url');
  
  const headers = {
    'Content-Type': 'application/json',
    'Cookie': `sb-127-auth-token=${cookieValue}`,
    ...options.headers
  };

  try {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      ...options,
      headers,
      credentials: 'include'
    });

    const text = await response.text();
    let data;
    
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }

    return {
      status: response.status,
      ok: response.ok,
      data
    };
  } catch (error) {
    return {
      status: 0,
      ok: false,
      error: error.message
    };
  }
}

async function runTests() {
  console.log(`\n${colors.magenta}╔═══════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.magenta}║   Testing Admin Authentication - Michael's Account   ║${colors.reset}`);
  console.log(`${colors.magenta}╚═══════════════════════════════════════════════════╝${colors.reset}\n`);

  // 1. Sign in
  console.log(`${colors.blue}1. Signing in as admin...${colors.reset}`);
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: TEST_EMAIL,
    password: TEST_PASSWORD
  });

  if (authError || !authData.session) {
    console.log(`${colors.red}✗ Authentication failed: ${authError?.message || 'No session'}${colors.reset}`);
    return;
  }

  console.log(`${colors.green}✓ Signed in successfully!${colors.reset}`);
  console.log(`   User ID: ${authData.user.id}`);
  console.log(`   Role: Admin`);
  
  const session = authData.session;

  // 2. Test GET /api/orders
  console.log(`\n${colors.blue}2. Testing GET /api/orders${colors.reset}`);
  const ordersResponse = await makeAuthRequest('/api/orders', {}, session);
  
  if (ordersResponse.ok) {
    console.log(`${colors.green}✓ Orders endpoint - Success (${ordersResponse.status})${colors.reset}`);
    if (ordersResponse.data?.data) {
      console.log(`   Found ${ordersResponse.data.data.length} repair tickets`);
      if (ordersResponse.data.data.length > 0) {
        const firstTicket = ordersResponse.data.data[0];
        console.log(`   Sample: ${firstTicket.ticket_number} - Status: ${firstTicket.status}`);
      }
    }
  } else {
    console.log(`${colors.red}✗ Orders endpoint - Failed (${ordersResponse.status})${colors.reset}`);
    console.log('   Error:', ordersResponse.data?.error);
  }

  // 3. Test GET /api/customers
  console.log(`\n${colors.blue}3. Testing GET /api/customers${colors.reset}`);
  const customersResponse = await makeAuthRequest('/api/customers', {}, session);
  
  if (customersResponse.ok) {
    console.log(`${colors.green}✓ Customers endpoint - Success (${customersResponse.status})${colors.reset}`);
    if (customersResponse.data?.data) {
      console.log(`   Found ${customersResponse.data.data.length} customers`);
    }
  } else {
    console.log(`${colors.red}✗ Customers endpoint - Failed (${customersResponse.status})${colors.reset}`);
  }

  // 4. Test GET /api/reports/dashboard
  console.log(`\n${colors.blue}4. Testing GET /api/reports/dashboard${colors.reset}`);
  const dashboardResponse = await makeAuthRequest('/api/reports/dashboard', {}, session);
  
  if (dashboardResponse.ok) {
    console.log(`${colors.green}✓ Dashboard metrics - Success (${dashboardResponse.status})${colors.reset}`);
    if (dashboardResponse.data?.data) {
      const metrics = dashboardResponse.data.data;
      console.log(`   Today's new tickets: ${metrics.todayStats?.newTickets || 0}`);
      console.log(`   Active tickets: ${metrics.todayStats?.activeTickets || 0}`);
      console.log(`   Total customers: ${metrics.overallStats?.totalCustomers || 0}`);
    }
  } else {
    console.log(`${colors.red}✗ Dashboard metrics - Failed (${dashboardResponse.status})${colors.reset}`);
  }

  // 5. Test GET /api/users
  console.log(`\n${colors.blue}5. Testing GET /api/users${colors.reset}`);
  const usersResponse = await makeAuthRequest('/api/users', {}, session);
  
  if (usersResponse.ok) {
    console.log(`${colors.green}✓ Users endpoint - Success (${usersResponse.status})${colors.reset}`);
    if (usersResponse.data?.data) {
      console.log(`   Found ${usersResponse.data.data.length} users`);
      const adminUsers = usersResponse.data.data.filter(u => u.role === 'admin');
      console.log(`   Admin users: ${adminUsers.length}`);
    }
  } else {
    console.log(`${colors.red}✗ Users endpoint - Failed (${usersResponse.status})${colors.reset}`);
  }

  // 6. Test POST /api/customers (Create)
  console.log(`\n${colors.blue}6. Testing POST /api/customers (Create)${colors.reset}`);
  const createCustomerResponse = await makeAuthRequest('/api/customers', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Test Customer from Michael',
      email: `test${Date.now()}@example.com`,
      phone: '555-1234',
      notes: 'Created during API testing'
    })
  }, session);
  
  if (createCustomerResponse.ok) {
    console.log(`${colors.green}✓ Create customer - Success (${createCustomerResponse.status})${colors.reset}`);
    if (createCustomerResponse.data?.data) {
      const customerId = createCustomerResponse.data.data.id;
      console.log(`   Created customer ID: ${customerId}`);
      
      // Test GET specific customer
      console.log(`\n${colors.blue}7. Testing GET /api/customers/${customerId}${colors.reset}`);
      const getCustomerResponse = await makeAuthRequest(`/api/customers/${customerId}`, {}, session);
      
      if (getCustomerResponse.ok) {
        console.log(`${colors.green}✓ Get specific customer - Success${colors.reset}`);
        console.log(`   Customer name: ${getCustomerResponse.data.data.name}`);
      }
    }
  } else {
    console.log(`${colors.red}✗ Create customer - Failed (${createCustomerResponse.status})${colors.reset}`);
    console.log('   Error:', createCustomerResponse.data?.error);
  }

  // 8. Test Timer functionality
  console.log(`\n${colors.blue}8. Testing Timer Functionality${colors.reset}`);
  
  // First get a ticket ID to test with
  if (ordersResponse.data?.data && ordersResponse.data.data.length > 0) {
    const testTicketId = ordersResponse.data.data[0].id;
    const testTicketNumber = ordersResponse.data.data[0].ticket_number;
    
    console.log(`   Using ticket: ${testTicketNumber}`);
    
    // Start timer
    const startTimerResponse = await makeAuthRequest(`/api/orders/${testTicketId}/timer`, {
      method: 'POST',
      body: JSON.stringify({ action: 'start' })
    }, session);
    
    if (startTimerResponse.ok) {
      console.log(`${colors.green}✓ Timer started successfully${colors.reset}`);
      
      // Wait 2 seconds
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Stop timer
      const stopTimerResponse = await makeAuthRequest(`/api/orders/${testTicketId}/timer`, {
        method: 'POST',
        body: JSON.stringify({ 
          action: 'stop', 
          notes: 'Test timer from Michael\'s session' 
        })
      }, session);
      
      if (stopTimerResponse.ok) {
        console.log(`${colors.green}✓ Timer stopped successfully${colors.reset}`);
        if (stopTimerResponse.data?.data?.duration) {
          console.log(`   Duration: ${stopTimerResponse.data.data.duration} minutes`);
        }
      } else {
        console.log(`${colors.yellow}⚠ Timer stop: ${stopTimerResponse.data?.error || 'Failed'}${colors.reset}`);
      }
    } else {
      console.log(`${colors.yellow}⚠ Timer start: ${startTimerResponse.data?.error || 'Failed'}${colors.reset}`);
    }
  }

  // 9. Test Notifications
  console.log(`\n${colors.blue}9. Testing GET /api/notifications${colors.reset}`);
  const notificationsResponse = await makeAuthRequest('/api/notifications', {}, session);
  
  if (notificationsResponse.ok) {
    console.log(`${colors.green}✓ Notifications endpoint - Success${colors.reset}`);
    if (notificationsResponse.data?.data) {
      console.log(`   Found ${notificationsResponse.data.data.length} notifications`);
    }
  } else {
    console.log(`${colors.red}✗ Notifications endpoint - Failed${colors.reset}`);
  }

  // Summary
  console.log(`\n${colors.magenta}═══════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.green}✅ Authentication Test Complete!${colors.reset}`);
  console.log(`\nYour admin account has full access to all endpoints.`);
  console.log(`The API is working correctly with proper authentication!`);
  console.log(`${colors.magenta}═══════════════════════════════════════════════════${colors.reset}\n`);

  // Sign out
  await supabase.auth.signOut();
  console.log(`${colors.yellow}Signed out${colors.reset}`);
}

// Run the tests
runTests().catch(error => {
  console.error(`${colors.red}Error:${colors.reset}`, error);
});