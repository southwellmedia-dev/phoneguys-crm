const { createClient } = require('@supabase/supabase-js');

// Local Supabase credentials
const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testAppointmentsQuery() {
  console.log('Testing appointments query like the page does...\n');

  // Query like the repository does
  const { data, error } = await supabase
    .from('appointments')
    .select(`
      *,
      customers (
        id,
        name,
        email,
        phone,
        address
      ),
      devices (
        id,
        model_name,
        manufacturer:manufacturers (
          name
        )
      ),
      customer_devices (
        id,
        serial_number,
        imei,
        color,
        storage_size
      )
    `)
    .order('scheduled_date', { ascending: true })
    .order('scheduled_time', { ascending: true });

  if (error) {
    console.error('Error fetching appointments:', error);
    return;
  }

  console.log(`Found ${data.length} appointments:\n`);
  
  data.forEach(apt => {
    console.log(`${apt.appointment_number}: ${apt.status}`);
    console.log(`  Date: ${apt.scheduled_date} at ${apt.scheduled_time}`);
    console.log(`  Customer: ${apt.customers?.name || 'Unknown'}`);
    console.log(`  Device: ${apt.devices ? apt.devices.model_name : 'Not specified'}`);
    console.log('');
  });
}

testAppointmentsQuery().catch(console.error);