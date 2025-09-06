'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RepairTicketWithRelations } from '@/lib/types/repair-ticket';
import { Order } from '@/components/orders/orders-columns';
import { RepairStatus } from '@/components/orders/status-badge';
import { toast } from 'sonner';

const API_BASE = '/api/orders';

/**
 * Simplified tickets hook - no complex optimistic updates
 * Just basic React Query patterns with simple invalidation
 */
export function useTickets(filters?: {
  status?: string;
  search?: string;
  customerId?: string;
}, initialData?: Order[]) {
  return useQuery({
    queryKey: ['tickets', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.search) params.append('search', filters.search);
      if (filters?.customerId) params.append('customerId', filters.customerId);
      
      const response = await fetch(`${API_BASE}?${params}`);
      if (!response.ok) throw new Error('Failed to fetch tickets');
      
      const result = await response.json();
      const tickets = result.data || [];
      
      // Simple transformation to Order format
      return tickets.map((ticket: any) => ({
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
      }));
    },
    initialData,
    staleTime: 30 * 1000, // 30 seconds - reasonable cache time
    refetchOnWindowFocus: false,
  });
}

export function useTicket(id?: string, initialData?: RepairTicketWithRelations) {
  return useQuery({
    queryKey: ['ticket', id],
    queryFn: async () => {
      if (!id) throw new Error('Ticket ID is required');
      const response = await fetch(`${API_BASE}/${id}`);
      if (!response.ok) throw new Error('Failed to fetch ticket');
      return response.json();
    },
    initialData,
    enabled: !!id,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
  });
}

/**
 * Simple status update - no optimistic updates
 * Shows loading state briefly, but much simpler code
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
    onSuccess: (data, { id }) => {
      toast.success('Status updated');
      // Simple invalidation - let React Query handle the rest
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['ticket', id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: () => {
      toast.error('Failed to update status');
    },
  });
}

/**
 * Timer operations with optimistic updates ONLY for timer
 * This is high-frequency interaction where optimistic updates matter
 */
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
    onMutate: async (ticketId) => {
      await queryClient.cancelQueries({ queryKey: ['ticket', ticketId] });
      
      const previousTicket = queryClient.getQueryData(['ticket', ticketId]);
      
      // Simple optimistic update for timer only
      queryClient.setQueryData(['ticket', ticketId], (old: any) => {
        if (!old) return old; // Don't update if no data
        return {
          ...old,
          timer_is_running: true,
          timer_started_at: new Date().toISOString(),
        };
      });
      
      return { previousTicket };
    },
    onError: (err, ticketId, context) => {
      if (context?.previousTicket) {
        queryClient.setQueryData(['ticket', ticketId], context.previousTicket);
      }
      toast.error('Failed to start timer');
    },
    onSuccess: (data, ticketId) => {
      toast.success('Timer started');
      // Update with server data if provided
      if (data?.data) {
        queryClient.setQueryData(['ticket', ticketId], data.data);
      }
      // Don't invalidate anything - let real-time handle updates for other users
    },
  });
}

export function useStopTimer() {
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
      await queryClient.cancelQueries({ queryKey: ['ticket', ticketId] });
      
      const previousTicket = queryClient.getQueryData(['ticket', ticketId]);
      
      // Simple optimistic update for timer only
      queryClient.setQueryData(['ticket', ticketId], (old: any) => {
        if (!old) return old; // Don't update if no data
        return {
          ...old,
          timer_is_running: false,
          timer_started_at: null,
        };
      });
      
      return { previousTicket };
    },
    onError: (err, { ticketId }, context) => {
      if (context?.previousTicket) {
        queryClient.setQueryData(['ticket', ticketId], context.previousTicket);
      }
      toast.error('Failed to stop timer');
    },
    onSuccess: (data, { ticketId }) => {
      toast.success('Timer stopped');
      // Update with server data
      if (data?.data) {
        queryClient.setQueryData(['ticket', ticketId], data.data);
      }
      // Only invalidate time entries to show the new entry
      queryClient.invalidateQueries({ queryKey: ['time-entries', ticketId] });
      // Don't invalidate ticket or tickets - optimistic update handles it
    },
  });
}

/**
 * Delete ticket - simple invalidation, no complex optimistic updates
 */
export function useDeleteTicket() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (ticketId: string) => {
      const response = await fetch(`${API_BASE}/${ticketId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete ticket');
      return response.json();
    },
    onSuccess: () => {
      toast.success('Ticket deleted');
      // Simple invalidation
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: () => {
      toast.error('Failed to delete ticket');
    },
  });
}