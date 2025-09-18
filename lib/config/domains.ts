/**
 * Domain configuration for different environments and services
 */

export const DOMAINS = {
  // Main CRM dashboard domain
  dashboard: process.env.NEXT_PUBLIC_DASHBOARD_URL || 'https://dashboard.phoneguysrepair.com',
  
  // Public status checking domain (for customers)
  status: process.env.NEXT_PUBLIC_STATUS_URL || 'https://status.phoneguysrepair.com',
  
  // Main marketing website
  website: process.env.NEXT_PUBLIC_WEBSITE_URL || 'https://phoneguysrepair.com',
  
  // API domain (if separate)
  api: process.env.NEXT_PUBLIC_API_URL || 'https://api.phoneguysrepair.com',
} as const;

/**
 * Get the appropriate domain based on the current request
 */
export function getCurrentDomain(headers?: Headers): string {
  if (typeof window !== 'undefined') {
    // Client-side
    return window.location.origin;
  }
  
  // Server-side
  if (headers) {
    const host = headers.get('host');
    const protocol = headers.get('x-forwarded-proto') || 'https';
    if (host) {
      return `${protocol}://${host}`;
    }
  }
  
  // Fallback to dashboard domain
  return DOMAINS.dashboard;
}

/**
 * Check if the current request is from the status domain
 */
export function isStatusDomain(headers?: Headers): boolean {
  const currentDomain = getCurrentDomain(headers);
  return currentDomain.includes('status.') || currentDomain.includes('track.');
}

/**
 * Get the status page URL with optional path
 */
export function getStatusUrl(path?: string): string {
  const baseUrl = DOMAINS.status;
  if (!path) return baseUrl;
  return `${baseUrl}${path.startsWith('/') ? path : '/' + path}`;
}

/**
 * Get shortened status URL for SMS (if URL shortener is configured)
 */
export function getShortStatusUrl(): string {
  // If you set up a URL shortener, configure it here
  const shortDomain = process.env.NEXT_PUBLIC_SHORT_DOMAIN;
  if (shortDomain) {
    return shortDomain + '/status';
  }
  
  // Otherwise return the regular status URL
  return DOMAINS.status + '/status';
}