"use client";

import { useState, useEffect } from 'react';
import { useUserProfile, useRefreshStatistics } from '@/lib/hooks/use-user-profile';
import { PageContainer } from '@/components/layout/page-container';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
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
  BarChart3,
  User,
  Briefcase,
  CalendarDays,
  DollarSign,
  Timer,
  Wrench
} from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { UserStatisticsCard } from '@/components/users/user-statistics-card';
import { UserActivityTimeline } from '@/components/users/user-activity-timeline';
import { UserPerformanceChart } from '@/components/users/user-performance-chart';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface ProfileClientProps {
  userId: string;
  isOwnProfile?: boolean;
  initialData?: any;
}

export function ProfileClient({ userId, isOwnProfile = false, initialData }: ProfileClientProps) {
  const { data: profile = initialData, isLoading, error } = useUserProfile(userId, initialData);
  const refreshStats = useRefreshStatistics(userId);
  const [activeTab, setActiveTab] = useState('overview');
  const [userRole, setUserRole] = useState<string>('');

  // Get current user's role for role-based UI
  useEffect(() => {
    async function getUserRole() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: userData } = await supabase
          .from('users')
          .select('role')
          .eq('email', user.email)
          .single();
        setUserRole(userData?.role || '');
      }
    }
    getUserRole();
  }, []);

  const handleRefreshStats = async () => {
    try {
      await refreshStats.mutateAsync();
      toast.success('Statistics refreshed successfully');
    } catch (error) {
      toast.error('Failed to refresh statistics');
    }
  };

  // Since we have initial data, we should never hit this case
  if (!profile) {
    return (
      <PageContainer
        title="Profile Not Found"
        description="Your profile could not be loaded"
      >
        <Card>
          <CardContent className="py-8 text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Profile not found</p>
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
      label: refreshStats.isPending ? "Refreshing..." : "Refresh Stats",
      icon: <RefreshCw className={`h-4 w-4 ${refreshStats.isPending ? 'animate-spin' : ''}`} />,
      variant: "outline" as const,
      onClick: handleRefreshStats,
      disabled: refreshStats.isPending,
    },
  ];

  // Add admin actions if user is admin
  if (userRole === 'admin' && !isOwnProfile) {
    headerActions.push({
      label: "Manage Users",
      href: "/admin/users",
      icon: <Users className="h-4 w-4" />,
      variant: "default" as const,
    });
  }

  const formatTime = (value: number, isHours: boolean = false) => {
    if (!value || value === 0) return '0h 0m';
    // If value is already in hours, convert to minutes first
    const totalMinutes = isHours ? Math.round(value * 60) : value;
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    return `${hours}h ${mins}m`;
  };

  const calculateProductivityScore = () => {
    if (!stats) return 0;
    const completed = stats.tickets_completed || 0;
    const total = (stats.tickets_created || 0) + (stats.tickets_assigned || 0);
    if (total === 0) return 0;
    return Math.round((completed / total) * 100);
  };

  const productivityScore = calculateProductivityScore();
  const productivityTrend = productivityScore >= 70 ? 'up' : productivityScore >= 40 ? 'stable' : 'down';

  return (
    <PageContainer
      title={isOwnProfile ? "My Profile" : `${user.full_name || user.email}'s Profile`}
      description={isOwnProfile ? "View your performance metrics and activity" : "View user performance metrics and activity"}
      actions={headerActions}
    >
      <div className="space-y-6">
        {/* User Header Card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={user.avatar_url || ''} alt={user.full_name || ''} />
                  <AvatarFallback className="text-2xl">
                    {user.full_name?.split(' ').map(n => n[0]).join('') || user.email?.[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-2xl font-bold">{user.full_name || 'Unnamed User'}</h2>
                  <p className="text-muted-foreground flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    {user.email}
                  </p>
                  <div className="flex items-center gap-4 mt-2">
                    <Badge variant={user.role === 'admin' ? 'destructive' : user.role === 'manager' ? 'default' : 'secondary'}>
                      {user.role}
                    </Badge>
                    {user.last_login_at && (
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Last active {formatDistanceToNow(new Date(user.last_login_at), { addSuffix: true })}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold flex items-center gap-2">
                  {productivityScore}%
                  {productivityTrend === 'up' && <TrendingUp className="h-6 w-6 text-green-500" />}
                  {productivityTrend === 'down' && <TrendingDown className="h-6 w-6 text-red-500" />}
                  {productivityTrend === 'stable' && <Activity className="h-6 w-6 text-yellow-500" />}
                </div>
                <p className="text-sm text-muted-foreground">Productivity Score</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statistics Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tickets Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.tickets_completed || 0}</div>
              <p className="text-xs text-muted-foreground">
                All-time completions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Completion Time</CardTitle>
              <Timer className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatTime(stats?.avg_completion_time_hours || 0, true)}</div>
              <p className="text-xs text-muted-foreground">
                Per ticket average
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Current Workload</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.tickets_in_progress || 0}</div>
              <p className="text-xs text-muted-foreground">
                Active tickets
              </p>
              <Progress value={(stats?.tickets_in_progress || 0) * 10} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats?.appointments_converted && stats?.appointments_assigned 
                  ? Math.round((stats.appointments_converted / stats.appointments_assigned) * 100)
                  : 0}%
              </div>
              <p className="text-xs text-muted-foreground">
                Appointments to tickets
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for different views */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* All-Time Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    All-Time Statistics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Tickets Created</span>
                    <span className="font-medium">{stats?.tickets_created || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Tickets Assigned</span>
                    <span className="font-medium">{stats?.tickets_assigned || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Tickets Completed</span>
                    <span className="font-medium">{stats?.tickets_completed || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Total Time Logged</span>
                    <span className="font-medium">{formatTime(stats?.total_time_logged || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Notes Written</span>
                    <span className="font-medium">{stats?.notes_created || 0}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Current Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Current Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">In Progress</span>
                    <Badge variant="default">{stats?.tickets_in_progress || 0}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">On Hold</span>
                    <Badge variant="secondary">{stats?.tickets_on_hold || 0}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Cancelled</span>
                    <Badge variant="outline">{stats?.tickets_cancelled || 0}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Daily Average</span>
                    <span className="font-medium">
                      {stats?.tickets_completed && user.created_at
                        ? (stats.tickets_completed / Math.max(1, Math.floor((Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24)))).toFixed(1)
                        : '0'} tickets/day
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="activity" className="space-y-4">
            <UserActivityTimeline userId={userId} />
          </TabsContent>

          <TabsContent value="performance" className="space-y-4">
            <UserPerformanceChart userId={userId} />
          </TabsContent>
        </Tabs>

        {/* Role-specific features */}
        {userRole === 'manager' && isOwnProfile && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Team Overview
              </CardTitle>
              <CardDescription>Quick access to team management</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Link href="/team">
                  <Button variant="outline">View Team Performance</Button>
                </Link>
                <Link href="/reports">
                  <Button variant="outline">Generate Reports</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {userRole === 'admin' && isOwnProfile && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Admin Quick Actions
              </CardTitle>
              <CardDescription>Administrative functions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 flex-wrap">
                <Link href="/admin/users">
                  <Button variant="outline">Manage Users</Button>
                </Link>
                <Link href="/admin/devices">
                  <Button variant="outline">Manage Devices</Button>
                </Link>
                <Link href="/admin/services">
                  <Button variant="outline">Manage Services</Button>
                </Link>
                <Link href="/reports">
                  <Button variant="outline">System Reports</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </PageContainer>
  );
}