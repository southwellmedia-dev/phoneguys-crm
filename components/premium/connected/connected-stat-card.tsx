"use client";

import { StatCard, StatCardProps } from "@/components/premium/cards/stat-card";
import { useDashboardStats } from "@/lib/hooks/use-dashboard";
import { LucideIcon } from "lucide-react";
import { getMetricColor, formatMetricValue, getMetricDescription } from "@/lib/utils/metric-priority";
import { MetricType } from "./connected-metric-card";

interface ConnectedStatCardProps extends Omit<StatCardProps, 'value' | 'change'> {
  metric: MetricType;
  title?: string;
  icon?: LucideIcon;
  variant?: "default" | "background-number" | "gradient-border" | "floating" | "split";
  color?: "cyan" | "purple" | "green" | "amber" | "red";
  className?: string;
  formatValue?: (value: number) => string;
  showChange?: boolean;
  customDescription?: string;
}

// Extract the relevant value and change from dashboard stats
const getStatData = (stats: any, metric: MetricType) => {
  if (!stats) return { value: 0, change: undefined };
  
  switch (metric) {
    case 'revenue':
      return {
        value: stats.totalRevenue || 0,
        change: stats.revenueChange
      };
    case 'orders':
      return {
        value: stats.totalOrders || 0,
        change: stats.ordersChange
      };
    case 'pending':
      return {
        value: stats.pendingOrders || 0,
        change: stats.pendingChange
      };
    case 'repair_time':
      return {
        value: stats.averageRepairTime || 0,
        change: stats.repairTimeChange
      };
    case 'completed_today':
      return {
        value: stats.completedToday || 0,
        change: undefined // No change data for completed today yet
      };
    case 'average_value':
      return {
        value: stats.averageOrderValue || 0,
        change: stats.averageValueChange
      };
    case 'customer_satisfaction':
      return {
        value: stats.customerSatisfaction || 0,
        change: stats.satisfactionChange
      };
    default:
      return { value: 0, change: undefined };
  }
};

export function ConnectedStatCard({
  metric,
  title,
  icon,
  variant = "default",
  color,
  className,
  formatValue,
  showChange = true,
  customDescription,
}: ConnectedStatCardProps) {
  const { data: stats, isLoading } = useDashboardStats();
  
  const statData = getStatData(stats, metric);
  const finalColor = color || getMetricColor(metric, statData.value);
  const finalTitle = title || getMetricDescription(metric);
  const finalValue = formatValue 
    ? formatValue(statData.value) 
    : formatMetricValue(metric, statData.value);

  if (isLoading) {
    return (
      <StatCard
        title={finalTitle}
        value="--"
        variant={variant}
        color={finalColor}
        className={className}
      />
    );
  }

  return (
    <StatCard
      title={finalTitle}
      value={finalValue}
      change={showChange ? statData.change : undefined}
      icon={icon}
      variant={variant}
      color={finalColor}
      className={className}
    />
  );
}