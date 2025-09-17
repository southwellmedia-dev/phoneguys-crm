import { NextRequest, NextResponse } from 'next/server';
import { withRateLimit, rateLimitConfigs, type RateLimitOptions } from './rate-limit';
import { withAudit, auditConfigs, type AuditConfig } from './audit-middleware';

/**
 * Helper to wrap API routes with rate limiting
 * Usage:
 * 
 * export const GET = withApiRateLimit(async (request: NextRequest) => {
 *   // Your existing handler code
 *   return NextResponse.json({ data: 'success' });
 * }, 'public');
 */
export function withApiRateLimit(
  handler: (request: NextRequest) => Promise<NextResponse>,
  configName: keyof typeof rateLimitConfigs = 'general',
  customOptions?: RateLimitOptions
) {
  return async (request: NextRequest) => {
    const options = customOptions || rateLimitConfigs[configName];
    return withRateLimit(request, handler, options);
  };
}

/**
 * Rate limiting decorator for different endpoint types
 */
export const RateLimitedAPI = {
  /**
   * For authentication endpoints (/api/auth/*)
   */
  auth: (handler: (request: NextRequest) => Promise<NextResponse>) =>
    withApiRateLimit(handler, 'auth'),

  /**
   * For public endpoints (/api/public/*)
   */
  public: (handler: (request: NextRequest) => Promise<NextResponse>) =>
    withApiRateLimit(handler, 'public'),

  /**
   * For admin endpoints (/api/admin/*)
   */
  admin: (handler: (request: NextRequest) => Promise<NextResponse>) =>
    withApiRateLimit(handler, 'admin'),

  /**
   * For test endpoints (/api/test/*)
   */
  test: (handler: (request: NextRequest) => Promise<NextResponse>) =>
    withApiRateLimit(handler, 'test'),

  /**
   * For upload endpoints
   */
  upload: (handler: (request: NextRequest) => Promise<NextResponse>) =>
    withApiRateLimit(handler, 'upload'),

  /**
   * For search endpoints
   */
  search: (handler: (request: NextRequest) => Promise<NextResponse>) =>
    withApiRateLimit(handler, 'search'),

  /**
   * For general endpoints
   */
  general: (handler: (request: NextRequest) => Promise<NextResponse>) =>
    withApiRateLimit(handler, 'general'),
};

/**
 * Helper to determine appropriate rate limit config based on path
 */
export function getConfigForPath(pathname: string): keyof typeof rateLimitConfigs {
  if (pathname.includes('/api/auth/')) return 'auth';
  if (pathname.includes('/api/public/')) return 'public';
  if (pathname.includes('/api/admin/')) return 'admin';
  if (pathname.includes('/api/test/')) return 'test';
  if (pathname.includes('upload') || pathname.includes('media')) return 'upload';
  if (pathname.includes('search')) return 'search';
  return 'general';
}

/**
 * Auto-apply rate limiting based on endpoint path
 */
export function withAutoRateLimit(handler: (request: NextRequest) => Promise<NextResponse>) {
  return async (request: NextRequest) => {
    const url = new URL(request.url);
    const configName = getConfigForPath(url.pathname);
    return withApiRateLimit(handler, configName)(request);
  };
}

/**
 * Helper for error responses with consistent format
 */
export function createErrorResponse(message: string, status: number = 400, details?: any) {
  return NextResponse.json(
    {
      error: message,
      status,
      timestamp: new Date().toISOString(),
      ...(details && { details })
    },
    { status }
  );
}

/**
 * Helper for success responses with consistent format
 */
export function createSuccessResponse(data: any, message?: string, status: number = 200) {
  return NextResponse.json(
    {
      success: true,
      data,
      ...(message && { message }),
      timestamp: new Date().toISOString()
    },
    { status }
  );
}

/**
 * Combined rate limiting and audit logging
 */
export function withSecurityAndAudit(
  handler: (request: NextRequest) => Promise<NextResponse>,
  rateLimitConfig: keyof typeof rateLimitConfigs = 'general',
  auditConfig: AuditConfig = auditConfigs.general
) {
  // Apply rate limiting first, then audit logging
  return withAudit(
    withApiRateLimit(handler, rateLimitConfig),
    auditConfig
  );
}

/**
 * Enhanced rate limiting decorators with audit logging
 */
export const SecureAPI = {
  /**
   * For authentication endpoints - strict rate limiting + full audit
   */
  auth: (handler: (request: NextRequest) => Promise<NextResponse>) =>
    withSecurityAndAudit(handler, 'auth', auditConfigs.auth),

  /**
   * For public endpoints - moderate rate limiting + request audit
   */
  public: (handler: (request: NextRequest) => Promise<NextResponse>) =>
    withSecurityAndAudit(handler, 'public', auditConfigs.public),

  /**
   * For admin endpoints - strict rate limiting + full audit
   */
  admin: (handler: (request: NextRequest) => Promise<NextResponse>) =>
    withSecurityAndAudit(handler, 'admin', auditConfigs.admin),

  /**
   * For test endpoints - very strict + minimal audit (dev-only)
   */
  test: (handler: (request: NextRequest) => Promise<NextResponse>) =>
    withSecurityAndAudit(handler, 'test', auditConfigs.test),

  /**
   * For general endpoints - moderate rate limiting + basic audit
   */
  general: (handler: (request: NextRequest) => Promise<NextResponse>) =>
    withSecurityAndAudit(handler, 'general', auditConfigs.general),
};