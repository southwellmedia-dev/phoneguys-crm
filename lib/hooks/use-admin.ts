'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

// Users
export function useUsers(initialData?: any[]) {
  return useQuery({
    queryKey: ['admin', 'users'],
    queryFn: async () => {
      const response = await fetch('/api/users');
      if (!response.ok) throw new Error('Failed to fetch users');
      const data = await response.json();
      // API returns raw array for users
      return Array.isArray(data) ? data : data.data || [];
    },
    initialData: initialData,
    enabled: !initialData,
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useInviteUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (userData: { email: string; role: string }) => {
      const response = await fetch('/api/admin/users/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      if (!response.ok) throw new Error('Failed to invite user');
      return response.json();
    },
    onSuccess: () => {
      toast.success('User invited successfully');
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
    onError: () => {
      toast.error('Failed to invite user');
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; [key: string]: any }) => {
      const response = await fetch(`/api/admin/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update user');
      return response.json();
    },
    onSuccess: () => {
      toast.success('User updated successfully');
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
    onError: () => {
      toast.error('Failed to update user');
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/admin/users/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete user');
      return response.json();
    },
    onSuccess: () => {
      toast.success('User deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
    onError: () => {
      toast.error('Failed to delete user');
    },
  });
}

// Devices
export function useDevices(initialData?: any[]) {
  return useQuery({
    queryKey: ['admin', 'devices'],
    queryFn: async () => {
      const response = await fetch('/api/admin/devices');
      if (!response.ok) throw new Error('Failed to fetch devices');
      const result = await response.json();
      // API returns { success: true, data: devices }
      return result.data || [];
    },
    initialData: initialData,
    enabled: !initialData,
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useCreateDevice() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (deviceData: any) => {
      const response = await fetch('/api/admin/devices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(deviceData),
      });
      if (!response.ok) throw new Error('Failed to create device');
      return response.json();
    },
    onSuccess: () => {
      toast.success('Device created successfully');
      queryClient.invalidateQueries({ queryKey: ['admin', 'devices'] });
    },
    onError: () => {
      toast.error('Failed to create device');
    },
  });
}

export function useUpdateDevice() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; [key: string]: any }) => {
      const response = await fetch(`/api/admin/devices/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update device');
      return response.json();
    },
    onSuccess: () => {
      toast.success('Device updated successfully');
      queryClient.invalidateQueries({ queryKey: ['admin', 'devices'] });
    },
    onError: () => {
      toast.error('Failed to update device');
    },
  });
}

export function useDeleteDevice() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/admin/devices/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete device');
      return response.json();
    },
    onSuccess: () => {
      toast.success('Device deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['admin', 'devices'] });
    },
    onError: () => {
      toast.error('Failed to delete device');
    },
  });
}

// Services
export function useServices(initialData?: any[]) {
  return useQuery({
    queryKey: ['admin', 'services'],
    queryFn: async () => {
      const start = Date.now();
      const response = await fetch('/api/admin/services');
      
      if (!response.ok) throw new Error('Failed to fetch services');
      const result = await response.json();
      const total = Date.now() - start;
      
      // Only log if slow (over 1 second)
      if (total > 1000) {
        console.warn(`🐌 SLOW SERVICES API: ${total}ms`);
      }
      
      // API returns { success: true, data: services }
      return result.data || [];
    },
    initialData: initialData,
    enabled: !initialData,
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useCreateService() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (serviceData: any) => {
      const response = await fetch('/api/admin/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(serviceData),
      });
      if (!response.ok) throw new Error('Failed to create service');
      return response.json();
    },
    onSuccess: () => {
      toast.success('Service created successfully');
      queryClient.invalidateQueries({ queryKey: ['admin', 'services'] });
    },
    onError: () => {
      toast.error('Failed to create service');
    },
  });
}

export function useUpdateService() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; [key: string]: any }) => {
      const response = await fetch(`/api/admin/services/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update service');
      return response.json();
    },
    onSuccess: () => {
      toast.success('Service updated successfully');
      queryClient.invalidateQueries({ queryKey: ['admin', 'services'] });
    },
    onError: () => {
      toast.error('Failed to update service');
    },
  });
}

export function useDeleteService() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/admin/services/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete service');
      return response.json();
    },
    onSuccess: () => {
      toast.success('Service deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['admin', 'services'] });
    },
    onError: () => {
      toast.error('Failed to delete service');
    },
  });
}

// Media Gallery
export function useMediaGallery(initialData?: any[]) {
  return useQuery({
    queryKey: ['admin', 'media-gallery'],
    queryFn: async () => {
      const response = await fetch('/api/admin/devices/media-gallery');
      if (!response.ok) throw new Error('Failed to fetch media gallery');
      const result = await response.json();
      // API returns { data: images }
      return result.data || [];
    },
    initialData: initialData,
    enabled: !initialData,
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 2, // 2 minutes (media changes more frequently)
  });
}

export function useUploadMedia() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch('/api/admin/media/upload', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) throw new Error('Failed to upload media');
      return response.json();
    },
    onSuccess: () => {
      toast.success('Media uploaded successfully');
      queryClient.invalidateQueries({ queryKey: ['admin', 'media-gallery'] });
    },
    onError: () => {
      toast.error('Failed to upload media');
    },
  });
}

export function useDeleteMedia() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (filename: string) => {
      const response = await fetch('/api/admin/media/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename }),
      });
      if (!response.ok) throw new Error('Failed to delete media');
      return response.json();
    },
    onSuccess: () => {
      toast.success('Media deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['admin', 'media-gallery'] });
    },
    onError: () => {
      toast.error('Failed to delete media');
    },
  });
}