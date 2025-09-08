import { NextRequest, NextResponse } from 'next/server';
import { AppointmentService } from '@/lib/services/appointment.service';
import { z } from 'zod';
import { ApiResponse } from '@/lib/types';

// Schema for creating appointment from external API (website form)
const createAppointmentSchema = z.object({
  customer: z.union([
    z.object({
      id: z.string().uuid()
    }),
    z.object({
      name: z.string().min(1, 'Customer name is required'),
      email: z.string().email('Invalid email address'),
      phone: z.string().optional(),
      address: z.string().optional()
    })
  ]),
  device: z.object({
    id: z.string().uuid().optional(),
    brand: z.string().optional(),
    model: z.string().optional(),
  }).optional(),
  scheduled_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  scheduled_time: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be in HH:MM format'),
  duration_minutes: z.number().int().positive().optional(),
  issues: z.array(z.string()).optional(),
  description: z.string().optional(),
  urgency: z.enum(['walk-in', 'scheduled', 'emergency']).optional(),
  source: z.enum(['website', 'phone', 'walk-in', 'email']).default('website'),
  notes: z.string().optional(),
});

// Helper function to validate API key
function validateApiKey(request: NextRequest): boolean {
  const apiKey = request.headers.get('x-api-key');
  const expectedApiKey = process.env.EXTERNAL_API_KEY;
  
  // For development, allow requests without API key if EXTERNAL_API_KEY is not set
  if (!expectedApiKey) {
    console.warn('EXTERNAL_API_KEY not set - accepting all requests in development mode');
    return true;
  }
  
  return apiKey === expectedApiKey;
}

// POST /api/appointments - Create a new appointment (called by Astro website)
export async function POST(request: NextRequest) {
  try {
    // Validate API key for external requests
    if (!validateApiKey(request)) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Unauthorized',
        message: 'Invalid or missing API key'
      }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();

    // Validate input data
    const validationResult = createAppointmentSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Validation failed',
        details: validationResult.error.flatten()
      }, { status: 400 });
    }

    // Create service instance with service role for API access
    const appointmentService = new AppointmentService(true);
    
    // Create appointment through service
    const appointment = await appointmentService.createAppointment({
      ...validationResult.data,
      source: validationResult.data.source || 'website',
    });

    // Return success response
    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        appointment_number: appointment.appointment_number,
        appointment_id: appointment.id,
        status: appointment.status,
        scheduled_date: appointment.scheduled_date,
        scheduled_time: appointment.scheduled_time,
        message: `Appointment scheduled successfully. Your appointment number is ${appointment.appointment_number}`
      },
      message: 'Appointment created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error in POST /api/appointments:', error);

    // Handle specific errors
    if (error instanceof z.ZodError) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Invalid request data',
        details: error.errors
      }, { status: 400 });
    }

    if (error instanceof Error) {
      // Check for specific error messages
      if (error.message.includes('conflict')) {
        return NextResponse.json<ApiResponse>({
          success: false,
          error: 'Time slot conflict',
          message: error.message
        }, { status: 409 });
      }

      if (error.message.includes('not found')) {
        return NextResponse.json<ApiResponse>({
          success: false,
          error: 'Not found',
          message: error.message
        }, { status: 404 });
      }
    }

    // Generic error response
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Internal server error',
      message: 'An unexpected error occurred while processing your request'
    }, { status: 500 });
  }
}

// GET /api/appointments - Check appointment status or fetch appointments
export async function GET(request: NextRequest) {
  try {
    // Check if this is an internal request (with auth cookies) or external (with API key)
    const hasApiKey = request.headers.get('x-api-key');
    const isExternalRequest = hasApiKey !== null;
    
    if (isExternalRequest) {
      // External API request - validate API key
      if (!validateApiKey(request)) {
        return NextResponse.json<ApiResponse>({
          success: false,
          error: 'Unauthorized',
          message: 'Invalid or missing API key'
        }, { status: 401 });
      }
    } else {
      // Internal request - require authentication
      const { requireAuth, handleApiError } = await import('@/lib/auth/helpers');
      const authResult = await requireAuth(request);
      if (authResult instanceof NextResponse) return authResult;
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const appointmentNumber = searchParams.get('appointment_number');
    const limit = parseInt(searchParams.get('limit') || '0');

    // Import repository
    const { AppointmentRepository } = await import('@/lib/repositories/appointment.repository');
    const appointmentRepo = new AppointmentRepository(true);

    if (isExternalRequest) {
      // External API: Require appointment number for status check
      if (!appointmentNumber) {
        return NextResponse.json<ApiResponse>({
          success: false,
          error: 'Bad request',
          message: 'Appointment number is required'
        }, { status: 400 });
      }

      const appointment = await appointmentRepo.findByAppointmentNumber(appointmentNumber);

      if (!appointment) {
        return NextResponse.json<ApiResponse>({
          success: false,
          error: 'Not found',
          message: 'Appointment not found'
        }, { status: 404 });
      }

      // Return appointment status
      return NextResponse.json<ApiResponse>({
        success: true,
        data: {
          appointment_number: appointment.appointment_number,
          status: appointment.status,
          scheduled_date: appointment.scheduled_date,
          scheduled_time: appointment.scheduled_time,
          customer_name: appointment.customers?.name,
          device: appointment.devices ? `${appointment.devices.manufacturer?.name} ${appointment.devices.model_name}` : null,
          issues: appointment.issues,
          converted_to_ticket_id: appointment.converted_to_ticket_id
        }
      });
    } else {
      // Internal request: Fetch appointments for dashboard
      const appointments = await appointmentRepo.findAllWithDetails();
      
      // Sort by date (most recent first)
      appointments.sort((a: any, b: any) => {
        const dateA = new Date(`${a.scheduled_date} ${a.scheduled_time}`);
        const dateB = new Date(`${b.scheduled_date} ${b.scheduled_time}`);
        return dateB.getTime() - dateA.getTime();
      });

      // Apply limit if specified
      const limitedAppointments = limit > 0 ? appointments.slice(0, limit) : appointments;

      // Transform data for internal use
      const transformedAppointments = limitedAppointments.map((apt: any) => ({
        id: apt.id,
        appointment_number: apt.appointment_number,
        status: apt.status,
        scheduled_date: apt.scheduled_date,
        scheduled_time: apt.scheduled_time,
        appointment_date: `${apt.scheduled_date} ${apt.scheduled_time}`,
        customer_name: apt.customers?.name || apt.customers?.full_name || 'Unknown',
        customers: apt.customers,
        services: apt.services || [],
        issues: apt.issues,
        created_at: apt.created_at,
        updated_at: apt.updated_at
      }));

      return NextResponse.json({
        success: true,
        data: transformedAppointments
      });
    }

  } catch (error) {
    console.error('Error in GET /api/appointments:', error);

    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Internal server error',
      message: 'An unexpected error occurred while fetching appointment status'
    }, { status: 500 });
  }
}

// OPTIONS /api/appointments - Handle CORS preflight
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGINS || '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
      'Access-Control-Max-Age': '86400',
    },
  });
}