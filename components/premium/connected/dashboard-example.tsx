"use client";

import { DashboardGrid } from "./dashboard-grid";
import { ConnectedMetricCard } from "./connected-metric-card";
import { ConnectedStatCard } from "./connected-stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  DollarSign, 
  Package, 
  Clock, 
  Users, 
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Star
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardExampleProps {
  className?: string;
  layout?: "overview" | "detailed" | "analytics";
}

/**
 * Example component demonstrating how to use connected premium components
 * in a real dashboard layout with proper visual hierarchy and real-time data
 */
export function DashboardExample({ 
  className,
  layout = "overview" 
}: DashboardExampleProps) {
  
  if (layout === "detailed") {
    return (
      <div className={cn("space-y-6", className)}>
        {/* Header with primary metrics using high priority */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Key Performance Indicators</h2>
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

        {/* Secondary metrics using StatCard variants for visual interest */}
        <section>
          <h2 className="text-xl font-semibold mb-4">Operational Metrics</h2>
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

        {/* Supporting information using low priority components */}
        <section>
          <h2 className="text-lg font-medium mb-4">Additional Insights</h2>
          <div className="grid gap-4 md:grid-cols-4">
            <ConnectedMetricCard
              metric="repair_time"
              priority="low"
              variant="outlined"
              className="text-sm"
            />
            <ConnectedMetricCard
              metric="average_value"
              priority="low"
              variant="outlined"
              className="text-sm"
            />
            <ConnectedMetricCard
              metric="customer_satisfaction"
              priority="low"
              variant="outlined"
              className="text-sm"
            />
            <Card className="p-4">
              <CardContent className="p-0">
                <p className="text-sm text-muted-foreground">More metrics coming soon...</p>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    );
  }

  if (layout === "analytics") {
    return (
      <div className={cn("space-y-6", className)}>
        {/* Analytics focused layout with various StatCard variants */}
        <div className="grid gap-6">
          {/* Top row - Primary business metrics */}
          <div className="grid gap-4 md:grid-cols-2">
            <ConnectedStatCard
              metric="revenue"
              icon={DollarSign}
              variant="gradient-border"
              color="green"
              title="Total Revenue"
            />
            <ConnectedStatCard
              metric="orders"
              icon={Package}
              variant="background-number"
              color="cyan"
              title="Total Orders"
            />
          </div>

          {/* Middle row - Operational metrics */}
          <div className="grid gap-4 md:grid-cols-3">
            <ConnectedStatCard
              metric="pending"
              icon={AlertCircle}
              variant="split"
              color="amber"
            />
            <ConnectedStatCard
              metric="repair_time"
              icon={Clock}
              variant="floating"
              color="purple"
            />
            <ConnectedStatCard
              metric="customer_satisfaction"
              icon={Star}
              variant="gradient-border"
              color="purple"
            />
          </div>

          {/* Bottom row - Supporting metrics */}
          <div className="grid gap-4 md:grid-cols-4">
            <ConnectedStatCard
              metric="completed_today"
              variant="default"
              color="green"
            />
            <ConnectedStatCard
              metric="average_value"
              variant="default"
              color="cyan"
            />
            <Card className="p-4 flex items-center justify-center">
              <p className="text-sm text-muted-foreground">Custom metric slot</p>
            </Card>
            <Card className="p-4 flex items-center justify-center">
              <p className="text-sm text-muted-foreground">Custom metric slot</p>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Default overview layout using DashboardGrid
  return (
    <div className={cn("space-y-6", className)}>
      {/* Primary dashboard using the DashboardGrid component */}
      <section>
        <h2 className="text-2xl font-bold mb-6">Dashboard Overview</h2>
        <DashboardGrid layout="default" />
      </section>

      {/* Example of mixed component usage */}
      <section>
        <h3 className="text-lg font-semibold mb-4">Mixed Component Examples</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* High priority metric with solid variant */}
          <ConnectedMetricCard
            metric="revenue"
            icon={DollarSign}
            priority="high"
            variant="solid"
            color="green"
            title="Today's Revenue"
          />
          
          {/* Creative StatCard variant */}
          <ConnectedStatCard
            metric="pending"
            icon={AlertCircle}
            variant="gradient-border"
            color="amber"
            title="Pending Repairs"
          />
          
          {/* Medium priority with glass effect */}
          <ConnectedMetricCard
            metric="completed_today"
            icon={CheckCircle}
            priority="medium"
            variant="glass"
            color="green"
            title="Completed Today"
          />
        </div>
      </section>

      {/* Usage tips */}
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="text-base">💡 Usage Tips</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p><strong>High Priority:</strong> Use solid variants with cyan/green colors for critical metrics</p>
          <p><strong>Medium Priority:</strong> Use gradient/elevated variants for important but not critical data</p>
          <p><strong>Low Priority:</strong> Use outlined variants for supporting information</p>
          <p><strong>Visual Interest:</strong> Mix StatCard variants (background-number, floating, etc.) to avoid monotony</p>
          <p><strong>Real-time:</strong> All components automatically update with live data from your CRM</p>
        </CardContent>
      </Card>
    </div>
  );
}