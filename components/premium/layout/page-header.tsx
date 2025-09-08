"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, MoreHorizontal } from "lucide-react";
import { useRouter } from "next/navigation";
import React from "react";

export interface PageHeaderAction {
  label: string;
  onClick?: () => void;
  href?: string;
  variant?: "default" | "gradient" | "solid" | "outline" | "ghost";
  color?: "cyan" | "green" | "red" | "amber";
  icon?: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  customElement?: React.ReactNode;
}

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  backButton?: boolean;
  backHref?: string;
  breadcrumbs?: Array<{
    label: string;
    href?: string;
  }>;
  actions?: PageHeaderAction[];
  badge?: {
    label: string;
    variant?: "solid" | "soft" | "outline";
    color?: "cyan" | "green" | "red" | "amber" | "blue" | "purple" | "gray";
  };
  meta?: Array<{
    label: string;
    value: string | number;
    icon?: React.ReactNode;
  }>;
  className?: string;
  children?: React.ReactNode;
}

export function PageHeader({
  title,
  subtitle,
  backButton,
  backHref,
  breadcrumbs,
  actions = [],
  badge,
  meta,
  className,
  children
}: PageHeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    if (backHref) {
      router.push(backHref);
    } else {
      router.back();
    }
  };

  return (
    <div className={cn("w-full", className)}>
      <div className="flex flex-col justify-center h-full">
        {/* Breadcrumbs if present */}
        {(backButton || breadcrumbs) && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
            {backButton && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="h-6 px-2 -ml-2"
              >
                <ChevronLeft className="h-3 w-3 mr-1" />
                Back
              </Button>
            )}
            
            {breadcrumbs && (
              <nav className="flex items-center gap-1">
                {breadcrumbs.map((crumb, idx) => (
                  <React.Fragment key={idx}>
                    {idx > 0 && <span className="text-muted-foreground/50 mx-1">/</span>}
                    {crumb.href ? (
                      <a
                        href={crumb.href}
                        className="hover:text-foreground transition-colors"
                      >
                        {crumb.label}
                      </a>
                    ) : (
                      <span className="text-foreground font-medium">{crumb.label}</span>
                    )}
                  </React.Fragment>
                ))}
              </nav>
            )}
          </div>
        )}
        
        {/* Main Header Content */}
        <div className="flex items-center justify-between gap-8">
          {/* Left side - Title and info */}
          <div className="flex items-center gap-6 flex-1 min-w-0">
            {/* Title Section */}
            <div className="shrink-0">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl font-semibold tracking-tight whitespace-nowrap">
                  {title}
                </h1>
                {badge && (
                  <Badge 
                    variant={badge.variant || "soft"} 
                    color={badge.color || "cyan"}
                    size="sm"
                  >
                    {badge.label}
                  </Badge>
                )}
              </div>
              {subtitle && (
                <p className="text-sm text-muted-foreground whitespace-nowrap">
                  {subtitle}
                </p>
              )}
            </div>

            {/* Vertical Divider */}
            {meta && meta.length > 0 && (
              <div className="h-10 w-px bg-border shrink-0" />
            )}

            {/* Meta Information */}
            {meta && meta.length > 0 && (
              <div className="flex items-center gap-4 overflow-hidden">
                {meta.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 px-3 py-1.5 bg-background/60 backdrop-blur rounded-lg border border-border/50 shrink-0">
                    {item.icon && (
                      <div className="text-primary/70">
                        {React.cloneElement(item.icon as any, { className: "h-4 w-4" })}
                      </div>
                    )}
                    <div>
                      <span className="text-sm font-medium whitespace-nowrap">{item.value}</span>
                      <span className="text-xs text-muted-foreground ml-1">{item.label}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right side - Actions */}
          {actions.length > 0 && (
            <div className="flex items-center gap-2 shrink-0">
              {actions.slice(0, 4).map((action, idx) => {
                // Render custom element if provided
                if (action.customElement) {
                  return action.customElement;
                }
                
                // Otherwise render button
                return (
                  <Button
                    key={idx}
                    variant={action.variant || "default"}
                    color={action.color}
                    onClick={action.onClick}
                    disabled={action.disabled}
                    loading={action.loading}
                    size="default"
                    className={cn(
                      action.variant === "gradient" && "shadow-sm"
                    )}
                  >
                    {action.icon && <span className="mr-2">{action.icon}</span>}
                    {action.label}
                  </Button>
                );
              })}
              
              {actions.length > 4 && (
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </div>
        
        {/* Additional Content Slot */}
        {children}
      </div>
    </div>
  );
}