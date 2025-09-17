import { NextRequest, NextResponse } from 'next/server';
import { TimerServiceV2 } from '@/lib/services/timer-v2.service';
import { requirePermission, handleApiError, successResponse } from '@/lib/auth/helpers';
import { Permission } from '@/lib/services/authorization.service';
import { SecureAPI } from '@/lib/utils/api-helpers';
import { auditLog } from '@/lib/services/audit.service';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * Clear an active timer (admin only)
 * POST /api/admin/timers/:ticketId/clear
 */
export const POST = SecureAPI.admin(async (request: NextRequest, { params }: RouteParams) => {
  try {
    // Await params in Next.js 15
    const resolvedParams = await params;
    
    // Require admin permission
    const authResult = await requirePermission(request, Permission.SETTINGS_MANAGE);
    if (authResult instanceof NextResponse) return authResult;

    const ticketId = resolvedParams.id;
    const { reason } = await request.json();

    // Clear the timer
    const timerService = new TimerServiceV2(true); // Use service role
    const result = await timerService.clearTimer(ticketId, authResult.user.id, reason);

    if (!result.success) {
      return NextResponse.json(
        { error: result.message },
        { status: 400 }
      );
    }

    // Log the action
    await auditLog.ticketTimerAction(
      authResult.user.id,
      ticketId,
      {
        action: 'admin_clear',
        result: 'success',
        reason: reason || 'Admin cleared timer',
      }
    );

    return successResponse(result, result.message);
  } catch (error) {
    return handleApiError(error);
  }
});