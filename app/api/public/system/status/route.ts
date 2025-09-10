import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';

// CORS headers for public access
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

/**
 * GET /api/public/system/status
 * Check system status and initialize if needed
 */
export async function GET() {
  try {
    const supabase = createServiceClient();
    
    // Check if business_hours table exists and has data
    const { data: businessHours, error: bhError } = await supabase
      .from('business_hours')
      .select('day_of_week, open_time, close_time, is_active')
      .order('day_of_week');

    if (bhError) {
      return NextResponse.json({
        success: false,
        error: 'System not initialized',
        message: 'Calendar availability system needs to be set up',
        needsInit: true,
        details: bhError.message
      }, { 
        status: 200, // Don't return error status for missing data
        headers: corsHeaders 
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        businessHoursConfigured: businessHours?.length > 0,
        businessHours: businessHours || [],
        systemReady: true
      }
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('System status check error:', error);
    return NextResponse.json({
      success: false,
      error: 'System check failed',
      details: error.message
    }, { 
      status: 500,
      headers: corsHeaders 
    });
  }
}

/**
 * POST /api/public/system/status
 * Initialize the availability system
 */
export async function POST() {
  try {
    const supabase = createServiceClient();
    
    // Try to insert default business hours
    const defaultBusinessHours = [
      { day_of_week: 1, open_time: '09:00:00', close_time: '18:00:00', break_start: '12:00:00', break_end: '13:00:00', is_active: true },
      { day_of_week: 2, open_time: '09:00:00', close_time: '18:00:00', break_start: '12:00:00', break_end: '13:00:00', is_active: true },
      { day_of_week: 3, open_time: '09:00:00', close_time: '18:00:00', break_start: '12:00:00', break_end: '13:00:00', is_active: true },
      { day_of_week: 4, open_time: '09:00:00', close_time: '18:00:00', break_start: '12:00:00', break_end: '13:00:00', is_active: true },
      { day_of_week: 5, open_time: '09:00:00', close_time: '18:00:00', break_start: '12:00:00', break_end: '13:00:00', is_active: true },
      { day_of_week: 6, open_time: '10:00:00', close_time: '16:00:00', break_start: null, break_end: null, is_active: true },
      { day_of_week: 0, open_time: null, close_time: null, break_start: null, break_end: null, is_active: false }
    ];

    const { data: insertedHours, error: insertError } = await supabase
      .from('business_hours')
      .upsert(defaultBusinessHours, { 
        onConflict: 'day_of_week',
        ignoreDuplicates: false 
      })
      .select();

    if (insertError) {
      return NextResponse.json({
        success: false,
        error: 'Failed to initialize',
        details: insertError.message
      }, { 
        status: 500,
        headers: corsHeaders 
      });
    }

    return NextResponse.json({
      success: true,
      message: 'System initialized successfully',
      data: {
        businessHours: insertedHours,
        systemReady: true
      }
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('System initialization error:', error);
    return NextResponse.json({
      success: false,
      error: 'Initialization failed',
      details: error.message
    }, { 
      status: 500,
      headers: corsHeaders 
    });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}