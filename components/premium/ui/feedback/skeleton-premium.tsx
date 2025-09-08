/**
 * Premium Skeleton Component
 * 
 * @description Fintech-style skeleton loaders with clean animations
 * @category Feedback
 * 
 * @example
 * ```tsx
 * <SkeletonPremium variant="title" className="w-3/4" />
 * <SkeletonPremium variant="text" className="w-full" />
 * <SkeletonCard animated lines={3} />
 * <SkeletonTable rows={5} columns={4} />
 * ```
 */

import * as React from "react";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const skeletonVariants = cva(
  "rounded-md bg-muted transition-all",
  {
    variants: {
      variant: {
        default: "h-4",
        title: "h-6",
        text: "h-4",
        avatar: "h-10 w-10 rounded-full",
        button: "h-9 w-20",
        image: "h-20 w-20",
        card: "h-32 w-full",
      },
      animation: {
        pulse: "animate-pulse",
        shimmer: "animate-shimmer",
        wave: "animate-wave",
        none: "",
      },
    },
    defaultVariants: {
      variant: "default",
      animation: "pulse",
    },
  }
);

interface SkeletonPremiumProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof skeletonVariants> {}

export const SkeletonPremium = React.forwardRef<HTMLDivElement, SkeletonPremiumProps>(
  ({ className, variant = "default", animation = "pulse", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(skeletonVariants({ variant, animation }), className)}
        {...props}
      />
    );
  }
);

SkeletonPremium.displayName = "SkeletonPremium";

// Preset skeleton components for common use cases

interface SkeletonCardProps extends React.HTMLAttributes<HTMLDivElement> {
  animated?: boolean;
  lines?: number;
  showAvatar?: boolean;
}

export const SkeletonCard = React.forwardRef<HTMLDivElement, SkeletonCardProps>(
  ({ className, animated = true, lines = 2, showAvatar = false, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("rounded-lg border bg-card p-4 space-y-3", className)}
        {...props}
      >
        {showAvatar && (
          <div className="flex items-center space-x-3">
            <SkeletonPremium 
              variant="avatar" 
              animation={animated ? "pulse" : "none"}
            />
            <div className="space-y-2 flex-1">
              <SkeletonPremium 
                variant="text" 
                className="w-1/3" 
                animation={animated ? "pulse" : "none"}
              />
              <SkeletonPremium 
                variant="text" 
                className="w-1/2" 
                animation={animated ? "pulse" : "none"}
              />
            </div>
          </div>
        )}
        
        <SkeletonPremium 
          variant="title" 
          className="w-3/4" 
          animation={animated ? "pulse" : "none"}
        />
        
        <div className="space-y-2">
          {Array.from({ length: lines }).map((_, i) => (
            <SkeletonPremium
              key={i}
              variant="text"
              className={i === lines - 1 ? "w-2/3" : "w-full"}
              animation={animated ? "pulse" : "none"}
            />
          ))}
        </div>
      </div>
    );
  }
);

SkeletonCard.displayName = "SkeletonCard";

interface SkeletonTableProps extends React.HTMLAttributes<HTMLDivElement> {
  rows?: number;
  columns?: number;
  showHeader?: boolean;
}

export const SkeletonTable = React.forwardRef<HTMLDivElement, SkeletonTableProps>(
  ({ className, rows = 5, columns = 4, showHeader = true, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("w-full space-y-3", className)}
        {...props}
      >
        {showHeader && (
          <div className="grid gap-4 pb-2 border-b" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
            {Array.from({ length: columns }).map((_, i) => (
              <SkeletonPremium
                key={i}
                variant="text"
                className="w-20 h-4"
              />
            ))}
          </div>
        )}
        
        <div className="space-y-2">
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <div
              key={rowIndex}
              className="grid gap-4 py-2"
              style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
            >
              {Array.from({ length: columns }).map((_, colIndex) => (
                <SkeletonPremium
                  key={colIndex}
                  variant="text"
                  className={cn(
                    colIndex === 0 ? "w-full" : "w-16",
                    "h-4"
                  )}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }
);

SkeletonTable.displayName = "SkeletonTable";

interface SkeletonListProps extends React.HTMLAttributes<HTMLDivElement> {
  items?: number;
  showAvatar?: boolean;
  animated?: boolean;
}

export const SkeletonList = React.forwardRef<HTMLDivElement, SkeletonListProps>(
  ({ className, items = 3, showAvatar = true, animated = true, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("space-y-3", className)}
        {...props}
      >
        {Array.from({ length: items }).map((_, i) => (
          <div key={i} className="flex items-center space-x-3 p-3 rounded-lg border">
            {showAvatar && (
              <SkeletonPremium 
                variant="avatar" 
                animation={animated ? "pulse" : "none"}
              />
            )}
            <div className="space-y-2 flex-1">
              <SkeletonPremium 
                variant="text" 
                className="w-1/3" 
                animation={animated ? "pulse" : "none"}
              />
              <SkeletonPremium 
                variant="text" 
                className="w-2/3" 
                animation={animated ? "pulse" : "none"}
              />
            </div>
            <SkeletonPremium 
              variant="button" 
              animation={animated ? "pulse" : "none"}
            />
          </div>
        ))}
      </div>
    );
  }
);

SkeletonList.displayName = "SkeletonList";

interface SkeletonFormProps extends React.HTMLAttributes<HTMLDivElement> {
  fields?: number;
}

export const SkeletonForm = React.forwardRef<HTMLDivElement, SkeletonFormProps>(
  ({ className, fields = 4, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("space-y-4", className)}
        {...props}
      >
        {Array.from({ length: fields }).map((_, i) => (
          <div key={i} className="space-y-2">
            <SkeletonPremium variant="text" className="w-24 h-4" />
            <SkeletonPremium variant="default" className="w-full h-9" />
          </div>
        ))}
        
        <div className="flex gap-2 pt-4">
          <SkeletonPremium variant="button" className="w-20" />
          <SkeletonPremium variant="button" className="w-16" />
        </div>
      </div>
    );
  }
);

SkeletonForm.displayName = "SkeletonForm";

// Custom animations
const skeletonStyles = `
  @keyframes shimmer {
    0% {
      background-position: -200px 0;
    }
    100% {
      background-position: calc(200px + 100%) 0;
    }
  }
  
  .animate-shimmer {
    background: linear-gradient(
      90deg,
      hsl(var(--muted)) 25%,
      hsl(var(--muted-foreground) / 0.1) 50%,
      hsl(var(--muted)) 75%
    );
    background-size: 200px 100%;
    animation: shimmer 1.5s infinite;
  }
  
  @keyframes wave {
    0%, 60%, 100% {
      transform: translateX(-100%);
    }
    30% {
      transform: translateX(100%);
    }
  }
  
  .animate-wave {
    position: relative;
    overflow: hidden;
  }
  
  .animate-wave::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.2),
      transparent
    );
    animation: wave 1.5s infinite;
  }
`;

if (typeof document !== "undefined") {
  const styleElement = document.createElement("style");
  styleElement.textContent = skeletonStyles;
  document.head.appendChild(styleElement);
}