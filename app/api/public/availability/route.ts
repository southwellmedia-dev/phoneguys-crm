import { NextRequest, NextResponse } from 'next/server';
import { AvailabilityService } from '@/lib/services/availability.service';
import { z } from 'zod';

// CORS headers for embeddable widget
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-api-key, x-widget-key, X-Requested-With, Accept, Origin',
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
      date: searchParams.get('date') || undefined,
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      month: searchParams.get('month') || undefined,
      nextAvailable: searchParams.get('nextAvailable') || undefined,
      limit: searchParams.get('limit') || undefined,
      staffId: searchParams.get('staffId') || undefined,
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

    // Generate cache key based on parameters
    const cacheKey = JSON.stringify(validation.data);
    
    // Use public client (anon key) for public endpoints
    const availabilityService = new AvailabilityService(false, true); // Use public client

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

    // Add cache headers for better performance
    const cacheHeaders = {
      ...corsHeaders,
      'Cache-Control': 'public, max-age=300, s-maxage=300, stale-while-revalidate=60', // Cache for 5 minutes
      'ETag': `"${Buffer.from(cacheKey).toString('base64')}"`,
      'Vary': 'Accept-Encoding'
    };

    return NextResponse.json(
      {
        success: true,
        data: result
      },
      { headers: cacheHeaders }
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