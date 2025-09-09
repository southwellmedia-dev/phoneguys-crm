'use client';

import * as React from 'react';
import { StatCard, type StatCardProps } from '@/components/premium/ui/cards/stat-card';
import { SkeletonPremium } from '@/components/premium/ui/feedback/skeleton-premium';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRealtime } from '@/lib/hooks/use-realtime';
import { cn } from '@/lib/utils';

export type DashboardMetric = 
  | 'in_progress'
  | 'completed_today'
  | 'total_customers'
  | 'total_repairs'
  | 'on_hold';

interface MetricData {
  value: number;
  trend?: number;
  trendLabel?: string;
}

export interface StatCardLiveProps extends Omit<StatCardProps, 'value' | 'trend' | 'trendLabel'> {
  /** The metric to display */
  metric: DashboardMetric;
  /** Override the default label */
  label?: string;
  /** Show loading state */
  loading?: never; // Never show container loading
}

// Map our dashboard metrics to the API metric types
const metricMapping: Record<DashboardMetric, string> = {
  'in_progress': 'in_progress_tickets',
  'completed_today': 'completed_tickets',
  'total_customers': 'total_customers',
  'total_repairs': 'total_tickets',
  'on_hold': 'in_progress_tickets' // We'll filter this client-side
};

async function fetchDashboardMetrics(): Promise<any> {
  const response = await fetch('/api/dashboard/metrics');
  if (!response.ok) {
    throw new Error('Failed to fetch dashboard metrics');
  }
  return response.json();
}

export const StatCardLive = React.forwardRef<HTMLDivElement, StatCardLiveProps>(
  ({ metric, label, className, ...props }, ref) => {
    const [isMounted, setIsMounted] = React.useState(false);
    const [hasLoadedOnce, setHasLoadedOnce] = React.useState(false);
    const queryClient = useQueryClient();

    React.useEffect(() => {
      setIsMounted(true);
    }, []);

    // Fetch all dashboard metrics
    const { data: metricsData, isLoading, error, isSuccess } = useQuery({
      queryKey: ['dashboard-metrics'],
      queryFn: fetchDashboardMetrics,
      enabled: isMounted,
      staleTime: 60 * 1000, // 1 minute
      refetchOnWindowFocus: false,
    });

    // Extract the specific metric we need
    const apiMetricKey = metricMapping[metric];
    const metricData = metricsData?.[apiMetricKey];

    // Track when we've successfully loaded data at least once
    React.useEffect(() => {
      if (isSuccess && !hasLoadedOnce) {
        setHasLoadedOnce(true);
      }
    }, [isSuccess, hasLoadedOnce]);

    // Use shared real-time subscription
    useRealtime(['tickets', 'customers']);

    const showSkeleton = !hasLoadedOnce || isLoading;

    // Default labels based on metric
    const defaultLabels: Record<DashboardMetric, string> = {
      in_progress: 'In Progress',
      completed_today: 'Completed Today',
      total_customers: 'Total Customers',
      total_repairs: 'Total Repairs',
      on_hold: 'On Hold'
    };

    if (error && !showSkeleton) {
      return (
        <StatCard
          ref={ref}
          {...props}
          className={cn('border-red-200 dark:border-red-800', className)}
          label={label || defaultLabels[metric]}
          value="Error"
          trendLabel="Failed to load"
        />
      );
    }

    // If showing skeleton, render a skeleton version of the card
    if (showSkeleton) {
      return (
        <div
          ref={ref}
          className={cn(
            "rounded-lg border bg-background p-4",
            className
          )}
        >
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <SkeletonPremium className="h-4 w-24" />
              <div className="flex items-baseline gap-2">
                <SkeletonPremium className="h-8 w-16" />
              </div>
              <SkeletonPremium className="h-3 w-20" />
            </div>
            {props.icon && (
              <SkeletonPremium className="h-8 w-8 rounded-md" />
            )}
          </div>
        </div>
      );
    }

    // Process the data based on metric type
    let displayValue = '0';
    let trend = 0;
    let trendLabel = '';

    if (metricData) {
      // Handle special cases
      if (metric === 'on_hold') {
        // This would need a separate API call or different handling
        displayValue = '0'; // Placeholder
        trendLabel = 'Awaiting parts';
      } else if (metric === 'completed_today') {
        // Filter for today's completions if needed
        displayValue = metricData.value?.toString() || '0';
        trend = metricData.change || 0;
        trendLabel = 'Finished today';
      } else {
        // Use the metric data as-is
        displayValue = metricData.value?.toString() || '0';
        trend = metricData.change || 0;
        trendLabel = metricData.subtitle || '';
      }
    }

    return (
      <StatCard
        ref={ref}
        {...props}
        className={className}
        label={label || defaultLabels[metric]}
        value={displayValue}
        trend={trend}
        trendLabel={trendLabel}
      />
    );
  }
);

StatCardLive.displayName = 'StatCardLive';