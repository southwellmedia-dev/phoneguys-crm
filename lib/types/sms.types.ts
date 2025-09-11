import { Database } from './database.types';

// Extended Customer type with SMS preferences
export interface CustomerWithSMSPreferences extends Database['public']['Tables']['customers']['Row'] {
  sms_notifications_enabled?: boolean;
  notification_preferences?: {
    email: boolean;
    sms: boolean;
  } | string;
}

// SMS Notification record type
export interface SMSNotification {
  id: string;
  ticket_id?: string;
  customer_id: string;
  phone_number: string;
  message_content: string;
  template_used?: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'undelivered';
  twilio_message_id?: string;
  error_message?: string;
  sent_at?: string;
  delivered_at?: string;
  created_at: string;
  updated_at: string;
}

// SMS Settings from database
export interface SMSSettings {
  sms_notifications_enabled: boolean;
  sms_business_name: string;
  sms_business_phone: string;
  sms_use_detailed_templates: boolean;
  sms_rate_limit_per_hour: number;
}

// SMS Notification result
export interface SMSNotificationResult {
  success: boolean;
  messageId?: string;
  error?: string;
  to: string;
  templateUsed?: string;
  characterCount?: number;
}

// Combined notification result
export interface NotificationResult {
  emailResult?: any;
  smsResult?: SMSNotificationResult;
  success: boolean;
  method: 'email' | 'sms' | 'both' | 'none';
}