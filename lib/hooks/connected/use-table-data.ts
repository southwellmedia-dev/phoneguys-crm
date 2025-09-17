'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useMemo } from 'react';
import { useRealtime } from '../use-realtime';

export interface SortConfig {
  key: string;
  direction: 'asc' | 'desc' | null;
}

export interface TableDataOptions<T = any> {
  endpoint: string;
  queryKey: string[];
  filters?: Record<string, any>;
  initialSort?: SortConfig;
  pageSize?: number;
  realtime?: boolean;
  transform?: (data: any) => T[];
}

/**
 * Generic hook for table data with sorting, filtering, and real-time updates
 * 
 * Features:
 * - Client-side sorting with localStorage persistence
 * - Progressive loading with immediate structure
 * - Real-time updates via cache updates
 * - Flexible data transformation
 */
export function useTableData<T = any>(options: TableDataOptions<T>) {
  const [isMounted, setIsMounted] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [sortConfig, setSortConfig] = useState<SortConfig>(() => {
    // Load saved sort configuration
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`table.sort.${options.queryKey.join('.')}`);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          return options.initialSort || { key: '', direction: null };
        }
      }
    }
    return options.initialSort || { key: '', direction: null };
  });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Save sort configuration
  useEffect(() => {
    if (isMounted) {
      localStorage.setItem(
        `table.sort.${options.queryKey.join('.')}`,
        JSON.stringify(sortConfig)
      );
    }
  }, [sortConfig, options.queryKey, isMounted]);

  const query = useQuery({
    queryKey: [...options.queryKey, options.filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      
      // Add filters to query params
      if (options.filters) {
        Object.entries(options.filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            params.append(key, String(value));
          }
        });
      }

      if (options.pageSize) {
        params.append('limit', options.pageSize.toString());
      }

      const url = `${options.endpoint}${params.toString() ? `?${params}` : ''}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch data from ${options.endpoint}`);
      }
      
      const result = await response.json();
      
      // Handle various response formats
      let data;
      if (Array.isArray(result)) {
        // Direct array response
        data = result;
      } else if (result.data !== undefined) {
        // Wrapped response (e.g., { success: true, data: [...] })
        data = result.data;
      } else if (result.success && !result.data) {
        // Success response but no data array
        data = [];
      } else {
        // Fallback to the result itself
        data = result;
      }
      
      return options.transform ? options.transform(data) : data;
    },
    enabled: isMounted,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    placeholderData: []
  });

  // Track when we've successfully loaded data at least once
  useEffect(() => {
    if (query.isSuccess && !hasLoadedOnce) {
      setHasLoadedOnce(true);
    }
  }, [query.isSuccess, hasLoadedOnce]);

  // Client-side sorting
  const sortedData = useMemo(() => {
    // Ensure data is always an array
    const dataArray = Array.isArray(query.data) ? query.data : [];
    
    if (!dataArray.length || !sortConfig.key || !sortConfig.direction) {
      return dataArray;
    }

    return [...dataArray].sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];

      // Handle nested properties (e.g., 'user.name')
      const keys = sortConfig.key.split('.');
      if (keys.length > 1) {
        aVal = keys.reduce((obj, key) => obj?.[key], a);
        bVal = keys.reduce((obj, key) => obj?.[key], b);
      }

      // Handle different data types
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }

      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [query.data, sortConfig]);

  const handleSort = (key: string) => {
    setSortConfig(prev => ({
      key,
      direction: 
        prev.key === key 
          ? prev.direction === 'asc' 
            ? 'desc' 
            : prev.direction === 'desc' 
              ? null 
              : 'asc'
          : 'asc'
    }));
  };

  const getSortIcon = (key: string) => {
    if (sortConfig.key !== key || !sortConfig.direction) {
      return 'none';
    }
    return sortConfig.direction;
  };

  // Determine when to show skeleton
  // Show skeleton until we have a definitive answer about the data
  const showSkeleton = !hasLoadedOnce || query.isLoading || query.isFetching;
  
  // Set up real-time subscriptions if enabled
  const realtimeSubscriptions = useMemo(() => {
    if (!options.realtime || !isMounted) return [];
    
    // Map endpoints to real-time subscription types
    if (options.endpoint.includes('/customers')) return ['customers'];
    if (options.endpoint.includes('/orders') || options.endpoint.includes('/tickets')) return ['tickets'];
    if (options.endpoint.includes('/appointments')) return ['appointments'];
    if (options.endpoint.includes('/admin')) return ['admin'];
    
    return [];
  }, [options.realtime, options.endpoint, isMounted]);

  // Subscribe to real-time updates
  useRealtime(realtimeSubscriptions);

  // Debug logging in development
  if (process.env.NODE_ENV === 'development' && options.queryKey.includes('customers')) {
    console.log('[useTableData] Debug:', {
      queryKey: options.queryKey,
      isMounted,
      hasLoadedOnce,
      isLoading: query.isLoading,
      isFetching: query.isFetching,
      isSuccess: query.isSuccess,
      hasData: !!query.data,
      dataLength: Array.isArray(query.data) ? query.data.length : 'not array',
      showSkeleton,
      realtimeSubscriptions
    });
  }

  return {
    ...query,
    data: sortedData,
    sortConfig,
    handleSort,
    getSortIcon,
    isInitialLoad: !isMounted,
    hasLoadedOnce,
    showSkeleton,
    isMounted
  };
}