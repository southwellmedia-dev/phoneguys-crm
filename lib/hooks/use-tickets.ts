'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RepairTicketWithRelations } from '@/lib/types/repair-ticket';
import { Order } from '@/components/orders/orders-columns';
import { RepairStatus } from '@/components/orders/status-badge';
import { toast } from 'sonner';

const API_BASE = '/api/orders';

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
      }));
      
      return orders;
    },
    initialData,
    enabled: !initialData, // Only fetch if no initial data
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useTicket(id?: string, initialData?: RepairTicketWithRelations) {
  return useQuery({
    queryKey: ['ticket', id],
    queryFn: async () => {
      if (!id) throw new Error('Ticket ID is required');
      const response = await fetch(`${API_BASE}/${id}`);
      if (!response.ok) throw new Error('Failed to fetch ticket');
      return response.json() as Promise<RepairTicketWithRelations>;
    },
    initialData,
    enabled: !!id && !initialData, // Only fetch if no initial data provided
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
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
    onSuccess: () => {
      toast.success('Status updated successfully');
    },
    onSettled: (_, __, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['ticket', id] });
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
    onSuccess: () => {
      toast.success('Timer started');
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
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
    onSuccess: () => {
      toast.success('Timer stopped');
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
    },
    onError: () => {
      toast.error('Failed to stop timer');
    },
  });
}