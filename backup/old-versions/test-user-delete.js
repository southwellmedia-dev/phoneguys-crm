const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Create client as regular user would
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testDelete() {
  const customerId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'; // Alice Johnson
  
  // First sign in as admin
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'admin@phoneguys.com',
    password: 'admin123456'
  });
  
  if (authError) {
    console.error('Auth error:', authError);
    return;
  }
  
  console.log('Signed in as:', authData.user.email);
  
  // Try to see the customer
  const { data: customer, error: customerError } = await supabase
    .from('customers')
    .select('*')
    .eq('id', customerId)
    .single();
    
  console.log('Can see customer?', !!customer);
  if (customerError) console.log('Customer error:', customerError.message);
  
  // Try to see appointments
  const { data: appointments } = await supabase
    .from('appointments')
    .select('id')
    .eq('customer_id', customerId);
    
  console.log('Can see appointments?', appointments?.length || 0);
  
  // Try to delete an appointment
  if (appointments && appointments.length > 0) {
    const { data: deleted, error: deleteError } = await supabase
      .from('appointments')
      .delete()
      .eq('customer_id', customerId)
      .select();
      
    console.log('Deleted appointments:', deleted?.length || 0);
    if (deleteError) console.log('Delete error:', deleteError.message);
  }
  
  // Sign out
  await supabase.auth.signOut();
}

testDelete().catch(console.error);