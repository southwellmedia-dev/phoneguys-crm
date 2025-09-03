import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import EditOrderClient from './edit-order-client';
import { CustomerRepository } from '@/lib/repositories/customer.repository';

interface EditOrderPageProps {
  params: Promise<{
    id: string;
  }>;
}

async function getOrderData(orderId: string) {
  const supabase = await createClient();
  
  // Get order with customer info
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
      device_models (
        id,
        model_name,
        model_number,
        manufacturers (
          id,
          name
        )
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
    .from('device_models')
    .select(`
      id,
      model_name,
      model_number,
      device_type,
      common_issues,
      manufacturers (
        id,
        name
      )
    `)
    .eq('is_active', true)
    .order('model_name');
  
  return devices || [];
}

export default async function EditOrderPage({ params }: EditOrderPageProps) {
  const resolvedParams = await params;
  
  const [order, customers, devices] = await Promise.all([
    getOrderData(resolvedParams.id),
    getCustomers(),
    getDevices()
  ]);
  
  if (!order) {
    notFound();
  }
  
  return (
    <EditOrderClient 
      order={order}
      customers={customers}
      devices={devices}
    />
  );
}