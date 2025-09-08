/**
 * Premium Loading Spinner Component
 * 
 * @description Fintech-style loading animations with multiple variants
 * @category Feedback
 * 
 * @example
 * ```tsx
 * <LoadingSpinner variant="dots" size="md" color="primary" />
 * <LoadingSpinner variant="spin" label="Processing..." />
 * <LoadingInline isLoading>Saving changes...</LoadingInline>
 * ```
 */

import * as React from "react";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const spinnerVariants = cva(
  "animate-spin",
  {
    variants: {
      size: {
        sm: "h-4 w-4",
        md: "h-6 w-6",
        lg: "h-8 w-8",
        xl: "h-10 w-10",
      },
      color: {
        default: "text-muted-foreground",
        primary: "text-primary",
        success: "text-green-600",
        warning: "text-yellow-600",
        error: "text-red-600",
        info: "text-blue-600",
      },
    },
    defaultVariants: {
      size: "md",
      color: "default",
    },
  }
);

const dotsVariants = cva(
  "flex space-x-1",
  {
    variants: {
      size: {
        sm: "space-x-0.5",
        md: "space-x-1",
        lg: "space-x-1.5",
        xl: "space-x-2",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
);

const dotVariants = cva(
  "rounded-full animate-bounce",
  {
    variants: {
      size: {
        sm: "h-1 w-1",
        md: "h-1.5 w-1.5",
        lg: "h-2 w-2",
        xl: "h-2.5 w-2.5",
      },
      color: {
        default: "bg-muted-foreground",
        primary: "bg-primary",
        success: "bg-green-600",
        warning: "bg-yellow-600",
        error: "bg-red-600",
        info: "bg-blue-600",
      },
    },
    defaultVariants: {
      size: "md",
      color: "default",
    },
  }
);

const pulseVariants = cva(
  "rounded-full animate-pulse",
  {
    variants: {
      size: {
        sm: "h-4 w-4",
        md: "h-6 w-6",
        lg: "h-8 w-8",
        xl: "h-10 w-10",
      },
      color: {
        default: "bg-muted-foreground",
        primary: "bg-primary",
        success: "bg-green-600",
        warning: "bg-yellow-600",
        error: "bg-red-600",
        info: "bg-blue-600",
      },
    },
    defaultVariants: {
      size: "md",
      color: "default",
    },
  }
);

const barsVariants = cva(
  "flex space-x-0.5 items-end",
  {
    variants: {
      size: {
        sm: "space-x-0.5",
        md: "space-x-0.5",
        lg: "space-x-1",
        xl: "space-x-1",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
);

const barVariants = cva(
  "animate-pulse",
  {
    variants: {
      size: {
        sm: "w-0.5 h-3",
        md: "w-1 h-4",
        lg: "w-1 h-6",
        xl: "w-1.5 h-8",
      },
      color: {
        default: "bg-muted-foreground",
        primary: "bg-primary",
        success: "bg-green-600",
        warning: "bg-yellow-600",
        error: "bg-red-600",
        info: "bg-blue-600",
      },
    },
    defaultVariants: {
      size: "md",
      color: "default",
    },
  }
);

interface LoadingSpinnerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof spinnerVariants> {
  variant?: "spin" | "dots" | "pulse" | "bars" | "ring";
  label?: string;
  overlay?: boolean;
}

export const LoadingSpinner = React.forwardRef<HTMLDivElement, LoadingSpinnerProps>(
  ({ 
    className, 
    variant = "spin", 
    size = "md", 
    color = "default", 
    label,
    overlay = false,
    ...props 
  }, ref) => {
    const renderSpinner = () => {
      switch (variant) {
        case "spin":
          return (
            <svg
              className={cn(spinnerVariants({ size, color }))}
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          );
        
        case "dots":
          return (
            <div className={cn(dotsVariants({ size }))}>
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className={cn(dotVariants({ size, color }))}
                  style={{
                    animationDelay: `${i * 0.1}s`,
                    animationDuration: "0.6s",
                  }}
                />
              ))}
            </div>
          );
        
        case "pulse":
          return <div className={cn(pulseVariants({ size, color }))} />;
        
        case "bars":
          return (
            <div className={cn(barsVariants({ size }))}>
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={cn(barVariants({ size, color }))}
                  style={{
                    animationDelay: `${i * 0.1}s`,
                    animationDuration: "0.8s",
                  }}
                />
              ))}
            </div>
          );
        
        case "ring":
          return (
            <div
              className={cn(
                "animate-spin rounded-full border-2 border-current border-t-transparent",
                size === "sm" && "h-4 w-4",
                size === "md" && "h-6 w-6",
                size === "lg" && "h-8 w-8",
                size === "xl" && "h-10 w-10",
                color === "default" && "text-muted-foreground",
                color === "primary" && "text-primary",
                color === "success" && "text-green-600",
                color === "warning" && "text-yellow-600",
                color === "error" && "text-red-600",
                color === "info" && "text-blue-600"
              )}
            />
          );
        
        default:
          return null;
      }
    };

    const content = (
      <div 
        ref={ref}
        className={cn(
          "flex items-center justify-center",
          label && "gap-3",
          className
        )}
        {...props}
      >
        {renderSpinner()}
        {label && (
          <span className={cn(
            "text-sm text-muted-foreground font-medium",
            size === "sm" && "text-xs",
            size === "lg" && "text-base",
            size === "xl" && "text-lg"
          )}>
            {label}
          </span>
        )}
      </div>
    );

    if (overlay) {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          {content}
        </div>
      );
    }

    return content;
  }
);

LoadingSpinner.displayName = "LoadingSpinner";

interface LoadingInlineProps {
  isLoading?: boolean;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  color?: "default" | "primary" | "success" | "warning" | "error" | "info";
}

export const LoadingInline: React.FC<LoadingInlineProps> = ({ 
  isLoading = false, 
  children, 
  size = "sm",
  color = "default" 
}) => {
  return (
    <div className="flex items-center gap-2">
      {isLoading && <LoadingSpinner variant="spin" size={size} color={color} />}
      <span className={cn(
        isLoading && "text-muted-foreground",
        "transition-colors duration-200"
      )}>
        {children}
      </span>
    </div>
  );
};