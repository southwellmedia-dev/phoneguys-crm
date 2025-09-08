/**
 * Connected Component Helpers
 * 
 * Utility functions specifically for connected premium components
 * that integrate with the CRM data layer.
 */

import { type MetricType } from '@/lib/hooks/connected/use-metric-data';
import { type ActivityItem } from '@/lib/hooks/connected/use-activity-feed';

/**
 * Maps database status values to consistent display statuses
 */
export function mapResourceStatus(
  resourceType: 'ticket' | 'appointment' | 'customer',
  dbStatus: string
): string {
  const statusMaps = {
    ticket: {
      'new': 'new',
      'in_progress': 'inProgress', 
      'on_hold': 'onHold',
      'completed': 'completed',
      'cancelled': 'cancelled',
      'pending': 'pending'
    },
    appointment: {
      'scheduled': 'scheduled',
      'confirmed': 'confirmed', 
      'arrived': 'arrived',
      'no_show': 'no_show',
      'converted': 'converted',
      'cancelled': 'cancelled',
      'pending': 'pending'
    },
    customer: {
      'active': 'active',
      'inactive': 'inactive'
    }
  };

  return statusMaps[resourceType]?.[dbStatus] || 'inactive';
}

/**
 * Generates metric titles from metric types
 */
export function getMetricTitle(metric: MetricType): string {
  const titles: Record<MetricType, string> = {
    total_tickets: 'Total Tickets',
    new_tickets: 'New Tickets',
    completed_tickets: 'Completed',
    in_progress_tickets: 'In Progress', 
    total_customers: 'Total Customers',
    total_appointments: 'Appointments',
    pending_appointments: 'Pending',
    revenue_today: "Today's Revenue",
    revenue_month: 'Monthly Revenue'
  };

  return titles[metric] || metric.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

/**
 * Formats metric values for display
 */
export function formatMetricValue(value: any, metric: MetricType): string {
  if (value === null || value === undefined) return '0';

  // Revenue metrics need currency formatting
  if (metric.includes('revenue')) {
    const num = typeof value === 'string' ? parseFloat(value.replace(/[^0-9.-]/g, '')) : value;
    if (isNaN(num)) return '$0';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  }

  // Count metrics should be integers
  if (typeof value === 'number') {
    return new Intl.NumberFormat('en-US').format(Math.floor(value));
  }

  return String(value);
}

/**
 * Calculates trend from current and previous values
 */
export function calculateTrend(
  current: number, 
  previous: number
): { change: number; trend: 'up' | 'down' | 'neutral' } {
  if (previous === 0) {
    return {
      change: current > 0 ? 100 : 0,
      trend: current > 0 ? 'up' : 'neutral'
    };
  }

  const change = ((current - previous) / previous) * 100;
  const trend = change > 0 ? 'up' : change < 0 ? 'down' : 'neutral';

  return {
    change: Math.abs(change),
    trend
  };
}

/**
 * Generates sparkline data from time series
 */
export function generateSparkline(
  data: Array<{ date: string; value: number }>,
  maxPoints: number = 12
): number[] {
  if (!data || data.length === 0) return [];

  // Sort by date
  const sortedData = [...data].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Sample data if we have too many points
  if (sortedData.length > maxPoints) {
    const step = Math.ceil(sortedData.length / maxPoints);
    const sampledData = sortedData.filter((_, index) => index % step === 0);
    return sampledData.map(d => d.value);
  }

  return sortedData.map(d => d.value);
}

/**
 * Creates activity items from database records
 */
export function createActivityItem(
  record: any,
  type: 'ticket' | 'appointment' | 'customer'
): ActivityItem {
  const baseItem: ActivityItem = {
    id: record.id,
    type,
    action: 'updated', // Default action
    title: '',
    timestamp: record.updated_at || record.created_at || new Date().toISOString(),
    metadata: {}
  };

  switch (type) {
    case 'ticket':
      return {
        ...baseItem,
        title: `Ticket #${record.ticket_number || record.id?.slice(-6)}`,
        action: record.status === 'completed' ? 'completed' : 
                record.status === 'new' ? 'created' : 'updated',
        description: record.device_model ? `${record.device_model} repair` : 'Device repair',
        metadata: {
          customer_name: record.customers?.full_name || record.customer_name,
          ticket_number: record.ticket_number,
          status: record.status,
          device: record.device_model
        }
      };

    case 'appointment':
      return {
        ...baseItem,
        title: `Appointment with ${record.customer_name}`,
        action: record.status === 'cancelled' ? 'cancelled' : 
                record.status === 'completed' ? 'completed' : 'updated',
        description: new Date(record.appointment_date).toLocaleDateString(),
        metadata: {
          customer_name: record.customer_name,
          appointment_date: record.appointment_date,
          status: record.status,
          services: record.services
        }
      };

    case 'customer':
      return {
        ...baseItem,
        title: `Customer ${record.full_name || record.name}`,
        action: 'created',
        description: record.phone ? `Phone: ${record.phone}` : 'New customer',
        metadata: {
          customer_name: record.full_name || record.name,
          phone: record.phone,
          email: record.email
        }
      };

    default:
      return baseItem;
  }
}

/**
 * Debounces function calls for search and filtering
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Creates optimistic update payload for React Query
 */
export function createOptimisticUpdate<T>(
  oldData: T[] | undefined,
  newItem: Partial<T> & { id: string },
  operation: 'create' | 'update' | 'delete'
): T[] {
  if (!oldData) return [];

  switch (operation) {
    case 'create':
      return [newItem as T, ...oldData];
    
    case 'update':
      return oldData.map(item => 
        (item as any).id === newItem.id 
          ? { ...item, ...newItem } as T
          : item
      );
    
    case 'delete':
      return oldData.filter(item => (item as any).id !== newItem.id);
    
    default:
      return oldData;
  }
}

/**
 * Validates and sanitizes filter parameters
 */
export function sanitizeFilters(
  filters: Record<string, any>
): Record<string, string | number | boolean> {
  const sanitized: Record<string, string | number | boolean> = {};

  for (const [key, value] of Object.entries(filters)) {
    if (value === null || value === undefined || value === '') {
      continue;
    }

    // Handle different types
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      sanitized[key] = value;
    } else if (typeof value === 'object') {
      // Handle date ranges and other objects
      if (value.start && value.end) {
        sanitized[`${key}_start`] = value.start;
        sanitized[`${key}_end`] = value.end;
      }
    }
  }

  return sanitized;
}