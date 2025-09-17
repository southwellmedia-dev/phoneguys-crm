import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, handleApiError, successResponse } from '@/lib/auth/helpers';
import { TimerServiceV2 } from '@/lib/services/timer-v2.service';
import { createClient } from '@/lib/supabase/server';
import { auditLog } from '@/lib/services/audit.service';

/**
 * POST /api/admin/active-timers/[ticketId]/resume
 * Admin endpoint to resume a paused/stale timer for any user
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

    // Get auth user for audit logging
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();
    
    // Use service role to resume timer as admin
    const timerService = new TimerServiceV2(true);
    
    // Get timer details first
    const timer = await timerService.getTicketTimer(ticketId);
    if (!timer) {
      return NextResponse.json(
        { error: 'No timer found' },
        { status: 404 }
      );
    }
    
    // First, clear any auto-pause state if present
    if (timer.auto_paused_at) {
      await supabase
        .from('active_timers')
        .update({ 
          auto_paused_at: null,
          is_paused: true, // Ensure it's marked as paused so resume works
          pause_time: timer.auto_paused_at 
        })
        .eq('id', timer.id);
    }
    
    // Resume the timer using the original user's ID
    const result = await timerService.resumeTimer(ticketId, timer.user_id);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.message },
        { status: 400 }
      );
    }
    
    // Audit log the admin action
    if (authUser?.id) {
      await auditLog.ticketTimerAction(authUser.id, ticketId, {
        action: 'admin_resume',
        timer_user_id: timer.user_id,
        timer_user_name: timer.user_name,
        was_stale: !!timer.auto_paused_at,
        admin_id: authResult.user.id,
        admin_name: authResult.user.full_name
      });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Timer resumed successfully',
      timer: result.timer
    });
  } catch (error) {
    console.error('Error resuming timer as admin:', error);
    return NextResponse.json(
      { error: 'Failed to resume timer' },
      { status: 500 }
    );
  }
}