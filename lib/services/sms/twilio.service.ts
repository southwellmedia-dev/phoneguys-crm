import twilio from 'twilio';
import { Twilio } from 'twilio';
import { MessageInstance } from 'twilio/lib/rest/api/v2010/account/message';

export interface TwilioSMSOptions {
  to: string | string[];
  body: string;
  from?: string;
  mediaUrl?: string[];
  statusCallback?: string;
  scheduledTime?: Date;
  messagingServiceSid?: string;
}

export interface TwilioResponse {
  success: boolean;
  messageId?: string;
  error?: string;
  details?: any;
}

export interface SMSTemplate {
  name: string;
  template: string;
  variables?: string[];
}

/**
 * Twilio SMS Service
 * Handles SMS sending through Twilio API
 */
export class TwilioService {
  private static instance: TwilioService;
  private client: Twilio | null = null;
  private initialized: boolean = false;
  private phoneNumber: string;
  private messagingServiceSid?: string;
  private templates: Map<string, SMSTemplate> = new Map();

  private constructor() {
    this.phoneNumber = process.env.TWILIO_PHONE_NUMBER || '';
    this.messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;
    this.initialize();
    this.registerDefaultTemplates();
  }

  static getInstance(): TwilioService {
    if (!TwilioService.instance) {
      TwilioService.instance = new TwilioService();
    }
    return TwilioService.instance;
  }

  /**
   * Initialize Twilio client
   */
  private initialize(): void {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;

    if (!accountSid || !authToken) {
      console.error('❌ Twilio credentials not found in environment variables');
      return;
    }

    if (!this.phoneNumber && !this.messagingServiceSid) {
      console.error('❌ Twilio phone number or messaging service SID required');
      return;
    }

    try {
      this.client = twilio(accountSid, authToken);
      this.initialized = true;
      console.log('✅ Twilio initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Twilio:', error);
    }
  }

  /**
   * Register default SMS templates
   */
  private registerDefaultTemplates(): void {
    // Ticket confirmation
    this.templates.set('ticket-confirmation', {
      name: 'Ticket Confirmation',
      template: 'The Phone Guys: Your repair ticket {{ticketNumber}} has been created for {{device}}. We\'ll notify you when it\'s ready.',
      variables: ['ticketNumber', 'device'],
    });

    // Status update
    this.templates.set('status-update', {
      name: 'Status Update',
      template: 'The Phone Guys: Your repair {{ticketNumber}} status changed to {{status}}. {{notes}}',
      variables: ['ticketNumber', 'status', 'notes'],
    });

    // Repair complete
    this.templates.set('repair-complete', {
      name: 'Repair Complete',
      template: 'The Phone Guys: Great news! Your {{device}} ({{ticketNumber}}) is ready for pickup. Total: ${{cost}}',
      variables: ['device', 'ticketNumber', 'cost'],
    });

    // Appointment reminder
    this.templates.set('appointment-reminder', {
      name: 'Appointment Reminder',
      template: 'The Phone Guys: Reminder - Your appointment is {{date}} at {{time}}. Reply CONFIRM to confirm or CANCEL to cancel.',
      variables: ['date', 'time'],
    });

    // OTP/Verification
    this.templates.set('verification', {
      name: 'Verification Code',
      template: 'The Phone Guys: Your verification code is {{code}}. It expires in {{minutes}} minutes.',
      variables: ['code', 'minutes'],
    });

    // Custom notification
    this.templates.set('custom', {
      name: 'Custom Message',
      template: '{{message}}',
      variables: ['message'],
    });
  }

  /**
   * Send SMS via Twilio
   */
  async sendSMS(options: TwilioSMSOptions): Promise<TwilioResponse> {
    if (!this.initialized || !this.client) {
      return {
        success: false,
        error: 'Twilio is not initialized. Please check your credentials.',
      };
    }

    try {
      const recipients = Array.isArray(options.to) ? options.to : [options.to];
      const results: TwilioResponse[] = [];

      for (const recipient of recipients) {
        try {
          // Validate phone number format
          const formattedNumber = this.formatPhoneNumber(recipient);
          if (!formattedNumber) {
            results.push({
              success: false,
              error: `Invalid phone number: ${recipient}`,
            });
            continue;
          }

          // Prepare message options
          const messageOptions: any = {
            body: options.body,
            to: formattedNumber,
          };

          // Use messaging service SID if available, otherwise use phone number
          if (options.messagingServiceSid || this.messagingServiceSid) {
            messageOptions.messagingServiceSid = options.messagingServiceSid || this.messagingServiceSid;
          } else {
            messageOptions.from = options.from || this.phoneNumber;
          }

          // Add optional parameters
          if (options.mediaUrl && options.mediaUrl.length > 0) {
            messageOptions.mediaUrl = options.mediaUrl;
          }

          if (options.statusCallback) {
            messageOptions.statusCallback = options.statusCallback;
          }

          if (options.scheduledTime) {
            // Twilio requires scheduled messages to be sent via Messaging Service
            if (!messageOptions.messagingServiceSid) {
              throw new Error('Scheduled messages require a Messaging Service SID');
            }
            messageOptions.sendAt = options.scheduledTime;
            messageOptions.scheduleType = 'fixed';
          }

          // Send the message
          const message: MessageInstance = await this.client.messages.create(messageOptions);

          console.log(`✅ SMS sent successfully to ${formattedNumber}: ${message.sid}`);

          results.push({
            success: true,
            messageId: message.sid,
            details: {
              status: message.status,
              dateCreated: message.dateCreated,
              price: message.price,
              priceUnit: message.priceUnit,
            },
          });
        } catch (error: any) {
          console.error(`❌ Failed to send SMS to ${recipient}:`, error);
          results.push({
            success: false,
            error: error.message || 'Failed to send SMS',
            details: error,
          });
        }
      }

      // If sending to single recipient, return single result
      if (!Array.isArray(options.to)) {
        return results[0];
      }

      // For multiple recipients, return aggregated result
      const allSuccessful = results.every(r => r.success);
      const successCount = results.filter(r => r.success).length;

      return {
        success: allSuccessful,
        details: {
          totalRecipients: recipients.length,
          successCount,
          failureCount: recipients.length - successCount,
          results,
        },
      };
    } catch (error: any) {
      console.error('❌ Twilio error:', error);
      return {
        success: false,
        error: error.message || 'Failed to send SMS',
        details: error,
      };
    }
  }

  /**
   * Send SMS using template
   */
  async sendTemplatedSMS(
    to: string | string[],
    templateName: string,
    data: Record<string, any>
  ): Promise<TwilioResponse> {
    const template = this.templates.get(templateName);
    
    if (!template) {
      return {
        success: false,
        error: `Template '${templateName}' not found`,
      };
    }

    // Replace template variables
    let body = template.template;
    if (template.variables) {
      for (const variable of template.variables) {
        const value = data[variable] || '';
        body = body.replace(new RegExp(`{{${variable}}}`, 'g'), value);
      }
    }

    return this.sendSMS({ to, body });
  }

  /**
   * Send repair ticket confirmation SMS
   */
  async sendTicketConfirmation(data: {
    phoneNumber: string;
    ticketNumber: string;
    device: string;
  }): Promise<TwilioResponse> {
    return this.sendTemplatedSMS(data.phoneNumber, 'ticket-confirmation', {
      ticketNumber: data.ticketNumber,
      device: data.device,
    });
  }

  /**
   * Send status update SMS
   */
  async sendStatusUpdate(data: {
    phoneNumber: string;
    ticketNumber: string;
    status: string;
    notes?: string;
  }): Promise<TwilioResponse> {
    return this.sendTemplatedSMS(data.phoneNumber, 'status-update', {
      ticketNumber: data.ticketNumber,
      status: data.status,
      notes: data.notes || '',
    });
  }

  /**
   * Send repair completion SMS
   */
  async sendRepairComplete(data: {
    phoneNumber: string;
    device: string;
    ticketNumber: string;
    cost: number;
  }): Promise<TwilioResponse> {
    return this.sendTemplatedSMS(data.phoneNumber, 'repair-complete', {
      device: data.device,
      ticketNumber: data.ticketNumber,
      cost: data.cost.toFixed(2),
    });
  }

  /**
   * Send appointment reminder SMS
   */
  async sendAppointmentReminder(data: {
    phoneNumber: string;
    date: string;
    time: string;
  }): Promise<TwilioResponse> {
    return this.sendTemplatedSMS(data.phoneNumber, 'appointment-reminder', {
      date: data.date,
      time: data.time,
    });
  }

  /**
   * Send verification code SMS
   */
  async sendVerificationCode(data: {
    phoneNumber: string;
    code: string;
    expiryMinutes?: number;
  }): Promise<TwilioResponse> {
    return this.sendTemplatedSMS(data.phoneNumber, 'verification', {
      code: data.code,
      minutes: data.expiryMinutes || 10,
    });
  }

  /**
   * Format phone number to E.164 format
   */
  private formatPhoneNumber(phoneNumber: string): string | null {
    // Remove all non-numeric characters
    const cleaned = phoneNumber.replace(/\D/g, '');

    // Check if it's already in E.164 format
    if (phoneNumber.startsWith('+') && cleaned.length >= 10) {
      return phoneNumber;
    }

    // Assume US number if 10 digits
    if (cleaned.length === 10) {
      return `+1${cleaned}`;
    }

    // If 11 digits starting with 1, assume US number
    if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return `+${cleaned}`;
    }

    // Invalid format
    return null;
  }

  /**
   * Validate phone number
   */
  validatePhoneNumber(phoneNumber: string): boolean {
    const formatted = this.formatPhoneNumber(phoneNumber);
    return formatted !== null;
  }

  /**
   * Get message status
   */
  async getMessageStatus(messageId: string): Promise<any> {
    if (!this.initialized || !this.client) {
      return {
        success: false,
        error: 'Twilio is not initialized',
      };
    }

    try {
      const message = await this.client.messages(messageId).fetch();
      return {
        success: true,
        status: message.status,
        details: {
          dateCreated: message.dateCreated,
          dateSent: message.dateSent,
          dateUpdated: message.dateUpdated,
          errorCode: message.errorCode,
          errorMessage: message.errorMessage,
          price: message.price,
          priceUnit: message.priceUnit,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to get message status',
      };
    }
  }

  /**
   * List recent messages
   */
  async listMessages(options?: {
    limit?: number;
    dateSent?: Date;
    to?: string;
    from?: string;
  }): Promise<any> {
    if (!this.initialized || !this.client) {
      return {
        success: false,
        error: 'Twilio is not initialized',
      };
    }

    try {
      const messages = await this.client.messages.list({
        limit: options?.limit || 20,
        dateSent: options?.dateSent,
        to: options?.to,
        from: options?.from,
      });

      return {
        success: true,
        messages: messages.map(msg => ({
          sid: msg.sid,
          to: msg.to,
          from: msg.from,
          body: msg.body,
          status: msg.status,
          dateSent: msg.dateSent,
          price: msg.price,
        })),
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to list messages',
      };
    }
  }

  /**
   * Test Twilio connection
   */
  async testConnection(): Promise<boolean> {
    if (!this.initialized || !this.client) {
      console.error('❌ Twilio not initialized');
      return false;
    }

    try {
      // Try to fetch account details
      const account = await this.client.api.accounts(process.env.TWILIO_ACCOUNT_SID!).fetch();
      console.log(`✅ Twilio connection successful. Account: ${account.friendlyName}`);
      return true;
    } catch (error) {
      console.error('❌ Twilio connection test failed:', error);
      return false;
    }
  }

  /**
   * Register custom template
   */
  registerTemplate(name: string, template: SMSTemplate): void {
    this.templates.set(name, template);
  }

  /**
   * Get available templates
   */
  getAvailableTemplates(): string[] {
    return Array.from(this.templates.keys());
  }
}

// Export singleton instance
export const twilioService = TwilioService.getInstance();