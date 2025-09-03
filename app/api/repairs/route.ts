import { NextRequest, NextResponse } from 'next/server';
import { RepairOrderService } from '@/lib/services';
import { createRepairOrderSchema } from '@/lib/validations/repair-order.schema';
import { z } from 'zod';
import { ApiResponse } from '@/lib/types';

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

// POST /api/repairs - Create a new repair order (called by Astro website)
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
    const validationResult = createRepairOrderSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Validation failed',
        details: validationResult.error.flatten()
      }, { status: 400 });
    }

    // Create service instance within request scope (with service role for API access)
    const repairService = new RepairOrderService(true);
    
    // Create repair order through service
    const ticket = await repairService.createRepairOrder(validationResult.data);

    // Return success response
    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        ticket_number: ticket.ticket_number,
        ticket_id: ticket.id,
        status: ticket.status,
        estimated_cost: ticket.estimated_cost,
        message: `Repair request received successfully. Your ticket number is ${ticket.ticket_number}`
      },
      message: 'Repair order created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error in POST /api/repairs:', error);

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
      if (error.message.includes('already exists')) {
        return NextResponse.json<ApiResponse>({
          success: false,
          error: 'Duplicate entry',
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

// GET /api/repairs - Get repair status (optional endpoint for checking status)
export async function GET(request: NextRequest) {
  try {
    // Validate API key
    if (!validateApiKey(request)) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Unauthorized',
        message: 'Invalid or missing API key'
      }, { status: 401 });
    }

    // Get ticket number from query params
    const { searchParams } = new URL(request.url);
    const ticketNumber = searchParams.get('ticket_number');

    if (!ticketNumber) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Bad request',
        message: 'Ticket number is required'
      }, { status: 400 });
    }

    // Import repository to check ticket status (using service role for API access)
    const { RepairTicketRepository } = await import('@/lib/repositories');
    const ticketRepo = new RepairTicketRepository(true);

    const ticket = await ticketRepo.findByTicketNumber(ticketNumber);

    if (!ticket) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Not found',
        message: 'Ticket not found'
      }, { status: 404 });
    }

    // Return ticket status
    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        ticket_number: ticket.ticket_number,
        status: ticket.status,
        priority: ticket.priority,
        device: `${ticket.device_brand} ${ticket.device_model}`,
        date_received: ticket.date_received,
        date_completed: ticket.date_completed,
        estimated_cost: ticket.estimated_cost,
        actual_cost: ticket.actual_cost
      }
    });

  } catch (error) {
    console.error('Error in GET /api/repairs:', error);

    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Internal server error',
      message: 'An unexpected error occurred while fetching ticket status'
    }, { status: 500 });
  }
}

// OPTIONS /api/repairs - Handle CORS preflight
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