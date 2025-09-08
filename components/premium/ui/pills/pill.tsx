/**
 * Premium Pill Component
 * 
 * @description Consistent pill/badge component for tags, issues, services, etc.
 * @category UI Components
 */

import * as React from "react";
import { cn } from "@/lib/utils";
import { 
  getPillClasses, 
  getCountPillClasses, 
  formatPillText, 
  type PillType 
} from "../../utils/pill-utils";

export interface PillProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** The type of pill - determines color coding */
  type?: PillType;
  /** The text content */
  children: React.ReactNode;
  /** Custom variant override */
  variant?: string;
  /** Whether to format text (title case, replace underscores) */
  formatText?: boolean;
  /** Show as count pill ("+3 more" style) */
  isCount?: boolean;
}

export const Pill = React.forwardRef<HTMLSpanElement, PillProps>(
  ({ 
    className, 
    type = 'default', 
    children, 
    variant,
    formatText = true,
    isCount = false,
    ...props 
  }, ref) => {
    const text = typeof children === 'string' ? children : String(children);
    const displayText = formatText ? formatPillText(text) : text;
    
    const pillClasses = isCount 
      ? getCountPillClasses()
      : variant 
        ? `inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${variant}`
        : getPillClasses(type, text);
    
    return (
      <span
        ref={ref}
        className={cn(pillClasses, className)}
        {...props}
      >
        {displayText}
      </span>
    );
  }
);

Pill.displayName = "Pill";

/**
 * Pills Container - for groups of pills
 */
export interface PillsProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Array of pill items */
  items: Array<{
    text: string;
    type?: PillType;
    variant?: string;
  }>;
  /** Maximum number to show before "+X more" */
  maxVisible?: number;
  /** Type for all pills */
  type?: PillType;
  /** Whether to format text */
  formatText?: boolean;
}

export const Pills = React.forwardRef<HTMLDivElement, PillsProps>(
  ({ 
    className, 
    items, 
    maxVisible = 3, 
    type = 'default',
    formatText = true,
    ...props 
  }, ref) => {
    const visibleItems = items.slice(0, maxVisible);
    const hiddenCount = Math.max(0, items.length - maxVisible);
    
    return (
      <div
        ref={ref}
        className={cn("flex flex-wrap gap-1", className)}
        {...props}
      >
        {visibleItems.map((item, idx) => (
          <Pill
            key={idx}
            type={item.type || type}
            variant={item.variant}
            formatText={formatText}
          >
            {item.text}
          </Pill>
        ))}
        {hiddenCount > 0 && (
          <Pill isCount>
            +{hiddenCount}
          </Pill>
        )}
      </div>
    );
  }
);

Pills.displayName = "Pills";