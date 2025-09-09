"use server";

import { AppointmentService } from "@/lib/services/appointment.service";
import { AppointmentRepository } from "@/lib/repositories/appointment.repository";
import { createServiceClient } from "@/lib/supabase/service";
import { revalidatePath } from "next/cache";

export async function updateAppointmentDetails(appointmentId: string, details: any) {
  try {
    console.log('Updating appointment with details:', details);
    const appointmentRepo = new AppointmentRepository(true);
    const supabase = createServiceClient();
    
    // Get the current appointment to check customer
    const currentAppointment = await appointmentRepo.findById(appointmentId);
    if (!currentAppointment) {
      throw new Error('Appointment not found');
    }
    
    // Update the appointment with new details
    // Combine both notes into a JSON structure
    const notesData = {
      customer_notes: details.customer_notes || '',
      technician_notes: details.technician_notes || ''
    };
    
    const updateData: any = {
      device_id: details.device_id || null,
      customer_device_id: details.customer_device_id || null,
      service_ids: details.selected_services || details.service_ids || [],
      estimated_cost: details.estimated_cost || 0,
      notes: JSON.stringify(notesData),
    };

    console.log('Update data being sent to repository:', updateData);

    // Handle assigned_to field if provided
    if (details.assigned_to !== undefined) {
      updateData.assigned_to = details.assigned_to;
    }
    
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
    if (details.additional_issues) {
      updateData.issues = [...(currentAppointment.issues || []), ...details.additional_issues.split(',').map((i: string) => i.trim())];
    }
    
    const updatedAppointment = await appointmentRepo.update(appointmentId, updateData);
    console.log('Appointment updated successfully:', updatedAppointment);
    
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

export async function confirmAppointment(appointmentId: string, confirmationNotes?: string) {
  try {
    const supabase = createServiceClient();
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    // Update appointment with confirmed status and tracking fields
    const { error } = await supabase
      .from('appointments')
      .update({
        status: 'confirmed',
        confirmed_at: new Date().toISOString(),
        confirmed_by: user?.id || null,
        confirmation_notes: confirmationNotes || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', appointmentId);
    
    if (error) throw error;
    
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
    const supabase = createServiceClient();
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    // Update appointment with arrived status and tracking fields
    const { error } = await supabase
      .from('appointments')
      .update({
        status: 'arrived',
        arrived_at: new Date().toISOString(),
        checked_in_by: user?.id || null,
        check_in_notes: checkInNotes || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', appointmentId);
    
    if (error) throw error;
    
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