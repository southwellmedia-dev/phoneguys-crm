import { appointmentConfirmationTemplate } from '@/lib/email-templates/appointment-confirmation';
import { repairStatusUpdateTemplate } from '@/lib/email-templates/repair-status-update';
import { baseEmailTemplate } from '@/lib/email-templates/base-template';

export type EmailTemplateType = 
  | 'appointment-confirmation'
  | 'appointment-reminder'
  | 'appointment-cancellation'
  | 'repair-status-update'
  | 'repair-completed'
  | 'repair-invoice'
  | 'password-reset'
  | 'user-invitation'
  | 'welcome'
  | 'test';

export interface EmailTemplateData {
  [key: string]: any;
}

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

/**
 * Email Template Engine
 * Manages and renders email templates with dynamic data
 */
export class EmailTemplateEngine {
  private static instance: EmailTemplateEngine;
  private templates: Map<EmailTemplateType, (data: any) => EmailTemplate> = new Map();

  private constructor() {
    this.registerDefaultTemplates();
  }

  static getInstance(): EmailTemplateEngine {
    if (!EmailTemplateEngine.instance) {
      EmailTemplateEngine.instance = new EmailTemplateEngine();
    }
    return EmailTemplateEngine.instance;
  }

  /**
   * Register default email templates
   */
  private registerDefaultTemplates(): void {
    // Appointment templates
    this.registerTemplate('appointment-confirmation', appointmentConfirmationTemplate);
    this.registerTemplate('appointment-reminder', this.appointmentReminderTemplate);
    this.registerTemplate('appointment-cancellation', this.appointmentCancellationTemplate);

    // Repair templates
    this.registerTemplate('repair-status-update', repairStatusUpdateTemplate);
    this.registerTemplate('repair-completed', this.repairCompletedTemplate);
    this.registerTemplate('repair-invoice', this.repairInvoiceTemplate);

    // Auth templates
    this.registerTemplate('password-reset', this.passwordResetTemplate);
    this.registerTemplate('user-invitation', this.userInvitationTemplate);
    this.registerTemplate('welcome', this.welcomeTemplate);

    // Test template
    this.registerTemplate('test', this.testEmailTemplate);
  }

  /**
   * Register a custom template
   */
  registerTemplate(type: EmailTemplateType, renderer: (data: any) => EmailTemplate): void {
    this.templates.set(type, renderer);
  }

  /**
   * Render a template with data
   */
  render(type: EmailTemplateType, data: EmailTemplateData): EmailTemplate {
    const renderer = this.templates.get(type);
    if (!renderer) {
      throw new Error(`Template type "${type}" not found`);
    }

    try {
      return renderer(data);
    } catch (error) {
      console.error(`Failed to render template "${type}":`, error);
      throw new Error(`Failed to render email template: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check if a template exists
   */
  hasTemplate(type: EmailTemplateType): boolean {
    return this.templates.has(type);
  }

  /**
   * Get all available template types
   */
  getAvailableTemplates(): EmailTemplateType[] {
    return Array.from(this.templates.keys());
  }

  // Template implementations

  private appointmentReminderTemplate(data: any): EmailTemplate {
    const content = `
      <h2 style="margin: 0 0 20px 0; color: #333333; font-size: 24px; font-weight: 600;">
        Appointment Reminder
      </h2>
      
      <p style="margin: 0 0 20px 0; color: #666666; font-size: 16px; line-height: 24px;">
        Dear ${data.customerName},
      </p>
      
      <p style="margin: 0 0 20px 0; color: #666666; font-size: 16px; line-height: 24px;">
        This is a reminder about your upcoming appointment with The Phone Guys.
      </p>
      
      <div style="background-color: #f8f9fa; border-left: 4px solid #0094CA; padding: 20px; margin: 30px 0; border-radius: 4px;">
        <h3 style="margin: 0 0 15px 0; color: #333333; font-size: 18px;">
          Appointment Details
        </h3>
        
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #666666; font-size: 14px; width: 140px;">
              <strong>Date:</strong>
            </td>
            <td style="padding: 8px 0; color: #333333; font-size: 14px;">
              ${data.appointmentDate}
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666666; font-size: 14px;">
              <strong>Time:</strong>
            </td>
            <td style="padding: 8px 0; color: #333333; font-size: 14px;">
              ${data.appointmentTime}
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666666; font-size: 14px;">
              <strong>Location:</strong>
            </td>
            <td style="padding: 8px 0; color: #333333; font-size: 14px;">
              123 Main Street, Your City, State 12345
            </td>
          </tr>
        </table>
      </div>
      
      <p style="margin: 0 0 20px 0; color: #666666; font-size: 14px; line-height: 22px;">
        If you need to reschedule or cancel, please call us at <strong>(555) 123-4567</strong>.
      </p>
    `;

    const html = baseEmailTemplate({
      title: 'Appointment Reminder',
      preheader: `Reminder: Your appointment is on ${data.appointmentDate} at ${data.appointmentTime}`,
      content,
      footer: 'We look forward to seeing you!'
    });

    return {
      subject: `Reminder: Appointment Tomorrow at ${data.appointmentTime} | The Phone Guys`,
      html,
      text: `Appointment Reminder\n\nDear ${data.customerName},\n\nThis is a reminder about your appointment tomorrow at ${data.appointmentTime}.\n\nLocation: 123 Main Street, Your City, State 12345\n\nIf you need to reschedule, please call (555) 123-4567.\n\nWe look forward to seeing you!`
    };
  }

  private appointmentCancellationTemplate(data: any): EmailTemplate {
    const content = `
      <h2 style="margin: 0 0 20px 0; color: #333333; font-size: 24px; font-weight: 600;">
        Appointment Cancelled
      </h2>
      
      <p style="margin: 0 0 20px 0; color: #666666; font-size: 16px; line-height: 24px;">
        Dear ${data.customerName},
      </p>
      
      <p style="margin: 0 0 20px 0; color: #666666; font-size: 16px; line-height: 24px;">
        Your appointment scheduled for ${data.appointmentDate} at ${data.appointmentTime} has been cancelled.
      </p>
      
      ${data.reason ? `
      <div style="background-color: #fff3cd; border: 1px solid #ffc107; border-radius: 4px; padding: 15px; margin: 30px 0;">
        <p style="margin: 0; color: #856404; font-size: 14px;">
          <strong>Cancellation Reason:</strong> ${data.reason}
        </p>
      </div>
      ` : ''}
      
      <p style="margin: 0 0 20px 0; color: #666666; font-size: 14px; line-height: 22px;">
        To schedule a new appointment, please call us at <strong>(555) 123-4567</strong> or visit our website.
      </p>
    `;

    const html = baseEmailTemplate({
      title: 'Appointment Cancelled',
      preheader: `Your appointment on ${data.appointmentDate} has been cancelled`,
      content,
      footer: 'We apologize for any inconvenience.'
    });

    return {
      subject: `Appointment Cancelled - ${data.appointmentDate} | The Phone Guys`,
      html,
      text: `Appointment Cancelled\n\nDear ${data.customerName},\n\nYour appointment scheduled for ${data.appointmentDate} at ${data.appointmentTime} has been cancelled.\n\n${data.reason ? `Reason: ${data.reason}\n\n` : ''}To schedule a new appointment, please call (555) 123-4567.\n\nWe apologize for any inconvenience.`
    };
  }

  private repairCompletedTemplate(data: any): EmailTemplate {
    const content = `
      <h2 style="margin: 0 0 20px 0; color: #333333; font-size: 24px; font-weight: 600;">
        Your Device is Ready! 🎉
      </h2>
      
      <p style="margin: 0 0 20px 0; color: #666666; font-size: 16px; line-height: 24px;">
        Dear ${data.customerName},
      </p>
      
      <p style="margin: 0 0 20px 0; color: #666666; font-size: 16px; line-height: 24px;">
        Great news! Your ${data.deviceBrand} ${data.deviceModel} repair has been completed and is ready for pickup.
      </p>
      
      <div style="background-color: #d4edda; border-left: 4px solid #28a745; padding: 20px; margin: 30px 0; border-radius: 4px;">
        <h3 style="margin: 0 0 15px 0; color: #155724; font-size: 18px;">
          Repair Summary
        </h3>
        
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #155724; font-size: 14px; width: 140px;">
              <strong>Ticket #:</strong>
            </td>
            <td style="padding: 8px 0; color: #155724; font-size: 14px;">
              ${data.ticketNumber}
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #155724; font-size: 14px;">
              <strong>Services:</strong>
            </td>
            <td style="padding: 8px 0; color: #155724; font-size: 14px;">
              ${data.services?.join(', ') || 'Repair services'}
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #155724; font-size: 14px;">
              <strong>Total Cost:</strong>
            </td>
            <td style="padding: 8px 0; color: #155724; font-size: 18px; font-weight: bold;">
              $${data.totalCost?.toFixed(2) || '0.00'}
            </td>
          </tr>
        </table>
      </div>
      
      <h3 style="margin: 30px 0 15px 0; color: #333333; font-size: 18px;">
        Pickup Information
      </h3>
      <ul style="margin: 0 0 20px 0; padding-left: 20px; color: #666666; font-size: 14px; line-height: 22px;">
        <li>Location: 123 Main Street, Your City, State 12345</li>
        <li>Hours: Monday-Friday 9AM-6PM, Saturday 10AM-4PM</li>
        <li>Please bring: Ticket number or this email</li>
        <li>Payment: Cash, Credit Card, or Debit Card accepted</li>
      </ul>
    `;

    const html = baseEmailTemplate({
      title: 'Your Device is Ready!',
      preheader: `Your ${data.deviceBrand} ${data.deviceModel} repair is complete`,
      content,
      ctaButton: {
        text: 'Get Directions',
        url: 'https://maps.google.com/?q=123+Main+Street+Your+City+State+12345'
      },
      footer: 'Thank you for choosing The Phone Guys!'
    });

    return {
      subject: `Your Device is Ready for Pickup! - Ticket #${data.ticketNumber} | The Phone Guys`,
      html,
      text: `Your Device is Ready!\n\nDear ${data.customerName},\n\nGreat news! Your ${data.deviceBrand} ${data.deviceModel} repair has been completed.\n\nTicket #: ${data.ticketNumber}\nTotal Cost: $${data.totalCost?.toFixed(2) || '0.00'}\n\nPickup Location: 123 Main Street, Your City, State 12345\nHours: Mon-Fri 9AM-6PM, Sat 10AM-4PM\n\nPlease bring your ticket number or this email.\n\nThank you for choosing The Phone Guys!`
    };
  }

  private repairInvoiceTemplate(data: any): EmailTemplate {
    const itemsHtml = data.items?.map((item: any) => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e0e0e0; font-size: 14px;">
          ${item.description}
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e0e0e0; font-size: 14px; text-align: center;">
          ${item.quantity}
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e0e0e0; font-size: 14px; text-align: right;">
          $${item.unitPrice.toFixed(2)}
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e0e0e0; font-size: 14px; text-align: right;">
          $${item.total.toFixed(2)}
        </td>
      </tr>
    `).join('') || '';

    const content = `
      <h2 style="margin: 0 0 20px 0; color: #333333; font-size: 24px; font-weight: 600;">
        Invoice
      </h2>
      
      <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
        <div>
          <p style="margin: 0 0 5px 0; color: #666666; font-size: 14px;">
            <strong>Invoice #:</strong> ${data.invoiceNumber}
          </p>
          <p style="margin: 0 0 5px 0; color: #666666; font-size: 14px;">
            <strong>Date:</strong> ${data.invoiceDate}
          </p>
          <p style="margin: 0; color: #666666; font-size: 14px;">
            <strong>Ticket #:</strong> ${data.ticketNumber}
          </p>
        </div>
      </div>
      
      <div style="background-color: #f8f9fa; padding: 15px; margin-bottom: 30px; border-radius: 4px;">
        <p style="margin: 0 0 5px 0; color: #333333; font-size: 14px;">
          <strong>Bill To:</strong>
        </p>
        <p style="margin: 0; color: #666666; font-size: 14px;">
          ${data.customerName}<br>
          ${data.customerEmail}<br>
          ${data.customerPhone}
        </p>
      </div>
      
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
        <thead>
          <tr style="background-color: #0094CA; color: white;">
            <th style="padding: 12px; text-align: left; font-size: 14px;">Description</th>
            <th style="padding: 12px; text-align: center; font-size: 14px;">Qty</th>
            <th style="padding: 12px; text-align: right; font-size: 14px;">Unit Price</th>
            <th style="padding: 12px; text-align: right; font-size: 14px;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="3" style="padding: 12px; text-align: right; font-size: 14px;">
              <strong>Subtotal:</strong>
            </td>
            <td style="padding: 12px; text-align: right; font-size: 14px;">
              $${data.subtotal?.toFixed(2) || '0.00'}
            </td>
          </tr>
          ${data.tax ? `
          <tr>
            <td colspan="3" style="padding: 12px; text-align: right; font-size: 14px;">
              <strong>Tax:</strong>
            </td>
            <td style="padding: 12px; text-align: right; font-size: 14px;">
              $${data.tax.toFixed(2)}
            </td>
          </tr>
          ` : ''}
          <tr style="background-color: #f8f9fa;">
            <td colspan="3" style="padding: 12px; text-align: right; font-size: 16px;">
              <strong>Total:</strong>
            </td>
            <td style="padding: 12px; text-align: right; font-size: 16px; color: #0094CA;">
              <strong>$${data.total?.toFixed(2) || '0.00'}</strong>
            </td>
          </tr>
        </tfoot>
      </table>
    `;

    const html = baseEmailTemplate({
      title: 'Invoice',
      preheader: `Invoice #${data.invoiceNumber} - $${data.total?.toFixed(2) || '0.00'}`,
      content,
      footer: 'Thank you for your business!'
    });

    return {
      subject: `Invoice #${data.invoiceNumber} - The Phone Guys`,
      html,
      text: `Invoice\n\nInvoice #: ${data.invoiceNumber}\nDate: ${data.invoiceDate}\n\nBill To:\n${data.customerName}\n${data.customerEmail}\n${data.customerPhone}\n\nTotal: $${data.total?.toFixed(2) || '0.00'}\n\nThank you for your business!`
    };
  }

  private passwordResetTemplate(data: any): EmailTemplate {
    const content = `
      <h2 style="margin: 0 0 20px 0; color: #333333; font-size: 24px; font-weight: 600;">
        Reset Your Password
      </h2>
      
      <p style="margin: 0 0 20px 0; color: #666666; font-size: 16px; line-height: 24px;">
        Hi ${data.userName || 'there'},
      </p>
      
      <p style="margin: 0 0 20px 0; color: #666666; font-size: 16px; line-height: 24px;">
        We received a request to reset your password for The Phone Guys CRM. Click the button below to create a new password:
      </p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${data.resetUrl}" style="display: inline-block; padding: 12px 30px; background-color: #0094CA; color: white; text-decoration: none; border-radius: 4px; font-size: 16px; font-weight: 600;">
          Reset Password
        </a>
      </div>
      
      <p style="margin: 0 0 20px 0; color: #666666; font-size: 14px; line-height: 22px;">
        Or copy and paste this link into your browser:<br>
        <span style="color: #0094CA; word-break: break-all;">${data.resetUrl}</span>
      </p>
      
      <div style="background-color: #fff3cd; border: 1px solid #ffc107; border-radius: 4px; padding: 15px; margin: 30px 0;">
        <p style="margin: 0; color: #856404; font-size: 14px;">
          <strong>Note:</strong> This password reset link will expire in 1 hour. If you didn't request this, you can safely ignore this email.
        </p>
      </div>
    `;

    const html = baseEmailTemplate({
      title: 'Reset Your Password',
      preheader: 'Reset your password for The Phone Guys CRM',
      content,
      footer: 'For security, this link expires in 1 hour.'
    });

    return {
      subject: 'Reset Your Password - The Phone Guys CRM',
      html,
      text: `Reset Your Password\n\nHi ${data.userName || 'there'},\n\nWe received a request to reset your password. Visit this link to create a new password:\n\n${data.resetUrl}\n\nThis link will expire in 1 hour.\n\nIf you didn't request this, you can safely ignore this email.`
    };
  }

  private userInvitationTemplate(data: any): EmailTemplate {
    const content = `
      <h2 style="margin: 0 0 20px 0; color: #333333; font-size: 24px; font-weight: 600;">
        You're Invited to Join The Phone Guys CRM
      </h2>
      
      <p style="margin: 0 0 20px 0; color: #666666; font-size: 16px; line-height: 24px;">
        Hi ${data.inviteeName || 'there'},
      </p>
      
      <p style="margin: 0 0 20px 0; color: #666666; font-size: 16px; line-height: 24px;">
        ${data.inviterName} has invited you to join The Phone Guys CRM as a ${data.role || 'team member'}.
      </p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${data.inviteUrl}" style="display: inline-block; padding: 12px 30px; background-color: #0094CA; color: white; text-decoration: none; border-radius: 4px; font-size: 16px; font-weight: 600;">
          Accept Invitation
        </a>
      </div>
      
      <p style="margin: 0 0 20px 0; color: #666666; font-size: 14px; line-height: 22px;">
        Or copy and paste this link into your browser:<br>
        <span style="color: #0094CA; word-break: break-all;">${data.inviteUrl}</span>
      </p>
      
      ${data.message ? `
      <div style="background-color: #f8f9fa; border-left: 4px solid #0094CA; padding: 20px; margin: 30px 0; border-radius: 4px;">
        <p style="margin: 0 0 5px 0; color: #333333; font-size: 14px;">
          <strong>Message from ${data.inviterName}:</strong>
        </p>
        <p style="margin: 0; color: #666666; font-size: 14px; line-height: 22px;">
          ${data.message}
        </p>
      </div>
      ` : ''}
    `;

    const html = baseEmailTemplate({
      title: 'Invitation to Join',
      preheader: `${data.inviterName} invited you to join The Phone Guys CRM`,
      content,
      footer: 'This invitation expires in 7 days.'
    });

    return {
      subject: `${data.inviterName} invited you to The Phone Guys CRM`,
      html,
      text: `You're Invited!\n\nHi ${data.inviteeName || 'there'},\n\n${data.inviterName} has invited you to join The Phone Guys CRM as a ${data.role || 'team member'}.\n\nAccept invitation: ${data.inviteUrl}\n\n${data.message ? `Message: ${data.message}\n\n` : ''}This invitation expires in 7 days.`
    };
  }

  private welcomeTemplate(data: any): EmailTemplate {
    const content = `
      <h2 style="margin: 0 0 20px 0; color: #333333; font-size: 24px; font-weight: 600;">
        Welcome to The Phone Guys! 👋
      </h2>
      
      <p style="margin: 0 0 20px 0; color: #666666; font-size: 16px; line-height: 24px;">
        Hi ${data.userName},
      </p>
      
      <p style="margin: 0 0 20px 0; color: #666666; font-size: 16px; line-height: 24px;">
        Welcome to The Phone Guys CRM! Your account has been successfully created.
      </p>
      
      <div style="background-color: #f8f9fa; border-left: 4px solid #0094CA; padding: 20px; margin: 30px 0; border-radius: 4px;">
        <h3 style="margin: 0 0 15px 0; color: #333333; font-size: 18px;">
          Your Account Details
        </h3>
        
        <p style="margin: 0 0 10px 0; color: #666666; font-size: 14px;">
          <strong>Email:</strong> ${data.userEmail}<br>
          <strong>Role:</strong> ${data.role || 'User'}
        </p>
      </div>
      
      <h3 style="margin: 30px 0 15px 0; color: #333333; font-size: 18px;">
        Getting Started
      </h3>
      <ol style="margin: 0 0 20px 0; padding-left: 20px; color: #666666; font-size: 14px; line-height: 22px;">
        <li>Log in to your account at <a href="${data.loginUrl}" style="color: #0094CA;">The Phone Guys CRM</a></li>
        <li>Complete your profile information</li>
        <li>Explore the dashboard and features</li>
        <li>Contact support if you need any help</li>
      </ol>
    `;

    const html = baseEmailTemplate({
      title: 'Welcome!',
      preheader: 'Welcome to The Phone Guys CRM',
      content,
      ctaButton: {
        text: 'Log In Now',
        url: data.loginUrl || 'https://phoneguys.com/login'
      },
      footer: 'We\'re excited to have you on board!'
    });

    return {
      subject: 'Welcome to The Phone Guys CRM!',
      html,
      text: `Welcome to The Phone Guys!\n\nHi ${data.userName},\n\nYour account has been successfully created.\n\nEmail: ${data.userEmail}\nRole: ${data.role || 'User'}\n\nLog in at: ${data.loginUrl || 'https://phoneguys.com/login'}\n\nWe're excited to have you on board!`
    };
  }

  private testEmailTemplate(data: any): EmailTemplate {
    const content = `
      <h2 style="margin: 0 0 20px 0; color: #333333; font-size: 24px; font-weight: 600;">
        Test Email
      </h2>
      
      <p style="margin: 0 0 20px 0; color: #666666; font-size: 16px; line-height: 24px;">
        This is a test email from The Phone Guys CRM email system.
      </p>
      
      <div style="background-color: #d4edda; border-left: 4px solid #28a745; padding: 20px; margin: 30px 0; border-radius: 4px;">
        <p style="margin: 0; color: #155724; font-size: 14px;">
          <strong>Success!</strong> If you're seeing this, your email configuration is working correctly.
        </p>
      </div>
      
      <h3 style="margin: 30px 0 15px 0; color: #333333; font-size: 18px;">
        Configuration Details
      </h3>
      <ul style="margin: 0 0 20px 0; padding-left: 20px; color: #666666; font-size: 14px; line-height: 22px;">
        <li>Environment: ${data.environment || 'development'}</li>
        <li>Timestamp: ${data.timestamp || new Date().toISOString()}</li>
        <li>Recipient: ${data.recipientEmail}</li>
        ${data.additionalInfo ? `<li>Additional Info: ${data.additionalInfo}</li>` : ''}
      </ul>
    `;

    const html = baseEmailTemplate({
      title: 'Test Email',
      preheader: 'Testing email configuration',
      content,
      footer: 'This is a test email.'
    });

    return {
      subject: 'Test Email - The Phone Guys CRM',
      html,
      text: `Test Email\n\nThis is a test email from The Phone Guys CRM.\n\nIf you're seeing this, your email configuration is working correctly.\n\nEnvironment: ${data.environment || 'development'}\nTimestamp: ${data.timestamp || new Date().toISOString()}\nRecipient: ${data.recipientEmail}`
    };
  }
}

// Export singleton instance
export const emailTemplateEngine = EmailTemplateEngine.getInstance();