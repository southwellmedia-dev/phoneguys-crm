"use client";

import { ModernPageLayout } from "../layout/modern-page-layout";
import { DashboardGrid } from "./dashboard-grid";
import { ConnectedMetricCard } from "./connected-metric-card";
import { ConnectedStatCard } from "./connected-stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRecentTickets, useTodaysAppointments } from "@/lib/hooks/use-dashboard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  BarChart3, 
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
  Timer
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface ConnectedDashboardProps {
  userName?: string;
  userRole?: string;
  className?: string;
  variant?: "overview" | "analytics" | "executive" | "technician";
}

export function ConnectedDashboard({ 
  userName = "User",
  userRole = "Technician",
  className,
  variant = "overview" 
}: ConnectedDashboardProps) {
  const { data: recentTickets, isLoading: ticketsLoading } = useRecentTickets();
  const { data: todaysAppointments, isLoading: appointmentsLoading } = useTodaysAppointments();
  
  // Dynamic greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  // Role-based dashboard actions
  const getDashboardActions = () => {
    const baseActions = [
      {
        label: "New Ticket",
        icon: <Plus className="h-4 w-4" />,
        variant: "gradient" as const,
        color: "cyan" as const,
        onClick: () => window.location.href = '/orders/new'
      }
    ];

    if (userRole === "Admin" || userRole === "Manager") {
      return [
        {
          label: "Analytics",
          icon: <BarChart3 className="h-4 w-4" />,
          variant: "solid" as const,
          color: "green" as const,
          onClick: () => window.location.href = '/reports'
        },
        ...baseActions,
        {
          label: "Settings",
          icon: <Settings className="h-4 w-4" />,
          variant: "outline" as const,
          onClick: () => window.location.href = '/admin'
        }
      ];
    }

    return [
      ...baseActions,
      {
        label: "My Tickets",
        icon: <Wrench className="h-4 w-4" />,
        variant: "outline" as const,
        onClick: () => window.location.href = '/orders'
      }
    ];
  };

  // Render main dashboard content based on variant
  const renderDashboardContent = () => {
    switch (variant) {
      case "analytics":
        return (
          <div className="space-y-8">
            {/* Key Performance Indicators */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Key Performance Indicators</h2>
                <Button variant="outline" size="sm">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  View Full Report
                </Button>
              </div>
              
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
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
                  variant="elevated"
                  color="green"
                />
              </div>
            </section>

            {/* Advanced Analytics */}
            <section>
              <h3 className="text-xl font-semibold mb-4">Performance Analytics</h3>
              <div className="grid gap-4 md:grid-cols-3">
                <ConnectedStatCard
                  metric="repair_time"
                  icon={Clock}
                  variant="background-number"
                  color="purple"
                />
                <ConnectedStatCard
                  metric="average_value"
                  icon={TrendingUp}
                  variant="gradient-border"
                  color="cyan"
                />
                <ConnectedStatCard
                  metric="customer_satisfaction"
                  icon={Star}
                  variant="floating"
                  color="purple"
                />
              </div>
            </section>

            {/* Additional Metrics */}
            <section>
              <h3 className="text-lg font-medium mb-4">Operational Metrics</h3>
              <DashboardGrid layout="compact" showAllMetrics={false} />
            </section>
          </div>
        );

      case "executive":
        return (
          <div className="space-y-8">
            {/* Executive Summary */}
            <section>
              <h2 className="text-2xl font-bold mb-6">Executive Summary</h2>
              <div className="grid gap-6 md:grid-cols-2 mb-8">
                <ConnectedStatCard
                  metric="revenue"
                  variant="gradient-border"
                  color="green"
                  title="Total Revenue"
                />
                <ConnectedStatCard
                  metric="orders"
                  variant="background-number"
                  color="cyan"
                  title="Total Orders"
                />
              </div>
            </section>

            {/* Business Metrics */}
            <section>
              <h3 className="text-xl font-semibold mb-4">Business Performance</h3>
              <DashboardGrid layout="expanded" showAllMetrics />
            </section>
          </div>
        );

      case "technician":
        return (
          <div className="space-y-6">
            {/* Technician-focused metrics */}
            <section>
              <h2 className="text-xl font-semibold mb-4">Your Performance Today</h2>
              <div className="grid gap-4 md:grid-cols-4">
                <ConnectedMetricCard
                  metric="completed_today"
                  icon={CheckCircle}
                  priority="high"
                  variant="solid"
                  color="green"
                  title="Completed"
                />
                <ConnectedMetricCard
                  metric="pending"
                  icon={AlertCircle}
                  priority="medium"
                  title="In Queue"
                />
                <ConnectedStatCard
                  metric="repair_time"
                  icon={Clock}
                  variant="split"
                  color="purple"
                  title="Avg. Time"
                />
                <Card className="p-4 flex items-center justify-center">
                  <div className="text-center">
                    <Timer className="h-6 w-6 text-primary mx-auto mb-2" />
                    <p className="text-sm font-medium">Current Timer</p>
                    <p className="text-xs text-muted-foreground">No active timer</p>
                  </div>
                </Card>
              </div>
            </section>

            {/* Quick Actions for Technicians */}
            <section>
              <h3 className="text-lg font-medium mb-4">Quick Actions</h3>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                <Button variant="outline" className="h-20 flex flex-col gap-2">
                  <Plus className="h-5 w-5" />
                  <span className="text-sm">New Ticket</span>
                </Button>
                <Button variant="outline" className="h-20 flex flex-col gap-2">
                  <Wrench className="h-5 w-5" />
                  <span className="text-sm">My Tickets</span>
                </Button>
                <Button variant="outline" className="h-20 flex flex-col gap-2">
                  <Calendar className="h-5 w-5" />
                  <span className="text-sm">Schedule</span>
                </Button>
                <Button variant="outline" className="h-20 flex flex-col gap-2">
                  <Users className="h-5 w-5" />
                  <span className="text-sm">Customers</span>
                </Button>
              </div>
            </section>
          </div>
        );

      default: // overview
        return (
          <div className="space-y-6">
            <DashboardGrid layout="default" />
          </div>
        );
    }
  };

  // Sidebar content for overview variant
  const renderSidebar = () => {
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

        {/* Today's Appointments */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Today's Appointments
              </CardTitle>
              <Link href="/appointments">
                <Button variant="ghost" size="sm">
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {appointmentsLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-muted rounded w-full mb-2" />
                    <div className="h-3 bg-muted rounded w-2/3" />
                  </div>
                ))}
              </div>
            ) : todaysAppointments?.length > 0 ? (
              <div className="space-y-3">
                {todaysAppointments.slice(0, 4).map((appointment: any, idx: number) => (
                  <div key={appointment.id || idx} className="p-3 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">
                          {appointment.customer_name || "Walk-in Customer"}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {appointment.service_type || "Repair consultation"}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-medium">
                          {appointment.time || new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                        {appointment.status && (
                          <Badge variant="soft" size="sm" className="ml-2">
                            {appointment.status}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <Calendar className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No appointments today</p>
                <Button variant="ghost" size="sm" className="mt-2">
                  <Plus className="h-3 w-3 mr-1" />
                  Schedule one
                </Button>
              </div>
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
    <ModernPageLayout
      title={`${getGreeting()}, ${userName}!`}
      subtitle={`Welcome to your ${variant === "technician" ? "technician" : userRole.toLowerCase()} dashboard`}
      actions={getDashboardActions()}
      badge={{
        label: userRole,
        variant: "soft",
        color: 
          userRole === "Admin" ? "purple" : 
          userRole === "Manager" ? "blue" : 
          "cyan"
      }}
      meta={[
        {
          label: "Today",
          value: new Date().toLocaleDateString('en-US', { 
            weekday: 'long',
            month: 'short', 
            day: 'numeric' 
          }),
          icon: <Calendar className="h-4 w-4" />
        }
      ]}
      sidebar={renderSidebar()}
      className={className}
    >
      {renderDashboardContent()}
    </ModernPageLayout>
  );
}