import { RepairTicketRepository } from "@/lib/repositories/repair-ticket.repository";
import { UserRepository } from "@/lib/repositories/user.repository";
import { CustomerDeviceRepository } from "@/lib/repositories/customer-device.repository";
import { AppointmentRepository } from "@/lib/repositories/appointment.repository";
import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { TicketDetailPremium } from "./order-detail-premium";
import { createClient } from "@/lib/supabase/server";

async function getOrder(id: string) {
  const ticketRepo = new RepairTicketRepository(true); // Use service role for full access

  try {
    const order = await ticketRepo.getTicketWithDetails(id);
    return order;
  } catch (error) {
    console.error("Error fetching order:", error);
    return null;
  }
}

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const order = await getOrder(resolvedParams.id);

  if (!order) {
    notFound();
  }

  // Check if this device matches a customer device
  let matchingCustomerDevice = null;
  
  // First check if there's a direct customer_device_id link
  if (order.customer_device_id && order.customer_device) {
    matchingCustomerDevice = order.customer_device;
    console.log('Found customer device from order:', matchingCustomerDevice);
  } 
  // Otherwise, try to find a match by serial/IMEI
  else if (order.customer_id) {
    const customerDeviceRepo = new CustomerDeviceRepository();
    const customerDevices = await customerDeviceRepo.findByCustomer(order.customer_id);
    
    // Check for matching device by IMEI or serial number
    if (order.imei || order.serial_number) {
      matchingCustomerDevice = customerDevices.find(device => 
        (order.imei && device.imei === order.imei) ||
        (order.serial_number && device.serial_number === order.serial_number)
      );
    }
  }

  // Server action to add device to customer profile
  async function addDeviceToProfile(data: {
    serial_number?: string;
    imei?: string;
    color?: string;
    storage_size?: string;
  }) {
    'use server';
    
    console.log('addDeviceToProfile called with:', { data, customer_id: order.customer_id, device_id: order.device_id });
    
    if (!order.customer_id || !order.device_id) {
      console.error('Missing required data:', { customer_id: order.customer_id, device_id: order.device_id });
      return { success: false, error: 'Missing customer or device information' };
    }

    if (!data.serial_number && !data.imei) {
      return { success: false, error: 'Please provide either a serial number or IMEI' };
    }

    try {
      const customerDeviceRepo = new CustomerDeviceRepository();
      
      // Check if device already exists
      if (data.imei) {
        const existing = await customerDeviceRepo.findByIMEI(data.imei);
        if (existing && existing.customer_id === order.customer_id) {
          return { success: false, error: 'Device already exists in profile' };
        }
      }
      
      if (data.serial_number) {
        const existing = await customerDeviceRepo.findBySerialNumber(data.serial_number);
        if (existing && existing.customer_id === order.customer_id) {
          return { success: false, error: 'Device already exists in profile' };
        }
      }

      console.log('Creating device with data:', {
        customer_id: order.customer_id,
        device_id: order.device_id,
        serial_number: data.serial_number || null,
        imei: data.imei || null,
        color: data.color || null,
        storage_size: data.storage_size || null,
        is_active: true,
      });

      // Create customer device
      const newDevice = await customerDeviceRepo.create({
        customer_id: order.customer_id,
        device_id: order.device_id,
        serial_number: data.serial_number || null,
        imei: data.imei || null,
        color: data.color || null,
        storage_size: data.storage_size || null,
        is_active: true,
      });

      console.log('Device created successfully:', newDevice);

      // Update the repair ticket with customer_device_id
      const ticketRepo = new RepairTicketRepository(true);
      await ticketRepo.update(params.id, {
        customer_device_id: newDevice.id
      });

      revalidatePath(`/orders/${params.id}`);
      return { success: true, data: newDevice };
    } catch (error) {
      console.error('Error adding device to profile:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to add device to profile' };
    }
  }

  // Get current user to check if they're admin
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  // Use UserRepository to get user details and technicians
  const userRepo = new UserRepository(true); // Use service role
  let isAdmin = false;
  let currentUserId = '';
  
  if (user) {
    // First try to find by auth ID
    let dbUser = await userRepo.findById(user.id);
    
    // If not found by auth ID, check mapping table using service role
    if (!dbUser) {
      const { createServiceClient } = await import('@/lib/supabase/service');
      const serviceClient = createServiceClient();
      
      const { data: mapping } = await serviceClient
        .from('user_id_mapping')
        .select('app_user_id')
        .eq('auth_user_id', user.id)
        .single();
      
      if (mapping) {
        dbUser = await userRepo.findById(mapping.app_user_id);
      }
    }
    
    currentUserId = dbUser?.id || user.id;
    isAdmin = dbUser?.role === 'admin' || dbUser?.role === 'manager';
    console.log('Admin check:', { authId: user.id, dbUser: dbUser?.email, role: dbUser?.role, isAdmin });
  }
  
  // Get all technicians for assignment dropdown
  const technicians = await userRepo.findByRole(['technician', 'manager', 'admin']);
  const technicianList = technicians.map(t => ({
    id: t.id,
    name: t.full_name || t.email || 'Unknown',
    email: t.email,
    role: t.role
  }));

  const totalTimeMinutes = order.time_entries?.reduce(
    (acc: number, entry: any) => acc + (entry.duration_minutes || 0),
    0
  ) || 0;

  // Fetch appointment data if this ticket was created from an appointment
  let appointmentData = null;
  if (order.appointment_id) {
    try {
      const appointmentRepo = new AppointmentRepository(true);
      const appointment = await appointmentRepo.findById(order.appointment_id);
      if (appointment) {
        appointmentData = {
          appointment_number: appointment.appointment_number,
          scheduled_date: appointment.scheduled_date,
          scheduled_time: appointment.scheduled_time,
          issues: appointment.issues,
          description: appointment.description,
          notes: appointment.notes,
          urgency: appointment.urgency,
          source: appointment.source,
          created_at: appointment.created_at
        };
      }
    } catch (error) {
      console.error('Error fetching appointment:', error);
    }
  }

  return (
    <TicketDetailPremium 
      order={order} 
      orderId={resolvedParams.id} 
      totalTimeMinutes={totalTimeMinutes}
      isAdmin={isAdmin}
      currentUserId={currentUserId}
      matchingCustomerDevice={matchingCustomerDevice}
      addDeviceToProfile={addDeviceToProfile}
      appointmentData={appointmentData}
      technicians={technicianList}
    />
  );
}