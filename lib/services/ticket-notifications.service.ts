import { createServiceClient } from '@/lib/supabase/service';
import { SendGridService } from './email/sendgrid.service';
import { TwilioService } from './sms/twilio.service';
import { ticketStatusUpdateTemplate } from '@/lib/email-templates/ticket-status-update';
import { SMS_TEMPLATES, processSMSTemplate } from '@/lib/templates/sms-templates';

interface TicketNotificationData {
  ticket: any;
  customer: any;
  device?: any;
  previousStatus?: string;
  newStatus: string;
  notes?: string;
  completionNotes?: string;
  holdReason?: string;
  cancellationReason?: string;
  totalCost?: number;
}

export class TicketNotificationService {
  private emailService: SendGridService;
  private smsService: TwilioService;
  private supabase: any;

  constructor() {
    console.log('🔄 Initializing TicketNotificationService...');
    this.emailService = SendGridService.getInstance();
    this.smsService = TwilioService.getInstance();
    this.supabase = createServiceClient();
    console.log('✅ TicketNotificationService initialized');
  }

  /**
   * Send notifications when ticket status changes
   */
  async sendStatusUpdateNotifications(data: TicketNotificationData) {
    console.log(`🔔 TicketNotificationService.sendStatusUpdateNotifications called for status: ${data.newStatus}`);
    console.log(`   Ticket: ${data.ticket?.ticket_number}, Customer: ${data.customer?.name}`);
    
    const results = {
      customerEmail: false,
      customerSMS: false,
      errors: [] as string[]
    };

    // Get customer notification preferences
    const { data: preferences } = await this.supabase
      .from('notification_preferences')
      .select('*')
      .eq('customer_id', data.customer.id)
      .single();

    const consentEmail = preferences?.email_enabled !== false;
    const consentSMS = preferences?.sms_enabled !== false;

    // Only send notifications for significant status changes
    const notifiableStatuses = ['in_progress', 'completed', 'on_hold', 'cancelled'];
    if (!notifiableStatuses.includes(data.newStatus)) {
      console.log(`Status ${data.newStatus} does not trigger notifications`);
      return results;
    }

    // 1. Send customer email notification
    if (consentEmail && data.customer.email) {
      try {
        console.log(`📧 Sending ${data.newStatus} status email to:`, data.customer.email);
        
        const emailTemplate = ticketStatusUpdateTemplate({
          customerName: data.customer.name,
          ticketNumber: data.ticket.ticket_number,
          deviceBrand: data.device?.brand || data.ticket.device_brand,
          deviceModel: data.device?.model_name || data.ticket.device_model,
          status: data.newStatus as any,
          estimatedCost: data.ticket.estimated_cost ? parseFloat(data.ticket.estimated_cost) : undefined,
          totalCost: data.totalCost,
          notes: data.notes,
          statusUrl: `https://status.phoneguysrepair.com?ticket=${data.ticket.ticket_number}`,
          completionNotes: data.completionNotes,
          holdReason: data.holdReason,
          cancellationReason: data.cancellationReason
        });

        const emailResult = await this.emailService.sendEmail({
          to: data.customer.email,
          subject: emailTemplate.subject,
          html: emailTemplate.html,
          text: emailTemplate.text
        });

        if (emailResult.success) {
          console.log('✅ Customer status email sent successfully');
          results.customerEmail = true;

          // Log email notification in database
          await this.supabase.from('notifications').insert({
            recipient_email: data.customer.email,
            notification_type: `ticket_${data.newStatus}`,
            subject: emailTemplate.subject,
            content: emailTemplate.html,
            status: 'sent',
            sent_at: new Date().toISOString(),
            metadata: {
              ticket_id: data.ticket.id,
              ticket_number: data.ticket.ticket_number,
              customer_id: data.customer.id,
              previous_status: data.previousStatus,
              new_status: data.newStatus
            }
          });
        } else {
          throw new Error(emailResult.error || 'Email send failed');
        }
      } catch (error) {
        console.error('❌ Failed to send customer email:', error);
        results.errors.push(`Customer email failed: ${error.message}`);
      }
    }

    // 2. Send customer SMS notification
    if (consentSMS && data.customer.phone) {
      try {
        console.log(`📱 Sending ${data.newStatus} status SMS to:`, data.customer.phone);
        
        let smsMessage = '';
        const statusDomain = process.env.NEXT_PUBLIC_STATUS_URL || 'https://status.phoneguysrepair.com';
        
        switch (data.newStatus) {
          case 'in_progress':
            smsMessage = `Good news! We've started working on your ${data.device?.brand || data.ticket.device_brand} ${data.device?.model_name || data.ticket.device_model}. Ticket: ${data.ticket.ticket_number}. Track progress: ${statusDomain} - Phone Guys`;
            break;
          
          case 'completed':
            smsMessage = `Your device is ready! ${data.device?.brand || data.ticket.device_brand} ${data.device?.model_name || data.ticket.device_model} repair completed. Ticket: ${data.ticket.ticket_number}${data.totalCost ? ` Total: $${data.totalCost.toFixed(2)}` : ''}. Pick up at your convenience. - Phone Guys`;
            break;
          
          case 'on_hold':
            smsMessage = `Your repair (${data.ticket.ticket_number}) is on hold. ${data.holdReason ? `Reason: ${data.holdReason.substring(0, 50)}` : 'We need parts or info'}. We'll update you soon. Call (844) 511-0454 for info. - Phone Guys`;
            break;
          
          case 'cancelled':
            smsMessage = `Your repair (${data.ticket.ticket_number}) has been cancelled. ${data.cancellationReason ? `Reason: ${data.cancellationReason.substring(0, 40)}` : 'Contact us if you have questions'}. - Phone Guys`;
            break;
        }

        if (smsMessage) {
          // TEMPORARY: Send to Virtual Phone for testing
          const testPhoneNumber = '+18777804236';
          console.log('📱 TEST MODE: Sending SMS to Virtual Phone instead of:', data.customer.phone);

          const smsResult = await this.smsService.sendSMS({
            to: testPhoneNumber,
            body: smsMessage
          });

          if (smsResult.success) {
            console.log('✅ Customer status SMS sent successfully');
            results.customerSMS = true;

            // Log SMS notification in database
            await this.supabase.from('sms_messages').insert({
              to_number: data.customer.phone, // Store original phone for record
              from_number: process.env.TWILIO_PHONE_NUMBER,
              message_body: smsMessage,
              status: 'sent',
              direction: 'outbound',
              ticket_id: data.ticket.id,
              customer_id: data.customer.id,
              message_sid: smsResult.messageId,
              created_at: new Date().toISOString()
            });
          } else {
            throw new Error(smsResult.error || 'SMS send failed');
          }
        }
      } catch (error) {
        console.error('❌ Failed to send customer SMS:', error);
        results.errors.push(`Customer SMS failed: ${error.message}`);
      }
    }

    // 3. Send admin notifications for completed tickets
    if (data.newStatus === 'completed') {
      try {
        console.log('👥 Sending completion notifications to staff...');
        
        const { data: adminUsers } = await this.supabase
          .from('users')
          .select('id, email, role')
          .in('role', ['admin', 'manager'])
          .eq('status', 'active');

        if (adminUsers && adminUsers.length > 0) {
          for (const admin of adminUsers) {
            if (admin.email) {
              await this.emailService.sendEmail({
                to: admin.email,
                subject: `Ticket Completed: ${data.ticket.ticket_number}`,
                html: `
                  <h2>Ticket Completed</h2>
                  <p><strong>Ticket:</strong> ${data.ticket.ticket_number}</p>
                  <p><strong>Customer:</strong> ${data.customer.name}</p>
                  <p><strong>Device:</strong> ${data.device?.brand || data.ticket.device_brand} ${data.device?.model_name || data.ticket.device_model}</p>
                  ${data.totalCost ? `<p><strong>Total Cost:</strong> $${data.totalCost.toFixed(2)}</p>` : ''}
                  ${data.completionNotes ? `<p><strong>Notes:</strong> ${data.completionNotes}</p>` : ''}
                  <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/orders/${data.ticket.id}">View Ticket</a></p>
                `,
                text: `Ticket ${data.ticket.ticket_number} completed for ${data.customer.name}. Device: ${data.device?.brand || data.ticket.device_brand} ${data.device?.model_name || data.ticket.device_model}.`
              });
            }
          }
        }
      } catch (error) {
        console.error('❌ Failed to send admin notifications:', error);
        results.errors.push(`Admin notifications failed: ${error.message}`);
      }
    }

    return results;
  }

  /**
   * Send notifications when appointment is converted to ticket
   * (This is called from appointment.service.ts)
   */
  async sendTicketCreatedNotifications(data: {
    ticket: any;
    customer: any;
    device?: any;
    appointment?: any;
    issues?: string[];
  }) {
    const results = {
      customerEmail: false,
      customerSMS: false,
      errors: [] as string[]
    };

    // Get customer notification preferences
    const { data: preferences } = await this.supabase
      .from('notification_preferences')
      .select('*')
      .eq('customer_id', data.customer.id)
      .single();

    const consentEmail = preferences?.email_enabled !== false;
    const consentSMS = preferences?.sms_enabled !== false;

    // 1. Send customer email about ticket creation
    if (consentEmail && data.customer.email) {
      try {
        console.log('📧 Sending ticket creation email to:', data.customer.email);
        
        const subject = `Your Repair Has Started - Ticket ${data.ticket.ticket_number}`;
        const html = `
          <h2>Your Repair Has Started!</h2>
          <p>Hi ${data.customer.name},</p>
          <p>Great news! We've checked in your device and started working on your repair.</p>
          
          <h3>Repair Details:</h3>
          <ul>
            <li><strong>Ticket Number:</strong> ${data.ticket.ticket_number}</li>
            ${data.appointment ? `<li><strong>Original Appointment:</strong> ${data.appointment.appointment_number}</li>` : ''}
            <li><strong>Device:</strong> ${data.device?.brand || data.ticket.device_brand} ${data.device?.model_name || data.ticket.device_model}</li>
            <li><strong>Services:</strong> ${data.issues?.join(', ') || 'General Diagnosis'}</li>
          </ul>
          
          <p><strong>What's Happening:</strong></p>
          <ul>
            <li>Your device is now in our repair queue</li>
            <li>Our technicians are evaluating the issues</li>
            <li>We'll provide updates as work progresses</li>
            <li>You'll be notified when your device is ready</li>
          </ul>
          
          <p>You can track your repair progress anytime at: <a href="https://status.phoneguysrepair.com?ticket=${data.ticket.ticket_number}">status.phoneguysrepair.com</a></p>
          
          <p>Questions? Just reply to this email or call us at (844) 511-0454.</p>
          
          <p>Thanks for choosing The Phone Guys!</p>
          <p>The Phone Guys Team</p>
        `;

        const emailResult = await this.emailService.sendEmail({
          to: data.customer.email,
          subject: subject,
          html: html,
          text: `Your repair has started! Ticket ${data.ticket.ticket_number} for your ${data.device?.brand || data.ticket.device_brand} ${data.device?.model_name || data.ticket.device_model} is now in progress. Track status at status.phoneguysrepair.com.`
        });

        if (emailResult.success) {
          console.log('✅ Ticket creation email sent');
          results.customerEmail = true;
        }
      } catch (error) {
        console.error('❌ Failed to send ticket creation email:', error);
        results.errors.push(`Email failed: ${error.message}`);
      }
    }

    // 2. Send customer SMS about ticket creation
    if (consentSMS && data.customer.phone) {
      try {
        const message = `Your repair has started! Ticket ${data.ticket.ticket_number} for your ${data.device?.brand || data.ticket.device_brand} ${data.device?.model_name || data.ticket.device_model}. Track: status.phoneguysrepair.com - Phone Guys`;
        
        // TEMPORARY: Send to Virtual Phone for testing
        const testPhoneNumber = '+18777804236';
        console.log('📱 TEST MODE: Sending SMS to Virtual Phone');

        const smsResult = await this.smsService.sendSMS({
          to: testPhoneNumber,
          body: message
        });

        if (smsResult.success) {
          console.log('✅ Ticket creation SMS sent');
          results.customerSMS = true;
        }
      } catch (error) {
        console.error('❌ Failed to send ticket creation SMS:', error);
        results.errors.push(`SMS failed: ${error.message}`);
      }
    }

    return results;
  }
}

// Export singleton instance
let instance: TicketNotificationService;

export function getTicketNotificationService(): TicketNotificationService {
  if (!instance) {
    instance = new TicketNotificationService();
  }
  return instance;
}