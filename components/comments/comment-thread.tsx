'use client';

import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { useComments, useMarkCommentsAsRead } from '@/lib/hooks/use-comments';
import { CommentEntityType } from '@/lib/types/comment.types';
import { CommentItem } from './comment-item';
import { CommentComposerSimple } from './comment-composer-simple';
import { CommentFilters } from './comment-filters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { MessageSquare, Filter, Pin, Clock, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSearchParams } from 'next/navigation';

interface CommentThreadProps {
  entityType: CommentEntityType;
  entityId: string;
  currentUserId: string;
  allowCustomerComments?: boolean;
  className?: string;
  maxHeight?: string;
}

export function CommentThread({
  entityType,
  entityId,
  currentUserId,
  allowCustomerComments = false,
  className,
  maxHeight = '600px'
}: CommentThreadProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'internal' | 'customer'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [replyingTo, setReplyingTo] = useState<{id: string, user: string, content: string} | null>(null);
  const [highlightedCommentId, setHighlightedCommentId] = useState<string | null>(null);
  const [displayCount, setDisplayCount] = useState(10); // Start with 10 comments
  const searchParams = useSearchParams();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  const { 
    data: comments = [], 
    showSkeleton,
    hasLoadedOnce 
  } = useComments(entityType, entityId, {
    visibility: activeTab === 'all' ? undefined : activeTab === 'internal' ? ['internal'] : ['customer'],
    parent_comment_id: null, // Only get root comments, replies will be nested
    include_replies: true
  });

  const markAsRead = useMarkCommentsAsRead();
  
  // Check for comment highlight from URL
  useEffect(() => {
    const commentId = searchParams.get('comment');
    if (commentId && hasLoadedOnce) {
      setHighlightedCommentId(commentId);
      
      // Scroll to the comment after a short delay
      setTimeout(() => {
        const element = document.getElementById(`comment-${commentId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
      
      // Remove highlight after 5 seconds
      setTimeout(() => {
        setHighlightedCommentId(null);
        // Remove comment param from URL without refresh
        const url = new URL(window.location.href);
        url.searchParams.delete('comment');
        window.history.replaceState({}, '', url.toString());
      }, 5000);
    }
  }, [searchParams, hasLoadedOnce]);

  // Mark comments as read when viewed
  useEffect(() => {
    if (comments.length > 0 && hasLoadedOnce) {
      const unreadIds = comments
        .filter(c => !c.deleted_at)
        .map(c => c.id);
      
      if (unreadIds.length > 0) {
        markAsRead.mutate(unreadIds);
      }
    }
  }, [comments, hasLoadedOnce]);

  // Count comments by type
  const counts = React.useMemo(() => {
    const all = comments.filter(c => !c.deleted_at).length;
    const internal = comments.filter(c => !c.deleted_at && c.visibility === 'internal').length;
    const customer = comments.filter(c => !c.deleted_at && c.visibility === 'customer').length;
    const pinned = comments.filter(c => !c.deleted_at && c.is_pinned).length;
    
    return { all, internal, customer, pinned };
  }, [comments]);

  // Filter comments based on active tab
  const filteredComments = React.useMemo(() => {
    let filtered = comments.filter(c => !c.deleted_at);
    
    if (activeTab === 'internal') {
      filtered = filtered.filter(c => c.visibility === 'internal');
    } else if (activeTab === 'customer') {
      filtered = filtered.filter(c => c.visibility === 'customer');
    }
    
    // Sort: pinned first, then by date
    return filtered.sort((a, b) => {
      if (a.is_pinned && !b.is_pinned) return -1;
      if (!a.is_pinned && b.is_pinned) return 1;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [comments, activeTab]);

  // Get only the comments to display based on displayCount
  const displayedComments = React.useMemo(() => {
    return filteredComments.slice(0, displayCount);
  }, [filteredComments, displayCount]);

  const hasMoreComments = filteredComments.length > displayCount;

  const loadMoreComments = () => {
    setDisplayCount(prev => Math.min(prev + 10, filteredComments.length));
  };

  return (
    <Card className={cn("relative", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <MessageSquare className="h-4 w-4 text-primary" />
            </div>
            <CardTitle className="text-base font-semibold">
              Comments & Discussion
            </CardTitle>
            {counts.all > 0 && (
              <Badge variant="secondary" className="ml-2">
                {counts.all}
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {counts.pinned > 0 && (
              <Badge variant="outline" className="gap-1">
                <Pin className="h-3 w-3" />
                {counts.pinned} pinned
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Tabs for filtering */}
        <Tabs value={activeTab} onValueChange={(v) => {
          setActiveTab(v as any);
          setDisplayCount(10); // Reset to initial count when switching tabs
        }}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all" className="gap-2">
              All
              {counts.all > 0 && (
                <Badge variant="secondary" className="h-5 px-1">
                  {counts.all}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="internal" className="gap-2">
              Internal
              {counts.internal > 0 && (
                <Badge variant="secondary" className="h-5 px-1">
                  {counts.internal}
                </Badge>
              )}
            </TabsTrigger>
            {allowCustomerComments && (
              <TabsTrigger value="customer" className="gap-2">
                Customer
                {counts.customer > 0 && (
                  <Badge variant="secondary" className="h-5 px-1">
                    {counts.customer}
                  </Badge>
                )}
              </TabsTrigger>
            )}
          </TabsList>
        </Tabs>

        {/* Filters (if shown) */}
        {showFilters && (
          <CommentFilters
            onClose={() => setShowFilters(false)}
          />
        )}

        {/* Comment Composer */}
        <CommentComposerSimple
          entityType={entityType}
          entityId={entityId}
          visibility={activeTab === 'customer' ? 'customer' : 'internal'}
          parentCommentId={replyingTo?.id}
          parentCommentInfo={replyingTo}
          onCommentPosted={() => setReplyingTo(null)}
          onCancel={replyingTo ? () => setReplyingTo(null) : undefined}
        />

        {/* Comments List */}
        <ScrollArea className="w-full" style={{ height: maxHeight === 'none' ? 'auto' : maxHeight }}>
          <div className="space-y-4 pr-4">
            {showSkeleton ? (
              // Loading skeletons
              <>
                {[1, 2, 3].map((i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex items-start gap-3">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-4 w-16" />
                        </div>
                        <Skeleton className="h-16 w-full" />
                      </div>
                    </div>
                  </div>
                ))}
              </>
            ) : filteredComments.length === 0 ? (
              // Empty state
              <div className="text-center py-12">
                <MessageSquare className="h-8 w-8 mx-auto mb-3 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">
                  No comments yet. Start the conversation!
                </p>
              </div>
            ) : (
              <>
                {/* Comments */}
                {displayedComments.map((comment) => (
                  <CommentItem
                    key={comment.id}
                    comment={comment}
                    currentUserId={currentUserId}
                    onReply={() => setReplyingTo({
                      id: comment.id,
                      user: comment.user?.full_name || 'Unknown User',
                      content: comment.content.substring(0, 100) + (comment.content.length > 100 ? '...' : '')
                    })}
                    showReplies
                    depth={0}
                    isHighlighted={highlightedCommentId === comment.id}
                  />
                ))}
                
                {/* Load More Button */}
                {hasMoreComments && (
                  <div className="flex justify-center pt-4">
                    <Button
                      variant="outline"
                      onClick={loadMoreComments}
                      className="w-full max-w-xs"
                    >
                      Load More Comments ({filteredComments.length - displayCount} remaining)
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}