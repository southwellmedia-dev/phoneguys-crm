import { BaseRepository } from './base.repository';
import { 
  RepairTicket, 
  RepairTicketFilters, 
  CreateRepairTicketDto, 
  UpdateRepairTicketDto,
  TicketStatus,
  Priority 
} from '@/lib/types';
import { 
  RepairTicketWithCustomer,
  RepairTicketWithDetails,
  TicketStatistics,
  StatusCounts,
  UpdateWithDeviceAndServicesData
} from '@/lib/types/repair-ticket.types';
import { CustomerDeviceRepository } from './customer-device.repository';

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

  async findByIdWithRelations(id: string): Promise<RepairTicket | null> {
    const client = await this.getClient();
    const { data, error } = await client
      .from(this.tableName)
      .select(`
        *,
        customers:customer_id (*),
        devices:device_id (*),
        assigned_user:assigned_to (id, email, full_name, username)
      `)
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to fetch repair ticket with relations: ${error.message}`);
    }

    return data as RepairTicket | null;
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

  async findAllWithCustomers(): Promise<RepairTicketWithCustomer[]> {
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
        ),
        device:devices (
          id,
          model_name,
          manufacturer:manufacturers (
            name
          )
        )
      `)
      .order('updated_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch tickets with customers: ${error.message}`);
    }

    return data as RepairTicketWithCustomer[];
  }

  async getTicketWithDetails(ticketId: string): Promise<RepairTicketWithDetails | null> {
    const client = await this.getClient();
    const { data, error } = await client
      .from(this.tableName)
      .select(`
        *,
        customers:customers!customer_id (*),
        assigned_user:users!assigned_to (*),
        device:devices (
          id,
          model_name,
          model_number,
          device_type,
          release_year,
          specifications,
          image_url,
          parts_availability,
          manufacturer:manufacturers (
            id,
            name
          )
        ),
        customer_device:customer_devices (
          id,
          serial_number,
          imei,
          color,
          storage_size,
          condition,
          nickname
        ),
        ticket_services (
          id,
          service:services (
            id,
            name,
            category,
            base_price,
            estimated_duration_minutes
          ),
          unit_price,
          quantity,
          technician_notes,
          performed_at,
          performed_by
        ),
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

    return data as RepairTicketWithDetails;
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

  /**
   * Update ticket with device and service management
   */
  async updateWithDeviceAndServices(
    ticketId: string, 
    updateData: UpdateWithDeviceAndServicesData,
    userId: string
  ): Promise<RepairTicket> {
    const client = await this.getClient();
    
    // Get existing ticket to check customer_id
    const existingTicket = await this.findById(ticketId);
    if (!existingTicket) {
      throw new Error('Ticket not found');
    }

    // Separate device fields from ticket fields
    const {
      color,
      storage_size,
      condition,
      customer_device_id,
      selected_services,
      ...ticketFields
    } = updateData;

    // Handle customer device creation/update if needed
    let finalCustomerDeviceId = customer_device_id;

    if (existingTicket.customer_id && updateData.device_id && (color || storage_size || condition || updateData.serial_number || updateData.imei)) {
      const customerDeviceRepo = new CustomerDeviceRepository(this.useServiceRole);
      
      if (customer_device_id) {
        // Update existing customer device
        try {
          await customerDeviceRepo.update(customer_device_id, {
            device_id: updateData.device_id,
            serial_number: updateData.serial_number || null,
            imei: updateData.imei || null,
            color: color || null,
            storage_size: storage_size || null,
            condition: condition || 'good'
          });
        } catch (error) {
          console.error('Failed to update customer device:', error);
        }
      } else {
        // Check if a customer device already exists with this serial/IMEI
        let existingDevice = null;
        if (updateData.serial_number) {
          existingDevice = await customerDeviceRepo.findBySerialNumber(updateData.serial_number);
        } else if (updateData.imei) {
          existingDevice = await customerDeviceRepo.findByIMEI(updateData.imei);
        }

        if (!existingDevice || existingDevice.customer_id !== existingTicket.customer_id) {
          // Create new customer device
          try {
            const newCustomerDevice = await customerDeviceRepo.create({
              customer_id: existingTicket.customer_id,
              device_id: updateData.device_id,
              serial_number: updateData.serial_number || null,
              imei: updateData.imei || null,
              color: color || null,
              storage_size: storage_size || null,
              condition: condition || 'good',
              is_active: true
            });
            finalCustomerDeviceId = newCustomerDevice.id;
          } catch (error) {
            console.error('Failed to create customer device:', error);
            // Continue without customer device if creation fails
          }
        } else {
          finalCustomerDeviceId = existingDevice.id;
        }
      }
    }

    // Update the ticket with customer_device_id if we have one
    if (finalCustomerDeviceId) {
      ticketFields.customer_device_id = finalCustomerDeviceId;
    }

    // Update the ticket
    const updatedTicket = await this.update(ticketId, ticketFields);

    // Handle services if provided
    if (selected_services !== undefined) {
      // Delete existing ticket services
      await client
        .from('ticket_services')
        .delete()
        .eq('ticket_id', ticketId);
      
      // Insert new services if any
      if (selected_services && selected_services.length > 0) {
        const ticketServices = selected_services.map((serviceId: string) => ({
          ticket_id: ticketId,
          service_id: serviceId,
          quantity: 1,
          performed_by: userId
        }));
        
        const { error: serviceError } = await client
          .from('ticket_services')
          .insert(ticketServices);
          
        if (serviceError) {
          console.error('Failed to update ticket services:', serviceError);
          // Don't throw here, ticket update was successful
        }
      }
    }

    return updatedTicket;
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

  async getTicketStatistics(): Promise<TicketStatistics> {
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

    (statusCounts as Array<{ status: string; count?: number }>)?.forEach(item => {
      byStatus[item.status] = item.count || 0;
    });

    (priorityCounts as Array<{ priority: string; count?: number }>)?.forEach(item => {
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

  async findWithLimit(limit: number = 10, includeCustomers: boolean = false): Promise<RepairTicket[]> {
    const client = await this.getClient();
    
    let query = client
      .from(this.tableName)
      .select(includeCustomers ? '*, customers(*)' : '*')
      .order('created_at', { ascending: false })
      .limit(limit);

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch recent tickets: ${error.message}`);
    }

    return data as RepairTicket[];
  }

  async getCountsByStatus(): Promise<StatusCounts> {
    const client = await this.getClient();
    
    const { data, error } = await client
      .from(this.tableName)
      .select('status')
      .order('status');

    if (error) {
      throw new Error(`Failed to get status counts: ${error.message}`);
    }

    const counts: Record<string, number> = {
      new: 0,
      in_progress: 0,
      on_hold: 0,
      completed: 0,
      cancelled: 0
    };

    (data || []).forEach(item => {
      if (counts[item.status] !== undefined) {
        counts[item.status]++;
      }
    });

    const total = Object.values(counts).reduce((sum, count) => sum + count, 0);

    return { ...counts, total };
  }

  async getWeeklyTrend(): Promise<{ day: string; date: string; tickets: number }[]> {
    const client = await this.getClient();
    
    // Get tickets created in the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6); // 6 days ago + today = 7 days
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const { data: tickets, error } = await client
      .from(this.tableName)
      .select('created_at')
      .gte('created_at', sevenDaysAgo.toISOString())
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch weekly trend: ${error.message}`);
    }

    // Group by day
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const trendData = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      nextDate.setHours(0, 0, 0, 0);
      
      // Count tickets for this day
      const dayTickets = (tickets || []).filter(ticket => {
        const ticketDate = new Date(ticket.created_at);
        return ticketDate >= date && ticketDate < nextDate;
      }).length;
      
      trendData.push({
        day: i === 0 ? 'Today' : dayNames[date.getDay()],
        date: date.toISOString().split('T')[0],
        tickets: dayTickets
      });
    }

    return trendData;
  }

  async getWeeklyComparison(): Promise<{ day: string; date: string; created: number; completed: number }[]> {
    const client = await this.getClient();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    // Fetch tickets created in last 7 days
    const { data: createdTickets, error: createdError } = await client
      .from(this.tableName)
      .select('created_at')
      .gte('created_at', sevenDaysAgo.toISOString())
      .order('created_at', { ascending: true });

    if (createdError) {
      throw new Error(`Failed to fetch created tickets: ${createdError.message}`);
    }

    // Fetch tickets completed in last 7 days
    // Note: Using updated_at since completed_at is not being populated
    const { data: completedTickets, error: completedError } = await client
      .from(this.tableName)
      .select('updated_at, status')
      .eq('status', 'completed')
      .gte('updated_at', sevenDaysAgo.toISOString())
      .order('updated_at', { ascending: true });

    if (completedError) {
      throw new Error(`Failed to fetch completed tickets: ${completedError.message}`);
    }

    // Group by day
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const comparisonData = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      nextDate.setHours(0, 0, 0, 0);
      
      // Count created tickets for this day
      const dayCreated = (createdTickets || []).filter(ticket => {
        const ticketDate = new Date(ticket.created_at);
        return ticketDate >= date && ticketDate < nextDate;
      }).length;

      // Count completed tickets for this day (using updated_at)
      const dayCompleted = (completedTickets || []).filter(ticket => {
        const ticketDate = new Date(ticket.updated_at);
        return ticketDate >= date && ticketDate < nextDate;
      }).length;
      
      comparisonData.push({
        day: i === 0 ? 'Today' : dayNames[date.getDay()],
        date: date.toISOString().split('T')[0],
        created: dayCreated,
        completed: dayCompleted
      });
    }

    return comparisonData;
  }
}