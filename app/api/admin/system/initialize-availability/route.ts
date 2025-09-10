import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/admin/system/initialize-availability
 * Initialize the availability system with basic business hours
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(true); // Use service role
    
    // Check if business_hours table exists and has data
    const { data: existingHours, error: checkError } = await supabase
      .from('business_hours')
      .select('id')
      .limit(1);

    if (checkError) {
      console.error('business_hours table check failed:', checkError);
      return NextResponse.json({
        success: false,
        error: 'Table does not exist',
        message: 'The calendar availability migration needs to be applied first',
        detail: checkError.message
      }, { status: 500 });
    }

    if (existingHours && existingHours.length > 0) {
      return NextResponse.json({
        success: true,
        message: 'Business hours already initialized',
        data: { status: 'already_exists' }
      });
    }

    // Insert default business hours (Mon-Fri 9AM-6PM, Sat 10AM-4PM)
    const defaultBusinessHours = [
      { day_of_week: 1, open_time: '09:00', close_time: '18:00', break_start: '12:00', break_end: '13:00', is_active: true }, // Monday
      { day_of_week: 2, open_time: '09:00', close_time: '18:00', break_start: '12:00', break_end: '13:00', is_active: true }, // Tuesday
      { day_of_week: 3, open_time: '09:00', close_time: '18:00', break_start: '12:00', break_end: '13:00', is_active: true }, // Wednesday
      { day_of_week: 4, open_time: '09:00', close_time: '18:00', break_start: '12:00', break_end: '13:00', is_active: true }, // Thursday
      { day_of_week: 5, open_time: '09:00', close_time: '18:00', break_start: '12:00', break_end: '13:00', is_active: true }, // Friday
      { day_of_week: 6, open_time: '10:00', close_time: '16:00', break_start: null, break_end: null, is_active: true },       // Saturday
      { day_of_week: 0, open_time: null, close_time: null, break_start: null, break_end: null, is_active: false }             // Sunday (closed)
    ];

    const { data: insertedHours, error: insertError } = await supabase
      .from('business_hours')
      .insert(defaultBusinessHours)
      .select();

    if (insertError) {
      console.error('Failed to insert business hours:', insertError);
      return NextResponse.json({
        success: false,
        error: 'Failed to initialize business hours',
        detail: insertError.message
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Availability system initialized successfully',
      data: {
        businessHours: insertedHours,
        nextSteps: [
          'Business hours configured',
          'Appointment slots will be generated automatically when dates are requested',
          'System is ready for scheduling'
        ]
      }
    });

  } catch (error) {
    console.error('Error initializing availability system:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to initialize availability system',
      detail: error.message
    }, { status: 500 });
  }
}