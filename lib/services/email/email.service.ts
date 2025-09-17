import { SendGridService, SendGridEmailOptions } from './sendgrid.service';
import { EmailTemplateEngine } from './email-template.engine';
import { EmailQueueService } from './email-queue.service';

export interface EmailOptions {
  to: string | string[];
  subject: string;
  template?: string;
  data?: Record<string, any>;
  html?: string;
  text?: string;
  from?: string;
  fromName?: string;
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
  attachments?: any[];
  priority?: 'high' | 'normal' | 'low';
  scheduledFor?: Date;
  queue?: boolean;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  queueId?: string;
  error?: string;
}

/**
 * Main Email Service
 * Orchestrates email sending through SendGrid with template support and queuing
 */
export class EmailService {
  private static instance: EmailService;
  private sendGridService: SendGridService;
  private templateEngine: EmailTemplateEngine;
  private queueService: EmailQueueService;

  private constructor() {
    this.sendGridService = SendGridService.getInstance();
    this.templateEngine = EmailTemplateEngine.getInstance();
    this.queueService = EmailQueueService.getInstance();
  }

  static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  /**
   * Send email (directly or via queue)
   */
  async send(options: EmailOptions): Promise<EmailResult> {
    try {
      // Prepare email content
      let html = options.html;
      let text = options.text;

      // If using template, render it
      if (options.template && options.data) {
        const rendered = await this.templateEngine.render(options.template, options.data);
        html = rendered.html;
        text = rendered.text || text;
      }

      // If queuing is requested or priority is set
      if (options.queue || options.priority) {
        return await this.queueEmail({
          ...options,
          html: html || '',
          text,
        });
      }

      // Send directly via SendGrid
      return await this.sendDirect({
        ...options,
        html,
        text,
      });
    } catch (error) {
      console.error('❌ Email service error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send email',
      };
    }
  }

  /**
   * Send email directly via SendGrid
   */
  private async sendDirect(options: EmailOptions): Promise<EmailResult> {
    const sendGridOptions: SendGridEmailOptions = {
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
      from: options.from,
      fromName: options.fromName,
      replyTo: options.replyTo,
      cc: options.cc,
      bcc: options.bcc,
      attachments: options.attachments,
    };

    const result = await this.sendGridService.sendEmail(sendGridOptions);

    return {
      success: result.success,
      messageId: result.messageId,
      error: result.error,
    };
  }

  /**
   * Queue email for later sending
   */
  private async queueEmail(options: EmailOptions): Promise<EmailResult> {
    try {
      const queueId = await this.queueService.addToQueue({
        to: options.to,
        subject: options.subject,
        html: options.html || '',
        text: options.text,
        from: options.from,
        fromName: options.fromName,
        replyTo: options.replyTo,
        cc: options.cc,
        bcc: options.bcc,
        priority: options.priority || 'normal',
        maxAttempts: 3,
        scheduledFor: options.scheduledFor,
      });

      return {
        success: true,
        queueId,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to queue email',
      };
    }
  }

  /**
   * Send email using SendGrid API (for queue processor)
   */
  async sendEmail(options: any): Promise<EmailResult> {
    const result = await this.sendGridService.sendEmail(options);
    return {
      success: result.success,
      messageId: result.messageId,
      error: result.error,
    };
  }

  /**
   * Send repair ticket confirmation email
   */
  async sendTicketConfirmation(ticketData: {
    ticketNumber: string;
    customerEmail: string;
    customerName: string;
    deviceBrand: string;
    deviceModel: string;
    issues: string[];
    estimatedCompletion?: Date;
  }): Promise<EmailResult> {
    return await this.send({
      to: ticketData.customerEmail,
      subject: `Repair Ticket ${ticketData.ticketNumber} - Confirmation`,
      template: 'ticket-confirmation',
      data: ticketData,
      priority: 'high',
    });
  }

  /**
   * Send status update email
   */
  async sendStatusUpdate(data: {
    ticketNumber: string;
    customerEmail: string;
    customerName: string;
    oldStatus: string;
    newStatus: string;
    notes?: string;
  }): Promise<EmailResult> {
    return await this.send({
      to: data.customerEmail,
      subject: `Repair Update - Ticket ${data.ticketNumber}`,
      template: 'status-update',
      data,
      priority: 'normal',
    });
  }

  /**
   * Send repair completion email
   */
  async sendCompletionNotice(data: {
    ticketNumber: string;
    customerEmail: string;
    customerName: string;
    completionDate: Date;
    totalCost?: number;
    pickupInstructions?: string;
  }): Promise<EmailResult> {
    return await this.send({
      to: data.customerEmail,
      subject: `Your Repair is Complete - Ticket ${data.ticketNumber}`,
      template: 'repair-complete',
      data,
      priority: 'high',
    });
  }

  /**
   * Send appointment reminder email
   */
  async sendAppointmentReminder(data: {
    customerEmail: string;
    customerName: string;
    appointmentDate: Date;
    appointmentTime: string;
    location?: string;
    notes?: string;
  }): Promise<EmailResult> {
    return await this.send({
      to: data.customerEmail,
      subject: 'Appointment Reminder - The Phone Guys',
      template: 'appointment-reminder',
      data,
      priority: 'normal',
    });
  }

  /**
   * Send password reset email
   */
  async sendPasswordReset(data: {
    email: string;
    name: string;
    resetToken: string;
    resetUrl: string;
  }): Promise<EmailResult> {
    return await this.send({
      to: data.email,
      subject: 'Password Reset Request - The Phone Guys',
      template: 'password-reset',
      data,
      priority: 'high',
    });
  }

  /**
   * Send staff notification email
   */
  async sendStaffNotification(data: {
    recipients: string[];
    subject: string;
    message: string;
    priority?: 'high' | 'normal' | 'low';
  }): Promise<EmailResult> {
    return await this.send({
      to: data.recipients,
      subject: data.subject,
      html: data.message,
      priority: data.priority || 'normal',
    });
  }

  /**
   * Start email queue processing
   */
  startQueueProcessing(): void {
    this.queueService.startProcessing();
  }

  /**
   * Stop email queue processing
   */
  stopQueueProcessing(): void {
    this.queueService.stopProcessing();
  }

  /**
   * Get queue statistics
   */
  async getQueueStats() {
    return await this.queueService.getQueueStats();
  }

  /**
   * Test email service
   */
  async testService(): Promise<boolean> {
    return await this.sendGridService.testConnection();
  }
}

// Export singleton instance
export const emailService = EmailService.getInstance();