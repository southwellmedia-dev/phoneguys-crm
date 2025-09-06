import { UserRepository, UserWithStatistics } from '@/lib/repositories/user.repository';
import { UserStatisticsService } from './user-statistics.service';
import { getRepository } from '@/lib/repositories/repository-manager';

export interface UserPreferences {
  theme?: 'light' | 'dark' | 'system';
  notifications?: {
    email?: boolean;
    push?: boolean;
    ticketAssigned?: boolean;
    appointmentReminder?: boolean;
    dailySummary?: boolean;
  };
  dashboard?: {
    defaultView?: 'grid' | 'list';
    widgetsOrder?: string[];
    showStats?: boolean;
    showActivity?: boolean;
  };
}

export interface RoleDashboardData {
  role: string;
  userId: string;
  userName: string;
  widgets: DashboardWidget[];
  stats: any;
  quickActions: QuickAction[];
}

export interface DashboardWidget {
  id: string;
  title: string;
  type: 'stat' | 'list' | 'chart' | 'activity';
  data: any;
  priority: number;
}

export interface QuickAction {
  id: string;
  label: string;
  icon: string;
  action: string;
  color?: string;
}

export class UserProfileService {
  private userRepo: UserRepository;
  private statisticsService: UserStatisticsService;

  constructor() {
    this.userRepo = getRepository.users(true);
    this.statisticsService = new UserStatisticsService();
  }

  async getUserProfile(userId: string): Promise<UserWithStatistics | null> {
    const profile = await this.userRepo.getUserWithStatistics(userId);
    if (!profile) return null;

    // Update last login if needed
    await this.userRepo.updateLastLogin(userId);

    return profile;
  }

  async updateUserPreferences(userId: string, preferences: UserPreferences): Promise<void> {
    await this.userRepo.updateUserPreferences(userId, preferences);
  }

  async getUserPreferences(userId: string): Promise<UserPreferences> {
    const user = await this.userRepo.findById(userId);
    return (user as any)?.preferences || this.getDefaultPreferences();
  }

  async getRoleDashboardData(userId: string): Promise<RoleDashboardData> {
    const user = await this.userRepo.findById(userId);
    if (!user) throw new Error('User not found');

    const dashboardData = await this.userRepo.getUserDashboardData(userId);
    const role = (user as any).role;

    switch (role) {
      case 'technician':
        return this.buildTechnicianDashboard(user, dashboardData);
      case 'manager':
        return this.buildManagerDashboard(user, dashboardData);
      case 'admin':
        return this.buildAdminDashboard(user, dashboardData);
      default:
        return this.buildDefaultDashboard(user, dashboardData);
    }
  }

  private buildTechnicianDashboard(user: any, data: any): RoleDashboardData {
    return {
      role: 'technician',
      userId: user.id,
      userName: user.full_name,
      widgets: [
        {
          id: 'active-tickets',
          title: 'My Active Tickets',
          type: 'list',
          data: data.todaysTickets || [],
          priority: 1
        },
        {
          id: 'upcoming-appointments',
          title: 'Upcoming Appointments',
          type: 'list',
          data: data.upcomingAppointments || [],
          priority: 2
        },
        {
          id: 'personal-stats',
          title: 'My Performance',
          type: 'stat',
          data: {
            todayCompleted: data.statistics?.tickets_completed || 0,
            inProgress: data.statistics?.tickets_in_progress || 0,
            avgTime: data.statistics?.avg_completion_time_hours || 0,
            totalTime: data.statistics?.total_time_logged_minutes || 0
          },
          priority: 3
        },
        {
          id: 'recent-activity',
          title: 'Recent Activity',
          type: 'activity',
          data: data.recentActivity || [],
          priority: 4
        }
      ],
      stats: data.statistics,
      quickActions: [
        {
          id: 'new-ticket',
          label: 'New Ticket',
          icon: 'Plus',
          action: '/orders/new'
        },
        {
          id: 'timer',
          label: 'Start Timer',
          icon: 'Clock',
          action: 'start-timer'
        },
        {
          id: 'view-schedule',
          label: 'My Schedule',
          icon: 'Calendar',
          action: '/appointments'
        }
      ]
    };
  }

  private buildManagerDashboard(user: any, data: any): RoleDashboardData {
    return {
      role: 'manager',
      userId: user.id,
      userName: user.full_name,
      widgets: [
        {
          id: 'team-overview',
          title: 'Team Overview',
          type: 'list',
          data: data.teamOverview || [],
          priority: 1
        },
        {
          id: 'workload-distribution',
          title: 'Workload Distribution',
          type: 'chart',
          data: data.workloadDistribution || {},
          priority: 2
        },
        {
          id: 'todays-metrics',
          title: "Today's Metrics",
          type: 'stat',
          data: data.todaysMetrics || {},
          priority: 3
        },
        {
          id: 'pending-approvals',
          title: 'Pending Approvals',
          type: 'list',
          data: [], // Would need approval system
          priority: 4
        }
      ],
      stats: data.statistics,
      quickActions: [
        {
          id: 'team-report',
          label: 'Team Report',
          icon: 'FileText',
          action: '/reports/team'
        },
        {
          id: 'assign-tickets',
          label: 'Assign Tickets',
          icon: 'Users',
          action: '/tickets/unassigned'
        },
        {
          id: 'schedule-meeting',
          label: 'Schedule Meeting',
          icon: 'Calendar',
          action: '/calendar/new'
        },
        {
          id: 'view-analytics',
          label: 'Analytics',
          icon: 'TrendingUp',
          action: '/analytics'
        }
      ]
    };
  }

  private buildAdminDashboard(user: any, data: any): RoleDashboardData {
    return {
      role: 'admin',
      userId: user.id,
      userName: user.full_name,
      widgets: [
        {
          id: 'system-stats',
          title: 'System Overview',
          type: 'stat',
          data: data.systemStats || {},
          priority: 1
        },
        {
          id: 'user-activity',
          title: 'User Activity Feed',
          type: 'activity',
          data: data.userActivity || [],
          priority: 2
        },
        {
          id: 'recent-tickets',
          title: 'Recent Tickets',
          type: 'list',
          data: [], // Would fetch recent tickets
          priority: 3
        },
        {
          id: 'system-health',
          title: 'System Health',
          type: 'stat',
          data: {
            uptime: '99.9%',
            responseTime: '120ms',
            activeUsers: data.systemStats?.totalUsers || 0,
            storage: '45GB / 100GB'
          },
          priority: 4
        }
      ],
      stats: data.systemStats,
      quickActions: [
        {
          id: 'manage-users',
          label: 'Manage Users',
          icon: 'Users',
          action: '/admin/users',
          color: 'primary'
        },
        {
          id: 'system-settings',
          label: 'Settings',
          icon: 'Settings',
          action: '/admin/settings',
          color: 'secondary'
        },
        {
          id: 'reports',
          label: 'Reports',
          icon: 'FileText',
          action: '/reports',
          color: 'info'
        },
        {
          id: 'backup',
          label: 'Backup',
          icon: 'Download',
          action: '/admin/backup',
          color: 'warning'
        }
      ]
    };
  }

  private buildDefaultDashboard(user: any, data: any): RoleDashboardData {
    // Fallback dashboard for unknown roles
    return {
      role: 'user',
      userId: user.id,
      userName: user.full_name,
      widgets: [
        {
          id: 'welcome',
          title: 'Welcome',
          type: 'stat',
          data: {
            message: `Welcome back, ${user.full_name}!`,
            lastLogin: user.last_login_at
          },
          priority: 1
        }
      ],
      stats: {},
      quickActions: []
    };
  }

  private getDefaultPreferences(): UserPreferences {
    return {
      theme: 'system',
      notifications: {
        email: true,
        push: true,
        ticketAssigned: true,
        appointmentReminder: true,
        dailySummary: false
      },
      dashboard: {
        defaultView: 'grid',
        showStats: true,
        showActivity: true
      }
    };
  }

  async updateAvatar(userId: string, avatarUrl: string): Promise<void> {
    const supabase = await this.userRepo.getClient();
    const { error } = await supabase
      .from('users')
      .update({ avatar_url: avatarUrl })
      .eq('id', userId);

    if (error) {
      throw new Error(`Failed to update avatar: ${error.message}`);
    }
  }

  async getTeamMembers(managerId: string): Promise<any[]> {
    // Get all technicians for a manager
    const users = await this.userRepo.findByRole('technician');
    const teamStats = await Promise.all(
      users.map(async (user) => {
        const stats = await this.userRepo.getUserStatistics(user.id);
        return {
          ...user,
          statistics: stats
        };
      })
    );

    return teamStats;
  }

  async getUserPermissions(userId: string): Promise<string[]> {
    const user = await this.userRepo.findById(userId);
    if (!user) return [];

    const role = (user as any).role;
    
    // Define permissions based on role
    const permissions: Record<string, string[]> = {
      admin: [
        'users.manage',
        'tickets.manage',
        'appointments.manage',
        'reports.view',
        'settings.manage',
        'analytics.view',
        'backup.manage'
      ],
      manager: [
        'tickets.manage',
        'appointments.manage',
        'reports.view',
        'analytics.view',
        'team.manage'
      ],
      technician: [
        'tickets.view',
        'tickets.update',
        'appointments.view',
        'appointments.update',
        'notes.create'
      ]
    };

    return permissions[role] || [];
  }
}