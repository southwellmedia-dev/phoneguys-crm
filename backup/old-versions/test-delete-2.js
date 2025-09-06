const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testDelete() {
  const customerId = '231ec8c7-a9f3-4600-a5dc-ffb795d7a1e2';
  const ticketId = '83cfe9f7-ee59-48cd-a7be-6456872c9505';
  
  console.log('Testing deletion for customer:', customerId);
  
  // First, check what's referencing the ticket
  const { data: appointments } = await supabase
    .from('appointments')
    .select('id, converted_to_ticket_id')
    .eq('converted_to_ticket_id', ticketId);
    
  console.log('Appointments referencing ticket:', appointments);
  
  // Clear the references
  if (appointments && appointments.length > 0) {
    const { data: updated, error: updateError } = await supabase
      .from('appointments')
      .update({ converted_to_ticket_id: null })
      .eq('converted_to_ticket_id', ticketId)
      .select();
      
    console.log('Updated appointments:', updated);
    if (updateError) console.error('Update error:', updateError);
  }
  
  // Now try to delete the ticket
  const { data: deletedTicket, error: ticketError } = await supabase
    .from('repair_tickets')
    .delete()
    .eq('id', ticketId)
    .select();
    
  console.log('Deleted ticket:', deletedTicket);
  if (ticketError) console.error('Ticket deletion error:', ticketError);
  
  // If ticket deleted, try customer
  if (deletedTicket && deletedTicket.length > 0) {
    const { data: deletedCustomer, error: customerError } = await supabase
      .from('customers')
      .delete()
      .eq('id', customerId)
      .select();
      
    console.log('Deleted customer:', deletedCustomer);
    if (customerError) console.error('Customer deletion error:', customerError);
  }
}

testDelete().catch(console.error);