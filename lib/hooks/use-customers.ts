'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { Customer } from '@/lib/types/customer';
import { toast } from 'sonner';
import { useRealtime } from './use-realtime';

const API_BASE = '/api/customers';

export function useCustomers(search?: string, initialData?: Customer[]) {
  const [isMounted, setIsMounted] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const query = useQuery({
    queryKey: ['customers', search],
    queryFn: async () => {
      const params = search ? `?search=${encodeURIComponent(search)}` : '';
      const response = await fetch(`${API_BASE}${params}`);
      if (!response.ok) throw new Error('Failed to fetch customers');
      const result = await response.json();
      // Handle both paginated and non-paginated responses
      return result.data || result;
    },
    enabled: isMounted, // 🔑 KEY: Only fetch after mount
    refetchOnWindowFocus: false,
    staleTime: search ? 0 : 1000 * 60 * 5, // No caching when searching
    placeholderData: initialData, // 🔑 KEY: Provide structure
    initialData: initialData && initialData.length > 0 ? initialData : undefined
  });

  // 🔑 KEY: Track when we've successfully loaded data at least once
  useEffect(() => {
    if (query.isSuccess && !hasLoadedOnce) {
      setHasLoadedOnce(true);
    }
  }, [query.isSuccess, hasLoadedOnce]);

  // Use the real-time service for customers subscription
  useRealtime(['customers']);

  return {
    ...query,
    // 🔑 KEY: Show skeleton until we have a definitive answer
    showSkeleton: !hasLoadedOnce || query.isLoading || query.isFetching,
    hasLoadedOnce
  };
}

export function useCustomer(id?: string, initialData?: Customer) {
  const [isMounted, setIsMounted] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const query = useQuery({
    queryKey: ['customer', id],
    queryFn: async () => {
      if (!id) throw new Error('Customer ID is required');
      const response = await fetch(`${API_BASE}/${id}`);
      if (!response.ok) throw new Error('Failed to fetch customer');
      const result = await response.json();
      // Handle API response wrapper
      return result.data || result;
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

  // The RealtimeService already handles individual customer updates
  // through the main customers subscription

  return {
    ...query,
    showSkeleton: !hasLoadedOnce || query.isLoading || query.isFetching,
    hasLoadedOnce
  };
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
      
      // Immediately add to cache for instant feedback
      queryClient.setQueriesData(
        { queryKey: ['customers'], exact: false },
        (old: any) => {
          // Handle both array and wrapped responses
          if (Array.isArray(old)) {
            return [data, ...old];
          } else if (old?.data && Array.isArray(old.data)) {
            return {
              ...old,
              data: [data, ...old.data]
            };
          }
          return old;
        }
      );
      
      // Set individual customer data
      if (data.id) {
        queryClient.setQueryData(['customer', data.id], data);
      }
      
      // Real-time will handle any further updates
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
      // Cancel any in-flight queries
      await queryClient.cancelQueries({ queryKey: ['customer', id] });
      await queryClient.cancelQueries({ queryKey: ['customers'] });
      
      // Snapshot previous values
      const previousCustomer = queryClient.getQueryData(['customer', id]);
      const previousCustomers = queryClient.getQueriesData({ queryKey: ['customers'] });
      
      // Optimistically update individual customer
      queryClient.setQueryData(['customer', id], (old: any) => ({
        ...old,
        ...data,
        updated_at: new Date().toISOString()
      }));
      
      // Optimistically update all customer lists
      queryClient.setQueriesData(
        { queryKey: ['customers'], exact: false },
        (old: any) => {
          // Handle both array and wrapped responses
          if (Array.isArray(old)) {
            return old.map(customer => 
              customer.id === id ? { ...customer, ...data, updated_at: new Date().toISOString() } : customer
            );
          } else if (old?.data && Array.isArray(old.data)) {
            return {
              ...old,
              data: old.data.map((customer: Customer) => 
                customer.id === id ? { ...customer, ...data, updated_at: new Date().toISOString() } : customer
              )
            };
          }
          return old;
        }
      );
      
      return { previousCustomer, previousCustomers };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousCustomer) {
        queryClient.setQueryData(['customer', variables.id], context.previousCustomer);
      }
      if (context?.previousCustomers) {
        context.previousCustomers.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      toast.error('Failed to update customer');
    },
    onSuccess: () => {
      toast.success('Customer updated successfully');
      // Real-time will handle the final update
    },
  });
}

export function useCustomerDevices(customerId?: string, initialData?: any[]) {
  const [isMounted, setIsMounted] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const query = useQuery({
    queryKey: ['customer-devices', customerId],
    queryFn: async () => {
      if (!customerId) throw new Error('Customer ID is required');
      const response = await fetch(`${API_BASE}/${customerId}/devices`);
      if (!response.ok) throw new Error('Failed to fetch customer devices');
      return response.json();
    },
    enabled: isMounted && !!customerId, // 🔑 KEY: Only fetch after mount
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
    placeholderData: initialData || [], // 🔑 KEY: Provide structure
    initialData: initialData && initialData.length > 0 ? initialData : undefined
  });

  // 🔑 KEY: Track when we've successfully loaded data at least once
  useEffect(() => {
    if (query.isSuccess && !hasLoadedOnce) {
      setHasLoadedOnce(true);
    }
  }, [query.isSuccess, hasLoadedOnce]);

  return {
    ...query,
    showSkeleton: !hasLoadedOnce || query.isLoading || query.isFetching,
    hasLoadedOnce
  };
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
      const response = await fetch(`${API_BASE}/${customerId}/cascade-delete`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete customer');
      return response.json();
    },
    onMutate: async (customerId) => {
      // Cancel any in-flight queries
      await queryClient.cancelQueries({ queryKey: ['customers'] });
      await queryClient.cancelQueries({ queryKey: ['customer', customerId] });
      
      // Snapshot previous values
      const previousCustomers = queryClient.getQueriesData({ queryKey: ['customers'] });
      const previousCustomer = queryClient.getQueryData(['customer', customerId]);
      
      // Optimistically remove from all customer lists
      queryClient.setQueriesData(
        { queryKey: ['customers'], exact: false },
        (old: any) => {
          // Handle both array and wrapped responses
          if (Array.isArray(old)) {
            return old.filter(customer => customer.id !== customerId);
          } else if (old?.data && Array.isArray(old.data)) {
            return {
              ...old,
              data: old.data.filter((customer: Customer) => customer.id !== customerId)
            };
          }
          return old;
        }
      );
      
      // Remove individual customer query
      queryClient.removeQueries({ queryKey: ['customer', customerId] });
      
      return { previousCustomers, previousCustomer };
    },
    onError: (err, customerId, context) => {
      // Rollback on error
      if (context?.previousCustomers) {
        context.previousCustomers.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      if (context?.previousCustomer) {
        queryClient.setQueryData(['customer', customerId], context.previousCustomer);
      }
      toast.error('Failed to delete customer');
    },
    onSuccess: () => {
      toast.success('Customer deleted successfully');
      // Real-time will handle the final update
    },
  });
}