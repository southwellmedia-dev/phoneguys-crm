"use server";

import { AppointmentService } from "@/lib/services/appointment.service";
import { CustomerDeviceRepository } from "@/lib/repositories/customer-device.repository";
import { revalidatePath } from "next/cache";

interface CreateAppointmentData {
  customer: { id?: string; name?: string; email?: string; phone?: string };
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
  description?: string;
  notes?: string;
  urgency: 'walk-in' | 'scheduled' | 'emergency';
  source: 'walk-in' | 'website' | 'phone' | 'email';
}

export async function createAppointment(data: CreateAppointmentData) {
  try {
    const appointmentService = new AppointmentService(true);
    
    // Build the device object if we have a device_id
    let device = undefined;
    if (data.device_id) {
      device = {
        id: data.device_id,
      };
    }
    
    const appointment = await appointmentService.createAppointment({
      customer: data.customer,
      device,
      device_details: data.device_details,
      customer_device_id: data.customer_device_id,
      scheduled_date: data.scheduled_date,
      scheduled_time: data.scheduled_time,
      duration_minutes: data.duration_minutes,
      issues: data.issues,
      description: data.description,
      notes: data.notes,
      urgency: data.urgency,
      source: data.source
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
    
    // Map the devices to match the expected structure for DeviceSelector
    // The repository returns 'device' but DeviceSelector expects 'devices'
    const mappedDevices = devices.map((cd: any) => ({
      ...cd,
      devices: cd.device // Map 'device' to 'devices' for compatibility
    }));
    
    console.log(`Found ${mappedDevices.length} devices for customer ${customerId}`);
    
    return {
      success: true,
      devices: mappedDevices
    };
  } catch (error) {
    console.error('Error fetching customer devices:', error);
    return {
      success: false,
      devices: [],
      error: error instanceof Error ? error.message : 'Failed to fetch devices'
    };
  }
}