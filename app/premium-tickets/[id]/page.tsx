import { RepairTicketRepository } from "@/lib/repositories/repair-ticket.repository";
import { UserRepository } from "@/lib/repositories/user.repository";
import { CustomerDeviceRepository } from "@/lib/repositories/customer-device.repository";
import { AppointmentRepository } from "@/lib/repositories/appointment.repository";
import { notFound } from "next/navigation";
import { PremiumTicketDetailClient } from "./premium-ticket-detail-client";
import { createClient } from "@/lib/supabase/server";

async function getTicket(id: string) {
  const ticketRepo = new RepairTicketRepository(true); // Use service role for full access

  try {
    const ticket = await ticketRepo.getTicketWithDetails(id);
    return ticket;
  } catch (error) {
    console.error("Error fetching ticket:", error);
    return null;
  }
}

export default async function PremiumTicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const ticket = await getTicket(resolvedParams.id);

  if (!ticket) {
    notFound();
  }

  // Check if this device matches a customer device
  let matchingCustomerDevice = null;
  
  // First check if there's a direct customer_device_id link
  if (ticket.customer_device_id && ticket.customer_device) {
    matchingCustomerDevice = ticket.customer_device;
  } 
  // Otherwise, try to find a match by serial/IMEI
  else if (ticket.customer_id) {
    const customerDeviceRepo = new CustomerDeviceRepository();
    const customerDevices = await customerDeviceRepo.findByCustomer(ticket.customer_id);
    
    // Check for matching device by IMEI or serial number
    if (ticket.imei || ticket.serial_number) {
      matchingCustomerDevice = customerDevices.find(device => 
        (ticket.imei && device.imei === ticket.imei) ||
        (ticket.serial_number && device.serial_number === ticket.serial_number)
      );
    }
  }

  // Get current user to check if they're admin
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  // Use UserRepository to get user details and technicians
  const userRepo = new UserRepository(true); // Use service role
  let isAdmin = false;
  let currentUserId = '';
  
  if (user) {
    // First try to find by auth ID
    let dbUser = await userRepo.findById(user.id);
    
    // If not found by auth ID, check mapping table using service role
    if (!dbUser) {
      const { createServiceClient } = await import('@/lib/supabase/service');
      const serviceClient = createServiceClient();
      
      const { data: mapping } = await serviceClient
        .from('user_id_mapping')
        .select('app_user_id')
        .eq('auth_user_id', user.id)
        .single();
      
      if (mapping) {
        dbUser = await userRepo.findById(mapping.app_user_id);
      }
    }
    
    currentUserId = dbUser?.id || user.id;
    isAdmin = dbUser?.role === 'admin' || dbUser?.role === 'manager';
  }
  
  // Get all technicians for assignment dropdown
  const technicians = await userRepo.findByRole(['technician', 'manager', 'admin']);
  const technicianList = technicians.map(t => ({
    id: t.id,
    name: t.full_name || t.email || 'Unknown',
    email: t.email,
    role: t.role
  }));

  const totalTimeMinutes = ticket.time_entries?.reduce(
    (acc: number, entry: any) => acc + (entry.duration_minutes || 0),
    0
  ) || 0;

  // Fetch appointment data if this ticket was created from an appointment
  let appointmentData = null;
  if (ticket.appointment_id) {
    try {
      const appointmentRepo = new AppointmentRepository(true);
      const appointment = await appointmentRepo.findById(ticket.appointment_id);
      if (appointment) {
        appointmentData = {
          appointment_number: appointment.appointment_number,
          scheduled_date: appointment.scheduled_date,
          scheduled_time: appointment.scheduled_time,
          issues: appointment.issues,
          description: appointment.description,
          notes: appointment.notes,
          urgency: appointment.urgency,
          source: appointment.source,
          created_at: appointment.created_at
        };
      }
    } catch (error) {
      console.error('Error fetching appointment:', error);
    }
  }

  return (
    <PremiumTicketDetailClient 
      ticket={ticket} 
      ticketId={resolvedParams.id} 
      totalTimeMinutes={totalTimeMinutes}
      isAdmin={isAdmin}
      currentUserId={currentUserId}
      matchingCustomerDevice={matchingCustomerDevice}
      appointmentData={appointmentData}
      technicians={technicianList}
    />
  );
}