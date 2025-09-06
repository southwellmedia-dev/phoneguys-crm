'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';

/**
 * Simple real-time subscription hook that directly uses Supabase
 * No complex state management, no smart invalidation, just simple subscriptions
 */
export function useSimpleRealtime(
  table: string,
  onUpdate?: () => void
) {
  const queryClient = useQueryClient();
  const supabase = createClient();

  useEffect(() => {
    console.log(`📡 Subscribing to ${table} real-time updates`);
    
    const channel = supabase
      .channel(`${table}-changes`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: table 
        },
        (payload) => {
          console.log(`📡 ${table} update:`, payload.eventType);
          
          // Simple invalidation - let React Query handle the rest
          if (onUpdate) {
            onUpdate();
          } else {
            // Default behavior: just invalidate the relevant queries
            queryClient.invalidateQueries({ queryKey: [table.replace('_', '-')] });
          }
        }
      )
      .subscribe();
    
    return () => {
      console.log(`🔌 Unsubscribing from ${table} real-time updates`);
      supabase.removeChannel(channel);
    };
  }, [table, supabase, queryClient]);
}

/**
 * Hook for timer-specific real-time updates
 * Only invalidates when timer state actually changes
 */
export function useTimerRealtime() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  useEffect(() => {
    const channel = supabase
      .channel('timer-changes')
      .on('postgres_changes', 
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'repair_tickets' 
        },
        (payload) => {
          const old = payload.old as any;
          const updated = payload.new as any;
          
          // Skip timer-only updates entirely - let optimistic updates handle it
          const isTimerOnlyUpdate = (
            old?.timer_is_running !== updated?.timer_is_running ||
            old?.timer_started_at !== updated?.timer_started_at ||
            old?.timer_total_minutes !== updated?.timer_total_minutes
          ) && (
            // Check that other important fields haven't changed
            old?.status === updated?.status &&
            old?.priority === updated?.priority &&
            old?.assigned_to === updated?.assigned_to
          );
          
          if (isTimerOnlyUpdate) {
            console.log('⏱️ Timer-only update detected, skipping invalidation');
            return; // Don't invalidate anything for timer updates
          }
          
          // For non-timer updates, invalidate lists but not individual tickets
          console.log('Non-timer update detected, invalidating lists');
          queryClient.invalidateQueries({ queryKey: ['tickets'] });
          queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, queryClient]);
}

/**
 * Dashboard real-time hook - only for INSERT/DELETE events that affect counts
 */
export function useDashboardRealtime() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  useEffect(() => {
    const channels = [];
    
    // Only listen for INSERT/DELETE which affect counts
    const tables = ['repair_tickets', 'appointments', 'customers'];
    
    tables.forEach(table => {
      const channel = supabase
        .channel(`dashboard-${table}`)
        .on('postgres_changes', 
          { 
            event: 'INSERT', 
            schema: 'public', 
            table: table 
          },
          () => {
            console.log(`📊 New ${table} added, updating dashboard`);
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
          }
        )
        .on('postgres_changes', 
          { 
            event: 'DELETE', 
            schema: 'public', 
            table: table 
          },
          () => {
            console.log(`📊 ${table} deleted, updating dashboard`);
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
          }
        )
        .subscribe();
        
      channels.push(channel);
    });
    
    return () => {
      channels.forEach(channel => supabase.removeChannel(channel));
    };
  }, [supabase, queryClient]);
}