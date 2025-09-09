import { notFound } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/service";
import { AppointmentAssistant } from "./appointment-assistant";

export default async function AppointmentAssistantPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const supabase = createServiceClient();
  
  // Await params before using its properties
  const { id } = await params;
  
  // Fetch appointment with all related data
  const { data: appointment, error } = await supabase
    .from("appointments")
    .select(`
      *,
      customers:customer_id (
        id,
        name,
        email,
        phone,
        address,
        city,
        state,
        zip_code,
        total_orders,
        notes
      ),
      devices:device_id (
        id,
        manufacturer_id,
        model_name,
        model_number,
        device_type
      ),
      customer_devices:customer_device_id (
        id,
        serial_number,
        imei,
        color,
        storage_size,
        condition,
        nickname,
        notes
      )
    `)
    .eq("id", id)
    .single();

  if (error || !appointment) {
    notFound();
  }

  // Fetch available services
  const { data: services } = await supabase
    .from("services")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  // Fetch available devices
  const { data: devices } = await supabase
    .from("devices")
    .select(`
      *,
      manufacturers (*)
    `)
    .eq("is_active", true)
    .order("model_name", { ascending: true });

  // Fetch customer's devices
  const { data: customerDevices } = await supabase
    .from("customer_devices")
    .select(`
      *,
      devices (
        id,
        model_name,
        manufacturers (name)
      )
    `)
    .eq("customer_id", appointment.customer_id)
    .eq("is_active", true);

  // Fetch technicians for assignment
  const { data: technicians } = await supabase
    .from("users")
    .select("id, full_name, email, role")
    .in("role", ["technician", "admin"])
    .order("full_name");

  return (
    <AppointmentAssistant
      appointment={appointment}
      services={services || []}
      devices={devices || []}
      customerDevices={customerDevices || []}
      technicians={technicians || []}
    />
  );
}