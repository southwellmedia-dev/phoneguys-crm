/**
 * InfoCard Component
 * 
 * @description A card component for displaying labeled information with optional icon and action
 * @category Cards
 * 
 * @example
 * ```tsx
 * <InfoCard
 *   label="Email"
 *   value="user@example.com"
 *   icon={<Mail className="h-4 w-4" />}
 *   action={<Button size="sm">Send</Button>}
 * />
 * ```
 */

import * as React from "react";
import { cn } from "@/lib/utils";

interface InfoCardProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  value: string | React.ReactNode;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  variant?: "default" | "compact";
}

export const InfoCard = React.forwardRef<HTMLDivElement, InfoCardProps>(
  ({ 
    className, 
    label, 
    value, 
    icon, 
    action,
    variant = "default",
    ...props 
  }, ref) => {
    const isCompact = variant === "compact";
    
    return (
      <div
        ref={ref}
        className={cn(
          "flex items-start gap-3 group",
          isCompact ? "py-2 px-2" : "py-3 px-2",
          "border-b border-border/50 last:border-0",
          className
        )}
        {...props}
      >
        {icon && (
          <div className={cn(
            "flex items-center justify-center rounded-lg",
            "bg-primary/10 text-primary",
            isCompact ? "h-8 w-8" : "h-9 w-9",
            "mt-0.5"
          )}>
            {React.isValidElement(icon) && React.cloneElement(icon as React.ReactElement<any>, {
              className: cn("h-4 w-4", (icon as any).props?.className)
            })}
          </div>
        )}
        
        <div className="flex-1 min-w-0 space-y-0.5">
          <p className={cn(
            "text-xs text-muted-foreground font-medium uppercase tracking-wider",
            isCompact ? "text-[10px]" : "text-xs"
          )}>
            {label}
          </p>
          <div className={cn(
            "font-medium text-foreground",
            isCompact ? "text-sm" : "text-sm",
            typeof value === 'string' && value.length > 50 && "break-words"
          )}>
            {value}
          </div>
        </div>
        
        {action && (
          <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            {action}
          </div>
        )}
      </div>
    );
  }
);

InfoCard.displayName = "InfoCard";