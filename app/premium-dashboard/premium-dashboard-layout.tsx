"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { ModernPageLayout } from "@/components/premium/layout/modern-page-layout";
import { DashboardGrid } from '@/components/premium/connected';
import { ConnectedMetricCard } from '@/components/premium/connected';
import { ConnectedStatCard } from '@/components/premium/connected';
import { ConnectedTicketsTable } from '@/components/premium/connected/connected-tickets-table';
import { ConnectedAppointmentsTable } from '@/components/premium/connected/connected-appointments-table';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRecentTickets, useTodaysAppointments } from "@/lib/hooks/use-dashboard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { 
  TicketTrendChart,
  ServiceDistributionChart,
  TechnicianPerformanceChart,
  HourlyActivityChart,
  RepairTimeDistribution,
  CHART_COLORS
} from '@/components/premium/charts';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Calendar, 
  Clock, 
  Plus, 
  Settings,
  TrendingUp,
  Users,
  Wrench,
  DollarSign,
  Package,
  AlertCircle,
  CheckCircle,
  Star,
  ArrowRight,
  Timer,
  BarChart3,
  Pause,
  Smartphone
} from "lucide-react";
import Link from "next/link";

interface PremiumDashboardLayoutProps {
  user: any;
  userName: string;
  userRole: string;
  variant?: "overview" | "analytics" | "executive" | "technician";
}

export function PremiumDashboardLayout({ 
  user, 
  userName,
  userRole,
  variant: initialVariant = "overview" 
}: PremiumDashboardLayoutProps) {
  const [variant, setVariant] = useState<"overview" | "analytics" | "executive" | "technician">(initialVariant);
  const { data: recentTickets, isLoading: ticketsLoading } = useRecentTickets();
  const { data: todaysAppointments, isLoading: appointmentsLoading } = useTodaysAppointments();
  
  // Dynamic greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  // Role-based actions for the header
  const getHeaderActions = () => {
    const actions = [];
    
    // Admin-only dashboard switcher (rendered as custom element)
    if (userRole?.toLowerCase() === "admin") {
      actions.push({
        label: "custom",
        customElement: (
          <Select key="variant-switcher" value={variant} onValueChange={(value: any) => setVariant(value)}>
            <SelectTrigger className="w-[140px] h-9">
              <SelectValue placeholder="Select view" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="overview">Overview</SelectItem>
              <SelectItem value="analytics">Analytics</SelectItem>
              <SelectItem value="executive">Executive</SelectItem>
              <SelectItem value="technician">Technician</SelectItem>
            </SelectContent>
          </Select>
        )
      });
    }
    
    // New Ticket button for everyone
    actions.push({
      label: "New Ticket",
      icon: <Plus className="h-4 w-4" />,
      variant: "gradient" as const,
      color: "cyan" as const,
      onClick: () => window.location.href = '/orders/new'
    });

    // Additional admin/manager actions
    if (userRole?.toLowerCase() === "admin" || userRole?.toLowerCase() === "manager") {
      actions.push({
        label: "Settings",
        icon: <Settings className="h-4 w-4" />,
        variant: "outline" as const,
        onClick: () => window.location.href = '/admin'
      });
    } else {
      // Regular users get My Tickets
      actions.push({
        label: "My Tickets",
        icon: <Wrench className="h-4 w-4" />,
        variant: "outline" as const,
        onClick: () => window.location.href = '/orders'
      });
    }

    return actions;
  };

  // Render main dashboard content based on variant
  const renderDashboardContent = () => {
    switch (variant) {
      case "analytics":
        // Generate week data from actual tickets
        const getAnalyticsWeekData = () => {
          const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
          const data = [];
          
          for (let i = 0; i < 7; i++) {
            const dayTickets = recentTickets?.filter((t: any) => {
              const ticketDate = new Date(t.created_at);
              const dayDiff = Math.floor((Date.now() - ticketDate.getTime()) / (1000 * 60 * 60 * 24));
              return dayDiff === (6 - i);
            }) || [];
            
            data.push({
              day: days[i],
              completed: dayTickets.filter((t: any) => t.status === 'completed').length,
              in_progress: dayTickets.filter((t: any) => t.status === 'in_progress').length,
              pending: dayTickets.filter((t: any) => t.status === 'pending').length,
              new: dayTickets.filter((t: any) => t.status === 'new' || t.status === 'created').length
            });
          }
          return data;
        };
        
        const analyticsWeekData = getAnalyticsWeekData();

        // Generate hourly data from actual tickets and appointments
        const getHourlyData = () => {
          const hours = ['9AM', '10AM', '11AM', '12PM', '1PM', '2PM', '3PM', '4PM', '5PM'];
          return hours.map(hour => {
            const hourNum = parseInt(hour) + (hour.includes('PM') && hour !== '12PM' ? 12 : 0);
            const ticketsAtHour = recentTickets?.filter((t: any) => {
              const ticketHour = new Date(t.created_at).getHours();
              return ticketHour === hourNum;
            }).length || 0;
            
            const appointmentsAtHour = todaysAppointments?.filter((a: any) => {
              if (!a.scheduled_time) return false;
              const appointmentHour = parseInt(a.scheduled_time.split(':')[0]);
              return appointmentHour === hourNum;
            }).length || 0;
            
            return { hour, tickets: ticketsAtHour, appointments: appointmentsAtHour };
          });
        };
        
        const hourlyData = getHourlyData();

        // Calculate technician performance from actual data
        const technicianData = [
          { name: 'All Tech', completed: recentTickets?.filter((t: any) => t.status === 'completed').length || 0, avgTime: 45 }
        ];

        return (
          <div className="space-y-6">
            {/* Primary Metrics */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              <ConnectedMetricCard
                metric="orders"
                icon={Package}
                priority="high"
                variant="solid"
                color="cyan"
              />
              <ConnectedMetricCard
                metric="pending"
                icon={AlertCircle}
                priority="medium"
                variant="gradient"
                color="amber"
              />
              <ConnectedMetricCard
                metric="completed_today"
                icon={CheckCircle}
                priority="medium"
                variant="default"
                color="green"
              />
              <ConnectedStatCard
                metric="repair_time"
                icon={Clock}
                variant="elevated"
                color="purple"
              />
              <Card variant="outlined" className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Appointments</p>
                    <p className="text-2xl font-bold">{todaysAppointments?.length || 0}</p>
                    <p className="text-xs text-muted-foreground mt-1">today</p>
                  </div>
                  <Calendar className="h-5 w-5 text-primary/60" />
                </div>
              </Card>
            </div>

            {/* Charts Row 1 */}
            <div className="grid gap-4 md:grid-cols-2">
              <Card variant="elevated" className="p-6">
                <CardHeader className="p-0 pb-4">
                  <CardTitle className="text-base">Weekly Ticket Trend</CardTitle>
                </CardHeader>
                <TicketTrendChart data={analyticsWeekData} height={200} />
              </Card>
              <Card variant="elevated" className="p-6">
                <CardHeader className="p-0 pb-4">
                  <CardTitle className="text-base">Hourly Activity</CardTitle>
                </CardHeader>
                <HourlyActivityChart data={hourlyData} height={200} />
              </Card>
            </div>

            {/* Charts Row 2 */}
            <div className="grid gap-4 md:grid-cols-3">
              <TechnicianPerformanceChart data={technicianData} height={200} />
              <ServiceDistributionChart 
                data={(() => {
                  const services: Record<string, number> = {};
                  recentTickets?.forEach((t: any) => {
                    // Check repair_issues array first
                    if (t.repair_issues && Array.isArray(t.repair_issues)) {
                      t.repair_issues.forEach((issue: string) => {
                        const issueLower = issue.toLowerCase();
                        if (issueLower.includes('screen') || issueLower.includes('display') || issueLower.includes('glass') || issueLower.includes('lcd')) {
                          services['Screen'] = (services['Screen'] || 0) + 1;
                        } else if (issueLower.includes('battery') || issueLower.includes('charging') || issueLower.includes('power')) {
                          services['Battery'] = (services['Battery'] || 0) + 1;
                        } else if (issueLower.includes('water') || issueLower.includes('liquid') || issueLower.includes('wet')) {
                          services['Water Damage'] = (services['Water Damage'] || 0) + 1;
                        } else if (issueLower.includes('button') || issueLower.includes('home') || issueLower.includes('volume')) {
                          services['Buttons'] = (services['Buttons'] || 0) + 1;
                        } else if (issueLower.includes('camera') || issueLower.includes('lens')) {
                          services['Camera'] = (services['Camera'] || 0) + 1;
                        } else if (issueLower.includes('speaker') || issueLower.includes('audio') || issueLower.includes('microphone')) {
                          services['Audio'] = (services['Audio'] || 0) + 1;
                        } else {
                          services['Other'] = (services['Other'] || 0) + 1;
                        }
                      });
                    } else {
                      // Fallback to checking description if no repair_issues
                      const desc = (t.description || '').toLowerCase();
                      if (desc.includes('screen') || desc.includes('display')) {
                        services['Screen'] = (services['Screen'] || 0) + 1;
                      } else if (desc.includes('battery')) {
                        services['Battery'] = (services['Battery'] || 0) + 1;
                      } else if (desc.includes('water')) {
                        services['Water Damage'] = (services['Water Damage'] || 0) + 1;
                      } else {
                        services['Other'] = (services['Other'] || 0) + 1;
                      }
                    }
                  });
                  
                  // Only return categories that have values
                  return Object.entries(services)
                    .filter(([_, value]) => value > 0)
                    .map(([name, value]) => ({ name, value }));
                })()}
                height={200}
              />
              <RepairTimeDistribution
                data={(() => {
                  const ranges = {
                    '< 30min': 0,
                    '30-60min': 0,
                    '1-2hr': 0,
                    '> 2hr': 0
                  };
                  
                  recentTickets?.forEach((t: any) => {
                    const minutes = t.total_time_minutes || 0;
                    if (minutes < 30) ranges['< 30min']++;
                    else if (minutes <= 60) ranges['30-60min']++;
                    else if (minutes <= 120) ranges['1-2hr']++;
                    else ranges['> 2hr']++;
                  });
                  
                  return [
                    { range: '< 30min', count: ranges['< 30min'], fill: CHART_COLORS.green },
                    { range: '30-60min', count: ranges['30-60min'], fill: CHART_COLORS.cyan },
                    { range: '1-2hr', count: ranges['1-2hr'], fill: CHART_COLORS.amber },
                    { range: '> 2hr', count: ranges['> 2hr'], fill: CHART_COLORS.red },
                  ];
                })()}
                height={200}
              />
            </div>

            {/* Tickets Table */}
            <ConnectedTicketsTable
              title="Recent Tickets"
              variant="elevated"
              showFilters={true}
              limit={10}
              showViewAll={true}
              className="shadow-sm"
            />

            {/* Appointments Table */}
            <ConnectedAppointmentsTable
              title="Today's Appointments"
              variant="elevated"
              showFilters={true}
              limit={8}
              showViewAll={true}
              className="shadow-sm"
            />

            {/* Performance Cards */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card variant="glass" className="p-4">
                <h3 className="text-sm font-semibold mb-3">Today's Snapshot</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">New Tickets</span>
                    <Badge variant="soft" size="sm">{recentTickets?.filter((t: any) => {
                      const today = new Date().toDateString();
                      return new Date(t.created_at).toDateString() === today;
                    }).length || 0}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Completed</span>
                    <Badge variant="soft" size="sm" color="green">
                      {recentTickets?.filter((t: any) => t.status === 'completed').length || 0}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">In Progress</span>
                    <Badge variant="soft" size="sm" color="cyan">
                      {recentTickets?.filter((t: any) => t.status === 'in_progress').length || 0}
                    </Badge>
                  </div>
                </div>
              </Card>

              <Card variant="glass" className="p-4">
                <h3 className="text-sm font-semibold mb-3">Efficiency Metrics</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Completion Rate</span>
                    <span className="text-sm font-medium">
                      {recentTickets?.length > 0 
                        ? Math.round((recentTickets.filter((t: any) => t.status === 'completed').length / recentTickets.length) * 100)
                        : 0}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Active Tickets</span>
                    <span className="text-sm font-medium">
                      {recentTickets?.filter((t: any) => t.status === 'in_progress').length || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Avg Time</span>
                    <span className="text-sm font-medium">
                      {recentTickets?.length > 0
                        ? Math.round(recentTickets.reduce((acc: number, t: any) => acc + (t.total_time_minutes || 0), 0) / recentTickets.length)
                        : 0}m
                    </span>
                  </div>
                </div>
              </Card>

              <Card variant="glass" className="p-4">
                <h3 className="text-sm font-semibold mb-3">Appointment Metrics</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Scheduled</span>
                    <Badge variant="soft" size="sm">{todaysAppointments?.length || 0}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Confirmed</span>
                    <Badge variant="soft" size="sm">
                      {todaysAppointments?.filter((a: any) => a.status === 'confirmed').length || 0}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Cancelled</span>
                    <Badge variant="soft" size="sm" color="red">
                      {todaysAppointments?.filter((a: any) => a.status === 'cancelled').length || 0}
                    </Badge>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        );

      case "executive":
        // Generate week data from actual tickets
        const getWeekData = () => {
          const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
          const today = new Date().getDay();
          const data = [];
          
          for (let i = 0; i < 7; i++) {
            const dayTickets = recentTickets?.filter((t: any) => {
              const ticketDate = new Date(t.created_at);
              const dayDiff = Math.floor((Date.now() - ticketDate.getTime()) / (1000 * 60 * 60 * 24));
              return dayDiff === (6 - i);
            }) || [];
            
            data.push({
              day: days[i],
              completed: dayTickets.filter((t: any) => t.status === 'completed').length,
              in_progress: dayTickets.filter((t: any) => t.status === 'in_progress').length,
              pending: dayTickets.filter((t: any) => t.status === 'pending').length,
              new: dayTickets.filter((t: any) => t.status === 'new' || t.status === 'created').length
            });
          }
          return data;
        };
        
        const weekData = getWeekData();

        return (
          <div className="space-y-6">
            {/* Key Business Metrics - Focused on Operations */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card variant="solid" color="cyan" className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-white/80">Total Tickets</p>
                    <p className="text-3xl font-bold text-white">
                      {recentTickets?.length || 0}
                    </p>
                    <p className="text-xs text-white/60 mt-1">this month</p>
                  </div>
                  <Package className="h-6 w-6 text-white/60" />
                </div>
              </Card>

              <Card variant="gradient" className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Appointments</p>
                    <p className="text-3xl font-bold">
                      {todaysAppointments?.length || 0}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">scheduled today</p>
                  </div>
                  <Calendar className="h-6 w-6 text-primary/60" />
                </div>
              </Card>

              <ConnectedStatCard
                metric="repair_time"
                variant="elevated"
                color="purple"
                title="Avg Repair Time"
              />

              <Card variant="outlined" className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Completion Rate</p>
                    <p className="text-3xl font-bold">
                      {recentTickets?.length > 0 
                        ? Math.round((recentTickets.filter((t: any) => t.status === 'completed').length / recentTickets.length) * 100)
                        : 0}%
                    </p>
                    <p className="text-xs text-green-600 mt-1">this month</p>
                  </div>
                  <CheckCircle className="h-6 w-6 text-green-500/60" />
                </div>
              </Card>
            </div>

            {/* Charts Section */}
            <div className="grid gap-4 md:grid-cols-2">
              <Card variant="elevated" className="p-6">
                <CardHeader className="p-0 pb-4">
                  <CardTitle className="text-base">Weekly Ticket Trend</CardTitle>
                </CardHeader>
                <TicketTrendChart data={weekData} height={200} />
              </Card>
              <ServiceDistributionChart 
                data={(() => {
                  const services: Record<string, number> = {};
                  recentTickets?.forEach((t: any) => {
                    // Check repair_issues array first
                    if (t.repair_issues && Array.isArray(t.repair_issues)) {
                      t.repair_issues.forEach((issue: string) => {
                        const issueLower = issue.toLowerCase();
                        if (issueLower.includes('screen') || issueLower.includes('display') || issueLower.includes('glass') || issueLower.includes('lcd')) {
                          services['Screen'] = (services['Screen'] || 0) + 1;
                        } else if (issueLower.includes('battery') || issueLower.includes('charging') || issueLower.includes('power')) {
                          services['Battery'] = (services['Battery'] || 0) + 1;
                        } else if (issueLower.includes('water') || issueLower.includes('liquid') || issueLower.includes('wet')) {
                          services['Water Damage'] = (services['Water Damage'] || 0) + 1;
                        } else if (issueLower.includes('button') || issueLower.includes('home') || issueLower.includes('volume')) {
                          services['Buttons'] = (services['Buttons'] || 0) + 1;
                        } else if (issueLower.includes('camera') || issueLower.includes('lens')) {
                          services['Camera'] = (services['Camera'] || 0) + 1;
                        } else if (issueLower.includes('speaker') || issueLower.includes('audio') || issueLower.includes('microphone')) {
                          services['Audio'] = (services['Audio'] || 0) + 1;
                        } else {
                          services['Other'] = (services['Other'] || 0) + 1;
                        }
                      });
                    } else {
                      // Fallback to checking description if no repair_issues
                      const desc = (t.description || '').toLowerCase();
                      if (desc.includes('screen') || desc.includes('display')) {
                        services['Screen'] = (services['Screen'] || 0) + 1;
                      } else if (desc.includes('battery')) {
                        services['Battery'] = (services['Battery'] || 0) + 1;
                      } else if (desc.includes('water')) {
                        services['Water Damage'] = (services['Water Damage'] || 0) + 1;
                      } else {
                        services['Other'] = (services['Other'] || 0) + 1;
                      }
                    }
                  });
                  
                  // Only return categories that have values
                  return Object.entries(services)
                    .filter(([_, value]) => value > 0)
                    .map(([name, value]) => ({ name, value }));
                })()}
                height={250}
              />
            </div>

            {/* Tables Section */}
            <ConnectedTicketsTable
              title="Recent Tickets"
              variant="elevated"
              showFilters={false}
              limit={8}
              showViewAll={true}
              className="shadow-sm"
            />

            <ConnectedAppointmentsTable
              title="Today's Appointments"
              variant="gradient"
              showFilters={false}
              limit={5}
              showViewAll={true}
              className="shadow-sm"
            />

            {/* Operational Insights */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card variant="glass" className="p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Peak Hours Today
                </h3>
                <div className="space-y-2">
                  {/* Real peak hours from ticket data */}
                  {(() => {
                    const hourCounts: Record<string, number> = {};
                    recentTickets?.forEach((t: any) => {
                      const hour = new Date(t.created_at).getHours();
                      const timeSlot = `${hour}-${hour + 1} ${hour < 12 ? 'AM' : 'PM'}`;
                      hourCounts[timeSlot] = (hourCounts[timeSlot] || 0) + 1;
                    });
                    
                    const sorted = Object.entries(hourCounts)
                      .sort(([, a], [, b]) => b - a)
                      .slice(0, 3);
                    
                    return sorted.length > 0 ? sorted.map(([time, count], idx) => (
                      <div key={time} className="flex justify-between items-center">
                        <span className="text-sm">{time}</span>
                        <Badge variant="soft" size="sm" color={idx === 0 ? 'red' : idx === 1 ? 'amber' : 'green'}>
                          {count} tickets
                        </Badge>
                      </div>
                    )) : (
                      <p className="text-sm text-muted-foreground">No data yet</p>
                    );
                  })()}
                </div>
              </Card>

              <Card variant="glass" className="p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Staff Utilization
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Total Tickets</span>
                    <Badge variant="soft" size="sm" color="green">{recentTickets?.length || 0}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">In Progress</span>
                    <Badge variant="soft" size="sm" color="cyan">
                      {recentTickets?.filter((t: any) => t.status === 'in_progress').length || 0}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Pending</span>
                    <Badge variant="soft" size="sm" color="amber">
                      {recentTickets?.filter((t: any) => t.status === 'pending').length || 0}
                    </Badge>
                  </div>
                </div>
              </Card>

              <Card variant="glass" className="p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Needs Attention
                </h3>
                <div className="space-y-2">
                  {recentTickets?.filter((t: any) => t.status === 'pending').length > 3 && (
                    <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded">
                      <p className="text-xs font-medium">
                        {recentTickets?.filter((t: any) => t.status === 'pending').length} pending tickets
                      </p>
                    </div>
                  )}
                  {todaysAppointments?.length === 0 && (
                    <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                      <p className="text-xs font-medium">No appointments today</p>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </div>
        );

      case "technician":
        // Calculate today's tickets
        const todayTickets = recentTickets?.filter((t: any) => {
          const today = new Date().toDateString();
          return new Date(t.created_at).toDateString() === today;
        }) || [];
        
        const completedToday = todayTickets.filter((t: any) => t.status === 'completed').length;
        const inProgressNow = recentTickets?.filter((t: any) => t.status === 'in_progress').length || 0;
        const pendingNow = recentTickets?.filter((t: any) => t.status === 'pending').length || 0;
        
        // Calculate average time
        const completedTickets = recentTickets?.filter((t: any) => t.status === 'completed' && t.total_time_minutes > 0) || [];
        const avgTime = completedTickets.length > 0
          ? Math.round(completedTickets.reduce((acc: number, t: any) => acc + t.total_time_minutes, 0) / completedTickets.length)
          : 0;
        
        // Find any running timer
        const runningTimer = recentTickets?.find((t: any) => t.timer_running);
        
        return (
          <div className="space-y-6">
            {/* My Daily Performance */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              <Card variant="solid" color="green" className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-white/80">Completed</p>
                    <p className="text-3xl font-bold text-white">{completedToday}</p>
                    <p className="text-xs text-white/60 mt-1">repairs today</p>
                  </div>
                  <CheckCircle className="h-5 w-5 text-white/60" />
                </div>
              </Card>
              
              <Card variant="gradient" className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">In Progress</p>
                    <p className="text-3xl font-bold">{inProgressNow}</p>
                    <p className="text-xs text-muted-foreground mt-1">active now</p>
                  </div>
                  <Wrench className="h-5 w-5 text-primary" />
                </div>
              </Card>

              <Card variant="elevated" className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Queue</p>
                    <p className="text-3xl font-bold">{pendingNow}</p>
                    <p className="text-xs text-muted-foreground mt-1">waiting</p>
                  </div>
                  <AlertCircle className="h-5 w-5 text-amber-500" />
                </div>
              </Card>

              <Card variant="outlined" className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Avg Time</p>
                    <p className="text-3xl font-bold">{avgTime}m</p>
                    <p className="text-xs text-muted-foreground mt-1">average</p>
                  </div>
                  <Clock className="h-5 w-5 text-purple-500" />
                </div>
              </Card>

              <Card variant="glass" className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Timer</p>
                    {runningTimer ? (
                      <>
                        <p className="text-2xl font-bold text-green-600">Active</p>
                        <p className="text-xs text-muted-foreground mt-1">#{runningTimer.ticket_number}</p>
                      </>
                    ) : (
                      <>
                        <p className="text-2xl font-bold text-muted-foreground">--:--</p>
                        <p className="text-xs text-muted-foreground mt-1">No timer</p>
                      </>
                    )}
                  </div>
                  <Timer className={cn("h-5 w-5", runningTimer ? "text-green-500 animate-pulse" : "text-muted-foreground")} />
                </div>
              </Card>
            </div>

            {/* My Tickets Table */}
            <ConnectedTicketsTable
              title="My Active Tickets"
              variant="elevated"
              showFilters={true}
              currentUserId={user?.id}
              currentUserRole={userRole}
              limit={10}
              showViewAll={true}
            />

            {/* Today's Schedule */}
            <div className="grid gap-4 md:grid-cols-2">
              <Card variant="gradient">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Today's Appointments
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {todaysAppointments?.length > 0 ? (
                      todaysAppointments.slice(0, 3).map((apt: any) => (
                        <div key={apt.id} className="p-2 bg-background/60 rounded">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium">{apt.customer_name}</p>
                              <p className="text-xs text-muted-foreground">{apt.service_type}</p>
                            </div>
                            <Badge variant="soft" size="sm">{apt.time}</Badge>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground py-4 text-center">No appointments today</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card variant="outlined">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Quick Stats
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Week Total</span>
                      <Badge variant="soft" color="green">
                        {recentTickets?.filter((t: any) => {
                          const ticketDate = new Date(t.created_at);
                          const weekAgo = new Date();
                          weekAgo.setDate(weekAgo.getDate() - 7);
                          return ticketDate >= weekAgo && t.status === 'completed';
                        }).length || 0} repairs
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Pending</span>
                      <Badge variant="soft" color="amber">{pendingNow}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Completion Rate</span>
                      <Badge variant="soft" color="purple">
                        {recentTickets?.length > 0 
                          ? Math.round((recentTickets.filter((t: any) => t.status === 'completed').length / recentTickets.length) * 100)
                          : 0}%
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      default: // overview - Admin view with everything
        return (
          <div className="space-y-6">
            {/* Primary Metrics Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <ConnectedMetricCard
                metric="revenue"
                icon={DollarSign}
                priority="high"
                variant="solid"
                color="green"
              />
              <ConnectedMetricCard
                metric="orders"
                icon={Package}
                priority="high"
                variant="gradient"
                color="cyan"
              />
              <ConnectedMetricCard
                metric="pending"
                icon={AlertCircle}
                priority="medium"
                variant="default"
                color="amber"
              />
              <ConnectedMetricCard
                metric="completed_today"
                icon={CheckCircle}
                priority="medium"
                variant="outlined"
                color="green"
              />
            </div>

            {/* Full Tickets Table */}
            <ConnectedTicketsTable
              title="Recent Tickets"
              variant="elevated"
              showFilters={true}
              currentUserId={user?.id}
              currentUserRole={userRole}
              limit={10}
              showViewAll={true}
            />

            {/* Appointments Table */}
            <ConnectedAppointmentsTable
              title="Today's Appointments"
              variant="gradient"
              showFilters={true}
              limit={8}
              showViewAll={true}
            />

            {/* Activity Overview */}
            <div className="grid gap-4 md:grid-cols-2">

              {/* Ticket Status Summary */}
              <Card variant="outlined">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Ticket Status</CardTitle>
                    <Badge variant="soft" size="sm" color="green">{recentTickets?.length || 0} total</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 rounded hover:bg-muted/50">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-green-500" />
                        <span className="text-sm">Completed</span>
                      </div>
                      <Badge variant="soft" size="sm" color="green">
                        {recentTickets?.filter((t: any) => t.status === 'completed').length || 0}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded hover:bg-muted/50">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-purple-500" />
                        <span className="text-sm">In Progress</span>
                      </div>
                      <Badge variant="soft" size="sm" color="purple">
                        {recentTickets?.filter((t: any) => t.status === 'in_progress').length || 0}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded hover:bg-muted/50">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-amber-500" />
                        <span className="text-sm">Pending</span>
                      </div>
                      <Badge variant="soft" size="sm" color="amber">
                        {recentTickets?.filter((t: any) => t.status === 'pending').length || 0}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded hover:bg-muted/50">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-cyan-500" />
                        <span className="text-sm">New</span>
                      </div>
                      <Badge variant="soft" size="sm" color="cyan">
                        {recentTickets?.filter((t: any) => t.status === 'new' || t.status === 'created').length || 0}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Secondary Stats */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <ConnectedStatCard
                metric="repair_time"
                icon={Clock}
                variant="split"
                color="purple"
              />
              <ConnectedStatCard
                metric="average_value"
                icon={TrendingUp}
                variant="background-number"
                color="cyan"
              />
              <Card variant="glass" className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <Users className="h-4 w-4 text-primary" />
                  <Badge variant="soft" size="sm">Total</Badge>
                </div>
                <p className="text-2xl font-bold">{recentTickets?.length || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">Total tickets</p>
              </Card>
              <Card variant="glass" className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <Star className="h-4 w-4 text-amber-500" />
                  <Badge variant="soft" size="sm" color="amber">Rate</Badge>
                </div>
                <p className="text-2xl font-bold">
                  {recentTickets?.length > 0 
                    ? Math.round((recentTickets.filter((t: any) => t.status === 'completed').length / recentTickets.length) * 100)
                    : 0}%
                </p>
                <p className="text-xs text-muted-foreground mt-1">Completion rate</p>
              </Card>
            </div>
          </div>
        );
    }
  };

  // Sidebar content for overview variant
  const renderSidebarContent = () => {
    if (variant !== "overview") return undefined;

    return (
      <div className="space-y-6">
        {/* Recent Tickets */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Wrench className="h-4 w-4" />
                Recent Tickets
              </CardTitle>
              <Link href="/orders">
                <Button variant="ghost" size="sm">
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {ticketsLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </div>
                ))}
              </div>
            ) : recentTickets?.length > 0 ? (
              <div className="space-y-3">
                {recentTickets.slice(0, 5).map((ticket: any) => (
                  <Link key={ticket.id} href={`/orders/${ticket.id}`}>
                    <div className="p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">
                            #{ticket.ticket_number}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {ticket.customer_name}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {ticket.device_info}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <Badge 
                            variant="soft" 
                            size="sm"
                            color={
                              ticket.status === 'completed' ? 'green' :
                              ticket.status === 'in_progress' ? 'cyan' :
                              ticket.status === 'pending' ? 'amber' : 'gray'
                            }
                          >
                            {ticket.status}
                          </Badge>
                          {ticket.timer_running && (
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3 text-green-500" />
                              <span className="text-xs text-green-600">Active</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6">
                No recent tickets
              </p>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/orders/new">
              <Button variant="ghost" className="w-full justify-start h-auto p-3">
                <Plus className="h-4 w-4 mr-3 text-primary" />
                <div className="text-left">
                  <div className="text-sm font-medium">New Repair Ticket</div>
                  <div className="text-xs text-muted-foreground">Create a new repair order</div>
                </div>
              </Button>
            </Link>
            <Link href="/appointments/new">
              <Button variant="ghost" className="w-full justify-start h-auto p-3">
                <Calendar className="h-4 w-4 mr-3 text-primary" />
                <div className="text-left">
                  <div className="text-sm font-medium">Schedule Appointment</div>
                  <div className="text-xs text-muted-foreground">Book a customer visit</div>
                </div>
              </Button>
            </Link>
            <Link href="/customers/new">
              <Button variant="ghost" className="w-full justify-start h-auto p-3">
                <Users className="h-4 w-4 mr-3 text-primary" />
                <div className="text-left">
                  <div className="text-sm font-medium">Add Customer</div>
                  <div className="text-xs text-muted-foreground">Create customer profile</div>
                </div>
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="h-screen flex overflow-hidden bg-background">
      {/* Your existing sidebar */}
      <Sidebar user={user} />

      {/* Premium layout takes the rest */}
      <div className="flex-1 overflow-hidden">
        <ModernPageLayout
          title="Dashboard"
          subtitle={`${getGreeting()}, ${userName}`}
          actions={getHeaderActions()}
          meta={[
            {
              label: "",
              value: new Date().toLocaleDateString('en-US', { 
                weekday: 'short',
                month: 'short', 
                day: 'numeric' 
              }),
              icon: <Calendar className="h-4 w-4" />
            },
            {
              label: "active",
              value: recentTickets?.filter((t: any) => t.status !== 'completed').length || "0",
              icon: <AlertCircle className="h-4 w-4" />
            },
            {
              label: "completed today",
              value: recentTickets?.filter((t: any) => {
                const today = new Date().toDateString();
                return t.status === 'completed' && 
                       new Date(t.created_at).toDateString() === today;
              }).length || "0",
              icon: <CheckCircle className="h-4 w-4" />
            }
          ]}
          sidebar={renderSidebarContent()}
        >
          {renderDashboardContent()}
        </ModernPageLayout>
      </div>
    </div>
  );
}