/**
 * Types for the Unified Comments System
 */

export type CommentEntityType = 'ticket' | 'appointment' | 'customer';
export type CommentVisibility = 'internal' | 'customer' | 'system';

/**
 * Main comment interface
 */
export interface Comment {
  id: string;
  
  // Polymorphic association
  entity_type: CommentEntityType;
  entity_id: string;
  
  // Content
  content: string;
  content_html?: string;
  visibility: CommentVisibility;
  
  // Metadata
  user_id?: string;
  created_at: string;
  updated_at: string;
  edited_at?: string;
  edited_by?: string;
  
  // Threading
  parent_comment_id?: string;
  thread_id?: string;
  
  // Rich features
  mentions?: string[];
  attachments?: CommentAttachment[];
  is_pinned: boolean;
  is_resolved: boolean;
  
  // Soft delete
  deleted_at?: string;
  deleted_by?: string;
  
  // Relations (when joined)
  user?: CommentUser;
  reactions?: CommentReaction[];
  replies?: Comment[];
  reply_count?: number;
  edits?: CommentEdit[];
}

/**
 * User information for comments
 */
export interface CommentUser {
  id: string;
  full_name?: string;
  email: string;
  avatar_url?: string;
  role?: string;
}

/**
 * Comment reaction
 */
export interface CommentReaction {
  id: string;
  comment_id: string;
  user_id: string;
  reaction: string;
  created_at: string;
  user?: CommentUser;
}

/**
 * Comment edit history
 */
export interface CommentEdit {
  id: string;
  comment_id: string;
  previous_content: string;
  edited_by?: string;
  edited_at: string;
  editor?: CommentUser;
}

/**
 * Comment read receipt
 */
export interface CommentRead {
  comment_id: string;
  user_id: string;
  read_at: string;
}

/**
 * File attachment metadata
 */
export interface CommentAttachment {
  id: string;
  filename: string;
  file_size: number;
  file_type: string;
  url: string;
  thumbnail_url?: string;
  uploaded_at: string;
}

/**
 * Comment statistics for an entity
 */
export interface CommentStats {
  entity_type: CommentEntityType;
  entity_id: string;
  total_comments: number;
  internal_comments: number;
  customer_comments: number;
  pinned_comments: number;
  unresolved_threads: number;
  last_comment_at?: string;
}

/**
 * DTO for creating a new comment
 */
export interface CreateCommentDto {
  entity_type: CommentEntityType;
  entity_id: string;
  content: string;
  visibility?: CommentVisibility;
  parent_comment_id?: string;
  mentions?: string[];
  attachments?: CommentAttachment[];
  is_pinned?: boolean;
}

/**
 * DTO for updating a comment
 */
export interface UpdateCommentDto {
  content?: string;
  visibility?: CommentVisibility;
  is_pinned?: boolean;
  is_resolved?: boolean;
}

/**
 * Options for querying comments
 */
export interface CommentQueryOptions {
  limit?: number;
  offset?: number;
  visibility?: CommentVisibility | CommentVisibility[];
  user_id?: string;
  parent_comment_id?: string | null;
  thread_id?: string;
  is_pinned?: boolean;
  is_resolved?: boolean;
  include_deleted?: boolean;
  include_replies?: boolean;
  include_reactions?: boolean;
  sort_by?: 'created_at' | 'updated_at';
  sort_order?: 'asc' | 'desc';
}

/**
 * Filters for searching comments
 */
export interface CommentSearchFilters {
  query?: string;
  entity_types?: CommentEntityType[];
  visibility?: CommentVisibility[];
  user_ids?: string[];
  date_from?: string;
  date_to?: string;
  has_attachments?: boolean;
  has_mentions?: boolean;
  is_edited?: boolean;
}

/**
 * Comment notification payload
 */
export interface CommentNotification {
  type: 'mention' | 'reply' | 'reaction';
  comment_id: string;
  from_user_id: string;
  to_user_id: string;
  entity_type: CommentEntityType;
  entity_id: string;
  message: string;
  created_at: string;
}

/**
 * Quick reaction options
 */
export const QUICK_REACTIONS = ['👍', '👎', '❤️', '🎉', '🚀', '👀', '🤔', '✅'] as const;
export type QuickReaction = typeof QUICK_REACTIONS[number];

/**
 * Comment thread with nested replies
 */
export interface CommentThread {
  root: Comment;
  replies: Comment[];
  total_replies: number;
  participants: CommentUser[];
  last_reply_at?: string;
}

/**
 * Result of comment operations
 */
export interface CommentOperationResult {
  success: boolean;
  comment?: Comment;
  error?: string;
}

/**
 * Typing indicator for real-time
 */
export interface CommentTypingIndicator {
  entity_type: CommentEntityType;
  entity_id: string;
  user_id: string;
  user_name: string;
  is_typing: boolean;
  timestamp: string;
}