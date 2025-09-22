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
  const startTime = Date.now();
  
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
      generateIfMissing: searchParams.get('generateIfMissing') || undefined,
    };

    console.log('[Public Availability] Request received:', {
      ...params,
      timestamp: new Date().toISOString()
    });

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
    let warnings: string[] = [];

    try {
      if (validation.data.nextAvailable) {
        // Get next available dates
        const limit = validation.data.limit || 7;
        result = await availabilityService.getNextAvailableDates(limit);
        
        // Check if we got fewer results than requested
        if (Array.isArray(result) && result.length < limit) {
          warnings.push(`Only ${result.length} available dates found within the next 60 days`);
        }
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
        
        // Check if slots are empty and warn
        if (result && result.slots && result.slots.length === 0 && result.isOpen) {
          warnings.push('No slots available for this date. Slots may need to be generated.');
        }
      } else {
        // Default: get next 7 available dates
        result = await availabilityService.getNextAvailableDates(7);
        
        if (Array.isArray(result) && result.length === 0) {
          warnings.push('No available dates found. Please check business hours configuration.');
        }
      }
    } catch (serviceError) {
      console.error('[Public Availability] Service error:', serviceError);
      
      // Try to provide partial results if possible
      result = validation.data.date 
        ? { date: validation.data.date, isOpen: false, slots: [] }
        : [];
      
      warnings.push('Some availability data could not be loaded. Please try again.');
    }

    const processingTime = Date.now() - startTime;
    
    // Add cache headers for better performance
    // Reduce cache time if there were warnings
    const cacheTime = warnings.length > 0 ? 60 : 300; // 1 minute if warnings, 5 minutes otherwise
    const cacheHeaders = {
      ...corsHeaders,
      'Cache-Control': `public, max-age=${cacheTime}, s-maxage=${cacheTime}, stale-while-revalidate=60`,
      'ETag': `"${Buffer.from(cacheKey).toString('base64')}"`,
      'Vary': 'Accept-Encoding',
      'X-Processing-Time': `${processingTime}ms`
    };

    console.log('[Public Availability] Response:', {
      success: true,
      hasData: !!result,
      warnings: warnings.length,
      processingTime: `${processingTime}ms`
    });

    return NextResponse.json(
      {
        success: true,
        data: result,
        warnings: warnings.length > 0 ? warnings : undefined,
        meta: {
          processingTime: `${processingTime}ms`,
          cached: cacheTime > 60
        }
      },
      { headers: cacheHeaders }
    );

  } catch (error) {
    const processingTime = Date.now() - startTime;
    
    console.error('[Public Availability] Fatal error:', {
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : error,
      processingTime: `${processingTime}ms`,
      url: request.url,
      timestamp: new Date().toISOString()
    });
    
    return NextResponse.json(
      {
        success: false,
        error: 'Service temporarily unavailable',
        message: 'Unable to fetch availability at this time. Please try again in a few moments.',
        meta: {
          processingTime: `${processingTime}ms`,
          timestamp: new Date().toISOString()
        }
      },
      { 
        status: 503, // Service Unavailable
        headers: {
          ...corsHeaders,
          'Retry-After': '30', // Suggest retry after 30 seconds
          'X-Processing-Time': `${processingTime}ms`
        }
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