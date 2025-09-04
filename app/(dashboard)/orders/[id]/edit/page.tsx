import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import EditOrderClient from './edit-order-client';
import { CustomerRepository } from '@/lib/repositories/customer.repository';
import { CustomerDeviceRepository } from '@/lib/repositories/customer-device.repository';

interface EditOrderPageProps {
  params: Promise<{
    id: string;
  }>;
}

async function getOrderData(orderId: string) {
  const supabase = await createClient();
  
  // Get order with customer info and services
  const { data: order, error } = await supabase
    .from('repair_tickets')
    .select(`
      *,
      customers (
        id,
        name,
        email,
        phone
      ),
      device:devices!device_id (
        id,
        model_name,
        model_number,
        device_type,
        release_year,
        specifications,
        image_url,
        parts_availability,
        manufacturer:manufacturers (
          id,
          name
        )
      ),
      ticket_services (
        id,
        service_id,
        service:services (
          id,
          name,
          category,
          base_price,
          estimated_duration_minutes
        ),
        unit_price,
        quantity,
        technician_notes
      )
    `)
    .eq('id', orderId)
    .single();
  
  if (error || !order) {
    return null;
  }
  
  return order;
}

async function getCustomers() {
  try {
    const customerRepo = new CustomerRepository();
    const result = await customerRepo.findAll();
    return result.data || [];
  } catch (error) {
    console.error('Error fetching customers:', error);
    return [];
  }
}

async function getDevices() {
  const supabase = await createClient();
  const { data: devices } = await supabase
    .from('devices')
    .select(`
      id,
      model_name,
      model_number,
      device_type,
      release_year,
      specifications,
      image_url,
      parts_availability,
      manufacturer:manufacturers (
        id,
        name
      )
    `)
    .eq('is_active', true)
    .order('model_name');
  
  return devices || [];
}

async function getServices() {
  const supabase = await createClient();
  const { data: services } = await supabase
    .from('services')
    .select(`
      id,
      name,
      description,
      category,
      base_price,
      estimated_duration_minutes,
      requires_parts,
      skill_level
    `)
    .eq('is_active', true)
    .order('sort_order')
    .order('name');
  
  return services || [];
}

async function getCustomerDevices(customerId: string) {
  try {
    const customerDeviceRepo = new CustomerDeviceRepository();
    const customerDevices = await customerDeviceRepo.findByCustomer(customerId);
    return customerDevices || [];
  } catch (error) {
    console.error('Error fetching customer devices:', error);
    return [];
  }
}

export default async function EditOrderPage({ params }: EditOrderPageProps) {
  const resolvedParams = await params;
  
  const [order, customers, devices, services] = await Promise.all([
    getOrderData(resolvedParams.id),
    getCustomers(),
    getDevices(),
    getServices()
  ]);
  
  if (!order) {
    notFound();
  }
  
  // Get customer devices if there's a customer
  const customerDevices = order.customer_id ? await getCustomerDevices(order.customer_id) : [];
  
  return (
    <EditOrderClient 
      order={order}
      customers={customers}
      devices={devices}
      services={services}
      customerDevices={customerDevices}
    />
  );
}