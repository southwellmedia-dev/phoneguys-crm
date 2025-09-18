import { createServiceClient } from '@/lib/supabase/service';
import { SendGridService } from './email/sendgrid.service';
import { TwilioService } from './sms/twilio.service';
import { appointmentConfirmationTemplate } from '@/lib/email-templates/appointment-confirmation';
import { SMS_TEMPLATES, processSMSTemplate } from '@/lib/templates/sms-templates';

interface AppointmentNotificationData {
  appointment: any;
  customer: any;
  device?: any;
  issues?: string[];
  consentEmail?: boolean;
  consentSMS?: boolean;
}

export class AppointmentNotificationService {
  private emailService: SendGridService;
  private smsService: TwilioService;
  private supabase: any;

  constructor() {
    this.emailService = SendGridService.getInstance();
    this.smsService = TwilioService.getInstance();
    this.supabase = createServiceClient();
  }

  /**
   * Send all notifications for a new appointment
   */
  async sendAppointmentNotifications(data: AppointmentNotificationData) {
    const results = {
      customerEmail: false,
      customerSMS: false,
      adminNotifications: false,
      errors: [] as string[]
    };

    // Format date and time for display
    const formatTime = (time: string) => {
      const [hours, minutes] = time.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 || 12;
      return `${displayHour}:${minutes} ${ampm}`;
    };

    const formatDate = (dateStr: string) => {
      const date = new Date(dateStr + 'T00:00:00');
      const options: Intl.DateTimeFormatOptions = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      };
      return date.toLocaleDateString('en-US', options);
    };

    const formatShortDate = (dateStr: string) => {
      const date = new Date(dateStr + 'T00:00:00');
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    // 1. Send customer email notification
    if (data.consentEmail !== false && data.customer.email) {
      try {
        console.log('📧 Sending appointment confirmation email to:', data.customer.email);
        
        const emailTemplate = appointmentConfirmationTemplate({
          customerName: data.customer.name,
          appointmentNumber: data.appointment.appointment_number,
          appointmentDate: formatDate(data.appointment.scheduled_date),
          appointmentTime: formatTime(data.appointment.scheduled_time),
          deviceBrand: data.device?.brand || 'Your',
          deviceModel: data.device?.model_name || 'Device',
          issues: data.issues || ['General Diagnosis'],
          estimatedCost: data.appointment.estimated_cost ? parseFloat(data.appointment.estimated_cost) : undefined,
          notes: data.appointment.description || data.appointment.notes,
          confirmationUrl: `${process.env.NEXT_PUBLIC_APP_URL}/track/${data.appointment.appointment_number}`
        });

        const emailResult = await this.emailService.sendEmail({
          to: data.customer.email,
          subject: emailTemplate.subject,
          html: emailTemplate.html,
          text: emailTemplate.text
        });

        if (emailResult.success) {
          console.log('✅ Customer email sent successfully');
          results.customerEmail = true;

          // Log email notification in database
          await this.supabase.from('notifications').insert({
            recipient_email: data.customer.email,
            notification_type: 'appointment_confirmation',
            subject: emailTemplate.subject,
            content: emailTemplate.html,
            status: 'sent',
            sent_at: new Date().toISOString(),
            metadata: {
              appointment_id: data.appointment.id,
              appointment_number: data.appointment.appointment_number,
              customer_id: data.customer.id
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
    if (data.consentSMS !== false && data.customer.phone) {
      try {
        // TEMPORARY: Override phone number with Twilio Virtual Phone for testing
        const testPhoneNumber = '+18777804236'; // Twilio Virtual Phone
        console.log('📱 TEST MODE: Sending SMS to Virtual Phone instead of:', data.customer.phone);
        console.log('📱 Sending appointment confirmation SMS to:', testPhoneNumber);
        
        // Generate status page URL using the dedicated status domain
        const statusDomain = process.env.NEXT_PUBLIC_STATUS_URL || 'https://status.phoneguysrepair.com';
        const statusUrl = statusDomain; // Status domain will redirect to /status automatically
        
        const smsTemplate = processSMSTemplate('appointment_received', {
          customerName: data.customer.name,
          appointmentNumber: data.appointment.appointment_number,
          appointmentDate: formatShortDate(data.appointment.scheduled_date),
          appointmentTime: formatTime(data.appointment.scheduled_time),
          deviceBrand: data.device?.brand || 'Your',
          deviceModel: data.device?.model_name || 'Device',
          businessName: 'Phone Guys',
          businessPhone: process.env.BUSINESS_PHONE || '(844) 511-0454',
          statusUrl: statusUrl
        });

        const smsResult = await this.smsService.sendSMS({
          to: testPhoneNumber, // Using Virtual Phone for testing
          body: smsTemplate.message
        });

        if (smsResult.success) {
          console.log('✅ Customer SMS sent successfully');
          results.customerSMS = true;

          // Log SMS notification in database (storing original phone for record)
          await this.supabase.from('sms_messages').insert({
            to_number: data.customer.phone, // Store original phone for record
            from_number: process.env.TWILIO_PHONE_NUMBER,
            message_body: smsTemplate.message,
            status: 'sent',
            direction: 'outbound',
            appointment_id: data.appointment.id,
            customer_id: data.customer.id,
            message_sid: smsResult.messageId,
            created_at: new Date().toISOString()
          });
        } else {
          throw new Error(smsResult.error || 'SMS send failed');
        }
      } catch (error) {
        console.error('❌ Failed to send customer SMS:', error);
        results.errors.push(`Customer SMS failed: ${error.message}`);
      }
    }

    // 3. Send admin/staff notifications
    try {
      console.log('👥 Sending admin notifications...');
      
      // Get all admin/staff users who should be notified
      const { data: adminUsers } = await this.supabase
        .from('users')
        .select('id, email, phone, role, notification_preferences')
        .in('role', ['admin', 'staff', 'manager']);

      if (adminUsers && adminUsers.length > 0) {
        const adminNotificationPromises = [];

        for (const admin of adminUsers) {
          // Check if admin wants email notifications for new appointments
          if (admin.email && admin.notification_preferences?.email_new_appointments !== false) {
            adminNotificationPromises.push(
              this.sendAdminEmailNotification(admin, data)
            );
          }

          // Check if admin wants SMS notifications for new appointments
          if (admin.phone && admin.notification_preferences?.sms_new_appointments === true) {
            adminNotificationPromises.push(
              this.sendAdminSMSNotification(admin, data)
            );
          }
        }

        const adminResults = await Promise.allSettled(adminNotificationPromises);
        const successCount = adminResults.filter(r => r.status === 'fulfilled').length;
        
        console.log(`✅ Sent ${successCount}/${adminNotificationPromises.length} admin notifications`);
        results.adminNotifications = successCount > 0;
      }
    } catch (error) {
      console.error('❌ Failed to send admin notifications:', error);
      results.errors.push(`Admin notifications failed: ${error.message}`);
    }

    return results;
  }

  /**
   * Send email notification to an admin about new appointment
   */
  private async sendAdminEmailNotification(admin: any, data: AppointmentNotificationData) {
    const formatTime = (time: string) => {
      const [hours, minutes] = time.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 || 12;
      return `${displayHour}:${minutes} ${ampm}`;
    };

    const formatDate = (dateStr: string) => {
      const date = new Date(dateStr + 'T00:00:00');
      return date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
    };

    const subject = `New Appointment: ${data.customer.name} - ${formatDate(data.appointment.scheduled_date)} at ${formatTime(data.appointment.scheduled_time)}`;
    
    const html = `
      <h2>New Appointment Scheduled</h2>
      <p><strong>Customer:</strong> ${data.customer.name}</p>
      <p><strong>Phone:</strong> ${data.customer.phone}</p>
      <p><strong>Email:</strong> ${data.customer.email}</p>
      <p><strong>Date:</strong> ${formatDate(data.appointment.scheduled_date)}</p>
      <p><strong>Time:</strong> ${formatTime(data.appointment.scheduled_time)}</p>
      <p><strong>Device:</strong> ${data.device?.brand || ''} ${data.device?.model_name || 'Unknown Device'}</p>
      <p><strong>Issues:</strong> ${data.issues?.join(', ') || 'General Diagnosis'}</p>
      <p><strong>Confirmation #:</strong> ${data.appointment.appointment_number}</p>
      ${data.appointment.notes ? `<p><strong>Notes:</strong> ${data.appointment.notes}</p>` : ''}
      <hr>
      <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/appointments/${data.appointment.id}">View Appointment</a></p>
    `;

    return this.emailService.sendEmail({
      to: admin.email,
      subject,
      html,
      text: html.replace(/<[^>]*>/g, '') // Simple HTML strip
    });
  }

  /**
   * Send SMS notification to an admin about new appointment
   */
  private async sendAdminSMSNotification(admin: any, data: AppointmentNotificationData) {
    const formatShortDate = (dateStr: string) => {
      const date = new Date(dateStr + 'T00:00:00');
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const formatTime = (time: string) => {
      const [hours, minutes] = time.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 || 12;
      return `${displayHour}:${minutes}${ampm}`;
    };

    const message = `New appt: ${data.customer.name} on ${formatShortDate(data.appointment.scheduled_date)} at ${formatTime(data.appointment.scheduled_time)} - ${data.device?.brand || ''} ${data.device?.model_name || 'Device'} #${data.appointment.appointment_number}`;

    return this.smsService.sendSMS({
      to: admin.phone,
      body: message
    });
  }

  /**
   * Send appointment reminder (usually day before)
   */
  async sendAppointmentReminder(appointmentId: string) {
    // Fetch appointment details
    const { data: appointment } = await this.supabase
      .from('appointments')
      .select(`
        *,
        customers!inner(*),
        devices(*)
      `)
      .eq('id', appointmentId)
      .single();

    if (!appointment) {
      throw new Error('Appointment not found');
    }

    const formatTime = (time: string) => {
      const [hours, minutes] = time.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 || 12;
      return `${displayHour}:${minutes} ${ampm}`;
    };

    // Send SMS reminder
    if (appointment.customers.phone) {
      const smsTemplate = processSMSTemplate('appointment_reminder', {
        customerName: appointment.customers.name,
        appointmentTime: formatTime(appointment.scheduled_time),
        deviceBrand: appointment.devices?.brand || 'your',
        deviceModel: appointment.devices?.model_name || 'device',
        businessName: 'Phone Guys',
        businessPhone: process.env.BUSINESS_PHONE || '(844) 511-0454'
      });

      await this.smsService.sendSMS({
        to: appointment.customers.phone,
        body: smsTemplate.message
      });
    }

    return true;
  }
}

// Export singleton instance
let instance: AppointmentNotificationService;

export function getAppointmentNotificationService(): AppointmentNotificationService {
  if (!instance) {
    instance = new AppointmentNotificationService();
  }
  return instance;
}