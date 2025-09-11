import { InternalNotificationRepository } from '../repositories/internal-notification.repository';
import { UserRepository } from '../repositories/user.repository';
import { 
  InternalNotification, 
  InternalNotificationType, 
  InternalNotificationPriority,
  CreateInternalNotification,
  InternalNotificationWithUser
} from '../types/internal-notification.types';

export class InternalNotificationService {
  private notificationRepo: InternalNotificationRepository;
  private userRepo: UserRepository;

  constructor(useServiceRole = false) {
    this.notificationRepo = new InternalNotificationRepository(useServiceRole);
    this.userRepo = new UserRepository(useServiceRole);
  }

  /**
   * Get all notifications for a user
   */
  async getUserNotifications(userId: string): Promise<InternalNotificationWithUser[]> {
    return this.notificationRepo.findByUser(userId);
  }

  /**
   * Get unread notifications for a user
   */
  async getUnreadNotifications(userId: string): Promise<InternalNotificationWithUser[]> {
    return this.notificationRepo.findUnreadByUser(userId);
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationRepo.getUnreadCount(userId);
  }

  /**
   * Get recent notifications with limit
   */
  async getRecentNotifications(userId: string, limit: number = 10): Promise<InternalNotificationWithUser[]> {
    return this.notificationRepo.getRecentNotifications(userId, limit);
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(notificationId: string): Promise<InternalNotification> {
    return this.notificationRepo.markAsRead(notificationId);
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<void> {
    return this.notificationRepo.markAllAsRead(userId);
  }

  /**
   * Create a notification for a single user
   */
  async createNotification(data: CreateInternalNotification): Promise<InternalNotification> {
    return this.notificationRepo.createNotification({
      user_id: data.user_id,
      type: data.type,
      title: data.title,
      message: data.message,
      priority: data.priority || InternalNotificationPriority.NORMAL,
      action_url: data.action_url || null,
      data: data.data || null,
      created_by: data.created_by || null,
      expires_at: data.expires_at || null
    });
  }

  /**
   * Create notifications for multiple users
   */
  async createBulkNotifications(
    userIds: string[],
    notification: Omit<CreateInternalNotification, 'user_id'>
  ): Promise<InternalNotification[]> {
    const notifications = userIds.map(userId => ({
      user_id: userId,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      priority: notification.priority || InternalNotificationPriority.NORMAL,
      action_url: notification.action_url || null,
      data: notification.data || null,
      created_by: notification.created_by || null,
      expires_at: notification.expires_at || null
    }));

    return this.notificationRepo.createBulkNotifications(notifications);
  }

  /**
   * Notify all users with a specific role
   */
  async notifyUsersByRole(
    role: string,
    notification: Omit<CreateInternalNotification, 'user_id'>
  ): Promise<InternalNotification[]> {
    const users = await this.userRepo.findByRole(role);
    const userIds = users.map(user => user.id);
    
    if (userIds.length === 0) {
      return [];
    }

    return this.createBulkNotifications(userIds, notification);
  }

  /**
   * Create notification for new appointment
   */
  async notifyNewAppointment(
    appointmentId: string,
    customerName: string,
    appointmentDate: string,
    createdBy?: string
  ): Promise<InternalNotification[]> {
    const admins = await this.userRepo.findByRole('admin');
    const managers = await this.userRepo.findByRole('manager');
    const userIds = [...admins, ...managers].map(user => user.id);

    return this.createBulkNotifications(userIds, {
      type: InternalNotificationType.NEW_APPOINTMENT,
      title: `New appointment with ${customerName}`,
      message: `Scheduled for ${appointmentDate}`,
      priority: InternalNotificationPriority.HIGH,
      action_url: `/appointments/${appointmentId}`,
      data: { appointment_id: appointmentId },
      created_by: createdBy
    });
  }

  /**
   * Create notification for appointment assignment
   */
  async notifyAppointmentAssignment(
    appointmentId: string,
    assignedUserId: string,
    customerName: string,
    appointmentDate: string,
    assignedBy?: string
  ): Promise<InternalNotification> {
    return this.createNotification({
      user_id: assignedUserId,
      type: InternalNotificationType.APPOINTMENT_ASSIGNED,
      title: `Appointment with ${customerName}`,
      message: `You've been assigned for ${appointmentDate}`,
      priority: InternalNotificationPriority.HIGH,
      action_url: `/appointments/${appointmentId}`,
      data: { appointment_id: appointmentId },
      created_by: assignedBy
    });
  }

  /**
   * Create notification for ticket assignment
   */
  async notifyTicketAssignment(
    ticketId: string,
    ticketNumber: string,
    assignedUserId: string,
    customerName: string,
    deviceInfo: string,
    assignedBy?: string
  ): Promise<InternalNotification> {
    return this.createNotification({
      user_id: assignedUserId,
      type: InternalNotificationType.TICKET_ASSIGNED,
      title: `Ticket for ${customerName}`,
      message: `${deviceInfo} repair - Ticket #${ticketNumber}`,
      priority: InternalNotificationPriority.HIGH,
      action_url: `/orders/${ticketId}`,
      data: { ticket_id: ticketId },
      created_by: assignedBy
    });
  }

  /**
   * Create notification for ticket status change
   */
  async notifyTicketStatusChange(
    ticketId: string,
    ticketNumber: string,
    userId: string,
    newStatus: string,
    customerName: string,
    changedBy?: string
  ): Promise<InternalNotification> {
    const statusTitles: Record<string, string> = {
      'completed': `${customerName}'s repair completed`,
      'on_hold': `${customerName}'s repair on hold`,
      'in_progress': `Working on ${customerName}'s device`,
      'cancelled': `${customerName}'s repair cancelled`
    };

    const statusMessages: Record<string, string> = {
      'completed': `Ticket #${ticketNumber} is ready for pickup`,
      'on_hold': `Ticket #${ticketNumber} - awaiting parts or customer response`,
      'in_progress': `Ticket #${ticketNumber} repair started`,
      'cancelled': `Ticket #${ticketNumber} has been cancelled`
    };

    const title = statusTitles[newStatus] || `${customerName} - ${newStatus}`;
    const message = statusMessages[newStatus] || `Ticket #${ticketNumber} status: ${newStatus}`;

    return this.createNotification({
      user_id: userId,
      type: newStatus === 'completed' ? InternalNotificationType.TICKET_COMPLETED : 
            newStatus === 'on_hold' ? InternalNotificationType.TICKET_ON_HOLD :
            InternalNotificationType.TICKET_STATUS_CHANGE,
      title,
      message,
      priority: newStatus === 'completed' ? InternalNotificationPriority.NORMAL : InternalNotificationPriority.LOW,
      action_url: `/orders/${ticketId}`,
      data: { ticket_id: ticketId, status: newStatus },
      created_by: changedBy
    });
  }

  /**
   * Create system alert notification
   */
  async createSystemAlert(
    userIds: string[],
    title: string,
    message: string,
    priority: InternalNotificationPriority = InternalNotificationPriority.HIGH
  ): Promise<InternalNotification[]> {
    return this.createBulkNotifications(userIds, {
      type: InternalNotificationType.SYSTEM_ALERT,
      title,
      message,
      priority,
      created_by: 'system'
    });
  }

  /**
   * Clean up old read notifications
   */
  async cleanupOldNotifications(daysOld: number = 30): Promise<number> {
    return this.notificationRepo.deleteOldNotifications(daysOld);
  }
}