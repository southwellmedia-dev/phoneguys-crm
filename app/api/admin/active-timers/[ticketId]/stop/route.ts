import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, handleApiError, successResponse } from '@/lib/auth/helpers';
import { TimerServiceV2 } from '@/lib/services/timer-v2.service';
import { createClient } from '@/lib/supabase/server';
import { auditLog } from '@/lib/services/audit.service';

/**
 * POST /api/admin/active-timers/[ticketId]/stop
 * Admin endpoint to stop and save a timer for any user
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  try {
    const { ticketId } = await params;
    const authResult = await requireAdmin(request);
    
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { notes } = await request.json();
    
    // Get auth user for audit logging
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();
    
    // Use service role to stop timer as admin
    const timerService = new TimerServiceV2(true);
    
    // Get timer details first for audit logging
    const timer = await timerService.getTicketTimer(ticketId);
    if (!timer) {
      return NextResponse.json(
        { error: 'No active timer found' },
        { status: 404 }
      );
    }
    
    // Stop the timer using the original user's ID
    const result = await timerService.stopTimer(ticketId, timer.user_id, notes);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.message },
        { status: 400 }
      );
    }
    
    // Audit log the admin action
    if (authUser?.id) {
      await auditLog.ticketTimerAction(authUser.id, ticketId, {
        action: 'admin_stop',
        timer_user_id: timer.user_id,
        timer_user_name: timer.user_name,
        duration_minutes: result.duration,
        notes,
        admin_id: authResult.user.id,
        admin_name: authResult.user.full_name
      });
    }
    
    return NextResponse.json({
      success: true,
      message: `Timer stopped and saved (${result.duration} minutes)`,
      duration: result.duration
    });
  } catch (error) {
    console.error('Error stopping timer as admin:', error);
    return NextResponse.json(
      { error: 'Failed to stop timer' },
      { status: 500 }
    );
  }
}