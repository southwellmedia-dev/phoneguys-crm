import { CustomerRepository } from '@/lib/repositories/customer.repository';
import { RepairTicketRepository } from '@/lib/repositories/repair-ticket.repository';
import { AppointmentRepository } from '@/lib/repositories/appointment.repository';
import { Customer, RepairTicket } from '@/lib/types';
import { Appointment } from '@/lib/repositories/appointment.repository';

export interface SearchResult {
  type: 'customer' | 'ticket' | 'appointment';
  id: string;
  title: string;
  subtitle: string;
  meta?: string;
  status?: string;
  priority?: string;
  url: string;
  data: Customer | RepairTicket | Appointment;
}

export interface SearchResponse {
  results: SearchResult[];
  totalCount: number;
  searchTime: number;
}

export interface SearchFilters {
  types?: ('customer' | 'ticket' | 'appointment')[];
  limit?: number;
}

export type { SearchResponse as GlobalSearchResponse };

export class GlobalSearchService {
  private customerRepo: CustomerRepository;
  private ticketRepo: RepairTicketRepository;
  private appointmentRepo: AppointmentRepository;

  constructor() {
    this.customerRepo = new CustomerRepository();
    this.ticketRepo = new RepairTicketRepository();
    this.appointmentRepo = new AppointmentRepository();
  }

  async search(query: string, filters: SearchFilters = {}): Promise<SearchResponse> {
    const startTime = Date.now();
    const limit = filters.limit || 10;
    const types = filters.types || ['customer', 'ticket', 'appointment'];
    
    // If no query, return recent/popular items
    if (!query || query.trim().length === 0) {
      return this.getRecentItems(types, limit);
    }

    // Perform parallel searches across all enabled entity types
    const searchPromises: Promise<SearchResult[]>[] = [];

    if (types.includes('customer')) {
      searchPromises.push(this.searchCustomers(query, limit));
    }

    if (types.includes('ticket')) {
      searchPromises.push(this.searchTickets(query, limit));
    }

    if (types.includes('appointment')) {
      searchPromises.push(this.searchAppointments(query, limit));
    }

    // Execute all searches in parallel
    const searchResults = await Promise.all(searchPromises);
    const allResults = searchResults.flat();

    // Sort results by relevance (can be enhanced with scoring)
    const sortedResults = this.rankResults(allResults, query);

    return {
      results: sortedResults.slice(0, limit * 3), // Return up to 3x limit total
      totalCount: sortedResults.length,
      searchTime: Date.now() - startTime
    };
  }

  private async searchCustomers(query: string, limit: number): Promise<SearchResult[]> {
    try {
      const customers = await this.customerRepo.searchCustomers({ 
        search: query 
      });

      return customers.slice(0, limit).map(customer => ({
        type: 'customer' as const,
        id: customer.id,
        title: customer.name,
        subtitle: customer.email,
        meta: customer.phone || undefined,
        url: `/customers/${customer.id}`,
        data: customer
      }));
    } catch (error) {
      console.error('Error searching customers:', error);
      return [];
    }
  }

  private async searchTickets(query: string, limit: number): Promise<SearchResult[]> {
    try {
      // First search tickets directly
      const directTickets = await this.ticketRepo.searchTickets({ 
        search: query 
      });

      // Also search for customers and get their tickets
      const customers = await this.customerRepo.searchCustomers({ 
        search: query 
      });
      
      // Get tickets for matching customers
      const customerTicketPromises = customers.map(customer => 
        this.ticketRepo.findByCustomer(customer.id)
      );
      const customerTicketArrays = await Promise.all(customerTicketPromises);
      const customerTickets = customerTicketArrays.flat();

      // Combine and deduplicate tickets
      const allTickets = [...directTickets];
      const ticketIds = new Set(directTickets.map(t => t.id));
      
      for (const ticket of customerTickets) {
        if (!ticketIds.has(ticket.id)) {
          allTickets.push(ticket);
          ticketIds.add(ticket.id);
        }
      }

      // Fetch tickets with customer data
      const ticketsWithCustomers = await Promise.all(
        allTickets.slice(0, limit).map(async (ticket) => {
          let customerName = 'Unknown Customer';
          if (ticket.customer_id) {
            try {
              const customer = await this.customerRepo.findById(ticket.customer_id);
              if (customer) {
                customerName = customer.name;
              }
            } catch (error) {
              console.error('Error fetching customer for ticket:', error);
            }
          }

          return {
            type: 'ticket' as const,
            id: ticket.id,
            title: `#${ticket.ticket_number}`,
            subtitle: `${customerName} - ${ticket.device_brand} ${ticket.device_model}`,
            meta: ticket.description || undefined,
            status: ticket.status,
            priority: ticket.priority,
            url: `/orders/${ticket.id}`,
            data: ticket
          };
        })
      );

      return ticketsWithCustomers;
    } catch (error) {
      console.error('Error searching tickets:', error);
      return [];
    }
  }

  private async searchAppointments(query: string, limit: number): Promise<SearchResult[]> {
    try {
      // First search appointments directly
      const directAppointments = await this.appointmentRepo.searchAppointments({ 
        search: query 
      });

      // Also search for customers and get their appointments
      const customers = await this.customerRepo.searchCustomers({ 
        search: query 
      });
      
      // Get appointments for matching customers
      const customerAppointmentPromises = customers.map(customer => 
        this.appointmentRepo.findByCustomerId(customer.id)
      );
      const customerAppointmentArrays = await Promise.all(customerAppointmentPromises);
      const customerAppointments = customerAppointmentArrays.flat();

      // Combine and deduplicate appointments
      const allAppointments = [...directAppointments];
      const appointmentIds = new Set(directAppointments.map(a => a.id));
      
      for (const appointment of customerAppointments) {
        if (!appointmentIds.has(appointment.id)) {
          allAppointments.push(appointment);
          appointmentIds.add(appointment.id);
        }
      }

      // Sort by scheduled date (most recent first)
      allAppointments.sort((a, b) => {
        const dateA = new Date(`${a.scheduled_date}T${a.scheduled_time}`);
        const dateB = new Date(`${b.scheduled_date}T${b.scheduled_time}`);
        return dateB.getTime() - dateA.getTime();
      });

      return allAppointments.slice(0, limit).map(appointment => {
        const customerName = appointment.customers?.name || 'Walk-in Customer';
        const deviceName = appointment.devices ? 
          `${appointment.devices.manufacturer?.name || ''} ${appointment.devices.model_name}`.trim() : 
          'No device specified';
        
        const dateTime = new Date(`${appointment.scheduled_date}T${appointment.scheduled_time}`);
        const formattedDateTime = dateTime.toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        });

        return {
          type: 'appointment' as const,
          id: appointment.id,
          title: `${customerName}`,
          subtitle: `${formattedDateTime} - ${deviceName}`,
          meta: appointment.description || undefined,
          status: appointment.status,
          url: `/appointments/${appointment.id}`,
          data: appointment
        };
      });
    } catch (error) {
      console.error('Error searching appointments:', error);
      return [];
    }
  }

  private async getRecentItems(types: string[], limit: number): Promise<SearchResponse> {
    const startTime = Date.now();
    const recentPromises: Promise<SearchResult[]>[] = [];

    // Get recent items for each type
    if (types.includes('customer')) {
      recentPromises.push(this.getRecentCustomers(Math.ceil(limit / 3)));
    }

    if (types.includes('ticket')) {
      recentPromises.push(this.getRecentTickets(Math.ceil(limit / 3)));
    }

    if (types.includes('appointment')) {
      recentPromises.push(this.getRecentAppointments(Math.ceil(limit / 3)));
    }

    const recentResults = await Promise.all(recentPromises);
    const allResults = recentResults.flat();

    return {
      results: allResults.slice(0, limit),
      totalCount: allResults.length,
      searchTime: Date.now() - startTime
    };
  }

  private async getRecentCustomers(limit: number): Promise<SearchResult[]> {
    try {
      const customers = await this.customerRepo.findAll({ 
        limit,
        orderBy: { created_at: 'desc' }
      });

      return customers.map(customer => ({
        type: 'customer' as const,
        id: customer.id,
        title: customer.name,
        subtitle: customer.email,
        meta: customer.phone || undefined,
        url: `/customers/${customer.id}`,
        data: customer
      }));
    } catch (error) {
      console.error('Error getting recent customers:', error);
      return [];
    }
  }

  private async getRecentTickets(limit: number): Promise<SearchResult[]> {
    try {
      const tickets = await this.ticketRepo.findAll({ 
        limit,
        orderBy: { created_at: 'desc' }
      });

      const ticketsWithCustomers = await Promise.all(
        tickets.map(async (ticket) => {
          let customerName = 'Unknown Customer';
          if (ticket.customer_id) {
            try {
              const customer = await this.customerRepo.findById(ticket.customer_id);
              if (customer) {
                customerName = customer.name;
              }
            } catch (error) {
              console.error('Error fetching customer for ticket:', error);
            }
          }

          return {
            type: 'ticket' as const,
            id: ticket.id,
            title: `#${ticket.ticket_number}`,
            subtitle: `${customerName} - ${ticket.device_brand} ${ticket.device_model}`,
            meta: ticket.description || undefined,
            status: ticket.status,
            priority: ticket.priority,
            url: `/orders/${ticket.id}`,
            data: ticket
          };
        })
      );

      return ticketsWithCustomers;
    } catch (error) {
      console.error('Error getting recent tickets:', error);
      return [];
    }
  }

  private async getRecentAppointments(limit: number): Promise<SearchResult[]> {
    try {
      const appointments = await this.appointmentRepo.findUpcoming(limit);

      return appointments.map(appointment => {
        const customerName = appointment.customers?.name || 'Walk-in Customer';
        const deviceName = appointment.devices ? 
          `${appointment.devices.manufacturer?.name || ''} ${appointment.devices.model_name}`.trim() : 
          'No device specified';
        
        const dateTime = new Date(`${appointment.scheduled_date}T${appointment.scheduled_time}`);
        const formattedDateTime = dateTime.toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        });

        return {
          type: 'appointment' as const,
          id: appointment.id,
          title: `${customerName}`,
          subtitle: `${formattedDateTime} - ${deviceName}`,
          meta: appointment.description || undefined,
          status: appointment.status,
          url: `/appointments/${appointment.id}`,
          data: appointment
        };
      });
    } catch (error) {
      console.error('Error getting recent appointments:', error);
      return [];
    }
  }

  private rankResults(results: SearchResult[], query: string): SearchResult[] {
    // Simple ranking based on where the query appears
    const queryLower = query.toLowerCase();
    
    return results.sort((a, b) => {
      // Calculate scores for each result
      const scoreA = this.calculateRelevanceScore(a, queryLower);
      const scoreB = this.calculateRelevanceScore(b, queryLower);
      
      return scoreB - scoreA; // Higher scores first
    });
  }

  private calculateRelevanceScore(result: SearchResult, query: string): number {
    let score = 0;
    
    // Title match (highest priority)
    if (result.title.toLowerCase().includes(query)) {
      score += 100;
      // Exact match bonus
      if (result.title.toLowerCase() === query) {
        score += 50;
      }
      // Starts with query bonus
      if (result.title.toLowerCase().startsWith(query)) {
        score += 25;
      }
    }
    
    // Subtitle match
    if (result.subtitle.toLowerCase().includes(query)) {
      score += 50;
    }
    
    // Meta match
    if (result.meta && result.meta.toLowerCase().includes(query)) {
      score += 25;
    }
    
    // Type preferences (tickets often more important)
    if (result.type === 'ticket') {
      score += 10;
    } else if (result.type === 'appointment') {
      score += 5;
    }
    
    // Status bonuses
    if (result.status === 'new' || result.status === 'scheduled') {
      score += 5;
    }
    
    return score;
  }
}