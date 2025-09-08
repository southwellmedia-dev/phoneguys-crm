'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { useRealtime } from '../use-realtime';

export interface ActivityFilters {
  type?: 'tickets' | 'appointments' | 'customers' | 'all';
  limit?: number;
  dateRange?: {
    start: string;
    end: string;
  };
}

export interface ActivityItem {
  id: string;
  type: 'ticket' | 'appointment' | 'customer';
  action: 'created' | 'updated' | 'completed' | 'cancelled';
  title: string;
  description?: string;
  timestamp: string;
  user?: {
    id: string;
    name: string;
  };
  metadata?: {
    customer_name?: string;
    ticket_number?: string;
    status?: string;
    [key: string]: any;
  };
}

/**
 * Hook for fetching real-time activity feed with smart hydration
 * 
 * Features:
 * - Progressive loading with structure-first approach
 * - Real-time updates via cache updates
 * - Filtered activity streams
 * - Optimized for dashboard recent activity component
 */
export function useActivityFeed(filters: ActivityFilters = {}) {
  const [isMounted, setIsMounted] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const query = useQuery({
    queryKey: ['activity-feed', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      
      if (filters.type && filters.type !== 'all') {
        params.append('type', filters.type);
      }
      if (filters.limit) {
        params.append('limit', filters.limit.toString());
      }
      if (filters.dateRange) {
        params.append('start_date', filters.dateRange.start);
        params.append('end_date', filters.dateRange.end);
      }

      const response = await fetch(`/api/activity?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch activity feed');
      }
      
      const data = await response.json();
      return data.data as ActivityItem[];
    },
    enabled: isMounted,
    staleTime: 2 * 60 * 1000, // 2 minutes (more frequent for activity)
    refetchOnWindowFocus: false,
    placeholderData: []
  });

  // Track when we've successfully loaded data at least once
  useEffect(() => {
    if (query.isSuccess && !hasLoadedOnce) {
      setHasLoadedOnce(true);
    }
  }, [query.isSuccess, hasLoadedOnce]);

  // Set up real-time subscriptions for activity updates
  useRealtime(['all']); // Subscribe to all changes

  // Helper to get activity by type
  const getFilteredActivity = (type?: string) => {
    if (!query.data) return [];
    if (!type || type === 'all') return query.data;
    return query.data.filter(item => item.type === type);
  };

  // Show skeleton until we have a definitive answer about the data
  const showSkeleton = !hasLoadedOnce || query.isLoading || query.isFetching;

  return {
    ...query,
    data: query.data || [],
    getFilteredActivity,
    isInitialLoad: !isMounted,
    hasLoadedOnce,
    showSkeleton,
    isMounted
  };
}