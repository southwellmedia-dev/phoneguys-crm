import { CustomerRepository } from "@/lib/repositories/customer.repository";
import { UserRepository } from "@/lib/repositories/user.repository";
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

async function getTechnicians() {
  const userRepo = new UserRepository(true); // Use service role
  // Get all technicians and managers who can be assigned tickets
  const users = await userRepo.findByRole(['technician', 'manager', 'admin']);
  return users.map(u => ({
    id: u.id,
    name: u.full_name || u.email || 'Unknown',
    email: u.email,
    role: u.role
  }));
}

export default async function NewOrderPage() {
  const [customers, devices, services, technicians] = await Promise.all([
    getCustomers(),
    getDevices(),
    getServices(),
    getTechnicians()
  ]);
  
  return <NewOrderClient 
    customers={customers} 
    devices={devices} 
    services={services} 
    technicians={technicians} 
  />;
}