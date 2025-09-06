"use client";

import { useState } from 'react';
import { useUserProfile, useRefreshStatistics } from '@/lib/hooks/use-user-profile';
import { PageContainer } from '@/components/layout/page-container';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ArrowLeft,
  RefreshCw,
  Mail,
  Phone,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Activity,
  FileText,
  Users,
  Settings,
  Award,
  Target,
  Zap,
  BarChart3
} from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { UserStatisticsCard } from '@/components/users/user-statistics-card';
import { UserActivityTimeline } from '@/components/users/user-activity-timeline';
import { UserPerformanceChart } from '@/components/users/user-performance-chart';

interface UserProfileClientProps {
  userId: string;
}

export function UserProfileClient({ userId }: UserProfileClientProps) {
  const { data: profile, isLoading, error } = useUserProfile(userId);
  const refreshStats = useRefreshStatistics(userId);
  const [activeTab, setActiveTab] = useState('overview');

  console.log('UserProfileClient - userId:', userId);
  console.log('UserProfileClient - profile:', profile);
  console.log('UserProfileClient - isLoading:', isLoading);
  console.log('UserProfileClient - error:', error);

  if (isLoading) {
    return (
      <PageContainer
        title="Loading Profile..."
        description="Please wait while we load the user profile"
      >
        <div className="space-y-6">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </PageContainer>
    );
  }

  if (!profile) {
    return (
      <PageContainer
        title="User Not Found"
        description="The requested user profile could not be found"
      >
        <Card>
          <CardContent className="py-8 text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">User profile not found</p>
            <Link href="/admin/users">
              <Button variant="outline" className="mt-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Users
              </Button>
            </Link>
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  const user = profile.user;
  const stats = profile.statistics;
  const metrics = profile.performanceMetrics;
  const workload = profile.workload;

  const headerActions = [
    {
      label: "Back to Users",
      icon: <ArrowLeft className="h-4 w-4" />,
      variant: "outline" as const,
      onClick: () => window.history.back(),
    },
    {
      label: refreshStats.isPending ? "Refreshing..." : "Refresh Stats",
      icon: <RefreshCw className={`h-4 w-4 ${refreshStats.isPending ? 'animate-spin' : ''}`} />,
      variant: "outline" as const,
      onClick: () => refreshStats.mutate(),
      disabled: refreshStats.isPending,
    },
    {
      label: "Edit Profile",
      icon: <Settings className="h-4 w-4" />,
      variant: "default" as const,
      onClick: () => {}, // TODO: Implement edit modal
    },
  ];

  return (
    <PageContainer
      title="User Profile"
      description={`View and manage ${user.full_name}'s profile and statistics`}
      actions={headerActions}
    >
      <div className="space-y-6">
        {/* User Header Card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={user.avatar_url} />
                  <AvatarFallback className="text-2xl">
                    {user.full_name?.charAt(0)?.toUpperCase() || user.email.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-2xl font-bold">{user.full_name || 'No Name'}</h2>
                  <p className="text-muted-foreground">{user.email}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className={getRoleColor(user.role)}>
                      {user.role?.charAt(0).toUpperCase() + (user.role?.slice(1) || '')}
                    </Badge>
                    {stats?.last_activity_at && (
                      <span className="text-sm text-muted-foreground">
                        Active {formatDistanceToNow(new Date(stats.last_activity_at), { addSuffix: true })}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Member since</p>
                <p className="font-medium">{new Date(user.created_at).toLocaleDateString()}</p>
                {user.last_login_at && (
                  <>
                    <p className="text-sm text-muted-foreground mt-2">Last login</p>
                    <p className="font-medium">
                      {formatDistanceToNow(new Date(user.last_login_at), { addSuffix: true })}
                    </p>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <UserStatisticsCard
            title="Tickets Completed"
            value={stats?.tickets_completed || 0}
            icon={<CheckCircle className="h-4 w-4" />}
            trend={calculateTrend(stats?.tickets_completed, metrics?.weekly?.ticketsCompleted)}
            description="Total completed"
          />
          <UserStatisticsCard
            title="In Progress"
            value={stats?.tickets_in_progress || 0}
            icon={<Clock className="h-4 w-4" />}
            className="text-blue-600"
            description="Currently working on"
          />
          <UserStatisticsCard
            title="Avg Completion Time"
            value={`${stats?.avg_completion_time_hours || 0}h`}
            icon={<Zap className="h-4 w-4" />}
            className="text-purple-600"
            description="Per ticket"
          />
          <UserStatisticsCard
            title="Productivity Score"
            value={calculateProductivityScore(stats)}
            icon={<Award className="h-4 w-4" />}
            className="text-green-600"
            description="Overall performance"
            showProgress={true}
          />
        </div>

        {/* Detailed Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Workload Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Current Workload</CardTitle>
                  <CardDescription>Task distribution</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Active Tasks</span>
                        <span className="text-sm text-muted-foreground">{workload?.current || 0}</span>
                      </div>
                      <Progress value={(workload?.current || 0) * 10} className="h-2" />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Pending Tasks</span>
                        <span className="text-sm text-muted-foreground">{workload?.pending || 0}</span>
                      </div>
                      <Progress value={(workload?.pending || 0) * 10} className="h-2 bg-yellow-100" />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Completed Tasks</span>
                        <span className="text-sm text-muted-foreground">{workload?.completed || 0}</span>
                      </div>
                      <Progress value={Math.min((workload?.completed || 0) * 2, 100)} className="h-2 bg-green-100" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Performance Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle>Performance Metrics</CardTitle>
                  <CardDescription>Last 30 days</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Tickets Completed</span>
                      </div>
                      <span className="font-bold">{metrics?.monthly?.ticketsCompleted || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Appointments Converted</span>
                      </div>
                      <span className="font-bold">{metrics?.monthly?.appointmentsConverted || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Notes Created</span>
                      </div>
                      <span className="font-bold">{stats?.notes_created || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Total Time Logged</span>
                      </div>
                      <span className="font-bold">
                        {Math.round((stats?.total_time_logged_minutes || 0) / 60)}h
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Additional Stats */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.conversion_rate || 0}%</div>
                  <p className="text-xs text-muted-foreground">Appointments to tickets</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Daily Average</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.daily_completion_avg || 0}</div>
                  <p className="text-xs text-muted-foreground">Tickets per day</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Efficiency Score</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{calculateEfficiency(stats)}%</div>
                  <p className="text-xs text-muted-foreground">Based on completion rate</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="activity">
            <UserActivityTimeline userId={userId} />
          </TabsContent>

          <TabsContent value="performance">
            <UserPerformanceChart userId={userId} />
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>User Settings</CardTitle>
                <CardDescription>Manage user preferences and permissions</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Settings panel coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PageContainer>
  );
}

function getRoleColor(role?: string) {
  switch (role) {
    case 'admin': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
    case 'manager': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
    case 'technician': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
  }
}

function calculateTrend(current: number, previous: number): number {
  if (!previous) return 0;
  return ((current - previous) / previous) * 100;
}

function calculateProductivityScore(stats: any): number {
  if (!stats) return 0;
  const completionRate = stats.tickets_assigned ? (stats.tickets_completed / stats.tickets_assigned) * 100 : 0;
  const efficiencyBonus = stats.avg_completion_time_hours && stats.avg_completion_time_hours < 24 ? 10 : 0;
  return Math.min(100, Math.round(completionRate + efficiencyBonus));
}

function calculateEfficiency(stats: any): number {
  if (!stats || !stats.tickets_assigned) return 0;
  return Math.round((stats.tickets_completed / stats.tickets_assigned) * 100);
}