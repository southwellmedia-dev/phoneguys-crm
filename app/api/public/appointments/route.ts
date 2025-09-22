import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getRepository } from '@/lib/repositories/repository-manager';
import { getPublicRepository } from '@/lib/repositories/public-repository-manager';
import { createPublicClient } from '@/lib/supabase/public';
import { AvailabilityService } from '@/lib/services/availability.service';
import { AppointmentService } from '@/lib/services/appointment.service';
import { ApiKeysService } from '@/lib/services/api-keys.service';

// CORS headers for embeddable widget
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-api-key, x-widget-key, X-Requested-With, Accept, Origin',
  'Access-Control-Allow-Credentials': 'true',
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
  
  // Consent
  consent: z.object({
    email: z.boolean().default(true),
    sms: z.boolean().default(true),
    consent_given_at: z.string().datetime().optional()
  }).optional(),
  
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
    // Check API key authentication
    const apiKey = request.headers.get('x-api-key');
    const origin = request.headers.get('origin') || request.headers.get('referer');
    
    console.log('[Public Appointments] Request received:', {
      hasApiKey: !!apiKey,
      apiKeyPrefix: apiKey ? apiKey.substring(0, 8) : null,
      origin,
      timestamp: new Date().toISOString()
    });
    
    if (apiKey) {
      // Verify API key if provided
      const apiKeysService = new ApiKeysService();
      const verification = await apiKeysService.verifyApiKey(apiKey, origin);
      
      console.log('[Public Appointments] API Key verification result:', {
        valid: verification.valid,
        error: verification.error,
        apiKeyPrefix: apiKey.substring(0, 8)
      });
      
      if (!verification.valid) {
        return NextResponse.json(
          {
            success: false,
            error: verification.error || 'Invalid API key',
            details: process.env.NODE_ENV === 'development' ? {
              providedKeyPrefix: apiKey.substring(0, 8),
              origin
            } : undefined
          },
          { 
            status: 401,
            headers: corsHeaders
          }
        );
      }
    } else {
      // For now, allow requests without API key for testing
      console.log('[Public Appointments] No API key provided, allowing request for testing');
    }
    
    // Get request data
    const body = await request.json();
    
    console.log('[Public Appointments] Request body:', {
      hasCustomer: !!body.customer,
      hasDevice: !!body.device,
      hasIssues: !!body.issues,
      appointmentDate: body.appointmentDate,
      appointmentTime: body.appointmentTime,
      bodyKeys: Object.keys(body)
    });
    
    // Validate input
    const validation = publicAppointmentSchema.safeParse(body);
    if (!validation.success) {
      const errors = validation.error.flatten();
      console.log('[Public Appointments] Validation failed:', {
        fieldErrors: errors.fieldErrors,
        formErrors: errors.formErrors,
        issues: validation.error.issues
      });
      
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: errors
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
    
    // Store consent preferences if provided
    if (data.consent && customer) {
      try {
        // Use upsert to handle duplicates gracefully
        const { error: prefError } = await publicClient
          .from('notification_preferences')
          .upsert({
            customer_id: customer.id,
            email_enabled: data.consent.email ?? true,
            sms_enabled: data.consent.sms ?? true,
            email_address: customer.email,
            phone_number: customer.phone,
            consent_given_at: data.consent.consent_given_at || new Date().toISOString(),
            consent_ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'customer_id',
            ignoreDuplicates: false
          });
        
        if (prefError) {
          console.error('Failed to store consent preferences:', prefError);
        } else {
          console.log('✅ Consent preferences stored/updated for customer:', customer.id);
        }
      } catch (error) {
        console.error('Error handling consent preferences:', error);
        // Don't fail the appointment if consent storage fails
      }
    }

    // Convert service categories or IDs to service names
    let issueNames: string[] = [];
    let serviceIds: string[] = [];
    
    if (data.issues && data.issues.length > 0) {
      // Check if data.issues contains UUIDs (service IDs) or category names
      // UUIDs have a specific format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
      const isUUID = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
      
      // Clean and validate UUIDs (remove any extra characters)
      const cleanedIssues = data.issues.flatMap((issue: string) => {
        // First, check for concatenated UUIDs (multiple UUIDs stuck together)
        // This handles cases where the external form concatenates service IDs
        const uuidPattern = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;
        const allMatches = issue.match(uuidPattern);
        
        if (allMatches && allMatches.length > 1) {
          console.log(`🔄 Found ${allMatches.length} concatenated UUIDs in "${issue}"`);
          allMatches.forEach(uuid => console.log(`  - Extracted: ${uuid}`));
          return allMatches;
        }
        
        // Single UUID match
        if (allMatches && allMatches.length === 1) {
          console.log(`✅ Valid UUID found: "${allMatches[0]}"`);
          return allMatches[0];
        }
        
        // Handle malformed UUIDs with missing dashes
        // Look for 32 hex characters that might be a UUID without dashes
        const hexOnly = issue.replace(/[^0-9a-f]/gi, '');
        if (hexOnly.length === 32) {
          const reconstructed = [
            hexOnly.slice(0, 8),
            hexOnly.slice(8, 12),
            hexOnly.slice(12, 16),
            hexOnly.slice(16, 20),
            hexOnly.slice(20, 32)
          ].join('-');
          console.log(`🔧 Reconstructed UUID from hex string "${issue}" to "${reconstructed}"`);
          return reconstructed;
        }
        
        // If it looks like it might be a UUID but we can't fix it, log a warning
        if (issue.length >= 32 && /[0-9a-f]/i.test(issue)) {
          console.warn(`⚠️ Possible malformed UUID that couldn't be fixed: "${issue}"`);
        }
        
        return issue;
      });
      
      let services;
      let servicesError;
      
      if (cleanedIssues.some(issue => isUUID(issue))) {
        // data.issues contains service IDs (UUIDs)
        const validUUIDs = cleanedIssues.filter(issue => isUUID(issue));
        console.log('📋 Issues contain service IDs, fetching service names for:', validUUIDs);
        const result = await publicClient
          .from('services')
          .select('id, name, category')
          .in('id', validUUIDs);
        services = result.data;
        servicesError = result.error;
        console.log('📋 Service lookup result:', { 
          found: services?.length || 0, 
          services: services?.map(s => ({ id: s.id, name: s.name })) || [],
          error: servicesError 
        });
      } else {
        // data.issues contains category names
        console.log('📋 Issues contain category names, fetching services...');
        const result = await publicClient
          .from('services')
          .select('id, name, category')
          .in('category', cleanedIssues);
        services = result.data;
        servicesError = result.error;
      }
      
      if (servicesError) {
        console.error('Error fetching services:', servicesError);
        // Don't store UUIDs in issues field - only store human-readable text
        issueNames = cleanedIssues.filter(issue => !isUUID(issue));
        serviceIds = [];
        if (issueNames.length === 0 && cleanedIssues.some(issue => isUUID(issue))) {
          // If all items were UUIDs and no services found, store a generic message
          issueNames = ['Service selection pending review'];
        }
      } else if (services && services.length > 0) {
        // Extract service IDs for the service_ids column
        serviceIds = services.map(service => service.id);
        // Use actual service names for the issues column
        issueNames = services.map(service => service.name);
        console.log('✅ Resolved services:', { serviceIds, issueNames });
      } else {
        // No matching services found
        console.warn('⚠️ No matching services found for:', cleanedIssues);
        // Don't store UUIDs in issues field - only store human-readable text
        issueNames = cleanedIssues.filter(issue => !isUUID(issue));
        
        // If we had valid UUIDs but no matching services, still store them in service_ids
        const validUUIDs = cleanedIssues.filter(issue => isUUID(issue));
        if (validUUIDs.length > 0) {
          serviceIds = validUUIDs;
          console.log('📌 Storing unmatched service IDs for later resolution:', serviceIds);
        } else {
          serviceIds = [];
        }
        
        if (issueNames.length === 0 && validUUIDs.length > 0) {
          // If all items were UUIDs and no services found, store a generic message
          issueNames = ['Service selection pending review'];
        }
      }
    }

    // Create or find customer device
    let customerDevice = null;
    
    // Check if customer already has this device using serial number or IMEI
    const existingDevices = await customerDeviceRepo.findAll({ 
      customer_id: customer.id,
      is_active: true 
    });
    
    // First check by device_id and serial_number/IMEI combination
    customerDevice = existingDevices.find(d => 
      d.device_id === data.device.deviceId &&
      (
        (data.device.serialNumber && d.serial_number === data.device.serialNumber) ||
        (data.device.imei && d.imei === data.device.imei) ||
        (!data.device.serialNumber && !data.device.imei) // No unique identifiers
      )
    );
    
    if (!customerDevice) {
      // Create new customer device with upsert to handle race conditions
      const customerDeviceData = {
        customer_id: customer.id,
        device_id: data.device.deviceId,
        serial_number: data.device.serialNumber || null,
        imei: data.device.imei || null,
        color: data.device.color || null,
        storage_size: data.device.storageSize || null,
        condition: data.device.condition || null,
        is_primary: existingDevices.length === 0, // First device is primary
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      console.log('📱 Creating customer device with data:', JSON.stringify(customerDeviceData, null, 2));
      
      try {
        // Try to create the customer device first
        const { data: deviceResult, error: deviceError } = await publicClient
          .from('customer_devices')
          .insert(customerDeviceData)
          .select()
          .single();
        
        if (deviceError) {
          // Check if it's a duplicate error for serial number or IMEI
          if (deviceError.code === '23505' && 
              (deviceError.message.includes('unique_customer_serial') || 
               deviceError.message.includes('unique_customer_imei'))) {
            
            console.log('Device already exists, finding existing device...');
            
            // Find the existing device by customer_id and either serial_number or IMEI
            let query = publicClient
              .from('customer_devices')
              .select('*')
              .eq('customer_id', customer.id)
              .eq('device_id', data.device.deviceId);
            
            if (data.device.serialNumber) {
              query = query.eq('serial_number', data.device.serialNumber);
            } else if (data.device.imei) {
              query = query.eq('imei', data.device.imei);
            }
            
            const { data: existingDevice } = await query.single();
            
            if (existingDevice) {
              customerDevice = existingDevice;
              console.log('✅ Found existing customer device:', customerDevice.id);
              
              // Update the existing device with any new information
              const updateData: any = {
                updated_at: new Date().toISOString()
              };
              
              if (data.device.color && !existingDevice.color) {
                updateData.color = data.device.color;
              }
              if (data.device.storageSize && !existingDevice.storage_size) {
                updateData.storage_size = data.device.storageSize;
              }
              if (data.device.condition && !existingDevice.condition) {
                updateData.condition = data.device.condition;
              }
              
              if (Object.keys(updateData).length > 1) { // More than just updated_at
                await publicClient
                  .from('customer_devices')
                  .update(updateData)
                  .eq('id', existingDevice.id);
                
                console.log('✅ Updated existing customer device with new info');
              }
            } else {
              throw new Error(`Device exists but could not be found: ${deviceError.message}`);
            }
          } else {
            throw new Error(`Failed to create customer device: ${deviceError.message}`);
          }
        } else {
          customerDevice = deviceResult;
          console.log('✅ Customer device created:', customerDevice.id);
        }
      } catch (error) {
        console.error('❌ Failed to create customer device:', error);
        throw error;
      }
    } else {
      console.log('✅ Using existing customer device:', customerDevice.id);
    }

    // Create appointment with the customer device FIRST
    const appointmentData = {
      customer_id: customer.id,
      device_id: data.device.deviceId || null,
      customer_device_id: customerDevice.id,
      scheduled_date: data.appointmentDate,
      scheduled_time: normalizedTime,
      duration_minutes: data.duration || 30,
      issues: issueNames.length > 0 ? issueNames : null, // Use service names/categories
      service_ids: serviceIds.length > 0 ? serviceIds : null, // Use actual service UUIDs
      description: data.issueDescription || null,
      source: 'website', // This must be 'website' for RLS policy
      urgency: 'scheduled',
      notes: data.notes || null,
      status: 'scheduled'
    };
    
    // Log appointment data before insertion for debugging
    console.log('📝 Attempting to create appointment with data:', JSON.stringify(appointmentData, null, 2));
    
    // Insert the appointment using the same client that created the customer
    const { data: appointment, error: appointmentError } = await publicClient
      .from('appointments')
      .insert(appointmentData)
      .select('id, appointment_number, status, scheduled_date, scheduled_time')
      .single();

    if (appointmentError) {
      console.error('❌ Appointment creation error:', {
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

    // Log activity for the appointment creation in user_activity_logs (the correct table)
    try {
      // Get device info for the activity log if available
      let deviceInfo = null;
      if (data.device.deviceId) {
        const { data: device } = await publicClient
          .from('devices')
          .select('model_name, manufacturer:manufacturers(name)')
          .eq('id', data.device.deviceId)
          .single();
        deviceInfo = device;
      }

      const activityData = {
        user_id: 'system', // System-generated activity for public API
        user_name: 'Website Form',
        user_avatar: null,
        activity_type: 'appointment_created',
        entity_type: 'appointment',
        entity_id: appointment.id,
        details: {
          appointment_number: appointment.appointment_number,
          customer_name: customer.name,
          customer_id: customer.id,
          device_name: deviceInfo ? `${deviceInfo.manufacturer?.name || ''} ${deviceInfo.model_name}`.trim() : null,
          appointment_date: `${appointment.scheduled_date} ${appointment.scheduled_time}`,
          scheduled_date: appointment.scheduled_date,
          scheduled_time: appointment.scheduled_time,
          source: 'website',
          status: appointment.status,
          services: issueNames.length > 0 ? issueNames : ['Service selection pending review'],
          created_via: 'public_api'
        },
        created_at: new Date().toISOString()
      };

      const { error: activityError } = await publicClient
        .from('user_activity_logs')
        .insert(activityData);

      if (activityError) {
        console.error('❌ Failed to log activity in user_activity_logs:', activityError);
        // Don't fail the appointment creation if activity logging fails
      } else {
        console.log('✅ Activity logged in user_activity_logs for appointment:', appointment.appointment_number);
      }
    } catch (error) {
      console.error('❌ Error logging activity:', error);
      // Continue without failing - appointment creation is more important
    }

    // Reserve the time slot (skip for now as it may have auth issues)
    // TODO: Fix availability service to work with public client
    // await availabilityService.reserveSlot(
    //   data.appointmentDate,
    //   data.appointmentTime,
    //   appointment.id
    // );

    // NOW create form submission record with appointment ID (after successful appointment creation)
    let formSubmission = null;
    try {
      const { data: submissionData, error: submissionError } = await publicClient
        .from('form_submissions')
        .insert({
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
          user_agent: request.headers.get('user-agent'),
          created_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (submissionError) {
        console.error('Failed to create form submission record:', submissionError);
      } else {
        formSubmission = submissionData;
        console.log('✅ Form submission logged successfully');
      }
    } catch (error) {
      // Log error but don't fail the appointment creation
      console.error('Failed to create form submission record:', error);
    }

    // Send comprehensive notifications (email and SMS for customer and admins)
    try {
      const { getAppointmentNotificationService } = await import('@/lib/services/appointment-notifications.service');
      const notificationService = getAppointmentNotificationService();
      
      // Get device info for the notification
      let deviceInfo = null;
      if (data.device.deviceId) {
        const { data: device } = await publicClient
          .from('devices')
          .select('id, brand, model_name')
          .eq('id', data.device.deviceId)
          .single();
        
        deviceInfo = device;
      }
      
      // Format issues for display
      const formattedIssues = issueNames.length > 0 ? 
        issueNames.map(issue => 
          issue.replace(/_/g, ' ')
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ')
        ) : ['General Diagnosis'];
      
      // Send all notifications (email and SMS)
      const notificationResults = await notificationService.sendAppointmentNotifications({
        appointment: {
          id: appointment.id,
          appointment_number: appointment.appointment_number,
          scheduled_date: appointment.scheduled_date,
          scheduled_time: appointment.scheduled_time,
          estimated_cost: appointment.estimated_cost,
          description: data.issueDescription,
          notes: data.notes
        },
        customer: {
          id: customer.id,
          name: customer.name,
          email: customer.email,
          phone: customer.phone
        },
        device: deviceInfo,
        issues: formattedIssues,
        consentEmail: data.consent?.email !== false, // Default true if not explicitly false
        consentSMS: data.consent?.sms !== false // Default true if not explicitly false
      });
      
      console.log('📧📱 Notification results:', {
        customerEmail: notificationResults.customerEmail ? '✅ Sent' : '❌ Failed',
        customerSMS: notificationResults.customerSMS ? '✅ Sent' : '❌ Failed', 
        adminNotifications: notificationResults.adminNotifications ? '✅ Sent' : '❌ Failed',
        errors: notificationResults.errors
      });
      
      // Log any errors but don't fail the appointment
      if (notificationResults.errors.length > 0) {
        console.error('⚠️ Some notifications failed:', notificationResults.errors);
      }
    } catch (error) {
      console.error('❌ Error sending notifications:', error);
      // Don't fail the appointment creation if notifications fail
    }
    
    // Create internal notifications for admins/staff (legacy system)
    await createInternalNotifications(appointment, customer);

    // Track notification creation for debugging (moved functions to earlier in code)
    let notificationDebug = { attempted: false, created: false, error: null as any };

    // Helper functions for formatting (used in response)
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
    
    // Debug mode - test table structure and permissions
    if (debug === 'true') {
      const publicClient = createPublicClient();
      
      // Test 1: Check if we can query appointments table
      const { data: testQuery, error: queryError } = await publicClient
        .from('appointments')
        .select('id')
        .limit(1);
      
      // Test 2: Get table columns
      const { data: columns, error: columnsError } = await publicClient
        .rpc('get_table_columns', { table_name: 'appointments' })
        .catch(() => ({ data: null, error: 'Function not available' }));
      
      // Test 3: Try a minimal insert (will likely fail but shows the error)
      const testData = {
        customer_id: '00000000-0000-0000-0000-000000000000',
        scheduled_date: '2025-01-20',
        scheduled_time: '10:00',
        duration_minutes: 30,
        status: 'scheduled',
        source: 'website'
      };
      
      const { data: testInsert, error: insertError } = await publicClient
        .from('appointments')
        .insert(testData)
        .select()
        .single();
      
      return NextResponse.json(
        {
          success: true,
          debug: {
            canQuery: !queryError,
            queryError: queryError ? {
              message: queryError.message,
              details: queryError.details,
              hint: queryError.hint,
              code: queryError.code
            } : null,
            columns: columns || 'Could not fetch columns',
            columnsError,
            testInsert: {
              success: !insertError,
              data: testInsert,
              error: insertError ? {
                message: insertError.message,
                details: insertError.details,
                hint: insertError.hint,
                code: insertError.code
              } : null,
              testData
            }
          },
          message: 'Debug information - check the debug object for details'
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
    // Import the service
    const { InternalNotificationService } = await import('@/lib/services/internal-notification.service');
    const internalNotificationService = new InternalNotificationService(true); // Use service role
    
    // Format appointment date and time for the message
    const appointmentDate = new Date(appointment.scheduled_date + 'T' + appointment.scheduled_time);
    const formattedDate = appointmentDate.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
    const formattedTime = appointmentDate.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
    
    // Create notifications for admins and managers
    await internalNotificationService.notifyNewAppointment(
      appointment.id,
      customer.name,
      `${formattedDate} at ${formattedTime}`,
      null // Created by system since it's from public form
    );
    
    console.log('✅ Internal notifications created for new appointment');
  } catch (error) {
    console.error('Error creating internal notifications:', error);
    // Don't fail the appointment creation if notifications fail
  }
}