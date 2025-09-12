/**
 * React Query hooks for the Unified Comments System
 * Following our hydration strategy for optimal SSR/client performance
 */

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { 
  Comment,
  CommentEntityType,
  CommentQueryOptions,
  CreateCommentDto,
  CommentVisibility,
  CommentThread
} from '@/lib/types/comment.types';
import { toast } from 'sonner';

/**
 * Hook to fetch comments for an entity
 * Follows our hydration strategy with hasLoadedOnce pattern
 */
export function useComments(
  entityType: CommentEntityType,
  entityId: string,
  options: CommentQueryOptions = {}
) {
  const [isMounted, setIsMounted] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const queryClient = useQueryClient();

  // Track mount state
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const query = useQuery({
    queryKey: ['comments', entityType, entityId, options],
    queryFn: async () => {
      const params = new URLSearchParams({
        entityType,
        entityId,
        ...Object.entries(options).reduce((acc, [key, value]) => {
          if (value !== undefined && value !== null) {
            acc[key] = String(value);
          }
          return acc;
        }, {} as Record<string, string>)
      });

      const response = await fetch(`/api/comments?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch comments');
      }
      const result = await response.json();
      return result.data || [];
    },
    enabled: isMounted && !!entityId, // Only fetch after mount
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    placeholderData: [] // Provide structure
  });

  // Track when we've successfully loaded data at least once
  useEffect(() => {
    if (query.isSuccess && !hasLoadedOnce) {
      setHasLoadedOnce(true);
    }
  }, [query.isSuccess, hasLoadedOnce]);

  // Set up real-time subscription
  useEffect(() => {
    if (!entityId) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`comments-${entityType}-${entityId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'comments',
          filter: `entity_id=eq.${entityId}`
        },
        (payload) => {
          // Only process if it's for the right entity type
          if (payload.new.entity_type !== entityType) return;
          
          // Update cache directly - no loading states
          queryClient.setQueryData(
            ['comments', entityType, entityId, options],
            (old: Comment[] = []) => {
              // Check if comment already exists (prevent duplicates)
              const exists = old.some(c => c.id === payload.new.id);
              if (exists) return old;
              
              // Add new comment to the beginning
              return [payload.new as Comment, ...old];
            }
          );
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'comments',
          filter: `entity_id=eq.${entityId}`
        },
        (payload) => {
          // Only process if it's for the right entity type
          if (payload.new.entity_type !== entityType) return;
          
          queryClient.setQueryData(
            ['comments', entityType, entityId, options],
            (old: Comment[] = []) => {
              return old.map(comment => 
                comment.id === payload.new.id ? payload.new as Comment : comment
              );
            }
          );
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'comments',
          filter: `entity_id=eq.${entityId}`
        },
        (payload) => {
          // Only process if it's for the right entity type
          if (payload.old.entity_type !== entityType) return;
          
          // Handle soft delete - update the comment instead of removing
          queryClient.setQueryData(
            ['comments', entityType, entityId, options],
            (old: Comment[] = []) => {
              return old.map(comment => 
                comment.id === payload.old.id 
                  ? { ...comment, deleted_at: payload.new?.deleted_at || new Date().toISOString() }
                  : comment
              );
            }
          );
        }
      )
      // Subscribe to reaction changes
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'comment_reactions'
        },
        async (payload) => {
          // Fetch the updated comment with reactions
          const response = await fetch(`/api/comments/${payload.new.comment_id}`);
          if (response.ok) {
            const result = await response.json();
            const updatedComment = result.data;
            
            queryClient.setQueryData(
              ['comments', entityType, entityId, options],
              (old: Comment[] = []) => {
                return old.map(comment => 
                  comment.id === updatedComment.id ? updatedComment : comment
                );
              }
            );
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'comment_reactions'
        },
        async (payload) => {
          // Fetch the updated comment with reactions
          const response = await fetch(`/api/comments/${payload.old.comment_id}`);
          if (response.ok) {
            const result = await response.json();
            const updatedComment = result.data;
            
            queryClient.setQueryData(
              ['comments', entityType, entityId, options],
              (old: Comment[] = []) => {
                return old.map(comment => 
                  comment.id === updatedComment.id ? updatedComment : comment
                );
              }
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [entityType, entityId, queryClient, options]);

  return {
    ...query,
    // Show skeleton until we have a definitive answer
    showSkeleton: !hasLoadedOnce || query.isLoading || query.isFetching,
    isInitialLoad: !isMounted,
    hasLoadedOnce
  };
}

/**
 * Hook to fetch a single comment thread
 */
export function useCommentThread(threadId: string) {
  const [isMounted, setIsMounted] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const query = useQuery({
    queryKey: ['comment-thread', threadId],
    queryFn: async () => {
      const response = await fetch(`/api/comments/thread/${threadId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch comment thread');
      }
      const result = await response.json();
      return result.data;
    },
    enabled: isMounted && !!threadId,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false
  });

  useEffect(() => {
    if (query.isSuccess && !hasLoadedOnce) {
      setHasLoadedOnce(true);
    }
  }, [query.isSuccess, hasLoadedOnce]);

  // Real-time updates for thread
  useEffect(() => {
    if (!threadId) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`comment-thread-${threadId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'comments',
          filter: `thread_id=eq.${threadId}`
        },
        (payload) => {
          queryClient.setQueryData(
            ['comment-thread', threadId],
            (old: CommentThread | null) => {
              if (!old) return old;
              return {
                ...old,
                replies: [...old.replies, payload.new as Comment],
                total_replies: old.total_replies + 1
              };
            }
          );
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'comments',
          filter: `thread_id=eq.${threadId}`
        },
        (payload) => {
          queryClient.setQueryData(
            ['comment-thread', threadId],
            (old: CommentThread | null) => {
              if (!old) return old;
              
              // Update in root or replies
              if (old.root.id === payload.new.id) {
                return { ...old, root: payload.new as Comment };
              }
              
              return {
                ...old,
                replies: old.replies.map(reply =>
                  reply.id === payload.new.id ? payload.new as Comment : reply
                )
              };
            }
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [threadId, queryClient]);

  return {
    ...query,
    showSkeleton: !hasLoadedOnce || query.isLoading || query.isFetching,
    hasLoadedOnce
  };
}

/**
 * Hook to create a new comment with optimistic update
 */
export function useCreateComment(
  entityType: CommentEntityType,
  entityId: string
) {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async (data: {
      content: string;
      visibility?: CommentVisibility;
      parentCommentId?: string;
      attachments?: any[];
    }) => {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          entityType,
          entityId,
          content: data.content,
          visibility: data.visibility,
          parentCommentId: data.parentCommentId,
          attachments: data.attachments
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to post comment');
      }

      const result = await response.json();
      return result.data;
    },
    onMutate: async (newComment) => {
      // Cancel any in-flight queries
      await queryClient.cancelQueries({ 
        queryKey: ['comments', entityType, entityId] 
      });

      // Get current user for optimistic update
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Optimistically update with temporary comment
      const optimisticComment: Partial<Comment> = {
        id: `temp-${Date.now()}`,
        entity_type: entityType,
        entity_id: entityId,
        content: newComment.content,
        visibility: newComment.visibility || 'internal',
        user_id: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_pinned: false,
        is_resolved: false,
        parent_comment_id: newComment.parentCommentId || null,
        user: {
          id: user.id,
          email: user.email || '',
          full_name: user.user_metadata?.full_name,
          username: user.user_metadata?.username
        }
      };

      // Get all query caches for this entity's comments
      const cacheKeys = queryClient.getQueryCache().findAll({
        queryKey: ['comments', entityType, entityId],
        type: 'active'
      });

      // Store previous state for all matching queries
      const previousStates: Record<string, any> = {};
      
      cacheKeys.forEach(query => {
        const queryKey = query.queryKey as any[];
        const keyString = JSON.stringify(queryKey);
        previousStates[keyString] = query.state.data;
        
        // Update each matching cache with the optimistic comment
        // Only add to caches that would include this comment based on visibility
        const options = queryKey[3] || {};
        const shouldInclude = !newComment.parentCommentId && // Only root comments
          (!options.parent_comment_id || options.parent_comment_id === null) &&
          (!options.visibility || 
            !Array.isArray(options.visibility) || 
            options.visibility.includes(newComment.visibility || 'internal'));
        
        if (shouldInclude) {
          queryClient.setQueryData(
            queryKey,
            (old: Comment[] = []) => [optimisticComment as Comment, ...old]
          );
        }
      });

      return { previousStates };
    },
    onError: (err, newComment, context) => {
      // Rollback on error
      if (context?.previousStates) {
        Object.entries(context.previousStates).forEach(([keyString, data]) => {
          const queryKey = JSON.parse(keyString);
          queryClient.setQueryData(queryKey, data);
        });
      }
      toast.error(err.message || 'Failed to post comment');
    },
    onSuccess: (data) => {
      // Update all relevant caches with the actual data from server
      const cacheKeys = queryClient.getQueryCache().findAll({
        queryKey: ['comments', entityType, entityId],
        type: 'active'
      });
      
      cacheKeys.forEach(query => {
        const queryKey = query.queryKey as any[];
        const options = queryKey[3] || {};
        
        // Check if this comment should be included in this cache
        const shouldInclude = !data.parent_comment_id && // Only root comments
          (!options.parent_comment_id || options.parent_comment_id === null) &&
          (!options.visibility || 
            !Array.isArray(options.visibility) || 
            options.visibility.includes(data.visibility || 'internal'));
        
        if (shouldInclude) {
          queryClient.setQueryData(
            queryKey,
            (old: Comment[] = []) => {
              // Remove the optimistic comment and add the real one
              const filtered = old.filter(c => !c.id.startsWith('temp-'));
              // Check if comment already exists (from real-time)
              const exists = filtered.some(c => c.id === data.id);
              if (exists) {
                return filtered;
              }
              return [data, ...filtered];
            }
          );
        }
      });
      
      toast.success('Comment posted');
    }
  });
}

/**
 * Hook to update a comment
 */
export function useUpdateComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      commentId, 
      content 
    }: { 
      commentId: string; 
      content: string;
    }) => {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update comment');
      }

      const result = await response.json();
      return result.data;
    },
    onMutate: async ({ commentId, content }) => {
      // Cancel queries
      await queryClient.cancelQueries({ 
        queryKey: ['comments'] 
      });

      // Update all caches that might contain this comment
      const caches = queryClient.getQueriesData({ 
        queryKey: ['comments'] 
      });

      const previousData: any[] = [];

      caches.forEach(([queryKey, data]) => {
        previousData.push([queryKey, data]);
        
        if (Array.isArray(data)) {
          queryClient.setQueryData(queryKey, (old: Comment[] = []) => 
            old.map(comment => 
              comment.id === commentId 
                ? { ...comment, content, edited_at: new Date().toISOString() }
                : comment
            )
          );
        }
      });

      return { previousData };
    },
    onError: (err, variables, context) => {
      // Rollback all caches
      context?.previousData?.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
      toast.error(err.message || 'Failed to update comment');
    },
    onSuccess: () => {
      toast.success('Comment updated');
    }
  });
}

/**
 * Hook to delete a comment
 */
export function useDeleteComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (commentId: string) => {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete comment');
      }

      return commentId;
    },
    onMutate: async (commentId) => {
      // Cancel queries
      await queryClient.cancelQueries({ 
        queryKey: ['comments'] 
      });

      // Soft delete in all caches
      const caches = queryClient.getQueriesData({ 
        queryKey: ['comments'] 
      });

      const previousData: any[] = [];

      caches.forEach(([queryKey, data]) => {
        previousData.push([queryKey, data]);
        
        if (Array.isArray(data)) {
          queryClient.setQueryData(queryKey, (old: Comment[] = []) => 
            old.map(comment => 
              comment.id === commentId 
                ? { ...comment, deleted_at: new Date().toISOString() }
                : comment
            )
          );
        }
      });

      return { previousData };
    },
    onError: (err, variables, context) => {
      // Rollback all caches
      context?.previousData?.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
      toast.error(err.message || 'Failed to delete comment');
    },
    onSuccess: () => {
      toast.success('Comment deleted');
    }
  });
}

/**
 * Hook to add a reaction to a comment
 */
export function useAddReaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      commentId, 
      reaction 
    }: { 
      commentId: string; 
      reaction: string;
    }) => {
      const response = await fetch(`/api/comments/${commentId}/reactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reaction })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add reaction');
      }

      const result = await response.json();
      return result.data;
    },
    onSuccess: (data, variables) => {
      // Immediately update the cache with the new reaction
      const cacheKeys = queryClient.getQueryCache().findAll({
        queryKey: ['comments'],
        type: 'active'
      });
      
      cacheKeys.forEach(query => {
        const queryKey = query.queryKey as any[];
        queryClient.setQueryData(queryKey, (old: Comment[] = []) => {
          return old.map(comment => {
            if (comment.id === variables.commentId) {
              return {
                ...comment,
                reactions: [...(comment.reactions || []), data]
              };
            }
            return comment;
          });
        });
      });
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to add reaction');
    }
  });
}

/**
 * Hook to remove a reaction from a comment
 */
export function useRemoveReaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      commentId, 
      reaction 
    }: { 
      commentId: string; 
      reaction: string;
    }) => {
      const response = await fetch(`/api/comments/${commentId}/reactions`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reaction })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to remove reaction');
      }

      return true;
    },
    onSuccess: (_, variables) => {
      // Immediately update the cache to remove the reaction
      const cacheKeys = queryClient.getQueryCache().findAll({
        queryKey: ['comments'],
        type: 'active'
      });
      
      cacheKeys.forEach(query => {
        const queryKey = query.queryKey as any[];
        queryClient.setQueryData(queryKey, (old: Comment[] = []) => {
          return old.map(comment => {
            if (comment.id === variables.commentId) {
              return {
                ...comment,
                reactions: (comment.reactions || []).filter(
                  r => !(r.reaction === variables.reaction && r.user_id === comment.user_id)
                )
              };
            }
            return comment;
          });
        });
      });
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to remove reaction');
    }
  });
}

/**
 * Hook to get comment statistics
 */
export function useCommentStats(
  entityType: CommentEntityType,
  entityId: string
) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return useQuery({
    queryKey: ['comment-stats', entityType, entityId],
    queryFn: async () => {
      const params = new URLSearchParams({
        entityType,
        entityId
      });

      const response = await fetch(`/api/comments/stats?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch comment stats');
      }
      const result = await response.json();
      return result.data;
    },
    enabled: isMounted && !!entityId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: false
  });
}

/**
 * Hook to mark comments as read
 */
export function useMarkCommentsAsRead() {
  return useMutation({
    mutationFn: async (commentIds: string[]) => {
      const response = await fetch('/api/comments/mark-read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ commentIds })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to mark comments as read');
      }

      return true;
    },
    onError: (err) => {
      console.error('Failed to mark comments as read:', err);
    }
  });
}