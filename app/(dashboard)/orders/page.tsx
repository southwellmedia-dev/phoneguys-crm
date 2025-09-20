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
  status: 'new' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled';
  priority?: string;
  created_at: string;
  updated_at: string;
  timer_total_minutes: number;
  estimated_minutes: number;
  assigned_to: string | null;
  assigned_user?: {
    id: string;
    full_name: string | null;
    email: string;
  };
  comment_count?: number;
}

async function getTickets(): Promise<Ticket[]> {
  const ticketRepo = new RepairTicketRepository(true); // Use service role for full access
  
  // Get all tickets with customer data in a single query
  const tickets = await ticketRepo.findAllWithCustomers();

  // Map to the Ticket format expected by the UI
  const ticketsWithCustomerData = tickets.map((ticket) => {
    // Calculate total tracked time from time_entries
    const totalMinutes = (ticket as any).time_entries?.reduce((sum: number, entry: any) => 
      sum + (entry.duration_minutes || 0), 0) || ticket.total_time_minutes || 0;
    
    // Calculate estimated time from ticket_services
    const estimatedMinutes = (ticket as any).ticket_services?.reduce((sum: number, ts: any) => {
      return sum + (ts.services?.estimated_duration_minutes || 0);
    }, 0) || 0;

    return {
      id: ticket.id,
      ticket_number: ticket.ticket_number,
      customer_id: ticket.customer_id,
      customer_name: ticket.customers?.name || "Unknown Customer",
      customer_phone: ticket.customers?.phone || "",
      // Use device relationship if available, fallback to text fields
      device_brand: ticket.device?.manufacturer?.name || ticket.device_brand || "",
      device_model: ticket.device?.model_name || ticket.device_model || "",
      repair_issues: ticket.repair_issues || [],
      status: ticket.status.toLowerCase() as 'new' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled',
      priority: ticket.priority?.toLowerCase(),
      created_at: ticket.created_at,
      updated_at: ticket.updated_at,
      timer_total_minutes: totalMinutes,
      estimated_minutes: estimatedMinutes,
      assigned_to: ticket.assigned_to,
      assigned_user: (ticket as any).assigned_user ? {
        id: (ticket as any).assigned_user.id,
        full_name: (ticket as any).assigned_user.full_name,
        email: (ticket as any).assigned_user.email
      } : undefined,
      comment_count: 0, // Will be fetched client-side for real-time updates
    };
  });

  return ticketsWithCustomerData;
}

export default async function OrdersPage() {
  const tickets = await getTickets();

  return <TicketsClientPremium tickets={tickets} />;
}