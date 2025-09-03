"use client";

import { PageContainer } from "@/components/layout/page-container";
import { MetricCard } from "@/components/dashboard/metric-card";
import { RecentOrders } from "@/components/dashboard/recent-orders";
import { Button } from "@/components/ui/button";
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

export function DashboardClient({ metrics }: DashboardClientProps) {
  const headerActions = [
    {
      label: "Refresh",
      icon: <RefreshCw className="h-4 w-4" />,
      variant: "outline" as const,
      onClick: () => window.location.reload(),
    },
  ];

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
            title="New Orders"
            value={metrics.todayOrders}
            description="Orders awaiting assignment"
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
            title="Total Orders"
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

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border bg-card p-6">
            <h3 className="font-semibold mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <Button 
                variant="ghost" 
                className="w-full justify-start h-auto p-4 hover:bg-primary/10 hover:text-primary transition-colors" 
                asChild
              >
                <Link href="/orders/new">
                  <Plus className="mr-3 h-4 w-4" />
                  <div className="text-left">
                    <div className="font-medium">Create New Order</div>
                    <div className="text-sm text-muted-foreground group-hover:text-primary/70">Start a new repair ticket</div>
                  </div>
                </Link>
              </Button>
              <Button 
                variant="ghost" 
                className="w-full justify-start h-auto p-4 hover:bg-primary/10 hover:text-primary transition-colors group" 
                asChild
              >
                <Link href="/customers/new">
                  <UserPlus className="mr-3 h-4 w-4" />
                  <div className="text-left">
                    <div className="font-medium">Add New Customer</div>
                    <div className="text-sm text-muted-foreground group-hover:text-primary/70">Register a customer</div>
                  </div>
                </Link>
              </Button>
              <Button 
                variant="ghost" 
                className="w-full justify-start h-auto p-4 hover:bg-primary/10 hover:text-primary transition-colors group" 
                asChild
              >
                <Link href="/reports">
                  <FileText className="mr-3 h-4 w-4" />
                  <div className="text-left">
                    <div className="font-medium">Generate Report</div>
                    <div className="text-sm text-muted-foreground group-hover:text-primary/70">View analytics and insights</div>
                  </div>
                </Link>
              </Button>
            </div>
          </div>

          <div className="rounded-lg border bg-card p-6">
            <h3 className="font-semibold mb-4">System Status</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">API Status</span>
                <span className="text-sm font-medium text-green-600">
                  ● Operational
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Database Connection
                </span>
                <span className="text-sm font-medium text-green-600">
                  ● Connected
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Email Service
                </span>
                <span className="text-sm font-medium text-green-600">
                  ● Active
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}