import { NextRequest, NextResponse } from 'next/server';
import { RepairOrderService } from '@/lib/services/repair-order.service';
import { NotificationService } from '@/lib/services/notification.service';
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
    
    // Require authentication and status change permission
    const authResult = await requirePermission(request, Permission.TICKET_CHANGE_STATUS);
    if (authResult instanceof NextResponse) return authResult;

    const ticketId = resolvedParams.id;
    const { status, reason } = await request.json();

    if (!status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      );
    }

    // Valid status transitions
    const validStatuses = ['new', 'in_progress', 'on_hold', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }

    // Create service instances
    const repairService = new RepairOrderService();
    const notificationService = new NotificationService();

    // Update status using the service's update method
    const updatedTicket = await repairService.updateRepairOrder(
      ticketId, 
      { status }, 
      authResult.userId
    );

    // Get updated ticket for notification (it's already returned from update)
    const ticket = updatedTicket;

    if (ticket) {
      // Send notification
      await notificationService.notifyStatusChange(ticket, status, reason);
    }

    return successResponse(
      { ticketId, status },
      `Ticket status updated to ${status}`
    );
  } catch (error) {
    return handleApiError(error);
  }
}