import { BaseRepository } from './base.repository';
import { User, UserRole } from '@/lib/types';

export interface UserStatistics {
  id: string;
  user_id: string;
  tickets_created: number;
  tickets_assigned: number;
  tickets_completed: number;
  tickets_in_progress: number;
  tickets_cancelled: number;
  tickets_on_hold: number;
  avg_completion_time_hours: number | null;
  appointments_created: number;
  appointments_assigned: number;
  appointments_converted: number;
  appointments_no_show: number;
  appointments_cancelled: number;
  conversion_rate: number | null;
  notes_created: number;
  total_time_logged_minutes: number;
  daily_completion_avg: number | null;
  weekly_completion_avg: number | null;
  monthly_completion_avg: number | null;
  customer_satisfaction_avg: number | null;
  last_activity_at: string | null;
  stats_updated_at: string;
}

export interface UserActivityLog {
  id: string;
  user_id: string;
  activity_type: string;
  entity_type: string | null;
  entity_id: string | null;
  details: any;
  created_at: string;
  user_name?: string;
}

export interface UserWithStatistics extends User {
  statistics?: UserStatistics;
  recent_activity?: UserActivityLog[];
}

export class UserRepository extends BaseRepository<User> {
  constructor(useServiceRole = false) {
    super('users', useServiceRole);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.findOne({ email });
  }

  async findByRole(role: UserRole | UserRole[]): Promise<User[]> {
    const roles = Array.isArray(role) ? role : [role];
    return this.findAll({ role: roles });
  }

  async findTechnicians(): Promise<User[]> {
    return this.findByRole('technician');
  }

  async findManagers(): Promise<User[]> {
    return this.findByRole(['manager', 'admin']);
  }

  async getUserWithAssignedTickets(userId: string): Promise<User & { assigned_tickets?: any[] } | null> {
    const client = await this.getClient();
    const { data, error } = await client
      .from(this.tableName)
      .select(`
        *,
        assigned_tickets:repair_tickets!assigned_to (
          id,
          ticket_number,
          status,
          priority,
          device_brand,
          device_model,
          customer:customers!customer_id (
            name,
            email
          )
        )
      `)
      .eq('id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to fetch user with assigned tickets: ${error.message}`);
    }

    return data as any;
  }

  async getActiveUsers(): Promise<User[]> {
    const client = await this.getClient();
    const { data, error } = await client
      .from(this.tableName)
      .select(`
        *,
        assigned_tickets:repair_tickets!assigned_to!inner (
          id
        )
      `)
      .in('assigned_tickets.status', ['new', 'in_progress'])
      .order('full_name');

    if (error) {
      throw new Error(`Failed to fetch active users: ${error.message}`);
    }

    // Remove the assigned_tickets from the result
    return (data as any[]).map(({ assigned_tickets, ...user }) => user) as User[];
  }

  async getUserWorkload(userId: string): Promise<{
    total_tickets: number;
    new_tickets: number;
    in_progress_tickets: number;
    on_hold_tickets: number;
  }> {
    const client = await this.getClient();
    
    const { data: tickets, error } = await client
      .from('repair_tickets')
      .select('status')
      .eq('assigned_to', userId)
      .in('status', ['new', 'in_progress', 'on_hold']);

    if (error) {
      throw new Error(`Failed to get user workload: ${error.message}`);
    }

    const workload = {
      total_tickets: 0,
      new_tickets: 0,
      in_progress_tickets: 0,
      on_hold_tickets: 0
    };

    (tickets as any[]).forEach(ticket => {
      workload.total_tickets++;
      switch (ticket.status) {
        case 'new':
          workload.new_tickets++;
          break;
        case 'in_progress':
          workload.in_progress_tickets++;
          break;
        case 'on_hold':
          workload.on_hold_tickets++;
          break;
      }
    });

    return workload;
  }

  async searchUsers(query: string): Promise<User[]> {
    const client = await this.getClient();
    const { data, error } = await client
      .from(this.tableName)
      .select('*')
      .or(`full_name.ilike.%${query}%,email.ilike.%${query}%`)
      .order('full_name');

    if (error) {
      throw new Error(`Failed to search users: ${error.message}`);
    }

    return data as User[];
  }

  async getUserStatistics(userId: string): Promise<UserStatistics | null> {
    const client = await this.getClient();
    const { data, error } = await client
      .from('user_statistics')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to fetch user statistics: ${error.message}`);
    }

    return data as UserStatistics | null;
  }

  async updateUserStatistics(userId: string): Promise<void> {
    const client = await this.getClient();
    const { error } = await client
      .rpc('update_user_statistics', { p_user_id: userId });

    if (error) {
      throw new Error(`Failed to update user statistics: ${error.message}`);
    }
  }

  async getUserActivityLogs(userId: string, limit = 50): Promise<UserActivityLog[]> {
    const client = await this.getClient();
    const { data, error } = await client
      .from('user_activity_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to fetch activity logs: ${error.message}`);
    }

    return data as UserActivityLog[];
  }

  async getAllUserActivityLogs(limit = 100): Promise<UserActivityLog[]> {
    const client = await this.getClient();
    const { data, error } = await client
      .from('user_activity_logs')
      .select(`
        *,
        users!user_activity_logs_user_id_fkey (
          full_name,
          email
        )
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to fetch all activity logs: ${error.message}`);
    }

    return (data as any[]).map(log => ({
      ...log,
      user_name: log.users?.full_name || log.users?.email
    }));
  }

  async getUserWithStatistics(userId: string): Promise<UserWithStatistics | null> {
    console.log('getUserWithStatistics called for userId:', userId);
    const client = await this.getClient();
    
    // First try to fetch just the user
    const { data: basicUser, error: basicError } = await client
      .from(this.tableName)
      .select('*')
      .eq('id', userId)
      .single();

    console.log('Basic user query:', basicUser ? 'Found' : 'Not found', 'Error:', basicError);

    if (!basicUser) {
      console.log('No user found with ID:', userId);
      return null;
    }

    // Try to fetch user with statistics (may fail if table doesn't exist)
    const { data: userData, error: userError } = await client
      .from(this.tableName)
      .select(`
        *,
        user_statistics (*)
      `)
      .eq('id', userId)
      .single();

    console.log('User with stats query result:', userData ? 'Found' : 'Not found', 'Error:', userError);

    // If statistics query failed, just return the basic user
    if (userError && userError.code !== 'PGRST116') {
      console.warn('Could not fetch statistics, returning basic user data:', userError.message);
      return {
        ...basicUser,
        statistics: null,
        recent_activity: []
      } as UserWithStatistics;
    }

    if (!userData) {
      // Fallback to basic user if full query failed
      return {
        ...basicUser,
        statistics: null,
        recent_activity: []
      } as UserWithStatistics;
    }

    // Fetch recent activity
    const { data: activityData, error: activityError } = await client
      .from('user_activity_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (activityError) {
      console.error('Failed to fetch activity logs:', activityError);
    }

    // Handle both array and object responses for user_statistics
    let statistics = null;
    if (userData.user_statistics) {
      console.log('user_statistics type:', Array.isArray(userData.user_statistics) ? 'array' : 'object');
      console.log('user_statistics value:', userData.user_statistics);
      statistics = Array.isArray(userData.user_statistics) 
        ? userData.user_statistics[0] 
        : userData.user_statistics;
    }

    return {
      ...userData,
      statistics,
      recent_activity: activityData || []
    } as UserWithStatistics;
  }

  async logUserActivity(
    userId: string,
    activityType: string,
    entityType?: string,
    entityId?: string,
    details?: any
  ): Promise<void> {
    const client = await this.getClient();
    const { error } = await client
      .rpc('log_user_activity', {
        p_user_id: userId,
        p_activity_type: activityType,
        p_entity_type: entityType || null,
        p_entity_id: entityId || null,
        p_details: details || {}
      });

    if (error) {
      throw new Error(`Failed to log user activity: ${error.message}`);
    }
  }

  async getUserDashboardData(userId: string): Promise<any> {
    const client = await this.getClient();
    const { data, error } = await client
      .rpc('get_user_dashboard_data', { p_user_id: userId });

    if (error) {
      throw new Error(`Failed to fetch dashboard data: ${error.message}`);
    }

    return data;
  }

  async updateLastLogin(userId: string): Promise<void> {
    const client = await this.getClient();
    const { error } = await client
      .from(this.tableName)
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', userId);

    if (error) {
      throw new Error(`Failed to update last login: ${error.message}`);
    }
  }

  async updateUserPreferences(userId: string, preferences: any): Promise<void> {
    const client = await this.getClient();
    const { error } = await client
      .from(this.tableName)
      .update({ preferences })
      .eq('id', userId);

    if (error) {
      throw new Error(`Failed to update user preferences: ${error.message}`);
    }
  }

  async getTeamStatistics(): Promise<UserStatistics[]> {
    const client = await this.getClient();
    const { data, error } = await client
      .from('user_statistics')
      .select(`
        *,
        users!user_statistics_user_id_fkey (
          full_name,
          email,
          role
        )
      `)
      .order('tickets_completed', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch team statistics: ${error.message}`);
    }

    return data as any[];
  }
}