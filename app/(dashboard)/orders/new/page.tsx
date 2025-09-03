import { CustomerRepository } from "@/lib/repositories/customer.repository";
import { createClient } from "@/lib/supabase/server";
import { NewOrderClient } from "./new-order-client";

async function getCustomers() {
  const customerRepo = new CustomerRepository(true); // Use service role
  const customers = await customerRepo.findAll();
  return customers.map(c => ({
    id: c.id,
    name: c.name,
    email: c.email,
    phone: c.phone || ""
  }));
}

async function getDevices() {
  const supabase = await createClient();
  
  // Fetch all active device models with manufacturer info
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

export default async function NewOrderPage() {
  const [customers, devices] = await Promise.all([
    getCustomers(),
    getDevices()
  ]);
  
  return <NewOrderClient customers={customers} devices={devices} />;
}