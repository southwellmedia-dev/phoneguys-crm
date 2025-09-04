"use client";

import { useState } from "react";
import { PageContainer } from "@/components/layout/page-container";
import { MetricCard } from "@/components/dashboard/metric-card";
import { RecentOrders } from "@/components/dashboard/recent-orders";
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
} from "lucide-react";
import Link from "next/link";
import { useDashboard } from "@/lib/hooks/use-dashboard";
import { useQueryClient } from "@tanstack/react-query";
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
  };
}

export function DashboardClient({ metrics: initialMetrics }: DashboardClientProps) {
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);
  
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
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    await refetch();
    setIsRefreshing(false);
  };
  
  const headerActions = [
    {
      label: isRefreshing ? "Refreshing..." : "Refresh",
      icon: <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />,
      variant: "outline" as const,
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
        {/* Metrics Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="New Tickets"
            value={metrics.todayOrders}
            description="Tickets awaiting assignment"
            icon={Package}
            trend={{ value: 12, isPositive: true }}
          />
          <MetricCard
            title="In Progress"
            value={metrics.inProgressOrders}
            description="Currently being repaired"
            icon={Clock}
            className="border-cyan-500/20"
          />
          <MetricCard
            title="Completed"
            value={metrics.completedToday}
            description="Successfully repaired"
            icon={CheckCircle}
            className="border-green-500/20"
          />
          <MetricCard
            title="On Hold"
            value={metrics.onHoldOrders}
            description="Waiting for parts/customer"
            icon={AlertCircle}
            className="border-yellow-500/20"
          />
        </div>

        {/* Secondary Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Total Tickets"
            value={metrics.totalOrders}
            description="All time repairs"
            icon={Wrench}
          />
          <MetricCard
            title="Total Customers"
            value={metrics.totalCustomers}
            description="Registered customers"
            icon={Users}
          />
          <MetricCard
            title="Avg. Repair Time"
            value={metrics.avgRepairTimeHours > 0 ? `${metrics.avgRepairTimeHours} hrs` : "No data"}
            description="Average completion time"
            icon={TrendingUp}
          />
          <MetricCard
            title="Revenue Today"
            value={metrics.todayRevenue > 0 ? `$${metrics.todayRevenue.toFixed(2)}` : "$0.00"}
            description="Total earnings"
            icon={DollarSign}
          />
        </div>

        {/* Recent Orders Table */}
        <RecentOrders orders={metrics.recentOrders} />

        {/* Quick Actions - Modern Card Grid */}
        <div className="grid gap-4 lg:grid-cols-3">
          <Link 
            href="/orders/new"
            className="group relative overflow-hidden rounded-xl border bg-gradient-to-br from-card to-card/80 p-6 transition-all duration-300 hover:shadow-elevation-2 hover:-translate-y-1"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <div className="p-3 rounded-xl bg-gradient-primary shadow-glow-sm">
                  <Plus className="h-5 w-5 text-white" />
                </div>
                <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full">
                  Quick
                </span>
              </div>
              <h3 className="font-bold text-lg mb-1">Create New Ticket</h3>
              <p className="text-sm text-muted-foreground">
                Start a new repair ticket for walk-in customers
              </p>
            </div>
          </Link>

          <Link 
            href="/customers/new"
            className="group relative overflow-hidden rounded-xl border bg-gradient-to-br from-card to-card/80 p-6 transition-all duration-300 hover:shadow-elevation-2 hover:-translate-y-1"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-accent/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <div className="p-3 rounded-xl bg-gradient-to-br from-accent to-accent/80 shadow-glow-sm">
                  <UserPlus className="h-5 w-5 text-white" />
                </div>
                <span className="text-xs font-medium text-accent bg-accent/10 px-2 py-1 rounded-full">
                  New
                </span>
              </div>
              <h3 className="font-bold text-lg mb-1">Add Customer</h3>
              <p className="text-sm text-muted-foreground">
                Register a new customer profile
              </p>
            </div>
          </Link>

          <Link 
            href="/reports"
            className="group relative overflow-hidden rounded-xl border bg-gradient-to-br from-card to-card/80 p-6 transition-all duration-300 hover:shadow-elevation-2 hover:-translate-y-1"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <div className="p-3 rounded-xl bg-gradient-success shadow-glow-sm">
                  <FileText className="h-5 w-5 text-white" />
                </div>
                <span className="text-xs font-medium text-green-600 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-full">
                  Reports
                </span>
              </div>
              <h3 className="font-bold text-lg mb-1">Analytics</h3>
              <p className="text-sm text-muted-foreground">
                View insights and generate reports
              </p>
            </div>
          </Link>
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