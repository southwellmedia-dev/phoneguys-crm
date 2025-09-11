import { NotificationRepository } from '../repositories/notification.repository';
import { CustomerRepository } from '../repositories/customer.repository';
import { RepairTicketRepository } from '../repositories/repair-ticket.repository';
import { Notification, CreateNotificationDto, NotificationType, NotificationStatus } from '../types/database.types';
import { Customer, RepairTicket } from '../types/database.types';

// Email templates
const EMAIL_TEMPLATES = {
  new_ticket: {
    subject: 'Repair Request Received - Ticket #{ticketNumber}',
    body: `
Dear {customerName},

We have received your repair request for your {deviceBrand} {deviceModel}.

Ticket Number: {ticketNumber}
Issues: {issues}
Priority: {priority}

We will begin working on your device shortly and keep you updated on the progress.

Best regards,
The Phone Guys Team
    `.trim()
  },
  status_update: {
    subject: 'Repair Status Update - Ticket #{ticketNumber}',
    body: `
Dear {customerName},

Your repair ticket #{ticketNumber} status has been updated.

New Status: {status}
Device: {deviceBrand} {deviceModel}
{statusMessage}

If you have any questions, please don't hesitate to contact us.

Best regards,
The Phone Guys Team
    `.trim()
  },
  repair_completed: {
    subject: 'Your Device is Ready! - Ticket #{ticketNumber}',
    body: `
Dear {customerName},

Great news! Your {deviceBrand} {deviceModel} repair has been completed.

Ticket Number: {ticketNumber}
Total Cost: ${'{totalCost}'}

Your device is ready for pickup at your earliest convenience.

Please bring your ticket number or this email when collecting your device.

Best regards,
The Phone Guys Team
    `.trim()
  },
  on_hold: {
    subject: 'Repair On Hold - Ticket #{ticketNumber}',
    body: `
Dear {customerName},

Your repair ticket #{ticketNumber} has been placed on hold.

Reason: {holdReason}
Device: {deviceBrand} {deviceModel}

We will contact you shortly to discuss the next steps.

If you have any questions, please contact us immediately.

Best regards,
The Phone Guys Team
    `.trim()
  }
};

export class NotificationService {
  private notificationRepo: NotificationRepository;
  private customerRepo: CustomerRepository;
  private ticketRepo: RepairTicketRepository;

  constructor(useServiceRole = false) {
    this.notificationRepo = new NotificationRepository(useServiceRole);
    this.customerRepo = new CustomerRepository(useServiceRole);
    this.ticketRepo = new RepairTicketRepository(useServiceRole);
  }

  /**
   * Send notification for new ticket creation
   */
  async notifyNewTicket(ticket: RepairTicket): Promise<Notification> {
    const customer = await this.customerRepo.findById(ticket.customer_id);
    if (!customer || !customer.email) {
      throw new Error('Customer email not found');
    }

    const template = EMAIL_TEMPLATES.new_ticket;
    const emailContent = this.processTemplate(template.body, {
      customerName: customer.name,
      ticketNumber: ticket.ticket_number,
      deviceBrand: ticket.device_brand,
      deviceModel: ticket.device_model,
      issues: ticket.repair_issues.join(', '),
      priority: ticket.priority || 'medium'
    });

    return this.createNotification({
      ticket_id: ticket.id,
      notification_type: 'new_ticket',
      recipient_email: customer.email,
      subject: template.subject.replace('{ticketNumber}', ticket.ticket_number),
      body: emailContent,
      status: 'pending'
    });
  }

  /**
   * Send notification for status change
   */
  async notifyStatusChange(
    ticket: RepairTicket,
    newStatus: string,
    message?: string
  ): Promise<Notification> {
    const customer = await this.customerRepo.findById(ticket.customer_id);
    if (!customer || !customer.email) {
      throw new Error('Customer email not found');
    }

    // Determine which template to use
    let templateKey: keyof typeof EMAIL_TEMPLATES = 'status_update';
    if (newStatus === 'completed') {
      templateKey = 'repair_completed';
    } else if (newStatus === 'on_hold') {
      templateKey = 'on_hold';
    }

    const template = EMAIL_TEMPLATES[templateKey];
    const statusMessages: Record<string, string> = {
      'in_progress': 'Our technicians have started working on your device.',
      'on_hold': message || 'Your repair has been placed on hold. We will contact you shortly.',
      'completed': 'Your device has been repaired and is ready for pickup!',
      'cancelled': 'Your repair request has been cancelled.'
    };

    const emailContent = this.processTemplate(template.body, {
      customerName: customer.name,
      ticketNumber: ticket.ticket_number,
      deviceBrand: ticket.device_brand,
      deviceModel: ticket.device_model,
      status: this.formatStatus(newStatus),
      statusMessage: statusMessages[newStatus] || '',
      holdReason: message || 'Awaiting parts/customer response',
      totalCost: ticket.total_cost?.toFixed(2) || '0.00'
    });

    return this.createNotification({
      ticket_id: ticket.id,
      notification_type: this.mapStatusToNotificationType(newStatus),
      recipient_email: customer.email,
      subject: template.subject.replace('{ticketNumber}', ticket.ticket_number),
      body: emailContent,
      status: 'pending'
    });
  }

  /**
   * Create and queue a notification
   */
  async createNotification(data: CreateNotificationDto): Promise<Notification> {
    // Validate email format
    if (!this.isValidEmail(data.recipient_email)) {
      throw new Error('Invalid recipient email address');
    }

    // Map body to content field (database uses 'content', not 'body')
    const notificationData: any = {
      ...data,
      content: data.body || data.content,
      created_at: new Date().toISOString(),
      scheduled_for: data.scheduled_for || new Date().toISOString()
    };
    delete notificationData.body; // Remove body field as database doesn't have it

    const notification = await this.notificationRepo.create(notificationData);

    // In production, this would trigger an email service
    // For now, we'll just mark it as created
    console.log('Notification created:', notification.id);

    return notification;
  }

  /**
   * Send pending notifications
   */
  async processPendingNotifications(): Promise<{
    processed: number;
    failed: number;
    errors: Array<{ id: string; error: string }>;
  }> {
    const pending = await this.notificationRepo.findPending();
    let processed = 0;
    let failed = 0;
    const errors: Array<{ id: string; error: string }> = [];

    for (const notification of pending) {
      try {
        // In production, integrate with email service (SendGrid, AWS SES, etc.)
        await this.sendEmail(notification);
        
        // Mark as sent
        await this.notificationRepo.update(notification.id, {
          status: 'sent',
          sent_at: new Date().toISOString()
        });
        
        processed++;
      } catch (error) {
        failed++;
        errors.push({
          id: notification.id,
          error: error instanceof Error ? error.message : 'Unknown error'
        });

        // Mark as failed
        await this.notificationRepo.update(notification.id, {
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return { processed, failed, errors };
  }

  /**
   * Retry failed notifications
   */
  async retryFailedNotifications(): Promise<number> {
    const failed = await this.notificationRepo.findFailed();
    let retried = 0;

    for (const notification of failed) {
      // Reset status to pending for retry
      await this.notificationRepo.update(notification.id, {
        status: 'pending',
        error_message: null
      });
      retried++;
    }

    return retried;
  }

  /**
   * Get notification history for a ticket
   */
  async getTicketNotifications(ticketId: string): Promise<Notification[]> {
    return this.notificationRepo.findByTicketId(ticketId);
  }

  /**
   * Get all notifications with optional filters
   */
  async getNotifications(filters?: {
    status?: NotificationStatus;
    type?: NotificationType;
    startDate?: string;
    endDate?: string;
  }): Promise<Notification[]> {
    let query: any = {};

    if (filters?.status) {
      query.status = filters.status;
    }
    if (filters?.type) {
      query.notification_type = filters.type;
    }

    const notifications = await this.notificationRepo.findAll(query);

    // Apply date filters if provided
    if (filters?.startDate || filters?.endDate) {
      return notifications.filter(n => {
        const createdAt = new Date(n.created_at);
        if (filters.startDate && createdAt < new Date(filters.startDate)) {
          return false;
        }
        if (filters.endDate && createdAt > new Date(filters.endDate)) {
          return false;
        }
        return true;
      });
    }

    return notifications;
  }

  /**
   * Mark notification as read/acknowledged
   */
  async markAsRead(notificationId: string): Promise<Notification> {
    return this.notificationRepo.update(notificationId, {
      status: 'read'
    });
  }

  /**
   * Cancel a scheduled notification
   */
  async cancelNotification(notificationId: string): Promise<boolean> {
    const notification = await this.notificationRepo.findById(notificationId);
    if (!notification) {
      throw new Error('Notification not found');
    }

    if (notification.status === 'sent') {
      throw new Error('Cannot cancel already sent notification');
    }

    await this.notificationRepo.update(notificationId, {
      status: 'cancelled'
    });

    return true;
  }

  /**
   * Schedule a custom notification
   */
  async scheduleCustomNotification(
    ticketId: string,
    recipientEmail: string,
    subject: string,
    body: string,
    scheduledFor?: Date
  ): Promise<Notification> {
    const ticket = await this.ticketRepo.findById(ticketId);
    if (!ticket) {
      throw new Error('Ticket not found');
    }

    return this.createNotification({
      ticket_id: ticketId,
      notification_type: 'custom',
      recipient_email: recipientEmail,
      subject,
      body,
      status: 'pending',
      scheduled_for: scheduledFor?.toISOString()
    });
  }

  /**
   * Get notification statistics
   */
  async getNotificationStats(): Promise<{
    total: number;
    sent: number;
    pending: number;
    failed: number;
    byType: Record<string, number>;
  }> {
    const all = await this.notificationRepo.findAll();
    
    const stats = {
      total: all.length,
      sent: 0,
      pending: 0,
      failed: 0,
      byType: {} as Record<string, number>
    };

    for (const notification of all) {
      // Count by status
      if (notification.status === 'sent') stats.sent++;
      else if (notification.status === 'pending') stats.pending++;
      else if (notification.status === 'failed') stats.failed++;

      // Count by type
      const type = notification.notification_type;
      stats.byType[type] = (stats.byType[type] || 0) + 1;
    }

    return stats;
  }

  /**
   * Process template with variables
   */
  private processTemplate(template: string, variables: Record<string, string>): string {
    let processed = template;
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{${key}}`, 'g');
      processed = processed.replace(regex, value || '');
    }
    return processed;
  }

  /**
   * Format status for display
   */
  private formatStatus(status: string): string {
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }

  /**
   * Map ticket status to notification type
   */
  private mapStatusToNotificationType(status: string): NotificationType {
    const mapping: Record<string, NotificationType> = {
      'completed': 'repair_completed',
      'on_hold': 'on_hold',
      'in_progress': 'status_update',
      'cancelled': 'status_update'
    };
    return mapping[status] || 'status_update';
  }

  /**
   * Validate email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Send email using SendGrid
   */
  private async sendEmail(notification: Notification): Promise<void> {
    // Import EmailService
    const { EmailService } = await import('./email.service');
    const emailService = EmailService.getInstance();
    
    // Send the email
    const result = await emailService.sendEmailWithRetry({
      to: notification.recipient_email,
      subject: notification.subject,
      html: this.formatEmailContent(notification.content),
      text: notification.content
    }, 3, 2000); // 3 retries with 2 second delay

    if (!result.success) {
      throw new Error(`Failed to send email: ${result.error}`);
    }

    console.log(`✅ Email sent successfully to ${notification.recipient_email} (Message ID: ${result.messageId})`);
  }

  /**
   * Format email content with basic HTML
   */
  private formatEmailContent(content: string): string {
    // Convert line breaks to HTML
    const htmlContent = content
      .split('\n')
      .map(line => `<p style="margin: 0 0 10px 0; color: #666666; font-size: 14px; line-height: 22px;">${line}</p>`)
      .join('');

    return `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
        ${htmlContent}
      </div>
    `;
  }
}