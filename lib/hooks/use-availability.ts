'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';

interface TimeSlot {
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  staffName?: string;
}

interface AvailableDate {
  date: string;
  availableSlots: number;
}

interface AvailabilityData {
  dates?: AvailableDate[];
  slots?: TimeSlot[];
}

interface UseAvailabilityOptions {
  apiBaseUrl?: string;
  apiKey?: string;
  enabled?: boolean;
}

/**
 * Custom hook for fetching and caching availability data
 * Implements smart caching and progressive loading strategies
 */
export function useAvailability(options: UseAvailabilityOptions = {}) {
  const { apiBaseUrl = '/api/public', apiKey, enabled = true } = options;
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<string | undefined>();

  // Fetch available dates (cached for 5 minutes)
  const datesQuery = useQuery({
    queryKey: ['availability', 'dates'],
    queryFn: async () => {
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (apiKey) headers['x-api-key'] = apiKey;
      
      const response = await fetch(`${apiBaseUrl}/availability?nextAvailable=true&limit=30`, { headers });
      if (!response.ok) throw new Error('Failed to fetch available dates');
      const data = await response.json();
      return data.data as AvailableDate[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (was cacheTime)
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    enabled,
  });

  // Fetch time slots for selected date (cached per date)
  const slotsQuery = useQuery({
    queryKey: ['availability', 'slots', selectedDate],
    queryFn: async () => {
      if (!selectedDate) return [];
      
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (apiKey) headers['x-api-key'] = apiKey;
      
      const response = await fetch(`${apiBaseUrl}/availability?date=${selectedDate}`, { headers });
      if (!response.ok) throw new Error('Failed to fetch time slots');
      const data = await response.json();
      return (data.data?.slots || []) as TimeSlot[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    enabled: enabled && !!selectedDate,
  });

  // Prefetch slots for the first 3 available dates
  useEffect(() => {
    if (datesQuery.data && datesQuery.data.length > 0) {
      // Prefetch slots for the first 3 dates in background
      const datesToPrefetch = datesQuery.data.slice(0, 3);
      
      datesToPrefetch.forEach(({ date }) => {
        queryClient.prefetchQuery({
          queryKey: ['availability', 'slots', date],
          queryFn: async () => {
            const headers: HeadersInit = { 'Content-Type': 'application/json' };
            if (apiKey) headers['x-api-key'] = apiKey;
            
            const response = await fetch(`${apiBaseUrl}/availability?date=${date}`, { headers });
            if (!response.ok) throw new Error('Failed to fetch time slots');
            const data = await response.json();
            return (data.data?.slots || []) as TimeSlot[];
          },
          staleTime: 5 * 60 * 1000,
        });
      });
    }
  }, [datesQuery.data, queryClient, apiBaseUrl, apiKey]);

  // Helper to select a date and trigger slot fetching
  const selectDate = (date: string) => {
    setSelectedDate(date);
  };

  // Helper to clear cache (useful for testing or forced refresh)
  const clearCache = () => {
    queryClient.invalidateQueries({ queryKey: ['availability'] });
  };

  // Helper to check if data is being fetched
  const isLoading = datesQuery.isLoading || (selectedDate && slotsQuery.isLoading);

  return {
    // Data
    availableDates: datesQuery.data,
    timeSlots: slotsQuery.data,
    selectedDate,
    
    // Loading states
    isLoadingDates: datesQuery.isLoading,
    isLoadingSlots: slotsQuery.isLoading,
    isLoading,
    
    // Error states
    datesError: datesQuery.error,
    slotsError: slotsQuery.error,
    
    // Actions
    selectDate,
    clearCache,
    
    // Refetch functions
    refetchDates: datesQuery.refetch,
    refetchSlots: slotsQuery.refetch,
  };
}

/**
 * Hook for prefetching availability data
 * Use this to warm the cache before the user reaches the schedule step
 */
export function usePrefetchAvailability(apiBaseUrl: string = '/api/public', apiKey?: string) {
  const queryClient = useQueryClient();

  const prefetchAvailability = async () => {
    // Prefetch available dates
    await queryClient.prefetchQuery({
      queryKey: ['availability', 'dates'],
      queryFn: async () => {
        const headers: HeadersInit = { 'Content-Type': 'application/json' };
        if (apiKey) headers['x-api-key'] = apiKey;
        
        const response = await fetch(`${apiBaseUrl}/availability?nextAvailable=true&limit=30`, { headers });
        if (!response.ok) throw new Error('Failed to fetch available dates');
        const data = await response.json();
        return data.data as AvailableDate[];
      },
      staleTime: 5 * 60 * 1000,
    });

    // Get the dates that were prefetched
    const dates = queryClient.getQueryData<AvailableDate[]>(['availability', 'dates']);
    
    // Prefetch slots for first 3 dates
    if (dates && dates.length > 0) {
      const prefetchPromises = dates.slice(0, 3).map(({ date }) =>
        queryClient.prefetchQuery({
          queryKey: ['availability', 'slots', date],
          queryFn: async () => {
            const headers: HeadersInit = { 'Content-Type': 'application/json' };
            if (apiKey) headers['x-api-key'] = apiKey;
            
            const response = await fetch(`${apiBaseUrl}/availability?date=${date}`, { headers });
            if (!response.ok) throw new Error('Failed to fetch time slots');
            const data = await response.json();
            return (data.data?.slots || []) as TimeSlot[];
          },
          staleTime: 5 * 60 * 1000,
        })
      );
      
      await Promise.all(prefetchPromises);
    }
  };

  return { prefetchAvailability };
}

/**
 * Hook for managing the entire availability flow
 * Combines date and slot selection with optimistic updates
 */
export function useAvailabilityFlow(apiBaseUrl: string = '/api/public', apiKey?: string) {
  const {
    availableDates,
    timeSlots,
    selectedDate,
    isLoadingDates,
    isLoadingSlots,
    selectDate,
    refetchDates,
    refetchSlots,
  } = useAvailability({ apiBaseUrl, apiKey });

  const [selectedTime, setSelectedTime] = useState<string | undefined>();

  // Reset selected time when date changes
  useEffect(() => {
    setSelectedTime(undefined);
  }, [selectedDate]);
  
  // Fix for setSelectedDate not defined
  const setSelectedDate = selectDate;

  const selectTimeSlot = (time: string) => {
    setSelectedTime(time);
  };

  const getSelection = () => {
    if (!selectedDate || !selectedTime) return null;
    
    return {
      date: selectedDate,
      time: selectedTime,
      // Find the selected slot details
      slot: timeSlots?.find(slot => slot.startTime === selectedTime),
    };
  };

  const resetSelection = () => {
    setSelectedDate(undefined);
    setSelectedTime(undefined);
  };

  return {
    // Data
    availableDates,
    timeSlots,
    selectedDate,
    selectedTime,
    
    // Loading states
    isLoadingDates,
    isLoadingSlots,
    
    // Actions
    selectDate,
    selectTimeSlot,
    getSelection,
    resetSelection,
    
    // Refetch
    refetchDates,
    refetchSlots,
  };
}