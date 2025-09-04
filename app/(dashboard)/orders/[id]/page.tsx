import { RepairTicketRepository } from "@/lib/repositories/repair-ticket.repository";
import { UserRepository } from "@/lib/repositories/user.repository";
import { CustomerDeviceRepository } from "@/lib/repositories/customer-device.repository";
import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { OrderDetailClient } from "./order-detail-client";
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
  params: { id: string };
}) {
  const order = await getOrder(params.id);

  if (!order) {
    notFound();
  }

  // Check if this device matches a customer device
  let matchingCustomerDevice = null;
  if (order.customer_id) {
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
  
  // Use UserRepository to get user details
  let isAdmin = false;
  let currentUserId = '';
  if (user) {
    const userRepo = new UserRepository(true); // Use service role
    
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
    isAdmin = dbUser?.role === 'admin';
    console.log('Admin check:', { authId: user.id, dbUser: dbUser?.email, role: dbUser?.role, isAdmin });
  }

  const totalTimeMinutes = order.time_entries?.reduce(
    (acc: number, entry: any) => acc + (entry.duration_minutes || 0),
    0
  ) || 0;

  return (
    <OrderDetailClient 
      order={order} 
      orderId={params.id} 
      totalTimeMinutes={totalTimeMinutes}
      isAdmin={isAdmin}
      currentUserId={currentUserId}
      matchingCustomerDevice={matchingCustomerDevice}
      addDeviceToProfile={addDeviceToProfile}
    />
  );
}