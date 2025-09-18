import { baseEmailTemplate, EmailTemplateData } from './base-template';

export interface TicketStatusUpdateData {
  customerName: string;
  ticketNumber: string;
  deviceBrand?: string;
  deviceModel?: string;
  status: 'in_progress' | 'completed' | 'on_hold' | 'cancelled';
  estimatedCost?: number;
  totalCost?: number;
  notes?: string;
  statusUrl?: string;
  completionNotes?: string;
  holdReason?: string;
  cancellationReason?: string;
}

export function ticketStatusUpdateTemplate(data: TicketStatusUpdateData): {
  subject: string;
  html: string;
  text: string;
} {
  const {
    customerName,
    ticketNumber,
    deviceBrand,
    deviceModel,
    status,
    estimatedCost,
    totalCost,
    notes,
    statusUrl,
    completionNotes,
    holdReason,
    cancellationReason
  } = data;

  const deviceInfo = deviceBrand && deviceModel ? `${deviceBrand} ${deviceModel}` : 'Your device';
  
  let statusMessage = '';
  let statusColor = '';
  let statusIcon = '';
  let statusTitle = '';
  let additionalContent = '';

  switch (status) {
    case 'in_progress':
      statusTitle = 'Your Repair is In Progress!';
      statusMessage = 'Great news! Our technician has started working on your device.';
      statusColor = '#0094CA';
      statusIcon = '🔧';
      additionalContent = `
        <h3 style="margin: 30px 0 15px 0; color: #333333; font-size: 18px;">
          What's Happening Now
        </h3>
        <ul style="margin: 0 0 20px 0; padding-left: 20px; color: #666666; font-size: 14px; line-height: 22px;">
          <li>Our technician is actively working on your ${deviceInfo}</li>
          <li>Diagnostics and repairs are being performed</li>
          <li>We'll notify you as soon as the repair is complete</li>
          <li>Track your repair progress anytime using the link below</li>
        </ul>
      `;
      break;

    case 'completed':
      statusTitle = 'Your Device is Ready for Pickup!';
      statusMessage = 'Your repair has been completed successfully. Your device is ready to be picked up.';
      statusColor = '#28a745';
      statusIcon = '✅';
      additionalContent = `
        <h3 style="margin: 30px 0 15px 0; color: #333333; font-size: 18px;">
          Pickup Information
        </h3>
        <div style="background-color: #d4edda; border-left: 4px solid #28a745; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 0 0 10px 0; color: #155724; font-size: 14px;">
            <strong>Device Ready:</strong> ${deviceInfo}<br>
            ${totalCost ? `<strong>Total Cost:</strong> $${totalCost.toFixed(2)}<br>` : ''}
            <strong>Ticket Number:</strong> ${ticketNumber}
          </p>
          ${completionNotes ? `
          <p style="margin: 10px 0 0 0; color: #155724; font-size: 14px;">
            <strong>Repair Notes:</strong> ${completionNotes}
          </p>
          ` : ''}
        </div>
        
        <h3 style="margin: 30px 0 15px 0; color: #333333; font-size: 18px;">
          Store Hours
        </h3>
        <ul style="margin: 0 0 20px 0; padding-left: 20px; color: #666666; font-size: 14px; line-height: 22px;">
          <li>Monday - Friday: 9:00 AM - 7:00 PM</li>
          <li>Saturday: 10:00 AM - 6:00 PM</li>
          <li>Sunday: 11:00 AM - 5:00 PM</li>
        </ul>
        
        <p style="margin: 20px 0; color: #666666; font-size: 14px;">
          Please bring your ticket number or this email when picking up your device.
        </p>
      `;
      break;

    case 'on_hold':
      statusTitle = 'Your Repair is On Hold';
      statusMessage = 'Your repair has been temporarily placed on hold.';
      statusColor = '#ffc107';
      statusIcon = '⏸️';
      additionalContent = `
        <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 0; color: #856404; font-size: 14px;">
            <strong>Reason:</strong> ${holdReason || 'We need to order parts or require additional information to proceed with your repair.'}
          </p>
        </div>
        
        <h3 style="margin: 30px 0 15px 0; color: #333333; font-size: 18px;">
          What Happens Next
        </h3>
        <ul style="margin: 0 0 20px 0; padding-left: 20px; color: #666666; font-size: 14px; line-height: 22px;">
          <li>We'll contact you with updates as soon as possible</li>
          <li>If parts are needed, we'll inform you about availability and timing</li>
          <li>You can contact us anytime for status updates</li>
        </ul>
      `;
      break;

    case 'cancelled':
      statusTitle = 'Repair Cancelled';
      statusMessage = 'Your repair request has been cancelled.';
      statusColor = '#dc3545';
      statusIcon = '❌';
      additionalContent = `
        <div style="background-color: #f8d7da; border-left: 4px solid #dc3545; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 0; color: #721c24; font-size: 14px;">
            ${cancellationReason ? `<strong>Reason:</strong> ${cancellationReason}` : 'Your repair has been cancelled as requested.'}
          </p>
        </div>
        
        <p style="margin: 20px 0; color: #666666; font-size: 14px;">
          If you have any questions or would like to reschedule, please contact us at <strong>(555) 123-4567</strong>.
        </p>
      `;
      break;
  }

  const content = `
    <h2 style="margin: 0 0 20px 0; color: #333333; font-size: 24px; font-weight: 600;">
      ${statusIcon} ${statusTitle}
    </h2>
    
    <p style="margin: 0 0 20px 0; color: #666666; font-size: 16px; line-height: 24px;">
      Dear ${customerName},
    </p>
    
    <p style="margin: 0 0 20px 0; color: #666666; font-size: 16px; line-height: 24px;">
      ${statusMessage}
    </p>
    
    <!-- Status Details Box -->
    <div style="background-color: #f8f9fa; border-left: 4px solid ${statusColor}; padding: 20px; margin: 30px 0; border-radius: 4px;">
      <h3 style="margin: 0 0 15px 0; color: #333333; font-size: 18px;">
        Repair Details
      </h3>
      
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #666666; font-size: 14px; width: 140px;">
            <strong>Ticket Number:</strong>
          </td>
          <td style="padding: 8px 0; color: #333333; font-size: 14px;">
            ${ticketNumber}
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
          <td style="padding: 8px 0; color: #666666; font-size: 14px;">
            <strong>Status:</strong>
          </td>
          <td style="padding: 8px 0; color: ${statusColor}; font-size: 14px; font-weight: 600;">
            ${status.replace(/_/g, ' ').toUpperCase()}
          </td>
        </tr>
        ${(estimatedCost || totalCost) ? `
        <tr>
          <td style="padding: 8px 0; color: #666666; font-size: 14px;">
            <strong>${status === 'completed' ? 'Total' : 'Estimated'} Cost:</strong>
          </td>
          <td style="padding: 8px 0; color: #333333; font-size: 14px;">
            $${(status === 'completed' && totalCost ? totalCost : estimatedCost)?.toFixed(2)}
          </td>
        </tr>
        ` : ''}
      </table>
    </div>
    
    ${additionalContent}
    
    <h3 style="margin: 30px 0 15px 0; color: #333333; font-size: 18px;">
      Contact Us
    </h3>
    <p style="margin: 0 0 20px 0; color: #666666; font-size: 14px; line-height: 22px;">
      If you have any questions about your repair, please don't hesitate to contact us at <strong>(555) 123-4567</strong> or reply to this email.
    </p>
  `;

  const templateData: EmailTemplateData = {
    title: `Repair ${status === 'in_progress' ? 'In Progress' : status === 'completed' ? 'Completed' : status === 'on_hold' ? 'On Hold' : 'Cancelled'}`,
    preheader: `Your repair ticket ${ticketNumber} is now ${status.replace(/_/g, ' ')}`,
    content,
    ctaButton: statusUrl ? {
      text: status === 'completed' ? 'View Final Invoice' : 'Track Your Repair',
      url: statusUrl
    } : undefined,
    footer: status === 'completed' 
      ? 'Thank you for choosing The Phone Guys for your device repair needs!'
      : 'We appreciate your patience while we work on your device.'
  };

  const html = baseEmailTemplate(templateData);
  
  const text = `
${statusTitle}

Dear ${customerName},

${statusMessage}

REPAIR DETAILS
--------------
Ticket Number: ${ticketNumber}
Device: ${deviceInfo}
Status: ${status.replace(/_/g, ' ').toUpperCase()}
${(estimatedCost || totalCost) ? `${status === 'completed' ? 'Total' : 'Estimated'} Cost: $${(status === 'completed' && totalCost ? totalCost : estimatedCost)?.toFixed(2)}` : ''}

${status === 'in_progress' ? `WHAT'S HAPPENING NOW
-------------------
• Our technician is actively working on your ${deviceInfo}
• Diagnostics and repairs are being performed
• We'll notify you as soon as the repair is complete
• Track your repair progress anytime at ${statusUrl || 'status.phoneguysrepair.com'}` : ''}

${status === 'completed' ? `PICKUP INFORMATION
-----------------
Your device is ready for pickup!
${totalCost ? `Total Cost: $${totalCost.toFixed(2)}` : ''}
${completionNotes ? `Repair Notes: ${completionNotes}` : ''}

STORE HOURS
-----------
Monday - Friday: 9:00 AM - 7:00 PM
Saturday: 10:00 AM - 6:00 PM
Sunday: 11:00 AM - 5:00 PM

Please bring your ticket number or this email when picking up your device.` : ''}

${status === 'on_hold' ? `REASON
------
${holdReason || 'We need to order parts or require additional information to proceed with your repair.'}

WHAT HAPPENS NEXT
----------------
• We'll contact you with updates as soon as possible
• If parts are needed, we'll inform you about availability and timing
• You can contact us anytime for status updates` : ''}

${status === 'cancelled' ? `${cancellationReason ? `Reason: ${cancellationReason}` : 'Your repair has been cancelled as requested.'}

If you have any questions or would like to reschedule, please contact us.` : ''}

CONTACT US
----------
Phone: (555) 123-4567
Email: support@phoneguys.com

${statusUrl ? `Track your repair: ${statusUrl}` : ''}

${status === 'completed' ? 'Thank you for choosing The Phone Guys!' : 'The Phone Guys Team'}
  `.trim();

  return {
    subject: status === 'completed' 
      ? `Your Device is Ready! - Ticket ${ticketNumber} | The Phone Guys`
      : status === 'in_progress'
      ? `Repair In Progress - Ticket ${ticketNumber} | The Phone Guys`
      : status === 'on_hold'
      ? `Repair On Hold - Ticket ${ticketNumber} | The Phone Guys`
      : `Repair Cancelled - Ticket ${ticketNumber} | The Phone Guys`,
    html,
    text
  };
}