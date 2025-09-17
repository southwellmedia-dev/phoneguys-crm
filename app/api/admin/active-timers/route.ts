import { NextRequest, NextResponse } from 'next/server';
import { TimerServiceV2 } from '@/lib/services/timer-v2.service';
import { requirePermission, handleApiError, successResponse } from '@/lib/auth/helpers';
import { Permission } from '@/lib/services/authorization.service';

export async function GET(request: NextRequest) {
  try {
    // Require timer view all permission (admins have this)
    const authResult = await requirePermission(request, Permission.TIMER_VIEW_ALL);
    if (authResult instanceof NextResponse) return authResult;

    // Create timer service with service role to bypass RLS
    const timerService = new TimerServiceV2(true);

    // Get all active timers
    const timers = await timerService.getAllActiveTimers();

    return successResponse(timers);
  } catch (error) {
    return handleApiError(error);
  }
}