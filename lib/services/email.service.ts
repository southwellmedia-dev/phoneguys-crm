import sgMail from '@sendgrid/mail';

export interface EmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  from?: string;
  fromName?: string;
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
  attachments?: Array<{
    content: string;
    filename: string;
    type?: string;
    disposition?: string;
  }>;
  templateId?: string;
  dynamicTemplateData?: Record<string, any>;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export class EmailService {
  private static instance: EmailService;
  private isInitialized = false;
  private isDevelopment = process.env.NODE_ENV === 'development';
  private isLocalSupabase = false; // Disable local mode - always use SendGrid
  private fromEmail: string;
  private fromName: string;
  private replyTo: string;

  constructor() {
    this.fromEmail = process.env.EMAIL_FROM || 'noreply@phoneguys.com';
    this.fromName = process.env.EMAIL_FROM_NAME || 'The Phone Guys';
    this.replyTo = process.env.EMAIL_REPLY_TO || 'support@phoneguys.com';
    this.initialize();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  /**
   * Initialize SendGrid with API key
   */
  private initialize(): void {
    // Skip SendGrid initialization if using local Supabase (Inbucket will handle emails)
    if (this.isLocalSupabase) {
      console.log('📧 Using Supabase Inbucket for local email testing');
      console.log('📬 View emails at: http://127.0.0.1:54324');
      this.isInitialized = false; // Don't use SendGrid in local mode
      return;
    }

    const apiKey = process.env.SENDGRID_API_KEY;
    
    if (!apiKey) {
      console.warn('⚠️ SendGrid API key not found. Emails will be logged to console only.');
      return;
    }

    try {
      sgMail.setApiKey(apiKey);
      this.isInitialized = true;
      console.log('✅ SendGrid initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize SendGrid:', error);
      this.isInitialized = false;
    }
  }

  /**
   * Send a single email
   */
  public async sendEmail(options: EmailOptions): Promise<EmailResult> {
    try {
      // Validate recipient email
      if (!options.to) {
        throw new Error('Recipient email is required');
      }

      // Prepare email data
      const msg = {
        to: options.to,
        from: {
          email: options.from || this.fromEmail,
          name: options.fromName || this.fromName
        },
        replyTo: options.replyTo || this.replyTo,
        subject: options.subject,
        text: options.text,
        html: options.html,
        cc: options.cc,
        bcc: options.bcc,
        attachments: options.attachments,
        templateId: options.templateId,
        dynamicTemplateData: options.dynamicTemplateData
      };

      // Remove undefined fields
      Object.keys(msg).forEach(key => {
        if (msg[key as keyof typeof msg] === undefined) {
          delete msg[key as keyof typeof msg];
        }
      });

      // If using local Supabase, send to Inbucket SMTP
      if (this.isLocalSupabase) {
        console.log('📧 Sending email to Inbucket (Local Development):');
        console.log('To:', msg.to);
        console.log('Subject:', msg.subject);
        console.log('📬 View at: http://127.0.0.1:54324');
        
        // Use our helper function to send to Inbucket
        const { sendToInbucket } = await import('./send-to-inbucket');
        const result = await sendToInbucket(
          Array.isArray(msg.to) ? msg.to.join(', ') : msg.to as string,
          msg.subject,
          msg.html || '',
          msg.text
        );
        
        return result;
      }

      // Skip development mode check - always try to send via SendGrid
      if (!this.isInitialized) {
        console.warn('⚠️ SendGrid not initialized, email not sent');
        return {
          success: false,
          error: 'SendGrid not initialized'
        };
      }

      // Send email via SendGrid
      const [response] = await sgMail.send(msg as any);
      
      console.log('✅ Email sent successfully:', {
        to: options.to,
        subject: options.subject,
        messageId: response.headers['x-message-id']
      });

      return {
        success: true,
        messageId: response.headers['x-message-id']
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Failed to send email:', errorMessage);
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Send multiple emails
   */
  public async sendBulkEmails(emails: EmailOptions[]): Promise<EmailResult[]> {
    const results: EmailResult[] = [];
    
    // Process emails in batches to avoid rate limits
    const batchSize = 10;
    for (let i = 0; i < emails.length; i += batchSize) {
      const batch = emails.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(email => this.sendEmail(email))
      );
      results.push(...batchResults);
      
      // Add a small delay between batches to respect rate limits
      if (i + batchSize < emails.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    return results;
  }

  /**
   * Send email with retry logic
   */
  public async sendEmailWithRetry(
    options: EmailOptions,
    maxRetries = 3,
    retryDelay = 1000
  ): Promise<EmailResult> {
    let lastError: string | undefined;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const result = await this.sendEmail(options);
      
      if (result.success) {
        return result;
      }
      
      lastError = result.error;
      console.log(`📧 Email send attempt ${attempt} failed. Retrying...`);
      
      if (attempt < maxRetries) {
        await new Promise(resolve => 
          setTimeout(resolve, retryDelay * Math.pow(2, attempt - 1))
        );
      }
    }
    
    return {
      success: false,
      error: lastError || 'Max retries exceeded'
    };
  }

  /**
   * Validate email address format
   */
  public isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Format email with name
   */
  public formatEmailWithName(email: string, name?: string): string {
    if (!name) return email;
    return `${name} <${email}>`;
  }

  /**
   * Send using a SendGrid template
   */
  public async sendTemplateEmail(
    to: string | string[],
    templateId: string,
    dynamicData: Record<string, any>
  ): Promise<EmailResult> {
    return this.sendEmail({
      to,
      subject: '', // Subject is defined in the template
      templateId,
      dynamicTemplateData: dynamicData
    });
  }

  /**
   * Test email configuration
   */
  public async testEmailConfiguration(recipientEmail: string): Promise<EmailResult> {
    console.log('🧪 Testing email configuration...');
    
    const testEmail: EmailOptions = {
      to: recipientEmail,
      subject: 'Test Email - The Phone Guys CRM',
      text: 'This is a test email from The Phone Guys CRM email system.',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #0094CA;">Test Email</h2>
          <p>This is a test email from The Phone Guys CRM email system.</p>
          <p>If you received this email, your email configuration is working correctly!</p>
          <hr style="border: 1px solid #eee; margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">
            Sent from: ${this.fromEmail}<br>
            Reply to: ${this.replyTo}<br>
            Environment: ${process.env.NODE_ENV || 'development'}<br>
            Timestamp: ${new Date().toISOString()}
          </p>
        </div>
      `
    };
    
    return this.sendEmail(testEmail);
  }
}

// Export singleton instance
export const emailService = EmailService.getInstance();