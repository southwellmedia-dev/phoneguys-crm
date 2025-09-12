import { 
  StatusLookupRepository, 
  PublicTicketInfo, 
  PublicAppointmentInfo, 
  TimelineEvent 
} from '@/lib/repositories/status-lookup.repository';

export interface StatusLookupRequest {
  type: 'ticket' | 'appointment';
  identifier: string;
  email: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface StatusLookupResponse {
  success: boolean;
  type?: 'ticket' | 'appointment';
  data?: PublicTicketInfo | PublicAppointmentInfo;
  timeline?: TimelineEvent[];
  error?: string;
  rateLimitExceeded?: boolean;
  attemptsRemaining?: number;
}

export class StatusLookupService {
  private repository: StatusLookupRepository;
  private readonly MAX_ATTEMPTS_PER_MINUTE = 5;
  private readonly MAX_ATTEMPTS_PER_HOUR = 20;

  constructor() {
    this.repository = new StatusLookupRepository(false); // Use anon role
  }

  /**
   * Main lookup method that handles both tickets and appointments
   */
  async lookupStatus(request: StatusLookupRequest): Promise<StatusLookupResponse> {
    try {
      // Validate input
      const validation = this.validateInput(request);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      // Check rate limiting if IP address is provided
      if (request.ipAddress) {
        const rateLimitCheck = await this.checkRateLimit(request.ipAddress);
        if (!rateLimitCheck.allowed) {
          // Log failed attempt due to rate limiting
          await this.repository.logLookupAttempt({
            lookup_type: request.type,
            identifier: request.identifier,
            email: request.email,
            ip_address: request.ipAddress,
            user_agent: request.userAgent,
            success: false,
            error_reason: 'Rate limit exceeded'
          });

          return {
            success: false,
            error: 'Too many requests. Please try again later.',
            rateLimitExceeded: true,
            attemptsRemaining: rateLimitCheck.attemptsRemaining
          };
        }
      }

      // Perform the lookup based on type
      let lookupResult: StatusLookupResponse;
      
      if (request.type === 'ticket') {
        lookupResult = await this.lookupTicket(request);
      } else {
        lookupResult = await this.lookupAppointment(request);
      }

      // Log the attempt
      await this.repository.logLookupAttempt({
        lookup_type: request.type,
        identifier: request.identifier,
        email: request.email,
        ip_address: request.ipAddress,
        user_agent: request.userAgent,
        success: lookupResult.success,
        error_reason: lookupResult.error || null
      });

      return lookupResult;
    } catch (error) {
      console.error('Error in lookupStatus:', error);
      
      // Log the error
      await this.repository.logLookupAttempt({
        lookup_type: request.type,
        identifier: request.identifier,
        email: request.email,
        ip_address: request.ipAddress,
        user_agent: request.userAgent,
        success: false,
        error_reason: 'System error'
      });

      return {
        success: false,
        error: 'An error occurred while processing your request. Please try again later.'
      };
    }
  }

  /**
   * Lookup ticket information
   */
  private async lookupTicket(request: StatusLookupRequest): Promise<StatusLookupResponse> {
    // Get ticket info
    const ticketResult = await this.repository.getPublicTicketInfo(
      request.identifier,
      request.email
    );

    if (!ticketResult.success) {
      return {
        success: false,
        error: ticketResult.error || 'Invalid ticket number or email'
      };
    }

    // Get timeline
    const timeline = await this.repository.getTicketTimeline(
      request.identifier,
      request.email
    );

    // Format the response
    const formattedData = this.formatTicketData(ticketResult.data!);

    return {
      success: true,
      type: 'ticket',
      data: formattedData,
      timeline: this.formatTimeline(timeline)
    };
  }

  /**
   * Lookup appointment information
   */
  private async lookupAppointment(request: StatusLookupRequest): Promise<StatusLookupResponse> {
    // Get appointment info
    const appointmentResult = await this.repository.getPublicAppointmentInfo(
      request.identifier,
      request.email
    );

    if (!appointmentResult.success) {
      return {
        success: false,
        error: appointmentResult.error || 'Invalid appointment number or email'
      };
    }

    // Get timeline
    const timeline = await this.repository.getAppointmentTimeline(
      request.identifier,
      request.email
    );

    // Format the response
    const formattedData = this.formatAppointmentData(appointmentResult.data!);

    return {
      success: true,
      type: 'appointment',
      data: formattedData,
      timeline: this.formatTimeline(timeline)
    };
  }

  /**
   * Validate input data
   */
  private validateInput(request: StatusLookupRequest): { valid: boolean; error?: string } {
    // Check type
    if (!request.type || !['ticket', 'appointment'].includes(request.type)) {
      return { valid: false, error: 'Invalid lookup type' };
    }

    // Check identifier
    if (!request.identifier || request.identifier.trim().length === 0) {
      return { valid: false, error: 'Reference number is required' };
    }

    // Validate identifier format (accept multiple formats including TPG)
    if (request.type === 'ticket') {
      if (!request.identifier.match(/^(TKT-\d{8}-\d{3}|TKT\d{4}|TPG\d{4})$/i)) {
        return { valid: false, error: 'Invalid ticket number format' };
      }
    } else {
      if (!request.identifier.match(/^(APT-\d{8}-\d{3}|APT\d{4})$/i)) {
        return { valid: false, error: 'Invalid appointment number format' };
      }
    }

    // Check email
    if (!request.email || request.email.trim().length === 0) {
      return { valid: false, error: 'Email is required' };
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(request.email)) {
      return { valid: false, error: 'Invalid email format' };
    }

    return { valid: true };
  }

  /**
   * Check rate limiting
   */
  private async checkRateLimit(ipAddress: string): Promise<{ allowed: boolean; attemptsRemaining: number }> {
    // Check attempts in the last minute
    const recentAttempts = await this.repository.getRecentAttemptsFromIP(ipAddress, 1);
    
    if (recentAttempts >= this.MAX_ATTEMPTS_PER_MINUTE) {
      return { 
        allowed: false, 
        attemptsRemaining: 0 
      };
    }

    // Check attempts in the last hour
    const hourlyAttempts = await this.repository.getRecentAttemptsFromIP(ipAddress, 60);
    
    if (hourlyAttempts >= this.MAX_ATTEMPTS_PER_HOUR) {
      return { 
        allowed: false, 
        attemptsRemaining: 0 
      };
    }

    return { 
      allowed: true, 
      attemptsRemaining: Math.min(
        this.MAX_ATTEMPTS_PER_MINUTE - recentAttempts,
        this.MAX_ATTEMPTS_PER_HOUR - hourlyAttempts
      )
    };
  }

  /**
   * Format ticket data for public display
   */
  private formatTicketData(data: PublicTicketInfo): PublicTicketInfo {
    return {
      ...data,
      // Format status for better display
      status: this.formatStatus(data.status),
      // Format dates
      created_at: this.formatDate(data.created_at),
      updated_at: this.formatDate(data.updated_at),
      estimated_completion: data.estimated_completion ? this.formatDate(data.estimated_completion) : null,
      // Ensure sensitive data is not exposed
      total_cost: data.total_cost,
      amount_paid: data.amount_paid
    };
  }

  /**
   * Format appointment data for public display
   */
  private formatAppointmentData(data: PublicAppointmentInfo): PublicAppointmentInfo {
    return {
      ...data,
      // Format status for better display
      status: this.formatStatus(data.status),
      // Format dates
      created_at: this.formatDate(data.created_at),
      updated_at: this.formatDate(data.updated_at),
      scheduled_date: this.formatDate(data.scheduled_date),
      scheduled_time: this.formatTime(data.scheduled_time)
    };
  }

  /**
   * Format timeline events
   */
  private formatTimeline(timeline: TimelineEvent[]): TimelineEvent[] {
    return timeline.map(event => ({
      ...event,
      timestamp: this.formatDateTime(event.timestamp),
      description: this.sanitizeDescription(event.description)
    }));
  }

  /**
   * Format status for display
   */
  private formatStatus(status: string): string {
    const statusMap: { [key: string]: string } = {
      'new': 'New',
      'in_progress': 'In Progress',
      'pending_parts': 'Waiting for Parts',
      'ready_for_pickup': 'Ready for Pickup',
      'completed': 'Completed',
      'cancelled': 'Cancelled',
      'on_hold': 'On Hold',
      'scheduled': 'Scheduled',
      'confirmed': 'Confirmed',
      'arrived': 'Arrived',
      'no_show': 'No Show',
      'converted': 'Converted to Repair'
    };

    return statusMap[status] || status;
  }

  /**
   * Format date for display
   */
  private formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  }

  /**
   * Format time for display
   */
  private formatTime(timeString: string): string {
    try {
      // Parse time in HH:MM format
      const [hours, minutes] = timeString.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 || 12;
      return `${displayHour}:${minutes} ${ampm}`;
    } catch {
      return timeString;
    }
  }

  /**
   * Format datetime for display
   */
  private formatDateTime(dateTimeString: string): string {
    try {
      const date = new Date(dateTimeString);
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return dateTimeString;
    }
  }

  /**
   * Sanitize description to remove any sensitive information
   */
  private sanitizeDescription(description: string): string {
    // Remove any potential sensitive patterns (phone numbers, emails, etc.)
    let sanitized = description;
    
    // Remove email addresses
    sanitized = sanitized.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[email]');
    
    // Remove phone numbers (basic pattern)
    sanitized = sanitized.replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, '[phone]');
    
    // Remove credit card patterns
    sanitized = sanitized.replace(/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, '[card]');
    
    return sanitized;
  }

  /**
   * Get lookup statistics for admin dashboard
   */
  async getStatistics(days: number = 7): Promise<any> {
    return this.repository.getLookupStatistics(days);
  }
}