import { NextRequest, NextResponse } from 'next/server';

// In-memory store for rate limiting (consider Redis for production)
const store = new Map<string, { count: number; resetTime: number }>();

interface RateLimitOptions {
  /**
   * Maximum number of requests per window
   * @default 100
   */
  limit?: number;
  
  /**
   * Time window in milliseconds
   * @default 60000 (1 minute)
   */
  windowMs?: number;
  
  /**
   * Message to return when rate limit is exceeded
   */
  message?: string;
  
  /**
   * Headers to include in response
   */
  headers?: boolean;
  
  /**
   * Custom key generator function
   * @param request - The incoming request
   * @returns string key to use for rate limiting
   */
  keyGenerator?: (request: NextRequest) => string;
  
  /**
   * Skip rate limiting if this function returns true
   * @param request - The incoming request
   * @returns boolean indicating whether to skip rate limiting
   */
  skip?: (request: NextRequest) => boolean;
}

interface RateLimitResult {
  success: boolean;
  limit: number;
  current: number;
  remaining: number;
  resetTime: number;
}

/**
 * Default key generator - uses IP address and User-Agent
 */
const defaultKeyGenerator = (request: NextRequest): string => {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(/, /)[0] : 
             request.headers.get('x-real-ip') || 
             'anonymous';
  const userAgent = request.headers.get('user-agent') || 'unknown';
  const pathname = new URL(request.url).pathname;
  
  // Include pathname for endpoint-specific limiting
  return `${ip}:${userAgent}:${pathname}`;
};

/**
 * Clean up expired entries from the store
 */
const cleanupExpiredEntries = () => {
  const now = Date.now();
  for (const [key, data] of store.entries()) {
    if (now > data.resetTime) {
      store.delete(key);
    }
  }
};

/**
 * Rate limiting function
 * @param request - The incoming NextRequest
 * @param options - Rate limiting configuration
 * @returns Promise<RateLimitResult>
 */
export async function rateLimit(
  request: NextRequest,
  options: RateLimitOptions = {}
): Promise<RateLimitResult> {
  const {
    limit = 100,
    windowMs = 60 * 1000, // 1 minute
    keyGenerator = defaultKeyGenerator,
    skip
  } = options;

  // Skip rate limiting if skip function returns true
  if (skip && skip(request)) {
    return {
      success: true,
      limit,
      current: 0,
      remaining: limit,
      resetTime: Date.now() + windowMs
    };
  }

  // Clean up expired entries periodically
  if (Math.random() < 0.1) { // 10% chance to cleanup
    cleanupExpiredEntries();
  }

  const key = keyGenerator(request);
  const now = Date.now();
  
  let data = store.get(key);
  
  if (!data || now > data.resetTime) {
    // First request or window expired - reset
    data = {
      count: 0,
      resetTime: now + windowMs
    };
  }

  data.count++;
  store.set(key, data);

  const success = data.count <= limit;
  
  return {
    success,
    limit,
    current: data.count,
    remaining: Math.max(0, limit - data.count),
    resetTime: data.resetTime
  };
}

/**
 * Middleware wrapper for rate limiting
 * @param options - Rate limiting configuration
 * @returns Function that can be used as middleware
 */
export function createRateLimitMiddleware(options: RateLimitOptions = {}) {
  const {
    message = 'Too many requests. Please try again later.',
    headers = true
  } = options;

  return async (request: NextRequest) => {
    const result = await rateLimit(request, options);
    
    if (!result.success) {
      const response = NextResponse.json(
        { 
          error: message,
          limit: result.limit,
          current: result.current,
          resetTime: new Date(result.resetTime).toISOString()
        },
        { status: 429 }
      );

      if (headers) {
        response.headers.set('X-RateLimit-Limit', result.limit.toString());
        response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
        response.headers.set('X-RateLimit-Reset', result.resetTime.toString());
        response.headers.set('Retry-After', Math.ceil((result.resetTime - Date.now()) / 1000).toString());
      }

      return response;
    }

    return null; // Continue processing
  };
}

/**
 * Predefined rate limiting configurations
 */
export const rateLimitConfigs = {
  // Very strict for authentication endpoints
  auth: {
    limit: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
    message: 'Too many authentication attempts. Please try again in 15 minutes.'
  },
  
  // Moderate for public endpoints
  public: {
    limit: 50,
    windowMs: 60 * 1000, // 1 minute
    message: 'API rate limit exceeded. Please try again in a minute.'
  },
  
  // Strict for admin endpoints
  admin: {
    limit: 20,
    windowMs: 60 * 1000, // 1 minute
    message: 'Admin API rate limit exceeded. Please try again in a minute.'
  },
  
  // Very strict for test endpoints (production safety)
  test: {
    limit: 2,
    windowMs: 60 * 1000, // 1 minute
    message: 'Test endpoints are rate limited for security.',
    skip: (request: NextRequest) => {
      // Skip in development environment
      return process.env.NODE_ENV === 'development';
    }
  },
  
  // General purpose
  general: {
    limit: 100,
    windowMs: 60 * 1000, // 1 minute
    message: 'Rate limit exceeded. Please try again later.'
  },

  // For file uploads
  upload: {
    limit: 10,
    windowMs: 60 * 1000, // 1 minute
    message: 'Upload rate limit exceeded. Please try again in a minute.'
  },

  // For search and heavy queries
  search: {
    limit: 30,
    windowMs: 60 * 1000, // 1 minute
    message: 'Search rate limit exceeded. Please try again in a minute.'
  }
};

/**
 * Helper function to apply rate limiting to any API route
 * @param request - The incoming NextRequest
 * @param handler - The actual API route handler
 * @param options - Rate limiting options
 * @returns Promise<NextResponse>
 */
export async function withRateLimit(
  request: NextRequest,
  handler: (request: NextRequest) => Promise<NextResponse>,
  options: RateLimitOptions = {}
) {
  const rateLimitMiddleware = createRateLimitMiddleware(options);
  const rateLimitResult = await rateLimitMiddleware(request);
  
  if (rateLimitResult) {
    return rateLimitResult; // Rate limit exceeded
  }
  
  return handler(request); // Continue with normal processing
}