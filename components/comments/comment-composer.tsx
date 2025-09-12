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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { 
  Send, 
  Paperclip, 
  Eye, 
  EyeOff, 
  X,
  Smile,
  Bold,
  Italic,
  Link2,
  List,
  Code,
  AtSign
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface CommentComposerProps {
  entityType: CommentEntityType;
  entityId: string;
  visibility?: CommentVisibility;
  parentCommentId?: string | null;
  onCommentPosted?: () => void;
  onCancel?: () => void;
  className?: string;
  autoFocus?: boolean;
}

export function CommentComposer({
  entityType,
  entityId,
  visibility: defaultVisibility = 'internal',
  parentCommentId,
  onCommentPosted,
  onCancel,
  className,
  autoFocus = false
}: CommentComposerProps) {
  const [content, setContent] = useState('');
  const [visibility, setVisibility] = useState<CommentVisibility>(defaultVisibility);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [mentionQuery, setMentionQuery] = useState('');
  const [showMentions, setShowMentions] = useState(false);
  const [mentionIndex, setMentionIndex] = useState(0);
  const [mentionPosition, setMentionPosition] = useState<{ top: number; left: number } | undefined>();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const createComment = useCreateComment(entityType, entityId);
  const { data: mentionUsers = [] } = useUserSearch(mentionQuery);

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
      attachments: attachments.length > 0 ? attachments : undefined
    }, {
      onSuccess: () => {
        setContent('');
        setAttachments([]);
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
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (mentionUsers[mentionIndex]) {
          handleMentionSelect(mentionUsers[mentionIndex]);
        }
        return;
      } else if (e.key === 'Escape') {
        setShowMentions(false);
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
    
    if (lastAtIndex !== -1) {
      const afterAt = beforeCursor.slice(lastAtIndex + 1);
      // Check if we're in a mention context (no space after @)
      if (!afterAt.includes(' ') && !afterAt.includes('\n')) {
        setMentionQuery(afterAt);
        setShowMentions(true);
        setMentionIndex(0);
        
        // Calculate position for dropdown
        if (textareaRef.current) {
          const textarea = textareaRef.current;
          const textBeforeAt = newContent.slice(0, lastAtIndex);
          const lines = textBeforeAt.split('\n');
          const currentLine = lines.length;
          const rect = textarea.getBoundingClientRect();
          
          setMentionPosition({
            top: rect.bottom + 5,
            left: rect.left
          });
        }
      } else {
        setShowMentions(false);
      }
    } else {
      setShowMentions(false);
    }
    
    setContent(newContent);
  };

  const handleMentionSelect = (user: any) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    const cursorPosition = textarea.selectionStart;
    const beforeCursor = content.slice(0, cursorPosition);
    const afterCursor = content.slice(cursorPosition);
    const lastAtIndex = beforeCursor.lastIndexOf('@');
    
    if (lastAtIndex !== -1) {
      const newContent = 
        content.slice(0, lastAtIndex) + 
        `@${user.username} ` + 
        afterCursor;
      
      setContent(newContent);
      setShowMentions(false);
      setMentionQuery('');
      
      // Set cursor position after the mention
      setTimeout(() => {
        const newPosition = lastAtIndex + user.username.length + 2;
        textarea.focus();
        textarea.setSelectionRange(newPosition, newPosition);
      }, 0);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 10MB)`);
        return false;
      }
      return true;
    });
    
    setAttachments(prev => [...prev, ...validFiles]);
    
    // Reset input
    if (e.target) {
      e.target.value = '';
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const insertMarkdown = (before: string, after: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    const newText = content.substring(0, start) + before + selectedText + after + content.substring(end);
    
    setContent(newText);
    
    // Restore focus and selection
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + before.length,
        start + before.length + selectedText.length
      );
    }, 0);
  };

  return (
    <div className={cn("space-y-3", className)}>
      {/* Formatting toolbar */}
      <div className="flex items-center gap-1 pb-2 border-b">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={() => insertMarkdown('**', '**')}
          title="Bold (Ctrl+B)"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={() => insertMarkdown('*', '*')}
          title="Italic (Ctrl+I)"
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={() => insertMarkdown('`', '`')}
          title="Code"
        >
          <Code className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={() => insertMarkdown('[', '](url)')}
          title="Link"
        >
          <Link2 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={() => insertMarkdown('- ')}
          title="List"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={() => {
            const pos = textareaRef.current?.selectionStart || content.length;
            const newContent = content.slice(0, pos) + '@' + content.slice(pos);
            setContent(newContent);
            setTimeout(() => {
              textareaRef.current?.focus();
              textareaRef.current?.setSelectionRange(pos + 1, pos + 1);
            }, 0);
          }}
          title="Mention someone"
        >
          <AtSign className="h-4 w-4" />
        </Button>
        
        <div className="flex-1" />
        
        {/* Visibility selector */}
        <RadioGroup 
          value={visibility} 
          onValueChange={(v) => setVisibility(v as CommentVisibility)}
          className="flex items-center gap-3 mr-2"
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

      {/* Textarea */}
      <div className="relative">
        <Textarea
          ref={textareaRef}
          value={content}
          onChange={handleContentChange}
          onKeyDown={handleKeyDown}
          placeholder={isReply ? "Write a reply... (use @ to mention)" : "Write a comment... (Ctrl+Enter to send, @ to mention)"}
          className="min-h-[100px] resize-none"
          autoFocus={autoFocus}
        />
        
        {/* Mention dropdown */}
        {showMentions && (
          <MentionDropdown
            users={mentionUsers}
            selectedIndex={mentionIndex}
            onSelect={handleMentionSelect}
            position={mentionPosition}
          />
        )}
      </div>

      {/* Attachments */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {attachments.map((file, index) => (
            <div
              key={index}
              className="flex items-center gap-1 px-2 py-1 bg-secondary rounded-md text-xs"
            >
              <Paperclip className="h-3 w-3" />
              <span className="max-w-[150px] truncate">{file.name}</span>
              <button
                onClick={() => removeAttachment(index)}
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* File upload */}
          <label htmlFor="file-upload" className="cursor-pointer">
            <input
              id="file-upload"
              type="file"
              multiple
              className="hidden"
              onChange={handleFileSelect}
              accept="image/*,.pdf,.doc,.docx,.txt"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8"
              asChild
            >
              <span>
                <Paperclip className="h-4 w-4 mr-1" />
                Attach
              </span>
            </Button>
          </label>
        </div>

        <div className="flex items-center gap-2">
          {onCancel && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onCancel}
            >
              Cancel
            </Button>
          )}
          
          <Button
            onClick={handleSubmit}
            disabled={!content.trim() || createComment.isPending}
            size="sm"
          >
            <Send className="h-4 w-4 mr-1" />
            {createComment.isPending ? 'Sending...' : isReply ? 'Reply' : 'Comment'}
          </Button>
        </div>
      </div>
    </div>
  );
}