import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const { deviceId } = await request.json();
    
    // Create a public client with anon key
    const publicClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    // Check if device exists
    const { data: device, error: deviceError } = await publicClient
      .from('devices')
      .select('id, brand, model')
      .eq('id', deviceId)
      .single();
    
    if (deviceError) {
      return NextResponse.json({ 
        error: 'Device lookup failed', 
        details: deviceError,
        deviceId 
      });
    }
    
    // Try to create a test customer device
    const testCustomerId = '8164d349-4e7f-4702-9da6-b3a8c91198c8'; // John Doe from seed
    
    const { data: customerDevice, error: cdError } = await publicClient
      .from('customer_devices')
      .insert({
        customer_id: testCustomerId,
        device_id: deviceId,
        serial_number: 'TEST123',
        is_primary: false
      })
      .select()
      .single();
    
    if (cdError) {
      return NextResponse.json({ 
        error: 'Customer device creation failed', 
        details: cdError,
        device,
        deviceId,
        customerId: testCustomerId
      });
    }
    
    // Clean up test data
    if (customerDevice) {
      await publicClient
        .from('customer_devices')
        .delete()
        .eq('id', customerDevice.id);
    }
    
    return NextResponse.json({ 
      success: true, 
      device,
      message: 'Device exists and can be linked to customers'
    });
    
  } catch (error) {
    return NextResponse.json({ 
      error: 'Test failed', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}