import { AppointmentRepository } from "@/lib/repositories/appointment.repository";
import { AppointmentsClientPremium } from "./appointments-client-premium";

async function getAppointments() {
  try {
    const appointmentRepo = new AppointmentRepository(true); // Use service role
    const appointments = await appointmentRepo.findAllWithDetails();
    
    console.log(`Found ${appointments.length} appointments in repository`);
    
    return appointments.map(apt => ({
      id: apt.id,
      appointment_number: apt.appointment_number,
      customer_name: apt.customers?.name || "Walk-in",
      customer_email: apt.customers?.email || "",
      customer_phone: apt.customers?.phone || "",
      device: apt.devices ? `${apt.devices.manufacturer?.name || ''} ${apt.devices.model_name}` : "Not specified",
      scheduled_date: apt.scheduled_date,
      scheduled_time: apt.scheduled_time,
      duration_minutes: apt.duration_minutes,
      status: apt.status,
      issues: apt.issues || [],
      urgency: apt.urgency,
      source: apt.source,
      created_at: apt.created_at,
      converted_to_ticket_id: apt.converted_to_ticket_id,
      assigned_to: apt.assigned_to,
    }));
  } catch (error) {
    console.error('Error fetching appointments:', error);
    return [];
  }
}

export default async function AppointmentsPage() {
  const appointments = await getAppointments();
  
  return <AppointmentsClientPremium appointments={appointments} />;
}