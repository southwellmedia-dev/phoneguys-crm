import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PremiumOrderDetailClient } from "./premium-order-detail-client";
import { Sidebar } from "@/components/layout/sidebar";

export default async function PremiumOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  
  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    notFound();
  }

  // Fetch user details to determine role
  const { data: userData } = await supabase
    .from('users')
    .select('role, full_name')
    .eq('id', user.id)
    .single();
    
  const userRole = userData?.role || 'technician';
  const isAdmin = userRole === 'admin' || userRole === 'owner';

  // Fetch the order with all related data
  const { data: order, error } = await supabase
    .from('repair_tickets')
    .select(`
      *,
      customers:customers!customer_id (
        id,
        name,
        email,
        phone,
        address
      ),
      device:devices!device_id (
        id,
        manufacturer:manufacturers!manufacturer_id (
          id,
          name
        ),
        model_name,
        device_type,
        release_year,
        image_url,
        parts_availability
      ),
      users:users!assigned_to (
        id,
        email,
        full_name,
        role
      ),
      ticket_services (
        id,
        quantity,
        unit_price,
        technician_notes,
        service:services!service_id (
          id,
          name,
          category,
          base_price,
          estimated_minutes,
          description
        )
      ),
      ticket_notes (
        id,
        content,
        note_type,
        is_important,
        created_at,
        users:users!created_by (
          id,
          email,
          full_name
        )
      ),
      time_entries (
        id,
        duration_minutes,
        description,
        created_at,
        users:users!user_id (
          id,
          email,
          full_name
        )
      )
    `)
    .eq('id', id)
    .single();

  if (error || !order) {
    notFound();
  }

  // Check if device is in customer's profile
  let matchingCustomerDevice = null;
  if (order.customer_id && order.device_id) {
    const { data: customerDevice } = await supabase
      .from('customer_devices')
      .select('*')
      .eq('customer_id', order.customer_id)
      .eq('device_id', order.device_id)
      .maybeSingle();
    
    matchingCustomerDevice = customerDevice;
  }

  // Check if ticket was created from an appointment
  let appointmentData = null;
  if (order.appointment_id) {
    const { data: appointment } = await supabase
      .from('appointments')
      .select('*')
      .eq('id', order.appointment_id)
      .single();
    
    appointmentData = appointment;
  }

  // Fetch all technicians for assignment dropdown
  const { data: technicians } = await supabase
    .from('users')
    .select('id, email, full_name, role')
    .in('role', ['technician', 'admin', 'owner'])
    .order('full_name');

  // Calculate total time
  const totalTimeMinutes = order.time_entries?.reduce(
    (acc: number, entry: any) => acc + (entry.duration_minutes || 0),
    0
  ) || order.timer_total_minutes || order.total_time_minutes || 0;

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-hidden">
        <PremiumOrderDetailClient
          order={order}
          orderId={id}
          totalTimeMinutes={totalTimeMinutes}
          isAdmin={isAdmin}
          currentUserId={user.id}
          matchingCustomerDevice={matchingCustomerDevice}
          appointmentData={appointmentData}
          technicians={technicians?.map(tech => ({
            id: tech.id,
            name: tech.full_name || tech.email || 'Unknown',
            email: tech.email || '',
            role: tech.role || 'technician'
          })) || []}
        />
      </main>
    </div>
  );
}