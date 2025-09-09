/**
 * MetricCardLive - Data-aware metric card component
 * 
 * @description Connected version of MetricCard that fetches real-time data
 * @category Connected/Dashboard
 * 
 * @example
 * ```tsx
 * <MetricCardLive
 *   metric="total_tickets"
 *   variant="primary" 
 *   size="lg"
 *   icon={Package}
 * />
 * ```
 */

'use client';

import * as React from 'react';
import { MetricCard, type MetricCardProps } from '@/components/premium/ui/cards/metric-card';
import { SkeletonPremium } from '@/components/premium/ui/feedback/skeleton-premium';
import { useMetricData, type MetricType, type MetricFilters } from '@/lib/hooks/connected/use-metric-data';
import { cn } from '@/lib/utils';

export interface MetricCardLiveProps extends Omit<MetricCardProps, 'title' | 'value' | 'change' | 'trend' | 'sparklineData' | 'loading'> {
  /** The type of metric to display */
  metric: MetricType;
  /** Title override - if not provided, will be generated from metric type */
  title?: string;
  /** Filters to apply to the metric query */
  filters?: MetricFilters;
  /** Custom subtitle when loading or no data */
  fallbackSubtitle?: string;
  /** Show sparkline chart if data is available */
  showSparkline?: boolean;
  /** Custom loading skeleton height */
  skeletonHeight?: number;
}

// Default titles for metric types
const METRIC_TITLES: Record<MetricType, string> = {
  total_tickets: 'Total Tickets',
  new_tickets: 'New Tickets', 
  completed_tickets: 'Completed',
  in_progress_tickets: 'In Progress',
  total_customers: 'Total Customers',
  active_customers: 'Active Customers',
  total_repairs: 'Total Repairs',
  new_customers_month: 'New This Month',
  total_appointments: 'Appointments',
  pending_appointments: 'Pending',
  revenue_today: "Today's Revenue",
  revenue_month: 'Monthly Revenue'
};

export const MetricCardLive = React.forwardRef<HTMLDivElement, MetricCardLiveProps>(
  ({ 
    metric,
    title,
    filters,
    fallbackSubtitle,
    showSparkline = true,
    skeletonHeight = 32,
    className,
    ...props 
  }, ref) => {
    const { 
      data, 
      error, 
      showSkeleton,
      isInitialLoad 
    } = useMetricData(metric, filters);

    // Get the display title
    const displayTitle = title || METRIC_TITLES[metric] || metric.replace(/_/g, ' ');

    // Handle error state
    if (error && !isInitialLoad) {
      return (
        <MetricCard
          ref={ref}
          {...props}
          className={cn('border-red-200 dark:border-red-800', className)}
          title={displayTitle}
          value="Error"
          subtitle="Failed to load data"
          trend="neutral"
        />
      );
    }

    // Render with loading state or data
    return (
      <MetricCard
        ref={ref}
        {...props}
        className={className}
        title={displayTitle}
        value={data?.value || '0'}
        change={data?.change}
        trend={data?.trend || 'neutral'}
        subtitle={data?.subtitle}
        sparklineData={
          showSparkline && data?.sparkline?.length 
            ? data.sparkline 
            : undefined
        }
        loading={showSkeleton} // Use built-in loading state
      />
    );
  }
);

MetricCardLive.displayName = 'MetricCardLive';

// Convenience components for common metrics
export const TotalTicketsCard = (props: Omit<MetricCardLiveProps, 'metric'>) => (
  <MetricCardLive metric="total_tickets" {...props} />
);

export const NewTicketsCard = (props: Omit<MetricCardLiveProps, 'metric'>) => (
  <MetricCardLive metric="new_tickets" {...props} />
);

export const CompletedTicketsCard = (props: Omit<MetricCardLiveProps, 'metric'>) => (
  <MetricCardLive metric="completed_tickets" {...props} />
);

export const TotalCustomersCard = (props: Omit<MetricCardLiveProps, 'metric'>) => (
  <MetricCardLive metric="total_customers" {...props} />
);

export const RevenueCard = ({ period = 'today', ...props }: Omit<MetricCardLiveProps, 'metric'> & { period?: 'today' | 'month' }) => (
  <MetricCardLive 
    metric={period === 'today' ? 'revenue_today' : 'revenue_month'} 
    {...props} 
  />
);