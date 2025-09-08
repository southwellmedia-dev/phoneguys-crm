/**
 * Premium Tab Navigation Component
 * 
 * @description Clean, fintech-style tab navigation
 * @category Navigation
 * 
 * @example
 * ```tsx
 * <TabNav
 *   tabs={[
 *     { value: 'orders', label: 'Orders', count: 12 },
 *     { value: 'customers', label: 'Customers' },
 *     { value: 'appointments', label: 'Appointments', count: 3 }
 *   ]}
 *   value={activeTab}
 *   onChange={setActiveTab}
 *   variant="underline"
 * />
 * ```
 */

import * as React from "react";
import { cn } from "@/lib/utils";

interface Tab {
  id: string;
  label: string;
  count?: number;
  icon?: React.ReactNode;
  disabled?: boolean;
}

interface TabNavProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  variant?: "default" | "pills" | "underline" | "enclosed" | "contrast";
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const TabNav: React.FC<TabNavProps> = ({
  tabs,
  activeTab,
  onTabChange,
  variant = "default",
  size = "md",
  className
}) => {
  const sizeClasses = {
    sm: "text-xs py-1.5 px-3",
    md: "text-sm py-2 px-4",
    lg: "text-base py-2.5 px-5"
  };

  if (variant === "underline") {
    return (
      <div className={cn("border-b border-border", className)}>
        <nav className="flex space-x-6 -mb-px">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => !tab.disabled && onTabChange(tab.id)}
              disabled={tab.disabled}
              className={cn(
                "inline-flex items-center gap-2 border-b-2 transition-all",
                sizeClasses[size],
                activeTab === tab.id
                  ? "border-primary text-foreground font-medium"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border",
                tab.disabled && "opacity-50 cursor-not-allowed"
              )}
            >
              {tab.icon && <span className="shrink-0">{tab.icon}</span>}
              {tab.label}
              {tab.count !== undefined && (
                <span className={cn(
                  "ml-1 rounded-full px-2 py-0.5 text-xs",
                  activeTab === tab.id
                    ? "bg-primary/10 text-primary"
                    : "bg-muted text-muted-foreground"
                )}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>
    );
  }

  if (variant === "pills") {
    return (
      <div className={cn("inline-flex p-1 bg-muted rounded-lg", className)}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => !tab.disabled && onTabChange(tab.id)}
            disabled={tab.disabled}
            className={cn(
              "inline-flex items-center gap-2 rounded-md transition-all",
              sizeClasses[size],
              activeTab === tab.id
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
              tab.disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            {tab.icon && <span className="shrink-0">{tab.icon}</span>}
            {tab.label}
            {tab.count !== undefined && (
              <span className={cn(
                "ml-1 rounded-full px-1.5 py-0.5 text-xs font-medium",
                activeTab === tab.id
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground"
              )}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>
    );
  }

  if (variant === "contrast") {
    return (
      <div className={cn("inline-flex p-1 bg-card/80 backdrop-blur-sm border border-border/50 rounded-lg shadow-sm", className)}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => !tab.disabled && onTabChange(tab.id)}
            disabled={tab.disabled}
            className={cn(
              "inline-flex items-center gap-2 rounded-md transition-all font-medium",
              sizeClasses[size],
              activeTab === tab.id
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-background/50",
              tab.disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            {tab.icon && <span className="shrink-0">{tab.icon}</span>}
            {tab.label}
            {tab.count !== undefined && (
              <span className={cn(
                "ml-1 rounded-full px-1.5 py-0.5 text-xs font-medium",
                activeTab === tab.id
                  ? "bg-primary-foreground/20 text-primary-foreground"
                  : "bg-background text-muted-foreground"
              )}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>
    );
  }

  // Default and Enclosed variants
  const isEnclosed = variant === "enclosed";
  
  return (
    <div className={cn(
      isEnclosed ? "inline-flex p-1 bg-muted rounded-lg" : "flex gap-1", 
      className
    )}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => !tab.disabled && onTabChange(tab.id)}
          disabled={tab.disabled}
          className={cn(
            "inline-flex items-center gap-2 rounded-lg transition-all",
            sizeClasses[size],
            activeTab === tab.id
              ? isEnclosed 
                ? "bg-background text-foreground shadow-sm"
                : "bg-primary/10 text-primary font-medium"
              : "text-muted-foreground hover:text-foreground hover:bg-muted",
            tab.disabled && "opacity-50 cursor-not-allowed"
          )}
        >
          {tab.icon && <span className="shrink-0">{tab.icon}</span>}
          {tab.label}
          {tab.count !== undefined && (
            <span className={cn(
              "ml-1 rounded-md px-1.5 py-0.5 text-xs font-medium",
              activeTab === tab.id
                ? isEnclosed
                  ? "bg-primary/10 text-primary"
                  : "bg-primary text-primary-foreground"
                : "bg-muted-foreground/10 text-muted-foreground"
            )}>
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
};