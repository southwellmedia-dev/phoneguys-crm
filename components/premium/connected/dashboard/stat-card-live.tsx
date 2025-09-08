'use client';

import * as React from 'react';
import { StatCard, type StatCardProps } from '@/components/premium/ui/cards/stat-card';
import { SkeletonPremium } from '@/components/premium/ui/feedback/skeleton-premium';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
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

async function fetchMetric(metric: DashboardMetric): Promise<MetricData> {
  const supabase = createClient();
  const today = new Date().toISOString().split('T')[0];

  switch (metric) {
    case 'in_progress': {
      const { count } = await supabase
        .from('repair_tickets')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'in_progress');
      
      // Get trend (vs yesterday)
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const { count: yesterdayCount } = await supabase
        .from('repair_tickets')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'in_progress')
        .gte('created_at', yesterday)
        .lt('created_at', today);
      
      const trend = yesterdayCount ? ((count! - yesterdayCount) / yesterdayCount) * 100 : 0;
      
      return {
        value: count || 0,
        trend: Math.round(trend),
        trendLabel: 'Being repaired'
      };
    }

    case 'completed_today': {
      const { count } = await supabase
        .from('repair_tickets')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed')
        .gte('updated_at', today);
      
      // Get trend (vs same day last week)
      const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const { count: lastWeekCount } = await supabase
        .from('repair_tickets')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed')
        .gte('updated_at', lastWeek)
        .lt('updated_at', new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
      
      const trend = lastWeekCount ? ((count! - lastWeekCount) / lastWeekCount) * 100 : 0;
      
      return {
        value: count || 0,
        trend: Math.round(trend),
        trendLabel: 'Finished'
      };
    }

    case 'total_customers': {
      const { count } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true });
      
      // Get new this week
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { count: newThisWeek } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', weekAgo);
      
      return {
        value: count || 0,
        trend: newThisWeek || 0,
        trendLabel: 'new this week'
      };
    }

    case 'total_repairs': {
      const { count } = await supabase
        .from('repair_tickets')
        .select('*', { count: 'exact', head: true });
      
      // Get trend vs last month
      const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const { count: lastMonthCount } = await supabase
        .from('repair_tickets')
        .select('*', { count: 'exact', head: true })
        .lt('created_at', monthAgo);
      
      const thisMonthCount = (count || 0) - (lastMonthCount || 0);
      const avgPerMonth = lastMonthCount ? lastMonthCount / 12 : 0;
      const trend = avgPerMonth ? ((thisMonthCount - avgPerMonth) / avgPerMonth) * 100 : 0;
      
      return {
        value: count || 0,
        trend: Math.round(trend),
        trendLabel: 'vs last month'
      };
    }

    case 'on_hold': {
      const { count } = await supabase
        .from('repair_tickets')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'waiting_for_parts');
      
      return {
        value: count || 0,
        trendLabel: 'Awaiting parts'
      };
    }

    default:
      return { value: 0 };
  }
}

export const StatCardLive = React.forwardRef<HTMLDivElement, StatCardLiveProps>(
  ({ metric, label, className, ...props }, ref) => {
    const [isMounted, setIsMounted] = React.useState(false);
    const [hasLoadedOnce, setHasLoadedOnce] = React.useState(false);
    const queryClient = useQueryClient();

    React.useEffect(() => {
      setIsMounted(true);
    }, []);

    const { data, isLoading, error, isSuccess } = useQuery({
      queryKey: ['dashboard-stat', metric],
      queryFn: () => fetchMetric(metric),
      enabled: isMounted,
      staleTime: 60 * 1000, // 1 minute
      refetchOnWindowFocus: false,
      placeholderData: { value: 0 }
    });

    // Track when we've successfully loaded data at least once
    React.useEffect(() => {
      if (isSuccess && !hasLoadedOnce) {
        setHasLoadedOnce(true);
      }
    }, [isSuccess, hasLoadedOnce]);

    // Use shared real-time subscription instead of creating individual ones
    // The RealtimeService handles this centrally
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

    return (
      <StatCard
        ref={ref}
        {...props}
        className={className}
        label={label || defaultLabels[metric]}
        value={data?.value.toLocaleString() || '0'}
        trend={data?.trend}
        trendLabel={data?.trendLabel}
      />
    );
  }
);

StatCardLive.displayName = 'StatCardLive';