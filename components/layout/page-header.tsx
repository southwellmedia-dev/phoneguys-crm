"use client";

import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { LogoutButton } from "@/components/logout-button";
import { Menu, Plus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";

export interface HeaderAction {
  label?: string;
  href?: string;
  onClick?: () => void;
  icon?: ReactNode;
  variant?: "default" | "outline" | "ghost" | "secondary" | "destructive";
  className?: string;
  disabled?: boolean;
  component?: ReactNode; // Support for custom components
}

interface PageHeaderProps {
  title?: string;
  description?: string;
  actions?: HeaderAction[];
}

export function PageHeader({ 
  title = "The Phone Guys CRM", 
  description,
  actions = []
}: PageHeaderProps) {
  return (
    <header className="h-16 border-b border-primary/10 dark:border-border/50 bg-primary/[0.08] dark:bg-card/95 backdrop-blur-md sticky top-0 z-40 shadow-sm">
      {/* Enhanced gradient accent line at top */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary/30 to-transparent dark:opacity-60" />
      
      {/* Subtle background gradient - lighter blue in light mode */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/[0.06] via-transparent to-primary/[0.04] dark:from-primary/5 dark:via-transparent dark:to-accent/5 pointer-events-none" />
      
      <div className="h-full px-6 flex items-center justify-between relative">
        {/* Left side - Page info */}
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" className="lg:hidden">
            <Menu className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">{title}</h1>
            {description && (
              <div className="text-xs text-muted-foreground mt-0.5">{description}</div>
            )}
          </div>
        </div>

        {/* Right side - Actions and user controls */}
        <div className="flex items-center space-x-3">
          {/* Desktop: Show all action buttons */}
          <div className="hidden md:flex items-center space-x-2">
            {actions.map((action, index) => (
              action.component ? (
                <div key={index}>
                  {action.component}
                </div>
              ) : action.href ? (
                <Button
                  key={index}
                  variant={action.variant || "default"}
                  size="sm"
                  className={`inline-flex items-center gap-1 ${action.className || ''}`}
                  disabled={action.disabled}
                  asChild
                >
                  <Link href={action.href}>
                    {action.icon}
                    {action.label}
                  </Link>
                </Button>
              ) : (
                <Button
                  key={index}
                  variant={action.variant || "default"}
                  size="sm"
                  onClick={action.onClick}
                  disabled={action.disabled}
                  className={`inline-flex items-center gap-1 ${action.className || ''}`}
                >
                  {action.icon}
                  {action.label}
                </Button>
              )
            ))}
          </div>

          {/* Mobile: Actions in dropdown */}
          {actions.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild className="md:hidden">
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Actions
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {actions
                  .filter(action => !action.component) // Only show regular actions in dropdown
                  .map((action, index) => (
                    action.href ? (
                      <DropdownMenuItem key={index} asChild>
                        <Link href={action.href} className="flex items-center">
                          {action.icon}
                          <span className={action.icon ? "ml-2" : ""}>{action.label}</span>
                        </Link>
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem key={index} onClick={action.onClick}>
                        {action.icon}
                        <span className={action.icon ? "ml-2" : ""}>{action.label}</span>
                      </DropdownMenuItem>
                    )
                  ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          
          {/* Mobile: Show custom components separately */}
          <div className="md:hidden flex items-center space-x-2">
            {actions
              .filter(action => action.component)
              .map((action, index) => (
                <div key={index}>
                  {action.component}
                </div>
              ))}
          </div>

          {/* Divider */}
          {actions.length > 0 && <div className="w-px h-8 bg-border" />}

          {/* User controls */}
          <ThemeSwitcher />
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}