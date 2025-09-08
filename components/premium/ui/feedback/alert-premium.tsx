/**
 * Premium Alert Component
 * 
 * @description Fintech-style alert with clean borders and minimal design
 * @category Feedback
 * 
 * @example
 * ```tsx
 * <AlertPremium
 *   variant="success"
 *   title="Payment Processed"
 *   description="Your payment has been successfully processed."
 *   closable
 * />
 * ```
 */

import * as React from "react";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { X, AlertCircle, CheckCircle, Info, AlertTriangle, XCircle } from "lucide-react";

const alertVariants = cva(
  "relative w-full rounded-lg border p-4 transition-all duration-200",
  {
    variants: {
      variant: {
        // Clean flat variants with faded background colors to make borders pop
        default: "border-border bg-card text-foreground",
        primary: "border-primary bg-primary/[0.03] text-foreground",
        success: "border-green-500 bg-green-500/[0.03] text-foreground",
        warning: "border-yellow-500 bg-yellow-500/[0.03] text-foreground", 
        error: "border-red-500 bg-red-500/[0.03] text-foreground",
        info: "border-blue-500 bg-blue-500/[0.03] text-foreground",
        
        // Soft variants with very minimal background tint
        "soft-primary": "border-primary/40 bg-primary/[0.02] text-foreground",
        "soft-success": "border-green-500/40 bg-green-500/[0.02] text-foreground",
        "soft-warning": "border-yellow-500/40 bg-yellow-500/[0.02] text-foreground",
        "soft-error": "border-red-500/40 bg-red-500/[0.02] text-foreground",
        "soft-info": "border-blue-500/40 bg-blue-500/[0.02] text-foreground",
      },
      size: {
        sm: "p-3 text-sm",
        md: "p-4",
        lg: "p-5 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
);

const iconMap = {
  default: AlertCircle,
  primary: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  error: XCircle,
  info: Info,
  "soft-primary": Info,
  "soft-success": CheckCircle,
  "soft-warning": AlertTriangle,
  "soft-error": XCircle,
  "soft-info": Info,
};

const iconColorMap = {
  default: "text-muted-foreground",
  primary: "text-primary",
  success: "text-green-600 dark:text-green-400",
  warning: "text-yellow-600 dark:text-yellow-400",
  error: "text-red-600 dark:text-red-400",
  info: "text-blue-600 dark:text-blue-400",
  "soft-primary": "text-primary",
  "soft-success": "text-green-600 dark:text-green-400",
  "soft-warning": "text-yellow-600 dark:text-yellow-400",
  "soft-error": "text-red-600 dark:text-red-400",
  "soft-info": "text-blue-600 dark:text-blue-400",
};

interface AlertPremiumProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  closable?: boolean;
  onClose?: () => void;
}

export const AlertPremium = React.forwardRef<HTMLDivElement, AlertPremiumProps>(
  ({ 
    className,
    variant = "default",
    size = "md",
    title,
    description,
    icon,
    action,
    closable = false,
    onClose,
    children,
    ...props 
  }, ref) => {
    const IconComponent = icon ? null : (variant && iconMap[variant] ? iconMap[variant] : null);

    return (
      <div
        ref={ref}
        role="alert"
        className={cn(
          alertVariants({ variant, size }),
          className
        )}
        {...props}
      >
        <div className="flex gap-3">
          {(icon || IconComponent) && (
            <div className="shrink-0 mt-0.5">
              {icon ? (
                React.isValidElement(icon) ? 
                  React.cloneElement(icon as React.ReactElement<any>, {
                    className: cn(
                      "h-4 w-4 transition-colors",
                      variant && iconColorMap[variant],
                      size === "sm" && "h-3.5 w-3.5",
                      size === "lg" && "h-5 w-5"
                    )
                  }) : icon
              ) : IconComponent ? (
                <IconComponent 
                  className={cn(
                    "h-4 w-4 transition-colors",
                    variant && iconColorMap[variant],
                    size === "sm" && "h-3.5 w-3.5",
                    size === "lg" && "h-5 w-5"
                  )} 
                />
              ) : null}
            </div>
          )}
          
          <div className="flex-1 space-y-1">
            {title && (
              <div className={cn(
                "text-sm font-semibold leading-none tracking-tight",
                size === "sm" && "text-xs",
                size === "lg" && "text-base"
              )}>
                {title}
              </div>
            )}
            {description && (
              <div className={cn(
                "text-muted-foreground leading-relaxed",
                size === "sm" && "text-xs",
                size === "md" && "text-sm",
                size === "lg" && "text-base"
              )}>
                {description}
              </div>
            )}
            {children}
          </div>

          {action && (
            <div className="shrink-0">
              {action}
            </div>
          )}

          {closable && (
            <button
              onClick={onClose}
              className="shrink-0 rounded-md opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
              aria-label="Close alert"
            >
              <X className={cn(
                "h-4 w-4",
                size === "sm" && "h-3.5 w-3.5",
                size === "lg" && "h-5 w-5"
              )} />
            </button>
          )}
        </div>
      </div>
    );
  }
);

AlertPremium.displayName = "AlertPremium";