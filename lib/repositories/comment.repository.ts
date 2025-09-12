import { BaseRepository } from './base.repository';
import { SupabaseClient } from '@supabase/supabase-js';
import { 
  Comment, 
  CommentReaction,
  CommentEdit,
  CommentRead,
  CreateCommentDto,
  UpdateCommentDto,
  CommentQueryOptions,
  CommentSearchFilters,
  CommentStats,
  CommentEntityType,
  CommentVisibility,
  CommentThread
} from '@/lib/types/comment.types';

export class CommentRepository extends BaseRepository<Comment> {
  private supabaseClient?: SupabaseClient;

  constructor(supabaseClient?: SupabaseClient) {
    super('comments', false, false);
    this.supabaseClient = supabaseClient;
  }

  protected async getClient(): Promise<SupabaseClient> {
    if (this.supabaseClient) {
      return this.supabaseClient;
    }
    return super.getClient();
  }

  /**
   * Get comments for a specific entity
   */
  async getComments(
    entityType: CommentEntityType, 
    entityId: string, 
    options: CommentQueryOptions = {}
  ): Promise<Comment[]> {
    const {
      limit = 50,
      offset = 0,
      visibility,
      user_id,
      parent_comment_id,
      thread_id,
      is_pinned,
      is_resolved,
      include_deleted = false,
      include_replies = false,
      include_reactions = false,
      sort_by = 'created_at',
      sort_order = 'desc'
    } = options;

    const client = await this.getClient();
    
    let query = client
      .from(this.tableName)
      .select(`
        *,
        user:users!user_id (
          id,
          full_name,
          email,
          role,
          username
        )
        ${include_reactions ? ',reactions:comment_reactions(*, user:users(id, full_name, email))' : ''}
        ${include_replies ? `,replies:comments!parent_comment_id(
          *,
          user:users!user_id (
            id,
            full_name,
            email,
            role,
            username
          ),
          reactions:comment_reactions(*, user:users(id, full_name, email))
        )` : ''}
      `)
      .eq('entity_type', entityType)
      .eq('entity_id', entityId);

    // Apply filters
    if (!include_deleted) {
      query = query.is('deleted_at', null);
    }

    if (visibility) {
      if (Array.isArray(visibility)) {
        query = query.in('visibility', visibility);
      } else {
        query = query.eq('visibility', visibility);
      }
    }

    if (user_id) {
      query = query.eq('user_id', user_id);
    }

    if (parent_comment_id !== undefined) {
      if (parent_comment_id === null) {
        query = query.is('parent_comment_id', null);
      } else {
        query = query.eq('parent_comment_id', parent_comment_id);
      }
    }

    if (thread_id) {
      query = query.eq('thread_id', thread_id);
    }

    if (is_pinned !== undefined) {
      query = query.eq('is_pinned', is_pinned);
    }

    if (is_resolved !== undefined) {
      query = query.eq('is_resolved', is_resolved);
    }

    // Apply sorting and pagination
    query = query
      .order(sort_by, { ascending: sort_order === 'asc' })
      .range(offset, offset + limit - 1);

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch comments: ${error.message}`);
    }

    return data as Comment[];
  }

  /**
   * Get a single comment thread with all replies
   */
  async getThread(threadId: string): Promise<CommentThread | null> {
    const client = await this.getClient();

    // Get root comment
    const { data: root, error: rootError } = await client
      .from(this.tableName)
      .select(`
        *,
        user:users!user_id (
          id,
          full_name,
          email,
          role
        ),
        reactions:comment_reactions(*, user:users!user_id(id, full_name, email))
      `)
      .eq('id', threadId)
      .is('deleted_at', null)
      .single();

    if (rootError || !root) {
      return null;
    }

    // Get all replies in the thread
    const { data: replies, error: repliesError } = await client
      .from(this.tableName)
      .select(`
        *,
        user:users!user_id (
          id,
          full_name,
          email,
          role
        ),
        reactions:comment_reactions(*, user:users!user_id(id, full_name, email))
      `)
      .eq('thread_id', threadId)
      .neq('id', threadId)
      .is('deleted_at', null)
      .order('created_at', { ascending: true });

    if (repliesError) {
      throw new Error(`Failed to fetch thread replies: ${repliesError.message}`);
    }

    // Get unique participants
    const allComments = [root, ...(replies || [])];
    const participantMap = new Map();
    
    allComments.forEach(comment => {
      if (comment.user && comment.user.id) {
        participantMap.set(comment.user.id, comment.user);
      }
    });

    const participants = Array.from(participantMap.values());

    // Find last reply date
    const lastReply = replies && replies.length > 0 
      ? replies[replies.length - 1]
      : null;

    return {
      root: root as Comment,
      replies: (replies || []) as Comment[],
      total_replies: replies?.length || 0,
      participants,
      last_reply_at: lastReply?.created_at
    };
  }

  /**
   * Create a new comment
   */
  async createComment(data: CreateCommentDto): Promise<Comment> {
    const client = await this.getClient();
    
    // Get current user
    const { data: { user } } = await client.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const commentData = {
      ...data,
      user_id: user.id,
      visibility: data.visibility || 'internal'
    };

    const { data: comment, error } = await client
      .from(this.tableName)
      .insert(commentData)
      .select(`
        *,
        user:users!user_id (
          id,
          full_name,
          email,
          role,
          username
        )
      `)
      .single();

    if (error) {
      console.error('Failed to create comment:', error);
      throw new Error(`Failed to create comment: ${error.message}`);
    }

    console.log('Comment created successfully:', comment);
    return comment as Comment;
  }

  /**
   * Update a comment
   */
  async updateComment(id: string, updates: UpdateCommentDto): Promise<Comment> {
    const client = await this.getClient();
    
    // Get current user for edit tracking
    const { data: { user } } = await client.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const updateData = {
      ...updates,
      edited_by: user.id,
      edited_at: new Date().toISOString()
    };

    const { data: comment, error } = await client
      .from(this.tableName)
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        user:users!user_id (
          id,
          full_name,
          email,
          role
        )
      `)
      .single();

    if (error) {
      throw new Error(`Failed to update comment: ${error.message}`);
    }

    return comment as Comment;
  }

  /**
   * Soft delete a comment
   */
  async deleteComment(id: string): Promise<void> {
    const client = await this.getClient();
    
    const { data: { user } } = await client.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { error } = await client
      .from(this.tableName)
      .update({
        deleted_at: new Date().toISOString(),
        deleted_by: user.id
      })
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete comment: ${error.message}`);
    }
  }

  /**
   * Pin/unpin a comment
   */
  async pinComment(id: string, isPinned: boolean): Promise<Comment> {
    return this.updateComment(id, { is_pinned: isPinned });
  }

  /**
   * Resolve/unresolve a comment thread
   */
  async resolveComment(id: string, isResolved: boolean): Promise<Comment> {
    return this.updateComment(id, { is_resolved: isResolved });
  }

  /**
   * Add a reaction to a comment
   */
  async addReaction(commentId: string, reaction: string): Promise<CommentReaction> {
    const client = await this.getClient();
    
    const { data: { user } } = await client.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await client
      .from('comment_reactions')
      .insert({
        comment_id: commentId,
        user_id: user.id,
        reaction
      })
      .select(`
        *,
        user:users!user_id (
          id,
          full_name,
          email
        )
      `)
      .single();

    if (error) {
      // Check if it's a unique constraint error (reaction already exists)
      if (error.code === '23505') {
        throw new Error('You have already reacted with this emoji');
      }
      throw new Error(`Failed to add reaction: ${error.message}`);
    }

    return data as CommentReaction;
  }

  /**
   * Remove a reaction from a comment
   */
  async removeReaction(commentId: string, reaction: string): Promise<void> {
    const client = await this.getClient();
    
    const { data: { user } } = await client.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { error } = await client
      .from('comment_reactions')
      .delete()
      .eq('comment_id', commentId)
      .eq('user_id', user.id)
      .eq('reaction', reaction);

    if (error) {
      throw new Error(`Failed to remove reaction: ${error.message}`);
    }
  }

  /**
   * Mark a comment as read
   */
  async markAsRead(commentId: string): Promise<void> {
    const client = await this.getClient();
    
    const { data: { user } } = await client.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { error } = await client
      .from('comment_reads')
      .upsert({
        comment_id: commentId,
        user_id: user.id,
        read_at: new Date().toISOString()
      }, {
        onConflict: 'comment_id,user_id'
      });

    if (error) {
      throw new Error(`Failed to mark comment as read: ${error.message}`);
    }
  }

  /**
   * Mark multiple comments as read
   */
  async markMultipleAsRead(commentIds: string[], userId?: string): Promise<void> {
    const client = await this.getClient();
    
    // If userId not provided, try to get from auth (only works with regular client)
    let userIdToUse = userId;
    if (!userIdToUse) {
      const { data: { user } } = await client.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }
      userIdToUse = user.id;
    }

    const reads = commentIds.map(comment_id => ({
      comment_id,
      user_id: userIdToUse,
      read_at: new Date().toISOString()
    }));

    const { error } = await client
      .from('comment_reads')
      .upsert(reads, {
        onConflict: 'comment_id,user_id'
      });

    if (error) {
      throw new Error(`Failed to mark comments as read: ${error.message}`);
    }
  }

  /**
   * Search comments
   */
  async searchComments(filters: CommentSearchFilters): Promise<Comment[]> {
    const client = await this.getClient();
    
    let query = client
      .from(this.tableName)
      .select(`
        *,
        user:users!user_id (
          id,
          full_name,
          email,
          role
        )
      `)
      .is('deleted_at', null);

    // Apply search query
    if (filters.query) {
      query = query.textSearch('content', filters.query);
    }

    // Apply filters
    if (filters.entity_types && filters.entity_types.length > 0) {
      query = query.in('entity_type', filters.entity_types);
    }

    if (filters.visibility && filters.visibility.length > 0) {
      query = query.in('visibility', filters.visibility);
    }

    if (filters.user_ids && filters.user_ids.length > 0) {
      query = query.in('user_id', filters.user_ids);
    }

    if (filters.date_from) {
      query = query.gte('created_at', filters.date_from);
    }

    if (filters.date_to) {
      query = query.lte('created_at', filters.date_to);
    }

    if (filters.has_attachments !== undefined) {
      if (filters.has_attachments) {
        query = query.not('attachments', 'is', null);
      } else {
        query = query.is('attachments', null);
      }
    }

    if (filters.has_mentions !== undefined) {
      if (filters.has_mentions) {
        query = query.not('mentions', 'is', null);
      } else {
        query = query.is('mentions', null);
      }
    }

    if (filters.is_edited !== undefined) {
      if (filters.is_edited) {
        query = query.not('edited_at', 'is', null);
      } else {
        query = query.is('edited_at', null);
      }
    }

    query = query.order('created_at', { ascending: false }).limit(100);

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to search comments: ${error.message}`);
    }

    return data as Comment[];
  }

  /**
   * Get comments where user is mentioned
   */
  async getUserMentions(userId: string): Promise<Comment[]> {
    const client = await this.getClient();
    
    const { data, error } = await client
      .from(this.tableName)
      .select(`
        *,
        user:users!user_id (
          id,
          full_name,
          email,
          role
        )
      `)
      .contains('mentions', [userId])
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      throw new Error(`Failed to fetch user mentions: ${error.message}`);
    }

    return data as Comment[];
  }

  /**
   * Get unread comment count for an entity
   */
  async getUnreadCount(
    entityType: CommentEntityType, 
    entityId: string
  ): Promise<number> {
    const client = await this.getClient();
    
    const { data: { user } } = await client.auth.getUser();
    if (!user) {
      return 0;
    }

    // Get comments that don't have a read receipt for this user
    const { count, error } = await client
      .from(this.tableName)
      .select('id', { count: 'exact', head: true })
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .is('deleted_at', null)
      .not('id', 'in', 
        client
          .from('comment_reads')
          .select('comment_id')
          .eq('user_id', user.id)
      );

    if (error) {
      console.error('Failed to get unread count:', error);
      return 0;
    }

    return count || 0;
  }

  /**
   * Get comment statistics for an entity
   */
  async getCommentStats(
    entityType: CommentEntityType, 
    entityId: string
  ): Promise<CommentStats | null> {
    const client = await this.getClient();
    
    const { data, error } = await client
      .from('comment_counts')
      .select('*')
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .single();

    if (error) {
      // View might not have data yet
      return {
        entity_type: entityType,
        entity_id: entityId,
        total_comments: 0,
        internal_comments: 0,
        customer_comments: 0,
        pinned_comments: 0,
        unresolved_threads: 0,
        last_comment_at: undefined
      };
    }

    return data as CommentStats;
  }

  /**
   * Get edit history for a comment
   */
  async getEditHistory(commentId: string): Promise<CommentEdit[]> {
    const client = await this.getClient();
    
    const { data, error } = await client
      .from('comment_edits')
      .select(`
        *,
        editor:users!edited_by (
          id,
          full_name,
          email
        )
      `)
      .eq('comment_id', commentId)
      .order('edited_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch edit history: ${error.message}`);
    }

    return data as CommentEdit[];
  }
}