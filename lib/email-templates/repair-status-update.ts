import { baseEmailTemplate, EmailTemplateData } from './base-template';

export interface RepairStatusUpdateData {
  customerName: string;
  ticketNumber: string;
  deviceBrand: string;
  deviceModel: string;
  previousStatus: string;
  newStatus: string;
  statusMessage?: string;
  technician?: string;
  estimatedCompletion?: string;
  actualCost?: number;
  notes?: string;
  trackingUrl?: string;
}

export function repairStatusUpdateTemplate(data: RepairStatusUpdateData): {
  subject: string;
  html: string;
  text: string;
} {
  const {
    customerName,
    ticketNumber,
    deviceBrand,
    deviceModel,
    previousStatus,
    newStatus,
    statusMessage,
    technician,
    estimatedCompletion,
    actualCost,
    notes,
    trackingUrl
  } = data;

  // Status colors and icons
  const statusConfig: Record<string, { color: string; icon: string; message: string }> = {
    new: { 
      color: '#6c757d', 
      icon: '📝', 
      message: 'Your repair request has been received and is awaiting processing.' 
    },
    in_progress: { 
      color: '#0094CA', 
      icon: '🔧', 
      message: 'Our technicians have started working on your device.' 
    },
    on_hold: { 
      color: '#ffc107', 
      icon: '⏸️', 
      message: 'Your repair has been placed on hold. We will contact you shortly.' 
    },
    completed: { 
      color: '#28a745', 
      icon: '✅', 
      message: 'Great news! Your device repair has been completed and is ready for pickup.' 
    },
    cancelled: { 
      color: '#dc3545', 
      icon: '❌', 
      message: 'Your repair request has been cancelled.' 
    }
  };

  const config = statusConfig[newStatus.toLowerCase().replace(' ', '_')] || statusConfig.new;
  const displayStatus = newStatus.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');

  const content = `
    <h2 style="margin: 0 0 20px 0; color: #333333; font-size: 24px; font-weight: 600;">
      Repair Status Update
    </h2>
    
    <p style="margin: 0 0 20px 0; color: #666666; font-size: 16px; line-height: 24px;">
      Dear ${customerName},
    </p>
    
    <p style="margin: 0 0 20px 0; color: #666666; font-size: 16px; line-height: 24px;">
      We have an update on your ${deviceBrand} ${deviceModel} repair.
    </p>
    
    <!-- Status Update Box -->
    <div style="background-color: #f8f9fa; border-left: 4px solid ${config.color}; padding: 20px; margin: 30px 0; border-radius: 4px;">
      <div style="display: flex; align-items: center; margin-bottom: 15px;">
        <span style="font-size: 24px; margin-right: 10px;">${config.icon}</span>
        <h3 style="margin: 0; color: ${config.color}; font-size: 20px; font-weight: 600;">
          Status: ${displayStatus}
        </h3>
      </div>
      
      <p style="margin: 0 0 15px 0; color: #666666; font-size: 14px; line-height: 22px;">
        ${statusMessage || config.message}
      </p>
      
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
            ${deviceBrand} ${deviceModel}
          </td>
        </tr>
        ${technician ? `
        <tr>
          <td style="padding: 8px 0; color: #666666; font-size: 14px;">
            <strong>Technician:</strong>
          </td>
          <td style="padding: 8px 0; color: #333333; font-size: 14px;">
            ${technician}
          </td>
        </tr>
        ` : ''}
        ${estimatedCompletion ? `
        <tr>
          <td style="padding: 8px 0; color: #666666; font-size: 14px;">
            <strong>Est. Completion:</strong>
          </td>
          <td style="padding: 8px 0; color: #333333; font-size: 14px;">
            ${estimatedCompletion}
          </td>
        </tr>
        ` : ''}
        ${actualCost ? `
        <tr>
          <td style="padding: 8px 0; color: #666666; font-size: 14px;">
            <strong>Repair Cost:</strong>
          </td>
          <td style="padding: 8px 0; color: #333333; font-size: 14px; font-weight: 600;">
            $${actualCost.toFixed(2)}
          </td>
        </tr>
        ` : ''}
      </table>
    </div>
    
    ${notes ? `
    <div style="background-color: #e7f5ff; border: 1px solid #0094CA; border-radius: 4px; padding: 15px; margin: 30px 0;">
      <p style="margin: 0 0 5px 0; color: #0094CA; font-size: 14px; font-weight: 600;">
        Technician Notes:
      </p>
      <p style="margin: 0; color: #333333; font-size: 14px; line-height: 22px;">
        ${notes}
      </p>
    </div>
    ` : ''}
    
    ${newStatus === 'completed' ? `
    <div style="background-color: #d4edda; border: 1px solid #28a745; border-radius: 4px; padding: 20px; margin: 30px 0; text-align: center;">
      <h3 style="margin: 0 0 10px 0; color: #155724; font-size: 18px;">
        🎉 Your Device is Ready!
      </h3>
      <p style="margin: 0 0 15px 0; color: #155724; font-size: 14px;">
        Please bring your ticket number or this email when collecting your device.
      </p>
      <p style="margin: 0; color: #155724; font-size: 14px;">
        <strong>Pickup Hours:</strong> Monday-Friday 9AM-6PM, Saturday 10AM-4PM
      </p>
    </div>
    ` : ''}
    
    ${newStatus === 'on_hold' ? `
    <div style="background-color: #fff3cd; border: 1px solid #ffc107; border-radius: 4px; padding: 15px; margin: 30px 0;">
      <p style="margin: 0; color: #856404; font-size: 14px;">
        <strong>Action Required:</strong> We may need additional information or approval from you. 
        Please contact us at your earliest convenience at (555) 123-4567.
      </p>
    </div>
    ` : ''}
    
    <p style="margin: 30px 0 20px 0; color: #666666; font-size: 14px; line-height: 22px;">
      If you have any questions about your repair, please don't hesitate to contact us.
    </p>
  `;

  const templateData: EmailTemplateData = {
    title: 'Repair Status Update',
    preheader: `Your ${deviceBrand} ${deviceModel} repair status: ${displayStatus}`,
    content,
    ctaButton: trackingUrl ? {
      text: 'Track Your Repair',
      url: trackingUrl
    } : undefined,
    footer: 'Thank you for choosing The Phone Guys!'
  };

  const html = baseEmailTemplate(templateData);
  
  const text = `
Repair Status Update

Dear ${customerName},

We have an update on your ${deviceBrand} ${deviceModel} repair.

STATUS: ${displayStatus}
${statusMessage || config.message}

REPAIR DETAILS
--------------
Ticket Number: ${ticketNumber}
Device: ${deviceBrand} ${deviceModel}
${technician ? `Technician: ${technician}` : ''}
${estimatedCompletion ? `Estimated Completion: ${estimatedCompletion}` : ''}
${actualCost ? `Repair Cost: $${actualCost.toFixed(2)}` : ''}

${notes ? `TECHNICIAN NOTES\n----------------\n${notes}\n` : ''}

${newStatus === 'completed' ? `
YOUR DEVICE IS READY!
--------------------
Please bring your ticket number or this email when collecting your device.
Pickup Hours: Monday-Friday 9AM-6PM, Saturday 10AM-4PM
` : ''}

${newStatus === 'on_hold' ? `
ACTION REQUIRED
--------------
We may need additional information or approval from you.
Please contact us at your earliest convenience at (555) 123-4567.
` : ''}

If you have any questions about your repair, please don't hesitate to contact us.

Thank you for choosing The Phone Guys!

The Phone Guys
123 Main Street, Your City, State 12345
Phone: (555) 123-4567 | Email: support@phoneguys.com
  `.trim();

  return {
    subject: `Repair Status Update: ${displayStatus} - Ticket #${ticketNumber} | The Phone Guys`,
    html,
    text
  };
}