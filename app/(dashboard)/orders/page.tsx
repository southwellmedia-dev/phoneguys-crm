import { RepairTicketRepository } from "@/lib/repositories/repair-ticket.repository";
import { OrdersClient } from "./orders-client";
import { Order } from "@/components/orders/orders-columns";
import { RepairStatus } from "@/components/orders/status-badge";

async function getOrders(): Promise<Order[]> {
  const ticketRepo = new RepairTicketRepository(true); // Use service role for full access
  
  // Get all tickets with customer data in a single query
  const tickets = await ticketRepo.findAllWithCustomers();

  // Map to the Order format expected by the UI
  const ordersWithCustomerData = tickets.map((ticket) => ({
    id: ticket.id,
    ticket_number: ticket.ticket_number,
    customer_id: ticket.customer_id,
    customer_name: ticket.customers?.name || "Unknown Customer",
    customer_phone: ticket.customers?.phone || "",
    // Use device relationship if available, fallback to text fields
    device_brand: ticket.device?.manufacturer?.name || ticket.device_brand || "",
    device_model: ticket.device?.model_name || ticket.device_model || "",
    repair_issues: ticket.repair_issues || [],
    status: ticket.status as RepairStatus,
    created_at: ticket.created_at,
    updated_at: ticket.updated_at,
    timer_total_minutes: ticket.total_time_minutes || 0,
  }));

  return ordersWithCustomerData;
}

export default async function OrdersPage() {
  const orders = await getOrders();

  return <OrdersClient orders={orders} />;
}