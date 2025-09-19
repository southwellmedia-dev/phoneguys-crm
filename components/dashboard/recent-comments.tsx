'use client';

import React, { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  MessageCircle,
  Eye,
  EyeOff,
  Pin,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  ChevronRight,
  MessageSquare
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import type { RecentComment } from '@/app/api/comments/recent/route';

interface RecentCommentsProps {
  limit?: number;
  className?: string;
  showFilters?: boolean;
  compact?: boolean;
}

const visibilityIcons = {
  public: <Eye className="h-3 w-3" />,
  internal: <EyeOff className="h-3 w-3" />,
  private: <EyeOff className="h-3 w-3" />
};

const visibilityColors = {
  public: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  internal: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  private: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
};

export function RecentComments({ 
  limit = 10, 
  className, 
  showFilters = false,
  compact = false 
}: RecentCommentsProps) {
  const queryClient = useQueryClient();
  const [visibilityFilter, setVisibilityFilter] = React.useState<string | null>(null);

  // Fetch comments from the API
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['recent-comments', limit, visibilityFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: limit.toString() });
      if (visibilityFilter) {
        params.append('visibility', visibilityFilter);
      }
      
      const response = await fetch(`/api/comments/recent?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch recent comments');
      }
      const result = await response.json();
      return result.data as RecentComment[];
    },
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000 // Refresh every minute
  });

  // Set up real-time subscription for new comments
  useEffect(() => {
    const supabase = createClient();
    
    // Subscribe to comments table
    const commentsChannel = supabase
      .channel('recent-comments')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'comments'
        },
        () => {
          // Refresh when new comment is added
          refetch();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ticket_notes'
        },
        () => {
          // Refresh when new ticket note is added
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(commentsChannel);
    };
  }, [refetch]);

  const comments = data || [];

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Recent Comments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-start gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Recent Comments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <AlertCircle className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
            <p>Failed to load comments</p>
            <Button onClick={() => refetch()} variant="outline" size="sm" className="mt-2">
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Recent Comments
          </CardTitle>
          <div className="flex items-center gap-2">
            {showFilters && (
              <select
                value={visibilityFilter || ''}
                onChange={(e) => setVisibilityFilter(e.target.value || null)}
                className="text-sm border rounded-md px-2 py-1"
              >
                <option value="">All Comments</option>
                <option value="public">Public</option>
                <option value="internal">Internal</option>
              </select>
            )}
            <Button
              onClick={() => refetch()}
              variant="ghost"
              size="sm"
              className="h-8 px-2"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className={cn(
          "w-full",
          compact ? "h-[300px]" : "h-[500px]"
        )}>
          {comments.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No recent comments</p>
              <p className="text-sm mt-1">User comments on tickets and appointments will appear here</p>
              <p className="text-xs mt-2 opacity-70">System notifications are filtered out</p>
            </div>
          ) : (
            <div className="divide-y">
              {comments.map((comment) => {
                const content = (
                  <div className={cn(
                    "flex items-start gap-3 p-4 transition-colors",
                    comment.link && "hover:bg-muted/50 cursor-pointer"
                  )}>
                    <Avatar className="h-8 w-8">
                      {comment.user_avatar && (
                        <AvatarImage src={comment.user_avatar} alt={comment.user_name} />
                      )}
                      <AvatarFallback>
                        {comment.user_name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium">
                              {comment.user_name}
                            </span>
                            {comment.entity_name && (
                              <Badge variant="outline" className="text-xs">
                                {comment.entity_name}
                              </Badge>
                            )}
                            {comment.visibility !== 'public' && (
                              <div className={cn(
                                "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs",
                                visibilityColors[comment.visibility]
                              )}>
                                {visibilityIcons[comment.visibility]}
                                <span className="capitalize">{comment.visibility}</span>
                              </div>
                            )}
                            {comment.is_pinned && (
                              <Pin className="h-3 w-3 text-muted-foreground" />
                            )}
                            {comment.is_resolved && (
                              <CheckCircle className="h-3 w-3 text-green-500" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {comment.content_preview}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                            </span>
                            {comment.entity_type && (
                              <>
                                <span className="text-xs text-muted-foreground">•</span>
                                <span className="text-xs text-muted-foreground capitalize">
                                  {comment.entity_type}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        {comment.link && (
                          <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                        )}
                      </div>
                    </div>
                  </div>
                );

                return comment.link ? (
                  <Link key={comment.id} href={comment.link} className="block">
                    {content}
                  </Link>
                ) : (
                  <div key={comment.id}>
                    {content}
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}