import { CustomerRepository } from "@/lib/repositories/customer.repository";
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
  const [customers, devices] = await Promise.all([
    getCustomers(),
    getDevices()
  ]);
  
  return <NewAppointmentClient customers={customers} devices={devices} />;
}