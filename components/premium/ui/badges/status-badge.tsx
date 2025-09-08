/**
 * Status Badge Component
 * 
 * @description Animated status badge with pulse effects and multiple variants
 * @category Badges
 * 
 * @example
 * ```tsx
 * <StatusBadge status="active" pulse />
 * <StatusBadge status="error" variant="solid" />
 * <StatusBadge status="warning" size="lg" icon={<AlertCircle />} />
 * ```
 */

import * as React from "react";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";

const statusBadgeVariants = cva(
  "inline-flex items-center gap-1.5 font-medium transition-all duration-200 rounded-full",
  {
    variants: {
      variant: {
        default: "border",
        solid: "border-transparent",
        soft: "border-transparent",
        outline: "bg-transparent",
        gradient: "border-transparent text-white",
      },
      status: {
        active: "",
        success: "",
        warning: "",
        error: "",
        info: "",
        pending: "",
        inactive: "",
        new: "",
        inProgress: "",
        onHold: "",
        completed: "",
        cancelled: "",
        // Appointment statuses
        scheduled: "",
        confirmed: "",
        arrived: "",
        no_show: "",
        converted: "",
      },
      size: {
        xs: "px-2 py-0.5 text-xs",
        sm: "px-2.5 py-0.5 text-xs",
        md: "px-3 py-1 text-sm",
        lg: "px-3.5 py-1.5 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      status: "active",
      size: "md",
    },
    compoundVariants: [
      // Default variant styles
      {
        variant: "default",
        status: "active",
        className: "bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400",
      },
      {
        variant: "default",
        status: "success",
        className: "bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400",
      },
      {
        variant: "default",
        status: "warning",
        className: "bg-yellow-50 border-yellow-200 text-yellow-700 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-400",
      },
      {
        variant: "default",
        status: "error",
        className: "bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400",
      },
      {
        variant: "default",
        status: "info",
        className: "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400",
      },
      {
        variant: "default",
        status: "pending",
        className: "bg-purple-50 border-purple-200 text-purple-700 dark:bg-purple-900/20 dark:border-purple-800 dark:text-purple-400",
      },
      {
        variant: "default",
        status: "inactive",
        className: "bg-gray-50 border-gray-200 text-gray-700 dark:bg-gray-900/20 dark:border-gray-800 dark:text-gray-400",
      },
      // Solid variant styles
      {
        variant: "solid",
        status: "active",
        className: "bg-green-500 text-white",
      },
      {
        variant: "solid",
        status: "success",
        className: "bg-green-500 text-white",
      },
      {
        variant: "solid",
        status: "warning",
        className: "bg-yellow-500 text-white",
      },
      {
        variant: "solid",
        status: "error",
        className: "bg-red-500 text-white",
      },
      {
        variant: "solid",
        status: "info",
        className: "bg-blue-500 text-white",
      },
      {
        variant: "solid",
        status: "pending",
        className: "bg-purple-500 text-white",
      },
      {
        variant: "solid",
        status: "inactive",
        className: "bg-gray-500 text-white",
      },
      // Repair status styles
      {
        variant: "solid",
        status: "new",
        className: "bg-primary text-primary-foreground",
      },
      {
        variant: "solid",
        status: "inProgress",
        className: "bg-yellow-500 text-white",
      },
      {
        variant: "solid",
        status: "onHold",
        className: "bg-gray-500 text-white",
      },
      {
        variant: "solid",
        status: "completed",
        className: "bg-green-500 text-white",
      },
      {
        variant: "solid",
        status: "cancelled",
        className: "bg-red-500 text-white",
      },
      // Soft variant styles - General statuses
      {
        variant: "soft",
        status: "active",
        className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
      },
      {
        variant: "soft",
        status: "success",
        className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
      },
      {
        variant: "soft",
        status: "warning",
        className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
      },
      {
        variant: "soft",
        status: "error",
        className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
      },
      {
        variant: "soft",
        status: "info",
        className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
      },
      {
        variant: "soft",
        status: "pending",
        className: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
      },
      {
        variant: "soft",
        status: "inactive",
        className: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
      },
      // Soft variant - Repair ticket statuses
      {
        variant: "soft",
        status: "new",
        className: "bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary",
      },
      {
        variant: "soft",
        status: "inProgress",
        className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
      },
      {
        variant: "soft",
        status: "onHold",
        className: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
      },
      {
        variant: "soft",
        status: "completed",
        className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
      },
      {
        variant: "soft",
        status: "cancelled",
        className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
      },
      // Soft variant - Appointment statuses
      {
        variant: "soft",
        status: "scheduled",
        className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
      },
      {
        variant: "soft",
        status: "confirmed",
        className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
      },
      {
        variant: "soft",
        status: "arrived",
        className: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
      },
      {
        variant: "soft",
        status: "no_show",
        className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
      },
      {
        variant: "soft",
        status: "converted",
        className: "bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary",
      },
      // Gradient variant styles
      {
        variant: "gradient",
        status: "active",
        className: "bg-gradient-success",
      },
      {
        variant: "gradient",
        status: "success",
        className: "bg-gradient-success",
      },
      {
        variant: "gradient",
        status: "warning",
        className: "bg-gradient-warning",
      },
      {
        variant: "gradient",
        status: "error",
        className: "bg-gradient-danger",
      },
      {
        variant: "gradient",
        status: "info",
        className: "bg-gradient-info",
      },
      {
        variant: "gradient",
        status: "pending",
        className: "bg-gradient-to-r from-purple-500 to-purple-600",
      },
      {
        variant: "gradient",
        status: "inactive",
        className: "bg-gradient-to-r from-gray-500 to-gray-600",
      },
    ],
  }
);

interface StatusBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof statusBadgeVariants> {
  pulse?: boolean;
  icon?: React.ReactNode | LucideIcon;
  label?: string;
}

export const StatusBadge = React.forwardRef<HTMLSpanElement, StatusBadgeProps>(
  ({ 
    className,
    variant,
    status,
    size,
    pulse = false,
    icon: Icon,
    label,
    children,
    ...props 
  }, ref) => {
    const statusLabels = {
      // General statuses
      active: "Active",
      success: "Success",
      warning: "Warning",
      error: "Error",
      info: "Info",
      pending: "Pending",
      inactive: "Inactive",
      // Repair ticket statuses
      new: "New",
      inProgress: "In Progress",
      onHold: "On Hold",
      completed: "Completed",
      cancelled: "Cancelled",
      // Appointment statuses
      scheduled: "Scheduled",
      confirmed: "Confirmed",
      arrived: "Arrived",
      no_show: "No Show",
      converted: "Converted",
    };

    const displayLabel = label || children || (status && statusLabels[status as keyof typeof statusLabels]) || "Status";

    const pulseColors = {
      active: "bg-green-500",
      success: "bg-green-500",
      warning: "bg-yellow-500",
      error: "bg-red-500",
      info: "bg-blue-500",
      pending: "bg-purple-500",
      inactive: "bg-gray-500",
      new: "bg-primary",
      inProgress: "bg-yellow-500",
      onHold: "bg-gray-500",
      completed: "bg-green-500",
      cancelled: "bg-red-500",
    };

    return (
      <span
        ref={ref}
        className={cn(statusBadgeVariants({ variant, status, size }), className)}
        {...props}
      >
        {pulse && status && (
          <span className="relative inline-flex h-2 w-2">
            <span className={cn(
              "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
              pulseColors[status as keyof typeof pulseColors]
            )} />
            <span className={cn(
              "relative inline-flex rounded-full h-2 w-2",
              pulseColors[status as keyof typeof pulseColors]
            )} />
          </span>
        )}
        {Icon && (
          <span className="inline-flex shrink-0">
            {typeof Icon === 'function' ? (
              <Icon className={cn(
                size === "xs" && "h-3 w-3",
                size === "sm" && "h-3 w-3",
                size === "md" && "h-3.5 w-3.5",
                size === "lg" && "h-4 w-4",
              )} />
            ) : Icon}
          </span>
        )}
        {displayLabel}
      </span>
    );
  }
);

StatusBadge.displayName = "StatusBadge";