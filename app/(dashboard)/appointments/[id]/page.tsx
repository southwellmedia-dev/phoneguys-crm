import { AppointmentRepository } from "@/lib/repositories/appointment.repository";
import { UserRepository } from "@/lib/repositories/user.repository";
import { AppointmentDetailPremium } from "./appointment-detail-premium";
import { createServiceClient } from "@/lib/supabase/service";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getServices() {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from('services')
    .select('*')
    .eq('is_active', true)
    .order('sort_order');
  return data || [];
}

async function getDevices() {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from('devices')
    .select(`
      id,
      model_name,
      image_url,
      thumbnail_url,
      manufacturer:manufacturers(name)
    `)
    .eq('is_active', true)
    .order('model_name');
  return data || [];
}

async function getCustomerDevices(customerId: string | null) {
  if (!customerId) return [];
  
  const supabase = createServiceClient();
  const { data } = await supabase
    .from('customer_devices')
    .select(`
      id,
      device_id,
      serial_number,
      imei,
      color,
      storage_size,
      condition,
      nickname,
      devices:device_id (
        id,
        model_name,
        image_url,
        thumbnail_url,
        manufacturer:manufacturers(name)
      )
    `)
    .eq('customer_id', customerId)
    .eq('is_active', true);
  
  return data || [];
}

export default async function AppointmentDetailPage({ params }: PageProps) {
  const { id } = await params;
  
  const appointmentRepo = new AppointmentRepository(true);
  const userRepo = new UserRepository(true);
  
  // Get full appointment details with all relations
  const fullAppointment = await appointmentRepo.findByIdWithDetails(id);
  
  if (!fullAppointment) {
    notFound();
  }
  
  // Get technicians for assignment dropdown
  const technicians = await userRepo.findByRole(['technician', 'manager', 'admin']);
  const technicianList = technicians.map(t => ({
    id: t.id,
    name: t.full_name || t.email || 'Unknown',
    email: t.email,
    role: t.role
  }));
  
  // Get additional data
  const [services, devices, customerDevices] = await Promise.all([
    getServices(),
    getDevices(),
    getCustomerDevices(fullAppointment.customer_id)
  ]);
  
  return (
    <AppointmentDetailPremium 
      appointment={fullAppointment}
      appointmentId={id}
      availableServices={services}
      availableDevices={devices}
      customerDevices={customerDevices}
      technicians={technicianList}
    />
  );
}