/**
 * SMS Templates for Customer Notifications
 * 
 * Note: SMS messages should be concise and informative.
 * Standard SMS is 160 characters, but modern phones support up to 1600 characters.
 * We aim for 160 characters when possible for maximum compatibility.
 */

export interface SMSTemplateVariables {
  customerName: string;
  ticketNumber?: string;
  appointmentNumber?: string;
  appointmentDate?: string;
  appointmentTime?: string;
  deviceBrand: string;
  deviceModel: string;
  status?: string;
  businessName: string;
  businessPhone: string;
  businessHours?: string;
  estimatedDate?: string;
  totalCost?: string;
  holdReason?: string;
  trackingUrl?: string;
  statusUrl?: string;
}

export const SMS_TEMPLATES = {
  // Ticket status: in_progress
  status_in_progress: {
    template: "Hi {customerName}! Good news - we've started working on your {deviceBrand} {deviceModel} (Ticket #{ticketNumber}). We'll keep you updated on progress. - {businessName}",
    maxLength: 160,
    description: "Sent when technician starts working on device"
  },

  // Ticket status: completed  
  status_completed: {
    template: "🎉 Your device is ready! Ticket #{ticketNumber}. Total: ${totalCost}. Check: {statusUrl} - {businessName} {businessPhone}",
    maxLength: 160,
    description: "Sent when repair is completed and device is ready"
  },

  // Ticket status: on_hold
  status_on_hold: {
    template: "Your repair for {deviceBrand} {deviceModel} (#{ticketNumber}) is on hold: {holdReason}. We'll contact you soon with next steps. - {businessName} {businessPhone}",
    maxLength: 160,
    description: "Sent when repair is placed on hold"
  },

  // Alternative longer templates (if needed)
  status_completed_detailed: {
    template: "Great news {customerName}! Your {deviceBrand} {deviceModel} repair is complete. Ticket #{ticketNumber} - Total cost: ${totalCost}. Your device is ready for pickup at {businessName}. Please bring this message or your ticket number. Call us at {businessPhone} with any questions. Thanks for choosing us!",
    maxLength: 320,
    description: "Detailed completion message with more information"
  },

  status_in_progress_detailed: {
    template: "Hello {customerName}, we've begun working on your {deviceBrand} {deviceModel} repair (Ticket #{ticketNumber}). Our technician is diagnosing the issue and will provide updates as we progress. Expected completion by {estimatedDate}. Questions? Call {businessPhone}. - {businessName}",
    maxLength: 320,
    description: "Detailed in-progress message with estimated completion"
  },

  // New ticket notification (optional)
  new_ticket: {
    template: "Thank you {customerName}! We've received your {deviceBrand} {deviceModel} repair request. Ticket #{ticketNumber}. We'll begin diagnosis soon and keep you updated. - {businessName}",
    maxLength: 160,
    description: "Acknowledgment when new ticket is created"
  },

  // Custom status messages
  status_cancelled: {
    template: "Your repair request for {deviceBrand} {deviceModel} (#{ticketNumber}) has been cancelled. Please contact us at {businessPhone} for details. - {businessName}",
    maxLength: 160,
    description: "Sent when repair is cancelled"
  },

  // Appointment related
  appointment_received: {
    template: "Appt request received! #{appointmentNumber} on {appointmentDate} at {appointmentTime}. Check status: {statusUrl} - {businessName}",
    maxLength: 160,
    description: "Appointment request received SMS"
  },
  
  appointment_confirmed: {
    template: "Your appointment #{appointmentNumber} is confirmed for {appointmentDate} at {appointmentTime}. See you then! - {businessName}",
    maxLength: 160,
    description: "Appointment confirmed by staff SMS"
  },
  
  appointment_reminder: {
    template: "Reminder: Your appointment is tomorrow at {appointmentTime}. Please bring your {deviceBrand} {deviceModel} and passcode. See you soon! - {businessName}",
    maxLength: 160,
    description: "Appointment reminder (day before)"
  },
  
  appointment_day_of: {
    template: "Today's appointment at {appointmentTime}! We're ready for your {deviceBrand} {deviceModel}. See you soon! - {businessName}",
    maxLength: 160,
    description: "Appointment reminder (day of)"
  },
  
  appointment_to_ticket: {
    template: "Your device has been checked in! Ticket #{ticketNumber} created. We'll update you on repair progress. - {businessName}",
    maxLength: 160,
    description: "Appointment converted to ticket"
  }
} as const;

/**
 * Process SMS template with provided variables
 */
export function processSMSTemplate(
  templateKey: keyof typeof SMS_TEMPLATES,
  variables: Partial<SMSTemplateVariables>,
  useDetailedVersion: boolean = false
): { message: string; characterCount: number; withinLimit: boolean } {
  
  // Select template based on detailed preference
  let selectedTemplate = SMS_TEMPLATES[templateKey];
  
  // Check if detailed version exists and is requested
  if (useDetailedVersion) {
    const detailedKey = `${templateKey}_detailed` as keyof typeof SMS_TEMPLATES;
    if (SMS_TEMPLATES[detailedKey]) {
      selectedTemplate = SMS_TEMPLATES[detailedKey];
    }
  }

  let message = selectedTemplate.template;

  // Default values for common variables
  const defaults: SMSTemplateVariables = {
    customerName: variables.customerName || 'Customer',
    ticketNumber: variables.ticketNumber || 'N/A',
    appointmentNumber: variables.appointmentNumber || 'N/A',
    appointmentDate: variables.appointmentDate || '',
    appointmentTime: variables.appointmentTime || '',
    deviceBrand: variables.deviceBrand || 'Device',
    deviceModel: variables.deviceModel || '',
    status: variables.status || 'unknown',
    businessName: variables.businessName || 'The Phone Guys',
    businessPhone: variables.businessPhone || '(469) 608-1050',
    businessHours: variables.businessHours || '9AM-7PM Mon-Fri, 10AM-6PM Sat, 11AM-5PM Sun',
    estimatedDate: variables.estimatedDate || '',
    totalCost: variables.totalCost || '0.00',
    holdReason: variables.holdReason || 'awaiting parts',
    trackingUrl: variables.trackingUrl || '',
    statusUrl: variables.statusUrl || ''
  };

  // Replace all template variables (including those with # prefix like #{appointmentNumber})
  Object.entries(defaults).forEach(([key, value]) => {
    // Replace both {variable} and #{variable} formats
    const regex = new RegExp(`#?{${key}}`, 'g');
    message = message.replace(regex, value);
  });

  const characterCount = message.length;
  const withinLimit = characterCount <= selectedTemplate.maxLength;

  return {
    message,
    characterCount,
    withinLimit
  };
}

/**
 * Get SMS template by ticket status
 */
export function getSMSTemplateByStatus(status: string): keyof typeof SMS_TEMPLATES {
  const statusTemplateMap: Record<string, keyof typeof SMS_TEMPLATES> = {
    'in_progress': 'status_in_progress',
    'completed': 'status_completed',
    'on_hold': 'status_on_hold',
    'cancelled': 'status_cancelled'
  };

  return statusTemplateMap[status] || 'status_in_progress';
}

/**
 * Preview all templates with sample data
 */
export function previewAllTemplates(): Array<{
  templateKey: string;
  description: string;
  message: string;
  characterCount: number;
  withinLimit: boolean;
}> {
  const sampleVariables: SMSTemplateVariables = {
    customerName: 'John Smith',
    ticketNumber: 'TK001234',
    deviceBrand: 'iPhone',
    deviceModel: '14 Pro',
    status: 'completed',
    businessName: 'The Phone Guys',
    businessPhone: '(469) 608-1050',
    businessHours: '9AM-7PM Mon-Fri, 10AM-6PM Sat, 11AM-5PM Sun',
    estimatedDate: 'tomorrow',
    totalCost: '149.99',
    holdReason: 'waiting for part delivery',
    appointmentNumber: 'APT001234',
    appointmentDate: 'Dec 15',
    appointmentTime: '2:00 PM',
    trackingUrl: '',
    statusUrl: 'https://status.phoneguysrepair.com'
  };

  return Object.entries(SMS_TEMPLATES).map(([key, template]) => {
    const processed = processSMSTemplate(key as keyof typeof SMS_TEMPLATES, sampleVariables);
    return {
      templateKey: key,
      description: template.description,
      message: processed.message,
      characterCount: processed.characterCount,
      withinLimit: processed.withinLimit
    };
  });
}

/**
 * Validate template variables for completeness
 */
export function validateTemplateVariables(
  templateKey: keyof typeof SMS_TEMPLATES,
  variables: Partial<SMSTemplateVariables>
): { isValid: boolean; missingVariables: string[] } {
  const template = SMS_TEMPLATES[templateKey].template;
  const requiredVariables: string[] = [];
  const missingVariables: string[] = [];

  // Extract all variables from template
  const variableMatches = template.match(/{(\w+)}/g);
  if (variableMatches) {
    variableMatches.forEach(match => {
      const varName = match.replace(/[{}]/g, '');
      if (!requiredVariables.includes(varName)) {
        requiredVariables.push(varName);
      }
    });
  }

  // Check for missing variables
  requiredVariables.forEach(varName => {
    if (!variables[varName as keyof SMSTemplateVariables]) {
      missingVariables.push(varName);
    }
  });

  return {
    isValid: missingVariables.length === 0,
    missingVariables
  };
}