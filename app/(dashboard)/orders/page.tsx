import { RepairTicketRepository } from "@/lib/repositories/repair-ticket.repository";
import { TicketsClientPremium } from "./tickets-client-premium";

interface Ticket {
  id: string;
  ticket_number: string;
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  device_brand: string;
  device_model: string;
  repair_issues: string[];
  status: 'NEW' | 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED';
  created_at: string;
  updated_at: string;
  timer_total_minutes: number;
  assigned_to: string | null;
}

async function getTickets(): Promise<Ticket[]> {
  const ticketRepo = new RepairTicketRepository(true); // Use service role for full access
  
  // Get all tickets with customer data in a single query
  const tickets = await ticketRepo.findAllWithCustomers();

  // Map to the Ticket format expected by the UI
  const ticketsWithCustomerData = tickets.map((ticket) => ({
    id: ticket.id,
    ticket_number: ticket.ticket_number,
    customer_id: ticket.customer_id,
    customer_name: ticket.customers?.name || "Unknown Customer",
    customer_phone: ticket.customers?.phone || "",
    // Use device relationship if available, fallback to text fields
    device_brand: ticket.device?.manufacturer?.name || ticket.device_brand || "",
    device_model: ticket.device?.model_name || ticket.device_model || "",
    repair_issues: ticket.repair_issues || [],
    status: ticket.status as 'NEW' | 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED',
    created_at: ticket.created_at,
    updated_at: ticket.updated_at,
    timer_total_minutes: ticket.total_time_minutes || 0,
    assigned_to: ticket.assigned_to,
  }));

  return ticketsWithCustomerData;
}

export default async function OrdersPage() {
  const tickets = await getTickets();

  return <TicketsClientPremium tickets={tickets} />;
}