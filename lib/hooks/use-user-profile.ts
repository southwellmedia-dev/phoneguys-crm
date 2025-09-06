import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCustomRealtime } from './use-custom-realtime';
import { toast } from 'sonner';

export interface UserProfile {
  user: any;
  statistics: any;
  performanceMetrics: any;
  workload: any;
  recentActivity: any[];
}

export function useUserProfile(userId: string) {
  const queryClient = useQueryClient();

  // Force cache invalidation for development - remove this later
  React.useEffect(() => {
    queryClient.removeQueries({ queryKey: ['user-profile', userId] });
  }, [queryClient, userId]);

  const query = useQuery({
    queryKey: ['user-profile', userId],
    queryFn: async () => {
      console.log('useUserProfile - Fetching profile for:', userId);
      const response = await fetch(`/api/users/${userId}/profile`);
      console.log('useUserProfile - Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('useUserProfile - Error response:', errorData);
        throw new Error(errorData.error || 'Failed to fetch user profile');
      }
      
      const data = await response.json();
      console.log('useUserProfile - Response data:', data);
      console.log('useUserProfile - Statistics:', data.data?.statistics);
      console.log('useUserProfile - Performance Metrics:', data.data?.performanceMetrics);
      return data.data as UserProfile;
    },
    staleTime: 10 * 1000, // 10 seconds - much shorter for real-time feel
    enabled: !!userId,
  });

  // Set up real-time subscription for user statistics
  useCustomRealtime({
    channel: `user-profile-${userId}`,
    table: 'user_statistics',
    filter: `user_id=eq.${userId}`,
    onUpdate: (payload) => {
      queryClient.setQueryData(['user-profile', userId], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          statistics: payload.new
        };
      });
    }
  });

  // Set up real-time subscription for user activity
  useCustomRealtime({
    channel: `user-activity-${userId}`,
    table: 'user_activity_logs',
    filter: `user_id=eq.${userId}`,
    onInsert: (payload) => {
      queryClient.setQueryData(['user-profile', userId], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          recentActivity: [payload.new, ...(old.recentActivity || [])].slice(0, 10)
        };
      });
    }
  });

  return query;
}

export function useUpdateUserProfile(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: any) => {
      const response = await fetch(`/api/users/${userId}/profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profile', userId] });
      toast.success('Profile updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update profile');
      console.error('Profile update error:', error);
    }
  });
}

export function useUserStatistics(userId: string, timeRange = 7) {
  return useQuery({
    queryKey: ['user-statistics', userId, timeRange],
    queryFn: async () => {
      const response = await fetch(`/api/users/${userId}/statistics?range=${timeRange}`);
      if (!response.ok) {
        throw new Error('Failed to fetch user statistics');
      }
      const data = await response.json();
      return data.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!userId,
  });
}

export function useUserActivity(userId: string, days = 7) {
  return useQuery({
    queryKey: ['user-activity', userId, days],
    queryFn: async () => {
      const response = await fetch(`/api/users/${userId}/activity?days=${days}`);
      if (!response.ok) {
        throw new Error('Failed to fetch user activity');
      }
      const data = await response.json();
      return data.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!userId,
  });
}

export function useRefreshStatistics(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/users/${userId}/statistics`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to refresh statistics');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profile', userId] });
      queryClient.invalidateQueries({ queryKey: ['user-statistics', userId] });
      toast.success('Statistics refreshed successfully');
    },
    onError: (error) => {
      toast.error('Failed to refresh statistics');
      console.error('Statistics refresh error:', error);
    }
  });
}

export function useRoleDashboard() {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ['role-dashboard'],
    queryFn: async () => {
      const response = await fetch('/api/dashboard/role');
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }
      const data = await response.json();
      return data.data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
  });
}