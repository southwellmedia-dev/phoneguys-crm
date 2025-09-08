"use client";

import { useState } from "react";
import { PageContainer } from "@/components/layout/page-container";
import { MetricCardLive, StatCardLive } from "@/components/premium/connected/dashboard";
import { ActionCard } from "@/components/premium/ui/cards/action-card";
import { ButtonPremium } from "@/components/premium/ui/buttons/button-premium";
import { RecentActivityLive } from "@/components/premium/connected/dashboard/recent-activity-live";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Package,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Users,
  DollarSign,
  Wrench,
  RefreshCw,
  Plus,
  UserPlus,
  FileText,
  Calendar,
} from "lucide-react";
import Link from "next/link";
import { useDashboard } from "@/lib/hooks/use-dashboard";
import { useRealtime } from "@/lib/hooks/use-realtime";
import { useShowSkeleton } from "@/lib/hooks/use-navigation-loading";
import { SkeletonDashboard } from "@/components/ui/skeleton-dashboard";

interface DashboardClientProps {
  metrics: {
    todayOrders: number;
    inProgressOrders: number;
    completedToday: number;
    onHoldOrders: number;
    totalOrders: number;
    totalCustomers: number;
    avgRepairTimeHours: number;
    todayRevenue: number;
    recentOrders: any[];
    recentAppointments?: any[];
    recentCustomers?: any[];
  };
}

export function DashboardClient({ metrics: initialMetrics }: DashboardClientProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Set up real-time subscriptions for all entities
  useRealtime(['all']);
  
  // Note: Sparkline generation is now handled by MetricCardLive components
  
  // Transform initial metrics to match the dashboard data structure
  const initialData = {
    stats: {
      totalRevenue: initialMetrics.todayRevenue,
      totalOrders: initialMetrics.totalOrders,
      pendingOrders: initialMetrics.todayOrders,
      averageRepairTime: initialMetrics.avgRepairTimeHours,
      revenueChange: 0,
      ordersChange: 0,
      pendingChange: 0,
      repairTimeChange: 0,
    },
    recentTickets: initialMetrics.recentOrders || [],
    todaysAppointments: [],
  };
  
  const { data: dashboardData = initialData, isLoading, isFetching, refetch } = useDashboard(initialData);
  
  // Determine if we should show skeleton
  const showSkeleton = useShowSkeleton(isLoading, isFetching, !!dashboardData);
  
  // Use dashboard data if available, otherwise use initial metrics
  const metrics = {
    todayOrders: dashboardData.stats?.pendingOrders || initialMetrics.todayOrders,
    inProgressOrders: initialMetrics.inProgressOrders,
    completedToday: initialMetrics.completedToday,
    onHoldOrders: initialMetrics.onHoldOrders,
    totalOrders: dashboardData.stats?.totalOrders || initialMetrics.totalOrders,
    totalCustomers: initialMetrics.totalCustomers,
    avgRepairTimeHours: dashboardData.stats?.averageRepairTime || initialMetrics.avgRepairTimeHours,
    todayRevenue: dashboardData.stats?.totalRevenue || initialMetrics.todayRevenue,
    recentOrders: dashboardData.recentTickets || initialMetrics.recentOrders,
    recentAppointments: initialMetrics.recentAppointments,
    recentCustomers: initialMetrics.recentCustomers,
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };
  
  const headerActions = [
    {
      label: isRefreshing ? "Refreshing..." : "Refresh",
      icon: <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />,
      variant: "default" as const,
      onClick: handleRefresh,
      disabled: isRefreshing,
    },
  ];

  if (showSkeleton) {
    return <SkeletonDashboard />;
  }

  return (
    <PageContainer
      title="Dashboard"
      description="Welcome to The Phone Guys CRM System"
      actions={headerActions}
    >
        <div className="space-y-6">
        {/* Masonry-style Metrics Grid - Modern asymmetric layout */}
        <div className="grid gap-4 lg:grid-cols-6 lg:grid-rows-3">
          {/* Large primary metric - spans 2 cols, 2 rows - SOLID CYAN */}
          <div className="lg:col-span-2 lg:row-span-2">
            <MetricCardLive
              metric="new_tickets"
              title="New Tickets Today"
              fallbackSubtitle="Awaiting assignment"
              icon={<Package />}
              variant="inverted-primary"
              showSparkline
              size="lg"
              interactive
              className="h-full"
            />
          </div>

          {/* Today's Appointments - spans 2 cols, tall */}
          <div className="lg:col-span-2 lg:row-span-2">
            <MetricCardLive
              metric="total_appointments"
              title="Today's Appointments"
              fallbackSubtitle="Scheduled visits"
              icon={<Calendar />}
              variant="primary"
              showSparkline
              size="lg"
              interactive
              className="h-full"
            />
          </div>

          {/* In Progress - wide */}
          <div className="lg:col-span-2">
            <StatCardLive
              metric="in_progress"
              icon={<Clock />}
              variant="warning"
              size="md"
            />
          </div>

          {/* Completed Today */}
          <div className="lg:col-span-2">
            <StatCardLive
              metric="completed_today"
              icon={<CheckCircle />}
              variant="success"
              size="md"
            />
          </div>

          {/* Total Customers - spans 2 cols */}
          <div className="lg:col-span-2">
            <StatCardLive
              metric="total_customers"
              icon={<Users />}
              variant="accent-primary"
              size="md"
            />
          </div>

          {/* Total Repairs - wide bottom card */}
          <div className="lg:col-span-2">
            <StatCardLive
              metric="total_repairs"
              icon={<Wrench />}
              variant="default"
              size="md"
            />
          </div>

          {/* On Hold - spans 2 cols to match height */}
          <div className="lg:col-span-2">
            <StatCardLive
              metric="on_hold"
              icon={<AlertCircle />}
              variant="default"
              size="md"
            />
          </div>
        </div>

        {/* Recent Activity with Tabs - Using premium table */}
        <RecentActivityLive 
          title="Recent Activity"
          subtitle="Live updates across your system"
          limit={10}
          showTabs
          showViewAll
        />

        {/* Quick Actions - Consistent styling */}
        <div className="grid gap-4 lg:grid-cols-3">
          <ActionCard
            title="New Repair Ticket"
            description="Create a walk-in repair order"
            icon={<Plus />}
            variant="default"
            badge="Quick"
            onClick={() => window.location.href = '/orders/new'}
            stats={{
              label: "Today",
              value: metrics.todayOrders
            }}
          />
          <ActionCard
            title="Add Customer"
            description="Register new customer"
            icon={<UserPlus />}
            variant="default"
            onClick={() => window.location.href = '/customers/new'}
            stats={{
              label: "Total",
              value: metrics.totalCustomers
            }}
          />
          <ActionCard
            title="Reports"
            description="View analytics dashboard"
            icon={<FileText />}
            variant="default"
            onClick={() => window.location.href = '/reports'}
            stats={{
              label: "Revenue",
              value: `$${metrics.todayRevenue.toFixed(0)}`
            }}
          />
        </div>

        {/* System Status - Modern Glass Card */}
        <div>
          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-mesh opacity-30" />
            <CardHeader className="relative pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="relative inline-flex h-3 w-3">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
                    <span className="relative inline-flex h-3 w-3 rounded-full bg-green-500"></span>
                  </div>
                  <CardTitle className="text-lg">System Status</CardTitle>
                </div>
                <span className="text-xs font-medium text-green-600 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-full">
                  All Systems Operational
                </span>
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-3 p-3 rounded-lg bg-gradient-to-r from-green-500/10 to-transparent">
                  <div className="p-2 rounded-lg bg-green-500/20">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">API Status</p>
                    <p className="text-xs text-muted-foreground">Operational</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 rounded-lg bg-gradient-to-r from-green-500/10 to-transparent">
                  <div className="p-2 rounded-lg bg-green-500/20">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Database</p>
                    <p className="text-xs text-muted-foreground">Connected</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 rounded-lg bg-gradient-to-r from-green-500/10 to-transparent">
                  <div className="p-2 rounded-lg bg-green-500/20">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Email Service</p>
                    <p className="text-xs text-muted-foreground">Active</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}