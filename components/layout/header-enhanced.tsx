"use client";

import { Button } from "@/components/ui/button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { Menu, Search, Bell, Command } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import Link from "next/link";

interface HeaderEnhancedProps {
  title?: string;
  description?: string;
  actions?: any[];
}

export function HeaderEnhanced({ title, description, actions }: HeaderEnhancedProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
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
            {/* Search - Expandable */}
            <div className={cn(
              "flex items-center transition-all duration-300 ease-in-out overflow-hidden",
              searchOpen ? "w-64" : "w-9"
            )}>
              {searchOpen && (
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={cn(
                    "w-full h-9 px-3 mr-1 text-sm",
                    "bg-muted/50 border border-border rounded-lg",
                    "focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary",
                    "placeholder:text-muted-foreground",
                    "animate-fade-in"
                  )}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      setSearchOpen(false);
                      setSearchQuery("");
                    }
                  }}
                  autoFocus
                />
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setSearchOpen(!searchOpen);
                  if (searchOpen) setSearchQuery("");
                }}
                className="shrink-0"
              >
                <Search className={cn(
                  "h-5 w-5 transition-transform duration-300",
                  searchOpen && "scale-110"
                )} />
              </Button>
            </div>

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