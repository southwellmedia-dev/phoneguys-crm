import { NextRequest, NextResponse } from 'next/server';
import { TimerService } from '@/lib/services/timer.service';
import { requirePermission, handleApiError, successResponse } from '@/lib/auth/helpers';
import { Permission } from '@/lib/services/authorization.service';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    // Await params in Next.js 15
    const resolvedParams = await params;
    
    // Require authentication and timer start permission
    const authResult = await requirePermission(request, Permission.TIMER_START);
    if (authResult instanceof NextResponse) return authResult;

    const ticketId = resolvedParams.id;
    const { action, notes } = await request.json();

    if (!action || !['start', 'stop', 'pause'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be start, stop, or pause' },
        { status: 400 }
      );
    }

    // Create timer service with service role to bypass RLS
    const timerService = new TimerService(true);

    let result;
    switch (action) {
      case 'start':
        result = await timerService.startTimer(ticketId, authResult.userId);
        break;
      case 'stop':
        result = await timerService.stopTimer(ticketId, authResult.userId, notes);
        break;
      case 'pause':
        result = await timerService.pauseTimer(ticketId, authResult.userId);
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
    const timerService = new TimerService(true);

    // Get time entries for this ticket
    const timeData = await timerService.getTicketTimeEntries(ticketId);

    // Check if there's an active timer
    const activeTimer = await timerService.getActiveTimer(authResult.userId);
    const isTimerActive = activeTimer?.ticketId === ticketId;

    return successResponse({
      ...timeData,
      isTimerActive,
      activeTimer: isTimerActive ? activeTimer : null
    });
  } catch (error) {
    return handleApiError(error);
  }
}