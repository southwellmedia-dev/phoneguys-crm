const { createClient } = require('@supabase/supabase-js');

// Local Supabase credentials
const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testTicketServices() {
  console.log('Testing ticket services fetching...\n');

  // Get a ticket with services
  const ticketId = '6e2d2fed-f8a5-4c45-ab87-9dc26ac2040e'; // TPG0009
  
  const { data: ticket, error } = await supabase
    .from('repair_tickets')
    .select(`
      *,
      ticket_services (
        id,
        service:services (
          id,
          name,
          category,
          base_price,
          estimated_duration_minutes
        ),
        unit_price,
        quantity,
        technician_notes,
        performed_at,
        performed_by
      )
    `)
    .eq('id', ticketId)
    .single();
  
  if (error) {
    console.error('Error fetching ticket:', error);
    return;
  }
  
  console.log('Ticket:', ticket.ticket_number);
  console.log('\nTicket services found:', ticket.ticket_services?.length || 0);
  
  if (ticket.ticket_services && ticket.ticket_services.length > 0) {
    console.log('\nServices detail:');
    ticket.ticket_services.forEach(ts => {
      console.log(`- ${ts.service?.name || 'Unknown service'}`);
      console.log(`  Category: ${ts.service?.category || 'N/A'}`);
      console.log(`  Base price: $${ts.service?.base_price || 0}`);
      console.log(`  Unit price: $${ts.unit_price || 0}`);
      console.log(`  Quantity: ${ts.quantity}`);
      console.log('');
    });
  }
}

testTicketServices().catch(console.error);