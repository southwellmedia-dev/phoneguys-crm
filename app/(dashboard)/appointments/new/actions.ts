"use server";

import { AppointmentService } from "@/lib/services/appointment.service";
import { CustomerDeviceRepository } from "@/lib/repositories/customer-device.repository";
import { revalidatePath } from "next/cache";

interface CreateAppointmentData {
  customer_id?: string | null;
  new_customer?: { name: string; email: string; phone?: string } | null;
  device_id?: string;
  customer_device_id?: string;
  device_details?: {
    serial_number?: string;
    imei?: string;
    color?: string;
    storage_size?: string;
    condition?: string;
  };
  scheduled_date: string;
  scheduled_time: string;
  duration_minutes: number;
  issues?: string[];
  issue_description?: string;
  internal_notes?: string;
  urgency: 'walk-in' | 'scheduled' | 'emergency';
  source: string;
  status?: string;
  assigned_to?: string;
}

export async function createAppointment(data: CreateAppointmentData) {
  try {
    const appointmentService = new AppointmentService(true);
    
    // Build the customer object for the service
    let customer = undefined;
    if (data.customer_id) {
      customer = { id: data.customer_id };
    } else if (data.new_customer) {
      customer = data.new_customer;
    }
    
    // Build the device object if we have a device_id
    let device = undefined;
    if (data.device_id) {
      device = {
        id: data.device_id,
      };
    }
    
    const appointment = await appointmentService.createAppointment({
      customer,
      device,
      device_details: data.device_details,
      customer_device_id: data.customer_device_id,
      scheduled_date: data.scheduled_date,
      scheduled_time: data.scheduled_time,
      duration_minutes: data.duration_minutes,
      issues: data.issues,
      description: data.issue_description,
      notes: data.internal_notes,
      urgency: data.urgency,
      source: data.source as any,
      assigned_to: data.assigned_to
    });
    
    revalidatePath('/appointments');
    
    return {
      success: true,
      appointmentId: appointment.id,
      appointmentNumber: appointment.appointment_number
    };
  } catch (error) {
    console.error('Error creating appointment:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create appointment'
    };
  }
}

export async function fetchCustomerDevices(customerId: string) {
  try {
    const deviceRepo = new CustomerDeviceRepository(true); // Use service role to bypass RLS
    const devices = await deviceRepo.findByCustomer(customerId);
    
    console.log(`Found ${devices.length} devices for customer ${customerId}`);
    
    return devices || [];
  } catch (error) {
    console.error('Error fetching customer devices:', error);
    return [];
  }
}