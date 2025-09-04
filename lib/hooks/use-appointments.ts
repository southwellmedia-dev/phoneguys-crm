'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export interface Appointment {
  id: string;
  date: string;
  time_slot: string;
  customer_id: string;
  repair_ticket_id?: string | null;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
  created_at: string;
  updated_at: string;
  customer?: any;
  repair_ticket?: any;
}

const API_BASE = '/api/appointments';

export function useAppointments(filters?: {
  date?: string;
  status?: string;
  customerId?: string;
}, initialData?: any[]) {
  return useQuery({
    queryKey: ['appointments', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.date) params.append('date', filters.date);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.customerId) params.append('customerId', filters.customerId);
      
      const response = await fetch(`${API_BASE}?${params}`);
      if (!response.ok) throw new Error('Failed to fetch appointments');
      return response.json() as Promise<Appointment[]>;
    },
    initialData,
    enabled: !initialData, // Only fetch if no initial data
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useAppointment(id?: string, initialData?: any) {
  return useQuery({
    queryKey: ['appointment', id],
    queryFn: async () => {
      if (!id) throw new Error('Appointment ID is required');
      const response = await fetch(`${API_BASE}/${id}`);
      if (!response.ok) throw new Error('Failed to fetch appointment');
      return response.json() as Promise<Appointment>;
    },
    initialData,
    enabled: !!id && !initialData, // Only fetch if no initial data provided
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useCreateAppointment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (appointment: Partial<Appointment>) => {
      const response = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(appointment),
      });
      if (!response.ok) throw new Error('Failed to create appointment');
      return response.json();
    },
    onSuccess: () => {
      toast.success('Appointment created successfully');
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
    onError: () => {
      toast.error('Failed to create appointment');
    },
  });
}

export function useUpdateAppointment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Appointment> & { id: string }) => {
      const response = await fetch(`${API_BASE}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update appointment');
      return response.json();
    },
    onMutate: async ({ id, ...data }) => {
      await queryClient.cancelQueries({ queryKey: ['appointment', id] });
      const previousAppointment = queryClient.getQueryData(['appointment', id]);
      
      queryClient.setQueryData(['appointment', id], (old: any) => ({
        ...old,
        ...data,
      }));
      
      return { previousAppointment };
    },
    onError: (err, variables, context) => {
      if (context?.previousAppointment) {
        queryClient.setQueryData(['appointment', variables.id], context.previousAppointment);
      }
      toast.error('Failed to update appointment');
    },
    onSuccess: () => {
      toast.success('Appointment updated successfully');
    },
    onSettled: (_, __, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['appointment', id] });
    },
  });
}

export function useDeleteAppointment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`${API_BASE}/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete appointment');
      return response.json();
    },
    onSuccess: () => {
      toast.success('Appointment deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
    onError: () => {
      toast.error('Failed to delete appointment');
    },
  });
}