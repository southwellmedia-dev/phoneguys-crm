'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { RepairTicketWithRelations } from '@/lib/types/repair-ticket';
import { Order } from '@/components/orders/orders-columns';
import { RepairStatus } from '@/components/orders/status-badge';
import { toast } from 'sonner';
import { useRealtime } from './use-realtime';

const API_BASE = '/api/orders';

export function useTickets(filters?: {
  status?: string;
  search?: string;
  customerId?: string;
  assignedTo?: string;
}, initialData?: Order[]) {
  const [isMounted, setIsMounted] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const query = useQuery({
    queryKey: ['tickets', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.search) params.append('search', filters.search);
      if (filters?.customerId) params.append('customerId', filters.customerId);
      if (filters?.assignedTo) params.append('assignedTo', filters.assignedTo);
      
      console.log('Fetching tickets with filters:', filters);
      console.log('Query params:', params.toString());
      
      const response = await fetch(`${API_BASE}?${params}`);
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', response.status, errorText);
        throw new Error(`Failed to fetch tickets: ${response.status} ${errorText}`);
      }
      const result = await response.json();
      console.log('API Response:', result);
      
      // The API returns paginated data, transform to Order format like server-side code
      const tickets = result.data || [];
      const orders: Order[] = tickets.map((ticket: any) => ({
        id: ticket.id,
        ticket_number: ticket.ticket_number,
        customer_id: ticket.customer_id,
        customer_name: ticket.customers?.name || "Unknown Customer",
        customer_phone: ticket.customers?.phone || "",
        device_brand: ticket.device?.manufacturer?.name || ticket.device_brand || "",
        device_model: ticket.device?.model_name || ticket.device_model || "",
        repair_issues: ticket.repair_issues || [],
        status: ticket.status as RepairStatus,
        created_at: ticket.created_at,
        updated_at: ticket.updated_at,
        timer_total_minutes: ticket.total_time_minutes || 0,
        assigned_to: ticket.assigned_to,
      }));
      
      return orders;
    },
    enabled: isMounted, // 🔑 KEY: Only fetch after mount
    refetchOnWindowFocus: false,
    staleTime: filters ? 0 : 1000 * 60 * 5, // No caching when filtering
    placeholderData: initialData, // 🔑 KEY: Provide structure
    initialData: initialData && initialData.length > 0 ? initialData : undefined
  });

  // 🔑 KEY: Track when we've successfully loaded data at least once
  useEffect(() => {
    if (query.isSuccess && !hasLoadedOnce) {
      setHasLoadedOnce(true);
    }
  }, [query.isSuccess, hasLoadedOnce]);

  // Use the real-time service for tickets subscription
  // The RealtimeService handles all real-time updates through its singleton pattern
  useRealtime(['tickets']);

  return {
    ...query,
    // 🔑 KEY: Show skeleton until we have a definitive answer
    showSkeleton: !hasLoadedOnce || query.isLoading || query.isFetching,
    hasLoadedOnce
  };
}

export function useTicket(id?: string, initialData?: RepairTicketWithRelations) {
  const [isMounted, setIsMounted] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const query = useQuery({
    queryKey: ['ticket', id],
    queryFn: async () => {
      if (!id) throw new Error('Ticket ID is required');
      const response = await fetch(`${API_BASE}/${id}`);
      if (!response.ok) throw new Error('Failed to fetch ticket');
      return response.json() as Promise<RepairTicketWithRelations>;
    },
    enabled: isMounted && !!id, // 🔑 KEY: Only fetch after mount
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
    placeholderData: initialData, // 🔑 KEY: Provide structure
    initialData: initialData ? initialData : undefined
  });

  // 🔑 KEY: Track when we've successfully loaded data at least once
  useEffect(() => {
    if (query.isSuccess && !hasLoadedOnce) {
      setHasLoadedOnce(true);
    }
  }, [query.isSuccess, hasLoadedOnce]);

  // The RealtimeService already handles individual ticket updates
  // through the main tickets subscription

  return {
    ...query,
    // 🔑 KEY: Show skeleton until we have a definitive answer
    showSkeleton: !hasLoadedOnce || query.isLoading || query.isFetching,
    hasLoadedOnce
  };
}

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
      await queryClient.cancelQueries({ queryKey: ['ticket', id] });
      const previousTicket = queryClient.getQueryData(['ticket', id]);
      
      queryClient.setQueryData(['ticket', id], (old: any) => ({
        ...old,
        status,
      }));
      
      return { previousTicket };
    },
    onError: (err, variables, context) => {
      if (context?.previousTicket) {
        queryClient.setQueryData(['ticket', variables.id], context.previousTicket);
      }
      toast.error('Failed to update status');
    },
    onSuccess: (data, { id, status }) => {
      toast.success('Status updated successfully');
      
      // Update ticket lists with the new status
      queryClient.setQueriesData(
        { queryKey: ['tickets'], exact: false },
        (old: any[] = []) => {
          return old.map(ticket => 
            ticket.id === id ? { ...ticket, status, updated_at: new Date().toISOString() } : ticket
          );
        }
      );
    },
  });
}

export function useStartTimer() {
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
    onSuccess: (data, ticketId) => {
      toast.success('Timer started');
      
      // Update ticket in cache with timer state
      if (data?.data) {
        queryClient.setQueryData(['ticket', ticketId], (old: any) => {
          if (!old) return old;
          return {
            ...old,
            timer_is_running: true,
            timer_started_at: data.data.timer_started_at,
            updated_at: new Date().toISOString()
          };
        });
        
        // Update ticket lists
        queryClient.setQueriesData(
          { queryKey: ['tickets'], exact: false },
          (old: any[] = []) => {
            return old.map(ticket => 
              ticket.id === ticketId 
                ? { 
                    ...ticket, 
                    timer_is_running: true,
                    timer_started_at: data.data.timer_started_at,
                    updated_at: new Date().toISOString()
                  } 
                : ticket
            );
          }
        );
      }
    },
    onError: () => {
      toast.error('Failed to start timer');
    },
  });
}

export function useStopTimer() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ ticketId, workNotes }: { ticketId: string; workNotes: string }) => {
      const response = await fetch(`${API_BASE}/${ticketId}/timer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'stop', work_notes: workNotes }),
      });
      if (!response.ok) throw new Error('Failed to stop timer');
      return response.json();
    },
    onSuccess: (data, { ticketId }) => {
      toast.success('Timer stopped');
      
      // Update ticket in cache with timer state and new time entry
      if (data?.data) {
        queryClient.setQueryData(['ticket', ticketId], (old: any) => {
          if (!old) return old;
          
          // Add the new time entry if it exists
          const updatedTimeEntries = data.data.newTimeEntry 
            ? [...(old.time_entries || []), data.data.newTimeEntry]
            : old.time_entries;
          
          return {
            ...old,
            timer_is_running: false,
            timer_started_at: null,
            timer_total_minutes: data.data.timer_total_minutes,
            total_time_minutes: data.data.total_time_minutes,
            time_entries: updatedTimeEntries,
            updated_at: new Date().toISOString()
          };
        });
        
        // Update ticket lists
        queryClient.setQueriesData(
          { queryKey: ['tickets'], exact: false },
          (old: any[] = []) => {
            return old.map(ticket => 
              ticket.id === ticketId 
                ? { 
                    ...ticket, 
                    timer_is_running: false,
                    timer_started_at: null,
                    timer_total_minutes: data.data.timer_total_minutes,
                    updated_at: new Date().toISOString()
                  } 
                : ticket
            );
          }
        );
      }
    },
    onError: () => {
      toast.error('Failed to stop timer');
    },
  });
}

// Clear timer mutation (admin function)
// Create ticket mutation
export function useCreateTicket() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create ticket');
      return response.json();
    },
    onSuccess: (data) => {
      toast.success('Ticket created successfully');
      // Real-time will handle the cache update
    },
    onError: () => {
      toast.error('Failed to create ticket');
    },
  });
}

// Update ticket mutation
export function useUpdateTicket() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await fetch(`${API_BASE}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update ticket');
      return response.json();
    },
    onSuccess: (data, { id }) => {
      toast.success('Ticket updated successfully');
      // Real-time will handle the cache update
    },
    onError: () => {
      toast.error('Failed to update ticket');
    },
  });
}

// Delete ticket mutation
export function useDeleteTicket() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`${API_BASE}/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete ticket');
      return response.json();
    },
    onSuccess: (data, id) => {
      toast.success('Ticket deleted successfully');
      // Real-time will handle the cache update
    },
    onError: () => {
      toast.error('Failed to delete ticket');
    },
  });
}

export function useClearTimer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ticketId: string) => {
      const response = await fetch(`/api/orders/${ticketId}/clear-timer`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to clear timer');
      }
      
      return response.json();
    },
    onSuccess: (data, ticketId) => {
      // Update the ticket in cache
      queryClient.setQueryData(['ticket', ticketId], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          timer_is_running: false,
          timer_started_at: null,
        };
      });

      // Update ticket lists
      queryClient.setQueriesData(
        { queryKey: ['tickets'], exact: false },
        (old: any[] = []) => {
          return old.map(ticket => 
            ticket.id === ticketId 
              ? { ...ticket, timer_is_running: false, timer_started_at: null }
              : ticket
          );
        }
      );

      toast.success('Timer cleared successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to clear timer');
    },
  });
}

export function useDeleteTimeEntry(ticketId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (entryId: string) => {
      const response = await fetch(`/api/orders/${ticketId}/time-entries/${entryId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete time entry');
      }

      return response.json();
    },
    onMutate: async (entryId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['ticket', ticketId] });

      // Snapshot the previous value
      const previousTicket = queryClient.getQueryData(['ticket', ticketId]);

      // Optimistically update the ticket
      queryClient.setQueryData(['ticket', ticketId], (old: any) => {
        if (!old) return old;
        
        // Remove the deleted entry from time_entries
        const updatedEntries = old.time_entries?.filter((e: any) => e.id !== entryId) || [];
        
        // Recalculate total time
        const totalMinutes = updatedEntries.reduce((sum: number, entry: any) => {
          return sum + (entry.duration_minutes || 0);
        }, 0);
        
        return {
          ...old,
          time_entries: updatedEntries,
          total_time_minutes: totalMinutes
        };
      });

      // Return a context object with the snapshotted value
      return { previousTicket };
    },
    onError: (err, entryId, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousTicket) {
        queryClient.setQueryData(['ticket', ticketId], context.previousTicket);
      }
      toast.error('Failed to delete time entry');
    },
    onSuccess: () => {
      toast.success('Time entry deleted');
      // NO INVALIDATION - Let real-time handle any server-side changes
    },
    // REMOVED onSettled - NO INVALIDATION, follow our principles!
  });
}