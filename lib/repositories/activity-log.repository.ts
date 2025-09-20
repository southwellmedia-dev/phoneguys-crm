import { BaseRepository } from './base.repository';
import { SupabaseClient } from '@supabase/supabase-js';

export interface ActivityLogData {
  user_id: string;
  activity_type: string;
  entity_type: string;
  entity_id: string;
  details?: Record<string, any>;
}

export class ActivityLogRepository extends BaseRepository {
  constructor(serviceRole = false) {
    super('user_activity_logs', serviceRole);
  }

  async create(data: ActivityLogData) {
    const client = await this.getClient();
    
    const { data: activity, error } = await client
      .from(this.tableName)
      .insert({
        ...data,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return activity;
  }

  async findByEntity(entityType: string, entityId: string, limit = 50) {
    const client = await this.getClient();
    
    const { data, error } = await client
      .from(this.tableName)
      .select('*')
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  async findRecent(limit = 50, activityType?: string) {
    const client = await this.getClient();
    
    let query = client
      .from(this.tableName)
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (activityType) {
      query = query.eq('activity_type', activityType);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  }
}