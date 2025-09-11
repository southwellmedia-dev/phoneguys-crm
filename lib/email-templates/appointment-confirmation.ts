import { baseEmailTemplate, EmailTemplateData } from './base-template';

export interface AppointmentConfirmationData {
  customerName: string;
  appointmentNumber: string;
  appointmentDate: string;
  appointmentTime: string;
  deviceBrand?: string;
  deviceModel?: string;
  issues: string[];
  estimatedCost?: number;
  notes?: string;
  confirmationUrl?: string;
}

export function appointmentConfirmationTemplate(data: AppointmentConfirmationData): {
  subject: string;
  html: string;
  text: string;
} {
  const {
    customerName,
    appointmentNumber,
    appointmentDate,
    appointmentTime,
    deviceBrand,
    deviceModel,
    issues,
    estimatedCost,
    notes,
    confirmationUrl
  } = data;

  const deviceInfo = deviceBrand && deviceModel ? `${deviceBrand} ${deviceModel}` : 'Your device';

  const content = `
    <h2 style="margin: 0 0 20px 0; color: #333333; font-size: 24px; font-weight: 600;">
      Appointment Confirmed!
    </h2>
    
    <p style="margin: 0 0 20px 0; color: #666666; font-size: 16px; line-height: 24px;">
      Dear ${customerName},
    </p>
    
    <p style="margin: 0 0 20px 0; color: #666666; font-size: 16px; line-height: 24px;">
      Thank you for scheduling an appointment with The Phone Guys. Your appointment has been confirmed.
    </p>
    
    <!-- Appointment Details Box -->
    <div style="background-color: #f8f9fa; border-left: 4px solid #0094CA; padding: 20px; margin: 30px 0; border-radius: 4px;">
      <h3 style="margin: 0 0 15px 0; color: #333333; font-size: 18px;">
        Appointment Details
      </h3>
      
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #666666; font-size: 14px; width: 140px;">
            <strong>Confirmation #:</strong>
          </td>
          <td style="padding: 8px 0; color: #333333; font-size: 14px;">
            ${appointmentNumber}
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #666666; font-size: 14px;">
            <strong>Date:</strong>
          </td>
          <td style="padding: 8px 0; color: #333333; font-size: 14px;">
            ${appointmentDate}
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #666666; font-size: 14px;">
            <strong>Time:</strong>
          </td>
          <td style="padding: 8px 0; color: #333333; font-size: 14px;">
            ${appointmentTime}
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #666666; font-size: 14px;">
            <strong>Device:</strong>
          </td>
          <td style="padding: 8px 0; color: #333333; font-size: 14px;">
            ${deviceInfo}
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #666666; font-size: 14px; vertical-align: top;">
            <strong>Services Needed:</strong>
          </td>
          <td style="padding: 8px 0; color: #333333; font-size: 14px;">
            ${issues.map(issue => `• ${issue}`).join('<br>')}
          </td>
        </tr>
        ${estimatedCost ? `
        <tr>
          <td style="padding: 8px 0; color: #666666; font-size: 14px;">
            <strong>Estimated Cost:</strong>
          </td>
          <td style="padding: 8px 0; color: #333333; font-size: 14px;">
            $${estimatedCost.toFixed(2)}
          </td>
        </tr>
        ` : ''}
        ${notes ? `
        <tr>
          <td style="padding: 8px 0; color: #666666; font-size: 14px; vertical-align: top;">
            <strong>Notes:</strong>
          </td>
          <td style="padding: 8px 0; color: #333333; font-size: 14px;">
            ${notes}
          </td>
        </tr>
        ` : ''}
      </table>
    </div>
    
    <h3 style="margin: 30px 0 15px 0; color: #333333; font-size: 18px;">
      What to Bring
    </h3>
    <ul style="margin: 0 0 20px 0; padding-left: 20px; color: #666666; font-size: 14px; line-height: 22px;">
      <li>Your device (${deviceInfo})</li>
      <li>Any accessories (case, charger, etc.)</li>
      <li>Device passcode (if applicable)</li>
      <li>This confirmation email or confirmation number</li>
    </ul>
    
    <h3 style="margin: 30px 0 15px 0; color: #333333; font-size: 18px;">
      Need to Reschedule?
    </h3>
    <p style="margin: 0 0 20px 0; color: #666666; font-size: 14px; line-height: 22px;">
      If you need to reschedule or cancel your appointment, please call us at <strong>(555) 123-4567</strong> as soon as possible.
    </p>
    
    <div style="background-color: #fff3cd; border: 1px solid #ffc107; border-radius: 4px; padding: 15px; margin: 30px 0;">
      <p style="margin: 0; color: #856404; font-size: 14px;">
        <strong>Important:</strong> We will call you within 24 hours to confirm your appointment and provide any additional details.
      </p>
    </div>
  `;

  const templateData: EmailTemplateData = {
    title: 'Appointment Confirmation',
    preheader: `Your appointment on ${appointmentDate} at ${appointmentTime} has been confirmed`,
    content,
    ctaButton: confirmationUrl ? {
      text: 'View Appointment Details',
      url: confirmationUrl
    } : undefined,
    footer: 'Thank you for choosing The Phone Guys for your device repair needs!'
  };

  const html = baseEmailTemplate(templateData);
  
  const text = `
Appointment Confirmation

Dear ${customerName},

Thank you for scheduling an appointment with The Phone Guys. Your appointment has been confirmed.

APPOINTMENT DETAILS
-------------------
Confirmation #: ${appointmentNumber}
Date: ${appointmentDate}
Time: ${appointmentTime}
Device: ${deviceInfo}
Services Needed:
${issues.map(issue => `  • ${issue}`).join('\n')}
${estimatedCost ? `Estimated Cost: $${estimatedCost.toFixed(2)}` : ''}
${notes ? `Notes: ${notes}` : ''}

WHAT TO BRING
-------------
• Your device (${deviceInfo})
• Any accessories (case, charger, etc.)
• Device passcode (if applicable)
• This confirmation email or confirmation number

NEED TO RESCHEDULE?
------------------
If you need to reschedule or cancel your appointment, please call us at (555) 123-4567 as soon as possible.

IMPORTANT: We will call you within 24 hours to confirm your appointment and provide any additional details.

Thank you for choosing The Phone Guys for your device repair needs!

The Phone Guys
123 Main Street, Your City, State 12345
Phone: (555) 123-4567 | Email: support@phoneguys.com
  `.trim();

  return {
    subject: `Appointment Confirmed - ${appointmentDate} at ${appointmentTime} | The Phone Guys`,
    html,
    text
  };
}