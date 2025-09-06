'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Customer } from '@/lib/types/customer';
import { toast } from 'sonner';

const API_BASE = '/api/customers';

export function useCustomers(search?: string, initialData?: Customer[]) {
  return useQuery({
    queryKey: ['customers', search],
    queryFn: async () => {
      const params = search ? `?search=${encodeURIComponent(search)}` : '';
      const response = await fetch(`${API_BASE}${params}`);
      if (!response.ok) throw new Error('Failed to fetch customers');
      const result = await response.json();
      // Handle both paginated and non-paginated responses
      return result.data || result;
    },
    initialData,
    enabled: !initialData, // Only fetch if no initial data provided
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useCustomer(id?: string, initialData?: Customer) {
  return useQuery({
    queryKey: ['customer', id],
    queryFn: async () => {
      if (!id) throw new Error('Customer ID is required');
      const response = await fetch(`${API_BASE}/${id}`);
      if (!response.ok) throw new Error('Failed to fetch customer');
      const result = await response.json();
      // Handle API response wrapper
      return result.data || result;
    },
    initialData,
    enabled: !!id && !initialData, // Only fetch if no initial data provided
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useCustomerHistory(id?: string) {
  return useQuery({
    queryKey: ['customer-history', id],
    queryFn: async () => {
      if (!id) throw new Error('Customer ID is required');
      const response = await fetch(`${API_BASE}/${id}/history`);
      if (!response.ok) throw new Error('Failed to fetch customer history');
      return response.json();
    },
    enabled: !!id,
  });
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (customer: Partial<Customer>) => {
      const response = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customer),
      });
      if (!response.ok) throw new Error('Failed to create customer');
      return response.json();
    },
    onSuccess: (data) => {
      toast.success('Customer created successfully');
      // Real-time will handle the cache update
    },
    onError: () => {
      toast.error('Failed to create customer');
    },
  });
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Customer> & { id: string }) => {
      const response = await fetch(`${API_BASE}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update customer');
      return response.json();
    },
    onMutate: async ({ id, ...data }) => {
      await queryClient.cancelQueries({ queryKey: ['customer', id] });
      const previousCustomer = queryClient.getQueryData(['customer', id]);
      
      queryClient.setQueryData(['customer', id], (old: any) => ({
        ...old,
        ...data,
      }));
      
      return { previousCustomer };
    },
    onError: (err, variables, context) => {
      if (context?.previousCustomer) {
        queryClient.setQueryData(['customer', variables.id], context.previousCustomer);
      }
      toast.error('Failed to update customer');
    },
    onSuccess: (data, { id, ...updatedData }) => {
      toast.success('Customer updated successfully');
      
      // Update all customer lists
      queryClient.setQueriesData(
        { queryKey: ['customers'], exact: false },
        (old: Customer[] = []) => {
          return old.map(customer => 
            customer.id === id ? { ...customer, ...updatedData } : customer
          );
        }
      );
    },
  });
}

export function useCustomerDevices(customerId?: string, initialData?: any[]) {
  return useQuery({
    queryKey: ['customer-devices', customerId],
    queryFn: async () => {
      if (!customerId) throw new Error('Customer ID is required');
      const response = await fetch(`${API_BASE}/${customerId}/devices`);
      if (!response.ok) throw new Error('Failed to fetch customer devices');
      return response.json();
    },
    initialData,
    enabled: !!customerId && !initialData, // Only fetch if no initial data provided
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useAddCustomerDevice() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ customerId, device }: { customerId: string; device: any }) => {
      const response = await fetch(`${API_BASE}/${customerId}/devices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(device),
      });
      if (!response.ok) throw new Error('Failed to add device');
      return response.json();
    },
    onSuccess: (data, { customerId }) => {
      toast.success('Device added successfully');
      
      // Add device to cache
      queryClient.setQueryData(['customer-devices', customerId], (old: any[] = []) => {
        return [...old, data];
      });
    },
    onError: () => {
      toast.error('Failed to add device');
    },
  });
}

export function useUpdateCustomerDevice() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      customerId, 
      deviceId, 
      device 
    }: { 
      customerId: string; 
      deviceId: string; 
      device: any;
    }) => {
      const response = await fetch(`${API_BASE}/${customerId}/devices/${deviceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(device),
      });
      if (!response.ok) throw new Error('Failed to update device');
      return response.json();
    },
    onSuccess: (data, { customerId, deviceId }) => {
      toast.success('Device updated successfully');
      
      // Update device in cache
      queryClient.setQueryData(['customer-devices', customerId], (old: any[] = []) => {
        return old.map(device => 
          device.id === deviceId ? { ...device, ...data } : device
        );
      });
    },
    onError: () => {
      toast.error('Failed to update device');
    },
  });
}

export function useDeleteCustomerDevice() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      customerId, 
      deviceId 
    }: { 
      customerId: string; 
      deviceId: string; 
    }) => {
      const response = await fetch(`${API_BASE}/${customerId}/devices/${deviceId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete device');
      return response.json();
    },
    onSuccess: (_, { customerId, deviceId }) => {
      toast.success('Device deleted successfully');
      
      // Remove device from cache
      queryClient.setQueryData(['customer-devices', customerId], (old: any[] = []) => {
        return old.filter(device => device.id !== deviceId);
      });
    },
    onError: () => {
      toast.error('Failed to delete device');
    },
  });
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (customerId: string) => {
      const response = await fetch(`${API_BASE}/${customerId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete customer');
      return response.json();
    },
    onSuccess: (data, customerId) => {
      toast.success('Customer deleted successfully');
      
      // Remove from all customer lists
      queryClient.setQueriesData(
        { queryKey: ['customers'], exact: false },
        (old: Customer[] = []) => {
          return old.filter(customer => customer.id !== customerId);
        }
      );
      
      // Remove individual customer query
      queryClient.removeQueries({ queryKey: ['customer', customerId] });
    },
    onError: () => {
      toast.error('Failed to delete customer');
    },
  });
}