import { createServiceClient } from '@/lib/supabase/service';
import { SupabaseClient } from '@supabase/supabase-js';

export interface EmailJob {
  id?: string;
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  fromName?: string;
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
  templateId?: string;
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

export interface EmailQueueOptions {
  maxRetries?: number;
  retryDelay?: number;
  batchSize?: number;
  processInterval?: number;
}

/**
 * Email Queue Service
 * Manages email queue with retry logic, batching, and persistence
 */
export class EmailQueueService {
  private static instance: EmailQueueService;
  private supabase: SupabaseClient;
  private options: Required<EmailQueueOptions>;
  private isProcessing: boolean = false;
  private processTimer?: NodeJS.Timer;

  private constructor(options: EmailQueueOptions = {}) {
    this.supabase = createServiceClient();
    this.options = {
      maxRetries: options.maxRetries || 3,
      retryDelay: options.retryDelay || 5000, // 5 seconds base delay
      batchSize: options.batchSize || 10,
      processInterval: options.processInterval || 30000, // 30 seconds
    };

    // Ensure email_queue table exists
    this.initializeDatabase();
  }

  static getInstance(options?: EmailQueueOptions): EmailQueueService {
    if (!EmailQueueService.instance) {
      EmailQueueService.instance = new EmailQueueService(options);
    }
    return EmailQueueService.instance;
  }

  /**
   * Initialize database table for email queue
   */
  private async initializeDatabase(): Promise<void> {
    // This would normally be in a migration, but we'll check/create if needed
    const { error } = await this.supabase
      .from('email_queue')
      .select('id')
      .limit(1);

    if (error && error.code === '42P01') {
      // Table doesn't exist, create it
      console.log('Creating email_queue table...');
      await this.createEmailQueueTable();
    }
  }

  /**
   * Create email queue table (should be in migration)
   */
  private async createEmailQueueTable(): Promise<void> {
    const sql = `
      CREATE TABLE IF NOT EXISTS email_queue (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        to_addresses TEXT[] NOT NULL,
        subject TEXT NOT NULL,
        html TEXT NOT NULL,
        text TEXT,
        from_email TEXT,
        from_name TEXT,
        reply_to TEXT,
        cc_addresses TEXT[],
        bcc_addresses TEXT[],
        template_id TEXT,
        template_data JSONB,
        priority TEXT DEFAULT 'normal',
        attempts INTEGER DEFAULT 0,
        max_attempts INTEGER DEFAULT 3,
        status TEXT DEFAULT 'pending',
        error TEXT,
        scheduled_for TIMESTAMPTZ DEFAULT NOW(),
        processed_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        metadata JSONB,
        CONSTRAINT email_queue_status_check CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
        CONSTRAINT email_queue_priority_check CHECK (priority IN ('high', 'normal', 'low'))
      );

      CREATE INDEX IF NOT EXISTS idx_email_queue_status ON email_queue(status);
      CREATE INDEX IF NOT EXISTS idx_email_queue_scheduled ON email_queue(scheduled_for);
      CREATE INDEX IF NOT EXISTS idx_email_queue_priority ON email_queue(priority DESC);
    `;

    const { error } = await this.supabase.rpc('exec_sql', { sql });
    if (error) {
      console.error('Failed to create email_queue table:', error);
    }
  }

  /**
   * Add email to queue
   */
  async addToQueue(job: Omit<EmailJob, 'id' | 'attempts' | 'status' | 'createdAt'>): Promise<string> {
    const { data, error } = await this.supabase
      .from('email_queue')
      .insert({
        to_addresses: Array.isArray(job.to) ? job.to : [job.to],
        subject: job.subject,
        html: job.html,
        text: job.text,
        from_email: job.from,
        from_name: job.fromName,
        reply_to: job.replyTo,
        cc_addresses: Array.isArray(job.cc) ? job.cc : job.cc ? [job.cc] : null,
        bcc_addresses: Array.isArray(job.bcc) ? job.bcc : job.bcc ? [job.bcc] : null,
        template_id: job.templateId,
        template_data: job.templateData,
        priority: job.priority || 'normal',
        max_attempts: job.maxAttempts || this.options.maxRetries,
        scheduled_for: job.scheduledFor?.toISOString() || new Date().toISOString(),
        metadata: job.metadata,
      })
      .select('id')
      .single();

    if (error) {
      console.error('Failed to add email to queue:', error);
      throw new Error(`Failed to queue email: ${error.message}`);
    }

    console.log(`📧 Email queued: ${data.id}`);
    return data.id;
  }

  /**
   * Process email queue
   */
  async processQueue(): Promise<void> {
    if (this.isProcessing) {
      console.log('⏳ Queue already processing, skipping...');
      return;
    }

    this.isProcessing = true;
    console.log('📬 Processing email queue...');

    try {
      // Fetch pending emails ordered by priority and scheduled time
      const { data: emails, error } = await this.supabase
        .from('email_queue')
        .select('*')
        .in('status', ['pending', 'processing'])
        .lte('scheduled_for', new Date().toISOString())
        .lt('attempts', this.supabase.sql`max_attempts`)
        .order('priority', { ascending: false })
        .order('scheduled_for', { ascending: true })
        .limit(this.options.batchSize);

      if (error) {
        console.error('Failed to fetch email queue:', error);
        return;
      }

      if (!emails || emails.length === 0) {
        console.log('✅ No emails to process');
        return;
      }

      console.log(`📧 Processing ${emails.length} emails...`);

      // Process emails in parallel (within batch size limits)
      const results = await Promise.allSettled(
        emails.map(email => this.processEmail(email))
      );

      // Log results
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;
      
      console.log(`✅ Processed ${successful} emails successfully, ${failed} failed`);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Process individual email
   */
  private async processEmail(emailRecord: any): Promise<void> {
    // Mark as processing
    await this.supabase
      .from('email_queue')
      .update({ 
        status: 'processing',
        attempts: emailRecord.attempts + 1
      })
      .eq('id', emailRecord.id);

    try {
      // Import email service dynamically to avoid circular dependency
      const { SendGridService } = await import('./sendgrid.service');
      const emailService = SendGridService.getInstance();

      // Send email
      const result = await emailService.sendEmail({
        to: emailRecord.to_addresses,
        subject: emailRecord.subject,
        html: emailRecord.html,
        text: emailRecord.text,
        from: emailRecord.from_email,
        fromName: emailRecord.from_name,
        replyTo: emailRecord.reply_to,
        cc: emailRecord.cc_addresses,
        bcc: emailRecord.bcc_addresses,
        templateId: emailRecord.template_id,
        dynamicTemplateData: emailRecord.template_data,
      });

      if (result.success) {
        // Mark as completed
        await this.supabase
          .from('email_queue')
          .update({
            status: 'completed',
            processed_at: new Date().toISOString(),
          })
          .eq('id', emailRecord.id);

        console.log(`✅ Email sent: ${emailRecord.id}`);
      } else {
        throw new Error(result.error || 'Failed to send email');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ Failed to send email ${emailRecord.id}:`, errorMessage);

      // Check if we should retry
      if (emailRecord.attempts >= emailRecord.max_attempts) {
        // Mark as failed
        await this.supabase
          .from('email_queue')
          .update({
            status: 'failed',
            error: errorMessage,
            processed_at: new Date().toISOString(),
          })
          .eq('id', emailRecord.id);
      } else {
        // Schedule retry with exponential backoff
        const delay = this.options.retryDelay * Math.pow(2, emailRecord.attempts);
        const nextAttempt = new Date(Date.now() + delay);

        await this.supabase
          .from('email_queue')
          .update({
            status: 'pending',
            scheduled_for: nextAttempt.toISOString(),
            error: errorMessage,
          })
          .eq('id', emailRecord.id);

        console.log(`🔄 Email ${emailRecord.id} scheduled for retry at ${nextAttempt.toISOString()}`);
      }
    }
  }

  /**
   * Start automatic queue processing
   */
  startProcessing(): void {
    if (this.processTimer) {
      console.log('⚠️ Queue processing already started');
      return;
    }

    console.log('🚀 Starting email queue processor...');
    
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
      console.log('🛑 Email queue processor stopped');
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
      .from('email_queue')
      .select('status')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to get queue stats:', error);
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
   * Retry failed emails
   */
  async retryFailed(): Promise<number> {
    const { data, error } = await this.supabase
      .from('email_queue')
      .update({
        status: 'pending',
        attempts: 0,
        scheduled_for: new Date().toISOString(),
      })
      .eq('status', 'failed')
      .select('id');

    if (error) {
      console.error('Failed to retry failed emails:', error);
      return 0;
    }

    const count = data?.length || 0;
    console.log(`🔄 ${count} failed emails queued for retry`);
    return count;
  }

  /**
   * Clear completed emails older than specified days
   */
  async clearCompleted(daysOld: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const { data, error } = await this.supabase
      .from('email_queue')
      .delete()
      .eq('status', 'completed')
      .lt('processed_at', cutoffDate.toISOString())
      .select('id');

    if (error) {
      console.error('Failed to clear completed emails:', error);
      return 0;
    }

    const count = data?.length || 0;
    console.log(`🗑️ Cleared ${count} completed emails older than ${daysOld} days`);
    return count;
  }
}

// Export singleton instance
export const emailQueue = EmailQueueService.getInstance();