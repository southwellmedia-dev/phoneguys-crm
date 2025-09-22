import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/helpers';
import { AvailabilityService } from '@/lib/services/availability.service';
import { z } from 'zod';
import { format, addDays } from 'date-fns';

// Schema for slot generation request
const generateSlotsSchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  daysAhead: z.number().int().min(1).max(90).default(30),
  slotDuration: z.number().int().min(15).max(120).default(30),
  force: z.boolean().default(false), // Force regeneration even if slots exist
});

/**
 * POST /api/admin/slots/generate
 * Generate appointment slots for future dates
 * Admin only endpoint
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication and admin role
    const authResult = await requireAuth(request, ['admin', 'manager']);
    if (authResult instanceof NextResponse) return authResult;

    const body = await request.json();
    const validation = generateSlotsSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid parameters',
          details: validation.error.flatten()
        },
        { status: 400 }
      );
    }

    const data = validation.data;
    
    // Determine date range
    let startDate: string;
    let endDate: string;
    
    if (data.startDate && data.endDate) {
      startDate = data.startDate;
      endDate = data.endDate;
    } else {
      // Default: generate for the next N days
      const today = new Date();
      startDate = format(today, 'yyyy-MM-dd');
      endDate = format(addDays(today, data.daysAhead), 'yyyy-MM-dd');
    }

    console.log(`[Slot Generation] Starting bulk generation from ${startDate} to ${endDate}`);

    // Use service role for admin operations
    const availabilityService = new AvailabilityService(true); // Use service role
    
    const results = {
      totalDays: 0,
      successfulDays: 0,
      failedDays: 0,
      skippedDays: 0,
      slotsCreated: 0,
      errors: [] as string[],
      details: [] as any[]
    };

    // Generate slots for each day in the range
    const current = new Date(startDate);
    const end = new Date(endDate);
    
    while (current <= end) {
      const dateStr = format(current, 'yyyy-MM-dd');
      results.totalDays++;
      
      try {
        // Check if day needs slots
        const dayAvailability = await availabilityService['availabilityRepo'].getDayAvailability(dateStr);
        
        if (!dayAvailability.isOpen) {
          results.skippedDays++;
          results.details.push({
            date: dateStr,
            status: 'skipped',
            reason: 'closed'
          });
          current.setDate(current.getDate() + 1);
          continue;
        }
        
        // Check if slots already exist
        if (!data.force) {
          const existingSlots = await availabilityService['availabilityRepo'].getAvailableSlots(dateStr);
          if (existingSlots.length > 0) {
            results.skippedDays++;
            results.details.push({
              date: dateStr,
              status: 'skipped',
              reason: 'slots_exist',
              existingSlots: existingSlots.length
            });
            current.setDate(current.getDate() + 1);
            continue;
          }
        }
        
        // Generate slots
        const success = await availabilityService['availabilityRepo'].generateSlotsForDate(
          dateStr,
          data.slotDuration
        );
        
        if (success) {
          // Verify slots were created
          const newSlots = await availabilityService['availabilityRepo'].getAvailableSlots(dateStr);
          results.successfulDays++;
          results.slotsCreated += newSlots.length;
          results.details.push({
            date: dateStr,
            status: 'success',
            slotsCreated: newSlots.length
          });
        } else {
          results.failedDays++;
          results.errors.push(`Failed to generate slots for ${dateStr}`);
          results.details.push({
            date: dateStr,
            status: 'failed',
            reason: 'generation_failed'
          });
        }
      } catch (error) {
        results.failedDays++;
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        results.errors.push(`Error for ${dateStr}: ${errorMsg}`);
        results.details.push({
          date: dateStr,
          status: 'error',
          error: errorMsg
        });
      }
      
      current.setDate(current.getDate() + 1);
    }

    console.log('[Slot Generation] Completed:', {
      totalDays: results.totalDays,
      successful: results.successfulDays,
      failed: results.failedDays,
      skipped: results.skippedDays,
      slotsCreated: results.slotsCreated
    });

    return NextResponse.json({
      success: results.failedDays === 0,
      message: `Generated slots for ${results.successfulDays} days (${results.slotsCreated} total slots)`,
      results: {
        summary: {
          totalDays: results.totalDays,
          successful: results.successfulDays,
          failed: results.failedDays,
          skipped: results.skippedDays,
          slotsCreated: results.slotsCreated
        },
        errors: results.errors.length > 0 ? results.errors : undefined,
        details: process.env.NODE_ENV === 'development' ? results.details : undefined
      }
    });

  } catch (error) {
    console.error('[Slot Generation] Fatal error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Failed to generate slots'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/slots/generate
 * Get slot generation status/info
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const authResult = await requireAuth(request, ['admin', 'manager']);
    if (authResult instanceof NextResponse) return authResult;

    const availabilityService = new AvailabilityService(true);
    
    // Get next 30 days of slot status
    const today = new Date();
    const results = [];
    
    for (let i = 0; i < 30; i++) {
      const date = addDays(today, i);
      const dateStr = format(date, 'yyyy-MM-dd');
      
      const dayAvailability = await availabilityService['availabilityRepo'].getDayAvailability(dateStr);
      const slots = await availabilityService['availabilityRepo'].getAvailableSlots(dateStr);
      
      results.push({
        date: dateStr,
        dayOfWeek: date.getDay(),
        isOpen: dayAvailability.isOpen,
        hasSlots: slots.length > 0,
        slotCount: slots.length,
        needsGeneration: dayAvailability.isOpen && slots.length === 0
      });
    }
    
    const needsGeneration = results.filter(r => r.needsGeneration).length;
    
    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalDays: results.length,
          openDays: results.filter(r => r.isOpen).length,
          daysWithSlots: results.filter(r => r.hasSlots).length,
          daysNeedingSlots: needsGeneration
        },
        days: results,
        message: needsGeneration > 0 
          ? `${needsGeneration} days need slot generation`
          : 'All open days have slots generated'
      }
    });

  } catch (error) {
    console.error('[Slot Generation Status] Error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get slot generation status'
      },
      { status: 500 }
    );
  }
}