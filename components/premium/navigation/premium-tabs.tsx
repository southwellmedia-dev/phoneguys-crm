"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: string | number;
  disabled?: boolean;
}

export interface PremiumTabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  variant?: "default" | "solid" | "soft" | "glass" | "gradient";
  size?: "sm" | "md" | "lg";
  className?: string;
  children?: React.ReactNode;
}

export function PremiumTabs({
  tabs,
  activeTab,
  onTabChange,
  variant = "default",
  size = "md",
  className,
  children
}: PremiumTabsProps) {
  const activeIndex = tabs.findIndex(tab => tab.id === activeTab);

  const sizeClasses = {
    sm: "text-xs h-8 px-3",
    md: "text-sm h-10 px-4",
    lg: "text-base h-12 px-6"
  };

  const getTabClasses = (tab: Tab, isActive: boolean) => {
    const base = cn(
      "relative flex items-center gap-2 font-medium transition-all duration-200",
      sizeClasses[size],
      tab.disabled && "opacity-50 cursor-not-allowed"
    );

    switch (variant) {
      case "solid":
        return cn(
          base,
          "rounded-lg transition-all",
          isActive 
            ? "bg-primary text-white shadow-elevation-2" 
            : "hover:bg-muted/50 text-muted-foreground hover:text-foreground"
        );
      
      case "soft":
        return cn(
          base,
          "rounded-lg",
          isActive
            ? "bg-primary/20 text-primary font-semibold"
            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
        );
      
      case "glass":
        return cn(
          base,
          "rounded-lg backdrop-blur-sm",
          isActive
            ? "bg-white/80 dark:bg-gray-900/80 shadow-glass text-foreground border border-white/20"
            : "text-muted-foreground hover:text-foreground hover:bg-white/50 dark:hover:bg-gray-900/50"
        );
      
      case "gradient":
        return cn(
          base,
          "rounded-lg",
          isActive
            ? "bg-gradient-brand text-white shadow-elevation-2 shadow-colored"
            : "hover:bg-muted/50 text-muted-foreground hover:text-foreground"
        );
      
      default:
        return cn(
          base,
          "rounded-lg",
          isActive
            ? "bg-muted text-foreground"
            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
        );
    }
  };

  const containerClasses = {
    default: "inline-flex gap-1 p-1 bg-muted/80 rounded-xl border shadow-sm",
    solid: "inline-flex gap-2 p-1 bg-muted/50 rounded-xl",
    soft: "inline-flex gap-1 p-1 bg-muted/60 rounded-xl border",
    glass: "inline-flex gap-1 p-1 backdrop-blur-md bg-white/70 dark:bg-gray-950/70 rounded-xl border border-white/30 shadow-glass",
    gradient: "inline-flex gap-2 p-1 bg-gradient-subtle rounded-xl border"
  };

  return (
    <div className={className}>
      <div className={cn("relative", containerClasses[variant])}>
        {(variant === "soft" || variant === "glass") && activeIndex !== -1 && (
          <motion.div
            className={cn(
              "absolute rounded-lg",
              variant === "soft" && "bg-background shadow-sm",
              variant === "glass" && "bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm border border-white/20"
            )}
            initial={false}
            animate={{
              x: activeIndex * (100 + 4) + "%",
              width: `${100 / tabs.length}%`
            }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30
            }}
            style={{
              height: "calc(100% - 8px)",
              top: "4px",
              left: "4px"
            }}
          />
        )}
        
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          
          return (
            <button
              key={tab.id}
              onClick={() => !tab.disabled && onTabChange(tab.id)}
              className={getTabClasses(tab, isActive)}
              disabled={tab.disabled}
            >
              {tab.icon && <span className="shrink-0">{tab.icon}</span>}
              <span>{tab.label}</span>
              {tab.badge && (
                <span className={cn(
                  "ml-2 px-1.5 py-0.5 rounded-full text-xs font-medium",
                  isActive 
                    ? variant === "solid" || variant === "gradient"
                      ? "bg-white/20 text-white"
                      : "bg-primary/20 text-primary"
                    : "bg-muted text-muted-foreground"
                )}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
      
      {children && (
        <div className="mt-6">
          {children}
        </div>
      )}
    </div>
  );
}

// Tab Panel Component for content
export interface TabPanelProps {
  value: string;
  activeValue: string;
  children: React.ReactNode;
  className?: string;
}

export function TabPanel({ value, activeValue, children, className }: TabPanelProps) {
  if (value !== activeValue) return null;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}