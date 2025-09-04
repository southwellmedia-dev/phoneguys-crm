"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useState } from "react";
import {
  Home,
  Package,
  Users,
  FileText,
  Settings,
  Timer,
  Pause,
  Play,
  Shield,
  Wrench,
  Smartphone,
  Image,
} from "lucide-react";
import { useTimer } from "@/lib/contexts/timer-context";
import { StopTimerDialog } from "@/components/orders/stop-timer-dialog";
import { UserRole } from "@/lib/types/database.types";

const navigation = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Tickets", href: "/orders", icon: Package },
  { name: "Customers", href: "/customers", icon: Users },
  { name: "Reports", href: "/reports", icon: FileText },
  { name: "Settings", href: "/settings", icon: Settings },
];

const adminNavigation = [
  { name: "Users", href: "/admin/users", icon: Users },
  { name: "Devices", href: "/admin/devices", icon: Smartphone },
  { name: "Services", href: "/admin/services", icon: Wrench },
  { name: "Media Gallery", href: "/admin/media", icon: Image },
];

interface SidebarProps {
  user: {
    email?: string;
    id: string;
    role?: UserRole;
  };
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const { activeTimer, pauseTimer, error, clearError } = useTimer();
  const [showStopDialog, setShowStopDialog] = useState(false);
  
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handlePauseTimer = async () => {
    try {
      await pauseTimer();
    } catch (error) {
      console.error('Failed to pause timer:', error);
    }
  };

  const handleStopTimer = () => {
    setShowStopDialog(true);
  };

  const handleStopConfirm = () => {
    setShowStopDialog(false);
  };

  return (
    <aside className="w-64 bg-card border-r border-border h-screen flex-shrink-0">
      <div className="flex flex-col h-full overflow-hidden">
        {/* Logo Section */}
        <div className="p-6 border-b border-border">
          <Link href="/" className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xl">
                TPG
              </span>
            </div>
            <div>
              <h1 className="text-lg font-semibold">The Phone Guys</h1>
              <p className="text-xs text-muted-foreground">CRM System</p>
            </div>
          </Link>
        </div>

        {/* Navigation Links - Scrollable if needed */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = pathname === item.href || 
              (item.href !== "/" && pathname.startsWith(item.href));
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors group",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <item.icon className={cn(
                  "h-5 w-5",
                  isActive 
                    ? "text-primary-foreground" 
                    : "text-muted-foreground group-hover:text-accent-foreground"
                )} />
                <span>{item.name}</span>
              </Link>
            );
          })}

          {/* Admin Section - Only visible for admin users */}
          {user.role === 'admin' && (
            <>
              <div className="pt-4 mt-4 border-t border-border">
                <div className="px-4 pb-3 flex items-center space-x-2">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Admin
                  </span>
                </div>
                <div className="space-y-1">
                  {adminNavigation.map((item) => {
                  const isActive = pathname === item.href || 
                    (item.href !== "/" && pathname.startsWith(item.href));
                  
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        "flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors group",
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-accent hover:text-accent-foreground"
                      )}
                    >
                      <item.icon className={cn(
                        "h-5 w-5",
                        isActive 
                          ? "text-primary-foreground" 
                          : "text-muted-foreground group-hover:text-accent-foreground"
                      )} />
                      <span>{item.name}</span>
                    </Link>
                  );
                  })}
                </div>
              </div>
            </>
          )}
        </nav>

        {/* Timer Section - Fixed at bottom */}
        <div className="p-4 border-t border-border flex-shrink-0">
          {!activeTimer ? (
            /* Inactive state - minimal */
            <div className="bg-muted/30 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Timer className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">No active timer</span>
                </div>
                <Play className="h-3 w-3 text-muted-foreground" />
              </div>
            </div>
          ) : (
            /* Active state - expanded */
            <div className="bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-lg p-4 transition-all shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-primary">Timer Running</span>
                <div className="flex items-center space-x-1">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                  </span>
                  <button 
                    onClick={handlePauseTimer}
                    className="p-1 hover:bg-primary/10 rounded transition-colors"
                    title="Pause timer"
                  >
                    <Pause className="h-3 w-3 text-primary" />
                  </button>
                  <button 
                    onClick={handleStopTimer}
                    className="p-1 hover:bg-destructive/10 rounded transition-colors"
                    title="Stop timer"
                  >
                    <Timer className="h-3 w-3 text-destructive" />
                  </button>
                </div>
              </div>
              <p className="text-2xl font-bold font-mono text-foreground">
                {formatTime(activeTimer.elapsedSeconds)}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                {activeTimer.ticketNumber || `Ticket #${activeTimer.ticketId.slice(-8)}`}
                {activeTimer.customerName && (
                  <span className="block">{activeTimer.customerName}</span>
                )}
              </p>
              <Link 
                href={`/orders/${activeTimer.ticketId}`}
                className="inline-block mt-3 text-xs text-primary hover:text-primary/80 font-medium transition-colors"
              >
                View Ticket →
              </Link>
            </div>
          )}
        </div>

        {/* User Section - Always visible at bottom */}
        <div className="p-4 border-t border-border flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <span className="text-primary-foreground text-sm font-medium">
                  {user.email?.[0]?.toUpperCase() || "U"}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.email || "User"}</p>
                <p className="text-xs text-muted-foreground capitalize">{user.role || 'Staff'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stop Timer Dialog */}
      <StopTimerDialog
        isOpen={showStopDialog}
        onClose={() => setShowStopDialog(false)}
        onConfirm={handleStopConfirm}
      />
    </aside>
  );
}