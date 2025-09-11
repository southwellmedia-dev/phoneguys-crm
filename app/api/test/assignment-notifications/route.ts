import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { InternalNotificationService } from '@/lib/services/internal-notification.service';
import { InternalNotificationType, InternalNotificationPriority } from '@/lib/types/internal-notification.types';

export async function POST(request: NextRequest) {
  try {
    const { scenario, ticketId, appointmentId, userId, previousUserId, newUserId } = await request.json();
    
    const notificationService = new InternalNotificationService(true);
    const serviceClient = createServiceClient();
    
    let result: any = {};
    
    switch (scenario) {
      case 'ticket-assign':
        // Test ticket assignment notification
        result.notification = await notificationService.notifyTicketAssignment(
          ticketId || 'test-ticket-id',
          'TEST-001',
          userId,
          'Test Customer',
          'iPhone 15 Pro',
          'system-test'
        );
        break;
        
      case 'ticket-unassign':
        // Test ticket unassignment notification
        result.notification = await notificationService.createNotification({
          user_id: userId,
          type: InternalNotificationType.TICKET_UNASSIGNED,
          title: `Unassigned from ticket #TEST-001`,
          message: `You've been unassigned from Test Customer's iPhone 15 Pro repair`,
          priority: InternalNotificationPriority.NORMAL,
          action_url: `/orders/${ticketId || 'test-ticket-id'}`,
          data: { ticket_id: ticketId || 'test-ticket-id' },
          created_by: 'system-test'
        });
        break;
        
      case 'ticket-transfer':
        // Test ticket transfer notification (both users)
        const transferNotifs = [];
        
        // Notify previous assignee
        transferNotifs.push(await notificationService.createNotification({
          user_id: previousUserId,
          type: InternalNotificationType.TICKET_TRANSFERRED,
          title: `Ticket #TEST-001 transferred`,
          message: `Test Customer's iPhone 15 Pro repair has been reassigned`,
          priority: InternalNotificationPriority.NORMAL,
          action_url: `/orders/${ticketId || 'test-ticket-id'}`,
          data: { ticket_id: ticketId || 'test-ticket-id', transferred_to: newUserId },
          created_by: 'system-test'
        }));
        
        // Notify new assignee
        transferNotifs.push(await notificationService.notifyTicketAssignment(
          ticketId || 'test-ticket-id',
          'TEST-001',
          newUserId,
          'Test Customer',
          'iPhone 15 Pro',
          'system-test'
        ));
        
        result.notifications = transferNotifs;
        break;
        
      case 'appointment-assign':
        // Test appointment assignment notification
        result.notification = await notificationService.notifyAppointmentAssignment(
          appointmentId || 'test-appointment-id',
          userId,
          'Test Customer',
          'January 15 at 2:00 PM',
          'system-test'
        );
        break;
        
      case 'appointment-unassign':
        // Test appointment unassignment notification
        result.notification = await notificationService.createNotification({
          user_id: userId,
          type: InternalNotificationType.APPOINTMENT_UNASSIGNED,
          title: `Unassigned from appointment`,
          message: `You've been unassigned from Test Customer's appointment on January 15 at 2:00 PM`,
          priority: InternalNotificationPriority.NORMAL,
          action_url: `/appointments/${appointmentId || 'test-appointment-id'}`,
          data: { appointment_id: appointmentId || 'test-appointment-id' },
          created_by: 'system-test'
        });
        break;
        
      case 'appointment-transfer':
        // Test appointment transfer notification (both users)
        const appointmentTransferNotifs = [];
        
        // Notify previous assignee
        appointmentTransferNotifs.push(await notificationService.createNotification({
          user_id: previousUserId,
          type: InternalNotificationType.APPOINTMENT_TRANSFERRED,
          title: `Appointment transferred`,
          message: `Test Customer's appointment on January 15 at 2:00 PM has been reassigned`,
          priority: InternalNotificationPriority.NORMAL,
          action_url: `/appointments/${appointmentId || 'test-appointment-id'}`,
          data: { appointment_id: appointmentId || 'test-appointment-id', transferred_to: newUserId },
          created_by: 'system-test'
        }));
        
        // Notify new assignee
        appointmentTransferNotifs.push(await notificationService.notifyAppointmentAssignment(
          appointmentId || 'test-appointment-id',
          newUserId,
          'Test Customer',
          'January 15 at 2:00 PM',
          'system-test'
        ));
        
        result.notifications = appointmentTransferNotifs;
        break;
        
      case 'status-change':
        // Test ticket status change notification
        result.notification = await notificationService.notifyTicketStatusChange(
          ticketId || 'test-ticket-id',
          'TEST-001',
          userId,
          'completed',
          'Test Customer',
          'system-test'
        );
        break;
        
      case 'list-all':
        // List all recent notifications for debugging
        const { data: notifications, error } = await serviceClient
          .from('internal_notifications')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(10);
          
        if (error) throw error;
        result.notifications = notifications;
        break;
        
      default:
        return NextResponse.json(
          { error: 'Invalid scenario. Use: ticket-assign, ticket-unassign, ticket-transfer, appointment-assign, appointment-unassign, appointment-transfer, status-change, or list-all' },
          { status: 400 }
        );
    }
    
    return NextResponse.json({
      success: true,
      scenario,
      result,
      message: `Test notification for '${scenario}' created successfully. Check the bell icon in the header for real-time update.`
    });
    
  } catch (error) {
    console.error('Test notification error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create test notification' },
      { status: 500 }
    );
  }
}

// GET endpoint to show available test scenarios
export async function GET() {
  return NextResponse.json({
    message: 'Assignment Notification Test Endpoint',
    usage: 'POST to this endpoint with a JSON body',
    scenarios: [
      {
        scenario: 'ticket-assign',
        description: 'Test ticket assignment notification',
        requiredFields: ['userId'],
        optionalFields: ['ticketId']
      },
      {
        scenario: 'ticket-unassign',
        description: 'Test ticket unassignment notification',
        requiredFields: ['userId'],
        optionalFields: ['ticketId']
      },
      {
        scenario: 'ticket-transfer',
        description: 'Test ticket transfer notification (notifies both users)',
        requiredFields: ['previousUserId', 'newUserId'],
        optionalFields: ['ticketId']
      },
      {
        scenario: 'appointment-assign',
        description: 'Test appointment assignment notification',
        requiredFields: ['userId'],
        optionalFields: ['appointmentId']
      },
      {
        scenario: 'appointment-unassign',
        description: 'Test appointment unassignment notification',
        requiredFields: ['userId'],
        optionalFields: ['appointmentId']
      },
      {
        scenario: 'appointment-transfer',
        description: 'Test appointment transfer notification (notifies both users)',
        requiredFields: ['previousUserId', 'newUserId'],
        optionalFields: ['appointmentId']
      },
      {
        scenario: 'status-change',
        description: 'Test ticket status change notification',
        requiredFields: ['userId'],
        optionalFields: ['ticketId']
      },
      {
        scenario: 'list-all',
        description: 'List all recent notifications for a user',
        requiredFields: ['userId']
      }
    ],
    exampleRequest: {
      scenario: 'ticket-assign',
      userId: 'user-uuid-here'
    }
  });
}