import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getRepository } from '@/lib/repositories/repository-manager';
import { getPublicRepository } from '@/lib/repositories/public-repository-manager';
import { createPublicClient } from '@/lib/supabase/public';
import { AvailabilityService } from '@/lib/services/availability.service';
import { AppointmentService } from '@/lib/services/appointment.service';

// CORS headers for embeddable widget
const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGINS || '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-widget-key',
  'Access-Control-Max-Age': '86400',
};

// Schema for public form submission
const publicAppointmentSchema = z.object({
  // Customer info
  customer: z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Invalid email'),
    phone: z.string().min(10, 'Phone number is required'),
    address: z.string().optional(),
  }),
  
  // Device info
  device: z.object({
    deviceId: z.string().uuid(),
    serialNumber: z.string().optional(),
    imei: z.string().optional(),
    color: z.string().optional(),
    storageSize: z.string().optional(),
    condition: z.string().optional(),
  }),
  
  // Issues/Services
  issues: z.array(z.string()).min(1, 'At least one issue must be selected'),
  issueDescription: z.string().optional(),
  
  // Appointment details
  appointmentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  appointmentTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/), // Accept HH:MM or HH:MM:SS
  duration: z.number().int().positive().default(30),
  
  // Metadata
  source: z.literal('website').default('website'),
  sourceUrl: z.string().url().optional(),
  notes: z.string().optional(),
});

/**
 * POST /api/public/appointments
 * Create appointment from public form submission
 */
export async function POST(request: NextRequest) {
  try {
    // Get request data
    const body = await request.json();
    
    // Validate input
    const validation = publicAppointmentSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: validation.error.flatten()
        },
        { 
          status: 400,
          headers: corsHeaders
        }
      );
    }

    const data = validation.data;
    
    // Normalize time format (remove seconds if present)
    const normalizedTime = data.appointmentTime.includes(':') && data.appointmentTime.split(':').length === 3
      ? data.appointmentTime.substring(0, 5) // Convert HH:MM:SS to HH:MM
      : data.appointmentTime;
    
    // Check slot availability
    const availabilityService = new AvailabilityService(true);
    const isAvailable = await availabilityService.isSlotAvailable(
      data.appointmentDate,
      data.appointmentTime, // Use original format for availability check
      data.duration
    );

    if (!isAvailable) {
      return NextResponse.json(
        {
          success: false,
          error: 'Time slot unavailable',
          message: 'The selected time slot is no longer available. Please choose another time.'
        },
        { 
          status: 409,
          headers: corsHeaders
        }
      );
    }

    // Get repositories - use public client for proper anon access
    // This ensures we're using the anon role without any cookie interference
    const customerRepo = getPublicRepository.customers();
    const customerDeviceRepo = getPublicRepository.customerDevices();
    
    // Create appointment service but we'll use the repositories directly
    // since we can't override the service's internal repositories
    const appointmentRepo = getPublicRepository.appointments();
    
    // Check if customer exists
    // Use findOne directly instead of findByEmail to avoid bundling issues
    let customer = await customerRepo.findOne({ email: data.customer.email });
    
    if (!customer) {
      // Create new customer
      customer = await customerRepo.create({
        name: data.customer.name,
        email: data.customer.email,
        phone: data.customer.phone,
        address: data.customer.address,
        created_at: new Date().toISOString()
      });
    }

    // Create or find customer device
    let customerDevice = null;
    
    // Check if customer already has this device
    // Use findAll with filters instead of findByCustomer to avoid bundling issues
    const existingDevices = await customerDeviceRepo.findAll({ 
      customer_id: customer.id,
      is_active: true 
    });
    customerDevice = existingDevices.find(d => 
      d.device_id === data.device.deviceId &&
      (!data.device.serialNumber || d.serial_number === data.device.serialNumber)
    );
    
    if (!customerDevice) {
      // Create new customer device
      customerDevice = await customerDeviceRepo.create({
        customer_id: customer.id,
        device_id: data.device.deviceId,
        serial_number: data.device.serialNumber || null,
        imei: data.device.imei || null,
        color: data.device.color || null,
        storage_size: data.device.storageSize || null,
        condition: data.device.condition || null,
        is_primary: existingDevices.length === 0, // First device is primary
        created_at: new Date().toISOString()
      });
    }

    // Create appointment with the customer device FIRST
    const appointmentData = {
      customer_id: customer.id,
      device_id: data.device.deviceId || null,
      customer_device_id: customerDevice.id,
      scheduled_date: data.appointmentDate,
      scheduled_time: normalizedTime,
      duration_minutes: data.duration || 30,
      issues: data.issues || null,
      description: data.issueDescription || null,
      source: 'website', // This must be 'website' for RLS policy
      urgency: 'scheduled',
      notes: data.notes || null,
      status: 'scheduled'
    };
    
    console.log('Creating appointment with full data:', JSON.stringify(appointmentData, null, 2));
    
    // Create appointment directly using Supabase client to ensure proper anon access
    const publicClient = createPublicClient();
    
    // First, let's test if we can even access the appointments table
    console.log('Testing appointments table access...');
    const { error: testError } = await publicClient
      .from('appointments')
      .select('id')
      .limit(1);
    
    if (testError) {
      console.error('Cannot SELECT from appointments table:', testError);
    } else {
      console.log('SELECT test passed - can read appointments table');
    }
    
    // Now try the actual insert
    console.log('Attempting to insert appointment...');
    const { data: appointment, error: appointmentError } = await publicClient
      .from('appointments')
      .insert(appointmentData)
      .select()
      .single();

    if (appointmentError) {
      console.error('Detailed appointment creation error:', {
        message: appointmentError.message,
        details: appointmentError.details,
        hint: appointmentError.hint,
        code: appointmentError.code,
        appointmentData
      });
      throw new Error(`Failed to create appointment: ${appointmentError.message}`);
    }

    if (!appointment) {
      throw new Error('Failed to create appointment: No data returned');
    }

    // Reserve the time slot (skip for now as it may have auth issues)
    // TODO: Fix availability service to work with public client
    // await availabilityService.reserveSlot(
    //   data.appointmentDate,
    //   data.appointmentTime,
    //   appointment.id
    // );

    // NOW create form submission record with appointment ID (after successful appointment creation)
    const formSubmissionRepo = getPublicRepository.formSubmissions();
    let formSubmission = null;
    try {
      formSubmission = await formSubmissionRepo.create({
        form_type: 'appointment',
        submission_data: body,
        customer_name: data.customer.name,
        customer_email: data.customer.email,
        customer_phone: data.customer.phone,
        device_info: data.device,
        issues: data.issues,
        preferred_date: data.appointmentDate,
        preferred_time: data.appointmentTime,
        status: 'processed', // Mark as processed immediately since appointment was created
        appointment_id: appointment.id, // Include the appointment ID directly
        source_url: data.sourceUrl,
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        user_agent: request.headers.get('user-agent')
      });
    } catch (error) {
      // Log error but don't fail the appointment creation
      console.error('Failed to create form submission record:', error);
    }

    // Create internal notifications for admins/staff
    const notificationRepo = await createInternalNotifications(appointment, customer);

    return NextResponse.json(
      {
        success: true,
        data: {
          appointmentId: appointment.id,
          appointmentNumber: appointment.appointment_number,
          status: appointment.status,
          scheduledDate: appointment.scheduled_date,
          scheduledTime: appointment.scheduled_time,
          message: `Your appointment has been scheduled successfully. Your appointment number is ${appointment.appointment_number}. We'll send a confirmation email to ${data.customer.email}.`
        }
      },
      { 
        status: 201,
        headers: corsHeaders
      }
    );

  } catch (error) {
    // Enhanced error logging for debugging
    console.error('Error in POST /api/public/appointments:', {
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : error,
      url: request.url,
      timestamp: new Date().toISOString()
    });
    
    // More detailed error for debugging
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const isDev = process.env.NODE_ENV === 'development';
    
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'Failed to create appointment. Please try again or contact support.',
        details: isDev ? {
          error: errorMessage,
          timestamp: new Date().toISOString()
        } : undefined
      },
      { 
        status: 500,
        headers: corsHeaders
      }
    );
  }
}

/**
 * GET /api/public/appointments
 * Check appointment status by appointment number OR run debug diagnostics
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const appointmentNumber = searchParams.get('appointmentNumber');
    const debug = searchParams.get('debug');
    
    // Debug mode - run RLS diagnostics
    if (debug === 'true') {
      const publicClient = createPublicClient();
      
      // Run the diagnostic function
      const { data: diagnostic, error: diagError } = await publicClient
        .rpc('debug_appointment_insert', {
          p_customer_id: 'a462e5b4-76e7-4762-9bbd-bdcad2963f46',
          p_device_id: '3813aef0-341c-4555-a57b-79aaf1c60ae6',
          p_customer_device_id: 'eae34363-535b-499d-98b4-51007a738bed',
          p_scheduled_date: '2025-01-15',
          p_scheduled_time: '10:00',
          p_source: 'website'
        });
      
      if (diagError) {
        return NextResponse.json(
          {
            success: false,
            error: 'Diagnostic failed',
            details: diagError
          },
          { 
            status: 500,
            headers: corsHeaders
          }
        );
      }
      
      return NextResponse.json(
        {
          success: true,
          diagnostic: diagnostic,
          message: 'Diagnostic results - check the diagnostic object for details'
        },
        { headers: corsHeaders }
      );
    }
    
    if (!appointmentNumber) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing appointment number',
          message: 'Please provide an appointment number to check status'
        },
        { 
          status: 400,
          headers: corsHeaders
        }
      );
    }

    const appointmentRepo = getRepository.appointments(false);
    const appointment = await appointmentRepo.findByAppointmentNumber(appointmentNumber);

    if (!appointment) {
      return NextResponse.json(
        {
          success: false,
          error: 'Not found',
          message: 'No appointment found with this number'
        },
        { 
          status: 404,
          headers: corsHeaders
        }
      );
    }

    // Get customer info
    const customer = appointment.customers || {};

    return NextResponse.json(
      {
        success: true,
        data: {
          appointmentNumber: appointment.appointment_number,
          status: appointment.status,
          scheduledDate: appointment.scheduled_date,
          scheduledTime: appointment.scheduled_time,
          customerName: customer.name,
          device: appointment.devices ? 
            `${appointment.devices.manufacturer?.name} ${appointment.devices.model_name}` : null,
          issues: appointment.issues,
          estimatedCost: appointment.estimated_cost,
          createdAt: appointment.created_at
        }
      },
      { headers: corsHeaders }
    );

  } catch (error) {
    console.error('Error in GET /api/public/appointments:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'Failed to fetch appointment status'
      },
      { 
        status: 500,
        headers: corsHeaders
      }
    );
  }
}

/**
 * OPTIONS /api/public/appointments
 * Handle CORS preflight requests
 */
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}

// Helper function to create internal notifications
async function createInternalNotifications(appointment: any, customer: any) {
  try {
    // Note: Internal notifications are handled by database triggers
    // The notify_on_appointment_created() trigger will create notifications
    // for all admin and staff users automatically
    console.log('Appointment created, notifications will be sent via database trigger');
    
    // We don't need to manually create notifications here since the database
    // trigger handles it. This avoids authentication issues in public endpoints.
    
  } catch (error) {
    console.error('Error in notification helper:', error);
    // Don't fail the appointment creation if this fails
  }
}