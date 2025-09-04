import { CustomerRepository } from "@/lib/repositories/customer.repository";
import { createClient } from "@/lib/supabase/server";
import { NewOrderClient } from "./new-order-client-stable";

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
  
  // Fetch all active devices with manufacturer info
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
  
  // Fetch all active services
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

export default async function NewOrderPage() {
  const [customers, devices, services] = await Promise.all([
    getCustomers(),
    getDevices(),
    getServices()
  ]);
  
  return <NewOrderClient customers={customers} devices={devices} services={services} />;
}