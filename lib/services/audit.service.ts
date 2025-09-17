import { createClient } from '@/lib/supabase/server';
import { NextRequest } from 'next/server';
import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Comprehensive Audit Service
 * Leverages existing audit infrastructure:
 * - user_activity_logs: User actions and business operations
 * - api_request_logs: API endpoint requests and responses  
 * - email_log: Email sending and delivery tracking
 */

export interface UserActivityLog {
  userId: string;
  activityType: string;
  entityType?: string;
  entityId?: string;
  details?: Record<string, any>;
  timestamp?: Date;
}

export interface SystemEventLog {
  eventType: string;
  entityType?: string;
  entityId?: string;
  userId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp?: Date;
}

export interface APIRequestLog {
  apiKeyId?: string;
  endpoint: string;
  method: string;
  origin?: string;
  ipAddress?: string;
  userAgent?: string;
  requestBody?: Record<string, any>;
  responseStatus: number;
  responseBody?: Record<string, any>;
  errorMessage?: string;
}

export interface SecurityEventLog {
  eventType: 'login_attempt' | 'login_success' | 'login_failure' | 'permission_denied' | 'rate_limit_exceeded' | 'suspicious_activity';
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  details?: Record<string, any>;
  riskLevel?: 'low' | 'medium' | 'high' | 'critical';
}

export class AuditService {
  private static instance: AuditService;
  private supabase: SupabaseClient | null = null;

  private constructor() {}

  public static getInstance(): AuditService {
    if (!AuditService.instance) {
      AuditService.instance = new AuditService();
    }
    return AuditService.instance;
  }

  /**
   * Initialize with Supabase client (server-side)
   */
  public async initialize() {
    if (!this.supabase) {
      this.supabase = await createClient();
    }
  }

  /**
   * Log user activity to user_activity_logs table
   */
  public async logUserActivity(activity: UserActivityLog): Promise<void> {
    try {
      await this.initialize();
      
      const { error } = await this.supabase!
        .from('user_activity_logs')
        .insert({
          user_id: activity.userId,
          activity_type: activity.activityType,
          entity_type: activity.entityType || null,
          entity_id: activity.entityId || null,
          details: activity.details || {},
          created_at: activity.timestamp?.toISOString() || new Date().toISOString()
        });

      if (error) {
        console.error('Failed to log user activity:', error);
        throw new Error(`Audit logging failed: ${error.message}`);
      }
    } catch (error) {
      console.error('Error in audit logging:', error);
      // Don't throw - audit logging should not break the main application
    }
  }

  /**
   * Log API request to api_request_logs table
   */
  public async logAPIRequest(request: APIRequestLog): Promise<void> {
    try {
      await this.initialize();
      
      const { error } = await this.supabase!
        .from('api_request_logs')
        .insert({
          api_key_id: request.apiKeyId || null,
          endpoint: request.endpoint,
          method: request.method,
          origin: request.origin || null,
          ip_address: request.ipAddress || null,
          user_agent: request.userAgent || null,
          request_body: request.requestBody || null,
          response_status: request.responseStatus,
          response_body: request.responseBody || null,
          error_message: request.errorMessage || null,
          created_at: new Date().toISOString()
        });

      if (error) {
        console.error('Failed to log API request:', error);
        throw new Error(`API request logging failed: ${error.message}`);
      }
    } catch (error) {
      console.error('Error in API request logging:', error);
      // Don't throw - audit logging should not break the main application
    }
  }

  /**
   * Log system event as user activity (for system-wide events)
   */
  public async logSystemEvent(event: SystemEventLog): Promise<void> {
    try {
      await this.initialize();
      
      // If no userId provided, this is a system-level event
      const logEntry = {
        user_id: event.userId || null,
        activity_type: event.eventType,
        entity_type: event.entityType || 'system',
        entity_id: event.entityId || null,
        details: {
          ...event.details,
          system_event: true,
          ip_address: event.ipAddress,
          user_agent: event.userAgent,
          timestamp: event.timestamp?.toISOString() || new Date().toISOString()
        },
        created_at: event.timestamp?.toISOString() || new Date().toISOString()
      };

      const { error } = await this.supabase!
        .from('user_activity_logs')
        .insert(logEntry);

      if (error) {
        console.error('Failed to log system event:', error);
        throw new Error(`System event logging failed: ${error.message}`);
      }
    } catch (error) {
      console.error('Error in system event logging:', error);
    }
  }

  /**
   * Log security events with risk assessment
   */
  public async logSecurityEvent(event: SecurityEventLog): Promise<void> {
    try {
      const systemEvent: SystemEventLog = {
        eventType: `security_${event.eventType}`,
        entityType: 'security',
        userId: event.userId,
        details: {
          ...event.details,
          risk_level: event.riskLevel || 'medium',
          security_event: true
        },
        ipAddress: event.ipAddress,
        userAgent: event.userAgent
      };

      await this.logSystemEvent(systemEvent);

      // For critical security events, we might want additional alerting
      if (event.riskLevel === 'critical') {
        console.warn('CRITICAL SECURITY EVENT:', {
          type: event.eventType,
          userId: event.userId,
          ip: event.ipAddress,
          details: event.details
        });
      }
    } catch (error) {
      console.error('Error in security event logging:', error);
    }
  }

  /**
   * Helper to extract request info from NextRequest
   */
  public extractRequestInfo(request: NextRequest) {
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(', ')[0] : 
               request.headers.get('x-real-ip') || 
               'unknown';
    
    return {
      ipAddress: ip,
      userAgent: request.headers.get('user-agent') || 'unknown',
      origin: request.headers.get('origin') || null,
      endpoint: new URL(request.url).pathname,
      method: request.method
    };
  }

  /**
   * Create audit trail for data changes
   */
  public async logDataChange(params: {
    userId: string;
    action: 'create' | 'update' | 'delete';
    entityType: string;
    entityId: string;
    before?: Record<string, any>;
    after?: Record<string, any>;
    changes?: Record<string, any>;
  }): Promise<void> {
    const activity: UserActivityLog = {
      userId: params.userId,
      activityType: `${params.entityType}_${params.action}`,
      entityType: params.entityType,
      entityId: params.entityId,
      details: {
        action: params.action,
        before: params.before,
        after: params.after,
        changes: params.changes,
        timestamp: new Date().toISOString()
      }
    };

    await this.logUserActivity(activity);
  }

  /**
   * Bulk audit logging for batch operations
   */
  public async logBulkActivities(activities: UserActivityLog[]): Promise<void> {
    try {
      await this.initialize();
      
      const logEntries = activities.map(activity => ({
        user_id: activity.userId,
        activity_type: activity.activityType,
        entity_type: activity.entityType || null,
        entity_id: activity.entityId || null,
        details: activity.details || {},
        created_at: activity.timestamp?.toISOString() || new Date().toISOString()
      }));

      const { error } = await this.supabase!
        .from('user_activity_logs')
        .insert(logEntries);

      if (error) {
        console.error('Failed to log bulk activities:', error);
        throw new Error(`Bulk audit logging failed: ${error.message}`);
      }
    } catch (error) {
      console.error('Error in bulk audit logging:', error);
    }
  }

  /**
   * Query audit logs with filters
   */
  public async getAuditLogs(filters: {
    userId?: string;
    activityType?: string;
    entityType?: string;
    entityId?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  } = {}) {
    try {
      await this.initialize();
      
      let query = this.supabase!
        .from('user_activity_logs')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters.userId) {
        query = query.eq('user_id', filters.userId);
      }
      
      if (filters.activityType) {
        query = query.eq('activity_type', filters.activityType);
      }
      
      if (filters.entityType) {
        query = query.eq('entity_type', filters.entityType);
      }
      
      if (filters.entityId) {
        query = query.eq('entity_id', filters.entityId);
      }
      
      if (filters.startDate) {
        query = query.gte('created_at', filters.startDate.toISOString());
      }
      
      if (filters.endDate) {
        query = query.lte('created_at', filters.endDate.toISOString());
      }

      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;
      
      if (error) {
        console.error('Failed to query audit logs:', error);
        throw new Error(`Audit query failed: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error querying audit logs:', error);
      return [];
    }
  }
}

// Convenience functions for common audit scenarios

/**
 * Quick audit logging for business operations
 */
export const auditLog = {
  // User management
  userCreated: (adminId: string, newUserId: string, details?: any) =>
    AuditService.getInstance().logUserActivity({
      userId: adminId,
      activityType: 'user_created',
      entityType: 'user',
      entityId: newUserId,
      details
    }),

  userUpdated: (adminId: string, targetUserId: string, changes?: any) =>
    AuditService.getInstance().logUserActivity({
      userId: adminId,
      activityType: 'user_updated',
      entityType: 'user', 
      entityId: targetUserId,
      details: { changes }
    }),

  userDeleted: (adminId: string, deletedUserId: string) =>
    AuditService.getInstance().logUserActivity({
      userId: adminId,
      activityType: 'user_deleted',
      entityType: 'user',
      entityId: deletedUserId
    }),

  // Ticket operations  
  ticketCreated: (userId: string, ticketId: string, details?: any) =>
    AuditService.getInstance().logUserActivity({
      userId,
      activityType: 'ticket_created',
      entityType: 'ticket',
      entityId: ticketId,
      details
    }),

  ticketStatusChanged: (userId: string, ticketId: string, fromStatus: string, toStatus: string) =>
    AuditService.getInstance().logUserActivity({
      userId,
      activityType: 'ticket_status_changed',
      entityType: 'ticket',
      entityId: ticketId,
      details: { from_status: fromStatus, to_status: toStatus }
    }),

  ticketAssigned: (assignerId: string, ticketId: string, assigneeId: string) =>
    AuditService.getInstance().logUserActivity({
      userId: assignerId,
      activityType: 'ticket_assigned',
      entityType: 'ticket',
      entityId: ticketId,
      details: { assigned_to: assigneeId }
    }),

  // Timer operations
  timerStarted: (userId: string, ticketId: string, details?: any) =>
    AuditService.getInstance().logUserActivity({
      userId,
      activityType: 'timer_started',
      entityType: 'ticket',
      entityId: ticketId,
      details
    }),

  timerStopped: (userId: string, ticketId: string, duration: number, notes?: string) =>
    AuditService.getInstance().logUserActivity({
      userId,
      activityType: 'timer_stopped',
      entityType: 'ticket',
      entityId: ticketId,
      details: { duration_minutes: duration, notes }
    }),

  timerPaused: (userId: string, ticketId: string, elapsedSeconds: number) =>
    AuditService.getInstance().logUserActivity({
      userId,
      activityType: 'timer_paused',
      entityType: 'ticket',
      entityId: ticketId,
      details: { elapsed_seconds: elapsedSeconds }
    }),

  timerResumed: (userId: string, ticketId: string, pausedDuration: number) =>
    AuditService.getInstance().logUserActivity({
      userId,
      activityType: 'timer_resumed',
      entityType: 'ticket',
      entityId: ticketId,
      details: { paused_duration_seconds: pausedDuration }
    }),

  timerCleared: (adminId: string, ticketId: string, affectedUserId: string, reason: string, elapsedSeconds?: number) =>
    AuditService.getInstance().logUserActivity({
      userId: adminId,
      activityType: 'timer_cleared',
      entityType: 'ticket',
      entityId: ticketId,
      details: { 
        affected_user: affectedUserId,
        reason,
        elapsed_seconds: elapsedSeconds,
        admin_action: true
      }
    }),

  ticketTimerAction: (userId: string, ticketId: string, details: any) =>
    AuditService.getInstance().logUserActivity({
      userId,
      activityType: `timer_${details.action}`,
      entityType: 'ticket',
      entityId: ticketId,
      details
    }),

  // Customer operations
  customerCreated: (userId: string, customerId: string, details?: any) =>
    AuditService.getInstance().logUserActivity({
      userId,
      activityType: 'customer_created',
      entityType: 'customer',
      entityId: customerId,
      details
    }),

  customerUpdated: (userId: string, customerId: string, changes?: any) =>
    AuditService.getInstance().logUserActivity({
      userId,
      activityType: 'customer_updated',
      entityType: 'customer',
      entityId: customerId,
      details: { changes }
    }),

  // Security events
  loginAttempt: (ipAddress: string, email?: string) =>
    AuditService.getInstance().logSecurityEvent({
      eventType: 'login_attempt',
      details: { email },
      ipAddress,
      riskLevel: 'low'
    }),

  loginSuccess: (userId: string, ipAddress: string) =>
    AuditService.getInstance().logSecurityEvent({
      eventType: 'login_success',
      userId,
      ipAddress,
      riskLevel: 'low'
    }),

  loginFailure: (ipAddress: string, email: string, reason: string) =>
    AuditService.getInstance().logSecurityEvent({
      eventType: 'login_failure',
      details: { email, reason },
      ipAddress,
      riskLevel: 'medium'
    }),

  permissionDenied: (userId: string, resource: string, action: string, ipAddress?: string) =>
    AuditService.getInstance().logSecurityEvent({
      eventType: 'permission_denied',
      userId,
      details: { resource, action },
      ipAddress,
      riskLevel: 'medium'
    }),

  rateLimitExceeded: (ipAddress: string, endpoint: string, limit: number) =>
    AuditService.getInstance().logSecurityEvent({
      eventType: 'rate_limit_exceeded',
      details: { endpoint, limit },
      ipAddress,
      riskLevel: 'medium'
    }),

  suspiciousActivity: (userId: string | undefined, activity: string, ipAddress: string, details?: any) =>
    AuditService.getInstance().logSecurityEvent({
      eventType: 'suspicious_activity',
      userId,
      details: { activity, ...details },
      ipAddress,
      riskLevel: 'high'
    })
};

export default AuditService;