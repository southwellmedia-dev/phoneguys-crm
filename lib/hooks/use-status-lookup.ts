'use client';

import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';

interface StatusLookupData {
  type: 'ticket' | 'appointment';
  identifier: string;
  email: string;
}

interface StatusLookupResponse {
  success: boolean;
  type?: 'ticket' | 'appointment';
  data?: any;
  timeline?: any[];
  error?: string;
  rateLimitExceeded?: boolean;
  attemptsRemaining?: number;
}

async function fetchStatus(data: StatusLookupData | null): Promise<StatusLookupResponse> {
  if (!data) {
    throw new Error('No lookup data provided');
  }

  const response = await fetch('/api/public/status', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok) {
    // Handle rate limiting specifically
    if (response.status === 429) {
      throw new Error(result.error || 'Too many requests. Please try again later.');
    }
    
    // Handle not found
    if (response.status === 404) {
      throw new Error(result.error || 'No matching record found. Please check your details.');
    }

    // Handle other errors
    throw new Error(result.error || 'Failed to fetch status');
  }

  if (!result.success) {
    throw new Error(result.error || 'Failed to fetch status');
  }

  return result;
}

export function useStatusLookup(lookupData: StatusLookupData | null) {
  const [isMounted, setIsMounted] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const query = useQuery({
    queryKey: ['status-lookup', lookupData?.type, lookupData?.identifier, lookupData?.email],
    queryFn: () => fetchStatus(lookupData),
    enabled: isMounted && !!lookupData,
    staleTime: 30 * 1000, // 30 seconds - status might change
    gcTime: 5 * 60 * 1000, // 5 minutes cache time
    retry: (failureCount, error) => {
      // Don't retry on rate limiting or not found errors
      if (error instanceof Error) {
        if (error.message.includes('Too many requests') || 
            error.message.includes('No matching record')) {
          return false;
        }
      }
      return failureCount < 2;
    },
    retryDelay: 1000,
  });

  // Track when data has loaded successfully
  useEffect(() => {
    if (query.isSuccess && !hasLoadedOnce) {
      setHasLoadedOnce(true);
    }
  }, [query.isSuccess, hasLoadedOnce]);

  // Reset hasLoadedOnce when lookup data changes
  useEffect(() => {
    setHasLoadedOnce(false);
  }, [lookupData?.type, lookupData?.identifier, lookupData?.email]);

  return {
    ...query,
    showSkeleton: !hasLoadedOnce || query.isLoading || query.isFetching,
    hasLoadedOnce
  };
}