// Quick script to clear all active timers
// Run with: node scripts/clear-timers.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function clearAllTimers() {
  console.log('🔍 Checking for active timers...');
  
  // Find all tickets with running timers
  const { data: tickets, error: fetchError } = await supabase
    .from('repair_tickets')
    .select('id, ticket_number, timer_started_at')
    .eq('timer_is_running', true);

  if (fetchError) {
    console.error('❌ Error fetching tickets:', fetchError);
    return;
  }

  if (!tickets || tickets.length === 0) {
    console.log('✅ No active timers found');
    return;
  }

  console.log(`⏱️  Found ${tickets.length} active timer(s):`);
  tickets.forEach(t => {
    console.log(`  - ${t.ticket_number} (started: ${new Date(t.timer_started_at).toLocaleString()})`);
  });

  console.log('\n🧹 Clearing all timers...');
  
  // Clear all timers in one update
  const { data, error: updateError } = await supabase
    .from('repair_tickets')
    .update({
      timer_is_running: false,
      timer_started_at: null
    })
    .eq('timer_is_running', true);

  if (updateError) {
    console.error('❌ Error clearing timers:', updateError);
    return;
  }

  console.log(`✅ Successfully cleared ${tickets.length} timer(s)`);
}

// Run the script
clearAllTimers()
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  });