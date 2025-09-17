import { NextRequest, NextResponse } from 'next/server';
import { TimerServiceV2 } from '@/lib/services/timer-v2.service';
import { requirePermission, handleApiError, successResponse } from '@/lib/auth/helpers';
import { Permission } from '@/lib/services/authorization.service';
import { SecureAPI } from '@/lib/utils/api-helpers';

/**
 * Get all active timers (admin only)
 * GET /api/admin/timers
 */
export const GET = SecureAPI.admin(async (request: NextRequest) => {
  try {
    // Require admin permission
    const authResult = await requirePermission(request, Permission.SETTINGS_MANAGE);
    if (authResult instanceof NextResponse) return authResult;

    // Get all active timers
    const timerService = new TimerServiceV2(true); // Use service role
    const timers = await timerService.getAllActiveTimers();

    // Auto-pause long-running timers
    await timerService.autoPauseLongRunningTimers();

    // Cleanup stale timers
    await timerService.cleanupStaleTimers();

    return successResponse({
      count: timers.length,
      timers,
    });
  } catch (error) {
    return handleApiError(error);
  }
});