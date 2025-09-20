import { NextRequest, NextResponse } from 'next/server';
import { TimerServiceV2 } from '@/lib/services/timer-v2.service';
import { requirePermission, handleApiError, successResponse } from '@/lib/auth/helpers';
import { Permission } from '@/lib/services/authorization.service';
import { auditLog } from '@/lib/services/audit.service';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    // Await params in Next.js 15
    const resolvedParams = await params;
    
    // Get the auth user first for audit logging
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();
    
    // Require authentication and timer start permission
    const authResult = await requirePermission(request, Permission.TIMER_START);
    if (authResult instanceof NextResponse) return authResult;

    const ticketId = resolvedParams.id;
    const { action, notes } = await request.json();

    if (!action || !['start', 'stop', 'pause', 'resume'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be start, stop, pause, or resume' },
        { status: 400 }
      );
    }

    // Create timer service with service role to bypass RLS
    const timerService = new TimerServiceV2(true);

    // Use the app user ID for timer operations (database user ID)
    const appUserId = authResult.user.id;
    // Use auth user ID for audit logging
    const authUserId = authUser?.id;

    let result;
    switch (action) {
      case 'start':
        result = await timerService.startTimer(ticketId, appUserId);
        break;
      case 'stop':
        result = await timerService.stopTimer(ticketId, appUserId, notes);
        break;
      case 'pause':
        result = await timerService.pauseTimer(ticketId, appUserId);
        break;
      case 'resume':
        result = await timerService.resumeTimer(ticketId, appUserId);
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    if (!result || !result.success) {
      return NextResponse.json(
        { error: result?.message || 'Operation failed' },
        { status: 400 }
      );
    }

    // Log the timer action using auth user ID for RLS compliance
    if (authUserId) {
      try {
        // Get ticket number for the audit log
        const { data: ticketData } = await supabase
          .from('repair_tickets')
          .select('ticket_number')
          .eq('id', ticketId)
          .single();
        
        await auditLog.ticketTimerAction(
          authUserId, // Use auth user ID for RLS policy
          ticketId,
          {
            action,
            result: result.success ? 'success' : 'failed',
            notes: notes || null,
            timer_id: result.timer?.id,
            duration: action === 'stop' ? result.duration : null,
            elapsed_seconds: result.timer?.elapsed_seconds,
            app_user_id: appUserId, // Include app user ID in details
            ticket_number: ticketData?.ticket_number // Include ticket number
          }
        );
      } catch (auditError) {
        console.error('Failed to log timer audit:', auditError);
        // Continue even if audit logging fails
      }
    }

    return successResponse(result, result.message);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Await params in Next.js 15
    const resolvedParams = await params;
    
    // Require authentication
    const authResult = await requirePermission(request, Permission.TIMER_START);
    if (authResult instanceof NextResponse) return authResult;

    const ticketId = resolvedParams.id;

    // Create timer service with service role to bypass RLS
    const timerService = new TimerServiceV2(true);

    // Use the app user ID from the auth context (which is the database user ID)
    const appUserId = authResult.user.id;

    // Get the timer for this ticket
    const activeTimer = await timerService.getTicketTimer(ticketId);
    const isTimerActive = activeTimer !== null && !activeTimer.is_paused;
    
    // Also check if user has any other active timer
    const userTimer = await timerService.getActiveTimer(appUserId);
    const hasOtherTimer = userTimer && userTimer.ticket_id !== ticketId;

    return successResponse({
      isTimerActive,
      activeTimer: activeTimer,
      hasOtherTimer,
      userTimer: hasOtherTimer ? userTimer : null
    });
  } catch (error) {
    return handleApiError(error);
  }
}