import { NextRequest, NextResponse } from 'next/server';
import { RepairOrderService } from '@/lib/services/repair-order.service';
import { InternalNotificationService } from '@/lib/services/internal-notification.service';
import { requirePermission, handleApiError, successResponse, requireAuth } from '@/lib/auth/helpers';
import { Permission } from '@/lib/services/authorization.service';
import { auditLog } from '@/lib/services/audit.service';
import { withAudit, auditConfigs } from '@/lib/utils/audit-middleware';
import { createServiceClient } from '@/lib/supabase/service';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

async function updateStatus(request: NextRequest, context: RouteParams) {
  try {
    // Await params in Next.js 15
    const resolvedParams = await context.params;
    
    if (!resolvedParams || !resolvedParams.id) {
      return NextResponse.json(
        { error: 'Invalid request - missing ticket ID' },
        { status: 400 }
      );
    }
    
    // Require authentication and status change permission
    const authResult = await requirePermission(request, Permission.TICKET_CHANGE_STATUS);
    if (authResult instanceof NextResponse) return authResult;

    console.log('Auth result:', { 
      hasUser: !!authResult.user, 
      userId: authResult.userId,
      userRole: authResult.role 
    });

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
    const supabase = createServiceClient();

    // Get current ticket for audit trail
    const currentTicket = await repairService.getRepairOrder(ticketId);
    const previousStatus = currentTicket?.status;

    // Update status using the service's update method
    // NOTE: updateRepairOrder already sends notifications internally via createStatusUpdateNotification
    const updatedTicket = await repairService.updateRepairOrder(
      ticketId, 
      { status }, 
      authResult.userId
    );

    // Audit the status change with ticket number
    if (previousStatus && previousStatus !== status) {
      // Get ticket number for audit log
      const { data: ticketData } = await supabase
        .from('repair_tickets')
        .select('ticket_number')
        .eq('id', ticketId)
        .single();
      
      await auditLog.ticketStatusChanged(
        authResult.userId,
        ticketId,
        previousStatus,
        status
      );
    }

    // Get updated ticket with full relationships for logging
    const ticket = await repairService.getRepairOrder(ticketId);
    
    console.log('Fetched ticket:', {
      hasTicket: !!ticket,
      hasCustomers: !!ticket?.customers,
      customerId: ticket?.customer_id,
      ticketNumber: ticket?.ticket_number
    });

    if (ticket) {
      // REMOVED: Duplicate notification sending - already handled in updateRepairOrder
      // The RepairOrderService.updateRepairOrder method already calls createStatusUpdateNotification
      // which sends all necessary email/SMS notifications

      // Create internal notifications for status changes
      try {
        const internalNotificationService = new InternalNotificationService(true);
        
        // Notify the assigned technician if there's one
        if (ticket.assigned_to && ticket.assigned_to !== authResult.userId) {
          await internalNotificationService.notifyTicketStatusChange(
            ticketId,
            ticket.ticket_number || ticketId.substring(0, 8),
            ticket.assigned_to,
            status,
            ticket.customers?.name || 'Unknown Customer',
            authResult.userId
          );
        }

        // For completed or on_hold tickets, also notify managers/admins
        if (status === 'completed' || status === 'on_hold') {
          const admins = await internalNotificationService.notifyUsersByRole('admin', {
            type: status === 'completed' ? 'ticket_completed' : 'ticket_on_hold',
            title: `Ticket ${status === 'completed' ? 'Completed' : 'On Hold'}`,
            message: `Ticket #${ticket.ticket_number || ticketId.substring(0, 8)} for ${ticket.customers?.name || 'Unknown Customer'} is now ${status}`,
            priority: 'medium',
            action_url: `/orders/${ticketId}`,
            data: { ticket_id: ticketId, status },
            created_by: authResult.userId
          });
        }
      } catch (notifError) {
        console.error('Failed to create internal notifications:', notifError);
        // Don't fail the request if notifications fail
      }
    }

    return successResponse(
      { ticketId, status },
      `Ticket status updated to ${status}`
    );
  } catch (error) {
    return handleApiError(error);
  }
}

// Apply audit logging to POST/PATCH operations (status changes)
const auditedUpdateStatus = withAudit(updateStatus, {
  ...auditConfigs.business,
  activityType: 'ticket_status_update',
  entityType: 'ticket',
  extractEntityId: (request, response) => {
    // Extract ticket ID from URL
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const idIndex = pathParts.indexOf('orders') + 1;
    return pathParts[idIndex];
  }
});

export async function POST(request: NextRequest, context: RouteParams) {
  return auditedUpdateStatus(request, context);
}

export async function PATCH(request: NextRequest, context: RouteParams) {
  return auditedUpdateStatus(request, context);
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const resolvedParams = await params;
    const ticketId = resolvedParams.id;

    // Use Supabase directly for a simple status fetch
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Get the ticket status
    const { data: ticket, error } = await supabase
      .from('repair_tickets')
      .select('id, status, updated_at')
      .eq('id', ticketId)
      .single();
    
    if (error || !ticket) {
      console.error('Error fetching ticket:', error);
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      status: ticket.status,
      id: ticket.id,
      updated_at: ticket.updated_at 
    });
  } catch (error) {
    console.error('Error in status GET route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}