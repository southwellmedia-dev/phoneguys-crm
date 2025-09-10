'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { BusinessHours, StoreSettings, AppointmentSettings } from '@/lib/types/database.types';

export interface SettingsUpdate {
  businessHours?: Partial<BusinessHours>[];
  storeSettings?: Partial<StoreSettings>;
  appointmentSettings?: Partial<AppointmentSettings>;
}

// Query keys
const QUERY_KEYS = {
  all: ['settings'] as const,
  businessHours: ['settings', 'business-hours'] as const,
  storeSettings: ['settings', 'store'] as const,
  appointmentSettings: ['settings', 'appointments'] as const,
};

/**
 * Hook to fetch all settings with proper hydration strategy
 */
export function useSettings() {
  const [isMounted, setIsMounted] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const query = useQuery({
    queryKey: QUERY_KEYS.all,
    queryFn: async () => {
      const response = await fetch('/api/admin/settings');
      if (!response.ok) {
        throw new Error('Failed to fetch settings');
      }
      const result = await response.json();
      return result.data;
    },
    enabled: isMounted, // 🔑 KEY: Only fetch after mount
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
    placeholderData: { // 🔑 KEY: Provide structure
      businessHours: [],
      storeSettings: null,
      appointmentSettings: null,
    },
  });

  // 🔑 KEY: Track when we've successfully loaded data at least once
  useEffect(() => {
    if (query.isSuccess && !hasLoadedOnce) {
      setHasLoadedOnce(true);
    }
  }, [query.isSuccess, hasLoadedOnce]);

  return {
    ...query,
    // 🔑 KEY: Show skeleton until we have a definitive answer
    showSkeleton: !hasLoadedOnce || query.isLoading || query.isFetching,
    isInitialLoad: !isMounted,
    hasLoadedOnce,
  };
}

/**
 * Hook to update business hours
 */
export function useUpdateBusinessHours() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ dayOfWeek, hours }: { dayOfWeek: number; hours: Partial<BusinessHours> }) => {
      const response = await fetch('/api/admin/settings/business-hours', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dayOfWeek, hours }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update business hours');
      }
      
      return response.json();
    },
    onMutate: async ({ dayOfWeek, hours }) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.all });
      
      const previousSettings = queryClient.getQueryData(QUERY_KEYS.all);
      
      // Optimistic update
      queryClient.setQueryData(QUERY_KEYS.all, (old: any) => {
        if (!old) return old;
        return {
          ...old,
          businessHours: old.businessHours.map((h: BusinessHours) =>
            h.day_of_week === dayOfWeek ? { ...h, ...hours } : h
          ),
        };
      });

      return { previousSettings };
    },
    onError: (err, variables, context) => {
      if (context?.previousSettings) {
        queryClient.setQueryData(QUERY_KEYS.all, context.previousSettings);
      }
      toast.error('Failed to update business hours');
    },
    onSuccess: () => {
      toast.success('Business hours updated');
    },
  });
}

/**
 * Hook to update all business hours at once
 */
export function useUpdateAllBusinessHours() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (hours: Partial<BusinessHours>[]) => {
      const response = await fetch('/api/admin/settings/business-hours', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(hours),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update business hours');
      }
      
      return response.json();
    },
    onMutate: async (hours) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.all });
      
      const previousSettings = queryClient.getQueryData(QUERY_KEYS.all);
      
      // Optimistic update
      queryClient.setQueryData(QUERY_KEYS.all, (old: any) => {
        if (!old) return old;
        return {
          ...old,
          businessHours: hours,
        };
      });

      return { previousSettings };
    },
    onError: (err, variables, context) => {
      if (context?.previousSettings) {
        queryClient.setQueryData(QUERY_KEYS.all, context.previousSettings);
      }
      toast.error('Failed to update business hours');
    },
    onSuccess: () => {
      toast.success('Business hours updated');
    },
  });
}

/**
 * Hook to update store settings
 */
export function useUpdateStoreSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settings: Partial<StoreSettings>) => {
      const response = await fetch('/api/admin/settings/store', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update store settings');
      }
      
      return response.json();
    },
    onMutate: async (settings) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.all });
      
      const previousSettings = queryClient.getQueryData(QUERY_KEYS.all);
      
      // Optimistic update
      queryClient.setQueryData(QUERY_KEYS.all, (old: any) => {
        if (!old) return old;
        return {
          ...old,
          storeSettings: { ...old.storeSettings, ...settings },
        };
      });

      return { previousSettings };
    },
    onError: (err, variables, context) => {
      if (context?.previousSettings) {
        queryClient.setQueryData(QUERY_KEYS.all, context.previousSettings);
      }
      toast.error('Failed to update store settings');
    },
    onSuccess: () => {
      toast.success('Store settings updated');
    },
  });
}

/**
 * Hook to update appointment settings
 */
export function useUpdateAppointmentSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settings: Partial<AppointmentSettings>) => {
      const response = await fetch('/api/admin/settings/appointments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update appointment settings');
      }
      
      return response.json();
    },
    onMutate: async (settings) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.all });
      
      const previousSettings = queryClient.getQueryData(QUERY_KEYS.all);
      
      // Optimistic update
      queryClient.setQueryData(QUERY_KEYS.all, (old: any) => {
        if (!old) return old;
        return {
          ...old,
          appointmentSettings: { ...old.appointmentSettings, ...settings },
        };
      });

      return { previousSettings };
    },
    onError: (err, variables, context) => {
      if (context?.previousSettings) {
        queryClient.setQueryData(QUERY_KEYS.all, context.previousSettings);
      }
      toast.error('Failed to update appointment settings');
    },
    onSuccess: () => {
      toast.success('Appointment settings updated');
    },
  });
}

/**
 * Hook to update multiple settings at once
 */
export function useUpdateSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: SettingsUpdate) => {
      const response = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update settings');
      }
      
      return response.json();
    },
    onMutate: async (updates) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.all });
      
      const previousSettings = queryClient.getQueryData(QUERY_KEYS.all);
      
      // Optimistic update
      queryClient.setQueryData(QUERY_KEYS.all, (old: any) => {
        if (!old) return old;
        
        const updated = { ...old };
        
        if (updates.businessHours) {
          updated.businessHours = updates.businessHours;
        }
        
        if (updates.storeSettings) {
          updated.storeSettings = { ...old.storeSettings, ...updates.storeSettings };
        }
        
        if (updates.appointmentSettings) {
          updated.appointmentSettings = { ...old.appointmentSettings, ...updates.appointmentSettings };
        }
        
        return updated;
      });

      return { previousSettings };
    },
    onError: (err, variables, context) => {
      if (context?.previousSettings) {
        queryClient.setQueryData(QUERY_KEYS.all, context.previousSettings);
      }
      toast.error('Failed to update settings');
    },
    onSuccess: () => {
      toast.success('Settings updated successfully');
    },
  });
}