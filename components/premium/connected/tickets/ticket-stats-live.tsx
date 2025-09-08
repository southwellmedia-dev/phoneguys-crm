'use client';

import * as React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { StatCard } from '@/components/premium/ui/cards/stat-card';
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
  const supabase = createClient();
  
  // Get all tickets with their statuses
  const { data: tickets, error } = await supabase
    .from('repair_tickets')
    .select('id, status, created_at');

  if (error) {
    console.error('Error fetching ticket stats:', error);
    return { total: 0, new: 0, in_progress: 0, on_hold: 0, completed: 0, today: 0 };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const stats = {
    total: tickets?.length || 0,
    new: tickets?.filter(t => t.status === 'NEW').length || 0,
    in_progress: tickets?.filter(t => t.status === 'IN_PROGRESS').length || 0,
    on_hold: tickets?.filter(t => t.status === 'ON_HOLD').length || 0,
    completed: tickets?.filter(t => t.status === 'COMPLETED').length || 0,
    today: tickets?.filter(t => new Date(t.created_at) >= today).length || 0,
  };

  return stats;
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
    variant: 'accent-secondary' as const,
    description: 'Currently being repaired'
  },
  on_hold: {
    title: 'On Hold',
    icon: <PauseCircle />,
    variant: 'warning' as const,
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
    refetchInterval: 60 * 1000, // 1 minute
    refetchOnWindowFocus: false,
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
    const channel = supabase.channel(`ticket-stats-${metric}`);

    channel
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'repair_tickets'
      }, async () => {
        // Refetch stats when tickets change
        const newStats = await fetchTicketStats();
        queryClient.setQueryData(['ticket-stats'], newStats);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isMounted, metric, queryClient]);

  const config = metricConfig[metric];
  const value = data?.[metric] || 0;
  const showSkeleton = !hasLoadedOnce || isLoading || isFetching;

  // Calculate trend (could be enhanced with historical data)
  const trend = value > 0 ? 'up' : 'neutral';
  const change = metric === 'new' && value > 0 ? '+' + value : undefined;

  return (
    <StatCard
      title={config.title}
      value={showSkeleton ? undefined : value.toString()}
      description={config.description}
      icon={config.icon}
      variant={config.variant}
      trend={showSkeleton ? undefined : trend}
      change={showSkeleton ? undefined : change}
      loading={showSkeleton}
      className={className}
      size="sm"
    />
  );
};