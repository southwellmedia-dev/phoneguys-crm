import { NextRequest, NextResponse } from 'next/server';
import { TimerServiceV2 } from '@/lib/services/timer-v2.service';
import { requirePermission, handleApiError, successResponse } from '@/lib/auth/helpers';
import { Permission } from '@/lib/services/authorization.service';

interface RouteParams {
  params: Promise<{
    ticketId: string;
  }>;
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    // Await params in Next.js 15
    const resolvedParams = await params;
    
    // Require timer edit permission (admins have this)  
    const authResult = await requirePermission(request, Permission.TIMER_EDIT);
    if (authResult instanceof NextResponse) return authResult;

    const ticketId = resolvedParams.ticketId;
    const { reason } = await request.json().catch(() => ({ reason: 'Admin cleared timer' }));

    // Create timer service with service role to bypass RLS
    const timerService = new TimerServiceV2(true);

    // Clear the timer
    const result = await timerService.clearTimer(ticketId, authResult.user.id, reason);

    if (!result.success) {
      return NextResponse.json(
        { error: result.message || 'Failed to clear timer' },
        { status: 400 }
      );
    }

    return successResponse(result, result.message);
  } catch (error) {
    return handleApiError(error);
  }
}