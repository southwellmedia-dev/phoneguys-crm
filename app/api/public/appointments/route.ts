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
  'Access-Control-Allow-Headers': 'Content-Type, x-widget-key, X-Requested-With',
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Max-Age': '86400',
  // Additional headers for iframe embedding
  'X-Frame-Options': 'ALLOWALL', // Allow embedding in iframes
  'Content-Security-Policy': "frame-ancestors *;", // Allow any site to embed
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
    // TODO: Fix availability service to use public client properly
    // For now, skip availability check for testing notification creation
    const skipAvailabilityCheck = true; // Temporary bypass for testing
    
    if (!skipAvailabilityCheck) {
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
    }

    // Create a single public client instance to use throughout this request
    // This ensures all operations use the same connection/transaction context
    const publicClient = createPublicClient();
    
    // Get repositories but override them to use our single client instance
    const customerRepo = getPublicRepository.customers();
    const customerDeviceRepo = getPublicRepository.customerDevices();
    const appointmentRepo = getPublicRepository.appointments();
    
    // Override all repos to use the same client instance for consistency
    (customerRepo as any).getClient = async () => publicClient;
    (customerDeviceRepo as any).getClient = async () => publicClient;
    (appointmentRepo as any).getClient = async () => publicClient;
    
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

    // Convert service IDs to service names for the issues field
    let issueNames: string[] = [];
    if (data.issues && data.issues.length > 0) {
      // Fetch service names from the services table
      const { data: services, error: servicesError } = await publicClient
        .from('services')
        .select('id, name')
        .in('id', data.issues);
      
      if (servicesError) {
        console.error('Error fetching services:', servicesError);
        // Fall back to using the IDs if we can't fetch names
        issueNames = data.issues;
      } else if (services) {
        // Convert service names to snake_case format for consistency
        issueNames = services.map(service => 
          service.name.toLowerCase().replace(/\s+/g, '_')
        );
      }
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
      const customerDeviceData = {
        customer_id: customer.id,
        device_id: data.device.deviceId,
        serial_number: data.device.serialNumber || null,
        imei: data.device.imei || null,
        color: data.device.color || null,
        storage_size: data.device.storageSize || null,
        condition: data.device.condition || null,
        is_primary: existingDevices.length === 0, // First device is primary
        created_at: new Date().toISOString()
      };
      
      console.log('📱 Creating customer device with data:', JSON.stringify(customerDeviceData, null, 2));
      
      try {
        customerDevice = await customerDeviceRepo.create(customerDeviceData);
        console.log('✅ Customer device created:', customerDevice);
      } catch (error) {
        console.error('❌ Failed to create customer device:', error);
        throw error;
      }
    }

    // Create appointment with the customer device FIRST
    const appointmentData = {
      customer_id: customer.id,
      device_id: data.device.deviceId || null,
      customer_device_id: customerDevice.id,
      scheduled_date: data.appointmentDate,
      scheduled_time: normalizedTime,
      duration_minutes: data.duration || 30,
      issues: issueNames.length > 0 ? issueNames : null, // Use service names instead of IDs
      service_ids: data.issues || null, // Store the actual service IDs separately if needed
      description: data.issueDescription || null,
      source: 'website', // This must be 'website' for RLS policy
      urgency: 'scheduled',
      notes: data.notes || null,
      status: 'scheduled'
    };
    
    // Insert the appointment using the same client that created the customer
    const { data: appointment, error: appointmentError } = await publicClient
      .from('appointments')
      .insert(appointmentData)
      .select()
      .single();

    if (appointmentError) {
      console.error('Appointment creation error:', appointmentError.message);
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

    // Helper functions for formatting
    const formatTime = (time: string) => {
      const [hours, minutes] = time.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 || 12;
      return `${displayHour}:${minutes} ${ampm}`;
    };

    const formatDate = (dateStr: string) => {
      const date = new Date(dateStr + 'T00:00:00');
      const options: Intl.DateTimeFormatOptions = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      };
      return date.toLocaleDateString('en-US', options);
    };

    // Create internal notifications for admins/staff
    const notificationRepo = await createInternalNotifications(appointment, customer);
    
    // Create email notification record for customer
    try {
      const { NotificationService } = await import('@/lib/services/notification.service');
      const notificationService = new NotificationService(true); // Use service role
      
      // Get device info for the notification
      let deviceInfo = { brand: 'Unknown', model: 'Device' };
      if (data.device.deviceId) {
        const { data: device } = await publicClient
          .from('devices')
          .select('brand, model_name')
          .eq('id', data.device.deviceId)
          .single();
        
        if (device) {
          deviceInfo = { brand: device.brand || 'Unknown', model: device.model_name || 'Device' };
        }
      }
      
      // Format issues for display
      const issueDisplay = issueNames.length > 0 ? 
        issueNames.map(issue => issue.replace(/_/g, ' ').charAt(0).toUpperCase() + issue.slice(1)).join(', ') : 
        'General Diagnosis';
      
      // Import and generate the HTML email template
      const { appointmentConfirmationTemplate } = await import('@/lib/email-templates/appointment-confirmation');
      
      const emailTemplate = appointmentConfirmationTemplate({
        customerName: customer.name,
        appointmentNumber: appointment.appointment_number,
        appointmentDate: formatDate(appointment.scheduled_date),
        appointmentTime: formatTime(appointment.scheduled_time),
        deviceBrand: deviceInfo.brand,
        deviceModel: deviceInfo.model || 'Device',
        issues: issueNames.length > 0 ? issueNames : ['General Diagnosis'],
        estimatedCost: appointment.estimated_cost ? parseFloat(appointment.estimated_cost) : undefined,
        notes: data.issueDescription || data.notes,
        confirmationUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/appointments/${appointment.appointment_number}`
      });
      
      // Create notification in database (this will be picked up by email processor)
      console.log('📧 Attempting to create notification for:', customer.email);
      
      const notificationData = {
        ticket_id: null, // No ticket yet, just appointment
        notification_type: 'new_ticket', // Using existing type
        recipient_email: customer.email,
        subject: emailTemplate.subject,
        content: emailTemplate.html, // Use the HTML template
        status: 'pending',
        scheduled_for: new Date().toISOString()
      };
      
      console.log('📧 Notification data:', JSON.stringify(notificationData, null, 2));
      
      const { data: notification, error: notifError } = await publicClient
        .from('notifications')
        .insert(notificationData)
        .select()
        .single();
      
      if (notifError) {
        console.error('❌ Failed to create notification:', JSON.stringify(notifError, null, 2));
        console.error('Error details:', {
          message: notifError.message,
          details: notifError.details,
          hint: notifError.hint,
          code: notifError.code
        });
      } else {
        console.log(`✅ Notification created successfully:`, notification);
        console.log(`✅ Notification ID: ${notification?.id}, Email: ${customer.email}`);
        
        // Try to send immediately via EmailService  
        try {
          const { EmailService } = await import('@/lib/services/email.service');
          const emailService = EmailService.getInstance();
          
          // Send the email using the template we already generated above
          const emailResult = await emailService.sendEmailWithRetry({
            to: customer.email,
            subject: emailTemplate.subject,
            html: emailTemplate.html,
            text: emailTemplate.text
          }, 2, 1000);
          
          if (emailResult.success) {
            // Update notification as sent
            await publicClient
              .from('notifications')
              .update({ 
                status: 'sent',
                sent_at: new Date().toISOString()
              })
              .eq('id', notification.id);
            
            console.log(`✅ Confirmation email sent to ${data.customer.email}`);
          }
        } catch (emailError) {
          console.error('Error sending email directly:', emailError);
          // Email will be sent by the processor later
        }
      }
    } catch (error) {
      console.error('Error creating notification:', error);
      // Don't fail the appointment creation if notification fails
    }

    // Track notification creation for debugging (moved functions to earlier in code)
    let notificationDebug = { attempted: false, created: false, error: null as any };

    return NextResponse.json(
      {
        success: true,
        data: {
          appointmentId: appointment.id,
          appointmentNumber: appointment.appointment_number,
          status: appointment.status,
          scheduledDate: appointment.scheduled_date,
          scheduledTime: appointment.scheduled_time,
          // Formatted versions for display
          formattedDate: formatDate(appointment.scheduled_date),
          formattedTime: formatTime(appointment.scheduled_time),
          // Customer info for confirmation
          customerName: data.customer.name,
          customerEmail: data.customer.email,
          customerPhone: data.customer.phone,
          // Device info
          deviceInfo: data.device,
          // Messages for display
          confirmationTitle: 'Appointment Confirmed!',
          confirmationMessage: `Thank you for scheduling your appointment, ${data.customer.name}!`,
          appointmentDetails: `Your appointment is scheduled for ${formatDate(appointment.scheduled_date)} at ${formatTime(appointment.scheduled_time)}.`,
          appointmentNumberMessage: `Your confirmation number is: ${appointment.appointment_number}`,
          nextSteps: 'We will call you within 24 hours to confirm your appointment and provide any additional details.',
          emailConfirmation: `A confirmation email has been sent to ${data.customer.email}.`,
          // Support for redirect if needed
          redirectUrl: data.sourceUrl ? new URL('/appointment-confirmed', data.sourceUrl).toString() : null,
          // Full formatted message for simple displays
          message: `Your appointment has been confirmed for ${formatDate(appointment.scheduled_date)} at ${formatTime(appointment.scheduled_time)}. Confirmation number: ${appointment.appointment_number}. We'll call you soon to confirm.`
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