/**
 * Premium Progress Bar Component
 * 
 * @description Fintech-style progress indicators with clean design
 * @category Feedback
 * 
 * @example
 * ```tsx
 * <ProgressBar 
 *   value={75} 
 *   variant="primary"
 *   label="Upload Progress"
 *   showValue
 *   animated
 * />
 * 
 * <SegmentedProgressBar
 *   segments={[
 *     { value: 30, color: "#0094CA", label: "Completed" },
 *     { value: 20, color: "#F59E0B", label: "In Progress" }
 *   ]}
 *   max={100}
 * />
 * ```
 */

import * as React from "react";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const progressContainerVariants = cva(
  "relative w-full overflow-hidden rounded-full bg-muted",
  {
    variants: {
      size: {
        sm: "h-1.5",
        md: "h-2",
        lg: "h-3",
        xl: "h-4",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
);

const progressBarVariants = cva(
  "h-full transition-all duration-300 ease-out",
  {
    variants: {
      variant: {
        default: "bg-foreground",
        primary: "bg-primary",
        success: "bg-green-600",
        warning: "bg-yellow-600",
        error: "bg-red-600",
        info: "bg-blue-600",
        gradient: "bg-gradient-to-r from-primary to-primary/80",
        striped: "bg-primary bg-striped",
      },
      animated: {
        true: "bg-striped-animated",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      animated: false,
    },
  }
);

interface ProgressBarProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof progressContainerVariants>,
    VariantProps<typeof progressBarVariants> {
  value?: number;
  max?: number;
  label?: string;
  showValue?: boolean;
  indeterminate?: boolean;
}

export const ProgressBar = React.forwardRef<HTMLDivElement, ProgressBarProps>(
  ({ 
    className,
    value = 0,
    max = 100,
    size = "md",
    variant = "default",
    animated = false,
    label,
    showValue = false,
    indeterminate = false,
    ...props 
  }, ref) => {
    const percentage = indeterminate ? 100 : Math.min(Math.max((value / max) * 100, 0), 100);

    return (
      <div className="w-full space-y-2">
        {(label || showValue) && (
          <div className="flex justify-between items-center text-sm">
            {label && (
              <span className="font-medium text-foreground">{label}</span>
            )}
            {showValue && !indeterminate && (
              <span className="text-muted-foreground">
                {Math.round(percentage)}%
              </span>
            )}
            {indeterminate && (
              <span className="text-muted-foreground">Loading...</span>
            )}
          </div>
        )}
        
        <div
          ref={ref}
          className={cn(progressContainerVariants({ size }), className)}
          {...props}
        >
          <div
            className={cn(
              progressBarVariants({ variant, animated }),
              indeterminate && "animate-pulse bg-primary"
            )}
            style={{
              width: indeterminate ? "100%" : `${percentage}%`,
              animation: indeterminate 
                ? "indeterminate 1.5s ease-in-out infinite"
                : undefined,
            }}
          />
        </div>
      </div>
    );
  }
);

ProgressBar.displayName = "ProgressBar";

// Segmented Progress Bar for multiple segments
interface Segment {
  value: number;
  color: string;
  label?: string;
}

interface SegmentedProgressBarProps extends React.HTMLAttributes<HTMLDivElement> {
  segments: Segment[];
  max?: number;
  size?: "sm" | "md" | "lg" | "xl";
  label?: string;
  showValue?: boolean;
  showLabels?: boolean;
}

export const SegmentedProgressBar = React.forwardRef<HTMLDivElement, SegmentedProgressBarProps>(
  ({ 
    className,
    segments,
    max = 100,
    size = "md",
    label,
    showValue = false,
    showLabels = false,
    ...props 
  }, ref) => {
    const totalValue = segments.reduce((sum, segment) => sum + segment.value, 0);
    const totalPercentage = Math.min((totalValue / max) * 100, 100);

    return (
      <div className="w-full space-y-2">
        {(label || showValue) && (
          <div className="flex justify-between items-center text-sm">
            {label && (
              <span className="font-medium text-foreground">{label}</span>
            )}
            {showValue && (
              <span className="text-muted-foreground">
                {Math.round(totalPercentage)}%
              </span>
            )}
          </div>
        )}
        
        <div
          ref={ref}
          className={cn(progressContainerVariants({ size }), className)}
          {...props}
        >
          {segments.map((segment, index) => {
            const segmentPercentage = (segment.value / max) * 100;
            return (
              <div
                key={index}
                className="h-full transition-all duration-300 ease-out"
                style={{
                  width: `${segmentPercentage}%`,
                  backgroundColor: segment.color,
                  marginLeft: index === 0 ? "0%" : "0%",
                  position: index === 0 ? "relative" : "absolute",
                  left: index === 0 ? "auto" : `${segments.slice(0, index).reduce((sum, s) => sum + (s.value / max) * 100, 0)}%`,
                }}
              />
            );
          })}
        </div>

        {showLabels && segments.length > 0 && (
          <div className="flex flex-wrap gap-4 text-xs">
            {segments.map((segment, index) => (
              segment.label && (
                <div key={index} className="flex items-center gap-1.5">
                  <div
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: segment.color }}
                  />
                  <span className="text-muted-foreground">
                    {segment.label}: {segment.value}
                  </span>
                </div>
              )
            ))}
          </div>
        )}
      </div>
    );
  }
);

SegmentedProgressBar.displayName = "SegmentedProgressBar";

// Add custom CSS for striped animations
const progressStyles = `
  @keyframes indeterminate {
    0% {
      transform: translateX(-100%);
    }
    100% {
      transform: translateX(100%);
    }
  }
  
  .bg-striped {
    background-image: linear-gradient(
      45deg,
      rgba(255, 255, 255, 0.1) 25%,
      transparent 25%,
      transparent 50%,
      rgba(255, 255, 255, 0.1) 50%,
      rgba(255, 255, 255, 0.1) 75%,
      transparent 75%,
      transparent
    );
    background-size: 1rem 1rem;
  }
  
  .bg-striped-animated {
    background-image: linear-gradient(
      45deg,
      rgba(255, 255, 255, 0.1) 25%,
      transparent 25%,
      transparent 50%,
      rgba(255, 255, 255, 0.1) 50%,
      rgba(255, 255, 255, 0.1) 75%,
      transparent 75%,
      transparent
    );
    background-size: 1rem 1rem;
    animation: progress-bar-stripes 1s linear infinite;
  }
  
  @keyframes progress-bar-stripes {
    0% {
      background-position: 1rem 0;
    }
    100% {
      background-position: 0 0;
    }
  }
`;

if (typeof document !== "undefined") {
  const styleElement = document.createElement("style");
  styleElement.textContent = progressStyles;
  document.head.appendChild(styleElement);
}