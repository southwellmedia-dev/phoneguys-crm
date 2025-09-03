/**
 * API Testing Script for The Phone Guys CRM
 * This script tests both authenticated and unauthenticated endpoints
 */

const { createClient } = require('@supabase/supabase-js');

// Configuration
const API_BASE_URL = 'http://localhost:3006';
const SUPABASE_URL = 'http://127.0.0.1:54321';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
const EXTERNAL_API_KEY = 'test-api-key';

// Test user credentials (from seed data)
const TEST_USERS = {
  admin: { email: 'admin@phoneguys.com', password: 'admin123' },
  manager: { email: 'manager@phoneguys.com', password: 'manager123' },
  technician: { email: 'tech@phoneguys.com', password: 'tech123' }
};

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  magenta: '\x1b[35m'
};

// Helper function to make authenticated requests
async function makeAuthenticatedRequest(url, options = {}, session) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  // Add auth cookies if we have a session
  if (session) {
    headers['Cookie'] = `sb-access-token=${session.access_token}; sb-refresh-token=${session.refresh_token}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      ...options,
      headers,
      credentials: 'include'
    });

    const data = await response.text();
    let jsonData;
    
    try {
      jsonData = JSON.parse(data);
    } catch {
      jsonData = data;
    }

    return {
      status: response.status,
      ok: response.ok,
      data: jsonData,
      headers: response.headers
    };
  } catch (error) {
    return {
      status: 0,
      ok: false,
      error: error.message
    };
  }
}

// Test external API (no auth required, uses API key)
async function testExternalAPI() {
  console.log(`\n${colors.magenta}═══ Testing External API (API Key Auth) ═══${colors.reset}\n`);
  
  // Test GET repair status
  console.log(`${colors.blue}Testing GET /api/repairs${colors.reset}`);
  const getResponse = await makeAuthenticatedRequest('/api/repairs?ticket_number=TPG0001', {
    headers: { 'x-api-key': EXTERNAL_API_KEY }
  });
  
  if (getResponse.ok) {
    console.log(`${colors.green}✓ GET /api/repairs - Success (${getResponse.status})${colors.reset}`);
    console.log('Response:', JSON.stringify(getResponse.data, null, 2));
  } else {
    console.log(`${colors.red}✗ GET /api/repairs - Failed (${getResponse.status})${colors.reset}`);
    console.log('Error:', getResponse.data);
  }

  // Test POST new repair
  console.log(`\n${colors.blue}Testing POST /api/repairs${colors.reset}`);
  const postResponse = await makeAuthenticatedRequest('/api/repairs', {
    method: 'POST',
    headers: { 'x-api-key': EXTERNAL_API_KEY },
    body: JSON.stringify({
      customer: {
        name: 'API Test Customer',
        email: `test${Date.now()}@example.com`,
        phone: '555-9999'
      },
      device: {
        brand: 'Google',
        model: 'Pixel 8',
        serial_number: 'SN' + Date.now(),
        imei: 'IMEI' + Date.now()
      },
      repair_issues: ['screen_crack'],
      description: 'Test ticket from API testing script',
      priority: 'medium'
    })
  });

  if (postResponse.ok) {
    console.log(`${colors.green}✓ POST /api/repairs - Success (${postResponse.status})${colors.reset}`);
    console.log('Created ticket:', postResponse.data.data?.ticket_number);
  } else {
    console.log(`${colors.red}✗ POST /api/repairs - Failed (${postResponse.status})${colors.reset}`);
    console.log('Error:', postResponse.data);
  }
}

// Test authenticated internal APIs
async function testAuthenticatedAPIs(userType = 'admin') {
  console.log(`\n${colors.magenta}═══ Testing Internal APIs (${userType.toUpperCase()} Role) ═══${colors.reset}\n`);
  
  const credentials = TEST_USERS[userType];
  
  // Sign in
  console.log(`${colors.blue}Authenticating as ${userType}...${colors.reset}`);
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: credentials.email,
    password: credentials.password
  });

  if (authError || !authData.session) {
    console.log(`${colors.red}✗ Authentication failed: ${authError?.message || 'No session'}${colors.reset}`);
    
    // Try to create the user if it doesn't exist
    console.log(`${colors.yellow}Attempting to create test user...${colors.reset}`);
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: credentials.email,
      password: credentials.password,
      options: {
        data: { role: userType }
      }
    });
    
    if (signUpError) {
      console.log(`${colors.red}✗ Failed to create user: ${signUpError.message}${colors.reset}`);
      return;
    }
    
    // Try to sign in again
    const { data: retryAuth, error: retryError } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password
    });
    
    if (retryError || !retryAuth.session) {
      console.log(`${colors.red}✗ Still couldn't authenticate after creating user${colors.reset}`);
      return;
    }
    
    console.log(`${colors.green}✓ User created and authenticated${colors.reset}`);
    authData.session = retryAuth.session;
  } else {
    console.log(`${colors.green}✓ Authenticated successfully${colors.reset}`);
  }

  const session = authData.session;

  // Test endpoints based on role
  const endpoints = [
    { method: 'GET', url: '/api/orders', name: 'List Orders' },
    { method: 'GET', url: '/api/customers', name: 'List Customers' },
    { method: 'GET', url: '/api/users', name: 'List Users' },
    { method: 'GET', url: '/api/notifications', name: 'List Notifications' },
    { method: 'GET', url: '/api/reports/dashboard', name: 'Dashboard Metrics' }
  ];

  console.log(`\n${colors.yellow}Testing API Endpoints:${colors.reset}\n`);
  
  for (const endpoint of endpoints) {
    console.log(`${colors.blue}Testing ${endpoint.method} ${endpoint.url}${colors.reset}`);
    
    const response = await makeAuthenticatedRequest(endpoint.url, {
      method: endpoint.method
    }, session);

    if (response.ok) {
      console.log(`${colors.green}✓ ${endpoint.name} - Success (${response.status})${colors.reset}`);
      
      // Show sample data for successful responses
      if (response.data) {
        if (Array.isArray(response.data?.data)) {
          console.log(`  Found ${response.data.data.length} items`);
        } else if (response.data?.data) {
          console.log('  Response:', JSON.stringify(response.data.data, null, 2).substring(0, 200) + '...');
        }
      }
    } else {
      console.log(`${colors.red}✗ ${endpoint.name} - Failed (${response.status})${colors.reset}`);
      if (response.data?.error) {
        console.log(`  Error: ${response.data.error}`);
      }
    }
  }

  // Test creating a customer (POST)
  console.log(`\n${colors.blue}Testing POST /api/customers${colors.reset}`);
  const customerResponse = await makeAuthenticatedRequest('/api/customers', {
    method: 'POST',
    body: JSON.stringify({
      name: `Test Customer ${Date.now()}`,
      email: `customer${Date.now()}@test.com`,
      phone: '555-0000'
    })
  }, session);

  if (customerResponse.ok) {
    console.log(`${colors.green}✓ Create Customer - Success (${customerResponse.status})${colors.reset}`);
    console.log('  Created customer ID:', customerResponse.data?.data?.id);
    
    // Test updating the customer
    if (customerResponse.data?.data?.id) {
      const customerId = customerResponse.data.data.id;
      console.log(`\n${colors.blue}Testing PUT /api/customers/${customerId}${colors.reset}`);
      
      const updateResponse = await makeAuthenticatedRequest(`/api/customers/${customerId}`, {
        method: 'PUT',
        body: JSON.stringify({
          notes: 'Updated via API test'
        })
      }, session);
      
      if (updateResponse.ok) {
        console.log(`${colors.green}✓ Update Customer - Success (${updateResponse.status})${colors.reset}`);
      } else {
        console.log(`${colors.red}✗ Update Customer - Failed (${updateResponse.status})${colors.reset}`);
      }
    }
  } else {
    console.log(`${colors.red}✗ Create Customer - Failed (${customerResponse.status})${colors.reset}`);
    console.log('  Error:', customerResponse.data?.error);
  }

  // Test timer functionality
  if (userType === 'technician' || userType === 'admin') {
    console.log(`\n${colors.blue}Testing Timer Functionality${colors.reset}`);
    
    // Start a timer on TPG0001
    const timerStartResponse = await makeAuthenticatedRequest('/api/orders/TPG0001/timer', {
      method: 'POST',
      body: JSON.stringify({ action: 'start' })
    }, session);

    if (timerStartResponse.ok) {
      console.log(`${colors.green}✓ Start Timer - Success${colors.reset}`);
      
      // Wait a bit then stop the timer
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const timerStopResponse = await makeAuthenticatedRequest('/api/orders/TPG0001/timer', {
        method: 'POST',
        body: JSON.stringify({ action: 'stop', notes: 'Test timer entry' })
      }, session);
      
      if (timerStopResponse.ok) {
        console.log(`${colors.green}✓ Stop Timer - Success${colors.reset}`);
        console.log('  Duration:', timerStopResponse.data?.data?.duration, 'minutes');
      } else {
        console.log(`${colors.red}✗ Stop Timer - Failed${colors.reset}`);
      }
    } else {
      console.log(`${colors.red}✗ Start Timer - Failed${colors.reset}`);
      console.log('  Error:', timerStartResponse.data?.error);
    }
  }

  // Sign out
  await supabase.auth.signOut();
  console.log(`\n${colors.yellow}Signed out${colors.reset}`);
}

// Run all tests
async function runTests() {
  console.log(`\n${colors.magenta}╔═══════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.magenta}║   The Phone Guys CRM - API Test Suite    ║${colors.reset}`);
  console.log(`${colors.magenta}╚═══════════════════════════════════════════╝${colors.reset}`);

  // Test external API
  await testExternalAPI();
  
  // Test authenticated APIs with different roles
  await testAuthenticatedAPIs('admin');
  await testAuthenticatedAPIs('technician');
  
  console.log(`\n${colors.magenta}═══ All Tests Complete ═══${colors.reset}\n`);
}

// Run tests
runTests().catch(console.error);