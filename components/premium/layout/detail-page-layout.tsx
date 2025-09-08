"use client";

import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ArrowLeft, MoreHorizontal } from "lucide-react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface DetailPageLayoutProps {
  children: ReactNode;
  sidebar?: ReactNode;
  backHref?: string;
  backLabel?: string;
  title: string;
  subtitle?: string;
  status?: {
    label: string;
    color?: "default" | "cyan" | "green" | "amber" | "red" | "purple" | "gray";
    variant?: "default" | "soft" | "solid" | "outlined";
  };
  badges?: Array<{
    label: string;
    color?: "default" | "cyan" | "green" | "amber" | "red" | "purple" | "gray";
    variant?: "default" | "soft" | "solid" | "outlined";
  }>;
  actions?: Array<{
    label: string;
    icon?: ReactNode;
    variant?: "default" | "outline" | "gradient" | "ghost";
    color?: "cyan" | "green" | "amber" | "red" | "purple";
    onClick?: () => void;
    href?: string;
    disabled?: boolean;
    customElement?: ReactNode;
  }>;
  moreActions?: Array<{
    label: string;
    icon?: ReactNode;
    onClick?: () => void;
    href?: string;
    disabled?: boolean;
    destructive?: boolean;
  }>;
  maxWidth?: "default" | "wide" | "full";
  noPadding?: boolean;
  className?: string;
}

export function DetailPageLayout({
  children,
  sidebar,
  backHref = "/",
  backLabel = "Back",
  title,
  subtitle,
  status,
  badges,
  actions,
  moreActions,
  maxWidth = "default",
  noPadding = false,
  className,
}: DetailPageLayoutProps) {
  const maxWidthClasses = {
    default: "max-w-7xl mx-auto",
    wide: "max-w-[1600px] mx-auto",
    full: "",
  };

  const hasActions = actions?.length || moreActions?.length;

  return (
    <div className={cn("flex flex-col h-full bg-gradient-to-b from-primary/[0.02] to-transparent", className)}>
      {/* Header */}
      <div className="border-b bg-gradient-to-b from-primary/5 via-primary/2 to-transparent">
        <div className={cn("w-full", maxWidthClasses[maxWidth], !noPadding && "px-4 lg:px-6")}>
          <div className="py-6 space-y-4">
            {/* Back Navigation */}
            <Link href={backHref}>
              <Button variant="ghost" size="sm" className="h-8 gap-2 -ml-2">
                <ArrowLeft className="h-4 w-4" />
                {backLabel}
              </Button>
            </Link>

            {/* Title Section */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl font-semibold tracking-tight truncate">
                    {title}
                  </h1>
                  {status && (
                    <Badge 
                      variant={status.variant || "soft"} 
                      color={status.color}
                      size="sm"
                    >
                      {status.label}
                    </Badge>
                  )}
                  {badges?.map((badge, idx) => (
                    <Badge 
                      key={idx}
                      variant={badge.variant || "soft"} 
                      color={badge.color}
                      size="sm"
                    >
                      {badge.label}
                    </Badge>
                  ))}
                </div>
                {subtitle && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {subtitle}
                  </p>
                )}
              </div>

              {/* Actions */}
              {hasActions && (
                <div className="flex items-center gap-2">
                  {actions?.map((action, idx) => 
                    action.customElement ? (
                      <div key={idx}>{action.customElement}</div>
                    ) : action.href ? (
                      <Link key={idx} href={action.href}>
                        <Button
                          variant={action.variant || "default"}
                          size="sm"
                          disabled={action.disabled}
                          className={cn(
                            action.color && action.variant === "gradient" && 
                            `bg-gradient-to-r from-${action.color}-500 to-${action.color}-600 text-white hover:from-${action.color}-600 hover:to-${action.color}-700`
                          )}
                        >
                          {action.icon}
                          {action.label}
                        </Button>
                      </Link>
                    ) : (
                      <Button
                        key={idx}
                        variant={action.variant || "default"}
                        size="sm"
                        onClick={action.onClick}
                        disabled={action.disabled}
                        className={cn(
                          action.color && action.variant === "gradient" && 
                          `bg-gradient-to-r from-${action.color}-500 to-${action.color}-600 text-white hover:from-${action.color}-600 hover:to-${action.color}-700`
                        )}
                      >
                        {action.icon}
                        {action.label}
                      </Button>
                    )
                  )}
                  
                  {moreActions && moreActions.length > 0 && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {moreActions.map((action, idx) => (
                          action.href ? (
                            <Link key={idx} href={action.href}>
                              <DropdownMenuItem
                                disabled={action.disabled}
                                className={cn(
                                  action.destructive && "text-destructive focus:text-destructive"
                                )}
                              >
                                {action.icon}
                                {action.label}
                              </DropdownMenuItem>
                            </Link>
                          ) : (
                            <DropdownMenuItem
                              key={idx}
                              onClick={action.onClick}
                              disabled={action.disabled}
                              className={cn(
                                action.destructive && "text-destructive focus:text-destructive"
                              )}
                            >
                              {action.icon}
                              {action.label}
                            </DropdownMenuItem>
                          )
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className={cn("w-full", maxWidthClasses[maxWidth], !noPadding && "px-4 lg:px-6 py-6")}>
          {sidebar ? (
            <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
              <div className="min-w-0">
                {children}
              </div>
              <div className="space-y-6">
                {sidebar}
              </div>
            </div>
          ) : (
            children
          )}
        </div>
      </div>
    </div>
  );
}