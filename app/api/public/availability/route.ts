import { NextRequest, NextResponse } from 'next/server';
import { AvailabilityService } from '@/lib/services/availability.service';
import { z } from 'zod';

// CORS headers for embeddable widget
const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGINS || '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
  'Access-Control-Max-Age': '86400',
};

// Validation schemas
const availabilityQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  month: z.string().regex(/^\d{4}-\d{2}$/).optional(),
  staffId: z.string().uuid().optional(),
  nextAvailable: z.string().transform(val => val === 'true').optional(),
  limit: z.string().transform(val => parseInt(val)).optional(),
});

/**
 * GET /api/public/availability
 * Public endpoint for checking appointment availability
 * Used by the embeddable widget
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse and validate query parameters
    const params = {
      date: searchParams.get('date'),
      startDate: searchParams.get('startDate'),
      endDate: searchParams.get('endDate'),
      month: searchParams.get('month'),
      nextAvailable: searchParams.get('nextAvailable'),
      limit: searchParams.get('limit'),
      staffId: searchParams.get('staffId'),
    };

    const validation = availabilityQuerySchema.safeParse(params);
    if (!validation.success) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid parameters',
          details: validation.error.flatten()
        },
        { 
          status: 400,
          headers: corsHeaders
        }
      );
    }

    const availabilityService = new AvailabilityService(true); // Use service role for public access

    // Handle different query types
    let result: any;

    if (validation.data.nextAvailable) {
      // Get next available dates
      const limit = validation.data.limit || 7;
      result = await availabilityService.getNextAvailableDates(limit);
    } else if (validation.data.month) {
      // Get month availability
      const [year, month] = validation.data.month.split('-').map(Number);
      result = await availabilityService.getMonthAvailability(year, month);
    } else if (validation.data.startDate && !validation.data.endDate) {
      // Get week availability starting from date
      result = await availabilityService.getWeekAvailability(validation.data.startDate);
    } else if (validation.data.date) {
      // Get specific date availability
      result = await availabilityService.getDateAvailability(validation.data.date);
    } else {
      // Default: get next 7 available dates
      result = await availabilityService.getNextAvailableDates(7);
    }

    return NextResponse.json(
      {
        success: true,
        data: result
      },
      { headers: corsHeaders }
    );

  } catch (error) {
    console.error('Error in GET /api/public/availability:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'Failed to fetch availability'
      },
      { 
        status: 500,
        headers: corsHeaders
      }
    );
  }
}

/**
 * OPTIONS /api/public/availability
 * Handle CORS preflight requests
 */
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}