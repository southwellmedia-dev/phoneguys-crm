const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testDelete() {
  const customerId = '231ec8c7-a9f3-4600-a5dc-ffb795d7a1e2';
  
  console.log('Testing deletion for customer:', customerId);
  
  // Check what exists for this customer
  const { data: customer } = await supabase
    .from('customers')
    .select('*')
    .eq('id', customerId)
    .single();
    
  console.log('Customer exists:', !!customer);
  
  // Check repair tickets
  const { data: tickets } = await supabase
    .from('repair_tickets')
    .select('id')
    .eq('customer_id', customerId);
    
  console.log('Repair tickets:', tickets?.length || 0);
  
  // Try to delete repair tickets first
  if (tickets && tickets.length > 0) {
    const { data: deletedTickets, error: ticketError } = await supabase
      .from('repair_tickets')
      .delete()
      .eq('customer_id', customerId)
      .select();
      
    console.log('Deleted tickets:', deletedTickets?.length || 0);
    if (ticketError) console.error('Ticket deletion error:', ticketError);
  }
  
  // Now try to delete customer
  const { data: deletedCustomer, error: deleteError } = await supabase
    .from('customers')
    .delete()
    .eq('id', customerId)
    .select();
    
  console.log('Deleted customer:', deletedCustomer);
  console.log('Delete error:', deleteError);
}

testDelete().catch(console.error);