'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Order } from '@/components/orders/orders-columns';
import { toast } from 'sonner';

const API_BASE = '/api/orders';


/**
 * The RIGHT way to combine React Query with Supabase Realtime
 * - React Query manages caching and server state
 * - Supabase Realtime updates the cache directly (no invalidation)
 * - Optimistic updates for user actions
 */

// Fetch function for tickets
async function fetchTickets(filters?: any) {
  const params = new URLSearchParams();
  if (filters?.status) params.append('status', filters.status);
  if (filters?.search) params.append('search', filters.search);
  if (filters?.customerId) params.append('customerId', filters.customerId);
  
  const response = await fetch(`${API_BASE}?${params}`);
  if (!response.ok) throw new Error('Failed to fetch tickets');
  
  const result = await response.json();
  const tickets = result.data || [];
  
  return tickets.map((ticket: any) => ({
    id: ticket.id,
    ticket_number: ticket.ticket_number,
    customer_id: ticket.customer_id,
    customer_name: ticket.customers?.name || "Unknown Customer",
    customer_phone: ticket.customers?.phone || "",
    device_brand: ticket.device?.manufacturer?.name || ticket.device_brand || "",
    device_model: ticket.device?.model_name || ticket.device_model || "",
    repair_issues: ticket.repair_issues || [],
    status: ticket.status,
    created_at: ticket.created_at,
    updated_at: ticket.updated_at,
    timer_total_minutes: ticket.total_time_minutes || 0,
  }));
}

/**
 * Main hook that combines React Query with Supabase Realtime
 */
export function useTicketsWithRealtime(filters?: any, initialData?: Order[]) {
  const queryClient = useQueryClient();
  const supabase = createClient();
  
  // React Query for data fetching and caching
  const query = useQuery({
    queryKey: ['tickets', filters],
    queryFn: () => fetchTickets(filters),
    initialData,
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    cacheTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    refetchOnWindowFocus: false,
    refetchOnReconnect: 'always',
  });
  
  // Supabase Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('tickets-changes')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'repair_tickets' },
        async (payload) => {
          console.log('New ticket created:', payload.new.ticket_number);
          
          // Fetch full ticket data with relationships
          const response = await fetch(`${API_BASE}/${payload.new.id}`);
          if (response.ok) {
            const fullTicket = await response.json();
            
            // Transform to Order format
            const newOrder: Order = {
              id: fullTicket.id,
              ticket_number: fullTicket.ticket_number,
              customer_id: fullTicket.customer_id,
              customer_name: fullTicket.customers?.name || "Unknown Customer",
              customer_phone: fullTicket.customers?.phone || "",
              device_brand: fullTicket.device?.manufacturer?.name || fullTicket.device_brand || "",
              device_model: fullTicket.device?.model_name || fullTicket.device_model || "",
              repair_issues: fullTicket.repair_issues || [],
              status: fullTicket.status,
              created_at: fullTicket.created_at,
              updated_at: fullTicket.updated_at,
              timer_total_minutes: fullTicket.total_time_minutes || 0,
            };
            
            // Update React Query cache directly
            queryClient.setQueryData(['tickets', filters], (old: Order[] = []) => {
              // Check if already exists to prevent duplicates
              if (old.find(t => t.id === newOrder.id)) return old;
              return [newOrder, ...old];
            });
          }
        }
      )
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'repair_tickets' },
        (payload) => {
          console.log('Ticket updated:', payload.new.ticket_number);
          
          // Update React Query cache directly
          queryClient.setQueryData(['tickets', filters], (old: Order[] = []) => {
            return old.map(ticket => {
              if (ticket.id === payload.new.id) {
                // Merge the update while preserving computed fields
                return {
                  ...ticket,
                  status: payload.new.status,
                  updated_at: payload.new.updated_at,
                  timer_total_minutes: payload.new.total_time_minutes || ticket.timer_total_minutes,
                  // Preserve customer/device info unless specifically updated
                };
              }
              return ticket;
            });
          });
        }
      )
      .on('postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'repair_tickets' },
        (payload) => {
          console.log('Ticket deleted:', payload.old.id);
          
          // Update React Query cache directly
          queryClient.setQueryData(['tickets', filters], (old: Order[] = []) => {
            return old.filter(ticket => ticket.id !== payload.old.id);
          });
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, queryClient, filters]);
  
  return query;
}

/**
 * Hook for single ticket with realtime
 */
export function useTicketWithRealtime(id: string, initialData?: any) {
  const queryClient = useQueryClient();
  const supabase = createClient();
  
  const query = useQuery({
    queryKey: ['ticket', id],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/${id}`);
      if (!response.ok) throw new Error('Failed to fetch ticket');
      return response.json();
    },
    initialData,
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
  
  // Subscribe to changes for this specific ticket
  useEffect(() => {
    if (!id) return;
    
    const channel = supabase
      .channel(`ticket-${id}`)
      .on('postgres_changes',
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'repair_tickets',
          filter: `id=eq.${id}`
        },
        async (payload) => {
          console.log('Ticket updated:', payload.new.ticket_number);
          
          // For timer updates, just update specific fields
          const isTimerUpdate = payload.old.timer_is_running !== payload.new.timer_is_running;
          
          if (isTimerUpdate) {
            // Partial update for timer changes
            queryClient.setQueryData(['ticket', id], (old: any) => ({
              ...old,
              timer_is_running: payload.new.timer_is_running,
              timer_started_at: payload.new.timer_started_at,
              timer_total_minutes: payload.new.timer_total_minutes,
              updated_at: payload.new.updated_at,
            }));
          } else {
            // For other updates, fetch full data
            const response = await fetch(`${API_BASE}/${id}`);
            if (response.ok) {
              const fullTicket = await response.json();
              queryClient.setQueryData(['ticket', id], fullTicket);
            }
          }
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, supabase, queryClient]);
  
  return query;
}

/**
 * Mutations with optimistic updates
 */
export function useUpdateTicketStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await fetch(`${API_BASE}/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error('Failed to update status');
      return response.json();
    },
    onMutate: async ({ id, status }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['ticket', id] });
      await queryClient.cancelQueries({ queryKey: ['tickets'] });
      
      // Optimistically update the ticket
      const previousTicket = queryClient.getQueryData(['ticket', id]);
      queryClient.setQueryData(['ticket', id], (old: any) => ({
        ...old,
        status,
      }));
      
      // Optimistically update all ticket lists
      queryClient.setQueriesData(
        { queryKey: ['tickets'], exact: false },
        (old: Order[] = []) => {
          return old.map(ticket => 
            ticket.id === id ? { ...ticket, status } : ticket
          );
        }
      );
      
      return { previousTicket };
    },
    onError: (err, variables, context) => {
      // Revert on error
      if (context?.previousTicket) {
        queryClient.setQueryData(['ticket', variables.id], context.previousTicket);
      }
      toast.error('Failed to update status');
    },
    onSuccess: () => {
      toast.success('Status updated');
      // Real-time will handle syncing with other users
    },
  });
}

/**
 * Timer mutations with optimistic updates
 */
export function useStartTimerWithRealtime() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (ticketId: string) => {
      const response = await fetch(`${API_BASE}/${ticketId}/timer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start' }),
      });
      if (!response.ok) throw new Error('Failed to start timer');
      return response.json();
    },
    onMutate: async (ticketId) => {
      // Optimistic update
      const previousTicket = queryClient.getQueryData(['ticket', ticketId]);
      queryClient.setQueryData(['ticket', ticketId], (old: any) => ({
        ...old,
        timer_is_running: true,
        timer_started_at: new Date().toISOString(),
      }));
      return { previousTicket };
    },
    onError: (err, ticketId, context) => {
      if (context?.previousTicket) {
        queryClient.setQueryData(['ticket', ticketId], context.previousTicket);
      }
      toast.error('Failed to start timer');
    },
    onSuccess: (data, ticketId) => {
      // Update with actual server data
      if (data?.data) {
        queryClient.setQueryData(['ticket', ticketId], (old: any) => ({
          ...old,
          ...data.data,
        }));
      }
      toast.success('Timer started');
    },
  });
}

export function useStopTimerWithRealtime() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ ticketId, notes }: { ticketId: string; notes?: string }) => {
      const response = await fetch(`${API_BASE}/${ticketId}/timer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'stop', notes }),
      });
      if (!response.ok) throw new Error('Failed to stop timer');
      return response.json();
    },
    onMutate: async ({ ticketId }) => {
      // Optimistic update
      const previousTicket = queryClient.getQueryData(['ticket', ticketId]);
      queryClient.setQueryData(['ticket', ticketId], (old: any) => ({
        ...old,
        timer_is_running: false,
        timer_started_at: null,
      }));
      return { previousTicket };
    },
    onError: (err, { ticketId }, context) => {
      if (context?.previousTicket) {
        queryClient.setQueryData(['ticket', ticketId], context.previousTicket);
      }
      toast.error('Failed to stop timer');
    },
    onSuccess: (data, { ticketId }) => {
      // Update with actual server data including new time entry
      if (data?.data) {
        queryClient.setQueryData(['ticket', ticketId], (old: any) => ({
          ...old,
          ...data.data,
        }));
      }
      // Invalidate time entries to show new entry
      queryClient.invalidateQueries({ queryKey: ['time-entries', ticketId] });
      toast.success('Timer stopped');
    },
  });
}