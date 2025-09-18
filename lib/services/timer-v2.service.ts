import { createServiceClient } from '@/lib/supabase/service';
import { createClient } from '@/lib/supabase/client';
import { SupabaseClient } from '@supabase/supabase-js';

export interface ActiveTimerData {
  id: string;
  ticket_id: string;
  user_id: string;
  start_time: string;
  pause_time?: string;
  total_paused_seconds: number;
  is_paused: boolean;
  auto_paused_at?: string;
  last_heartbeat: string;
  elapsed_seconds?: number;
  ticket_number?: string;
  customer_name?: string;
  user_name?: string;
}

export interface TimerResult {
  success: boolean;
  message: string;
  timer?: ActiveTimerData;
  duration?: number;
}

/**
 * Enhanced Timer Service V2
 * Uses database-backed persistent timers with auto-recovery
 */
export class TimerServiceV2 {
  private supabase: SupabaseClient;

  constructor(useServiceRole = false) {
    this.supabase = useServiceRole ? createServiceClient() : createClient();
  }

  /**
   * Get active timer for a user
   */
  async getActiveTimer(userId: string): Promise<ActiveTimerData | null> {
    try {
      const { data, error } = await this.supabase
        .from('active_timers_with_elapsed')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error || !data) return null;

      return this.mapTimerData(data);
    } catch (error) {
      console.error('Failed to get active timer:', error);
      return null;
    }
  }

  /**
   * Get active timer for a specific ticket
   */
  async getTicketTimer(ticketId: string): Promise<ActiveTimerData | null> {
    try {
      const { data, error } = await this.supabase
        .from('active_timers_with_elapsed')
        .select('*')
        .eq('ticket_id', ticketId)
        .single();

      if (error || !data) return null;

      return this.mapTimerData(data);
    } catch (error) {
      console.error('Failed to get ticket timer:', error);
      return null;
    }
  }

  /**
   * Get all active timers (for admin)
   */
  async getAllActiveTimers(): Promise<ActiveTimerData[]> {
    try {
      const { data, error } = await this.supabase
        .from('active_timers_with_elapsed')
        .select('*')
        .order('start_time', { ascending: false });

      if (error || !data) return [];

      return data.map(this.mapTimerData);
    } catch (error) {
      console.error('Failed to get all active timers:', error);
      return [];
    }
  }

  /**
   * Start a timer
   */
  async startTimer(ticketId: string, userId: string): Promise<TimerResult> {
    try {
      // Check if user has any other active timer
      const existingTimer = await this.getActiveTimer(userId);
      if (existingTimer && existingTimer.ticket_id !== ticketId) {
        return {
          success: false,
          message: `You have an active timer running for ticket ${existingTimer.ticket_number}. Please stop it first.`,
        };
      }

      // Check if ticket already has an active timer
      const ticketTimer = await this.getTicketTimer(ticketId);
      if (ticketTimer && ticketTimer.user_id !== userId) {
        return {
          success: false,
          message: `This ticket already has an active timer running by ${ticketTimer.user_name}.`,
        };
      }

      // If same timer exists (recovery case), just unpause it
      if (ticketTimer && ticketTimer.user_id === userId) {
        if (ticketTimer.is_paused) {
          return await this.resumeTimer(ticketId, userId);
        }
        return {
          success: true,
          message: 'Timer is already running',
          timer: ticketTimer,
        };
      }

      // Start new timer
      const { data, error } = await this.supabase
        .from('active_timers')
        .insert({
          ticket_id: ticketId,
          user_id: userId,
          start_time: new Date().toISOString(),
          last_heartbeat: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('Failed to start timer:', error);
        return {
          success: false,
          message: error.message || 'Failed to start timer',
        };
      }

      // Get full timer data with relations
      const fullTimer = await this.getTicketTimer(ticketId);

      // Update ticket status to in_progress if needed
      // Check if ticket is currently 'new'
      const { data: ticket } = await this.supabase
        .from('repair_tickets')
        .select('status, customer_id')
        .eq('id', ticketId)
        .single();
      
      if (ticket?.status === 'new') {
        // Update status
        await this.supabase
          .from('repair_tickets')
          .update({ 
            status: 'in_progress',
            updated_at: new Date().toISOString(),
          })
          .eq('id', ticketId);
        
        // Trigger notifications for status change
        try {
          console.log('🔔 Timer started - triggering in_progress status notifications');
          
          const { getTicketNotificationService } = await import('./ticket-notifications.service');
          const ticketNotificationService = getTicketNotificationService();
          
          // Get the full ticket data with customer info
          const { RepairOrderService } = await import('./repair-order.service');
          const repairService = new RepairOrderService(true);
          const fullTicket = await repairService.getRepairOrder(ticketId);
          
          if (fullTicket && fullTicket.customers) {
            console.log('📧 Sending in_progress notification to:', fullTicket.customers.email);
            
            // Get device info if available
            let device = null;
            if (fullTicket.device_id) {
              const { data: deviceData } = await this.supabase
                .from('devices')
                .select('*')
                .eq('id', fullTicket.device_id)
                .single();
              device = deviceData;
            }
            
            // Send status update notification
            const notificationResult = await ticketNotificationService.sendStatusUpdateNotifications({
              ticket: fullTicket,
              customer: fullTicket.customers,
              device: device,
              previousStatus: 'new',
              newStatus: 'in_progress',
              notes: 'Work has started on your device'
            });
            
            console.log('✅ Timer in_progress notification result:', notificationResult);
          } else {
            console.log('⚠️ No customer data found for in_progress notification');
          }
        } catch (error) {
          console.error('❌ Failed to send status update notification:', error);
          // Don't fail the timer start if notification fails
        }
      }

      return {
        success: true,
        message: 'Timer started successfully',
        timer: fullTimer || this.mapTimerData(data),
      };
    } catch (error) {
      console.error('Error starting timer:', error);
      return {
        success: false,
        message: 'Failed to start timer',
      };
    }
  }

  /**
   * Stop a timer and create time entry
   */
  async stopTimer(ticketId: string, userId: string, notes?: string): Promise<TimerResult> {
    try {
      // Get the active timer
      const timer = await this.getTicketTimer(ticketId);
      if (!timer) {
        return {
          success: false,
          message: 'No active timer found for this ticket',
        };
      }

      if (timer.user_id !== userId) {
        return {
          success: false,
          message: 'You can only stop your own timer',
        };
      }

      const elapsedSeconds = timer.elapsed_seconds || 0;
      const durationMinutes = Math.ceil(elapsedSeconds / 60);

      // Create time entry
      const { error: entryError } = await this.supabase
        .from('time_entries')
        .insert({
          ticket_id: ticketId,
          user_id: userId,
          start_time: timer.start_time,
          end_time: new Date().toISOString(),
          duration_minutes: durationMinutes,
          description: notes || '',
        });

      if (entryError) {
        console.error('Failed to create time entry:', entryError);
        return {
          success: false,
          message: 'Failed to save time entry',
        };
      }

      // Delete the active timer
      const { error: deleteError } = await this.supabase
        .from('active_timers')
        .delete()
        .eq('id', timer.id);

      if (deleteError) {
        console.error('Failed to delete timer:', deleteError);
      }

      return {
        success: true,
        message: 'Timer stopped successfully',
        duration: durationMinutes,
      };
    } catch (error) {
      console.error('Error stopping timer:', error);
      return {
        success: false,
        message: 'Failed to stop timer',
      };
    }
  }

  /**
   * Pause a timer
   */
  async pauseTimer(ticketId: string, userId: string): Promise<TimerResult> {
    try {
      const timer = await this.getTicketTimer(ticketId);
      if (!timer) {
        return {
          success: false,
          message: 'No active timer found',
        };
      }

      if (timer.user_id !== userId) {
        return {
          success: false,
          message: 'You can only pause your own timer',
        };
      }

      if (timer.is_paused) {
        return {
          success: false,
          message: 'Timer is already paused',
        };
      }

      const { error } = await this.supabase
        .from('active_timers')
        .update({
          is_paused: true,
          pause_time: new Date().toISOString(),
          last_heartbeat: new Date().toISOString(),
        })
        .eq('id', timer.id);

      if (error) {
        return {
          success: false,
          message: 'Failed to pause timer',
        };
      }

      return {
        success: true,
        message: 'Timer paused',
        timer: { ...timer, is_paused: true },
      };
    } catch (error) {
      console.error('Error pausing timer:', error);
      return {
        success: false,
        message: 'Failed to pause timer',
      };
    }
  }

  /**
   * Resume a paused timer
   */
  async resumeTimer(ticketId: string, userId: string): Promise<TimerResult> {
    try {
      const timer = await this.getTicketTimer(ticketId);
      if (!timer) {
        return {
          success: false,
          message: 'No timer found',
        };
      }

      if (timer.user_id !== userId) {
        return {
          success: false,
          message: 'You can only resume your own timer',
        };
      }

      if (!timer.is_paused) {
        return {
          success: true,
          message: 'Timer is already running',
          timer,
        };
      }

      // Calculate paused duration
      const pausedSeconds = timer.pause_time
        ? Math.floor((Date.now() - new Date(timer.pause_time).getTime()) / 1000)
        : 0;

      const { error } = await this.supabase
        .from('active_timers')
        .update({
          is_paused: false,
          pause_time: null,
          total_paused_seconds: (timer.total_paused_seconds || 0) + pausedSeconds,
          last_heartbeat: new Date().toISOString(),
          auto_paused_at: null, // Clear auto-pause flag
        })
        .eq('id', timer.id);

      if (error) {
        return {
          success: false,
          message: 'Failed to resume timer',
        };
      }

      const updatedTimer = await this.getTicketTimer(ticketId);
      return {
        success: true,
        message: 'Timer resumed',
        timer: updatedTimer || timer,
      };
    } catch (error) {
      console.error('Error resuming timer:', error);
      return {
        success: false,
        message: 'Failed to resume timer',
      };
    }
  }

  /**
   * Update timer heartbeat
   */
  async updateHeartbeat(ticketId: string, userId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('active_timers')
        .update({ last_heartbeat: new Date().toISOString() })
        .eq('ticket_id', ticketId)
        .eq('user_id', userId);

      return !error;
    } catch (error) {
      console.error('Failed to update heartbeat:', error);
      return false;
    }
  }

  /**
   * Clear timer (admin only)
   */
  async clearTimer(ticketId: string, adminUserId: string, reason?: string): Promise<TimerResult> {
    try {
      const timer = await this.getTicketTimer(ticketId);
      if (!timer) {
        return {
          success: false,
          message: 'No active timer found',
        };
      }

      // Create audit entry
      await this.supabase
        .from('audit_logs')
        .insert({
          user_id: adminUserId,
          action: 'timer.cleared',
          resource_type: 'timer',
          resource_id: timer.id,
          details: {
            ticket_id: ticketId,
            timer_user_id: timer.user_id,
            elapsed_seconds: timer.elapsed_seconds,
            reason: reason || 'Admin cleared timer',
          },
        });

      // Delete the timer
      const { error } = await this.supabase
        .from('active_timers')
        .delete()
        .eq('ticket_id', ticketId);

      if (error) {
        return {
          success: false,
          message: 'Failed to clear timer',
        };
      }

      return {
        success: true,
        message: 'Timer cleared successfully',
      };
    } catch (error) {
      console.error('Error clearing timer:', error);
      return {
        success: false,
        message: 'Failed to clear timer',
      };
    }
  }

  /**
   * Auto-pause long-running timers
   */
  async autoPauseLongRunningTimers(): Promise<void> {
    try {
      await this.supabase.rpc('auto_pause_long_running_timers');
    } catch (error) {
      console.error('Failed to auto-pause timers:', error);
    }
  }

  /**
   * Cleanup stale timers
   */
  async cleanupStaleTimers(): Promise<void> {
    try {
      await this.supabase.rpc('cleanup_stale_timers');
    } catch (error) {
      console.error('Failed to cleanup stale timers:', error);
    }
  }

  /**
   * Map database timer data to consistent format
   */
  private mapTimerData(data: any): ActiveTimerData {
    return {
      id: data.id,
      ticket_id: data.ticket_id,
      user_id: data.user_id,
      start_time: data.start_time,
      pause_time: data.pause_time,
      total_paused_seconds: data.total_paused_seconds || 0,
      is_paused: data.is_paused || false,
      auto_paused_at: data.auto_paused_at,
      last_heartbeat: data.last_heartbeat,
      elapsed_seconds: data.elapsed_seconds || 0,
      ticket_number: data.ticket_number,
      customer_name: data.customer_name,
      user_name: data.user_name,
    };
  }
}

// Export singleton for client-side use
let clientInstance: TimerServiceV2 | null = null;

export function getTimerService(useServiceRole = false): TimerServiceV2 {
  if (typeof window !== 'undefined' && !useServiceRole) {
    // Client-side singleton
    if (!clientInstance) {
      clientInstance = new TimerServiceV2(false);
    }
    return clientInstance;
  }
  // Server-side, create new instance each time
  return new TimerServiceV2(useServiceRole);
}