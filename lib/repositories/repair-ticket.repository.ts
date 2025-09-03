import { BaseRepository } from './base.repository';
import { 
  RepairTicket, 
  RepairTicketFilters, 
  CreateRepairTicketDto, 
  UpdateRepairTicketDto,
  TicketStatus,
  Priority 
} from '@/lib/types';

export class RepairTicketRepository extends BaseRepository<RepairTicket> {
  constructor(useServiceRole = false) {
    super('repair_tickets', useServiceRole);
  }

  async findByTicketNumber(ticketNumber: string): Promise<RepairTicket | null> {
    return this.findOne({ ticket_number: ticketNumber });
  }

  async findByStatus(status: TicketStatus | TicketStatus[]): Promise<RepairTicket[]> {
    const statuses = Array.isArray(status) ? status : [status];
    return this.findAll({ status: statuses });
  }

  async findByCustomer(customerId: string): Promise<RepairTicket[]> {
    return this.findAll({ customer_id: customerId });
  }

  async findByAssignee(userId: string): Promise<RepairTicket[]> {
    return this.findAll({ assigned_to: userId });
  }

  async searchTickets(filters: RepairTicketFilters): Promise<RepairTicket[]> {
    const client = await this.getClient();
    let query = client.from(this.tableName).select('*');

    if (filters.status) {
      const statuses = Array.isArray(filters.status) ? filters.status : [filters.status];
      query = query.in('status', statuses);
    }

    if (filters.priority) {
      const priorities = Array.isArray(filters.priority) ? filters.priority : [filters.priority];
      query = query.in('priority', priorities);
    }

    if (filters.assigned_to) {
      query = query.eq('assigned_to', filters.assigned_to);
    }

    if (filters.customer_id) {
      query = query.eq('customer_id', filters.customer_id);
    }

    if (filters.date_from) {
      query = query.gte('date_received', filters.date_from);
    }

    if (filters.date_to) {
      query = query.lte('date_received', filters.date_to);
    }

    if (filters.search) {
      query = query.or(
        `ticket_number.ilike.%${filters.search}%,` +
        `device_brand.ilike.%${filters.search}%,` +
        `device_model.ilike.%${filters.search}%,` +
        `serial_number.ilike.%${filters.search}%,` +
        `imei.ilike.%${filters.search}%,` +
        `description.ilike.%${filters.search}%`
      );
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to search repair tickets: ${error.message}`);
    }

    return data as RepairTicket[];
  }

  async findAllWithCustomers(): Promise<(RepairTicket & { customers?: any })[]> {
    const client = await this.getClient();
    const { data, error } = await client
      .from(this.tableName)
      .select(`
        *,
        customers:customers!customer_id (
          id,
          name,
          email,
          phone
        )
      `)
      .order('updated_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch tickets with customers: ${error.message}`);
    }

    return data as any[];
  }

  async getTicketWithDetails(ticketId: string): Promise<RepairTicket & { 
    customers?: any; 
    assigned_user?: any; 
    notes?: any[];
    time_entries?: any[];
  } | null> {
    const client = await this.getClient();
    const { data, error } = await client
      .from(this.tableName)
      .select(`
        *,
        customers:customers!customer_id (*),
        assigned_user:users!assigned_to (*),
        notes:ticket_notes (
          id,
          note_type,
          content,
          is_important,
          created_at,
          user:users!user_id (
            full_name
          )
        ),
        time_entries (
          id,
          start_time,
          end_time,
          duration_minutes,
          description,
          user_id,
          user:users!user_id (
            id,
            full_name,
            email,
            role
          )
        )
      `)
      .eq('id', ticketId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to fetch ticket with details: ${error.message}`);
    }

    return data as any;
  }

  async updateStatus(ticketId: string, status: TicketStatus): Promise<RepairTicket> {
    const updateData: Partial<RepairTicket> = { status };

    // If completing the ticket, set the completion date
    if (status === 'completed') {
      updateData.date_completed = new Date().toISOString();
    }

    return this.update(ticketId, updateData);
  }

  async assignToUser(ticketId: string, userId: string | null): Promise<RepairTicket> {
    return this.update(ticketId, { assigned_to: userId });
  }

  async startTimer(ticketId: string): Promise<RepairTicket> {
    return this.update(ticketId, { 
      timer_started_at: new Date().toISOString() 
    });
  }

  async stopTimer(ticketId: string): Promise<RepairTicket> {
    const ticket = await this.findById(ticketId);
    if (!ticket) {
      throw new Error('Ticket not found');
    }

    if (!ticket.timer_started_at) {
      throw new Error('Timer is not running');
    }

    const startTime = new Date(ticket.timer_started_at);
    const endTime = new Date();
    const durationMinutes = Math.floor((endTime.getTime() - startTime.getTime()) / 1000 / 60);

    return this.update(ticketId, {
      timer_started_at: null,
      total_timer_minutes: (ticket.total_timer_minutes || 0) + durationMinutes
    });
  }

  async getActiveTicketsCount(): Promise<number> {
    return this.count({ 
      status: { operator: 'in', value: ['new', 'in_progress', 'on_hold'] }
    });
  }

  async getTicketsByDateRange(startDate: string, endDate: string): Promise<RepairTicket[]> {
    const client = await this.getClient();
    const { data, error } = await client
      .from(this.tableName)
      .select('*')
      .gte('date_received', startDate)
      .lte('date_received', endDate)
      .order('date_received', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch tickets by date range: ${error.message}`);
    }

    return data as RepairTicket[];
  }

  async getOverdueTickets(daysSinceReceived: number = 7): Promise<RepairTicket[]> {
    const client = await this.getClient();
    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - daysSinceReceived);

    const { data, error } = await client
      .from(this.tableName)
      .select('*')
      .in('status', ['new', 'in_progress', 'on_hold'])
      .lte('date_received', dateThreshold.toISOString())
      .order('date_received', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch overdue tickets: ${error.message}`);
    }

    return data as RepairTicket[];
  }

  async getTicketStatistics(): Promise<{
    total: number;
    by_status: Record<TicketStatus, number>;
    by_priority: Record<Priority, number>;
    avg_completion_time_days: number;
  }> {
    const client = await this.getClient();
    
    // Get counts by status
    const { data: statusCounts, error: statusError } = await client
      .from(this.tableName)
      .select('status', { count: 'exact' })
      .order('status');

    if (statusError) {
      throw new Error(`Failed to get status statistics: ${statusError.message}`);
    }

    // Get counts by priority
    const { data: priorityCounts, error: priorityError } = await client
      .from(this.tableName)
      .select('priority', { count: 'exact' })
      .order('priority');

    if (priorityError) {
      throw new Error(`Failed to get priority statistics: ${priorityError.message}`);
    }

    // Get average completion time
    const { data: completedTickets, error: completionError } = await client
      .from(this.tableName)
      .select('date_received, date_completed')
      .eq('status', 'completed')
      .not('date_completed', 'is', null);

    if (completionError) {
      throw new Error(`Failed to get completion statistics: ${completionError.message}`);
    }

    // Calculate average completion time
    let avgCompletionTime = 0;
    if (completedTickets && completedTickets.length > 0) {
      const totalDays = completedTickets.reduce((sum, ticket) => {
        const received = new Date(ticket.date_received);
        const completed = new Date(ticket.date_completed);
        const days = (completed.getTime() - received.getTime()) / (1000 * 60 * 60 * 24);
        return sum + days;
      }, 0);
      avgCompletionTime = totalDays / completedTickets.length;
    }

    // Process counts
    const byStatus: Record<string, number> = {};
    const byPriority: Record<string, number> = {};
    
    const statuses: TicketStatus[] = ['new', 'in_progress', 'on_hold', 'completed', 'cancelled'];
    const priorities: Priority[] = ['low', 'medium', 'high', 'urgent'];
    
    statuses.forEach(s => byStatus[s] = 0);
    priorities.forEach(p => byPriority[p] = 0);

    (statusCounts as any[])?.forEach(item => {
      byStatus[item.status] = item.count || 0;
    });

    (priorityCounts as any[])?.forEach(item => {
      byPriority[item.priority] = item.count || 0;
    });

    const total = Object.values(byStatus).reduce((sum, count) => sum + count, 0);

    return {
      total,
      by_status: byStatus as Record<TicketStatus, number>,
      by_priority: byPriority as Record<Priority, number>,
      avg_completion_time_days: avgCompletionTime
    };
  }
}