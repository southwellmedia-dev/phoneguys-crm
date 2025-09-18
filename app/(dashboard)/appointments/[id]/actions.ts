"use server";

import { AppointmentService } from "@/lib/services/appointment.service";
import { AppointmentRepository } from "@/lib/repositories/appointment.repository";
import { InternalNotificationService } from "@/lib/services/internal-notification.service";
import { InternalNotificationPriority, InternalNotificationType } from "@/lib/types/internal-notification.types";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateAppointmentDetails(appointmentId: string, details: any) {
  try {
    console.log('🎯 SERVER ACTION: updateAppointmentDetails called with:', { appointmentId, details });
    const appointmentRepo = new AppointmentRepository(true);
    const supabase = await createClient();
    
    // Get the current appointment to check customer
    const currentAppointment = await appointmentRepo.findById(appointmentId);
    if (!currentAppointment) {
      throw new Error('Appointment not found');
    }
    
    // Build update data object - only include fields that were actually provided
    const updateData: any = {};
    
    // Only update device fields if they were provided
    if (details.device_id !== undefined) {
      updateData.device_id = details.device_id;
    }
    
    if (details.customer_device_id !== undefined) {
      updateData.customer_device_id = details.customer_device_id;
    }
    
    // Only update services if explicitly provided
    if (details.selected_services !== undefined || details.service_ids !== undefined) {
      updateData.service_ids = details.selected_services || details.service_ids || [];
    }
    
    // Only update estimated cost if provided
    if (details.estimated_cost !== undefined) {
      updateData.estimated_cost = details.estimated_cost;
    }
    
    // Only update notes if customer_notes or technician_notes were provided
    if (details.customer_notes !== undefined || details.technician_notes !== undefined) {
      // Parse existing notes if they exist
      let existingNotes = { customer_notes: '', technician_notes: '' };
      if (currentAppointment.notes) {
        try {
          if (typeof currentAppointment.notes === 'string' && currentAppointment.notes.startsWith('{')) {
            existingNotes = JSON.parse(currentAppointment.notes);
          } else if (typeof currentAppointment.notes === 'object') {
            existingNotes = currentAppointment.notes;
          }
        } catch (e) {
          // If parsing fails, treat as plain text in customer_notes
          existingNotes = { customer_notes: currentAppointment.notes, technician_notes: '' };
        }
      }
      
      const notesData = {
        customer_notes: details.customer_notes !== undefined ? details.customer_notes : existingNotes.customer_notes || '',
        technician_notes: details.technician_notes !== undefined ? details.technician_notes : existingNotes.technician_notes || ''
      };
      updateData.notes = JSON.stringify(notesData);
    }

    // Handle assigned_to field if provided
    if (details.assigned_to !== undefined) {
      updateData.assigned_to = details.assigned_to;
    }

    console.log('Update data being sent to repository:', updateData);
    
    // If a customer device is selected but no device_id, get the device_id from customer device
    if (details.customer_device_id && !details.device_id) {
      const { data: customerDevice } = await supabase
        .from('customer_devices')
        .select('device_id')
        .eq('id', details.customer_device_id)
        .single();
      
      if (customerDevice?.device_id) {
        updateData.device_id = customerDevice.device_id;
      }
    }
    
    // Add any additional issues to the issues array
    if (details.additional_issues !== undefined && details.additional_issues !== '') {
      const newIssues = details.additional_issues.split(',').map((i: string) => i.trim()).filter((i: string) => i);
      if (newIssues.length > 0) {
        updateData.issues = [...(currentAppointment.issues || []), ...newIssues];
      }
    }
    
    const updatedAppointment = await appointmentRepo.update(appointmentId, updateData);
    console.log('Appointment updated successfully:', updatedAppointment);
    
    // Send notification if appointment was assigned, unassigned, or transferred
    console.log('🔔 SERVER ACTION: Checking appointment assignment:', {
      'details.assigned_to': details.assigned_to,
      'currentAppointment.assigned_to': currentAppointment.assigned_to,
      'should_notify': details.assigned_to !== undefined && details.assigned_to !== currentAppointment.assigned_to
    });
    
    if (details.assigned_to !== undefined && details.assigned_to !== currentAppointment.assigned_to) {
      try {
        console.log('📨 Creating appointment assignment notification');
        
        // Get the current user
        const userSupabase = await createClient();
        const { data: { user } } = await userSupabase.auth.getUser();
        
        const notificationService = new InternalNotificationService(true);
        
        // Get customer info
        const { data: customer } = await supabase
          .from('customers')
          .select('name')
          .eq('id', currentAppointment.customer_id)
          .single();
        
        // Format appointment date and time
        const appointmentDate = new Date(currentAppointment.scheduled_date + 'T' + currentAppointment.scheduled_time);
        const formattedDate = appointmentDate.toLocaleDateString('en-US', { 
          month: 'long', 
          day: 'numeric'
        });
        const formattedTime = appointmentDate.toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit',
          hour12: true 
        });
        
        const customerName = customer?.name || 'Unknown Customer';
        const appointmentTime = `${formattedDate} at ${formattedTime}`;
        
        // Handle different assignment scenarios
        if (!details.assigned_to && currentAppointment.assigned_to) {
          // Appointment was unassigned - notify the previous assignee
          await notificationService.createNotification({
            user_id: currentAppointment.assigned_to,
            type: InternalNotificationType.APPOINTMENT_UNASSIGNED,
            title: `Unassigned from appointment`,
            message: `You've been unassigned from ${customerName}'s appointment on ${appointmentTime}`,
            priority: InternalNotificationPriority.NORMAL,
            action_url: `/appointments/${appointmentId}`,
            data: { appointment_id: appointmentId },
            created_by: user?.id
          });
        } else if (details.assigned_to && currentAppointment.assigned_to && details.assigned_to !== currentAppointment.assigned_to) {
          // Appointment was transferred - notify both users
          // Notify the previous assignee
          await notificationService.createNotification({
            user_id: currentAppointment.assigned_to,
            type: InternalNotificationType.APPOINTMENT_TRANSFERRED,
            title: `Appointment transferred`,
            message: `${customerName}'s appointment on ${appointmentTime} has been reassigned`,
            priority: InternalNotificationPriority.NORMAL,
            action_url: `/appointments/${appointmentId}`,
            data: { appointment_id: appointmentId, transferred_to: details.assigned_to },
            created_by: user?.id
          });
          
          // Notify the new assignee
          await notificationService.notifyAppointmentAssignment(
            appointmentId,
            details.assigned_to,
            customerName,
            appointmentTime,
            user?.id
          );
        } else if (details.assigned_to && !currentAppointment.assigned_to) {
          // New assignment - just notify the new assignee
          console.log('📝 Creating new assignment notification for:', {
            appointmentId,
            assignedTo: details.assigned_to,
            currentUserId: user?.id,
            isSelfAssignment: details.assigned_to === user?.id
          });
          
          const notification = await notificationService.notifyAppointmentAssignment(
            appointmentId,
            details.assigned_to,
            customerName,
            appointmentTime,
            user?.id
          );
          
          console.log('✅ Notification created:', notification);
        }
        
        console.log('✅ Appointment assignment notification created successfully');
      } catch (notifError) {
        console.error('❌ Failed to create assignment notification:', notifError);
        // Don't fail the request if notification fails
      }
    }
    
    // If a new device was added (not selecting existing), create/update customer device
    if (details.device_id && !details.customer_device_id && currentAppointment.customer_id) {
      // Check if this device already exists for this customer
      const { data: existingDevice } = await supabase
        .from('customer_devices')
        .select('id')
        .eq('customer_id', currentAppointment.customer_id)
        .eq('device_id', details.device_id)
        .eq('serial_number', details.serial_number)
        .single();
      
      if (!existingDevice) {
        // Create new customer device entry
        const { data: newDevice, error } = await supabase
          .from('customer_devices')
          .insert({
            customer_id: currentAppointment.customer_id,
            device_id: details.device_id,
            serial_number: details.serial_number,
            imei: details.imei,
            color: details.color,
            storage_size: details.storage_size,
            condition: details.device_condition,
          })
          .select()
          .single();
        
        if (!error && newDevice) {
          // Update appointment with the new customer device id
          await appointmentRepo.update(appointmentId, {
            customer_device_id: newDevice.id
          });
        }
      } else {
        // Update existing customer device
        await supabase
          .from('customer_devices')
          .update({
            imei: details.imei,
            color: details.color,
            storage_size: details.storage_size,
            condition: details.device_condition,
          })
          .eq('id', existingDevice.id);
        
        // Update appointment with the customer device id
        await appointmentRepo.update(appointmentId, {
          customer_device_id: existingDevice.id
        });
      }
    }
    
    revalidatePath(`/appointments/${appointmentId}`);
    
    return { success: true };
  } catch (error) {
    console.error('Error updating appointment details:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update appointment details'
    };
  }
}

export async function convertAppointmentToTicket(appointmentId: string, additionalData?: any) {
  try {
    const appointmentService = new AppointmentService(true);
    
    // Pass the additional data (device details, services, notes) to the service
    const result = await appointmentService.convertToTicket(appointmentId, additionalData);
    
    revalidatePath('/appointments');
    revalidatePath(`/appointments/${appointmentId}`);
    revalidatePath('/orders');
    
    return {
      success: true,
      ticket: result.ticket,
      ticketNumber: result.ticket.ticket_number
    };
  } catch (error) {
    console.error('Error converting appointment:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to convert appointment'
    };
  }
}

export async function confirmAppointment(appointmentId: string, confirmationNotes?: string, assigneeId?: string) {
  try {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    // Build update object
    const updateData: any = {
      status: 'confirmed',
      confirmed_at: new Date().toISOString(),
      confirmed_by: user?.id || null,
      confirmation_notes: confirmationNotes || null,
      updated_at: new Date().toISOString()
    };
    
    // Add assignee if provided
    if (assigneeId) {
      updateData.assigned_to = assigneeId;
    }
    
    // Update appointment with confirmed status and tracking fields
    const { error: updateError } = await supabase
      .from('appointments')
      .update(updateData)
      .eq('id', appointmentId);
    
    if (updateError) throw updateError;
    
    // If confirmation notes were provided, also create a comment
    if (confirmationNotes && confirmationNotes.trim()) {
      const { error: commentError } = await supabase
        .from('comments')
        .insert({
          entity_type: 'appointment',
          entity_id: appointmentId,
          content: `Appointment confirmed: ${confirmationNotes}`,
          visibility: 'internal', // Internal staff note
          is_public: true, // But visible to customer on status page
          user_id: user?.id || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('*, user:users(id, email, full_name, username)')
        .single();
      
      if (commentError) {
        console.error('Error creating confirmation comment:', commentError);
        // Don't fail the whole operation if comment creation fails
      }
    }
    
    // Send customer notifications for appointment confirmation
    try {
      const { data: appointmentData } = await supabase
        .from('appointments')
        .select(`
          *,
          customers(*),
          devices(id, brand, model_name),
          customer_devices(*)
        `)
        .eq('id', appointmentId)
        .single();

      if (appointmentData && appointmentData.customers) {
        const { getAppointmentNotificationService } = await import('@/lib/services/appointment-notifications.service');
        const notificationService = getAppointmentNotificationService();

        // Format issues for display
        const formattedIssues = appointmentData.issues ? 
          (Array.isArray(appointmentData.issues) ? appointmentData.issues : [appointmentData.issues])
            .map((issue: string) => 
              issue.replace(/_/g, ' ')
                .split(' ')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ')
            ) : ['General Diagnosis'];

        // Send confirmation notifications
        await notificationService.sendAppointmentConfirmedNotifications({
          appointment: appointmentData,
          customer: appointmentData.customers,
          device: appointmentData.devices,
          issues: formattedIssues,
          confirmedBy: user?.id
        });

        console.log('✅ Appointment confirmation notifications sent');
      }
    } catch (error) {
      console.error('Error sending confirmation notifications:', error);
      // Don't fail the confirmation if notifications fail
    }
    
    revalidatePath('/appointments');
    revalidatePath(`/appointments/${appointmentId}`);
    
    return { success: true };
  } catch (error) {
    console.error('Error confirming appointment:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to confirm appointment'
    };
  }
}

export async function markAppointmentArrived(appointmentId: string, checkInNotes?: string) {
  try {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    // Update appointment with arrived status and tracking fields
    const { error: updateError } = await supabase
      .from('appointments')
      .update({
        status: 'arrived',
        arrived_at: new Date().toISOString(),
        checked_in_by: user?.id || null,
        check_in_notes: checkInNotes || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', appointmentId);
    
    if (updateError) throw updateError;
    
    // If check-in notes were provided, also create a comment
    if (checkInNotes && checkInNotes.trim()) {
      const { error: commentError } = await supabase
        .from('comments')
        .insert({
          entity_type: 'appointment',
          entity_id: appointmentId,
          content: `Customer checked in: ${checkInNotes}`,
          visibility: 'internal', // Internal staff note
          is_public: true, // But visible to customer on status page
          user_id: user?.id || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('*, user:users(id, email, full_name, username)')
        .single();
      
      if (commentError) {
        console.error('Error creating check-in comment:', commentError);
        // Don't fail the whole operation if comment creation fails
      }
    }
    
    revalidatePath('/appointments');
    revalidatePath(`/appointments/${appointmentId}`);
    
    return { success: true };
  } catch (error) {
    console.error('Error marking appointment as arrived:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update appointment'
    };
  }
}

export async function cancelAppointment(appointmentId: string, reason: string) {
  try {
    const appointmentService = new AppointmentService(true);
    await appointmentService.cancelAppointment(appointmentId, reason);
    
    revalidatePath('/appointments');
    revalidatePath(`/appointments/${appointmentId}`);
    
    return { success: true };
  } catch (error) {
    console.error('Error cancelling appointment:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to cancel appointment'
    };
  }
}