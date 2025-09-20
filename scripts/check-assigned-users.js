const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkAndUpdateAssignedUsers() {
  console.log('Checking repair tickets assigned_to field...\n');

  // First, get all tickets
  const { data: tickets, error: ticketsError } = await supabase
    .from('repair_tickets')
    .select('id, ticket_number, assigned_to, status')
    .order('created_at', { ascending: false })
    .limit(20);

  if (ticketsError) {
    console.error('Error fetching tickets:', ticketsError);
    return;
  }

  console.log(`Found ${tickets.length} recent tickets\n`);

  // Check how many have assigned_to set
  const unassignedTickets = tickets.filter(t => !t.assigned_to);
  const assignedTickets = tickets.filter(t => t.assigned_to);

  console.log(`Assigned tickets: ${assignedTickets.length}`);
  console.log(`Unassigned tickets: ${unassignedTickets.length}\n`);

  if (assignedTickets.length > 0) {
    console.log('Sample of assigned tickets:');
    assignedTickets.slice(0, 3).forEach(t => {
      console.log(`  - ${t.ticket_number}: assigned to ${t.assigned_to}`);
    });
  }

  // Get all users to potentially assign
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id, email, full_name, role');

  if (usersError) {
    console.error('Error fetching users:', usersError);
    return;
  }

  console.log(`\nFound ${users.length} users in the system:`);
  users.forEach(u => {
    console.log(`  - ${u.full_name || u.email} (${u.role}) - ID: ${u.id}`);
  });

  // Check appointments too
  console.log('\n\nChecking appointments assigned_to field...\n');
  
  const { data: appointments, error: appointmentsError } = await supabase
    .from('appointments')
    .select('id, appointment_number, assigned_to, status')
    .order('created_at', { ascending: false })
    .limit(20);

  if (appointmentsError) {
    console.error('Error fetching appointments:', appointmentsError);
    return;
  }

  const unassignedAppointments = appointments.filter(a => !a.assigned_to);
  const assignedAppointments = appointments.filter(a => a.assigned_to);

  console.log(`Assigned appointments: ${assignedAppointments.length}`);
  console.log(`Unassigned appointments: ${unassignedAppointments.length}\n`);

  // Option to assign tickets to a default user
  if (unassignedTickets.length > 0 && users.length > 0) {
    console.log('\n=== ASSIGNMENT OPTIONS ===');
    console.log('To assign all unassigned tickets to a user, you can run:');
    console.log(`npm run assign-tickets <user-id>`);
    console.log('\nAvailable user IDs:');
    users.forEach(u => {
      console.log(`  ${u.id} - ${u.full_name || u.email}`);
    });
  }
}

checkAndUpdateAssignedUsers();