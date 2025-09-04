import { AppointmentRepository } from "@/lib/repositories/appointment.repository";
import { AppointmentDetailEnhanced } from "./appointment-detail-enhanced";
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
  const appointment = await appointmentRepo.findById(id);
  
  if (!appointment) {
    notFound();
  }
  
  // Get full appointment details with relations
  const [fullAppointment, services, devices, customerDevices] = await Promise.all([
    appointmentRepo.findByAppointmentNumber(appointment.appointment_number),
    getServices(),
    getDevices(),
    getCustomerDevices(appointment.customer_id)
  ]);
  
  return (
    <AppointmentDetailEnhanced 
      appointment={fullAppointment || appointment}
      appointmentId={id}
      availableServices={services}
      availableDevices={devices}
      customerDevices={customerDevices}
    />
  );
}