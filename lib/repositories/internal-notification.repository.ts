import { BaseRepository } from './base.repository';
import { InternalNotification, CreateInternalNotificationDto, InternalNotificationStatus } from '@/lib/types';

export class InternalNotificationRepository extends BaseRepository<InternalNotification> {
  constructor(useServiceRole = false) {
    super('internal_notifications', useServiceRole);
  }

  async findByUser(userId: string): Promise<InternalNotification[]> {
    const client = await this.getClient();
    const { data, error } = await client
      .from(this.tableName)
      .select(`
        *,
        created_by_user:users!created_by (
          full_name,
          email
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch notifications for user: ${error.message}`);
    }

    return data as any[];
  }

  async findUnreadByUser(userId: string): Promise<InternalNotification[]> {
    const client = await this.getClient();
    const { data, error } = await client
      .from(this.tableName)
      .select(`
        *,
        created_by_user:users!created_by (
          full_name,
          email
        )
      `)
      .eq('user_id', userId)
      .eq('is_read', false)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch unread notifications: ${error.message}`);
    }

    return data as any[];
  }

  async getUnreadCount(userId: string): Promise<number> {
    const client = await this.getClient();
    const { count, error } = await client
      .from(this.tableName)
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) {
      throw new Error(`Failed to get unread count: ${error.message}`);
    }

    return count || 0;
  }

  async markAsRead(notificationId: string): Promise<InternalNotification> {
    const client = await this.getClient();
    const { data, error } = await client
      .from(this.tableName)
      .update({ 
        is_read: true,
        read_at: new Date().toISOString()
      })
      .eq('id', notificationId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to mark notification as read: ${error.message}`);
    }

    return data;
  }

  async markAllAsRead(userId: string): Promise<void> {
    const client = await this.getClient();
    const { error } = await client
      .from(this.tableName)
      .update({ 
        is_read: true,
        read_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) {
      throw new Error(`Failed to mark all notifications as read: ${error.message}`);
    }
  }

  async createNotification(data: CreateInternalNotificationDto): Promise<InternalNotification> {
    const client = await this.getClient();
    
    console.log('📝 Creating notification with FULL data:', data);
    console.log('📝 Key fields:', {
      user_id: data.user_id,
      type: data.type,
      title: data.title,
      created_by: data.created_by,
      created_by_is_null: data.created_by === null,
      created_by_is_undefined: data.created_by === undefined
    });
    
    // Get current auth user for debugging
    const { data: { user: authUser } } = await client.auth.getUser();
    console.log('📝 Current auth user:', authUser?.id);
    
    const insertData = {
      ...data,
      is_read: false,
      created_at: new Date().toISOString()
    };
    
    console.log('📝 Insert data being sent:', insertData);
    
    const { data: notification, error } = await client
      .from(this.tableName)
      .insert(insertData)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create notification: ${error.message}`);
    }

    console.log('✅ Notification created successfully:', notification);
    return notification;
  }

  async createBulkNotifications(notifications: CreateInternalNotificationDto[]): Promise<InternalNotification[]> {
    const client = await this.getClient();
    const { data, error } = await client
      .from(this.tableName)
      .insert(
        notifications.map(n => ({
          ...n,
          is_read: false,
          created_at: new Date().toISOString()
        }))
      )
      .select();

    if (error) {
      throw new Error(`Failed to create bulk notifications: ${error.message}`);
    }

    return data;
  }

  async deleteOldNotifications(daysOld: number = 30): Promise<number> {
    const client = await this.getClient();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const { data, error } = await client
      .from(this.tableName)
      .delete()
      .lt('created_at', cutoffDate.toISOString())
      .eq('is_read', true)
      .select();

    if (error) {
      throw new Error(`Failed to delete old notifications: ${error.message}`);
    }

    return data?.length || 0;
  }

  async getRecentNotifications(userId: string, limit: number = 10): Promise<InternalNotification[]> {
    const client = await this.getClient();
    const { data, error } = await client
      .from(this.tableName)
      .select(`
        *,
        created_by_user:users!created_by (
          full_name,
          email
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to fetch recent notifications: ${error.message}`);
    }

    return data as any[];
  }
}