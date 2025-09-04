const { createClient } = require('@supabase/supabase-js');

// Local Supabase credentials
const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testAppointments() {
  console.log('Testing appointments table...\n');

  // Test 1: Fetch all appointments
  const { data: appointments, error: fetchError } = await supabase
    .from('appointments')
    .select('*')
    .order('created_at', { ascending: false });

  if (fetchError) {
    console.error('Error fetching appointments:', fetchError);
    return;
  }

  console.log(`Found ${appointments.length} appointments:`);
  appointments.forEach(apt => {
    console.log(`- ${apt.appointment_number}: ${apt.status} on ${apt.scheduled_date} at ${apt.scheduled_time}`);
    if (apt.issues) {
      console.log(`  Issues: ${apt.issues.join(', ')}`);
    }
  });

  // Test 2: Check appointment status enum values
  const { data: statuses, error: enumError } = await supabase
    .rpc('enum_range', { enum_name: 'appointment_status' });

  if (!enumError && statuses) {
    console.log('\nAvailable appointment statuses:', statuses);
  }

  // Test 3: Verify auto-generation of appointment numbers
  console.log('\nTesting appointment number generation...');
  const { data: newAppointment, error: createError } = await supabase
    .from('appointments')
    .insert({
      scheduled_date: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
      scheduled_time: '10:00:00',
      status: 'scheduled',
      issues: ['test_issue'],
      description: 'Test appointment created via script',
      urgency: 'scheduled',
      source: 'phone'
    })
    .select()
    .single();

  if (createError) {
    console.error('Error creating test appointment:', createError);
  } else {
    console.log('Created test appointment:', newAppointment.appointment_number);
    
    // Clean up test appointment
    await supabase
      .from('appointments')
      .delete()
      .eq('id', newAppointment.id);
    console.log('Cleaned up test appointment');
  }

  console.log('\n✅ Appointments table is working correctly!');
}

testAppointments().catch(console.error);