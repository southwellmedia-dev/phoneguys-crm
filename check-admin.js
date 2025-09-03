const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAdmin() {
  // Check users table
  const { data: users, error } = await supabase
    .from('users')
    .select('id, email, role, full_name')
    .eq('email', 'admin@phoneguys.com');

  console.log('Users with email admin@phoneguys.com:');
  if (error) {
    console.error('Error:', error);
  } else {
    console.log(JSON.stringify(users, null, 2));
  }

  // Also check auth.users
  const { data: authUser, error: authError } = await supabase.auth.admin.listUsers();
  
  console.log('\nAuth users with email admin@phoneguys.com:');
  if (authError) {
    console.error('Error:', authError);
  } else {
    const adminAuth = authUser.users.filter(u => u.email === 'admin@phoneguys.com');
    console.log(JSON.stringify(adminAuth.map(u => ({
      id: u.id,
      email: u.email,
      created_at: u.created_at
    })), null, 2));
  }
}

checkAdmin();