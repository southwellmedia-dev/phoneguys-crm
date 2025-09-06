import { CustomerRepository } from "@/lib/repositories/customer.repository";
import { UserRepository } from "@/lib/repositories/user.repository";
import { createClient } from "@/lib/supabase/server";
import { NewAppointmentClient } from "./new-appointment-client";

async function getCustomers() {
  const customerRepo = new CustomerRepository(true);
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
  
  const { data: devices } = await supabase
    .from('devices')
    .select(`
      id,
      model_name,
      model_number,
      device_type,
      manufacturer:manufacturers (
        id,
        name
      )
    `)
    .eq('is_active', true)
    .order('model_name');
    
  return devices || [];
}

export default async function NewAppointmentPage() {
  const userRepo = new UserRepository(true);
  
  // Get technicians for assignment dropdown
  const technicians = await userRepo.findByRole(['technician', 'manager', 'admin']);
  const technicianList = technicians.map(t => ({
    id: t.id,
    name: t.full_name || t.email || 'Unknown',
    email: t.email,
    role: t.role
  }));
  
  const [customers, devices] = await Promise.all([
    getCustomers(),
    getDevices()
  ]);
  
  return <NewAppointmentClient customers={customers} devices={devices} technicians={technicianList} />;
}