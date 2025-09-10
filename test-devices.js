const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://egotypldqzdzjclikmeg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVnb3R5cGxkcXpkempjbGlrbWVnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjkwMzM3MSwiZXhwIjoyMDcyNDc5MzcxfQ.YAt1go3_5OaIT9yoVF1zCBrZTkA-OEfbQmWeuJjFWGk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDevices() {
  console.log('Testing device fetch...\n');
  
  // Test 1: Simple select
  console.log('Test 1: Simple select all devices');
  const { data: devices1, error: error1 } = await supabase
    .from('devices')
    .select('*')
    .limit(5);
  
  if (error1) {
    console.error('Error in simple select:', error1);
  } else {
    console.log(`Found ${devices1?.length || 0} devices`);
    if (devices1?.[0]) {
      console.log('First device:', {
        id: devices1[0].id,
        model_name: devices1[0].model_name,
        manufacturer_id: devices1[0].manufacturer_id
      });
    }
  }
  
  console.log('\n---\n');
  
  // Test 2: With manufacturer join (left join)
  console.log('Test 2: With manufacturer (left join)');
  const { data: devices2, error: error2 } = await supabase
    .from('devices')
    .select(`
      *,
      manufacturer:manufacturers (
        id,
        name,
        logo_url
      )
    `)
    .limit(5);
  
  if (error2) {
    console.error('Error with manufacturer join:', error2);
  } else {
    console.log(`Found ${devices2?.length || 0} devices with manufacturers`);
    if (devices2?.[0]) {
      console.log('First device with manufacturer:', {
        id: devices2[0].id,
        model_name: devices2[0].model_name,
        manufacturer: devices2[0].manufacturer
      });
    }
  }
  
  console.log('\n---\n');
  
  // Test 3: Active devices only
  console.log('Test 3: Active devices with manufacturer');
  const { data: devices3, error: error3 } = await supabase
    .from('devices')
    .select(`
      *,
      manufacturer:manufacturers (
        id,
        name,
        logo_url
      )
    `)
    .eq('is_active', true)
    .limit(5);
  
  if (error3) {
    console.error('Error with active devices:', error3);
  } else {
    console.log(`Found ${devices3?.length || 0} active devices`);
  }
  
  console.log('\n---\n');
  
  // Test 4: Check for devices with null manufacturer_id
  console.log('Test 4: Devices with NULL manufacturer_id');
  const { data: devices4, error: error4 } = await supabase
    .from('devices')
    .select('id, model_name, manufacturer_id')
    .is('manufacturer_id', null)
    .limit(5);
  
  if (error4) {
    console.error('Error checking null manufacturers:', error4);
  } else {
    console.log(`Found ${devices4?.length || 0} devices with NULL manufacturer_id`);
    if (devices4?.length > 0) {
      console.log('Devices with NULL manufacturer:', devices4);
    }
  }
  
  console.log('\n---\n');
  
  // Test 5: Count total devices
  console.log('Test 5: Count total devices');
  const { count, error: error5 } = await supabase
    .from('devices')
    .select('*', { count: 'exact', head: true });
  
  if (error5) {
    console.error('Error counting devices:', error5);
  } else {
    console.log(`Total devices in database: ${count}`);
  }
}

testDevices().catch(console.error);