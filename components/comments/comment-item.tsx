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
import { useAddReaction, useRemoveReaction } from '@/lib/hooks/use-comments';

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
  const addReaction = useAddReaction();
  const removeReaction = useRemoveReaction();

  const isOwner = comment.user_id === currentUserId;
  const isDeleted = !!comment.deleted_at;
  const isEdited = !!comment.edited_at;
  const isSystemImport = comment.metadata?.is_system_import === true;
  const noteType = comment.metadata?.note_type;
  
  // Parse system status messages
  const systemStatusMatch = comment.content.match(/^(Appointment confirmed|Customer checked in|Appointment cancelled|Appointment rescheduled):\s*(.*)/);
  const systemStatus = systemStatusMatch ? systemStatusMatch[1] : null;
  const actualContent = systemStatusMatch ? systemStatusMatch[2] : comment.content;
  
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

  const handleReaction = (reaction: string) => {
    // Check if user already reacted with this
    const existingReaction = comment.reactions?.find(
      r => r.user_id === currentUserId && r.reaction === reaction
    );
    
    if (existingReaction) {
      removeReaction.mutate({ commentId: comment.id, reaction });
    } else {
      addReaction.mutate({ commentId: comment.id, reaction });
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
        "group relative transition-all duration-200",
        depth > 0 && "ml-12",
        className
      )}>
      
      <div className="flex gap-3">
        {/* Avatar with timeline */}
        <div className="relative flex flex-col items-center">
          <Avatar className="h-8 w-8 flex-shrink-0 z-10 bg-white dark:bg-gray-900 ring-2 ring-gray-100 dark:ring-gray-800">
            <AvatarImage src={comment.user?.avatar_url} />
            <AvatarFallback className="text-xs">{userInitials}</AvatarFallback>
          </Avatar>
          {/* Timeline line - connects to next comment */}
          <div className="absolute top-8 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />
        </div>

        {/* Comment Content Card */}
        <div className="flex-1 bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 transition-all duration-200 hover:shadow-sm">
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
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
              <div className="opacity-0 group-hover:opacity-100 transition-all duration-200">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-gray-100 dark:hover:bg-gray-800">
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
              {/* System status pill if applicable */}
              {systemStatus && (
                <div className="mb-2">
                  <Badge 
                    variant={
                      systemStatus === 'Appointment confirmed' ? 'default' :
                      systemStatus === 'Customer checked in' ? 'secondary' :
                      systemStatus === 'Appointment cancelled' ? 'destructive' :
                      'outline'
                    }
                    className={cn(
                      "text-xs",
                      systemStatus === 'Appointment confirmed' && "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
                      systemStatus === 'Customer checked in' && "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
                      systemStatus === 'Appointment cancelled' && "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
                      systemStatus === 'Appointment rescheduled' && "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300"
                    )}
                  >
                    {systemStatus === 'Appointment confirmed' && '✅ '}
                    {systemStatus === 'Customer checked in' && '📍 '}
                    {systemStatus === 'Appointment cancelled' && '❌ '}
                    {systemStatus === 'Appointment rescheduled' && '📅 '}
                    {systemStatus}
                  </Badge>
                </div>
              )}
              
              {/* Render content with basic markdown support */}
              <div className="text-sm whitespace-pre-wrap">
                {parseCommentContent(actualContent)}
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
              
              {/* Reactions Footer - Always render but control visibility */}
              <div className={cn(
                "flex items-center justify-between transition-all duration-200 overflow-hidden",
                (comment.reactions && comment.reactions.length > 0) 
                  ? "mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 max-h-20 opacity-100" 
                  : "max-h-0 opacity-0 group-hover:mt-3 group-hover:pt-3 group-hover:border-t group-hover:border-gray-100 dark:group-hover:border-gray-800 group-hover:max-h-20 group-hover:opacity-100"
              )}>
                {/* Existing reactions or add reaction prompt */}
                <div className="flex items-center gap-2">
                  {(comment.reactions && comment.reactions.length > 0) ? (
                    <div className="flex items-center gap-1">
                      {comment.reactions.reduce((acc: any[], reaction) => {
                        const existing = acc.find(r => r.reaction === reaction.reaction);
                        if (existing) {
                          existing.count++;
                          existing.users.push(reaction.user?.full_name || reaction.user?.email || 'Unknown');
                          existing.hasCurrentUser = existing.hasCurrentUser || reaction.user_id === currentUserId;
                        } else {
                          acc.push({
                            reaction: reaction.reaction,
                            count: 1,
                            users: [reaction.user?.full_name || reaction.user?.email || 'Unknown'],
                            hasCurrentUser: reaction.user_id === currentUserId
                          });
                        }
                        return acc;
                      }, []).map((group) => (
                        <Button
                          key={group.reaction}
                          variant="ghost"
                          size="sm"
                          className={cn(
                            "h-7 px-2 py-0.5 text-xs",
                            group.hasCurrentUser ? "bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30" : "hover:bg-gray-100 dark:hover:bg-gray-800"
                          )}
                          onClick={() => handleReaction(group.reaction)}
                        >
                          <span className="text-base mr-1">{group.reaction}</span>
                          <span className="font-semibold">{group.count}</span>
                        </Button>
                      ))}
                    </div>
                  ) : null}
                  
                  {/* Add reaction section */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <CommentReactions 
                      comment={comment} 
                      currentUserId={currentUserId}
                      compact={true}
                    />
                  </div>
                </div>
                
                {/* Reply button on the right */}
                {onReply && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200"
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