"use client";

import { ModernPageLayout } from "../layout/modern-page-layout";
import { DashboardGrid } from "./dashboard-grid";
import { ConnectedStatCard } from "./connected-stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRecentTickets, useTodaysAppointments } from "@/lib/hooks/use-dashboard";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart3, 
  Calendar, 
  Clock, 
  Plus, 
  Settings,
  TrendingUp,
  Users,
  Wrench
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ConnectedDashboardLayoutProps {
  userName?: string;
  userRole?: string;
  className?: string;
  layout?: "overview" | "analytics" | "executive";
}

export function ConnectedDashboardLayout({ 
  userName = "User",
  userRole = "Technician",
  className,
  layout = "overview" 
}: ConnectedDashboardLayoutProps) {
  const { data: recentTickets, isLoading: ticketsLoading } = useRecentTickets();
  const { data: todaysAppointments, isLoading: appointmentsLoading } = useTodaysAppointments();
  
  // Dynamic page title based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const getDashboardActions = () => {
    const baseActions = [
      {
        label: "New Ticket",
        icon: <Plus className="h-4 w-4" />,
        variant: "gradient" as const,
        color: "cyan" as const,
        onClick: () => console.log("Create ticket")
      },
      {
        label: "Settings",
        icon: <Settings className="h-4 w-4" />,
        variant: "outline" as const,
        onClick: () => console.log("Open settings")
      }
    ];

    if (layout === "executive") {
      return [
        {
          label: "Analytics",
          icon: <BarChart3 className="h-4 w-4" />,
          variant: "gradient" as const,
          color: "green" as const,
          onClick: () => console.log("Open analytics")
        },
        ...baseActions
      ];
    }

    return baseActions;
  };

  // Recent Activity Sidebar for overview layout
  const sidebar = layout === "overview" ? (
    <div className="space-y-6">
      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <button className="w-full p-3 text-left rounded-lg hover:bg-muted/50 transition-colors flex items-center gap-3">
            <Plus className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">New Repair Ticket</span>
          </button>
          <button className="w-full p-3 text-left rounded-lg hover:bg-muted/50 transition-colors flex items-center gap-3">
            <Calendar className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Schedule Appointment</span>
          </button>
          <button className="w-full p-3 text-left rounded-lg hover:bg-muted/50 transition-colors flex items-center gap-3">
            <Users className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Add Customer</span>
          </button>
        </CardContent>
      </Card>

      {/* Recent Tickets */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Wrench className="h-4 w-4" />
            Recent Tickets
          </CardTitle>
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
          ) : (
            <div className="space-y-3">
              {recentTickets?.slice(0, 5).map((ticket: any) => (
                <div key={ticket.id} className="pb-3 border-b border-border/50 last:border-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">
                        #{ticket.ticket_number}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {ticket.customer_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {ticket.device_info}
                      </p>
                    </div>
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
                  </div>
                  {ticket.timer_running && (
                    <div className="flex items-center gap-1 mt-2">
                      <Clock className="h-3 w-3 text-green-500" />
                      <span className="text-xs text-green-600">Timer running</span>
                    </div>
                  )}
                </div>
              )) || (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No recent tickets
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Today's Appointments */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Today's Appointments
          </CardTitle>
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
          ) : (
            <div className="space-y-3">
              {todaysAppointments?.slice(0, 3).map((appointment: any, idx: number) => (
                <div key={appointment.id || idx} className="pb-3 border-b border-border/50 last:border-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">
                        {appointment.customer_name || "Customer"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {appointment.service_type || "Repair consultation"}
                      </p>
                    </div>
                    <span className="text-xs font-medium">
                      {appointment.time || new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  </div>
                </div>
              )) || (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No appointments today
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  ) : undefined;

  return (
    <ModernPageLayout
      title={`${getGreeting()}, ${userName}!`}
      subtitle={`Welcome to your ${userRole.toLowerCase()} dashboard`}
      actions={getDashboardActions()}
      badge={{
        label: userRole,
        variant: "soft",
        color: userRole === "Admin" ? "purple" : userRole === "Manager" ? "blue" : "cyan"
      }}
      meta={[
        {
          label: "Today",
          value: new Date().toLocaleDateString(),
          icon: <Calendar className="h-4 w-4" />
        }
      ]}
      sidebar={sidebar}
      className={className}
    >
      {layout === "analytics" ? (
        <div className="space-y-8">
          {/* Executive Summary */}
          <section>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Analytics Overview
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
              <ConnectedStatCard
                metric="revenue"
                variant="gradient-border"
                color="green"
              />
              <ConnectedStatCard
                metric="orders"
                variant="background-number"
                color="cyan"
              />
              <ConnectedStatCard
                metric="pending"
                variant="split"
                color="amber"
              />
              <ConnectedStatCard
                metric="customer_satisfaction"
                variant="floating"
                color="purple"
              />
            </div>
          </section>

          {/* Detailed Metrics */}
          <section>
            <h3 className="text-lg font-medium mb-4">Detailed Metrics</h3>
            <DashboardGrid layout="expanded" showAllMetrics />
          </section>
        </div>
      ) : layout === "executive" ? (
        <div className="space-y-8">
          {/* Executive Summary */}
          <section>
            <h2 className="text-2xl font-bold mb-6">Executive Summary</h2>
            <div className="grid gap-6 md:grid-cols-2">
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

          {/* Performance Metrics */}
          <section>
            <h3 className="text-xl font-semibold mb-4">Performance Metrics</h3>
            <DashboardGrid layout="default" />
          </section>

          {/* Additional Executive Insights */}
          <section className="grid gap-4 md:grid-cols-3">
            <ConnectedStatCard
              metric="repair_time"
              variant="floating"
              color="purple"
            />
            <ConnectedStatCard
              metric="average_value"
              variant="split"
              color="cyan"
            />
            <Card className="p-6 flex items-center justify-center">
              <div className="text-center">
                <BarChart3 className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Advanced analytics coming soon</p>
              </div>
            </Card>
          </section>
        </div>
      ) : (
        // Default overview layout
        <div className="space-y-6">
          <DashboardGrid layout="default" />
        </div>
      )}
    </ModernPageLayout>
  );
}