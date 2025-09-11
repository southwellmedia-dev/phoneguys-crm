import twilio from 'twilio';

export interface SMSMessage {
  to: string;
  message: string;
  from?: string;
}

export interface SMSSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
  to: string;
}

export class SMSService {
  private client: twilio.Twilio | null = null;
  private fromNumber: string;
  private isConfigured: boolean = false;

  constructor() {
    this.initializeTwilio();
  }

  private initializeTwilio(): void {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    this.fromNumber = process.env.TWILIO_PHONE_NUMBER || '';

    if (!accountSid || !authToken || !this.fromNumber) {
      console.warn('⚠️ Twilio SMS not configured. Missing environment variables.');
      return;
    }

    try {
      this.client = twilio(accountSid, authToken);
      this.isConfigured = true;
      console.log('✅ Twilio SMS service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Twilio:', error);
      this.isConfigured = false;
    }
  }

  /**
   * Check if SMS service is properly configured
   */
  public isReady(): boolean {
    return this.isConfigured && this.client !== null;
  }

  /**
   * Validate and format phone number for SMS
   */
  public validatePhoneNumber(phone: string): { isValid: boolean; formatted: string; error?: string } {
    if (!phone) {
      return { isValid: false, formatted: '', error: 'Phone number is required' };
    }

    // Remove all non-digit characters
    const digitsOnly = phone.replace(/\D/g, '');

    // Check if it's a valid US phone number (10 digits) or international (starting with +)
    if (phone.startsWith('+')) {
      // International format - keep as is but validate length
      if (digitsOnly.length < 10 || digitsOnly.length > 15) {
        return { isValid: false, formatted: '', error: 'Invalid international phone number' };
      }
      return { isValid: true, formatted: phone };
    } else if (digitsOnly.length === 10) {
      // US format - add +1 prefix
      return { isValid: true, formatted: `+1${digitsOnly}` };
    } else if (digitsOnly.length === 11 && digitsOnly.startsWith('1')) {
      // US format with country code
      return { isValid: true, formatted: `+${digitsOnly}` };
    } else {
      return { isValid: false, formatted: '', error: 'Invalid phone number format' };
    }
  }

  /**
   * Send SMS message with retry logic
   */
  public async sendSMS(
    message: SMSMessage,
    retries: number = 3,
    retryDelay: number = 1000
  ): Promise<SMSSendResult> {
    if (!this.isReady()) {
      return {
        success: false,
        error: 'SMS service not configured',
        to: message.to
      };
    }

    // Validate phone number
    const phoneValidation = this.validatePhoneNumber(message.to);
    if (!phoneValidation.isValid) {
      return {
        success: false,
        error: phoneValidation.error || 'Invalid phone number',
        to: message.to
      };
    }

    // Validate message length
    if (message.message.length > 1600) {
      return {
        success: false,
        error: 'Message too long (max 1600 characters)',
        to: message.to
      };
    }

    let lastError: string = '';
    
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const result = await this.client!.messages.create({
          body: message.message,
          from: message.from || this.fromNumber,
          to: phoneValidation.formatted
        });

        console.log(`✅ SMS sent successfully to ${phoneValidation.formatted} (ID: ${result.sid})`);
        
        return {
          success: true,
          messageId: result.sid,
          to: phoneValidation.formatted
        };
      } catch (error: any) {
        lastError = error.message || 'Unknown error';
        console.error(`❌ SMS attempt ${attempt} failed:`, error);

        // Don't retry for certain errors
        if (error.code === 21211 || error.code === 21614) { // Invalid phone number or unsubscribed
          break;
        }

        // Wait before retry (unless it's the last attempt)
        if (attempt < retries) {
          await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
        }
      }
    }

    return {
      success: false,
      error: lastError,
      to: phoneValidation.formatted || message.to
    };
  }

  /**
   * Send multiple SMS messages in batch
   */
  public async sendBatchSMS(
    messages: SMSMessage[],
    concurrencyLimit: number = 5
  ): Promise<SMSSendResult[]> {
    const results: SMSSendResult[] = [];
    
    // Process messages in batches to avoid rate limits
    for (let i = 0; i < messages.length; i += concurrencyLimit) {
      const batch = messages.slice(i, i + concurrencyLimit);
      const batchPromises = batch.map(message => this.sendSMS(message));
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      // Small delay between batches
      if (i + concurrencyLimit < messages.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    return results;
  }

  /**
   * Get Twilio account balance (if needed for monitoring)
   */
  public async getAccountBalance(): Promise<{ balance?: string; currency?: string; error?: string }> {
    if (!this.isReady()) {
      return { error: 'SMS service not configured' };
    }

    try {
      const account = await this.client!.api.accounts(process.env.TWILIO_ACCOUNT_SID).fetch();
      return {
        balance: account.balance,
        currency: account.currency || 'USD'
      };
    } catch (error: any) {
      return { error: error.message || 'Failed to fetch account balance' };
    }
  }

  /**
   * Check message delivery status
   */
  public async getMessageStatus(messageId: string): Promise<{ status?: string; error?: string }> {
    if (!this.isReady()) {
      return { error: 'SMS service not configured' };
    }

    try {
      const message = await this.client!.messages(messageId).fetch();
      return { status: message.status };
    } catch (error: any) {
      return { error: error.message || 'Failed to fetch message status' };
    }
  }

  /**
   * Get SMS usage for current period
   */
  public async getSMSUsage(startDate?: Date, endDate?: Date): Promise<{
    count?: number;
    totalPrice?: string;
    error?: string;
  }> {
    if (!this.isReady()) {
      return { error: 'SMS service not configured' };
    }

    try {
      const usage = await this.client!.usage.records.list({
        category: 'sms',
        startDate: startDate,
        endDate: endDate,
        limit: 50
      });

      const totalCount = usage.reduce((sum, record) => sum + parseInt(record.count), 0);
      const totalPrice = usage.reduce((sum, record) => sum + parseFloat(record.price), 0).toFixed(2);

      return {
        count: totalCount,
        totalPrice: totalPrice
      };
    } catch (error: any) {
      return { error: error.message || 'Failed to fetch SMS usage' };
    }
  }

  /**
   * Test SMS configuration
   */
  public async testConfiguration(testPhoneNumber?: string): Promise<{ success: boolean; error?: string }> {
    if (!testPhoneNumber) {
      return { success: false, error: 'Test phone number required' };
    }

    const testMessage: SMSMessage = {
      to: testPhoneNumber,
      message: 'Test message from The Phone Guys CRM - SMS integration is working!'
    };

    const result = await this.sendSMS(testMessage);
    return {
      success: result.success,
      error: result.error
    };
  }
}

// Singleton instance
let smsServiceInstance: SMSService | null = null;

export function getSMSService(): SMSService {
  if (!smsServiceInstance) {
    smsServiceInstance = new SMSService();
  }
  return smsServiceInstance;
}