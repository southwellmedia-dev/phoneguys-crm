"use client";

import { Button } from "@/components/ui/button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { LogoutButton } from "@/components/logout-button";
import { Menu } from "lucide-react";

interface HeaderProps {
  title?: string;
}

export function Header({ title = "Repair Management System" }: HeaderProps) {
  return (
    <header className="h-16 border-b border-border bg-card">
      <div className="h-full px-6 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" className="lg:hidden">
            <Menu className="h-5 w-5" />
          </Button>
          <h2 className="text-lg font-semibold">{title}</h2>
        </div>
        <div className="flex items-center space-x-4">
          <ThemeSwitcher />
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}