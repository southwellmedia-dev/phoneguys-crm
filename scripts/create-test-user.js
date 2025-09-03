const { createClient } = require('@supabase/supabase-js');

// Create a Supabase client with service role key (bypasses RLS)
const supabase = createClient(
  'http://127.0.0.1:54321',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
);

async function createTestUser() {
  // Create user in Supabase Auth
  const { data, error } = await supabase.auth.admin.createUser({
    email: 'admin@phoneguys.com',
    password: 'admin123456',
    email_confirm: true
  });

  if (error) {
    console.error('Error creating user:', error);
  } else {
    console.log('User created successfully:', data.user.email);
    console.log('User ID:', data.user.id);
    console.log('\nYou can now login with:');
    console.log('Email: admin@phoneguys.com');
    console.log('Password: admin123456');
    console.log('\nOr reset the password using the forgot password link');
  }
}

createTestUser();