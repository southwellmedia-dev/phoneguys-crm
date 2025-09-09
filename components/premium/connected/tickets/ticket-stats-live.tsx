'use client';

import * as React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { StatCard } from '@/components/premium/ui/cards/stat-card';
import { useRealtime } from '@/lib/hooks/use-realtime';
import { 
  Package, 
  AlertCircle, 
  Clock, 
  CheckCircle2,
  PauseCircle,
  FileText
} from 'lucide-react';

export type TicketMetric = 'total' | 'new' | 'in_progress' | 'on_hold' | 'completed' | 'today';

interface TicketStatsLiveProps {
  metric: TicketMetric;
  className?: string;
}

interface TicketStats {
  total: number;
  new: number;
  in_progress: number;
  on_hold: number;
  completed: number;
  today: number;
}

async function fetchTicketStats(): Promise<TicketStats> {
  try {
    // Use the API endpoint to get ticket statistics
    const response = await fetch('/api/tickets/stats');
    if (!response.ok) {
      throw new Error('Failed to fetch ticket stats');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching ticket stats:', error);
    return { total: 0, new: 0, in_progress: 0, on_hold: 0, completed: 0, today: 0 };
  }
}

const metricConfig = {
  total: {
    title: 'Total Tickets',
    icon: <Package />,
    variant: 'default' as const,
    description: 'All repair tickets'
  },
  new: {
    title: 'New Tickets',
    icon: <AlertCircle />,
    variant: 'accent-primary' as const,
    description: 'Awaiting assignment'
  },
  in_progress: {
    title: 'In Progress',
    icon: <Clock />,
    variant: 'accent-warning' as const,
    description: 'Currently being repaired'
  },
  on_hold: {
    title: 'On Hold',
    icon: <PauseCircle />,
    variant: 'default' as const,
    description: 'Waiting for parts'
  },
  completed: {
    title: 'Completed',
    icon: <CheckCircle2 />,
    variant: 'success' as const,
    description: 'Ready for pickup'
  },
  today: {
    title: 'Today\'s Tickets',
    icon: <FileText />,
    variant: 'primary' as const,
    description: 'Created today'
  }
};

export const TicketStatsLive: React.FC<TicketStatsLiveProps> = ({ metric, className }) => {
  const queryClient = useQueryClient();
  const [isMounted, setIsMounted] = React.useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  const { data, isLoading, isFetching, isSuccess } = useQuery({
    queryKey: ['ticket-stats'],
    queryFn: fetchTicketStats,
    enabled: isMounted,
    staleTime: 30 * 1000, // 30 seconds
    refetchOnWindowFocus: false,
  });

  // Track when we've successfully loaded data at least once
  React.useEffect(() => {
    if (isSuccess && !hasLoadedOnce) {
      setHasLoadedOnce(true);
    }
  }, [isSuccess, hasLoadedOnce]);

  // Use shared real-time subscription
  useRealtime(['tickets']);

  const config = metricConfig[metric];
  const value = data?.[metric] || 0;
  const showSkeleton = !hasLoadedOnce || isLoading || isFetching;

  // Calculate trend (could be enhanced with historical data)
  const trend = value > 0 ? 'up' : 'neutral';
  const change = metric === 'new' && value > 0 ? '+' + value : undefined;

  return (
    <StatCard
      label={config.title}
      value={showSkeleton ? '0' : value.toString()}
      trendLabel={config.description}
      icon={config.icon}
      variant={config.variant}
      trend={showSkeleton ? undefined : (metric === 'new' && value > 0 ? value : undefined)}
      loading={showSkeleton}
      className={className}
      size="sm"
    />
  );
};