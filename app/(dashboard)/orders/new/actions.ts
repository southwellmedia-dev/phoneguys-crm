"use server";

import { CustomerDeviceRepository } from "@/lib/repositories/customer-device.repository";
import { RepairTicketRepository } from "@/lib/repositories/repair-ticket.repository";
import { CustomerRepository } from "@/lib/repositories/customer.repository";
import { createClient } from "@/lib/supabase/server";

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

export async function createOrder(orderData: any) {
  try {
    const supabase = await createClient();
    
    // Create customer if needed
    let customerId = orderData.customer_id;
    if (!customerId && orderData.new_customer) {
      const customerRepo = new CustomerRepository(true);
      const newCustomer = await customerRepo.create({
        name: orderData.new_customer.name,
        email: orderData.new_customer.email,
        phone: orderData.new_customer.phone,
        address: orderData.new_customer.address,
        city: orderData.new_customer.city,
        state: orderData.new_customer.state,
        zip_code: orderData.new_customer.zip_code,
        notes: orderData.new_customer.notes
      });
      customerId = newCustomer.id;
    }
    
    // Create or update customer device if needed
    let customerDeviceId = orderData.customer_device_id;
    if (!customerDeviceId && orderData.device_id && customerId) {
      const deviceRepo = new CustomerDeviceRepository(true);
      const newDevice = await deviceRepo.create({
        customer_id: customerId,
        device_id: orderData.device_id,
        serial_number: orderData.device_details.serial_number,
        imei: orderData.device_details.imei,
        color: orderData.device_details.color,
        storage_size: orderData.device_details.storage_size
      });
      customerDeviceId = newDevice.id;
    }
    
    // Create repair ticket
    const ticketRepo = new RepairTicketRepository(true);
    const ticket = await ticketRepo.create({
      customer_id: customerId,
      customer_device_id: customerDeviceId,
      device_id: orderData.device_id,
      status: 'pending',
      priority: orderData.priority,
      issue_description: orderData.issue_description,
      internal_notes: orderData.internal_notes,
      estimated_cost: orderData.estimated_cost,
      deposit_amount: orderData.deposit_amount,
      assigned_to: orderData.assigned_to,
      metadata: {
        issue_types: orderData.issue_types,
        selected_services: orderData.selected_services
      }
    });
    
    return { success: true, data: ticket };
  } catch (error) {
    console.error('Error creating order:', error);
    return { success: false, error: error.message };
  }
}