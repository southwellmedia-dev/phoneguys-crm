import { BaseRepository } from './base.repository';
import { Notification, CreateNotificationDto, NotificationStatus, NotificationType } from '@/lib/types';

export class NotificationRepository extends BaseRepository<Notification> {
  constructor(useServiceRole = false) {
    super('notifications', useServiceRole);
  }

  async findByTicket(ticketId: string): Promise<Notification[]> {
    return this.findAll({ ticket_id: ticketId });
  }

  async findByCustomer(customerId: string): Promise<Notification[]> {
    return this.findAll({ customer_id: customerId });
  }

  async findPendingNotifications(): Promise<Notification[]> {
    return this.findAll({ 
      status: 'pending'
    });
  }

  async findByStatus(status: NotificationStatus): Promise<Notification[]> {
    return this.findAll({ status });
  }

  async createNotification(data: CreateNotificationDto): Promise<Notification> {
    return this.create({
      ...data,
      status: 'pending'
    });
  }

  async markAsSent(notificationId: string): Promise<Notification> {
    return this.update(notificationId, {
      status: 'sent',
      sent_at: new Date().toISOString()
    });
  }

  async markAsFailed(notificationId: string): Promise<Notification> {
    return this.update(notificationId, {
      status: 'failed'
    });
  }


  async getRecentNotifications(limit: number = 20): Promise<Notification[]> {
    const client = await this.getClient();
    const { data, error } = await client
      .from(this.tableName)
      .select(`
        *,
        ticket:repair_tickets!ticket_id (
          ticket_number
        ),
        customer:customers!customer_id (
          name,
          email
        )
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to fetch recent notifications: ${error.message}`);
    }

    return data as any[];
  }

  async getNotificationsByDateRange(startDate: string, endDate: string): Promise<Notification[]> {
    const client = await this.getClient();
    const { data, error } = await client
      .from(this.tableName)
      .select('*')
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch notifications by date range: ${error.message}`);
    }

    return data as Notification[];
  }

  async getNotificationStatistics(): Promise<{
    total: number;
    by_status: Record<NotificationStatus, number>;
    by_type: Record<NotificationType, number>;
  }> {
    const client = await this.getClient();
    
    // Get all notifications for statistics
    const { data: allNotifications, error } = await client
      .from(this.tableName)
      .select('status, notification_type');

    if (error) {
      throw new Error(`Failed to get notification statistics: ${error.message}`);
    }

    const notifications = allNotifications as Notification[];
    
    const byStatus: Record<NotificationStatus, number> = {
      pending: 0,
      sent: 0,
      failed: 0
    };
    
    const byType: Record<NotificationType, number> = {
      new_ticket: 0,
      status_change: 0,
      completion: 0,
      on_hold: 0,
      custom: 0
    };

    notifications.forEach(notification => {
      byStatus[notification.status]++;
      byType[notification.notification_type]++;
    });

    return {
      total: notifications.length,
      by_status: byStatus,
      by_type: byType
    };
  }
}