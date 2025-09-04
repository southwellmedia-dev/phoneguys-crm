const { createClient } = require('@supabase/supabase-js');

// Local Supabase credentials
const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testTicketWithDevice() {
  console.log('Testing ticket creation with device information...\n');

  // First, get a customer and device
  const { data: customers } = await supabase
    .from('customers')
    .select('id, name')
    .limit(1);
  
  const { data: devices } = await supabase
    .from('devices')
    .select('id, model_name')
    .limit(1);
  
  const { data: customerDevices } = await supabase
    .from('customer_devices')
    .select('id, serial_number, imei')
    .limit(1);
  
  console.log('Test data found:');
  console.log('Customer:', customers?.[0]);
  console.log('Device:', devices?.[0]);
  console.log('Customer Device:', customerDevices?.[0]);
  
  if (!customers?.[0] || !devices?.[0]) {
    console.log('Missing test data');
    return;
  }
  
  // Create a test ticket with device information
  const ticketData = {
    ticket_number: 'TEST-' + Date.now(),
    customer_id: customers[0].id,
    device_id: devices[0].id,
    customer_device_id: customerDevices?.[0]?.id || null,
    device_brand: 'Test Brand',
    device_model: devices[0].model_name,
    serial_number: 'TEST-SERIAL-123',
    imei: '123456789012345',
    repair_issues: ['test_issue'],
    description: 'Test ticket with device info',
    status: 'new',
    priority: 'medium'
  };
  
  console.log('\nCreating ticket with data:', ticketData);
  
  const { data: ticket, error } = await supabase
    .from('repair_tickets')
    .insert(ticketData)
    .select()
    .single();
  
  if (error) {
    console.error('Error creating ticket:', error);
    return;
  }
  
  console.log('\nTicket created successfully:', ticket.id);
  
  // Now fetch the ticket with details
  const { data: ticketWithDetails, error: fetchError } = await supabase
    .from('repair_tickets')
    .select(`
      *,
      device:devices (
        id,
        model_name,
        manufacturer:manufacturers (
          name
        )
      ),
      customer_device:customer_devices (
        id,
        serial_number,
        imei,
        color,
        storage_size
      )
    `)
    .eq('id', ticket.id)
    .single();
  
  if (fetchError) {
    console.error('Error fetching ticket:', fetchError);
    return;
  }
  
  console.log('\nTicket fetched with details:');
  console.log('Device:', ticketWithDetails.device);
  console.log('Customer Device:', ticketWithDetails.customer_device);
  console.log('Serial from ticket:', ticketWithDetails.serial_number);
  console.log('IMEI from ticket:', ticketWithDetails.imei);
  
  // Clean up - delete the test ticket
  await supabase
    .from('repair_tickets')
    .delete()
    .eq('id', ticket.id);
  
  console.log('\nTest ticket deleted');
}

testTicketWithDevice().catch(console.error);