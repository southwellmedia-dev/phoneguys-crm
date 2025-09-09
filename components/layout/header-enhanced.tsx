"use client";

import { Button } from "@/components/ui/button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { Menu, Search, Bell, Command } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import Link from "next/link";
import { useSearch } from "@/lib/contexts/search-context";

interface HeaderEnhancedProps {
  title?: string;
  description?: string;
  actions?: any[];
}

export function HeaderEnhanced({ title, description, actions }: HeaderEnhancedProps) {
  const { openSearch } = useSearch();
  const [notifications] = useState(3); // Example notification count

  return (
    <header className="h-20 border-b border-border bg-card/95 backdrop-blur-sm">
      <div className="h-full px-6 flex items-center justify-between">
        {/* Left Section - Title & Description */}
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" className="lg:hidden">
            <Menu className="h-5 w-5" />
          </Button>
          
          <div>
            {title && (
              <h1 className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                {title}
              </h1>
            )}
            {description && (
              <p className="text-sm text-muted-foreground">
                {description}
              </p>
            )}
          </div>
        </div>

        {/* Empty center for spacing */}
        <div className="flex-1" />

        {/* Right Section - Modern Flexbox Layout */}
        <div className="flex items-center">
          {/* Action buttons group */}
          {actions && actions.length > 0 && (
            <>
              <div className="flex items-center gap-2 px-3">
                {actions.map((action, index) => (
                  action.href ? (
                    <Button
                      key={index}
                      variant={action.variant || "outline"}
                      size="sm"
                      disabled={action.disabled}
                      className={action.variant === "default" ? "bg-gradient-primary text-white hover:shadow-md" : ""}
                      asChild
                    >
                      <Link href={action.href}>
                        {action.icon}
                        <span className="hidden sm:inline ml-1">{action.label}</span>
                      </Link>
                    </Button>
                  ) : (
                    <Button
                      key={index}
                      variant={action.variant || "outline"}
                      size="sm"
                      onClick={action.onClick}
                      disabled={action.disabled}
                      className={action.variant === "default" ? "bg-gradient-primary text-white hover:shadow-md" : ""}
                    >
                      {action.icon}
                      <span className="hidden sm:inline ml-1">{action.label}</span>
                    </Button>
                  )
                ))}
              </div>
              
              {/* Divider */}
              <div className="h-8 w-px bg-border" />
            </>
          )}
          
          {/* Icons group with consistent padding */}
          <div className="flex items-center gap-2 px-3">
            {/* Global Search Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={openSearch}
              className="flex items-center gap-2 px-3"
            >
              <Search className="h-4 w-4" />
              <span className="hidden lg:inline text-sm">Search</span>
              <kbd className="hidden lg:inline-flex pointer-events-none h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground ml-2">
                <span className="text-xs">⌘</span>K
              </kbd>
            </Button>

            {/* Notifications */}
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {notifications > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-5 w-5 bg-red-500 text-white text-xs items-center justify-center font-medium">
                    {notifications}
                  </span>
                </span>
              )}
            </Button>

            <ThemeSwitcher />
          </div>
        </div>
      </div>
    </header>
  );
}