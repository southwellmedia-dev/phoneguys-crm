'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { InternalNotificationWithUser } from '@/lib/types/internal-notification.types';
import { toast } from 'sonner';
import { useEffect, useRef, useState } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';

interface UseInternalNotificationsOptions {
  enabled?: boolean;
  unreadOnly?: boolean;
  limit?: number;
}

export function useInternalNotifications(options: UseInternalNotificationsOptions = {}) {
  const { enabled = true, unreadOnly = false, limit } = options;
  const queryClient = useQueryClient();
  const previousUnreadCountRef = useRef<number | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Follow hydration strategy and get user ID
  useEffect(() => {
    setIsMounted(true);
    
    // Get user ID from Supabase client
    const getUserId = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        console.log('🔑 Auth user ID:', user.id);
        console.log('🔑 User email:', user.email);
        setUserId(user.id);
      }
    };
    
    getUserId();
  }, []);

  // Query for fetching notifications
  const notificationsQuery = useQuery({
    queryKey: ['internal-notifications', userId, { unreadOnly, limit }],
    queryFn: async () => {
      if (!userId) return [];
      
      const params = new URLSearchParams();
      if (unreadOnly) params.append('unreadOnly', 'true');
      if (limit) params.append('limit', limit.toString());
      
      const response = await fetch(`/api/internal-notifications?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }
      
      const { data } = await response.json();
      return data as InternalNotificationWithUser[];
    },
    enabled: enabled && !!userId && isMounted,
    staleTime: 30 * 1000, // 30 seconds
  });

  // Query for unread count
  const unreadCountQuery = useQuery({
    queryKey: ['internal-notifications-count', userId],
    queryFn: async () => {
      if (!userId) return 0;
      
      const response = await fetch('/api/internal-notifications/unread-count');
      if (!response.ok) {
        throw new Error('Failed to fetch unread count');
      }
      
      const { count } = await response.json();
      return count as number;
    },
    enabled: enabled && !!userId && isMounted,
    staleTime: 30 * 1000, // 30 seconds
  });

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await fetch(`/api/internal-notifications/${notificationId}`, {
        method: 'PATCH',
      });
      
      if (!response.ok) {
        throw new Error('Failed to mark notification as read');
      }
      
      const { data } = await response.json();
      return data;
    },
    onMutate: async (notificationId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['internal-notifications', userId] });
      await queryClient.cancelQueries({ queryKey: ['internal-notifications-count', userId] });

      // Snapshot the previous values
      const previousNotifications = queryClient.getQueryData(['internal-notifications', userId]);
      const previousCount = queryClient.getQueryData(['internal-notifications-count', userId]);

      // Optimistically update notifications
      queryClient.setQueriesData(
        { queryKey: ['internal-notifications', userId] },
        (old: InternalNotificationWithUser[] | undefined) => {
          if (!old) return old;
          return old.map(notification =>
            notification.id === notificationId
              ? { ...notification, is_read: true, read_at: new Date().toISOString() }
              : notification
          );
        }
      );

      // Optimistically update count
      queryClient.setQueryData(['internal-notifications-count', userId], (old: number) => 
        Math.max(0, (old || 0) - 1)
      );

      return { previousNotifications, previousCount };
    },
    onError: (err, notificationId, context) => {
      // Rollback on error
      if (context?.previousNotifications) {
        queryClient.setQueriesData(
          { queryKey: ['internal-notifications', userId] },
          context.previousNotifications
        );
      }
      if (context?.previousCount !== undefined) {
        queryClient.setQueryData(['internal-notifications-count', userId], context.previousCount);
      }
      toast.error('Failed to mark notification as read');
    },
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error('User ID not available');
      
      const response = await fetch('/api/internal-notifications/mark-all-read', {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Failed to mark all notifications as read');
      }
      
      return response.json();
    },
    onMutate: async () => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['internal-notifications', userId] });
      await queryClient.cancelQueries({ queryKey: ['internal-notifications-count', userId] });

      // Snapshot the previous values
      const previousNotifications = queryClient.getQueryData(['internal-notifications', userId]);
      const previousCount = queryClient.getQueryData(['internal-notifications-count', userId]);

      // Optimistically update all notifications
      queryClient.setQueriesData(
        { queryKey: ['internal-notifications', userId] },
        (old: InternalNotificationWithUser[] | undefined) => {
          if (!old) return old;
          return old.map(notification => ({
            ...notification,
            is_read: true,
            read_at: notification.read_at || new Date().toISOString()
          }));
        }
      );

      // Optimistically update count to 0
      queryClient.setQueryData(['internal-notifications-count', userId], 0);

      return { previousNotifications, previousCount };
    },
    onError: (err, _, context) => {
      // Rollback on error
      if (context?.previousNotifications) {
        queryClient.setQueriesData(
          { queryKey: ['internal-notifications', userId] },
          context.previousNotifications
        );
      }
      if (context?.previousCount !== undefined) {
        queryClient.setQueryData(['internal-notifications-count', userId], context.previousCount);
      }
      toast.error('Failed to mark all notifications as read');
    },
  });

  // Real-time subscription for notifications
  useEffect(() => {
    if (!userId || !isMounted) return;

    const supabase = createClient();
    const channel: RealtimeChannel = supabase.channel(`internal-notifications-${userId}`);

    console.log('🔌 Setting up real-time subscription:', {
      userId,
      unreadOnly,
      limit,
      queryKey: ['internal-notifications', userId, { unreadOnly, limit }]
    });

    channel
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'internal_notifications',
        filter: `user_id=eq.${userId}`
      }, (payload) => {
        console.log('🔔 Real-time INSERT received:', payload);
        
        // Update ALL notification queries for this user, regardless of options
        // This ensures we catch all variations
        const cache = queryClient.getQueryCache();
        const queries = cache.findAll({
          queryKey: ['internal-notifications', userId],
          exact: false // This will match any query that starts with these keys
        });
        
        console.log('📝 Found queries to update:', queries.length);
        
        queries.forEach(query => {
          console.log('📝 Updating query:', query.queryKey);
          queryClient.setQueryData(query.queryKey, (old: InternalNotificationWithUser[] | undefined) => {
            if (!old) return [payload.new as InternalNotificationWithUser];
            return [payload.new as InternalNotificationWithUser, ...old];
          });
        });

        // Update unread count
        queryClient.setQueryData(['internal-notifications-count', userId], (old: number) => {
          return (old || 0) + 1;
        });

        // Show toast notification for new notifications
        const notification = payload.new as InternalNotificationWithUser;
        toast.info(notification.title, {
          description: notification.message,
          action: notification.action_url ? {
            label: 'View',
            onClick: () => {
              window.location.href = notification.action_url!;
            }
          } : undefined,
        });
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'internal_notifications',
        filter: `user_id=eq.${userId}`
      }, (payload) => {
        // Update ALL notification queries for this user
        const cache = queryClient.getQueryCache();
        const queries = cache.findAll({
          queryKey: ['internal-notifications', userId],
          exact: false
        });
        
        queries.forEach(query => {
          queryClient.setQueryData(query.queryKey, (old: InternalNotificationWithUser[] | undefined) => {
            if (!old) return old;
            return old.map(notification =>
              notification.id === payload.new.id
                ? payload.new as InternalNotificationWithUser
                : notification
            );
          });
        });

        // Update count if read status changed
        const oldNotification = payload.old as InternalNotificationWithUser;
        const newNotification = payload.new as InternalNotificationWithUser;
        
        if (!oldNotification.is_read && newNotification.is_read) {
          queryClient.setQueryData(['internal-notifications-count', userId], (old: number) => 
            Math.max(0, (old || 0) - 1)
          );
        } else if (oldNotification.is_read && !newNotification.is_read) {
          queryClient.setQueryData(['internal-notifications-count', userId], (old: number) => 
            (old || 0) + 1
          );
        }
      })
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'internal_notifications',
        filter: `user_id=eq.${userId}`
      }, (payload) => {
        // Remove notification from ALL queries for this user
        const cache = queryClient.getQueryCache();
        const queries = cache.findAll({
          queryKey: ['internal-notifications', userId],
          exact: false
        });
        
        queries.forEach(query => {
          queryClient.setQueryData(query.queryKey, (old: InternalNotificationWithUser[] | undefined) => {
            if (!old) return old;
            return old.filter(notification => notification.id !== payload.old.id);
          });
        });

        // Update count if it was unread
        const deletedNotification = payload.old as InternalNotificationWithUser;
        if (!deletedNotification.is_read) {
          queryClient.setQueryData(['internal-notifications-count', userId], (old: number) => 
            Math.max(0, (old || 0) - 1)
          );
        }
      })
      .subscribe((status, error) => {
        console.log('📡 Subscription status:', status);
        if (error) {
          console.error('Notification subscription error:', error);
        }
        if (status === 'SUBSCRIBED') {
          console.log('✅ Successfully subscribed to notifications for user:', userId);
        }
      });

    // Cleanup subscription
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, isMounted, queryClient]);

  // Track when data has loaded successfully (following hydration strategy)
  useEffect(() => {
    if (notificationsQuery.isSuccess && !hasLoadedOnce) {
      setHasLoadedOnce(true);
    }
  }, [notificationsQuery.isSuccess, hasLoadedOnce]);

  // Play sound for new notifications
  useEffect(() => {
    const currentUnreadCount = unreadCountQuery.data || 0;
    
    if (previousUnreadCountRef.current !== null && 
        currentUnreadCount > previousUnreadCountRef.current) {
      // Play notification sound
      const audio = new Audio('/sounds/notification.mp3');
      audio.volume = 0.5;
      audio.play().catch(() => {
        // Ignore errors if sound can't play (e.g., autoplay policy)
      });
    }
    
    previousUnreadCountRef.current = currentUnreadCount;
  }, [unreadCountQuery.data]);

  return {
    notifications: notificationsQuery.data || [],
    unreadCount: unreadCountQuery.data || 0,
    isLoading: notificationsQuery.isLoading || unreadCountQuery.isLoading,
    // Following hydration strategy - show skeleton until we definitively know data state
    showSkeleton: !hasLoadedOnce || notificationsQuery.isLoading || notificationsQuery.isFetching,
    error: notificationsQuery.error || unreadCountQuery.error,
    markAsRead: markAsReadMutation.mutate,
    markAllAsRead: markAllAsReadMutation.mutate,
    isMarkingAsRead: markAsReadMutation.isPending,
    isMarkingAllAsRead: markAllAsReadMutation.isPending,
    refetch: () => {
      notificationsQuery.refetch();
      unreadCountQuery.refetch();
    }
  };
}