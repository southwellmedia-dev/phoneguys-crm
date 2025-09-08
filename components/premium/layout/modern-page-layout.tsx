"use client";

import { cn } from "@/lib/utils";
import { PageHeader, PageHeaderProps } from "./page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import React from "react";

export interface ModernPageLayoutProps extends PageHeaderProps {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: "full" | "7xl" | "6xl" | "5xl";
  noPadding?: boolean;
  className?: string;
}

export function ModernPageLayout({
  children,
  sidebar,
  footer,
  maxWidth = "full",
  noPadding = false,
  className,
  // PageHeader props
  title,
  subtitle,
  backButton,
  backHref,
  breadcrumbs,
  actions,
  badge,
  meta,
  ...headerProps
}: ModernPageLayoutProps) {
  const maxWidthClasses = {
    full: "max-w-full",
    "7xl": "max-w-7xl mx-auto",
    "6xl": "max-w-6xl mx-auto",
    "5xl": "max-w-5xl mx-auto"
  };

  return (
    <div className={cn("h-full overflow-y-auto bg-background", className)}>
      {/* Header with Light Blue Gradient Background - Matching sidebar logo height */}
      <div className="h-28 border-b bg-gradient-to-b from-primary/5 via-primary/2 to-transparent flex items-center">
        <div className={cn(
          "w-full",
          maxWidthClasses[maxWidth],
          !noPadding && "px-4 lg:px-6"
        )}>
          <PageHeader
            title={title}
            subtitle={subtitle}
            backButton={backButton}
            backHref={backHref}
            breadcrumbs={breadcrumbs}
            actions={actions}
            badge={badge}
            meta={meta}
            {...headerProps}
          />
        </div>
      </div>

      {/* Main Content Area */}
      <main className={cn(
        "flex-1",
        !noPadding && "px-4 lg:px-6 py-3"
      )}>
        <div className={cn(maxWidthClasses[maxWidth])}>
          {sidebar ? (
            <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
              <div className="min-w-0">{children}</div>
              <aside className="space-y-6">{sidebar}</aside>
            </div>
          ) : (
            children
          )}
        </div>
      </main>

      {/* Footer */}
      {footer && (
        <footer className={cn(
          "border-t bg-muted/30",
          !noPadding && "px-4 lg:px-6 py-3"
        )}>
          <div className={cn(maxWidthClasses[maxWidth])}>
            {footer}
          </div>
        </footer>
      )}
    </div>
  );
}

// Split Layout for Detail Pages (e.g., Customer Detail, Ticket Detail)
export interface DetailPageLayoutProps {
  title: string;
  subtitle?: string;
  entity?: {
    type: string; // "Customer", "Ticket", "Device", etc.
    id: string;
    status?: string;
    avatar?: React.ReactNode;
  };
  tabs?: React.ReactNode;
  actions?: PageHeaderProps["actions"];
  meta?: PageHeaderProps["meta"];
  children: React.ReactNode;
  sidebar?: React.ReactNode;
  className?: string;
}

export function DetailPageLayout({
  title,
  subtitle,
  entity,
  tabs,
  actions,
  meta,
  children,
  sidebar,
  className
}: DetailPageLayoutProps) {
  return (
    <div className={cn("min-h-screen bg-background", className)}>
      {/* Premium Header with Entity Info */}
      <header className="border-b bg-gradient-to-b from-primary/5 to-transparent">
        <div className="px-6 lg:px-8">
          <div className="mx-auto max-w-7xl py-8">
            {/* Entity Badge */}
            {entity && (
              <div className="mb-4 flex items-center gap-2">
                <Badge variant="soft" color="blue" size="sm">
                  {entity.type} #{entity.id}
                </Badge>
                {entity.status && (
                  <Badge 
                    variant="soft" 
                    color={entity.status === "active" ? "green" : "gray"}
                    size="sm"
                  >
                    {entity.status}
                  </Badge>
                )}
              </div>
            )}

            {/* Main Header */}
            <div className="flex items-start justify-between gap-6">
              <div className="flex items-start gap-4">
                {entity?.avatar && (
                  <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                    {entity.avatar}
                  </div>
                )}
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
                  {subtitle && (
                    <p className="mt-1 text-muted-foreground">{subtitle}</p>
                  )}
                  {meta && meta.length > 0 && (
                    <div className="mt-3 flex flex-wrap items-center gap-4">
                      {meta.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-1.5 text-sm">
                          {item.icon && (
                            <span className="text-muted-foreground">{item.icon}</span>
                          )}
                          <span className="text-muted-foreground">{item.label}:</span>
                          <span className="font-medium">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              {actions && actions.length > 0 && (
                <div className="flex items-center gap-2">
                  {actions.map((action, idx) => (
                    <Button
                      key={idx}
                      variant={action.variant || "default"}
                      onClick={action.onClick}
                      disabled={action.disabled}
                    >
                      {action.icon && <span className="mr-2">{action.icon}</span>}
                      {action.label}
                    </Button>
                  ))}
                </div>
              )}
            </div>

            {/* Tabs */}
            {tabs && <div className="mt-6">{tabs}</div>}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="px-6 lg:px-8 py-8">
        <div className="mx-auto max-w-7xl">
          {sidebar ? (
            <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
              <div className="min-w-0">{children}</div>
              <aside className="space-y-6">{sidebar}</aside>
            </div>
          ) : (
            children
          )}
        </div>
      </main>
    </div>
  );
}

// Compact Layout for Modals/Drawers
export interface CompactPageLayoutProps {
  title: string;
  description?: string;
  actions?: PageHeaderProps["actions"];
  children: React.ReactNode;
  className?: string;
}

export function CompactPageLayout({
  title,
  description,
  actions,
  children,
  className
}: CompactPageLayoutProps) {
  return (
    <div className={cn("flex flex-col", className)}>
      <div className="flex items-center justify-between p-6 border-b">
        <div>
          <h2 className="text-xl font-semibold">{title}</h2>
          {description && (
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          )}
        </div>
        {actions && actions.length > 0 && (
          <div className="flex items-center gap-2">
            {actions.map((action, idx) => (
              <Button
                key={idx}
                variant={action.variant || "default"}
                size="sm"
                onClick={action.onClick}
              >
                {action.label}
              </Button>
            ))}
          </div>
        )}
      </div>
      <div className="flex-1 p-6">
        {children}
      </div>
    </div>
  );
}