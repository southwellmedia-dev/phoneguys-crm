import { TimeEntryRepository } from '../repositories/time-entry.repository';
import { RepairTicketRepository } from '../repositories/repair-ticket.repository';
import { UserRepository } from '../repositories/user.repository';
import { TimeEntry, CreateTimeEntryDto, RepairTicket } from '../types/database.types';

interface ActiveTimer {
  ticketId: string;
  userId: string;
  startTime: Date;
}

export class TimerService {
  private timeEntryRepo: TimeEntryRepository;
  private ticketRepo: RepairTicketRepository;
  private userRepo: UserRepository;
  
  // In-memory storage for active timers
  // In production, this could be Redis or similar
  private static activeTimers = new Map<string, ActiveTimer>();

  constructor(useServiceRole = false) {
    this.timeEntryRepo = new TimeEntryRepository(useServiceRole);
    this.ticketRepo = new RepairTicketRepository(useServiceRole);
    this.userRepo = new UserRepository(useServiceRole);
  }

  /**
   * Start a timer for a repair ticket
   */
  async startTimer(ticketId: string, userId: string): Promise<{
    success: boolean;
    message: string;
    startTime?: string;
  }> {
    // Check if ticket exists and is in valid state
    const ticket = await this.ticketRepo.findById(ticketId);
    if (!ticket) {
      throw new Error('Repair ticket not found');
    }

    if (!['new', 'in_progress', 'on_hold'].includes(ticket.status)) {
      throw new Error(`Cannot start timer for ticket with status: ${ticket.status}`);
    }

    // Check if timer is already running for this ticket
    const timerKey = `${ticketId}-${userId}`;
    if (TimerService.activeTimers.has(timerKey)) {
      return {
        success: false,
        message: 'Timer is already running for this ticket'
      };
    }

    // Check if user has any other active timers
    const userActiveTimers = Array.from(TimerService.activeTimers.entries())
      .filter(([_, timer]) => timer.userId === userId);
    
    if (userActiveTimers.length > 0) {
      const [activeKey, activeTimer] = userActiveTimers[0];
      return {
        success: false,
        message: `You have an active timer running for ticket ${activeTimer.ticketId}. Please stop it first.`
      };
    }

    // Start the timer
    const startTime = new Date();
    TimerService.activeTimers.set(timerKey, {
      ticketId,
      userId,
      startTime
    });

    // Update ticket to in_progress if it was new
    if (ticket.status === 'new') {
      await this.ticketRepo.update(ticketId, {
        status: 'in_progress',
        timer_started_at: startTime.toISOString()
      });
    } else {
      await this.ticketRepo.update(ticketId, {
        timer_started_at: startTime.toISOString()
      });
    }

    return {
      success: true,
      message: 'Timer started successfully',
      startTime: startTime.toISOString()
    };
  }

  /**
   * Stop a timer and record the time entry
   */
  async stopTimer(
    ticketId: string,
    userId: string,
    notes?: string
  ): Promise<{
    success: boolean;
    message: string;
    timeEntry?: TimeEntry;
    duration?: number;
  }> {
    try {
      const timerKey = `${ticketId}-${userId}`;
      let activeTimer = TimerService.activeTimers.get(timerKey);
      let startTime: Date;

      if (!activeTimer) {
        // Timer not in memory (server may have restarted), check database
        const ticket = await this.ticketRepo.findById(ticketId);
        
        if (!ticket?.timer_started_at) {
          return {
            success: false,
            message: 'No active timer found for this ticket'
          };
        }
        
        // Recover timer from database
        startTime = new Date(ticket.timer_started_at);
      } else {
        startTime = activeTimer.startTime;
      }

      // Calculate duration
      const endTime = new Date();
      const durationMs = endTime.getTime() - startTime.getTime();
      const durationMinutes = Math.ceil(durationMs / (1000 * 60));

      // Create time entry
      const timeEntry = await this.timeEntryRepo.create({
        ticket_id: ticketId,
        user_id: userId,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        duration_minutes: durationMinutes,
        description: notes // Changed from 'notes' to 'description' to match database schema
      });

      // Remove from active timers if it was there
      if (activeTimer) {
        TimerService.activeTimers.delete(timerKey);
      }

      // Update ticket with accumulated time
      await this.updateTicketTotalTime(ticketId);

      // Clear timer_started_at from ticket
      await this.ticketRepo.update(ticketId, {
        timer_started_at: null
      });

      return {
        success: true,
        message: 'Timer stopped and time recorded',
        timeEntry,
        duration: durationMinutes
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Pause a timer (convert to time entry but keep ticket in progress)
   */
  async pauseTimer(ticketId: string, userId: string): Promise<{
    success: boolean;
    message: string;
    duration?: number;
  }> {
    const result = await this.stopTimer(ticketId, userId, 'Timer paused');
    
    if (result.success) {
      return {
        success: true,
        message: 'Timer paused successfully',
        duration: result.duration
      };
    }

    return result;
  }

  /**
   * Get active timer for a user
   */
  async getActiveTimer(userId: string): Promise<{
    ticketId: string;
    startTime: Date;
    elapsedMinutes: number;
  } | null> {
    // First check in-memory storage
    const userTimer = Array.from(TimerService.activeTimers.entries())
      .find(([_, timer]) => timer.userId === userId);

    if (userTimer) {
      const [_, timer] = userTimer;
      const now = new Date();
      const elapsedMs = now.getTime() - timer.startTime.getTime();
      const elapsedMinutes = Math.floor(elapsedMs / (1000 * 60));

      return {
        ticketId: timer.ticketId,
        startTime: timer.startTime,
        elapsedMinutes
      };
    }

    // If not in memory, check database for any tickets with timer_started_at
    // This handles server restart scenarios
    try {
      const tickets = await this.ticketRepo.findAll();
      const activeTicket = tickets.find(t => t.timer_started_at && t.assigned_to === userId);
      
      if (activeTicket && activeTicket.timer_started_at) {
        const startTime = new Date(activeTicket.timer_started_at);
        const now = new Date();
        const elapsedMs = now.getTime() - startTime.getTime();
        const elapsedMinutes = Math.floor(elapsedMs / (1000 * 60));

        // Restore to memory for future use
        TimerService.activeTimers.set(`${activeTicket.id}-${userId}`, {
          ticketId: activeTicket.id,
          userId,
          startTime
        });

        return {
          ticketId: activeTicket.id,
          startTime,
          elapsedMinutes
        };
      }
    } catch (error) {
      console.error('Error checking database for active timer:', error);
    }

    return null;
  }

  /**
   * Get all active timers
   */
  getAllActiveTimers(): Array<{
    ticketId: string;
    userId: string;
    startTime: Date;
    elapsedMinutes: number;
  }> {
    const now = new Date();
    return Array.from(TimerService.activeTimers.values()).map(timer => {
      const elapsedMs = now.getTime() - timer.startTime.getTime();
      const elapsedMinutes = Math.floor(elapsedMs / (1000 * 60));
      
      return {
        ...timer,
        elapsedMinutes
      };
    });
  }

  /**
   * Get time entries for a ticket
   */
  async getTicketTimeEntries(ticketId: string): Promise<{
    entries: TimeEntry[];
    totalMinutes: number;
    totalCost: number;
  }> {
    const entries = await this.timeEntryRepo.findByTicket(ticketId);
    const totalMinutes = await this.timeEntryRepo.getTotalTimeByTicket(ticketId);
    
    // Calculate cost (assuming $60/hour rate - this should be configurable)
    const hourlyRate = 60;
    const totalCost = (totalMinutes / 60) * hourlyRate;

    return {
      entries,
      totalMinutes,
      totalCost
    };
  }

  /**
   * Get time entries for a user
   */
  async getUserTimeEntries(
    userId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    entries: TimeEntry[];
    totalMinutes: number;
    ticketCount: number;
  }> {
    const entries = await this.timeEntryRepo.findByUser(userId);
    
    // Filter by date range if provided
    let filteredEntries = entries;
    if (startDate || endDate) {
      filteredEntries = entries.filter(entry => {
        const entryDate = new Date(entry.start_time);
        if (startDate && entryDate < startDate) return false;
        if (endDate && entryDate > endDate) return false;
        return true;
      });
    }

    const totalMinutes = filteredEntries.reduce(
      (sum, entry) => sum + (entry.duration_minutes || 0),
      0
    );

    const uniqueTickets = new Set(filteredEntries.map(e => e.ticket_id));
    const ticketCount = uniqueTickets.size;

    return {
      entries: filteredEntries,
      totalMinutes,
      ticketCount
    };
  }

  /**
   * Update a time entry
   */
  async updateTimeEntry(
    entryId: string,
    data: {
      duration_minutes?: number;
      description?: string; // Changed from 'notes' to 'description'
    }
  ): Promise<TimeEntry> {
    const entry = await this.timeEntryRepo.findById(entryId);
    if (!entry) {
      throw new Error('Time entry not found');
    }

    // Recalculate end time if duration is changed
    if (data.duration_minutes) {
      const startTime = new Date(entry.start_time);
      const endTime = new Date(startTime.getTime() + data.duration_minutes * 60 * 1000);
      
      const updated = await this.timeEntryRepo.update(entryId, {
        ...data,
        end_time: endTime.toISOString()
      });

      // Update ticket total time
      await this.updateTicketTotalTime(entry.ticket_id);
      
      return updated;
    }

    return this.timeEntryRepo.update(entryId, data);
  }

  /**
   * Delete a time entry
   */
  async deleteTimeEntry(entryId: string): Promise<boolean> {
    const entry = await this.timeEntryRepo.findById(entryId);
    if (!entry) {
      throw new Error('Time entry not found');
    }

    const result = await this.timeEntryRepo.delete(entryId);
    
    // Update ticket total time
    await this.updateTicketTotalTime(entry.ticket_id);
    
    return result;
  }

  /**
   * Add manual time entry
   */
  async addManualTimeEntry(
    ticketId: string,
    userId: string,
    durationMinutes: number,
    notes?: string,
    date?: Date
  ): Promise<TimeEntry> {
    const ticket = await this.ticketRepo.findById(ticketId);
    if (!ticket) {
      throw new Error('Repair ticket not found');
    }

    const entryDate = date || new Date();
    const startTime = new Date(entryDate);
    const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);

    const timeEntry = await this.timeEntryRepo.create({
      ticket_id: ticketId,
      user_id: userId,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      duration_minutes: durationMinutes,
      description: notes || 'Manual time entry' // Changed from 'notes' to 'description'
    });

    // Update ticket total time
    await this.updateTicketTotalTime(ticketId);

    return timeEntry;
  }

  /**
   * Get time tracking statistics
   */
  async getTimeStats(period: 'day' | 'week' | 'month' = 'week'): Promise<{
    totalMinutes: number;
    totalTickets: number;
    averageTimePerTicket: number;
    topTechnicians: Array<{
      userId: string;
      userName: string;
      totalMinutes: number;
      ticketCount: number;
    }>;
    byStatus: Record<string, number>;
  }> {
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    if (period === 'day') {
      startDate.setDate(startDate.getDate() - 1);
    } else if (period === 'week') {
      startDate.setDate(startDate.getDate() - 7);
    } else {
      startDate.setMonth(startDate.getMonth() - 1);
    }

    // Get all time entries in period
    const allEntries = await this.timeEntryRepo.findAll();
    const periodEntries = allEntries.filter(entry => {
      const entryDate = new Date(entry.start_time);
      return entryDate >= startDate && entryDate <= endDate;
    });

    // Calculate totals
    const totalMinutes = periodEntries.reduce(
      (sum, entry) => sum + (entry.duration_minutes || 0),
      0
    );
    const uniqueTickets = new Set(periodEntries.map(e => e.ticket_id));
    const totalTickets = uniqueTickets.size;
    const averageTimePerTicket = totalTickets > 0 ? Math.round(totalMinutes / totalTickets) : 0;

    // Get top technicians
    const technicianStats = new Map<string, {
      totalMinutes: number;
      ticketCount: Set<string>;
    }>();

    for (const entry of periodEntries) {
      if (!technicianStats.has(entry.user_id)) {
        technicianStats.set(entry.user_id, {
          totalMinutes: 0,
          ticketCount: new Set()
        });
      }
      const stats = technicianStats.get(entry.user_id)!;
      stats.totalMinutes += (entry.duration_minutes || 0);
      stats.ticketCount.add(entry.ticket_id);
    }

    // Get user names and format results
    const topTechnicians = [];
    for (const [userId, stats] of technicianStats.entries()) {
      const user = await this.userRepo.findById(userId);
      topTechnicians.push({
        userId,
        userName: user?.email || 'Unknown',
        totalMinutes: stats.totalMinutes,
        ticketCount: stats.ticketCount.size
      });
    }

    // Sort by total minutes
    topTechnicians.sort((a, b) => b.totalMinutes - a.totalMinutes);

    // Get time by ticket status
    const byStatus: Record<string, number> = {};
    for (const ticketId of uniqueTickets) {
      const ticket = await this.ticketRepo.findById(ticketId);
      if (ticket) {
        const ticketTime = periodEntries
          .filter(e => e.ticket_id === ticketId)
          .reduce((sum, e) => sum + (e.duration_minutes || 0), 0);
        
        byStatus[ticket.status] = (byStatus[ticket.status] || 0) + ticketTime;
      }
    }

    return {
      totalMinutes,
      totalTickets,
      averageTimePerTicket,
      topTechnicians: topTechnicians.slice(0, 5), // Top 5
      byStatus
    };
  }

  /**
   * Update ticket's total time and cost
   */
  private async updateTicketTotalTime(ticketId: string): Promise<void> {
    const totalMinutes = await this.timeEntryRepo.getTotalTimeByTicket(ticketId);
    
    // Calculate total cost (assuming $60/hour - should be configurable)
    const hourlyRate = 60;
    const totalHours = totalMinutes / 60;
    const laborCost = totalHours * hourlyRate;

    await this.ticketRepo.update(ticketId, {
      total_time_minutes: totalMinutes,
      // Note: labor_cost column doesn't exist in the database
      // Only update actual_cost which exists in the schema
      actual_cost: laborCost
    });
  }

  /**
   * Clean up orphaned timers (timers that have been running too long)
   */
  async cleanupOrphanedTimers(maxHours = 24): Promise<number> {
    const now = new Date();
    const maxMs = maxHours * 60 * 60 * 1000;
    let cleaned = 0;

    for (const [key, timer] of TimerService.activeTimers.entries()) {
      const elapsed = now.getTime() - timer.startTime.getTime();
      if (elapsed > maxMs) {
        // Auto-stop the timer
        await this.stopTimer(
          timer.ticketId,
          timer.userId,
          `Auto-stopped after ${maxHours} hours`
        );
        cleaned++;
      }
    }

    return cleaned;
  }
}