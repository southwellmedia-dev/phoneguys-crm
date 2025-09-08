"use client";

import { MetricCard } from "@/components/dashboard/metric-card";
import { useDashboardStats } from "@/lib/hooks/use-dashboard";
import { LucideIcon } from "lucide-react";

export type MetricType = 
  | 'revenue' 
  | 'orders' 
  | 'pending' 
  | 'repair_time'
  | 'completed_today'
  | 'average_value'
  | 'customer_satisfaction';

interface ConnectedMetricCardProps {
  metric: MetricType;
  title?: string;
  icon?: LucideIcon;
  priority?: "high" | "medium" | "low";
  variant?: "default" | "solid" | "gradient" | "outlined" | "glass";
  color?: "default" | "cyan" | "red" | "green" | "amber" | "navy" | "purple";
  className?: string;
  formatValue?: (value: number) => string;
  customDescription?: string;
}

// Business rules for determining priority based on metric type
const getDefaultPriority = (metric: MetricType): "high" | "medium" | "low" => {
  switch (metric) {
    case 'revenue':
    case 'orders':
      return 'high';
    case 'pending':
    case 'completed_today':
      return 'medium';
    case 'repair_time':
    case 'average_value':
    case 'customer_satisfaction':
      return 'low';
    default:
      return 'medium';
  }
};

// Default colors for different metric types
const getDefaultColor = (metric: MetricType): string => {
  switch (metric) {
    case 'revenue':
    case 'completed_today':
      return 'green';
    case 'orders':
    case 'average_value':
      return 'cyan';
    case 'pending':
      return 'amber';
    case 'repair_time':
      return 'navy';
    case 'customer_satisfaction':
      return 'purple';
    default:
      return 'default';
  }
};

// Default formatting for different metric types
const formatMetricValue = (metric: MetricType, value: number): string => {
  switch (metric) {
    case 'revenue':
    case 'average_value':
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value);
    case 'repair_time':
      return value >= 60 
        ? `${Math.floor(value / 60)}h ${value % 60}m`
        : `${value}min`;
    case 'customer_satisfaction':
      return `${value}%`;
    case 'orders':
    case 'pending':
    case 'completed_today':
      return value.toString();
    default:
      return value.toString();
  }
};

// Default descriptions for metrics
const getMetricDescription = (metric: MetricType): string => {
  switch (metric) {
    case 'revenue':
      return 'Total revenue today';
    case 'orders':
      return 'Total repair orders';
    case 'pending':
      return 'Awaiting repair';
    case 'repair_time':
      return 'Average completion time';
    case 'completed_today':
      return 'Completed today';
    case 'average_value':
      return 'Average order value';
    case 'customer_satisfaction':
      return 'Customer satisfaction';
    default:
      return '';
  }
};

// Extract the relevant value and trend from dashboard stats
const getMetricData = (stats: any, metric: MetricType) => {
  if (!stats) return { value: 0, trend: undefined };
  
  switch (metric) {
    case 'revenue':
      return {
        value: stats.totalRevenue || 0,
        trend: stats.revenueChange !== undefined ? {
          value: stats.revenueChange,
          isPositive: stats.revenueChange > 0
        } : undefined
      };
    case 'orders':
      return {
        value: stats.totalOrders || 0,
        trend: stats.ordersChange !== undefined ? {
          value: stats.ordersChange,
          isPositive: stats.ordersChange > 0
        } : undefined
      };
    case 'pending':
      return {
        value: stats.pendingOrders || 0,
        trend: stats.pendingChange !== undefined ? {
          value: stats.pendingChange,
          isPositive: stats.pendingChange < 0 // Less pending is positive
        } : undefined
      };
    case 'repair_time':
      return {
        value: stats.averageRepairTime || 0,
        trend: stats.repairTimeChange !== undefined ? {
          value: stats.repairTimeChange,
          isPositive: stats.repairTimeChange < 0 // Less time is positive
        } : undefined
      };
    case 'completed_today':
      return {
        value: stats.completedToday || 0,
        trend: undefined // No trend data for completed today yet
      };
    case 'average_value':
      return {
        value: stats.averageOrderValue || 0,
        trend: stats.averageValueChange !== undefined ? {
          value: stats.averageValueChange,
          isPositive: stats.averageValueChange > 0
        } : undefined
      };
    case 'customer_satisfaction':
      return {
        value: stats.customerSatisfaction || 0,
        trend: stats.satisfactionChange !== undefined ? {
          value: stats.satisfactionChange,
          isPositive: stats.satisfactionChange > 0
        } : undefined
      };
    default:
      return { value: 0, trend: undefined };
  }
};

export function ConnectedMetricCard({
  metric,
  title,
  icon,
  priority,
  variant,
  color,
  className,
  formatValue,
  customDescription,
}: ConnectedMetricCardProps) {
  const { data: stats, isLoading } = useDashboardStats();
  
  const metricData = getMetricData(stats, metric);
  const finalPriority = priority || getDefaultPriority(metric);
  const finalColor = color || getDefaultColor(metric);
  const finalTitle = title || getMetricDescription(metric);
  const finalValue = formatValue 
    ? formatValue(metricData.value) 
    : formatMetricValue(metric, metricData.value);

  if (isLoading) {
    return (
      <MetricCard
        title={finalTitle}
        value="--"
        description="Loading..."
        priority={finalPriority}
        variant={variant}
        color={finalColor}
        className={className}
      />
    );
  }

  return (
    <MetricCard
      title={finalTitle}
      value={finalValue}
      description={customDescription || getMetricDescription(metric)}
      icon={icon}
      trend={metricData.trend}
      priority={finalPriority}
      variant={variant}
      color={finalColor}
      className={className}
    />
  );
}