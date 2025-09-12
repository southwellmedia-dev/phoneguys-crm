'use client';

import * as React from 'react';
import { useState } from 'react';
import { Comment } from '@/lib/types/comment.types';
import { useAddReaction, useRemoveReaction } from '@/lib/hooks/use-comments';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Smile, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { QUICK_REACTIONS } from '@/lib/types/comment.types';

interface CommentReactionsProps {
  comment: Comment;
  currentUserId: string;
  className?: string;
}

export function CommentReactions({
  comment,
  currentUserId,
  className
}: CommentReactionsProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [hoveredReaction, setHoveredReaction] = useState<string | null>(null);
  const addReaction = useAddReaction();
  const removeReaction = useRemoveReaction();

  // Group reactions by type with user info
  const reactionGroups = React.useMemo(() => {
    if (!comment.reactions || comment.reactions.length === 0) return [];
    
    const groups = comment.reactions.reduce((acc, reaction) => {
      if (!acc[reaction.reaction]) {
        acc[reaction.reaction] = {
          reaction: reaction.reaction,
          count: 0,
          users: [],
          userNames: [],
          hasCurrentUser: false
        };
      }
      
      acc[reaction.reaction].count++;
      acc[reaction.reaction].users.push(reaction.user_id);
      acc[reaction.reaction].userNames.push(
        reaction.user?.full_name || reaction.user?.email || 'Unknown'
      );
      
      if (reaction.user_id === currentUserId) {
        acc[reaction.reaction].hasCurrentUser = true;
      }
      
      return acc;
    }, {} as Record<string, any>);
    
    return Object.values(groups);
  }, [comment.reactions, currentUserId]);

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
    
    setShowPicker(false);
  };

  return (
    <div className={cn("flex items-center gap-1 flex-wrap", className)}>
      {/* Existing reactions */}
      {reactionGroups.map((group) => (
        <TooltipProvider key={group.reaction}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={group.hasCurrentUser ? "default" : "secondary"}
                size="sm"
                className={cn(
                  "h-7 px-2 gap-1 text-xs font-medium transition-all",
                  group.hasCurrentUser 
                    ? "bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/50 dark:hover:bg-blue-900/70 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800" 
                    : "hover:bg-muted"
                )}
                onClick={() => handleReaction(group.reaction)}
                onMouseEnter={() => setHoveredReaction(group.reaction)}
                onMouseLeave={() => setHoveredReaction(null)}
              >
                <span className={cn(
                  "text-base transition-transform",
                  hoveredReaction === group.reaction && "scale-110"
                )}>
                  {group.reaction}
                </span>
                <span className="font-semibold">{group.count}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-xs space-y-1">
                <p className="font-semibold">
                  {group.hasCurrentUser ? 'You' : ''}
                  {group.hasCurrentUser && group.userNames.length > 1 ? ' and ' : ''}
                  {group.userNames.filter((_, i) => 
                    !(group.hasCurrentUser && group.users[i] === currentUserId)
                  ).slice(0, 3).join(', ')}
                  {group.userNames.length > 3 ? ` and ${group.userNames.length - 3} others` : ''}
                </p>
                <p className="text-muted-foreground">
                  Click to {group.hasCurrentUser ? 'remove' : 'add'} reaction
                </p>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ))}
      
      {/* Add reaction button - shows on hover for desktop */}
      <div className="relative group/reactions">
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "h-7 w-7 p-0 transition-all",
            "opacity-0 group-hover:opacity-100",
            "hover:bg-muted"
          )}
          onClick={() => setShowPicker(!showPicker)}
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
        
        {/* Reaction picker */}
        {showPicker && (
          <>
            {/* Backdrop to close picker */}
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setShowPicker(false)}
            />
            
            {/* Picker popup */}
            <div className="absolute bottom-full left-0 mb-2 p-2 bg-popover border rounded-lg shadow-xl z-50 animate-in fade-in slide-in-from-bottom-2">
              <div className="flex gap-1">
                {QUICK_REACTIONS.map((reaction) => (
                  <Button
                    key={reaction}
                    variant="ghost"
                    size="sm"
                    className="h-9 w-9 p-0 hover:scale-125 hover:bg-transparent transition-transform"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleReaction(reaction);
                    }}
                  >
                    <span className="text-lg">{reaction}</span>
                  </Button>
                ))}
              </div>
              <div className="text-xs text-center text-muted-foreground mt-1">
                Click to react
              </div>
            </div>
          </>
        )}
      </div>
      
      {/* Quick access emojis on hover (desktop only) */}
      <div className="hidden md:flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        {QUICK_REACTIONS.slice(0, 3).map((reaction) => (
          <Button
            key={`quick-${reaction}`}
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 hover:scale-125 hover:bg-transparent transition-transform"
            onClick={() => handleReaction(reaction)}
            title={`React with ${reaction}`}
          >
            <span className="text-base opacity-60 hover:opacity-100 transition-opacity">
              {reaction}
            </span>
          </Button>
        ))}
      </div>
    </div>
  );
}