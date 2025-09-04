import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { CustomerRepository } from "@/lib/repositories/customer.repository";
import { RepairTicketRepository } from "@/lib/repositories/repair-ticket.repository";
import { CustomerDeviceService } from "@/lib/services/customer-device.service";
import { CustomerDeviceRepository } from "@/lib/repositories/customer-device.repository";
import { CustomerDetailClient } from "./customer-detail-client";

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  
  // Server action to update a device
  async function updateDevice(deviceId: string, data: any) {
    'use server';
    
    try {
      const customerDeviceRepo = new CustomerDeviceRepository();
      
      // Remove fields that shouldn't be updated
      delete data.id;
      delete data.customer_id;
      delete data.device_id;
      delete data.created_at;
      delete data.updated_at;
      delete data.device; // Remove relation data
      
      // Convert empty strings to null
      Object.keys(data).forEach(key => {
        if (data[key] === '') {
          data[key] = null;
        }
      });
      
      // Handle primary device setting
      if (data.is_primary === true) {
        await customerDeviceRepo.setPrimaryDevice(id, deviceId);
        delete data.is_primary;
      }
      
      // Update the device
      let updatedDevice;
      if (Object.keys(data).length > 0) {
        updatedDevice = await customerDeviceRepo.update(deviceId, data);
      } else {
        updatedDevice = await customerDeviceRepo.findById(deviceId);
      }
      
      // Revalidate the page to show new data
      revalidatePath(`/customers/${id}`);
      
      return { success: true, data: updatedDevice };
    } catch (error) {
      console.error('Error updating device:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to update device' };
    }
  }
  
  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    redirect("/auth/login");
  }

  // Get customer details
  const customerRepo = new CustomerRepository();
  const customer = await customerRepo.findById(id);
  
  if (!customer) {
    notFound();
  }

  // Get customer's repair history
  const ticketRepo = new RepairTicketRepository();
  const repairs = await ticketRepo.findByCustomer(id);

  // Get customer's devices
  const customerDeviceService = new CustomerDeviceService();
  const customerDevices = await customerDeviceService.getCustomerDevices(id);

  return (
    <CustomerDetailClient 
      customer={customer} 
      repairs={repairs}
      customerDevices={customerDevices}
      customerId={id}
      updateDevice={updateDevice}
    />
  );
}