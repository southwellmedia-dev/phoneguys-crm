/**
 * Detailed API Testing Script to debug authentication
 * This script provides more detailed output for debugging
 */

const { createClient } = require('@supabase/supabase-js');

// Configuration
const API_BASE_URL = 'http://localhost:3006';
const SUPABASE_URL = 'http://127.0.0.1:54321';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Test authentication and API access
async function testDetailedAuth() {
  console.log('\n=== DETAILED AUTHENTICATION TEST ===\n');
  
  // 1. First, test without any authentication
  console.log('1. Testing /api/orders WITHOUT authentication:');
  try {
    const response = await fetch(`${API_BASE_URL}/api/orders`, {
      headers: { 'Content-Type': 'application/json' }
    });
    const text = await response.text();
    console.log('   Status:', response.status);
    console.log('   Response preview:', text.substring(0, 200));
    
    // Check if it's JSON
    try {
      const data = JSON.parse(text);
      console.log('   JSON Response:', JSON.stringify(data, null, 2));
    } catch {
      console.log('   (Not JSON - likely HTML redirect)');
    }
  } catch (error) {
    console.log('   Error:', error.message);
  }

  // 2. Create a test user and sign in
  console.log('\n2. Creating and signing in test user:');
  const testEmail = `test${Date.now()}@example.com`;
  const testPassword = 'TestPassword123!';
  
  // Sign up
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: testEmail,
    password: testPassword,
    options: {
      data: { role: 'admin' }
    }
  });
  
  if (signUpError) {
    console.log('   Sign up error:', signUpError.message);
    return;
  }
  console.log('   User created successfully');
  
  // Sign in
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: testEmail,
    password: testPassword
  });
  
  if (authError || !authData.session) {
    console.log('   Sign in error:', authError?.message);
    return;
  }
  
  console.log('   Signed in successfully');
  console.log('   Access token:', authData.session.access_token.substring(0, 50) + '...');
  console.log('   User ID:', authData.user.id);

  // 3. Test with authentication using cookies
  console.log('\n3. Testing /api/orders WITH authentication (cookies):');
  try {
    const response = await fetch(`${API_BASE_URL}/api/orders`, {
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `sb-access-token=${authData.session.access_token}; sb-refresh-token=${authData.session.refresh_token}`
      },
      credentials: 'include'
    });
    const text = await response.text();
    console.log('   Status:', response.status);
    
    try {
      const data = JSON.parse(text);
      console.log('   JSON Response:', JSON.stringify(data, null, 2));
    } catch {
      console.log('   Response preview:', text.substring(0, 200));
    }
  } catch (error) {
    console.log('   Error:', error.message);
  }

  // 4. Test with authentication using Authorization header
  console.log('\n4. Testing /api/orders WITH authentication (Authorization header):');
  try {
    const response = await fetch(`${API_BASE_URL}/api/orders`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authData.session.access_token}`
      }
    });
    const text = await response.text();
    console.log('   Status:', response.status);
    
    try {
      const data = JSON.parse(text);
      console.log('   JSON Response:', JSON.stringify(data, null, 2));
    } catch {
      console.log('   Response preview:', text.substring(0, 200));
    }
  } catch (error) {
    console.log('   Error:', error.message);
  }

  // 5. Check if user exists in the users table
  console.log('\n5. Checking if user exists in users table:');
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('id', authData.user.id)
    .single();
  
  if (userError) {
    console.log('   User not found in users table:', userError.message);
    console.log('   Creating user record...');
    
    // Create user in users table
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email: testEmail,
        role: 'admin',
        is_active: true
      })
      .select()
      .single();
    
    if (createError) {
      console.log('   Failed to create user record:', createError.message);
    } else {
      console.log('   User record created successfully');
    }
  } else {
    console.log('   User exists in database with role:', userData.role);
  }

  // 6. Test again after ensuring user exists
  console.log('\n6. Testing /api/orders after ensuring user exists:');
  try {
    const response = await fetch(`${API_BASE_URL}/api/orders`, {
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `sb-access-token=${authData.session.access_token}; sb-refresh-token=${authData.session.refresh_token}`
      },
      credentials: 'include'
    });
    const text = await response.text();
    console.log('   Status:', response.status);
    
    try {
      const data = JSON.parse(text);
      console.log('   Success:', data.success);
      if (data.data) {
        console.log('   Data received:', Array.isArray(data.data) ? `${data.data.length} items` : 'object');
      }
      if (data.error) {
        console.log('   Error:', data.error);
      }
    } catch {
      console.log('   Response preview:', text.substring(0, 200));
    }
  } catch (error) {
    console.log('   Error:', error.message);
  }

  // Clean up
  await supabase.auth.signOut();
  console.log('\n7. Signed out');
}

// Run test
testDetailedAuth().catch(console.error);