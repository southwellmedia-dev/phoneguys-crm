/**
 * Ticket Data Transformer
 * 
 * Centralizes all ticket-related data transformations to ensure
 * consistency across the application.
 */

import { Order } from '@/components/orders/orders-columns';
import { RepairTicket } from '@/lib/types';

// Type for ticket with nested relationships
// Extended type with all possible fields from database
interface RepairTicketExtended extends RepairTicket {
  timer_total_minutes?: number | null; // Alias that might be used
}

export interface RepairTicketWithRelations extends RepairTicketExtended {
  customers?: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    address?: string;
  };
  device?: {
    id: string;
    model_name: string;
    model_number?: string;
    manufacturer?: {
      id: string;
      name: string;
    };
  };
  assigned_user?: {
    id: string;
    email: string;
    full_name?: string;
    role?: string;
  };
  customer_device?: {
    id: string;
    nickname?: string;
    serial_number?: string;
    imei?: string;
    notes?: string;
  };
  time_entries?: Array<{
    id: string;
    duration_minutes: number;
    start_time: string;
    end_time?: string;
    description?: string;
  }>;
  ticket_services?: Array<{
    id: string;
    service_id: string;
    quantity: number;
    price?: number;
  }>;
}

/**
 * Transformer class for ticket data
 * Provides consistent transformation methods for various ticket formats
 */
export class TicketTransformer {
  /**
   * Transform a RepairTicket (with relations) to Order format
   * This is the main transformation used throughout the app
   */
  static toOrder(ticket: RepairTicketWithRelations): Order {
    // Calculate total time from time entries if available
    // Check both field names for compatibility
    const totalMinutes = ticket.time_entries?.reduce(
      (total, entry) => total + (entry.duration_minutes || 0),
      0
    ) || ticket.timer_total_minutes || ticket.total_timer_minutes || 0;

    return {
      id: ticket.id,
      ticket_number: ticket.ticket_number,
      customer_id: ticket.customer_id,
      customer_name: ticket.customers?.name || 'Unknown Customer',
      customer_phone: ticket.customers?.phone || '',
      device_brand: ticket.device?.manufacturer?.name || ticket.device_brand || '',
      device_model: ticket.device?.model_name || ticket.device_model || '',
      repair_issues: ticket.repair_issues || [],
      status: ticket.status,
      created_at: ticket.created_at,
      updated_at: ticket.updated_at,
      timer_total_minutes: totalMinutes,
    };
  }

  /**
   * Transform multiple tickets to Order format
   */
  static toOrders(tickets: RepairTicketWithRelations[]): Order[] {
    return tickets.map(ticket => this.toOrder(ticket));
  }

  /**
   * Transform a basic ticket (without relations) to Order format
   * Used when we only have basic ticket data
   */
  static toOrderBasic(ticket: RepairTicket): Order {
    return {
      id: ticket.id,
      ticket_number: ticket.ticket_number,
      customer_id: ticket.customer_id,
      customer_name: 'Loading...', // Will be updated when relations load
      customer_phone: '',
      device_brand: ticket.device_brand || '',
      device_model: ticket.device_model || '',
      repair_issues: ticket.repair_issues || [],
      status: ticket.status,
      created_at: ticket.created_at,
      updated_at: ticket.updated_at,
      timer_total_minutes: ticket.timer_total_minutes || ticket.total_timer_minutes || 0,
    };
  }

  /**
   * Merge partial ticket update into existing Order
   * Used for real-time updates where we might only get partial data
   */
  static mergeOrderUpdate(existing: Order, update: Partial<RepairTicket>): Order {
    return {
      ...existing,
      // Update only the fields that are present in the update
      ticket_number: update.ticket_number ?? existing.ticket_number,
      customer_id: update.customer_id ?? existing.customer_id,
      device_brand: update.device_brand ?? existing.device_brand,
      device_model: update.device_model ?? existing.device_model,
      repair_issues: update.repair_issues ?? existing.repair_issues,
      status: update.status ?? existing.status,
      updated_at: update.updated_at ?? existing.updated_at,
      timer_total_minutes: (update as any).timer_total_minutes ?? (update as any).total_timer_minutes ?? existing.timer_total_minutes,
      // Preserve customer info unless we have new data
      customer_name: existing.customer_name,
      customer_phone: existing.customer_phone,
    };
  }

  /**
   * Transform Order back to ticket create/update format
   * Used when saving Order data back to the database
   */
  static fromOrder(order: Partial<Order>): Partial<RepairTicket> {
    const ticket: Partial<RepairTicket> = {};

    if (order.id) ticket.id = order.id;
    if (order.ticket_number) ticket.ticket_number = order.ticket_number;
    if (order.customer_id) ticket.customer_id = order.customer_id;
    if (order.device_brand) ticket.device_brand = order.device_brand;
    if (order.device_model) ticket.device_model = order.device_model;
    if (order.repair_issues) ticket.repair_issues = order.repair_issues as any;
    if (order.status) ticket.status = order.status;
    if (order.timer_total_minutes !== undefined) {
      (ticket as any).timer_total_minutes = order.timer_total_minutes;
    }

    return ticket;
  }

  /**
   * Extract summary information from ticket
   * Used for notifications, logs, etc.
   */
  static toSummary(ticket: RepairTicketWithRelations): {
    id: string;
    ticket_number: string;
    customer: string;
    device: string;
    status: string;
    issues: string;
  } {
    return {
      id: ticket.id,
      ticket_number: ticket.ticket_number,
      customer: ticket.customers?.name || 'Unknown',
      device: `${ticket.device?.manufacturer?.name || ticket.device_brand || ''} ${
        ticket.device?.model_name || ticket.device_model || ''
      }`.trim() || 'Unknown Device',
      status: ticket.status,
      issues: Array.isArray(ticket.repair_issues) 
        ? ticket.repair_issues.join(', ') 
        : 'No issues specified',
    };
  }

  /**
   * Format ticket for display in lists
   * Includes additional formatting for UI components
   */
  static toListItem(ticket: RepairTicketWithRelations): {
    id: string;
    title: string;
    subtitle: string;
    status: string;
    priority: string;
    timestamp: string;
  } {
    return {
      id: ticket.id,
      title: `#${ticket.ticket_number}`,
      subtitle: `${ticket.customers?.name || 'Unknown'} - ${
        ticket.device?.model_name || ticket.device_model || 'Unknown Device'
      }`,
      status: ticket.status,
      priority: ticket.priority || 'medium',
      timestamp: ticket.updated_at,
    };
  }

  /**
   * Check if a ticket has complete data (including relations)
   * Used to determine if we need to fetch additional data
   */
  static hasCompleteData(ticket: any): ticket is RepairTicketWithRelations {
    return !!(
      ticket &&
      ticket.id &&
      ticket.ticket_number &&
      (ticket.customers || ticket.customer_name) // Has customer data
    );
  }

  /**
   * Sanitize ticket data for external API responses
   * Removes sensitive or internal fields
   */
  static toPublicFormat(ticket: RepairTicketWithRelations): any {
    const { 
      customers,
      assigned_user,
      ...publicData 
    } = ticket;

    return {
      ...publicData,
      customer_name: customers?.name,
      customer_email: customers?.email,
      // Don't expose internal user data
      assigned_to_name: assigned_user?.full_name || 'Staff',
    };
  }
}