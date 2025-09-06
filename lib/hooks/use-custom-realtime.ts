'use client';

import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

interface CustomRealtimeOptions {
  channel: string;
  table: string;
  filter?: string;
  onInsert?: (payload: any) => void;
  onUpdate?: (payload: any) => void;
  onDelete?: (payload: any) => void;
}

/**
 * Hook for custom real-time subscriptions with specific filters
 */
export function useCustomRealtime(options: CustomRealtimeOptions) {
  const queryClient = useQueryClient();
  const supabase = createClient();
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!options.channel || !options.table) return;

    // Create subscription configuration
    const subscriptionConfig: any = {
      event: '*',
      schema: 'public',
      table: options.table,
    };

    if (options.filter) {
      subscriptionConfig.filter = options.filter;
    }

    // Create and configure channel
    channelRef.current = supabase
      .channel(options.channel)
      .on('postgres_changes', subscriptionConfig, (payload) => {
        console.log(`📡 Real-time update on ${options.table}:`, payload);
        
        switch (payload.eventType) {
          case 'INSERT':
            options.onInsert?.(payload);
            break;
          case 'UPDATE':
            options.onUpdate?.(payload);
            break;
          case 'DELETE':
            options.onDelete?.(payload);
            break;
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`✅ Subscribed to ${options.channel}`);
        }
      });

    // Cleanup
    return () => {
      if (channelRef.current) {
        console.log(`🔌 Unsubscribing from ${options.channel}`);
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [options.channel, options.table, options.filter]);
}