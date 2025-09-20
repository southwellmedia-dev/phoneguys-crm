import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { InternalNotificationService } from '@/lib/services/internal-notification.service';
import { InternalNotificationPriority, InternalNotificationType } from '@/lib/types/internal-notification.types';
import { auditLog, AuditService } from '@/lib/services/audit.service';
import { SecureAPI } from '@/lib/utils/api-helpers';

interface Params {
  params: Promise<{ id: string }>;
}

async function handleAssignment(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const { assigned_to } = await request.json();

    // Check authentication
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use service role client for database update
    const serviceClient = createServiceClient();
    
    // First get the current ticket details for the notification
    const { data: ticket, error: fetchError } = await serviceClient
      .from('repair_tickets')
      .select(`
        *,
        customers (
          name
        ),
        devices (
          brand,
          model
        )
      `)
      .eq('id', id)
      .single();

    if (fetchError) {
      console.error('Error fetching ticket:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch ticket' },
        { status: 500 }
      );
    }
    
    // Update the ticket assignment
    const { data, error } = await serviceClient
      .from('repair_tickets')
      .update({ 
        assigned_to: assigned_to || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating assignment:', error);
      return NextResponse.json(
        { error: 'Failed to update assignment' },
        { status: 500 }
      );
    }

    // Audit the assignment change with ticket number
    const previousAssignee = ticket.assigned_to;
    if (previousAssignee !== assigned_to) {
      if (assigned_to) {
        // Get assignee name for better logging
        const { data: assigneeData } = await serviceClient
          .from('users')
          .select('full_name, email')
          .eq('id', assigned_to)
          .single();
        
        // Assignment or reassignment
        await auditLog.ticketAssigned(
          user.id,
          id,
          assigned_to
        );
      } else {
        // Unassignment - use AuditService directly since there's no convenience method for unassignment
        await AuditService.getInstance().logUserActivity({
          userId: user.id,
          activityType: 'ticket_unassigned',
          entityType: 'repair_ticket',
          entityId: id,
          details: {
            ticket_number: ticket.ticket_number,
            previous_assignee: previousAssignee
          }
        });
      }
    }

    // Handle notifications for assignment changes
    try {
      const notificationService = new InternalNotificationService(true);
      const deviceInfo = ticket.devices ? `${ticket.devices.brand} ${ticket.devices.model}` : 'Unknown Device';
      const customerName = ticket.customers?.name || 'Unknown Customer';
      const ticketNumber = ticket.ticket_number || id.substring(0, 8);
      
      if (!assigned_to && previousAssignee) {
        // Ticket was unassigned - notify the previous assignee
        await notificationService.createNotification({
          user_id: previousAssignee,
          type: InternalNotificationType.TICKET_UNASSIGNED,
          title: `Unassigned from ticket #${ticketNumber}`,
          message: `You've been unassigned from ${customerName}'s ${deviceInfo} repair`,
          priority: InternalNotificationPriority.NORMAL,
          action_url: `/orders/${id}`,
          data: { ticket_id: id },
          created_by: user.id
        });
      } else if (assigned_to && previousAssignee && assigned_to !== previousAssignee) {
        // Ticket was transferred - notify both users
        // Notify the previous assignee
        await notificationService.createNotification({
          user_id: previousAssignee,
          type: InternalNotificationType.TICKET_TRANSFERRED,
          title: `Ticket #${ticketNumber} transferred`,
          message: `${customerName}'s ${deviceInfo} repair has been reassigned`,
          priority: InternalNotificationPriority.NORMAL,
          action_url: `/orders/${id}`,
          data: { ticket_id: id, transferred_to: assigned_to },
          created_by: user.id
        });
        
        // Notify the new assignee
        await notificationService.notifyTicketAssignment(
          id,
          ticketNumber,
          assigned_to,
          customerName,
          deviceInfo,
          user.id
        );
      } else if (assigned_to && !previousAssignee) {
        // New assignment - just notify the new assignee
        await notificationService.notifyTicketAssignment(
          id,
          ticketNumber,
          assigned_to,
          customerName,
          deviceInfo,
          user.id
        );
      }
    } catch (notifError) {
      console.error('Failed to create assignment notification:', notifError);
      // Don't fail the request if notification fails
    }

    // The real-time subscription will handle updating all connected clients
    return NextResponse.json({ 
      success: true, 
      data,
      message: assigned_to ? 'Ticket assigned successfully' : 'Ticket unassigned'
    });
  } catch (error) {
    console.error('Error in assign route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Apply business audit logging for ticket assignments
export const PATCH = SecureAPI.general(handleAssignment);