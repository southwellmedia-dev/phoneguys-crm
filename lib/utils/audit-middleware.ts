import { NextRequest, NextResponse } from 'next/server';
import { AuditService, auditLog } from '@/lib/services/audit.service';
import { createClient } from '@/lib/supabase/server';

/**
 * Audit Middleware for API endpoints
 * Automatically logs API requests, user activities, and security events
 */

export interface AuditConfig {
  /**
   * Enable/disable audit logging
   */
  enabled?: boolean;
  
  /**
   * Log API requests (all requests/responses)
   */
  logRequests?: boolean;
  
  /**
   * Log user activities (business operations)
   */
  logActivities?: boolean;
  
  /**
   * Log security events (auth, permissions, etc.)
   */
  logSecurity?: boolean;
  
  /**
   * Include request/response bodies in logs
   */
  includeBody?: boolean;
  
  /**
   * Custom activity type for this endpoint
   */
  activityType?: string;
  
  /**
   * Entity type for user activity logs
   */
  entityType?: string;
  
  /**
   * Extract entity ID from request/response
   */
  extractEntityId?: (request: NextRequest, response?: any) => string | undefined;
  
  /**
   * Extract additional details for audit log
   */
  extractDetails?: (request: NextRequest, response?: any) => Record<string, any>;
  
  /**
   * Skip audit logging if this function returns true
   */
  skip?: (request: NextRequest) => boolean;
}

/**
 * Default audit configurations for different endpoint types
 */
export const auditConfigs = {
  // Authentication endpoints - high security logging
  auth: {
    enabled: true,
    logRequests: true,
    logActivities: true,
    logSecurity: true,
    includeBody: false, // Don't log passwords
    activityType: 'auth_operation'
  } as AuditConfig,
  
  // Public endpoints - request logging only
  public: {
    enabled: true,
    logRequests: true,
    logActivities: false,
    logSecurity: true,
    includeBody: true,
    activityType: 'public_api_request'
  } as AuditConfig,
  
  // Admin endpoints - full audit logging
  admin: {
    enabled: true,
    logRequests: true,
    logActivities: true,
    logSecurity: true,
    includeBody: true,
    activityType: 'admin_operation'
  } as AuditConfig,
  
  // Business operations - focus on user activities
  business: {
    enabled: true,
    logRequests: false,
    logActivities: true,
    logSecurity: false,
    includeBody: false
  } as AuditConfig,
  
  // Test endpoints - minimal logging
  test: {
    enabled: true,
    logRequests: true,
    logActivities: false,
    logSecurity: false,
    includeBody: false,
    skip: (request: NextRequest) => process.env.NODE_ENV === 'development'
  } as AuditConfig,
  
  // General endpoints
  general: {
    enabled: true,
    logRequests: true,
    logActivities: false,
    logSecurity: false,
    includeBody: false
  } as AuditConfig
};

/**
 * Get current user from request
 */
async function getCurrentUser(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) return null;
    
    // Get additional user info from our users table
    const { data: userData } = await supabase
      .from('users')
      .select('id, name, email, role')
      .eq('id', user.id)
      .single();
    
    return userData || { id: user.id, email: user.email };
  } catch (error) {
    console.error('Error getting current user for audit:', error);
    return null;
  }
}

/**
 * Audit middleware wrapper
 */
export function withAudit<T extends any[]>(
  handler: (request: NextRequest, ...args: T) => Promise<NextResponse>,
  config: AuditConfig = auditConfigs.general
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    // Skip if disabled or skip function returns true
    if (!config.enabled || (config.skip && config.skip(request))) {
      return handler(request, ...args);
    }

    const auditService = AuditService.getInstance();
    const requestInfo = auditService.extractRequestInfo(request);
    const startTime = Date.now();
    
    let requestBody: any = null;
    let response: NextResponse | null = null;
    let currentUser: any = null;

    try {
      // Get current user for audit context
      currentUser = await getCurrentUser(request);
      
      // Extract request body if needed and method allows it
      if (config.includeBody && ['POST', 'PUT', 'PATCH'].includes(request.method)) {
        try {
          const clonedRequest = request.clone();
          requestBody = await clonedRequest.json();
        } catch {
          // Not JSON or empty body
          requestBody = null;
        }
      }

      // Execute the actual handler with all arguments
      response = await handler(request, ...args);
      
      // Log successful request
      if (config.logRequests) {
        await auditService.logAPIRequest({
          endpoint: requestInfo.endpoint,
          method: requestInfo.method,
          origin: requestInfo.origin,
          ipAddress: requestInfo.ipAddress,
          userAgent: requestInfo.userAgent,
          requestBody: config.includeBody ? requestBody : null,
          responseStatus: response.status,
          responseBody: config.includeBody && response.status < 400 ? 
            await getResponseBody(response) : null
        });
      }

      // Log user activity for successful business operations
      if (config.logActivities && currentUser && response.status < 400 && config.activityType) {
        const entityId = config.extractEntityId ? 
          config.extractEntityId(request, await getResponseBody(response)) : 
          undefined;
          
        const details = config.extractDetails ? 
          config.extractDetails(request, await getResponseBody(response)) : 
          { endpoint: requestInfo.endpoint, method: requestInfo.method };

        await auditService.logUserActivity({
          userId: currentUser.id,
          activityType: config.activityType,
          entityType: config.entityType,
          entityId,
          details
        });
      }

      // Log security events based on response status
      if (config.logSecurity) {
        if (response.status === 401) {
          await auditLog.permissionDenied(
            currentUser?.id,
            requestInfo.endpoint,
            requestInfo.method,
            requestInfo.ipAddress
          );
        } else if (response.status === 429) {
          await auditLog.rateLimitExceeded(
            requestInfo.ipAddress,
            requestInfo.endpoint,
            0 // Could extract limit from response headers
          );
        } else if (response.status >= 500) {
          await auditService.logSystemEvent({
            eventType: 'server_error',
            entityType: 'endpoint',
            userId: currentUser?.id,
            details: {
              endpoint: requestInfo.endpoint,
              method: requestInfo.method,
              status: response.status,
              duration: Date.now() - startTime
            },
            ipAddress: requestInfo.ipAddress,
            userAgent: requestInfo.userAgent
          });
        }
      }

      return response;
      
    } catch (error) {
      // Log error requests
      if (config.logRequests) {
        await auditService.logAPIRequest({
          endpoint: requestInfo.endpoint,
          method: requestInfo.method,
          origin: requestInfo.origin,
          ipAddress: requestInfo.ipAddress,
          userAgent: requestInfo.userAgent,
          requestBody: config.includeBody ? requestBody : null,
          responseStatus: 500,
          errorMessage: error instanceof Error ? error.message : 'Unknown error'
        });
      }

      // Log security events for errors
      if (config.logSecurity) {
        await auditService.logSystemEvent({
          eventType: 'endpoint_error',
          entityType: 'endpoint',
          userId: currentUser?.id,
          details: {
            endpoint: requestInfo.endpoint,
            method: requestInfo.method,
            error: error instanceof Error ? error.message : 'Unknown error',
            duration: Date.now() - startTime
          },
          ipAddress: requestInfo.ipAddress,
          userAgent: requestInfo.userAgent
        });
      }

      // Re-throw the error
      throw error;
    }
  };
}

/**
 * Safely extract response body
 */
async function getResponseBody(response: NextResponse): Promise<any> {
  try {
    const clonedResponse = response.clone();
    const text = await clonedResponse.text();
    
    if (!text) return null;
    
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  } catch {
    return null;
  }
}

/**
 * Audit decorators for different endpoint types
 */
export const AuditedAPI = {
  /**
   * For authentication endpoints
   */
  auth: (handler: (request: NextRequest) => Promise<NextResponse>) =>
    withAudit(handler, auditConfigs.auth),

  /**
   * For public endpoints
   */
  public: (handler: (request: NextRequest) => Promise<NextResponse>) =>
    withAudit(handler, auditConfigs.public),

  /**
   * For admin endpoints
   */
  admin: (handler: (request: NextRequest) => Promise<NextResponse>) =>
    withAudit(handler, auditConfigs.admin),

  /**
   * For business operation endpoints
   */
  business: (handler: (request: NextRequest) => Promise<NextResponse>) =>
    withAudit(handler, auditConfigs.business),

  /**
   * For test endpoints
   */
  test: (handler: (request: NextRequest) => Promise<NextResponse>) =>
    withAudit(handler, auditConfigs.test),

  /**
   * For general endpoints
   */
  general: (handler: (request: NextRequest) => Promise<NextResponse>) =>
    withAudit(handler, auditConfigs.general),
};

/**
 * Combined rate limiting + audit logging
 */
export function withRateLimitAndAudit(
  handler: (request: NextRequest) => Promise<NextResponse>,
  rateLimitConfig: string = 'general',
  auditConfig: AuditConfig = auditConfigs.general
) {
  // First apply rate limiting, then audit logging
  const { withApiRateLimit, rateLimitConfigs } = require('./api-helpers');
  
  return withAudit(
    withApiRateLimit(handler, rateLimitConfig as keyof typeof rateLimitConfigs),
    auditConfig
  );
}

/**
 * Auto-apply both rate limiting and audit logging based on endpoint path
 */
export function withAutoSecurityAndAudit(handler: (request: NextRequest) => Promise<NextResponse>) {
  return async (request: NextRequest) => {
    const url = new URL(request.url);
    const pathname = url.pathname;
    
    // Determine configuration based on path
    let rateLimitConfig = 'general';
    let auditConfig = auditConfigs.general;
    
    if (pathname.includes('/api/auth/')) {
      rateLimitConfig = 'auth';
      auditConfig = auditConfigs.auth;
    } else if (pathname.includes('/api/public/')) {
      rateLimitConfig = 'public';
      auditConfig = auditConfigs.public;
    } else if (pathname.includes('/api/admin/')) {
      rateLimitConfig = 'admin';
      auditConfig = auditConfigs.admin;
    } else if (pathname.includes('/api/test/')) {
      rateLimitConfig = 'test';
      auditConfig = auditConfigs.test;
    }
    
    return withRateLimitAndAudit(handler, rateLimitConfig, auditConfig)(request);
  };
}

/**
 * Business operation audit helpers
 */
export const businessAudit = {
  /**
   * Ticket operations
   */
  ticketOperation: (operation: string) => (handler: (request: NextRequest) => Promise<NextResponse>) =>
    withAudit(handler, {
      ...auditConfigs.business,
      activityType: `ticket_${operation}`,
      entityType: 'ticket',
      extractEntityId: (request, response) => {
        // Try to extract ticket ID from URL path
        const match = request.url.match(/\/tickets\/([^\/\?]+)/);
        if (match) return match[1];
        
        // Try to extract from response
        if (response?.id) return response.id;
        if (response?.data?.id) return response.data.id;
        
        return undefined;
      },
      extractDetails: (request, response) => ({
        operation,
        endpoint: new URL(request.url).pathname,
        method: request.method,
        success: response ? true : false
      })
    }),

  /**
   * Customer operations
   */
  customerOperation: (operation: string) => (handler: (request: NextRequest) => Promise<NextResponse>) =>
    withAudit(handler, {
      ...auditConfigs.business,
      activityType: `customer_${operation}`,
      entityType: 'customer',
      extractEntityId: (request, response) => {
        const match = request.url.match(/\/customers\/([^\/\?]+)/);
        if (match) return match[1];
        
        if (response?.id) return response.id;
        if (response?.data?.id) return response.data.id;
        
        return undefined;
      },
      extractDetails: (request, response) => ({
        operation,
        endpoint: new URL(request.url).pathname,
        method: request.method
      })
    }),

  /**
   * User management operations
   */
  userOperation: (operation: string) => (handler: (request: NextRequest) => Promise<NextResponse>) =>
    withAudit(handler, {
      ...auditConfigs.admin,
      activityType: `user_${operation}`,
      entityType: 'user',
      extractEntityId: (request, response) => {
        const match = request.url.match(/\/users\/([^\/\?]+)/);
        if (match) return match[1];
        
        if (response?.id) return response.id;
        if (response?.data?.id) return response.data.id;
        
        return undefined;
      },
      extractDetails: (request, response) => ({
        operation,
        endpoint: new URL(request.url).pathname,
        method: request.method
      })
    })
};

export default withAudit;