'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { 
  LineChart, 
  Line, 
  BarChart,
  Bar,
  ResponsiveContainer,
  Tooltip,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface DashboardStatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ReactNode | LucideIcon;
  badge?: string;
  trend?: {
    value: number;
    label: string;
  };
  chart?: {
    type: 'line' | 'bar' | 'pie';
    data: any[];
    color?: string;
  };
  stats?: Array<{
    label: string;
    value: string | number;
    color?: string;
  }>;
  variant?: 'default' | 'primary' | 'success' | 'warning';
  className?: string;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background/95 border rounded px-2 py-1 shadow-sm">
        <p className="text-xs font-medium">{payload[0].value}</p>
      </div>
    );
  }
  return null;
};

export function DashboardStatCard({
  title,
  value,
  description,
  icon,
  badge,
  trend,
  chart,
  stats,
  variant = 'default',
  className
}: DashboardStatCardProps) {
  const variantStyles = {
    default: 'border-border',
    primary: 'border-primary',
    success: 'border-green-500',
    warning: 'border-yellow-500'
  };

  const iconStyles = {
    default: 'text-muted-foreground',
    primary: 'text-primary',
    success: 'text-green-600',
    warning: 'text-yellow-600'
  };

  // Default chart color based on variant
  const defaultChartColor = {
    default: '#6b7280',
    primary: '#0094CA',
    success: '#10b981',
    warning: '#f59e0b'
  }[variant];

  return (
    <Card className={cn(
      'group relative overflow-hidden transition-all duration-200 hover:shadow-sm bg-card',
      variantStyles[variant],
      className
    )}>
      <CardContent className="p-5">
        {/* Header with icon and badge */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            {icon && (
              <div className={cn('transition-transform group-hover:scale-110', iconStyles[variant])}>
                {icon}
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground">{title}</p>
              {badge && (
                <span className="inline-flex items-center px-2 py-0.5 mt-1 text-xs font-medium bg-muted rounded">
                  {badge}
                </span>
              )}
            </div>
          </div>
          
          {/* Mini chart */}
          {chart && chart.type === 'line' && (
            <div className="w-20 h-10">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chart.data}>
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke={chart.color || defaultChartColor}
                    strokeWidth={2}
                    dot={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Main value */}
        <div className="space-y-1 mb-3">
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-bold">{value}</p>
            {trend && (
              <div className={cn(
                'flex items-center gap-1 text-xs',
                trend.value > 0 ? 'text-green-600' : 'text-red-600'
              )}>
                {trend.value > 0 ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                <span>{Math.abs(trend.value)}%</span>
              </div>
            )}
          </div>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>

        {/* Bar chart */}
        {chart && chart.type === 'bar' && (
          <div className="h-16 mb-3">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chart.data}>
                <Bar 
                  dataKey="value" 
                  fill={chart.color || defaultChartColor}
                  radius={[2, 2, 0, 0]}
                />
                <Tooltip content={<CustomTooltip />} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Bottom stats */}
        {stats && stats.length > 0 && (
          <div className={cn(
            'flex items-center justify-between pt-3 border-t',
            stats.length > 2 ? 'gap-2' : 'gap-4'
          )}>
            {stats.map((stat, index) => (
              <div key={index} className="text-center flex-1">
                <p className={cn(
                  'text-sm font-semibold',
                  stat.color || 'text-foreground'
                )}>
                  {stat.value}
                </p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Hover effect line */}
        <div className={cn(
          'absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r transition-all duration-300',
          variant === 'primary' && 'from-primary to-primary/50',
          variant === 'success' && 'from-green-500 to-green-500/50', 
          variant === 'warning' && 'from-yellow-500 to-yellow-500/50',
          variant === 'default' && 'from-muted-foreground/20 to-transparent',
          'scale-x-0 group-hover:scale-x-100'
        )} />
      </CardContent>
    </Card>
  );
}