import { Database } from './database.types';

// Base type from database
export type InternalNotification = Database['public']['Tables']['internal_notifications']['Row'];
export type CreateInternalNotificationDto = Database['public']['Tables']['internal_notifications']['Insert'];
export type UpdateInternalNotificationDto = Database['public']['Tables']['internal_notifications']['Update'];

// Notification types enum
export enum InternalNotificationType {
  NEW_APPOINTMENT = 'new_appointment',
  APPOINTMENT_ASSIGNED = 'appointment_assigned',
  APPOINTMENT_UNASSIGNED = 'appointment_unassigned',
  APPOINTMENT_TRANSFERRED = 'appointment_transferred',
  APPOINTMENT_STATUS_CHANGE = 'appointment_status_change',
  NEW_TICKET = 'new_ticket',
  TICKET_ASSIGNED = 'ticket_assigned',
  TICKET_UNASSIGNED = 'ticket_unassigned',
  TICKET_TRANSFERRED = 'ticket_transferred',
  TICKET_STATUS_CHANGE = 'ticket_status_change',
  TICKET_COMPLETED = 'ticket_completed',
  TICKET_ON_HOLD = 'ticket_on_hold',
  USER_MENTION = 'user_mention',
  COMMENT_ADDED = 'comment_added',
  COMMENT_MENTION = 'comment_mention',
  COMMENT_REPLY = 'comment_reply',
  COMMENT_REACTION = 'comment_reaction',
  SYSTEM_ALERT = 'system_alert',
  CUSTOM = 'custom'
}

// Priority levels (must match database constraint)
export enum InternalNotificationPriority {
  LOW = 'low',
  NORMAL = 'normal',  // Database uses 'normal' not 'medium'
  MEDIUM = 'normal',  // Alias for backward compatibility
  HIGH = 'high',
  URGENT = 'urgent'
}

// Notification status (using is_read field)
export type InternalNotificationStatus = 'read' | 'unread';

// Extended notification with user details
export interface InternalNotificationWithUser extends InternalNotification {
  created_by_user?: {
    full_name: string;
    email: string;
  };
}

// Notification action data
export interface NotificationActionData {
  ticket_id?: string;
  appointment_id?: string;
  customer_id?: string;
  user_id?: string;
  [key: string]: any;
}

// Create notification input
export interface CreateInternalNotification {
  user_id: string;
  type: InternalNotificationType;
  title: string;
  message: string;
  priority?: InternalNotificationPriority;
  action_url?: string;
  data?: NotificationActionData;
  created_by?: string;
  expires_at?: string;
}