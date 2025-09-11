import { NextRequest, NextResponse } from 'next/server';
import { getRepository } from '@/lib/repositories/repository-manager';
import { requireAuth, handleApiError, successResponse } from '@/lib/auth/helpers';
import { InternalNotificationService } from '@/lib/services/internal-notification.service';
import { InternalNotificationType, InternalNotificationPriority } from '@/lib/types/internal-notification.types';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(request: NextRequest, params: RouteParams) {
  try {
    // Await params in Next.js 15
    const { id } = await params.params;
    
    // Require authentication
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) return authResult;

    // Get repository instance
    const appointmentRepo = getRepository.appointments();
    
    // Fetch appointment with relations
    const appointment = await appointmentRepo.findById(id);
    
    if (!appointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      );
    }

    return successResponse(appointment);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest, params: RouteParams) {
  try {
    // Await params in Next.js 15
    const { id } = await params.params;
    
    // Require authentication
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) return authResult;

    const body = await request.json();
    
    // Get repository instance
    const appointmentRepo = getRepository.appointments();
    
    // Check if appointment exists
    const existingAppointment = await appointmentRepo.findById(id);
    if (!existingAppointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      );
    }

    // Prevent reassignment of converted appointments
    if (body.assigned_to !== undefined && existingAppointment.converted_to_ticket_id) {
      return NextResponse.json(
        { error: 'Cannot change assignment for converted appointments' },
        { status: 400 }
      );
    }

    // Prevent reassignment of cancelled appointments
    if (body.assigned_to !== undefined && existingAppointment.status === 'cancelled') {
      return NextResponse.json(
        { error: 'Cannot change assignment for cancelled appointments' },
        { status: 400 }
      );
    }

    // Prevent reassignment of no-show appointments
    if (body.assigned_to !== undefined && existingAppointment.status === 'no_show') {
      return NextResponse.json(
        { error: 'Cannot change assignment for no-show appointments' },
        { status: 400 }
      );
    }

    // Define allowed fields for update
    const allowedFields = ['assigned_to', 'status', 'notes', 'follow_up_notes'];
    
    // Filter body to only include allowed fields
    const updateData = Object.keys(body)
      .filter(key => allowedFields.includes(key))
      .reduce((obj, key) => {
        obj[key] = body[key];
        return obj;
      }, {} as any);

    // Update appointment
    const updatedAppointment = await appointmentRepo.update(id, updateData);

    // Handle notifications for assignment changes
    if (updateData.assigned_to !== undefined && updateData.assigned_to !== existingAppointment.assigned_to) {
      try {
        const notificationService = new InternalNotificationService(true);
        
        // Get customer info for the notification
        const customerRepo = getRepository.customers();
        const customer = existingAppointment.customer_id 
          ? await customerRepo.findById(existingAppointment.customer_id)
          : null;
        
        const customerName = customer?.name || 'Unknown Customer';
        
        // Format appointment date and time
        const appointmentDate = new Date(existingAppointment.scheduled_date + 'T' + existingAppointment.scheduled_time);
        const formattedDate = appointmentDate.toLocaleDateString('en-US', { 
          month: 'long', 
          day: 'numeric'
        });
        const formattedTime = appointmentDate.toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit',
          hour12: true 
        });
        const appointmentDateTime = `${formattedDate} at ${formattedTime}`;
        
        // Check if this is an unassignment, transfer, or new assignment
        const previousAssignee = existingAppointment.assigned_to;
        const newAssignee = updateData.assigned_to;
        
        if (!newAssignee && previousAssignee) {
          // Appointment was unassigned - notify the previous assignee
          console.log('📤 Creating appointment unassignment notification for:', previousAssignee);
          await notificationService.createNotification({
            user_id: previousAssignee,
            type: InternalNotificationType.APPOINTMENT_UNASSIGNED,
            title: `Unassigned from appointment`,
            message: `You've been unassigned from ${customerName}'s appointment on ${appointmentDateTime}`,
            priority: InternalNotificationPriority.NORMAL,
            action_url: `/appointments/${id}`,
            data: { appointment_id: id },
            created_by: authResult.userId
          });
        } else if (newAssignee && previousAssignee && newAssignee !== previousAssignee) {
          // Appointment was transferred - notify both users
          console.log('🔄 Creating appointment transfer notifications');
          
          // Notify the previous assignee
          await notificationService.createNotification({
            user_id: previousAssignee,
            type: InternalNotificationType.APPOINTMENT_TRANSFERRED,
            title: `Appointment transferred`,
            message: `${customerName}'s appointment on ${appointmentDateTime} has been reassigned`,
            priority: InternalNotificationPriority.NORMAL,
            action_url: `/appointments/${id}`,
            data: { appointment_id: id, transferred_to: newAssignee },
            created_by: authResult.userId
          });
          
          // Notify the new assignee
          await notificationService.notifyAppointmentAssignment(
            id,
            newAssignee,
            customerName,
            appointmentDateTime,
            authResult.userId
          );
        } else if (newAssignee && !previousAssignee) {
          // New assignment - just notify the new assignee
          console.log('📨 Creating appointment assignment notification for:', newAssignee);
          await notificationService.notifyAppointmentAssignment(
            id,
            newAssignee,
            customerName,
            appointmentDateTime,
            authResult.userId
          );
        }
        
        console.log('✅ Appointment notification(s) created successfully');
      } catch (notifError) {
        console.error('❌ Failed to create assignment notification:', notifError);
        // Don't fail the request if notification fails
      }
    }

    return successResponse(
      updatedAppointment,
      'Appointment updated successfully'
    );
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest, params: RouteParams) {
  try {
    // Await params in Next.js 15
    const { id } = await params.params;
    
    // Require authentication
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) return authResult;

    // Check if user is admin or manager
    if (authResult.role !== 'admin' && !authResult.isManager) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Get repository instance
    const appointmentRepo = getRepository.appointments();
    
    // Check if appointment exists
    const existingAppointment = await appointmentRepo.findById(id);
    if (!existingAppointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      );
    }

    // Prevent deletion of converted appointments
    if (existingAppointment.converted_to_ticket_id) {
      return NextResponse.json(
        { error: 'Cannot delete converted appointments' },
        { status: 400 }
      );
    }

    // Delete appointment
    await appointmentRepo.delete(id);

    return successResponse(null, 'Appointment deleted successfully');
  } catch (error) {
    return handleApiError(error);
  }
}