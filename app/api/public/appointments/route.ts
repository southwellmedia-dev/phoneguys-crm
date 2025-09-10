import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getRepository } from '@/lib/repositories/repository-manager';
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

    // Get repositories
    const customerRepo = getRepository.customers(true);
    const customerDeviceRepo = getRepository.customerDevices(true);
    const appointmentService = new AppointmentService(true);
    
    // Check if customer exists
    let customer = await customerRepo.findByEmail(data.customer.email);
    
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
    const existingDevices = await customerDeviceRepo.findByCustomer(customer.id);
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

    // Create form submission record
    const formSubmissionRepo = getRepository.formSubmissions(true);
    const formSubmission = await formSubmissionRepo.create({
      form_type: 'appointment',
      submission_data: body,
      customer_name: data.customer.name,
      customer_email: data.customer.email,
      customer_phone: data.customer.phone,
      device_info: data.device,
      issues: data.issues,
      preferred_date: data.appointmentDate,
      preferred_time: data.appointmentTime,
      status: 'pending',
      source_url: data.sourceUrl,
      ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      user_agent: request.headers.get('user-agent')
    });

    // Create appointment with the customer device
    const appointment = await appointmentService.createAppointment({
      customer: { id: customer.id },
      device: { id: data.device.deviceId },
      customer_device_id: customerDevice.id, // Link to the customer's device
      scheduled_date: data.appointmentDate,
      scheduled_time: normalizedTime, // Use normalized time (HH:MM format)
      duration_minutes: data.duration,
      issues: data.issues,
      description: data.issueDescription,
      source: 'website',
      notes: data.notes
    });

    // Reserve the time slot
    await availabilityService.reserveSlot(
      data.appointmentDate,
      data.appointmentTime,
      appointment.id
    );

    // Update form submission with appointment ID
    if (formSubmission) {
      await formSubmissionRepo.updateStatus(formSubmission.id, 'processed', appointment.id);
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
    console.error('Error in POST /api/public/appointments:', error);
    
    // More detailed error for debugging
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorDetails = process.env.NODE_ENV === 'development' ? errorMessage : undefined;
    
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'Failed to create appointment. Please try again or contact support.',
        details: errorDetails
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
 * Check appointment status by appointment number
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const appointmentNumber = searchParams.get('appointmentNumber');
    
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

    const appointmentRepo = getRepository.appointments(true);
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
    const supabase = (await import('@/lib/supabase/server')).createClient();
    
    // Get all admin and staff users
    const { data: users } = await supabase
      .from('users')
      .select('id, full_name, role')
      .in('role', ['admin', 'staff'])
      .eq('is_active', true);

    if (!users) return;

    // Create notification for each user
    const notifications = users.map(user => ({
      user_id: user.id,
      type: 'appointment_created',
      title: 'New Appointment Submitted',
      message: `${customer.name} has scheduled an appointment for ${appointment.scheduled_date} at ${appointment.scheduled_time}`,
      data: {
        appointment_id: appointment.id,
        appointment_number: appointment.appointment_number,
        customer_id: customer.id,
        customer_name: customer.name
      },
      priority: 'normal',
      action_url: `/appointments/${appointment.id}`,
      created_at: new Date().toISOString()
    }));

    await supabase
      .from('internal_notifications')
      .insert(notifications);

  } catch (error) {
    console.error('Error creating notifications:', error);
    // Don't fail the appointment creation if notifications fail
  }
}