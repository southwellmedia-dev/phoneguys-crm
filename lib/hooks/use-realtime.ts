'use client';

import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { RealtimeService } from '@/lib/services/realtime.service';

/**
 * Hook to manage real-time subscriptions
 * Automatically handles setup and cleanup
 */
export function useRealtime(
  subscriptions: Array<'tickets' | 'customers' | 'appointments' | 'admin' | 'all'>
) {
  const queryClient = useQueryClient();
  const supabase = createClient();
  const serviceRef = useRef<RealtimeService | null>(null);

  useEffect(() => {
    // Get or create the RealtimeService instance
    serviceRef.current = RealtimeService.getInstance(supabase, queryClient);
    
    // Subscribe to requested channels
    subscriptions.forEach(sub => {
      switch (sub) {
        case 'tickets':
          serviceRef.current?.subscribeToTickets();
          break;
        case 'customers':
          serviceRef.current?.subscribeToCustomers();
          break;
        case 'appointments':
          serviceRef.current?.subscribeToAppointments();
          break;
        case 'admin':
          serviceRef.current?.subscribeToAdmin();
          break;
        case 'all':
          serviceRef.current?.subscribeToTickets();
          serviceRef.current?.subscribeToCustomers();
          serviceRef.current?.subscribeToAppointments();
          serviceRef.current?.subscribeToAdmin();
          break;
      }
    });

    // Log active subscriptions
    console.log('🚀 Real-time subscriptions active:', serviceRef.current?.getActiveSubscriptions());

    // Cleanup on unmount
    return () => {
      // We don't want to unsubscribe all since other components might be using it
      // The singleton pattern ensures subscriptions are shared
      console.log('Component unmounting, keeping subscriptions active for other components');
    };
  }, []); // Only run once on mount

  return {
    isConnected: serviceRef.current?.getConnectionStatus() || false,
    activeSubscriptions: serviceRef.current?.getActiveSubscriptions() || [],
  };
}