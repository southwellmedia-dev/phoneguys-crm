'use client';

import * as React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { MetricCard } from '@/components/premium/ui/cards/metric-card';
import { SkeletonPremium } from '@/components/premium/ui/feedback/skeleton-premium';
import { Calendar, Clock, CheckCircle2, ArrowRight } from 'lucide-react';
import { isToday } from 'date-fns';

export type AppointmentMetric = 'today' | 'pending' | 'confirmed' | 'converted';

interface MetricData {
  value: number;
  subtitle?: string;
  trend?: number;
  trendType?: 'up' | 'down' | 'neutral';
}

export interface AppointmentStatsLiveProps {
  /** Which metric to display */
  metric: AppointmentMetric;
  /** Custom className */
  className?: string;
  /** Card variant */
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'ghost';
}

async function fetchAppointmentMetric(metric: AppointmentMetric): Promise<MetricData> {
  const supabase = createClient();
  const today = new Date().toISOString().split('T')[0];

  switch (metric) {
    case 'today': {
      const { count } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('scheduled_date', today)
        .neq('status', 'converted')
        .neq('status', 'cancelled');

      return {
        value: count || 0,
        subtitle: 'Scheduled for today'
      };
    }

    case 'pending': {
      const { count } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'scheduled');

      return {
        value: count || 0,
        subtitle: 'Awaiting confirmation'
      };
    }

    case 'confirmed': {
      const { count } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'confirmed');

      return {
        value: count || 0,
        subtitle: 'Ready for service'
      };
    }

    case 'converted': {
      const { count } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'converted');

      // Get this week's conversions for trend
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { count: weekCount } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'converted')
        .gte('updated_at', weekAgo);

      return {
        value: count || 0,
        subtitle: 'Converted to tickets',
        trend: weekCount || 0,
        trendType: 'up'
      };
    }

    default:
      return { value: 0 };
  }
}

const metricConfig: Record<AppointmentMetric, {
  title: string;
  icon: React.ReactNode;
  variant: AppointmentStatsLiveProps['variant'];
  gradientClass?: string;
}> = {
  today: {
    title: "Today's Appointments",
    icon: <Calendar className="h-4 w-4" />,
    variant: 'primary',
    gradientClass: 'from-primary/5'
  },
  pending: {
    title: 'Pending',
    icon: <Clock className="h-4 w-4" />,
    variant: 'warning',
    gradientClass: 'from-yellow-500/5'
  },
  confirmed: {
    title: 'Confirmed',
    icon: <CheckCircle2 className="h-4 w-4" />,
    variant: 'success',
    gradientClass: 'from-green-500/5'
  },
  converted: {
    title: 'Converted',
    icon: <ArrowRight className="h-4 w-4" />,
    variant: 'default',
    gradientClass: 'from-purple-500/5'
  }
};

export const AppointmentStatsLive: React.FC<AppointmentStatsLiveProps> = ({
  metric,
  className,
  variant
}) => {
  const [isMounted, setIsMounted] = React.useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = React.useState(false);
  const queryClient = useQueryClient();

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  const { data, isLoading, isSuccess, error } = useQuery({
    queryKey: ['appointment-stat', metric],
    queryFn: () => fetchAppointmentMetric(metric),
    enabled: isMounted,
    staleTime: 30 * 1000, // 30 seconds
    refetchOnWindowFocus: false,
    placeholderData: { value: 0 }
  });

  // Track when we've successfully loaded data at least once
  React.useEffect(() => {
    if (isSuccess && !hasLoadedOnce) {
      setHasLoadedOnce(true);
    }
  }, [isSuccess, hasLoadedOnce]);

  // Set up real-time subscription
  React.useEffect(() => {
    if (!isMounted) return;

    const supabase = createClient();
    const channel = supabase.channel(`appointment-stat-${metric}`);

    channel
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'appointments'
      }, async () => {
        // Refetch the metric data when changes occur
        const newData = await fetchAppointmentMetric(metric);
        queryClient.setQueryData(['appointment-stat', metric], newData);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isMounted, metric, queryClient]);

  const showSkeleton = !hasLoadedOnce || isLoading;
  const config = metricConfig[metric];

  if (error && !showSkeleton) {
    return (
      <MetricCard
        title={config.title}
        value="Error"
        subtitle="Failed to load"
        icon={config.icon}
        variant="error"
        className={className}
      />
    );
  }

  return (
    <div className={`relative overflow-hidden group hover:-translate-y-0.5 transition-transform ${className}`}>
      <div className={`absolute inset-0 bg-gradient-to-br ${config.gradientClass} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
      <MetricCard
        title={config.title}
        value={showSkeleton ? (
          <SkeletonPremium className="h-8 w-16" />
        ) : (
          data?.value.toString() || '0'
        )}
        subtitle={showSkeleton ? (
          <SkeletonPremium className="h-3 w-24" />
        ) : (
          data?.subtitle
        )}
        trend={!showSkeleton && data?.trend ? data.trend : undefined}
        trendType={!showSkeleton && data?.trendType ? data.trendType : undefined}
        icon={config.icon}
        variant={variant || config.variant}
        showSparkline={false}
      />
    </div>
  );
};