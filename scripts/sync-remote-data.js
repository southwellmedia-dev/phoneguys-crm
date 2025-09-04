const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Syncing data from remote database...');

// Step 1: Dump only the tables we actually need from remote
const tables = [
  'customers',
  'repair_tickets', 
  'ticket_notes',
  'time_entries',
  'users',
  'devices',
  'manufacturers',
  'services',
  'customer_devices',
  'device_services',
  'ticket_services',
  'notifications'
];

const connectionString = 'postgresql://postgres:iZPi-8JYjn%3F0KtvY@db.egotypldqzdzjclikmeg.supabase.co:5432/postgres';

console.log('Dumping core tables from remote...');
// First dump all data, then we'll filter it
const dumpCommand = `npx supabase db dump --db-url "${connectionString}" --data-only -f supabase/seed_remote_full.sql`;

try {
  execSync(dumpCommand, { stdio: 'inherit' });
  console.log('✓ Data dumped successfully');
  
  // Now filter out storage-related inserts
  console.log('Filtering out storage tables...');
  const fullDump = fs.readFileSync('supabase/seed_remote_full.sql', 'utf8');
  
  // Split by INSERT statements and filter
  const lines = fullDump.split('\n');
  const filteredLines = [];
  let skipUntilNextInsert = false;
  
  for (const line of lines) {
    // Skip storage tables
    if (line.startsWith('INSERT INTO "storage"')) {
      skipUntilNextInsert = true;
      continue;
    }
    if (line.startsWith('--') && line.includes('Data for Name:') && line.includes('Schema: storage')) {
      skipUntilNextInsert = true;
      continue;
    }
    // Skip services as they're in migrations
    if (line.startsWith('INSERT INTO "public"."services"')) {
      skipUntilNextInsert = true;
      continue;
    }
    if (line.startsWith('--') && line.includes('Data for Name: services;')) {
      skipUntilNextInsert = true;
      continue;
    }
    if (skipUntilNextInsert && (line.startsWith('INSERT INTO') || line.startsWith('--'))) {
      skipUntilNextInsert = false;
    }
    if (!skipUntilNextInsert) {
      filteredLines.push(line);
    }
  }
  
  fs.writeFileSync('supabase/seed_core.sql', filteredLines.join('\n'));
  console.log('✓ Filtered seed file created');
  
} catch (error) {
  console.error('Failed to dump data:', error.message);
  process.exit(1);
}

// Step 2: Add appointments test data
const appointmentsData = `
-- Test Appointments Data (Local Development)
INSERT INTO appointments (
  customer_id,
  scheduled_date,
  scheduled_time,
  duration_minutes,
  status,
  issues,
  description,
  urgency,
  source,
  notes
) VALUES 
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', CURRENT_DATE + interval '1 day', '10:00:00', 30, 'scheduled', ARRAY['screen_crack'], 'Customer reports cracked screen after dropping phone', 'scheduled', 'website', 'Customer prefers morning appointments'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', CURRENT_DATE + interval '2 days', '14:30:00', 45, 'scheduled', ARRAY['battery_issue', 'charging_port'], 'Phone not holding charge', 'scheduled', 'phone', 'Customer will bring original charger'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', CURRENT_DATE, '16:00:00', 30, 'confirmed', ARRAY['water_damage'], 'Phone fell in pool', 'emergency', 'walk-in', 'Urgent - customer needs phone for work'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', CURRENT_DATE, '09:00:00', 30, 'arrived', ARRAY['software_issue'], 'Phone keeps restarting', 'scheduled', 'phone', 'Customer arrived on time'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', CURRENT_DATE - interval '1 day', '11:00:00', 30, 'no_show', ARRAY['screen_crack', 'battery_issue'], 'Multiple issues', 'scheduled', 'website', 'Customer did not show up'),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', CURRENT_DATE + interval '7 days', '15:00:00', 60, 'scheduled', ARRAY['screen_crack', 'camera_issue'], 'Screen cracked and camera not focusing', 'scheduled', 'email', 'Customer emailed for appointment')
ON CONFLICT DO NOTHING;
`;

// Step 3: Create the final seed file
console.log('Creating final seed.sql...');
fs.appendFileSync('supabase/seed_core.sql', appointmentsData);
fs.renameSync('supabase/seed_core.sql', 'supabase/seed.sql');

console.log('✓ Seed file created successfully');
console.log('\nNow run: npx supabase db reset --local');