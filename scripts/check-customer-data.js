const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Use service role to bypass RLS
);

async function checkCustomerData() {
  const customerId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'; // Alice Johnson
  
  console.log('Checking data for customer:', customerId);
  
  // Check if customer exists
  const { data: customer } = await supabase
    .from('customers')
    .select('*')
    .eq('id', customerId)
    .single();
    
  console.log('Customer exists?', !!customer, customer?.name);
  
  // Check tickets
  const { data: tickets } = await supabase
    .from('repair_tickets')
    .select('id, ticket_number, status')
    .eq('customer_id', customerId);
    
  console.log('Tickets:', tickets?.length || 0, tickets);
  
  // Check appointments
  const { data: appointments } = await supabase
    .from('appointments')
    .select('id, status')
    .eq('customer_id', customerId);
    
  console.log('Appointments:', appointments?.length || 0, appointments);
  
  // Check customer_devices
  const { data: devices } = await supabase
    .from('customer_devices')
    .select('id')
    .eq('customer_id', customerId);
    
  console.log('Customer devices:', devices?.length || 0);
  
  // Check if there are any tickets referencing this customer in other ways
  const { data: ticketsWithDevice } = await supabase
    .from('repair_tickets')
    .select('id, ticket_number, customer_device_id')
    .not('customer_device_id', 'is', null);
    
  console.log('Tickets with devices:', ticketsWithDevice?.length || 0);
  
  // Look for the specific ticket
  const { data: specificTicket } = await supabase
    .from('repair_tickets')
    .select('*')
    .eq('id', '00000001-0000-0000-0000-000000000001')
    .single();
    
  console.log('Specific ticket TPG0001:', specificTicket ? {
    id: specificTicket.id,
    customer_id: specificTicket.customer_id,
    customer_device_id: specificTicket.customer_device_id,
    status: specificTicket.status
  } : 'Not found');
}

checkCustomerData().catch(console.error);