/**
 * Action Card Component
 * 
 * @description Interactive card designed for user actions with hover effects
 * @category Cards
 * 
 * @example
 * ```tsx
 * <ActionCard
 *   title="Create New Order"
 *   description="Start a new repair ticket"
 *   icon={<Plus />}
 *   variant="primary"
 *   badge="Quick"
 *   onClick={() => router.push('/orders/new')}
 * />
 * ```
 */

import * as React from "react";
import { cn } from "@/lib/utils";
import { LucideIcon, ArrowRight, ChevronRight } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";

const actionCardVariants = cva(
  "group relative overflow-hidden rounded-lg transition-all duration-200 cursor-pointer",
  {
    variants: {
      variant: {
        // Clean flat variants with colored borders
        default: "border border-border hover:border-border/70 hover:shadow-sm bg-card",
        primary: "border border-primary hover:border-primary/70 hover:shadow-sm bg-card",
        success: "border border-green-500 hover:border-green-500/70 hover:shadow-sm bg-card",
        warning: "border border-yellow-500 hover:border-yellow-500/70 hover:shadow-sm bg-card",
        error: "border border-red-500 hover:border-red-500/70 hover:shadow-sm bg-card",
        
        // Inverted solid variants with proper text colors
        "inverted-primary": "bg-primary text-white border-0 hover:bg-primary/90 hover:shadow-md [&_*]:text-white",
        "inverted-success": "bg-green-500 text-white border-0 hover:bg-green-600 hover:shadow-md",
        "inverted-warning": "bg-yellow-500 text-white border-0 hover:bg-yellow-600 hover:shadow-md",
        "inverted-error": "bg-red-500 text-white border-0 hover:bg-red-600 hover:shadow-md",
        "inverted-dark": "bg-gray-900 text-white border-0 hover:bg-gray-800 hover:shadow-md dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200",
        
        // Subtle accent (very minimal background)
        "accent-primary": "border border-primary/40 bg-primary/[0.02] hover:bg-primary/[0.04] hover:shadow-sm",
        "accent-success": "border border-green-500/40 bg-green-500/[0.02] hover:bg-green-500/[0.04] hover:shadow-sm",
        
        // Ghost variant
        ghost: "border-0 bg-transparent hover:bg-muted/50",
      },
      size: {
        sm: "p-4",
        md: "p-5",
        lg: "p-6",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
);

export interface ActionCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof actionCardVariants> {
  title: string;
  description?: string;
  icon?: React.ReactNode | LucideIcon;
  badge?: string;
  arrow?: boolean;
  stats?: {
    label: string;
    value: string | number;
  };
}

export const ActionCard = React.forwardRef<HTMLDivElement, ActionCardProps>(
  ({ 
    className,
    variant,
    size,
    title,
    description,
    icon: Icon,
    badge,
    arrow = true,
    stats,
    onClick,
    ...props 
  }, ref) => {
    const isGradient = variant === "gradient";
    
    return (
      <div
        ref={ref}
        className={cn(actionCardVariants({ variant, size }), className)}
        onClick={onClick}
        {...props}
      >
        <div className="relative">
          {/* Header with icon */}
          <div className="flex items-start justify-between mb-3">
            {Icon && (
              <div className={cn(
                "p-2 rounded-md",
                variant === "gradient" ? "bg-white/20" :
                variant === "primary" ? "bg-primary/10 text-primary" :
                variant === "success" ? "text-green-600 dark:text-green-500" :
                variant === "warning" ? "text-yellow-600 dark:text-yellow-500" :
                variant === "error" ? "text-red-600 dark:text-red-500" :
                variant === "info" ? "text-blue-600 dark:text-blue-500" :
                variant === "glass" ? "bg-white/10" :
                "text-muted-foreground"
              )}>
                {typeof Icon === 'function' ? (
                  <Icon className={cn(
                    "h-5 w-5",
                    variant === "gradient" && "text-white"
                  )} />
                ) : Icon}
              </div>
            )}
            {badge && (
              <span className={cn(
                "px-2 py-0.5 text-xs font-medium rounded-md",
                variant === "gradient" ? "bg-white/20 text-white" :
                variant === "primary" ? "bg-primary/10 text-primary" :
                "bg-muted text-muted-foreground"
              )}>
                {badge}
              </span>
            )}
          </div>

          {/* Content */}
          <div className="space-y-1">
            <h3 className={cn(
              "font-semibold text-base",
              isGradient && "text-white"
            )}>
              {title}
            </h3>
            {description && (
              <p className={cn(
                "text-sm",
                isGradient ? "text-white/80" : "text-muted-foreground"
              )}>
                {description}
              </p>
            )}
          </div>

          {/* Arrow indicator */}
          {arrow && (
            <ArrowRight className={cn(
              "absolute bottom-5 right-5 h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5",
              isGradient ? "text-white/60" : "text-muted-foreground/50"
            )} />
          )}

          {/* Stats footer - Cleaner presentation */}
          {stats && (
            <div className="mt-3 pt-3 border-t border-border/50">
              <div className="flex items-center justify-between">
                <span className={cn(
                  "text-xs",
                  isGradient ? "text-white/70" : "text-muted-foreground"
                )}>
                  {stats.label}
                </span>
                <span className={cn(
                  "text-sm font-medium",
                  isGradient ? "text-white" : "text-foreground"
                )}>
                  {stats.value}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
);

ActionCard.displayName = "ActionCard";