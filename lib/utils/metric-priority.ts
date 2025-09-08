import { MetricType } from "@/components/premium/connected/connected-metric-card";

// Business rules for determining metric priority
export const MetricPriority = {
  // High priority metrics - most critical for business operations
  HIGH: [
    'revenue',           // Daily revenue is critical
    'orders',            // Total orders drive business
  ] as const,
  
  // Medium priority metrics - important but not critical
  MEDIUM: [
    'pending',           // Pending orders need attention
    'completed_today',   // Daily completions show productivity
  ] as const,
  
  // Low priority metrics - supporting information
  LOW: [
    'repair_time',       // Good to track but not urgent
    'average_value',     // Historical/analytical data
    'customer_satisfaction', // Important but not time-sensitive
  ] as const,
} as const;

// Determine priority based on metric type
export function getMetricPriority(metric: MetricType): "high" | "medium" | "low" {
  if (MetricPriority.HIGH.includes(metric as any)) return 'high';
  if (MetricPriority.MEDIUM.includes(metric as any)) return 'medium';
  if (MetricPriority.LOW.includes(metric as any)) return 'low';
  return 'medium'; // Default fallback
}

// Get recommended color based on metric type and value context
export function getMetricColor(
  metric: MetricType, 
  value: number,
  trend?: { value: number; isPositive: boolean }
): "default" | "cyan" | "red" | "green" | "amber" | "navy" | "purple" {
  // Business-specific color rules
  switch (metric) {
    case 'revenue':
    case 'completed_today':
      // Revenue and completions are typically shown in green (positive)
      return 'green';
      
    case 'orders':
    case 'average_value':
      // Orders and average value in cyan (business blue)
      return 'cyan';
      
    case 'pending':
      // Pending orders in amber (warning/attention needed)
      // Could be red if the number is unusually high
      if (value > 20) return 'red'; // Critical threshold
      if (value > 10) return 'amber'; // Warning threshold
      return 'green'; // Good levels
      
    case 'repair_time':
      // Repair time in navy (professional)
      // Could change based on if time is too high
      if (value > 240) return 'red'; // Over 4 hours
      if (value > 120) return 'amber'; // Over 2 hours
      return 'navy';
      
    case 'customer_satisfaction':
      // Satisfaction in purple, but can change based on value
      if (value < 70) return 'red'; // Poor satisfaction
      if (value < 85) return 'amber'; // Needs improvement
      return 'purple'; // Good satisfaction
      
    default:
      return 'default';
  }
}

// Format metric values according to business rules
export function formatMetricValue(metric: MetricType, value: number): string {
  switch (metric) {
    case 'revenue':
    case 'average_value':
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value);
      
    case 'repair_time':
      if (value >= 60) {
        const hours = Math.floor(value / 60);
        const minutes = value % 60;
        return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
      }
      return `${value}min`;
      
    case 'customer_satisfaction':
      return `${Math.round(value)}%`;
      
    case 'orders':
    case 'pending':
    case 'completed_today':
      return value.toLocaleString();
      
    default:
      return value.toString();
  }
}

// Get contextual descriptions for metrics
export function getMetricDescription(metric: MetricType, timeContext: 'today' | 'total' | 'current' = 'today'): string {
  switch (metric) {
    case 'revenue':
      return timeContext === 'today' ? 'Revenue today' : 'Total revenue';
    case 'orders':
      return timeContext === 'today' ? 'Orders today' : 'Total orders';
    case 'pending':
      return 'Awaiting repair';
    case 'repair_time':
      return 'Average completion time';
    case 'completed_today':
      return 'Completed today';
    case 'average_value':
      return 'Average order value';
    case 'customer_satisfaction':
      return 'Customer satisfaction rate';
    default:
      return '';
  }
}

// Determine if a trend should be highlighted as critical
export function isTrendCritical(
  metric: MetricType,
  trend: { value: number; isPositive: boolean }
): boolean {
  const absValue = Math.abs(trend.value);
  
  switch (metric) {
    case 'revenue':
      // Revenue drops of 20%+ are critical
      return !trend.isPositive && absValue >= 20;
      
    case 'pending':
      // Increase in pending orders of 50%+ is critical
      return !trend.isPositive && absValue >= 50;
      
    case 'customer_satisfaction':
      // Any drop in satisfaction of 10%+ is concerning
      return !trend.isPositive && absValue >= 10;
      
    case 'repair_time':
      // Increase in repair time of 30%+ is critical
      return !trend.isPositive && absValue >= 30;
      
    default:
      return false;
  }
}