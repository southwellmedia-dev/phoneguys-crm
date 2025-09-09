'use client';

import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';

export type MetricType = 
  | 'total_tickets' 
  | 'new_tickets' 
  | 'completed_tickets' 
  | 'in_progress_tickets'
  | 'total_customers'
  | 'active_customers'
  | 'total_repairs'
  | 'new_customers_month'
  | 'total_appointments'
  | 'pending_appointments'
  | 'revenue_today'
  | 'revenue_month';

export interface MetricFilters {
  dateRange?: {
    start: string;
    end: string;
  };
  status?: string;
  assignedTo?: string;
}

export interface MetricData {
  value: string | number;
  change?: number;
  trend?: 'up' | 'down' | 'neutral';
  sparkline?: number[];
  subtitle?: string;
  previousValue?: string | number;
}

/**
 * Hook for fetching real-time metric data with smart hydration
 * 
 * Features:
 * - SSR-friendly with progressive hydration
 * - Cache-first approach with 5-minute stale time
 * - Real-time updates via setQueryData
 * - Automatic trend calculation
 */
export function useMetricData(
  metric: MetricType, 
  filters?: MetricFilters
) {
  const [isMounted, setIsMounted] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const query = useQuery({
    queryKey: ['metric', metric, filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('metric', metric);
      
      if (filters?.dateRange) {
        params.append('start_date', filters.dateRange.start);
        params.append('end_date', filters.dateRange.end);
      }
      if (filters?.status) {
        params.append('status', filters.status);
      }
      if (filters?.assignedTo) {
        params.append('assigned_to', filters.assignedTo);
      }

      const response = await fetch(`/api/metrics?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch metric data');
      }
      
      const data = await response.json();
      return data as MetricData;
    },
    enabled: isMounted, // Only fetch after client-side mount
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    // Provide fallback data structure for immediate rendering
    placeholderData: {
      value: 0,
      change: 0,
      trend: 'neutral' as const,
      sparkline: [],
    }
  });

  // Track when we've successfully loaded data at least once
  useEffect(() => {
    if (query.isSuccess && !hasLoadedOnce) {
      setHasLoadedOnce(true);
    }
  }, [query.isSuccess, hasLoadedOnce]);

  // Show skeleton until we have a definitive answer about the data
  const showSkeleton = !hasLoadedOnce || query.isLoading || query.isFetching;

  return {
    ...query,
    data: query.data,
    isInitialLoad: !isMounted,
    hasLoadedOnce,
    showSkeleton,
    isMounted
  };
}

/**
 * Hook for dashboard overview metrics
 * Fetches multiple metrics efficiently in a single request
 */
export function useDashboardMetrics(filters?: MetricFilters) {
  const [isMounted, setIsMounted] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const query = useQuery({
    queryKey: ['dashboard-metrics', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      
      if (filters?.dateRange) {
        params.append('start_date', filters.dateRange.start);
        params.append('end_date', filters.dateRange.end);
      }

      const response = await fetch(`/api/dashboard/metrics?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard metrics');
      }
      
      const data = await response.json();
      return data as Record<MetricType, MetricData>;
    },
    enabled: isMounted,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    placeholderData: {
      total_tickets: { value: 0, trend: 'neutral' },
      new_tickets: { value: 0, trend: 'neutral' },
      completed_tickets: { value: 0, trend: 'neutral' },
      in_progress_tickets: { value: 0, trend: 'neutral' },
      total_customers: { value: 0, trend: 'neutral' },
      total_appointments: { value: 0, trend: 'neutral' },
      pending_appointments: { value: 0, trend: 'neutral' },
      revenue_today: { value: '$0', trend: 'neutral' },
      revenue_month: { value: '$0', trend: 'neutral' },
    } as Record<MetricType, MetricData>
  });

  // Track when we've successfully loaded data at least once
  useEffect(() => {
    if (query.isSuccess && !hasLoadedOnce) {
      setHasLoadedOnce(true);
    }
  }, [query.isSuccess, hasLoadedOnce]);

  const showSkeleton = !hasLoadedOnce || query.isLoading || query.isFetching;

  return {
    ...query,
    showSkeleton,
    hasLoadedOnce,
    isInitialLoad: !isMounted,
    isMounted
  };
}