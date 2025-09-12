'use client';

import * as React from 'react';
import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Comment } from '@/lib/types/comment.types';
import { useUpdateComment, useDeleteComment } from '@/lib/hooks/use-comments';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { 
  MoreHorizontal, 
  Edit2, 
  Trash2, 
  Reply, 
  Pin, 
  Check,
  X,
  Clock,
  Eye,
  EyeOff
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { parseCommentContent } from '@/lib/utils/comment-utils';
import { CommentReactions } from './comment-reactions';

interface CommentItemProps {
  comment: Comment;
  currentUserId: string;
  onReply?: () => void;
  showReplies?: boolean;
  depth?: number;
  className?: string;
  isHighlighted?: boolean;
}

export function CommentItem({
  comment,
  currentUserId,
  onReply,
  showReplies = true,
  depth = 0,
  className,
  isHighlighted = false
}: CommentItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  
  const updateComment = useUpdateComment();
  const deleteComment = useDeleteComment();

  const isOwner = comment.user_id === currentUserId;
  const isDeleted = !!comment.deleted_at;
  const isEdited = !!comment.edited_at;
  const isSystemImport = comment.metadata?.is_system_import === true;
  const noteType = comment.metadata?.note_type;
  
  // Get user initials for avatar
  const userInitials = comment.user?.full_name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase() || 'U';

  const handleEdit = () => {
    if (editContent.trim() && editContent !== comment.content) {
      updateComment.mutate({
        commentId: comment.id,
        content: editContent
      }, {
        onSuccess: () => setIsEditing(false)
      });
    } else {
      setIsEditing(false);
      setEditContent(comment.content);
    }
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this comment?')) {
      deleteComment.mutate(comment.id);
    }
  };


  if (isDeleted) {
    return (
      <div className={cn(
        "opacity-50 italic text-muted-foreground p-3 rounded-lg bg-muted/30",
        depth > 0 && "ml-12",
        className
      )}>
        Comment deleted
      </div>
    );
  }

  return (
    <div 
      id={`comment-${comment.id}`}
      className={cn(
        "group relative transition-all duration-300",
        depth > 0 && "ml-12",
        isSystemImport && "bg-muted/30 p-3 rounded-lg border-l-4 border-blue-500",
        isHighlighted && "ring-2 ring-purple-500 ring-offset-2 bg-purple-50 dark:bg-purple-950/20 rounded-lg p-3 animate-pulse-once",
        className
      )}>
      {/* Thread line for replies */}
      {depth > 0 && (
        <div className="absolute left-[-28px] top-0 bottom-0 w-px bg-border" />
      )}
      
      <div className="flex gap-3">
        {/* Avatar */}
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage src={comment.user?.avatar_url} />
          <AvatarFallback className="text-xs">{userInitials}</AvatarFallback>
        </Avatar>

        {/* Comment Content */}
        <div className="flex-1 space-y-1">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-sm">
                {comment.user?.full_name || 'Unknown User'}
              </span>
              
              {/* Badges */}
              {isSystemImport && noteType && (
                <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                  📋 {noteType === 'appointment_initial' ? 'Appointment Notes' : 
                      noteType === 'ticket_customer' ? 'Customer Note' :
                      noteType === 'ticket_internal' ? 'Internal Note' :
                      noteType === 'service_technician' ? 'Service Note' :
                      noteType === 'ticket_system' ? 'System Note' :
                      'Historical Note'}
                </Badge>
              )}
              {comment.entity_type && !isSystemImport && (
                <Badge variant="outline" className="text-xs capitalize">
                  {comment.entity_type === 'ticket' ? '🎫' : comment.entity_type === 'appointment' ? '📅' : '👤'} {comment.entity_type}
                </Badge>
              )}
              {comment.visibility === 'internal' && (
                <Badge variant="secondary" className="text-xs">
                  <EyeOff className="h-3 w-3 mr-1" />
                  Internal
                </Badge>
              )}
              {comment.visibility === 'customer' && (
                <Badge variant="outline" className="text-xs">
                  <Eye className="h-3 w-3 mr-1" />
                  Customer
                </Badge>
              )}
              {comment.is_pinned && (
                <Badge variant="default" className="text-xs">
                  <Pin className="h-3 w-3 mr-1" />
                  Pinned
                </Badge>
              )}
              
              {/* Timestamp */}
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
              </span>
              
              {isEdited && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-xs text-muted-foreground italic">(edited)</span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">
                        Edited {formatDistanceToNow(new Date(comment.edited_at!), { addSuffix: true })}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>

            {/* Actions Menu - Hide for system imports */}
            {!isSystemImport && (
              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {onReply && (
                      <>
                        <DropdownMenuItem onClick={onReply}>
                          <Reply className="h-4 w-4 mr-2" />
                          Reply
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    )}
                    
                    {isOwner && (
                      <>
                        <DropdownMenuItem onClick={() => setIsEditing(true)}>
                          <Edit2 className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={handleDelete}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>

          {/* Content */}
          {isEditing ? (
            <div className="space-y-2">
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="min-h-[80px]"
                autoFocus
              />
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  onClick={handleEdit}
                  disabled={updateComment.isPending}
                >
                  <Check className="h-3 w-3 mr-1" />
                  Save
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost"
                  onClick={() => {
                    setIsEditing(false);
                    setEditContent(comment.content);
                  }}
                >
                  <X className="h-3 w-3 mr-1" />
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* Render content with basic markdown support */}
              <div className="text-sm whitespace-pre-wrap">
                {parseCommentContent(comment.content)}
              </div>
              
              {/* Attachments */}
              {comment.attachments && comment.attachments.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {comment.attachments.map((attachment) => (
                    <a
                      key={attachment.id}
                      href={attachment.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline"
                    >
                      📎 {attachment.filename}
                    </a>
                  ))}
                </div>
              )}
              
              {/* Reactions and Actions */}
              <div className="flex items-center gap-2 mt-2">
                <CommentReactions 
                  comment={comment} 
                  currentUserId={currentUserId} 
                />
                
                {/* Reply button */}
                {onReply && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={onReply}
                  >
                    <Reply className="h-3 w-3 mr-1" />
                    Reply
                  </Button>
                )}
              </div>
            </>
          )}

          {/* Replies */}
          {showReplies && comment.replies && comment.replies.length > 0 && (
            <div className="mt-4 space-y-4">
              {comment.replies.map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  currentUserId={currentUserId}
                  depth={depth + 1}
                  showReplies={false} // Don't nest beyond 2 levels
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}