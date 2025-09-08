/**
 * Metric Card Component
 * 
 * @description Advanced metric display card with trends, sparklines, and animations
 * @category Cards
 * 
 * @example
 * ```tsx
 * <MetricCard
 *   title="Total Revenue"
 *   value="$12,345"
 *   change={12.5}
 *   trend="up"
 *   variant="success"
 *   icon={<DollarSign />}
 *   sparklineData={[10, 20, 15, 25, 30, 28, 35]}
 * />
 * ```
 */

import * as React from "react";
import { cn } from "@/lib/utils";
import { LucideIcon, TrendingUp, TrendingDown, Minus, ArrowUp, ArrowDown } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";

const metricCardVariants = cva(
  "relative overflow-hidden rounded-lg transition-all duration-200",
  {
    variants: {
      variant: {
        // Clean flat variants with sharp borders
        default: "border border-border bg-card",
        primary: "border border-primary bg-card",
        success: "border border-green-500 bg-card",
        warning: "border border-yellow-500 bg-card",
        error: "border border-red-500 bg-card",
        
        // Inverted solid variants with proper text colors
        "inverted-primary": "bg-primary text-white border-0",
        "inverted-success": "bg-green-500 text-white border-0",
        "inverted-warning": "bg-yellow-500 text-white border-0",
        "inverted-error": "bg-red-500 text-white border-0",
        "inverted-dark": "bg-gray-900 text-white border-0 dark:bg-gray-100 dark:text-gray-900",
        
        // Subtle accent (very minimal background tint)
        "accent-primary": "border border-primary/40 bg-primary/[0.02]",
        "accent-success": "border border-green-500/40 bg-green-500/[0.02]",
        "accent-warning": "border border-yellow-500/40 bg-yellow-500/[0.02]",
        
        // Minimal/ghost variant
        ghost: "border-0 bg-transparent hover:bg-muted/50",
      },
      size: {
        sm: "p-4",
        md: "p-5",
        lg: "p-6",
      },
      interactive: {
        true: "cursor-pointer hover:shadow-sm",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
      interactive: false,
    },
  }
);

interface SparklineProps {
  data: number[];
  color?: string;
  height?: number;
}

const Sparkline: React.FC<SparklineProps> = ({ 
  data, 
  color = "currentColor",
  height = 40 
}) => {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const width = 100;
  const strokeWidth = 2;
  
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - ((value - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg 
      width="100%" 
      height={height} 
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className="overflow-visible"
    >
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      <polyline
        points={`${points} ${width},${height} 0,${height}`}
        fill={`url(#gradient-${color})`}
        fillOpacity="0.1"
        stroke="none"
      />
      <defs>
        <linearGradient id={`gradient-${color}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  );
};

export interface MetricCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof metricCardVariants> {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  trend?: "up" | "down" | "neutral";
  icon?: React.ReactNode | LucideIcon;
  sparklineData?: number[];
  subtitle?: string;
  badge?: React.ReactNode;
  loading?: boolean;
}

export const MetricCard = React.forwardRef<HTMLDivElement, MetricCardProps>(
  ({ 
    className,
    variant,
    size,
    interactive,
    title,
    value,
    change,
    changeLabel = "vs last period",
    trend = "neutral",
    icon: Icon,
    sparklineData,
    subtitle,
    badge,
    loading = false,
    onClick,
    ...props 
  }, ref) => {
    const trendColor = trend === "up" ? "text-green-600 dark:text-green-400" 
                     : trend === "down" ? "text-red-600 dark:text-red-400" 
                     : "text-gray-600 dark:text-gray-400";
    
    const trendBg = trend === "up" ? "bg-green-100 dark:bg-green-900/30" 
                  : trend === "down" ? "bg-red-100 dark:bg-red-900/30" 
                  : "bg-gray-100 dark:bg-gray-900/30";

    const TrendIcon = trend === "up" ? TrendingUp 
                     : trend === "down" ? TrendingDown 
                     : Minus;

    const sparklineColor = variant === "inverted-primary" ? "#FFFFFF"
                         : variant === "inverted-success" ? "#FFFFFF"
                         : variant === "inverted-warning" ? "#FFFFFF"
                         : variant === "inverted-error" ? "#FFFFFF"
                         : variant === "inverted-dark" ? "#FFFFFF"
                         : variant?.includes("success") ? "#10B981"
                         : variant?.includes("error") ? "#EF4444"
                         : variant?.includes("warning") ? "#F59E0B"
                         : variant?.includes("info") ? "#3B82F6"
                         : variant?.includes("primary") ? "#0094CA"
                         : variant?.includes("warm") ? "#F97316"
                         : variant?.includes("cool") ? "#3B82F6"
                         : variant?.startsWith("solid-") ? "#FFFFFF"
                         : variant?.startsWith("gradient-") ? "#FFFFFF"
                         : "#6B7280";

    if (loading) {
      const skeletonClass = variant?.startsWith("inverted-") 
        ? "bg-white/20" 
        : "bg-muted";
      
      return (
        <div className={cn(metricCardVariants({ variant, size, interactive }), className)} {...props}>
          <div className="space-y-3">
            <div className={cn("h-4 w-24 rounded animate-pulse", skeletonClass)} />
            <div className={cn("h-8 w-32 rounded animate-pulse", skeletonClass)} />
            <div className={cn("h-3 w-20 rounded animate-pulse", skeletonClass)} />
          </div>
        </div>
      );
    }

    return (
      <div
        ref={ref}
        className={cn(
          metricCardVariants({ variant, size, interactive }),
          onClick && "cursor-pointer",
          className
        )}
        onClick={onClick}
        {...props}
      >
        
        <div className="relative space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="space-y-0.5">
              <p className={cn(
                "text-xs font-medium",
                variant?.startsWith("inverted-") ? "text-white/70" : "text-muted-foreground"
              )}>
                {title}
              </p>
              {subtitle && (
                <p className={cn(
                  "text-xs",
                  variant?.startsWith("inverted-") ? "text-white/60" : "text-muted-foreground/60"
                )}>
                  {subtitle}
                </p>
              )}
            </div>
            {Icon && (
              <div className={cn(
                "p-1.5 rounded-md",
                // Default variants - minimal styling
                variant === "default" && "text-muted-foreground",
                variant === "primary" && "text-primary",
                variant === "success" && "text-green-600",
                variant === "warning" && "text-yellow-600",
                variant === "error" && "text-red-600",
                // Inverted variants - white icon with subtle bg
                variant?.startsWith("inverted-") && "text-white/90 bg-white/10",
                // Accent variants - colored icon
                variant?.startsWith("accent-") && variant.includes("primary") && "text-primary",
                variant?.startsWith("accent-") && variant.includes("success") && "text-green-600",
                variant?.startsWith("accent-") && variant.includes("warning") && "text-yellow-600",
                // Ghost variant
                variant === "ghost" && "text-muted-foreground"
              )}>
                {typeof Icon === 'function' ? (
                  <Icon className="h-4 w-4" />
                ) : Icon}
              </div>
            )}
          </div>

          {/* Value */}
          <div className="space-y-1 mt-3">
            <h3 className="text-2xl font-semibold tracking-tight">
              {value}
            </h3>
            
            {/* Change indicator - Inline and minimal */}
            {change !== undefined && (
              <div className="flex items-center gap-1.5">
                <span className={cn(
                  "inline-flex items-center gap-0.5 text-xs font-medium",
                  variant?.startsWith("inverted-") ? (
                    trend === "up" ? "text-green-300" 
                    : trend === "down" ? "text-red-300" 
                    : "text-white/70"
                  ) : (
                    trend === "up" ? "text-green-600 dark:text-green-500" 
                    : trend === "down" ? "text-red-600 dark:text-red-500" 
                    : "text-muted-foreground"
                  )
                )}>
                  {trend === "up" ? (
                    <ArrowUp className="h-3 w-3" />
                  ) : trend === "down" ? (
                    <ArrowDown className="h-3 w-3" />
                  ) : (
                    <Minus className="h-3 w-3" />
                  )}
                  {Math.abs(change)}%
                </span>
                <span className={cn(
                  "text-xs",
                  variant?.startsWith("inverted-") ? "text-white/60" : "text-muted-foreground"
                )}>
                  {changeLabel}
                </span>
              </div>
            )}
          </div>

          {/* Sparkline - Subtle and minimal */}
          {sparklineData && sparklineData.length > 0 && (
            <div className="h-8 w-full mt-3 opacity-60">
              <Sparkline data={sparklineData} color={sparklineColor} />
            </div>
          )}
        </div>
      </div>
    );
  }
);

MetricCard.displayName = "MetricCard";