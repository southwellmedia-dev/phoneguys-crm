import { createServiceClient } from '@/lib/supabase/service';
import { SupabaseClient } from '@supabase/supabase-js';
import { TwilioService } from './twilio.service';

export interface SMSJob {
  id?: string;
  to: string | string[];
  body: string;
  from?: string;
  templateName?: string;
  templateData?: Record<string, unknown>;
  priority: 'high' | 'normal' | 'low';
  attempts: number;
  maxAttempts: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
  scheduledFor?: Date;
  processedAt?: Date;
  createdAt?: Date;
  metadata?: Record<string, unknown>;
}

export interface SMSQueueOptions {
  maxRetries?: number;
  retryDelay?: number;
  batchSize?: number;
  processInterval?: number;
}

/**
 * SMS Queue Service
 * Manages SMS queue with retry logic, batching, and persistence
 */
export class SMSQueueService {
  private static instance: SMSQueueService;
  private supabase: SupabaseClient;
  private twilioService: TwilioService;
  private options: Required<SMSQueueOptions>;
  private isProcessing: boolean = false;
  private processTimer?: NodeJS.Timer;

  private constructor(options: SMSQueueOptions = {}) {
    this.supabase = createServiceClient();
    this.twilioService = TwilioService.getInstance();
    this.options = {
      maxRetries: options.maxRetries || 3,
      retryDelay: options.retryDelay || 5000, // 5 seconds base delay
      batchSize: options.batchSize || 10,
      processInterval: options.processInterval || 30000, // 30 seconds
    };

    // Ensure SMS queue table exists
    this.initializeDatabase();
  }

  static getInstance(options?: SMSQueueOptions): SMSQueueService {
    if (!SMSQueueService.instance) {
      SMSQueueService.instance = new SMSQueueService(options);
    }
    return SMSQueueService.instance;
  }

  /**
   * Initialize database table for SMS queue
   */
  private async initializeDatabase(): Promise<void> {
    // Check if table exists
    const { error } = await this.supabase
      .from('sms_queue')
      .select('id')
      .limit(1);

    if (error && error.code === '42P01') {
      console.log('SMS queue table not found. Please run migration to create it.');
    }
  }

  /**
   * Add SMS to queue
   */
  async addToQueue(job: Omit<SMSJob, 'id' | 'attempts' | 'status' | 'createdAt'>): Promise<string> {
    const { data, error } = await this.supabase
      .from('sms_queue')
      .insert({
        to_numbers: Array.isArray(job.to) ? job.to : [job.to],
        body: job.body,
        from_number: job.from,
        template_name: job.templateName,
        template_data: job.templateData,
        priority: job.priority || 'normal',
        max_attempts: job.maxAttempts || this.options.maxRetries,
        scheduled_for: job.scheduledFor?.toISOString() || new Date().toISOString(),
        metadata: job.metadata,
      })
      .select('id')
      .single();

    if (error) {
      console.error('Failed to add SMS to queue:', error);
      throw new Error(`Failed to queue SMS: ${error.message}`);
    }

    console.log(`📱 SMS queued: ${data.id}`);
    return data.id;
  }

  /**
   * Process SMS queue
   */
  async processQueue(): Promise<void> {
    if (this.isProcessing) {
      console.log('⏳ SMS queue already processing, skipping...');
      return;
    }

    this.isProcessing = true;
    console.log('📤 Processing SMS queue...');

    try {
      // Fetch pending SMS ordered by priority and scheduled time
      const { data: messages, error } = await this.supabase
        .from('sms_queue')
        .select('*')
        .in('status', ['pending', 'processing'])
        .lte('scheduled_for', new Date().toISOString())
        .lt('attempts', this.supabase.sql`max_attempts`)
        .order('priority', { ascending: false })
        .order('scheduled_for', { ascending: true })
        .limit(this.options.batchSize);

      if (error) {
        console.error('Failed to fetch SMS queue:', error);
        return;
      }

      if (!messages || messages.length === 0) {
        console.log('✅ No SMS to process');
        return;
      }

      console.log(`📱 Processing ${messages.length} SMS messages...`);

      // Process messages in parallel (within batch size limits)
      const results = await Promise.allSettled(
        messages.map(message => this.processSMS(message))
      );

      // Log results
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;
      
      console.log(`✅ Processed ${successful} SMS successfully, ${failed} failed`);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Process individual SMS
   */
  private async processSMS(smsRecord: any): Promise<void> {
    // Mark as processing
    await this.supabase
      .from('sms_queue')
      .update({ 
        status: 'processing',
        attempts: smsRecord.attempts + 1
      })
      .eq('id', smsRecord.id);

    try {
      let result;

      // Send SMS using template or direct message
      if (smsRecord.template_name && smsRecord.template_data) {
        result = await this.twilioService.sendTemplatedSMS(
          smsRecord.to_numbers,
          smsRecord.template_name,
          smsRecord.template_data
        );
      } else {
        result = await this.twilioService.sendSMS({
          to: smsRecord.to_numbers,
          body: smsRecord.body,
          from: smsRecord.from_number,
        });
      }

      if (result.success) {
        // Mark as completed
        await this.supabase
          .from('sms_queue')
          .update({
            status: 'completed',
            processed_at: new Date().toISOString(),
            message_id: result.messageId,
          })
          .eq('id', smsRecord.id);

        console.log(`✅ SMS sent: ${smsRecord.id}`);
      } else {
        throw new Error(result.error || 'Failed to send SMS');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ Failed to send SMS ${smsRecord.id}:`, errorMessage);

      // Check if we should retry
      if (smsRecord.attempts >= smsRecord.max_attempts) {
        // Mark as failed
        await this.supabase
          .from('sms_queue')
          .update({
            status: 'failed',
            error: errorMessage,
            processed_at: new Date().toISOString(),
          })
          .eq('id', smsRecord.id);
      } else {
        // Schedule retry with exponential backoff
        const delay = this.options.retryDelay * Math.pow(2, smsRecord.attempts);
        const nextAttempt = new Date(Date.now() + delay);

        await this.supabase
          .from('sms_queue')
          .update({
            status: 'pending',
            scheduled_for: nextAttempt.toISOString(),
            error: errorMessage,
          })
          .eq('id', smsRecord.id);

        console.log(`🔄 SMS ${smsRecord.id} scheduled for retry at ${nextAttempt.toISOString()}`);
      }
    }
  }

  /**
   * Start automatic queue processing
   */
  startProcessing(): void {
    if (this.processTimer) {
      console.log('⚠️ SMS queue processing already started');
      return;
    }

    console.log('🚀 Starting SMS queue processor...');
    
    // Process immediately
    this.processQueue();

    // Then process at intervals
    this.processTimer = setInterval(() => {
      this.processQueue();
    }, this.options.processInterval);
  }

  /**
   * Stop automatic queue processing
   */
  stopProcessing(): void {
    if (this.processTimer) {
      clearInterval(this.processTimer);
      this.processTimer = undefined;
      console.log('🛑 SMS queue processor stopped');
    }
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(): Promise<{
    pending: number;
    processing: number;
    completed: number;
    failed: number;
    total: number;
  }> {
    const { data, error } = await this.supabase
      .from('sms_queue')
      .select('status')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to get SMS queue stats:', error);
      return { pending: 0, processing: 0, completed: 0, failed: 0, total: 0 };
    }

    const stats = {
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0,
      total: data?.length || 0,
    };

    data?.forEach(item => {
      stats[item.status as keyof typeof stats]++;
    });

    return stats;
  }

  /**
   * Retry failed SMS
   */
  async retryFailed(): Promise<number> {
    const { data, error } = await this.supabase
      .from('sms_queue')
      .update({
        status: 'pending',
        attempts: 0,
        scheduled_for: new Date().toISOString(),
      })
      .eq('status', 'failed')
      .select('id');

    if (error) {
      console.error('Failed to retry failed SMS:', error);
      return 0;
    }

    const count = data?.length || 0;
    console.log(`🔄 ${count} failed SMS queued for retry`);
    return count;
  }

  /**
   * Clear completed SMS older than specified days
   */
  async clearCompleted(daysOld: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const { data, error } = await this.supabase
      .from('sms_queue')
      .delete()
      .eq('status', 'completed')
      .lt('processed_at', cutoffDate.toISOString())
      .select('id');

    if (error) {
      console.error('Failed to clear completed SMS:', error);
      return 0;
    }

    const count = data?.length || 0;
    console.log(`🗑️ Cleared ${count} completed SMS older than ${daysOld} days`);
    return count;
  }
}

// Export singleton instance
export const smsQueue = SMSQueueService.getInstance();