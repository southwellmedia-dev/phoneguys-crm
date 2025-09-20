import { CommentRepository } from '@/lib/repositories/comment.repository';
import { InternalNotificationService } from '@/lib/services/internal-notification.service';
import { UserRepository } from '@/lib/repositories/user.repository';
import { ActivityLogRepository } from '@/lib/repositories/activity-log.repository';
import { 
  Comment, 
  CreateCommentDto,
  UpdateCommentDto,
  CommentEntityType,
  CommentVisibility,
  CommentAttachment,
  CommentOperationResult
} from '@/lib/types/comment.types';
import { 
  InternalNotificationType, 
  InternalNotificationPriority 
} from '@/lib/types/internal-notification.types';
import { createServiceClient } from '@/lib/supabase/service';

export class CommentService {
  private commentRepo: CommentRepository;
  private notificationService: InternalNotificationService | null;
  private userRepo: UserRepository | null;

  constructor(
    commentRepo: CommentRepository,
    notificationService: InternalNotificationService | null = null,
    userRepo: UserRepository | null = null
  ) {
    this.commentRepo = commentRepo;
    this.notificationService = notificationService;
    this.userRepo = userRepo;
  }

  /**
   * Post a new comment
   */
  async postComment(
    entityType: CommentEntityType,
    entityId: string,
    content: string,
    options: {
      visibility?: CommentVisibility;
      parentCommentId?: string;
      mentions?: string[];
      attachments?: CommentAttachment[];
      userId: string;
      authUserId?: string; // Auth user ID for RLS checks
      entityDetails?: { // Optional details about the entity for activity logging
        ticketNumber?: string;
        appointmentNumber?: string;
        customerName?: string;
      };
    }
  ): Promise<CommentOperationResult> {
    try {
      // Parse mentions from content and convert usernames to user IDs
      const mentionedUsernames = this.parseMentions(content);
      const mentionedUserIds = await this.convertUsernamesToIds(mentionedUsernames);
      const allMentions = [...new Set([...(options.mentions || []), ...mentionedUserIds])];

      // Process content (convert markdown, sanitize, etc.)
      const processedContent = await this.processContent(content);

      // Create the comment
      const comment = await this.commentRepo.createComment({
        entity_type: entityType,
        entity_id: entityId,
        content: processedContent.text,
        content_html: processedContent.html,
        visibility: options.visibility || 'internal',
        parent_comment_id: options.parentCommentId,
        mentions: allMentions.length > 0 ? allMentions : undefined,
        attachments: options.attachments
      });

      // Use auth user ID for RLS checks in notifications
      const authUserId = options.authUserId || options.userId;
      
      // Log activity for the comment
      try {
        const activityRepo = new ActivityLogRepository(true);
        
        // Prepare activity details
        const activityDetails: Record<string, any> = {
          comment_id: comment.id,
          visibility: comment.visibility,
          content_preview: content.substring(0, 100) + (content.length > 100 ? '...' : ''),
          has_attachments: (options.attachments?.length || 0) > 0,
          mentions_count: allMentions.length,
          is_reply: !!options.parentCommentId
        };

        // Add entity-specific details
        if (options.entityDetails) {
          Object.assign(activityDetails, options.entityDetails);
        }

        // Map entity type for activity logging
        const activityEntityType = entityType === 'ticket' ? 'repair_ticket' : entityType;
        
        await activityRepo.create({
          user_id: options.userId,
          activity_type: options.parentCommentId ? 'comment_reply' : 'comment_created',
          entity_type: activityEntityType,
          entity_id: entityId,
          details: activityDetails
        });
      } catch (activityError) {
        // Don't fail the comment creation if activity logging fails
        console.error('Failed to log comment activity:', activityError);
      }
      
      // Send notifications for mentions
      if (allMentions.length > 0 && this.notificationService) {
        await this.notifyMentions(comment, allMentions, options.userId, authUserId);
      }

      // Send notification for reply
      if (options.parentCommentId && this.notificationService) {
        await this.notifyReply(comment, options.parentCommentId, options.userId, authUserId);
      }

      // Send notification to entity owner/assignee
      if (this.notificationService) {
        await this.notifyEntityUpdate(comment, options.userId, authUserId);
      }

      return {
        success: true,
        comment
      };
    } catch (error) {
      console.error('Error posting comment:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to post comment'
      };
    }
  }

  /**
   * Edit an existing comment
   */
  async editComment(
    commentId: string,
    newContent: string,
    userId: string
  ): Promise<CommentOperationResult> {
    try {
      // Get existing comment to check ownership
      const existingComment = await this.commentRepo.findById(commentId);
      if (!existingComment) {
        throw new Error('Comment not found');
      }

      if (existingComment.user_id !== userId) {
        throw new Error('You can only edit your own comments');
      }

      // Process new content
      const processedContent = await this.processContent(newContent);
      
      // Parse new mentions
      const mentionedUsernames = this.parseMentions(newContent);
      const newMentions = await this.convertUsernamesToIds(mentionedUsernames);

      // Update the comment
      const updatedComment = await this.commentRepo.updateComment(commentId, {
        content: processedContent.text,
        content_html: processedContent.html,
        mentions: newMentions.length > 0 ? newMentions : undefined
      });

      // Notify newly mentioned users (not previously mentioned)
      const previousMentions = existingComment.mentions || [];
      const addedMentions = newMentions.filter(id => !previousMentions.includes(id));
      
      if (addedMentions.length > 0 && this.notificationService) {
        await this.notifyMentions(updatedComment, addedMentions, userId);
      }

      return {
        success: true,
        comment: updatedComment
      };
    } catch (error) {
      console.error('Error editing comment:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to edit comment'
      };
    }
  }

  /**
   * Delete a comment (soft delete)
   */
  async deleteComment(
    commentId: string,
    userId: string
  ): Promise<CommentOperationResult> {
    try {
      // Check ownership
      const comment = await this.commentRepo.findById(commentId);
      if (!comment) {
        throw new Error('Comment not found');
      }

      if (comment.user_id !== userId) {
        // Check if user is admin
        const user = await this.userRepo.findById(userId);
        if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
          throw new Error('You can only delete your own comments');
        }
      }

      await this.commentRepo.deleteComment(commentId);

      return {
        success: true
      };
    } catch (error) {
      console.error('Error deleting comment:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete comment'
      };
    }
  }

  /**
   * Process comment content (markdown, sanitization, etc.)
   */
  private async processContent(content: string): Promise<{
    text: string;
    html: string;
  }> {
    // Store the raw content without HTML encoding
    // React will automatically escape dangerous content when rendering
    // This prevents double-encoding issues
    
    // For HTML version, we need to escape first then apply formatting
    let html = this.sanitizeContent(content);
    
    // Convert **bold**
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Convert *italic*
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // Convert `code`
    html = html.replace(/`(.*?)`/g, '<code>$1</code>');
    
    // Convert line breaks
    html = html.replace(/\n/g, '<br>');
    
    // Convert @mentions to links
    html = html.replace(/@(\w+)/g, '<span class="mention" data-user="$1">@$1</span>');

    return {
      text: content, // Store raw content, not sanitized
      html
    };
  }

  /**
   * Sanitize content to prevent XSS
   */
  private sanitizeContent(content: string): string {
    // Basic sanitization - in production, use a proper library like DOMPurify
    return content
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  /**
   * Parse @mentions from content
   */
  private parseMentions(content: string): string[] {
    const mentionPattern = /@(\w+)/g;
    const mentions: string[] = [];
    let match;

    while ((match = mentionPattern.exec(content)) !== null) {
      mentions.push(match[1]);
    }

    return mentions;
  }

  /**
   * Convert usernames to user IDs
   */
  private async convertUsernamesToIds(usernames: string[]): Promise<string[]> {
    if (usernames.length === 0) return [];
    
    console.log('Converting usernames to IDs:', usernames);
    
    try {
      // We need to query the database to get user IDs from usernames
      // For now, we'll use the service client to bypass RLS for this lookup
      const supabase = createServiceClient();
      
      const { data: users, error } = await supabase
        .from('users')
        .select('id, username')
        .in('username', usernames);
      
      if (error) {
        console.error('Error fetching users by username:', error);
        return [];
      }
      
      console.log('Found users:', users);
      const userIds = users?.map(u => u.id) || [];
      console.log('Converted to IDs:', userIds);
      
      return userIds;
    } catch (error) {
      console.error('Error converting usernames to IDs:', error);
      return [];
    }
  }

  /**
   * Send notifications to mentioned users
   */
  private async notifyMentions(
    comment: Comment,
    mentionedUserIds: string[],
    fromUserId: string,
    authUserId: string
  ): Promise<void> {
    console.log('notifyMentions called with:', {
      mentionedUserIds,
      fromUserId,
      hasNotificationService: !!this.notificationService,
      hasUserRepo: !!this.userRepo
    });
    
    if (!this.notificationService || !this.userRepo) {
      console.error('Missing notification service or user repo');
      return;
    }
    
    try {
      const fromUser = await this.userRepo.findById(fromUserId);
      const entityName = await this.getEntityName(comment.entity_type, comment.entity_id);

      console.log('Creating notifications for mentioned users:', {
        fromUser: fromUser?.full_name,
        entityName,
        mentionedCount: mentionedUserIds.length
      });

      for (const userId of mentionedUserIds) {
        // Don't notify the comment author about their own mention
        if (userId === fromUserId) {
          console.log('Skipping notification for comment author:', userId);
          continue;
        }

        console.log('Creating notification for user:', userId);
        
        // Build the action URL based on entity type
        const actionUrl = comment.entity_type === 'ticket' 
          ? `/orders/${comment.entity_id}?comment=${comment.id}`
          : `/appointments/${comment.entity_id}?comment=${comment.id}`;
        
        const notification = await this.notificationService.createNotification({
          user_id: userId,
          type: InternalNotificationType.COMMENT_MENTION,
          title: 'You were mentioned in a comment',
          message: `${fromUser?.full_name || 'Someone'} mentioned you in a comment on ${entityName}`,
          priority: InternalNotificationPriority.MEDIUM,
          created_by: authUserId, // Use auth user ID for RLS checks
          action_url: actionUrl, // Add clickable link
          data: {
            comment_id: comment.id,
            entity_type: comment.entity_type,
            entity_id: comment.entity_id,
            from_user_id: fromUserId
          }
        });
        
        console.log('Notification created:', notification);
      }
    } catch (error) {
      console.error('Error sending mention notifications:', error);
    }
  }

  /**
   * Send notification for comment reply
   */
  private async notifyReply(
    comment: Comment,
    parentCommentId: string,
    fromUserId: string,
    authUserId: string
  ): Promise<void> {
    if (!this.notificationService || !this.userRepo) return;
    
    try {
      // Get parent comment to find its author
      const parentComment = await this.commentRepo.findById(parentCommentId);
      if (!parentComment || !parentComment.user_id) return;

      // Don't notify if replying to own comment
      if (parentComment.user_id === fromUserId) return;

      const fromUser = await this.userRepo.findById(fromUserId);
      const entityName = await this.getEntityName(comment.entity_type, comment.entity_id);

      // Build the action URL based on entity type
      const actionUrl = comment.entity_type === 'ticket' 
        ? `/orders/${comment.entity_id}?comment=${comment.id}`
        : `/appointments/${comment.entity_id}?comment=${comment.id}`;
      
      await this.notificationService.createNotification({
        user_id: parentComment.user_id,
        type: InternalNotificationType.COMMENT_REPLY,
        title: 'New reply to your comment',
        message: `${fromUser?.full_name || 'Someone'} replied to your comment on ${entityName}`,
        priority: InternalNotificationPriority.LOW,
        created_by: authUserId, // Use auth user ID for RLS checks
        action_url: actionUrl, // Add clickable link
        data: {
          comment_id: comment.id,
          parent_comment_id: parentCommentId,
          entity_type: comment.entity_type,
          entity_id: comment.entity_id,
          from_user_id: fromUserId
        }
      });
    } catch (error) {
      console.error('Error sending reply notification:', error);
    }
  }

  /**
   * Send notification to entity owner/assignee about new comment
   */
  private async notifyEntityUpdate(
    comment: Comment,
    fromUserId: string,
    authUserId: string
  ): Promise<void> {
    if (!this.notificationService || !this.userRepo) return;
    
    try {
      const supabase = createServiceClient();
      let notifyUserId: string | null = null;
      let entityName = '';

      // Get entity details based on type
      if (comment.entity_type === 'ticket') {
        const { data: ticket } = await supabase
          .from('repair_tickets')
          .select('ticket_number, assigned_to')
          .eq('id', comment.entity_id)
          .single();

        if (ticket) {
          notifyUserId = ticket.assigned_to;
          entityName = `Ticket #${ticket.ticket_number}`;
        }
      } else if (comment.entity_type === 'appointment') {
        const { data: appointment } = await supabase
          .from('appointments')
          .select('appointment_number, assigned_to')
          .eq('id', comment.entity_id)
          .single();

        if (appointment) {
          notifyUserId = appointment.assigned_to;
          entityName = `Appointment #${appointment.appointment_number}`;
        }
      }

      // Send notification if there's someone to notify and it's not the comment author
      if (notifyUserId && notifyUserId !== fromUserId) {
        console.log('Notifying entity owner:', {
          notifyUserId,
          fromUserId,
          authUserId,
          entityName,
          entityType: comment.entity_type
        });
        
        const fromUser = await this.userRepo.findById(fromUserId);

        // Build the action URL based on entity type
        const actionUrl = comment.entity_type === 'ticket' 
          ? `/orders/${comment.entity_id}?comment=${comment.id}`
          : `/appointments/${comment.entity_id}?comment=${comment.id}`;
        
        await this.notificationService.createNotification({
          user_id: notifyUserId,
          type: InternalNotificationType.COMMENT_ADDED,
          title: 'New comment',
          message: `${fromUser?.full_name || 'Someone'} commented on ${entityName}`,
          priority: InternalNotificationPriority.LOW,
          created_by: authUserId, // Use auth user ID for RLS checks
          action_url: actionUrl, // Add clickable link
          data: {
            comment_id: comment.id,
            entity_type: comment.entity_type,
            entity_id: comment.entity_id,
            from_user_id: fromUserId
          }
        });
      }
    } catch (error) {
      console.error('Error sending entity update notification:', error);
    }
  }

  /**
   * Get entity name for notifications
   */
  private async getEntityName(entityType: CommentEntityType, entityId: string): Promise<string> {
    try {
      const supabase = createServiceClient();

      switch (entityType) {
        case 'ticket':
          const { data: ticket } = await supabase
            .from('repair_tickets')
            .select('ticket_number')
            .eq('id', entityId)
            .single();
          return ticket ? `Ticket #${ticket.ticket_number}` : 'a ticket';

        case 'appointment':
          const { data: appointment } = await supabase
            .from('appointments')
            .select('appointment_number')
            .eq('id', entityId)
            .single();
          return appointment ? `Appointment #${appointment.appointment_number}` : 'an appointment';

        case 'customer':
          const { data: customer } = await supabase
            .from('customers')
            .select('name')
            .eq('id', entityId)
            .single();
          return customer ? `Customer: ${customer.name}` : 'a customer';

        default:
          return 'an item';
      }
    } catch (error) {
      console.error('Error getting entity name:', error);
      return 'an item';
    }
  }

  /**
   * Handle file attachment upload
   */
  async attachFile(
    commentId: string,
    file: File,
    userId: string
  ): Promise<CommentAttachment | null> {
    try {
      // Check comment ownership
      const comment = await this.commentRepo.findById(commentId);
      if (!comment || comment.user_id !== userId) {
        throw new Error('Unauthorized');
      }

      const supabase = createServiceClient();
      
      // Upload to Supabase Storage
      const fileName = `${commentId}/${Date.now()}-${file.name}`;
      const { data, error } = await supabase.storage
        .from('comment-attachments')
        .upload(fileName, file);

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('comment-attachments')
        .getPublicUrl(fileName);

      const attachment: CommentAttachment = {
        id: crypto.randomUUID(),
        filename: file.name,
        file_size: file.size,
        file_type: file.type,
        url: publicUrl,
        uploaded_at: new Date().toISOString()
      };

      // Update comment with attachment
      const currentAttachments = comment.attachments || [];
      await this.commentRepo.updateComment(commentId, {
        attachments: [...currentAttachments, attachment]
      });

      return attachment;
    } catch (error) {
      console.error('Error attaching file:', error);
      return null;
    }
  }

  /**
   * Remove file attachment
   */
  async removeAttachment(
    commentId: string,
    attachmentId: string,
    userId: string
  ): Promise<boolean> {
    try {
      // Check comment ownership
      const comment = await this.commentRepo.findById(commentId);
      if (!comment || comment.user_id !== userId) {
        throw new Error('Unauthorized');
      }

      const attachments = comment.attachments || [];
      const attachment = attachments.find(a => a.id === attachmentId);
      
      if (!attachment) {
        throw new Error('Attachment not found');
      }

      // Delete from storage
      const supabase = createServiceClient();
      const filePath = attachment.url.split('/').slice(-2).join('/');
      
      await supabase.storage
        .from('comment-attachments')
        .remove([filePath]);

      // Update comment
      const updatedAttachments = attachments.filter(a => a.id !== attachmentId);
      await this.commentRepo.updateComment(commentId, {
        attachments: updatedAttachments
      });

      return true;
    } catch (error) {
      console.error('Error removing attachment:', error);
      return false;
    }
  }
}