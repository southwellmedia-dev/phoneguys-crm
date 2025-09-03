import { BaseRepository } from './base.repository';
import { TimeEntry, CreateTimeEntryDto, UpdateTimeEntryDto } from '@/lib/types';

export class TimeEntryRepository extends BaseRepository<TimeEntry> {
  constructor(useServiceRole = false) {
    super('time_entries', useServiceRole);
  }

  async findByTicket(ticketId: string): Promise<TimeEntry[]> {
    const client = await this.getClient();
    const { data, error } = await client
      .from(this.tableName)
      .select(`
        *,
        user:users!user_id (
          full_name,
          role
        )
      `)
      .eq('ticket_id', ticketId)
      .order('start_time', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch time entries for ticket: ${error.message}`);
    }

    return data as any[];
  }

  async findByUser(userId: string): Promise<TimeEntry[]> {
    return this.findAll({ user_id: userId });
  }

  async findActiveEntry(ticketId: string, userId?: string): Promise<TimeEntry | null> {
    const filters: any = {
      ticket_id: ticketId,
      end_time: null
    };

    if (userId) {
      filters.user_id = userId;
    }

    return this.findOne(filters);
  }

  async startTimer(data: CreateTimeEntryDto): Promise<TimeEntry> {
    // Check if there's already an active timer for this ticket/user
    const activeEntry = await this.findActiveEntry(data.ticket_id, data.user_id);
    if (activeEntry) {
      throw new Error('Timer is already running for this ticket');
    }

    return this.create({
      ...data,
      start_time: data.start_time || new Date().toISOString()
    });
  }

  async stopTimer(entryId: string): Promise<TimeEntry> {
    const entry = await this.findById(entryId);
    if (!entry) {
      throw new Error('Time entry not found');
    }

    if (entry.end_time) {
      throw new Error('Timer has already been stopped');
    }

    const endTime = new Date();
    const startTime = new Date(entry.start_time);
    const durationMinutes = Math.floor((endTime.getTime() - startTime.getTime()) / 1000 / 60);

    return this.update(entryId, {
      end_time: endTime.toISOString(),
      duration_minutes: durationMinutes
    });
  }

  async getTotalTimeByTicket(ticketId: string): Promise<number> {
    const entries = await this.findByTicket(ticketId);
    return entries.reduce((total, entry) => {
      return total + (entry.duration_minutes || 0);
    }, 0);
  }

  async getTotalTimeByUser(userId: string, startDate?: string, endDate?: string): Promise<number> {
    const client = await this.getClient();
    let query = client
      .from(this.tableName)
      .select('duration_minutes')
      .eq('user_id', userId)
      .not('duration_minutes', 'is', null);

    if (startDate) {
      query = query.gte('start_time', startDate);
    }

    if (endDate) {
      query = query.lte('start_time', endDate);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to calculate total time for user: ${error.message}`);
    }

    return (data as any[]).reduce((total, entry) => {
      return total + (entry.duration_minutes || 0);
    }, 0);
  }

  async getTimeEntriesByDateRange(startDate: string, endDate: string): Promise<TimeEntry[]> {
    const client = await this.getClient();
    const { data, error } = await client
      .from(this.tableName)
      .select(`
        *,
        ticket:repair_tickets!ticket_id (
          ticket_number,
          device_brand,
          device_model
        ),
        user:users!user_id (
          full_name
        )
      `)
      .gte('start_time', startDate)
      .lte('start_time', endDate)
      .order('start_time', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch time entries by date range: ${error.message}`);
    }

    return data as any[];
  }
}