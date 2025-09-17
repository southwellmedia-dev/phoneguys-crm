import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
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
 * Reset stuck timer for a ticket
 * POST /api/orders/:id/timer/reset
 */
export const POST = SecureAPI.general(async (request: NextRequest, { params }: RouteParams) => {
  try {
    // Await params in Next.js 15
    const resolvedParams = await params;
    
    // Require authentication and timer start permission
    const authResult = await requirePermission(request, Permission.TIMER_START);
    if (authResult instanceof NextResponse) return authResult;

    const ticketId = resolvedParams.id;
    const appUserId = authResult.user.id;

    // Use service role to bypass RLS
    const supabase = createServiceClient();

    // Clear the timer_started_at field for this ticket
    const { data, error } = await supabase
      .from('repair_tickets')
      .update({ timer_started_at: null })
      .eq('id', ticketId)
      .select()
      .single();

    if (error) {
      console.error('Failed to reset timer:', error);
      return NextResponse.json(
        { error: 'Failed to reset timer', details: error },
        { status: 500 }
      );
    }

    // Log the reset action
    await auditLog.ticketTimerAction(
      appUserId,
      ticketId,
      {
        action: 'reset',
        result: 'success',
        notes: 'Timer reset due to stuck state',
        previous_timer_started_at: data?.timer_started_at
      }
    );

    return successResponse(
      { 
        success: true,
        ticket: data 
      },
      'Timer reset successfully'
    );
  } catch (error) {
    return handleApiError(error);
  }
});

/**
 * Get all tickets with stuck timers
 * GET /api/orders/:id/timer/reset
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Require authentication
    const authResult = await requirePermission(request, Permission.TIMER_START);
    if (authResult instanceof NextResponse) return authResult;

    // Use service role to bypass RLS
    const supabase = createServiceClient();

    // Find all tickets with timer_started_at set
    const { data, error } = await supabase
      .from('repair_tickets')
      .select('id, ticket_number, timer_started_at, status')
      .not('timer_started_at', 'is', null)
      .order('timer_started_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch stuck timers:', error);
      return NextResponse.json(
        { error: 'Failed to fetch stuck timers', details: error },
        { status: 500 }
      );
    }

    // Calculate duration for each stuck timer
    const stuckTimers = data?.map(ticket => ({
      ...ticket,
      duration_minutes: ticket.timer_started_at 
        ? Math.floor((Date.now() - new Date(ticket.timer_started_at).getTime()) / 60000)
        : 0
    }));

    return successResponse({
      count: stuckTimers?.length || 0,
      timers: stuckTimers || []
    });
  } catch (error) {
    return handleApiError(error);
  }
}