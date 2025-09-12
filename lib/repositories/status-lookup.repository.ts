import { BaseRepository } from './base.repository';

export interface StatusLookupAttempt {
  id?: string;
  lookup_type: 'ticket' | 'appointment';
  identifier: string;
  email: string;
  ip_address?: string | null;
  user_agent?: string | null;
  success: boolean;
  error_reason?: string | null;
  created_at?: string;
}

export interface PublicTicketInfo {
  ticket_number: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
  estimated_completion?: string | null;
  device?: {
    brand: string;
    model: string;
    color?: string;
    storage_capacity?: string;
  } | null;
  services?: string[] | null;
  issues?: string[] | null;
  total_cost?: number | null;
  amount_paid?: number | null;
  customer_name?: string;
  assigned_technician?: string | null;
}

export interface PublicAppointmentInfo {
  appointment_number: string;
  status: string;
  scheduled_date: string;
  scheduled_time: string;
  duration_minutes?: number;
  created_at: string;
  updated_at: string;
  device?: {
    brand: string;
    model: string;
    color?: string;
    storage_capacity?: string;
  } | null;
  issues?: string[] | null;
  description?: string | null;
  urgency?: string | null;
  estimated_cost?: number | null;
  customer_name?: string;
  assigned_technician?: string | null;
  converted_to_ticket?: string | null;
}

export interface TimelineEvent {
  timestamp: string;
  type: 'status_change' | 'comment' | 'update';
  description: string;
  status?: string | null;
}

export class StatusLookupRepository extends BaseRepository<StatusLookupAttempt> {
  constructor(useServiceRole: boolean = false) {
    super('status_lookup_attempts', useServiceRole);
  }

  /**
   * Log a status lookup attempt
   */
  async logLookupAttempt(attempt: Omit<StatusLookupAttempt, 'id' | 'created_at'>): Promise<StatusLookupAttempt | null> {
    try {
      const supabase = await this.getClient();
      const { data, error } = await supabase
        .from(this.tableName)
        .insert(attempt)
        .select()
        .single();

      if (error) {
        console.error('Error logging lookup attempt:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in logLookupAttempt:', error);
      return null;
    }
  }

  /**
   * Get recent lookup attempts from an IP address for rate limiting
   */
  async getRecentAttemptsFromIP(ipAddress: string, minutes: number = 1): Promise<number> {
    try {
      const supabase = await this.getClient();
      const cutoffTime = new Date(Date.now() - minutes * 60 * 1000).toISOString();
      
      const { count, error } = await supabase
        .from(this.tableName)
        .select('*', { count: 'exact', head: true })
        .eq('ip_address', ipAddress)
        .gte('created_at', cutoffTime);

      if (error) {
        console.error('Error checking recent attempts:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('Error in getRecentAttemptsFromIP:', error);
      return 0;
    }
  }

  /**
   * Validate and get ticket information
   */
  async getPublicTicketInfo(ticketNumber: string, email: string): Promise<{ success: boolean; data?: PublicTicketInfo; error?: string }> {
    try {
      const supabase = await this.getClient();
      
      // Call the stored function
      const { data, error } = await supabase.rpc('get_public_ticket_info', {
        p_ticket_number: ticketNumber,
        p_email: email
      });

      if (error) {
        console.error('Error getting ticket info:', error);
        return { success: false, error: 'Failed to retrieve ticket information' };
      }

      if (!data || !data.success) {
        return { success: false, error: 'Invalid ticket number or email' };
      }

      return { success: true, data: data.data };
    } catch (error) {
      console.error('Error in getPublicTicketInfo:', error);
      return { success: false, error: 'An error occurred while retrieving ticket information' };
    }
  }

  /**
   * Validate and get appointment information
   */
  async getPublicAppointmentInfo(appointmentNumber: string, email: string): Promise<{ success: boolean; data?: PublicAppointmentInfo; error?: string }> {
    try {
      const supabase = await this.getClient();
      
      // Call the stored function
      const { data, error } = await supabase.rpc('get_public_appointment_info', {
        p_appointment_number: appointmentNumber,
        p_email: email
      });

      if (error) {
        console.error('Error getting appointment info:', error);
        return { success: false, error: 'Failed to retrieve appointment information' };
      }

      if (!data || !data.success) {
        return { success: false, error: 'Invalid appointment number or email' };
      }

      return { success: true, data: data.data };
    } catch (error) {
      console.error('Error in getPublicAppointmentInfo:', error);
      return { success: false, error: 'An error occurred while retrieving appointment information' };
    }
  }

  /**
   * Get timeline for a ticket
   */
  async getTicketTimeline(ticketNumber: string, email: string): Promise<TimelineEvent[]> {
    try {
      const supabase = await this.getClient();
      
      const { data, error } = await supabase.rpc('get_ticket_timeline', {
        p_ticket_number: ticketNumber,
        p_email: email
      });

      if (error) {
        console.error('Error getting ticket timeline:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getTicketTimeline:', error);
      return [];
    }
  }

  /**
   * Get timeline for an appointment
   */
  async getAppointmentTimeline(appointmentNumber: string, email: string): Promise<TimelineEvent[]> {
    try {
      const supabase = await this.getClient();
      
      const { data, error } = await supabase.rpc('get_appointment_timeline', {
        p_appointment_number: appointmentNumber,
        p_email: email
      });

      if (error) {
        console.error('Error getting appointment timeline:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getAppointmentTimeline:', error);
      return [];
    }
  }

  /**
   * Get lookup statistics for admin dashboard
   */
  async getLookupStatistics(days: number = 7): Promise<any> {
    try {
      const supabase = await this.getClient();
      const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
      
      const { data, error } = await supabase
        .from(this.tableName)
        .select('lookup_type, success, created_at')
        .gte('created_at', cutoffDate);

      if (error) {
        console.error('Error getting lookup statistics:', error);
        return null;
      }

      // Process statistics
      const stats = {
        total: data.length,
        successful: data.filter(d => d.success).length,
        failed: data.filter(d => !d.success).length,
        byType: {
          ticket: data.filter(d => d.lookup_type === 'ticket').length,
          appointment: data.filter(d => d.lookup_type === 'appointment').length
        },
        successRate: data.length > 0 ? (data.filter(d => d.success).length / data.length * 100).toFixed(1) : 0
      };

      return stats;
    } catch (error) {
      console.error('Error in getLookupStatistics:', error);
      return null;
    }
  }
}