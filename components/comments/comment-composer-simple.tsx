'use client';

import * as React from 'react';
import { useState, useRef, useEffect } from 'react';
import { useCreateComment } from '@/lib/hooks/use-comments';
import { useUserSearch } from '@/lib/hooks/use-user-search';
import { CommentEntityType, CommentVisibility } from '@/lib/types/comment.types';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { MentionDropdown } from './mention-dropdown';
import { 
  Send, 
  Eye, 
  EyeOff, 
  X,
  AtSign,
  Loader2,
  Reply
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

interface CommentComposerProps {
  entityType: CommentEntityType;
  entityId: string;
  visibility?: CommentVisibility;
  parentCommentId?: string | null;
  parentCommentInfo?: {id: string, user: string, content: string} | null;
  onCommentPosted?: () => void;
  onCancel?: () => void;
  className?: string;
  autoFocus?: boolean;
}

export function CommentComposerSimple({
  entityType,
  entityId,
  visibility: defaultVisibility = 'internal',
  parentCommentId,
  parentCommentInfo,
  onCommentPosted,
  onCancel,
  className,
  autoFocus = false
}: CommentComposerProps) {
  const [content, setContent] = useState('');
  const [visibility, setVisibility] = useState<CommentVisibility>(defaultVisibility);
  const [mentionQuery, setMentionQuery] = useState('');
  const [showMentions, setShowMentions] = useState(false);
  const [mentionIndex, setMentionIndex] = useState(0);
  const [lastAtPosition, setLastAtPosition] = useState(-1);
  const [mentionedUsers, setMentionedUsers] = useState<Array<{username: string, fullName: string}>>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const createComment = useCreateComment(entityType, entityId);
  const { data: mentionUsers = [], isLoading: isSearching } = useUserSearch(mentionQuery);

  const isReply = !!parentCommentId;

  const handleSubmit = () => {
    if (!content.trim()) {
      toast.error('Please enter a comment');
      return;
    }

    createComment.mutate({
      content: content.trim(),
      visibility,
      parentCommentId: parentCommentId || undefined,
    }, {
      onSuccess: () => {
        setContent('');
        onCommentPosted?.();
      }
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Handle mention dropdown navigation
    if (showMentions && mentionUsers.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setMentionIndex(prev => (prev + 1) % mentionUsers.length);
        return;
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setMentionIndex(prev => (prev - 1 + mentionUsers.length) % mentionUsers.length);
        return;
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        if (mentionUsers[mentionIndex]) {
          handleMentionSelect(mentionUsers[mentionIndex]);
        }
        return;
      } else if (e.key === 'Escape') {
        setShowMentions(false);
        setMentionQuery('');
        return;
      }
    }
    
    // Submit on Ctrl/Cmd + Enter
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    const cursorPosition = e.target.selectionStart;
    
    // Check for @ mentions
    const beforeCursor = newContent.slice(0, cursorPosition);
    const lastAtIndex = beforeCursor.lastIndexOf('@');
    
    if (lastAtIndex !== -1 && lastAtIndex !== lastAtPosition) {
      const afterAt = beforeCursor.slice(lastAtIndex + 1);
      // Check if we're in a mention context (no space or newline after @)
      if (!afterAt.includes(' ') && !afterAt.includes('\n')) {
        setMentionQuery(afterAt);
        setShowMentions(true);
        setMentionIndex(0);
        setLastAtPosition(lastAtIndex);
      } else {
        setShowMentions(false);
        setMentionQuery('');
      }
    } else if (lastAtIndex === -1) {
      setShowMentions(false);
      setMentionQuery('');
      setLastAtPosition(-1);
    } else if (lastAtIndex === lastAtPosition) {
      // Still in same mention, update query
      const afterAt = beforeCursor.slice(lastAtIndex + 1);
      if (!afterAt.includes(' ') && !afterAt.includes('\n')) {
        setMentionQuery(afterAt);
      } else {
        setShowMentions(false);
        setMentionQuery('');
      }
    }
    
    setContent(newContent);
  };

  const handleMentionSelect = (user: any) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    const beforeAt = content.slice(0, lastAtPosition);
    const afterCursor = content.slice(textarea.selectionStart);
    
    const newContent = 
      beforeAt + 
      `@${user.username} ` + 
      afterCursor;
    
    setContent(newContent);
    setShowMentions(false);
    setMentionQuery('');
    setLastAtPosition(-1);
    
    // Add to mentioned users list if not already there
    if (!mentionedUsers.find(u => u.username === user.username)) {
      setMentionedUsers([...mentionedUsers, {
        username: user.username,
        fullName: user.full_name
      }]);
    }
    
    // Set cursor position after the mention
    setTimeout(() => {
      const newPosition = beforeAt.length + user.username.length + 2;
      textarea.focus();
      textarea.setSelectionRange(newPosition, newPosition);
    }, 0);
  };

  // Extract mentions from content to keep the list updated
  useEffect(() => {
    const mentionPattern = /@(\w+)/g;
    const matches = Array.from(content.matchAll(mentionPattern));
    const currentMentions = matches.map(match => match[1]);
    
    // Remove users that are no longer mentioned
    setMentionedUsers(prev => prev.filter(user => 
      currentMentions.includes(user.username)
    ));
  }, [content]);

  return (
    <div className={cn("space-y-3", className)}>
      {/* Reply indicator */}
      {parentCommentInfo && (
        <div className="bg-muted/50 rounded-lg p-3 border border-border">
          <div className="flex items-start gap-2">
            <Reply className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium">Replying to {parentCommentInfo.user}</span>
                {onCancel && (
                  <button
                    onClick={onCancel}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    title="Cancel reply"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <p className="text-xs text-muted-foreground truncate">
                {parentCommentInfo.content}
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Header with visibility control */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {mentionedUsers.length > 0 ? (
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                  Will notify {mentionedUsers.length} {mentionedUsers.length === 1 ? 'person' : 'people'}:
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {mentionedUsers.map(user => (
                  <span
                    key={user.username}
                    className="inline-flex items-center px-2.5 py-1 rounded-md bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-semibold text-sm border border-blue-200 dark:border-blue-800"
                  >
                    @{user.username}
                    <button
                      type="button"
                      onClick={() => {
                        // Remove mention from content
                        const newContent = content.replace(new RegExp(`@${user.username}\\s?`, 'g'), '');
                        setContent(newContent);
                      }}
                      className="ml-1.5 hover:text-blue-900 dark:hover:text-blue-100 transition-colors"
                      title="Remove mention"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <>
              <AtSign className="h-4 w-4" />
              <span>Type @ to mention someone</span>
            </>
          )}
        </div>
        
        {/* Visibility selector */}
        <RadioGroup 
          value={visibility} 
          onValueChange={(v) => setVisibility(v as CommentVisibility)}
          className="flex items-center gap-3"
        >
          <div className="flex items-center space-x-1">
            <RadioGroupItem value="internal" id="internal" className="h-3 w-3" />
            <Label htmlFor="internal" className="text-xs cursor-pointer flex items-center gap-1">
              <EyeOff className="h-3 w-3" />
              Internal
            </Label>
          </div>
          <div className="flex items-center space-x-1">
            <RadioGroupItem value="customer" id="customer" className="h-3 w-3" />
            <Label htmlFor="customer" className="text-xs cursor-pointer flex items-center gap-1">
              <Eye className="h-3 w-3" />
              Customer
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* Textarea with mention dropdown */}
      <div className="relative">
        <Textarea
          ref={textareaRef}
          value={content}
          onChange={handleContentChange}
          onKeyDown={handleKeyDown}
          placeholder={isReply ? "Write a reply... (@mention to notify)" : "Write a comment... (Ctrl+Enter to send)"}
          className="min-h-[100px] resize-none pr-10 font-medium"
          autoFocus={autoFocus}
          disabled={createComment.isPending}
        />
        
        {/* Character count */}
        <div className="absolute bottom-2 right-2 text-xs text-muted-foreground">
          {content.length > 0 && `${content.length}`}
        </div>
        
        {/* Mention dropdown - positioned above textarea */}
        {showMentions && (
          <div className="absolute bottom-full mb-2 left-0 z-50">
            {isSearching && mentionQuery.length > 0 ? (
              <div className="bg-background border rounded-md shadow-lg p-3 flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-muted-foreground">Searching for "{mentionQuery}"...</span>
              </div>
            ) : mentionUsers.length > 0 ? (
              <MentionDropdown
                users={mentionUsers}
                selectedIndex={mentionIndex}
                onSelect={handleMentionSelect}
              />
            ) : mentionQuery.length > 0 ? (
              <div className="bg-background border rounded-md shadow-lg p-3">
                <p className="text-sm text-muted-foreground">No users found matching "{mentionQuery}"</p>
              </div>
            ) : null}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground">
          Press Ctrl+Enter to send
        </div>
        
        <div className="flex items-center gap-2">
          {onCancel && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onCancel}
              disabled={createComment.isPending}
            >
              Cancel
            </Button>
          )}
          <Button
            onClick={handleSubmit}
            size="sm"
            disabled={!content.trim() || createComment.isPending}
            className="gap-2"
          >
            {createComment.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Posting...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                {isReply ? 'Reply' : 'Comment'}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}