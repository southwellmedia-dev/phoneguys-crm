import { UserRepository, UserStatistics, UserActivityLog } from '@/lib/repositories/user.repository';
import { getRepository } from '@/lib/repositories/repository-manager';

export interface UserPerformanceMetrics {
  daily: {
    ticketsCompleted: number;
    appointmentsConverted: number;
    notesCreated: number;
    timeLogged: number;
  };
  weekly: {
    ticketsCompleted: number;
    appointmentsConverted: number;
    averageCompletionTime: number;
    productivity: number;
  };
  monthly: {
    ticketsCompleted: number;
    appointmentsConverted: number;
    customerSatisfaction: number;
    efficiency: number;
  };
}

export interface UserProfileData {
  user: any;
  statistics: UserStatistics | null;
  recentActivity: UserActivityLog[];
  performanceMetrics: UserPerformanceMetrics;
  workload: {
    current: number;
    pending: number;
    completed: number;
  };
}

export class UserStatisticsService {
  private userRepo: UserRepository;

  constructor() {
    this.userRepo = getRepository.users(true);
  }

  async getUserProfile(userId: string): Promise<UserProfileData | null> {
    // Get user with statistics
    const userWithStats = await this.userRepo.getUserWithStatistics(userId);
    if (!userWithStats) return null;

    // Calculate performance metrics
    const performanceMetrics = await this.calculatePerformanceMetrics(userId);

    // Get current workload
    const workload = await this.getUserWorkload(userId);

    return {
      user: userWithStats,
      statistics: userWithStats.statistics || null,
      recentActivity: userWithStats.recent_activity || [],
      performanceMetrics,
      workload
    };
  }

  async updateUserStatistics(userId: string): Promise<void> {
    await this.userRepo.updateUserStatistics(userId);
  }

  async updateAllUserStatistics(): Promise<void> {
    const users = await this.userRepo.findAll();
    const updatePromises = users.map(user => 
      this.userRepo.updateUserStatistics(user.id)
    );
    await Promise.all(updatePromises);
  }

  async getTeamStatistics(): Promise<any> {
    const stats = await this.userRepo.getTeamStatistics();
    
    // Calculate team totals and averages
    const teamTotals = stats.reduce((acc, userStat) => ({
      totalTicketsCompleted: acc.totalTicketsCompleted + userStat.tickets_completed,
      totalTicketsInProgress: acc.totalTicketsInProgress + userStat.tickets_in_progress,
      totalAppointmentsConverted: acc.totalAppointmentsConverted + userStat.appointments_converted,
      totalTimeLogged: acc.totalTimeLogged + userStat.total_time_logged_minutes
    }), {
      totalTicketsCompleted: 0,
      totalTicketsInProgress: 0,
      totalAppointmentsConverted: 0,
      totalTimeLogged: 0
    });

    const teamAverages = {
      avgTicketsPerUser: teamTotals.totalTicketsCompleted / stats.length,
      avgTimePerTicket: teamTotals.totalTimeLogged / teamTotals.totalTicketsCompleted,
      avgConversionRate: stats.reduce((acc, s) => acc + (s.conversion_rate || 0), 0) / stats.length
    };

    return {
      individualStats: stats,
      teamTotals,
      teamAverages,
      topPerformers: this.getTopPerformers(stats)
    };
  }

  async getUserActivityTimeline(userId: string, days = 7): Promise<any[]> {
    const logs = await this.userRepo.getUserActivityLogs(userId, 100);
    
    // Group activities by day
    const timeline = logs.reduce((acc, log) => {
      const date = new Date(log.created_at).toLocaleDateString();
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(log);
      return acc;
    }, {} as Record<string, UserActivityLog[]>);

    return Object.entries(timeline).map(([date, activities]) => ({
      date,
      activities,
      summary: this.summarizeActivities(activities)
    }));
  }

  async getSystemActivityFeed(limit = 50): Promise<UserActivityLog[]> {
    return this.userRepo.getAllUserActivityLogs(limit);
  }

  private async calculatePerformanceMetrics(userId: string): Promise<UserPerformanceMetrics> {
    // Get user statistics for all-time metrics
    const stats = await this.userRepo.getUserStatistics(userId);
    
    if (!stats) {
      return {
        daily: {
          ticketsCompleted: 0,
          appointmentsConverted: 0,
          notesCreated: 0,
          timeLogged: 0
        },
        weekly: {
          ticketsCompleted: 0,
          appointmentsConverted: 0,
          averageCompletionTime: 0,
          productivity: 0
        },
        monthly: {
          ticketsCompleted: 0,
          appointmentsConverted: 0,
          customerSatisfaction: 0,
          efficiency: 0
        }
      };
    }

    // Calculate productivity as percentage of assigned tickets completed
    const productivity = stats.tickets_assigned > 0 
      ? Math.round((stats.tickets_completed / stats.tickets_assigned) * 100)
      : 0;

    // Calculate efficiency score
    const efficiency = this.calculateEfficiency(stats);

    // Use all-time statistics for all periods (since we're not filtering by date)
    // This gives a consistent view of overall performance
    return {
      daily: {
        ticketsCompleted: stats.tickets_completed,
        appointmentsConverted: stats.appointments_converted,
        notesCreated: stats.notes_created,
        timeLogged: Math.round(stats.total_time_logged_minutes / 60) // Convert to hours
      },
      weekly: {
        ticketsCompleted: stats.tickets_completed,
        appointmentsConverted: stats.appointments_converted,
        averageCompletionTime: stats.avg_completion_time_hours || 0,
        productivity: productivity
      },
      monthly: {
        ticketsCompleted: stats.tickets_completed,
        appointmentsConverted: stats.appointments_converted,
        customerSatisfaction: stats.customer_satisfaction_avg || 0,
        efficiency: efficiency
      }
    };
  }

  private async getUserWorkload(userId: string): Promise<any> {
    const supabase = await this.userRepo.getClient();
    
    const { data: tickets } = await supabase
      .from('repair_tickets')
      .select('status')
      .eq('assigned_to', userId);

    const workload = {
      current: 0,
      pending: 0,
      completed: 0
    };

    tickets?.forEach(ticket => {
      switch (ticket.status) {
        case 'in_progress':
          workload.current++;
          break;
        case 'new':
        case 'on_hold':
          workload.pending++;
          break;
        case 'completed':
          workload.completed++;
          break;
      }
    });

    return workload;
  }

  private getTopPerformers(stats: any[]): any[] {
    return stats
      .sort((a, b) => b.tickets_completed - a.tickets_completed)
      .slice(0, 5)
      .map(stat => ({
        userId: stat.user_id,
        userName: stat.users?.full_name || 'Unknown',
        ticketsCompleted: stat.tickets_completed,
        averageCompletionTime: stat.avg_completion_time_hours,
        efficiency: this.calculateEfficiency(stat)
      }));
  }

  private calculateEfficiency(stat: UserStatistics): number {
    if (!stat.tickets_completed) return 0;
    const baseEfficiency = (stat.tickets_completed / (stat.tickets_assigned || 1)) * 100;
    const timeBonus = stat.avg_completion_time_hours && stat.avg_completion_time_hours < 24 ? 10 : 0;
    return Math.min(100, baseEfficiency + timeBonus);
  }

  private calculateAverageTime(tickets: any[]): number {
    if (!tickets.length) return 0;
    const totalTime = tickets.reduce((sum, t) => sum + (t.total_time_minutes || 0), 0);
    return totalTime / tickets.length;
  }

  private summarizeActivities(activities: UserActivityLog[]): any {
    const summary = activities.reduce((acc, activity) => {
      if (!acc[activity.activity_type]) {
        acc[activity.activity_type] = 0;
      }
      acc[activity.activity_type]++;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: activities.length,
      byType: summary
    };
  }

  async logActivity(
    userId: string,
    activityType: string,
    entityType?: string,
    entityId?: string,
    details?: any
  ): Promise<void> {
    await this.userRepo.logUserActivity(userId, activityType, entityType, entityId, details);
  }
}