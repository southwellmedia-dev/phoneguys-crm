import sgMail from '@sendgrid/mail';
import { MailDataRequired } from '@sendgrid/mail';

export interface SendGridEmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
  fromName?: string;
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
  templateId?: string;
  dynamicTemplateData?: Record<string, any>;
  attachments?: Array<{
    content: string;
    filename: string;
    type?: string;
    disposition?: 'attachment' | 'inline';
    contentId?: string;
  }>;
  categories?: string[];
  sendAt?: number;
}

export interface SendGridResponse {
  success: boolean;
  messageId?: string;
  error?: string;
  details?: any;
}

/**
 * SendGrid Email Service
 * Handles email sending through SendGrid API
 */
export class SendGridService {
  private static instance: SendGridService;
  private initialized: boolean = false;
  private fromEmail: string;
  private fromName: string;
  private replyTo: string;

  private constructor() {
    this.fromEmail = process.env.SENDGRID_FROM_EMAIL || 'noreply@phoneguysrepair.com';
    this.fromName = process.env.SENDGRID_FROM_NAME || 'The Phone Guys';
    this.replyTo = process.env.SENDGRID_REPLY_TO || this.fromEmail;
    
    // Debug logging for production troubleshooting
    console.log('🔧 SendGrid Configuration:', {
      fromEmail: this.fromEmail,
      fromEmailEnvVar: process.env.SENDGRID_FROM_EMAIL || 'NOT_SET',
      fromName: this.fromName,
      replyTo: this.replyTo,
      hasApiKey: !!process.env.SENDGRID_API_KEY
    });
    
    this.initialize();
  }

  static getInstance(): SendGridService {
    if (!SendGridService.instance) {
      SendGridService.instance = new SendGridService();
    }
    return SendGridService.instance;
  }

  /**
   * Initialize SendGrid with API key
   */
  private initialize(): void {
    const apiKey = process.env.SENDGRID_API_KEY;
    
    if (!apiKey) {
      console.error('❌ SendGrid API key not found in environment variables');
      return;
    }

    try {
      sgMail.setApiKey(apiKey);
      this.initialized = true;
      console.log('✅ SendGrid initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize SendGrid:', error);
    }
  }

  /**
   * Send email via SendGrid
   */
  async sendEmail(options: SendGridEmailOptions): Promise<SendGridResponse> {
    if (!this.initialized) {
      return {
        success: false,
        error: 'SendGrid is not initialized. Please check your API key.',
      };
    }

    try {
      // Build the email message
      const fromEmail = options.from || this.fromEmail;
      const fromName = options.fromName || this.fromName;
      
      console.log('📧 Sending email with from address:', {
        fromEmail,
        fromName,
        to: options.to,
        subject: options.subject
      });
      
      const msg: MailDataRequired = {
        to: options.to,
        from: {
          email: fromEmail,
          name: fromName,
        },
        subject: options.subject,
        replyTo: options.replyTo || this.replyTo,
      };

      // Add content based on whether using template or direct content
      if (options.templateId) {
        msg.templateId = options.templateId;
        if (options.dynamicTemplateData) {
          msg.dynamicTemplateData = options.dynamicTemplateData;
        }
      } else {
        if (options.html) {
          msg.html = options.html;
        }
        if (options.text) {
          msg.text = options.text;
        }
      }

      // Add optional fields
      if (options.cc) {
        msg.cc = options.cc;
      }
      if (options.bcc) {
        msg.bcc = options.bcc;
      }
      if (options.attachments) {
        msg.attachments = options.attachments;
      }
      if (options.categories) {
        msg.categories = options.categories;
      }
      if (options.sendAt) {
        msg.sendAt = options.sendAt;
      }

      // Send the email
      const [response] = await sgMail.send(msg);

      // Extract message ID from response headers
      const messageId = response.headers['x-message-id'];

      console.log(`✅ Email sent successfully via SendGrid: ${messageId}`);
      
      return {
        success: true,
        messageId,
        details: {
          statusCode: response.statusCode,
          headers: response.headers,
        },
      };
    } catch (error: any) {
      console.error('❌ SendGrid error:', error);

      // Extract error details
      let errorMessage = 'Failed to send email';
      let errorDetails = null;

      if (error.response) {
        errorMessage = error.response.body?.errors?.[0]?.message || errorMessage;
        errorDetails = error.response.body;
      } else if (error.message) {
        errorMessage = error.message;
      }

      return {
        success: false,
        error: errorMessage,
        details: errorDetails,
      };
    }
  }

  /**
   * Send multiple emails (batch)
   */
  async sendBatch(emails: SendGridEmailOptions[]): Promise<SendGridResponse[]> {
    const results = await Promise.allSettled(
      emails.map(email => this.sendEmail(email))
    );

    return results.map(result => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          success: false,
          error: result.reason?.message || 'Failed to send email',
        };
      }
    });
  }

  /**
   * Verify email address (basic validation)
   */
  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate multiple email addresses
   */
  validateEmails(emails: string | string[]): boolean {
    const emailArray = Array.isArray(emails) ? emails : [emails];
    return emailArray.every(email => this.validateEmail(email));
  }

  /**
   * Get SendGrid statistics (requires additional API permissions)
   */
  async getStats(startDate?: Date, endDate?: Date): Promise<any> {
    if (!this.initialized) {
      return {
        success: false,
        error: 'SendGrid is not initialized',
      };
    }

    try {
      // This would require additional SendGrid API client setup
      // For now, returning a placeholder
      console.log('📊 SendGrid stats requested (not implemented)');
      return {
        success: true,
        message: 'Stats API not implemented. Requires additional SendGrid client setup.',
      };
    } catch (error) {
      console.error('❌ Failed to get SendGrid stats:', error);
      return {
        success: false,
        error: 'Failed to retrieve stats',
      };
    }
  }

  /**
   * Create or update a SendGrid template (requires API key with template permissions)
   */
  async createTemplate(name: string, subject: string, htmlContent: string): Promise<SendGridResponse> {
    // This would require additional API setup
    // Placeholder for future implementation
    console.log('📝 Template creation requested (not implemented)');
    return {
      success: false,
      error: 'Template API not implemented',
    };
  }

  /**
   * Test SendGrid connection
   */
  async testConnection(): Promise<boolean> {
    try {
      // Send a test email to verify connection
      const result = await this.sendEmail({
        to: this.fromEmail,
        subject: 'SendGrid Test Email',
        text: 'This is a test email to verify SendGrid configuration.',
        html: '<p>This is a test email to verify SendGrid configuration.</p>',
      });

      return result.success;
    } catch (error) {
      console.error('❌ SendGrid connection test failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const sendGridService = SendGridService.getInstance();