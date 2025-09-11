import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { updateAppointmentDetails } from '@/app/(dashboard)/appointments/[id]/actions';

export async function POST(request: NextRequest) {
  try {
    const { appointmentId, technicianId, testType = 'assign' } = await request.json();
    
    if (!appointmentId) {
      return NextResponse.json({ error: 'appointmentId is required' }, { status: 400 });
    }
    
    const serviceClient = createServiceClient();
    
    // Get the appointment before update
    const { data: appointmentBefore, error: fetchError } = await serviceClient
      .from('appointments')
      .select(`
        *,
        devices (
          id,
          model_name
        ),
        customer_devices (
          id,
          serial_number
        )
      `)
      .eq('id', appointmentId)
      .single();
      
    if (fetchError) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }
    
    console.log('📋 Appointment BEFORE update:', {
      id: appointmentBefore.id,
      assigned_to: appointmentBefore.assigned_to,
      device_id: appointmentBefore.device_id,
      customer_device_id: appointmentBefore.customer_device_id,
      service_ids: appointmentBefore.service_ids,
      notes: appointmentBefore.notes,
      estimated_cost: appointmentBefore.estimated_cost
    });
    
    // Perform the update based on test type
    let updateResult;
    switch (testType) {
      case 'assign':
        console.log('🔄 Testing assignment update (should NOT reset other fields)...');
        updateResult = await updateAppointmentDetails(appointmentId, {
          assigned_to: technicianId
        });
        break;
        
      case 'unassign':
        console.log('🔄 Testing unassignment (should NOT reset other fields)...');
        updateResult = await updateAppointmentDetails(appointmentId, {
          assigned_to: null
        });
        break;
        
      case 'full-update':
        console.log('🔄 Testing full update (should update all specified fields)...');
        updateResult = await updateAppointmentDetails(appointmentId, {
          assigned_to: technicianId,
          selected_services: appointmentBefore.service_ids || [],
          customer_notes: 'Test note update',
          estimated_cost: 150
        });
        break;
        
      default:
        return NextResponse.json({ error: 'Invalid testType. Use: assign, unassign, or full-update' }, { status: 400 });
    }
    
    // Get the appointment after update
    const { data: appointmentAfter, error: fetchError2 } = await serviceClient
      .from('appointments')
      .select(`
        *,
        devices (
          id,
          model_name
        ),
        customer_devices (
          id,
          serial_number
        )
      `)
      .eq('id', appointmentId)
      .single();
      
    if (fetchError2) {
      return NextResponse.json({ error: 'Failed to fetch updated appointment' }, { status: 500 });
    }
    
    console.log('📋 Appointment AFTER update:', {
      id: appointmentAfter.id,
      assigned_to: appointmentAfter.assigned_to,
      device_id: appointmentAfter.device_id,
      customer_device_id: appointmentAfter.customer_device_id,
      service_ids: appointmentAfter.service_ids,
      notes: appointmentAfter.notes,
      estimated_cost: appointmentAfter.estimated_cost
    });
    
    // Check what changed
    const changes = {
      assigned_to: {
        before: appointmentBefore.assigned_to,
        after: appointmentAfter.assigned_to,
        changed: appointmentBefore.assigned_to !== appointmentAfter.assigned_to
      },
      device_id: {
        before: appointmentBefore.device_id,
        after: appointmentAfter.device_id,
        changed: appointmentBefore.device_id !== appointmentAfter.device_id,
        ERROR: appointmentBefore.device_id !== appointmentAfter.device_id && testType !== 'full-update'
      },
      customer_device_id: {
        before: appointmentBefore.customer_device_id,
        after: appointmentAfter.customer_device_id,
        changed: appointmentBefore.customer_device_id !== appointmentAfter.customer_device_id,
        ERROR: appointmentBefore.customer_device_id !== appointmentAfter.customer_device_id && testType !== 'full-update'
      },
      service_ids: {
        before: appointmentBefore.service_ids,
        after: appointmentAfter.service_ids,
        changed: JSON.stringify(appointmentBefore.service_ids) !== JSON.stringify(appointmentAfter.service_ids),
        ERROR: JSON.stringify(appointmentBefore.service_ids) !== JSON.stringify(appointmentAfter.service_ids) && testType !== 'full-update'
      },
      estimated_cost: {
        before: appointmentBefore.estimated_cost,
        after: appointmentAfter.estimated_cost,
        changed: appointmentBefore.estimated_cost !== appointmentAfter.estimated_cost,
        ERROR: appointmentBefore.estimated_cost !== appointmentAfter.estimated_cost && testType !== 'full-update'
      }
    };
    
    // Check for errors
    const errors = [];
    for (const [field, data] of Object.entries(changes)) {
      if (data.ERROR) {
        errors.push(`${field} was incorrectly modified! Before: ${JSON.stringify(data.before)}, After: ${JSON.stringify(data.after)}`);
      }
    }
    
    return NextResponse.json({
      success: errors.length === 0,
      testType,
      appointmentId,
      changes,
      errors: errors.length > 0 ? errors : undefined,
      message: errors.length === 0 
        ? '✅ Assignment update successful - no fields were incorrectly reset!' 
        : '❌ ERROR: Some fields were incorrectly modified during assignment update!'
    });
    
  } catch (error) {
    console.error('Test error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Test failed' },
      { status: 500 }
    );
  }
}

// GET endpoint to show usage
export async function GET() {
  return NextResponse.json({
    message: 'Appointment Assignment Bug Test Endpoint',
    usage: 'POST to this endpoint with a JSON body',
    requiredFields: ['appointmentId'],
    optionalFields: ['technicianId', 'testType'],
    testTypes: [
      {
        type: 'assign',
        description: 'Test assigning a technician (should NOT reset device/services)'
      },
      {
        type: 'unassign',
        description: 'Test unassigning a technician (should NOT reset device/services)'
      },
      {
        type: 'full-update',
        description: 'Test updating multiple fields including assignment'
      }
    ],
    exampleRequest: {
      appointmentId: 'appointment-uuid-here',
      technicianId: 'technician-uuid-here',
      testType: 'assign'
    }
  });
}