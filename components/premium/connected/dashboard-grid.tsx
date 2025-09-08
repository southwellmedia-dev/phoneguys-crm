"use client";

import { ConnectedMetricCard } from "./connected-metric-card";
import { cn } from "@/lib/utils";
import {
  DollarSign,
  Package,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Star
} from "lucide-react";

interface DashboardGridProps {
  className?: string;
  layout?: "default" | "compact" | "expanded";
  showAllMetrics?: boolean;
}

export function DashboardGrid({ 
  className,
  layout = "default",
  showAllMetrics = false 
}: DashboardGridProps) {
  
  // Define grid layouts based on the layout prop
  const gridClasses = {
    default: "grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
    compact: "grid gap-3 grid-cols-2 md:grid-cols-4 lg:grid-cols-6",
    expanded: "grid gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3"
  };

  // Core metrics that should always be shown
  const coreMetrics = [
    {
      metric: "revenue" as const,
      icon: DollarSign,
      priority: "high" as const,
      color: "green" as const,
    },
    {
      metric: "orders" as const,
      icon: Package,
      priority: "high" as const,
      color: "cyan" as const,
    },
    {
      metric: "pending" as const,
      icon: AlertCircle,
      priority: "medium" as const,
      color: "amber" as const,
    },
    {
      metric: "completed_today" as const,
      icon: CheckCircle,
      priority: "medium" as const,
      color: "green" as const,
    }
  ];

  // Additional metrics for expanded view
  const additionalMetrics = [
    {
      metric: "repair_time" as const,
      icon: Clock,
      priority: "low" as const,
      color: "navy" as const,
    },
    {
      metric: "average_value" as const,
      icon: TrendingUp,
      priority: "low" as const,
      color: "cyan" as const,
    },
    {
      metric: "customer_satisfaction" as const,
      icon: Star,
      priority: "low" as const,
      color: "purple" as const,
    }
  ];

  // Determine which metrics to show
  const metricsToShow = showAllMetrics || layout === "expanded" 
    ? [...coreMetrics, ...additionalMetrics]
    : coreMetrics;

  return (
    <div className={cn(gridClasses[layout], className)}>
      {metricsToShow.map(({ metric, icon, priority, color }) => (
        <ConnectedMetricCard
          key={metric}
          metric={metric}
          icon={icon}
          priority={priority}
          color={color}
          className={cn(
            // Responsive adjustments based on layout
            layout === "compact" && "text-sm",
            layout === "expanded" && "lg:col-span-1",
            // Special handling for high priority items in default layout
            layout === "default" && priority === "high" && "md:col-span-1 lg:col-span-1"
          )}
        />
      ))}
    </div>
  );
}