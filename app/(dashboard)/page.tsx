import { RepairTicketRepository } from "@/lib/repositories/repair-ticket.repository";
import { CustomerRepository } from "@/lib/repositories/customer.repository";
import { AppointmentRepository } from "@/lib/repositories/appointment.repository";
import { DashboardClient } from "./dashboard-client";
import { RepairStatus } from "@/components/orders/status-badge";

async function getDashboardMetrics() {
  const ticketRepo = new RepairTicketRepository(true); // Use service role for full access
  const customerRepo = new CustomerRepository(true);
  const appointmentRepo = new AppointmentRepository(true);

  // Get all tickets with customer data, all customers, and all appointments with details
  const [allTickets, allCustomers, allAppointments] = await Promise.all([
    ticketRepo.findAllWithCustomers(),
    customerRepo.findAll(),
    appointmentRepo.findAllWithDetails()
  ]);

  // Get recent tickets (already sorted by created_at from the query)
  const recentTickets = allTickets.slice(0, 10);
  
  // Get recent customers with repair count
  const recentCustomers = allCustomers
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 10)
    .map(customer => ({
      ...customer,
      repair_tickets: allTickets.filter(t => t.customer_id === customer.id)
    }));
  
  // Get recent appointments sorted by date/time
  const recentAppointments = allAppointments
    .sort((a, b) => {
      const dateA = new Date(`${a.scheduled_date} ${a.scheduled_time}`);
      const dateB = new Date(`${b.scheduled_date} ${b.scheduled_time}`);
      return dateB.getTime() - dateA.getTime();
    })
    .slice(0, 10)
    .map(apt => ({
      ...apt,
      appointment_date: `${apt.scheduled_date} ${apt.scheduled_time}`,
      customer_name: apt.customers?.name || apt.customers?.full_name || 'Unknown',
      service_type: apt.services?.length > 0 ? apt.services[0].name : 'General Repair'
    }));

  // Calculate metrics from the data
  const totalOrders = allTickets.length;
  const todayOrders = allTickets.filter(t => t.status === 'new').length;
  const inProgressOrders = allTickets.filter(t => t.status === 'in_progress').length;
  const completedOrders = allTickets.filter(t => t.status === 'completed').length;
  const onHoldOrders = allTickets.filter(t => t.status === 'on_hold').length;
  const totalCustomers = allCustomers.length;

  // Calculate average repair time from completed tickets
  const completedTicketsWithTime = allTickets.filter(t => 
    t.status === 'completed' && t.total_time_minutes && t.total_time_minutes > 0
  );
  const avgRepairTime = completedTicketsWithTime.length > 0
    ? completedTicketsWithTime.reduce((acc, ticket) => acc + (ticket.total_time_minutes || 0), 0) / completedTicketsWithTime.length
    : 0;

  // Calculate today's revenue from completed tickets with actual cost
  const todayRevenue = allTickets
    .filter(t => t.status === 'completed' && t.actual_cost)
    .reduce((acc, ticket) => acc + (ticket.actual_cost || 0), 0);

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
    recentAppointments,
    recentCustomers,
  };
}

export default async function DashboardPage() {
  const metrics = await getDashboardMetrics();
  
  return <DashboardClient metrics={metrics} />;
}