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
  assignedTo?: string;
}, initialData?: Order[]) {
  return useQuery({
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
    initialData,
    // Enable fetching when:
    // 1. No initial data (first load from API)
    // 2. OR we have filters (need to fetch filtered data)
    enabled: !initialData || !!filters,
    refetchOnWindowFocus: false,
    staleTime: filters ? 0 : 1000 * 60 * 5, // No caching when filtering
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