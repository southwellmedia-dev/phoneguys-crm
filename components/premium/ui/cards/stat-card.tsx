/**
 * Stat Card Component
 * 
 * @description Compact statistics card with icon and trend indicator
 * @category Cards
 * 
 * @example
 * ```tsx
 * <StatCard
 *   label="Active Users"
 *   value="1,234"
 *   icon={<Users />}
 *   trend={15}
 *   variant="success"
 * />
 * ```
 */

import * as React from "react";
import { cn } from "@/lib/utils";
import { LucideIcon, TrendingUp, TrendingDown, ArrowUp, ArrowDown } from "lucide-react";

interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  value: string | number;
  icon?: React.ReactNode | LucideIcon;
  trend?: number;
  trendLabel?: string;
  variant?: "default" | "primary" | "success" | "warning" | "error" 
           | "inverted-primary" | "inverted-success" | "inverted-warning" | "inverted-error" | "inverted-dark"
           | "accent-primary" | "accent-success" | "accent-warning" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

export const StatCard = React.forwardRef<HTMLDivElement, StatCardProps>(
  ({ 
    className,
    label,
    value,
    icon: Icon,
    trend,
    trendLabel,
    variant = "default",
    size = "md",
    loading = false,
    ...props 
  }, ref) => {
    const isPositive = trend && trend > 0;
    const isNegative = trend && trend < 0;
    
    const variantStyles = {
      // Clean flat variants
      default: "bg-card border border-border",
      primary: "bg-card border border-primary",
      success: "bg-card border border-green-500",
      warning: "bg-card border border-yellow-500",
      error: "bg-card border border-red-500",
      
      // Inverted solid variants
      "inverted-primary": "bg-primary text-white border-0",
      "inverted-success": "bg-green-500 text-white border-0",
      "inverted-warning": "bg-yellow-500 text-white border-0",
      "inverted-error": "bg-red-500 text-white border-0",
      "inverted-dark": "bg-gray-900 text-white border-0 dark:bg-gray-100 dark:text-gray-900",
      
      // Subtle accent (very minimal background)
      "accent-primary": "bg-card border border-primary/40 bg-primary/[0.02]",
      "accent-success": "bg-card border border-green-500/40 bg-green-500/[0.02]",
      "accent-warning": "bg-card border border-yellow-500/40 bg-yellow-500/[0.02]",
      
      // Ghost variant
      ghost: "bg-transparent border-0",
    };

    const getIconStyles = (variant: string) => {
      // Colored border variants
      if (variant === "primary") return "text-primary";
      if (variant === "success") return "text-green-600";
      if (variant === "warning") return "text-yellow-600";
      if (variant === "error") return "text-red-600";
      
      // Inverted variants - white icon
      if (variant?.startsWith("inverted-")) return "text-white/90 bg-white/10";
      
      // Accent variants - colored icon
      if (variant?.startsWith("accent-")) {
        if (variant.includes("primary")) return "text-primary";
        if (variant.includes("success")) return "text-green-600";
        if (variant.includes("warning")) return "text-yellow-600";
      }
      
      // Default
      return "text-muted-foreground";
    };

    const sizeStyles = {
      sm: "p-3",
      md: "p-4",
      lg: "p-6",
    };

    if (loading) {
      return (
        <div className={cn(
          "rounded-lg border",
          variantStyles[variant],
          sizeStyles[size],
          className
        )} {...props}>
          <div className="space-y-2">
            <div className="h-3 w-20 bg-muted rounded animate-pulse" />
            <div className="h-6 w-24 bg-muted rounded animate-pulse" />
          </div>
        </div>
      );
    }

    return (
      <div
        ref={ref}
        className={cn(
          "rounded-lg transition-all duration-200 hover:border-border",
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className={cn(
              "text-xs font-medium",
              variant?.startsWith("inverted-") ? "text-white/70" : "text-muted-foreground"
            )}>
              {label}
            </p>
            <div className="flex items-baseline gap-2">
              <p className={cn(
                "font-semibold",
                size === "sm" && "text-lg",
                size === "md" && "text-xl",
                size === "lg" && "text-2xl",
              )}>
                {value}
              </p>
              {trend !== undefined && (
                <div className={cn(
                  "inline-flex items-center gap-0.5 text-xs font-medium",
                  variant?.startsWith("inverted-") ? (
                    isPositive ? "text-green-300" : isNegative ? "text-red-300" : "text-white/70"
                  ) : (
                    isPositive ? "text-green-600 dark:text-green-400" : 
                    isNegative ? "text-red-600 dark:text-red-400" : 
                    "text-gray-600 dark:text-gray-400"
                  )
                )}>
                  {isPositive ? (
                    <ArrowUp className="h-3 w-3" />
                  ) : isNegative ? (
                    <ArrowDown className="h-3 w-3" />
                  ) : null}
                  <span>{Math.abs(trend)}%</span>
                </div>
              )}
            </div>
            {trendLabel && (
              <p className={cn(
                "text-xs",
                variant?.startsWith("inverted-") ? "text-white/60" : "text-muted-foreground"
              )}>
                {trendLabel}
              </p>
            )}
          </div>
          {Icon && (
            <div className={cn(
              "rounded-md",
              size === "sm" && "p-1",
              size === "md" && "p-1.5",
              size === "lg" && "p-2",
              getIconStyles(variant)
            )}>
              {typeof Icon === 'function' ? (
                <Icon className={cn(
                  size === "sm" && "h-3.5 w-3.5",
                  size === "md" && "h-4 w-4",
                  size === "lg" && "h-4 w-4",
                )} />
              ) : Icon}
            </div>
          )}
        </div>
      </div>
    );
  }
);

StatCard.displayName = "StatCard";