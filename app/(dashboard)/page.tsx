import { RepairTicketRepository } from "@/lib/repositories/repair-ticket.repository";
import { CustomerRepository } from "@/lib/repositories/customer.repository";
import { AppointmentRepository } from "@/lib/repositories/appointment.repository";
import { DashboardClient } from "./dashboard-client";
import { RepairStatus } from "@/components/orders/status-badge";

async function getDashboardMetrics() {
  const ticketRepo = new RepairTicketRepository(true); // Use service role for full access
  const customerRepo = new CustomerRepository(true);
  const appointmentRepo = new AppointmentRepository(true);

  // Fetch only what we need in parallel - use database for filtering/counting
  const [
    recentTickets,
    recentCustomers, 
    recentAppointments,
    ticketCounts,
    totalCustomers
  ] = await Promise.all([
    // Get only 10 most recent tickets with customers
    ticketRepo.findWithLimit(10, true), // Add includeCustomers flag
    // Get only 10 most recent customers
    customerRepo.findRecent(10),
    // Get only 10 most recent appointments
    appointmentRepo.findRecent(10),
    // Get ticket counts by status (single query with GROUP BY)
    ticketRepo.getCountsByStatus(),
    // Get total customer count
    customerRepo.count()
  ]);

  // Data is already sorted and limited from the database
  
  // Format appointments for display
  const formattedAppointments = recentAppointments.map(apt => ({
    ...apt,
    appointment_date: `${apt.scheduled_date} ${apt.scheduled_time}`,
    customer_name: apt.customers?.name || apt.customers?.full_name || 'Unknown',
    service_type: 'General Repair' // Appointments don't have services in this schema
  }));

  // Use the counts from database (much faster than filtering in JS)
  const totalOrders = ticketCounts.total || 0;
  const todayOrders = ticketCounts.new || 0;
  const inProgressOrders = ticketCounts.in_progress || 0;
  const completedOrders = ticketCounts.completed || 0;
  const onHoldOrders = ticketCounts.on_hold || 0;

  // These require separate optimized queries - for now use defaults
  const avgRepairTime = 120; // Default 2 hours - TODO: Add optimized query
  const todayRevenue = 0; // TODO: Add optimized revenue query

  // Format recent orders for display with all required fields
  const formattedOrders = recentTickets.map(ticket => ({
    id: ticket.id,
    ticket_number: ticket.ticket_number,
    customer_id: ticket.customer_id,
    customer_name: ticket.customers?.full_name || ticket.customers?.name || "Unknown Customer",
    customers: ticket.customers,
    devices: {
      brand: ticket.device_brand,
      model: ticket.device_model
    },
    device_model: ticket.device_model,
    customer_phone: ticket.customers?.phone || "",
    device_brand: ticket.device_brand || "",
    repair_issues: ticket.repair_issues || [],
    status: ticket.status as RepairStatus,
    created_at: ticket.created_at,
    updated_at: ticket.updated_at,
    timer_total_minutes: ticket.total_time_minutes || 0,
  }));

  return {
    totalOrders,
    todayOrders,
    inProgressOrders,
    completedToday: completedOrders,
    onHoldOrders,
    totalCustomers,
    avgRepairTimeHours: Math.round((avgRepairTime / 60) * 10) / 10,
    todayRevenue,
    recentOrders: formattedOrders,
    recentAppointments: formattedAppointments,
    recentCustomers,
  };
}

export default async function DashboardPage() {
  const metrics = await getDashboardMetrics();
  
  return <DashboardClient metrics={metrics} />;
}