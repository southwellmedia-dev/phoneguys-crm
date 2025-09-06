"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
  LogOut,
  User,
  ChevronUp,
} from "lucide-react";
import { useTimer } from "@/lib/contexts/timer-context";
import { StopTimerDialog } from "@/components/orders/stop-timer-dialog";
import { UserRole } from "@/lib/types/database.types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

import { Calendar } from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Appointments", href: "/appointments", icon: Calendar },
  { name: "Tickets", href: "/orders", icon: Package },
  { name: "Customers", href: "/customers", icon: Users },
  { name: "Reports", href: "/reports", icon: FileText, disabled: true },
  { name: "Settings", href: "/settings", icon: Settings, disabled: true },
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
    full_name?: string;
  };
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { activeTimer, pauseTimer, error, clearError } = useTimer();
  const [showStopDialog, setShowStopDialog] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
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

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      const supabase = createClient();
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        toast.error('Failed to sign out');
        console.error('Logout error:', error);
        return;
      }
      
      toast.success('Signed out successfully');
      router.push('/auth/login');
    } catch (error) {
      toast.error('An error occurred while signing out');
      console.error('Logout error:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <aside className="w-64 dark:bg-card/95 bg-gradient-to-br from-primary via-primary to-primary/90 backdrop-blur-sm border-r border-primary/20 dark:border-border/50 h-screen flex-shrink-0 relative">
      {/* Enhanced gradient overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/20 pointer-events-none dark:from-primary/5 dark:via-transparent dark:to-accent/5" />
      
      <div className="relative flex flex-col h-full overflow-hidden">
        {/* Logo Section - Enhanced - Matching header height (h-16) */}
        <div className="h-16 px-6 flex items-center border-b border-white/10 dark:border-border/50 bg-gradient-to-r from-transparent via-white/5 to-transparent dark:from-transparent dark:via-muted/20 dark:to-transparent">
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 overflow-hidden">
              <img
                src="https://egotypldqzdzjclikmeg.supabase.co/storage/v1/object/public/device-images/phone-guys-lg.jpg"
                alt="The Phone Guys"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white dark:text-foreground">The Phone Guys</h1>
              <p className="text-xs text-white/70 dark:text-muted-foreground">CRM & Ticketing Platform</p>
            </div>
          </Link>
        </div>

        {/* Navigation Links - Scrollable if needed */}
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = pathname === item.href || 
              (item.href !== "/" && pathname.startsWith(item.href));
            
            if (item.disabled) {
              return (
                <div
                  key={item.name}
                  className="relative flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium opacity-50 cursor-not-allowed"
                >
                  <div className="p-2 rounded-lg bg-white/10 dark:bg-muted/30">
                    <item.icon className="h-4 w-4 text-white/50 dark:text-muted-foreground" />
                  </div>
                  <span className="text-white/50 dark:text-muted-foreground">{item.name}</span>
                  <span className="ml-auto text-xs text-white/40 dark:text-muted-foreground/70">Coming Soon</span>
                </div>
              );
            }
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "relative flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group",
                  isActive
                    ? "bg-white/20 dark:bg-gradient-primary text-white dark:text-primary-foreground shadow-lg backdrop-blur-sm"
                    : "text-white/80 dark:text-foreground hover:bg-white/10 dark:hover:bg-muted/50 hover:translate-x-1"
                )}
              >
                <div className={cn(
                  "p-2 rounded-lg transition-colors",
                  isActive 
                    ? "bg-white/20 dark:bg-white/20" 
                    : "bg-white/10 dark:bg-muted/50 group-hover:bg-white/20 dark:group-hover:bg-primary/10"
                )}>
                  <item.icon className={cn(
                    "h-4 w-4",
                    isActive 
                      ? "text-white dark:text-primary-foreground" 
                      : "text-white/80 dark:text-muted-foreground group-hover:text-white dark:group-hover:text-primary"
                  )} />
                </div>
                <span className={cn(
                  "font-medium",
                  !isActive && "group-hover:text-white dark:group-hover:text-foreground"
                )}>{item.name}</span>
              </Link>
            );
          })}

          {/* Admin Section - Only visible for admin users */}
          {user.role === 'admin' && (
            <>
              <div className="pt-4 mt-4 border-t border-white/20 dark:border-border/50">
                <div className="px-4 pb-3 flex items-center space-x-2">
                  <div className="p-1.5 rounded-lg bg-white/20 dark:bg-gradient-to-br dark:from-accent/20 dark:to-accent/10">
                    <Shield className="h-3.5 w-3.5 text-white dark:text-accent" />
                  </div>
                  <span className="text-xs font-bold text-white/80 dark:text-muted-foreground uppercase tracking-wider">
                    Admin Zone
                  </span>
                </div>
                <div className="space-y-1.5">
                  {adminNavigation.map((item) => {
                  const isActive = pathname === item.href || 
                    (item.href !== "/" && pathname.startsWith(item.href));
                  
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        "relative flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group",
                        isActive
                          ? "bg-white/20 dark:bg-gradient-to-r dark:from-accent dark:to-accent/80 text-white shadow-lg backdrop-blur-sm"
                          : "text-white/80 dark:text-foreground hover:bg-white/10 dark:hover:bg-muted/50 hover:translate-x-1"
                      )}
                    >
                      <div className={cn(
                        "p-2 rounded-lg transition-colors",
                        isActive 
                          ? "bg-white/20" 
                          : "bg-white/10 dark:bg-muted/50 group-hover:bg-white/20 dark:group-hover:bg-accent/10"
                      )}>
                        <item.icon className={cn(
                          "h-4 w-4",
                          isActive 
                            ? "text-white" 
                            : "text-white/80 dark:text-muted-foreground group-hover:text-white dark:group-hover:text-accent"
                        )} />
                      </div>
                      <span className={cn(
                        "font-medium",
                        !isActive && "group-hover:text-white dark:group-hover:text-foreground"
                      )}>{item.name}</span>
                    </Link>
                  );
                  })}
                </div>
              </div>
            </>
          )}
        </nav>

        {/* Timer Section - Fixed at bottom */}
        <div className="p-4 border-t border-white/20 dark:border-border flex-shrink-0">
          {!activeTimer ? (
            /* Inactive state - minimal */
            <div className="bg-white/10 dark:bg-muted/30 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Timer className="h-4 w-4 text-white/60 dark:text-muted-foreground" />
                  <span className="text-sm text-white/60 dark:text-muted-foreground">No active timer</span>
                </div>
                <Play className="h-3 w-3 text-white/60 dark:text-muted-foreground" />
              </div>
            </div>
          ) : (
            /* Active state - expanded */
            <div className="bg-white/20 dark:bg-gradient-to-br dark:from-primary/5 dark:to-primary/10 border border-white/30 dark:border-primary/20 rounded-lg p-4 transition-all shadow-sm backdrop-blur-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-white dark:text-primary">
                  {activeTimer.isPaused ? 'Timer Paused' : 'Timer Running'}
                </span>
                <div className="flex items-center space-x-1">
                  {!activeTimer.isPaused && (
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white dark:bg-primary opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-white dark:bg-primary"></span>
                    </span>
                  )}
                  <button 
                    onClick={handlePauseTimer}
                    className="p-1 hover:bg-white/20 dark:hover:bg-primary/10 rounded transition-colors"
                    title={activeTimer.isPaused ? "Resume timer" : "Pause timer"}
                  >
                    {activeTimer.isPaused ? (
                      <Play className="h-3 w-3 text-white dark:text-primary" />
                    ) : (
                      <Pause className="h-3 w-3 text-white dark:text-primary" />
                    )}
                  </button>
                  <button 
                    onClick={handleStopTimer}
                    className="p-1 hover:bg-white/20 dark:hover:bg-destructive/10 rounded transition-colors"
                    title="Stop timer"
                  >
                    <Timer className="h-3 w-3 text-white dark:text-destructive" />
                  </button>
                </div>
              </div>
              <p className="text-2xl font-bold font-mono text-white dark:text-foreground">
                {formatTime(activeTimer.elapsedSeconds)}
              </p>
              <p className="text-xs text-white/80 dark:text-muted-foreground mt-2">
                {activeTimer.ticketNumber || `Ticket #${activeTimer.ticketId.slice(-8)}`}
                {activeTimer.customerName && (
                  <span className="block text-white/70 dark:text-muted-foreground">{activeTimer.customerName}</span>
                )}
              </p>
              <Link 
                href={`/orders/${activeTimer.ticketId}`}
                className="inline-block mt-3 text-xs text-white dark:text-primary hover:text-white/80 dark:hover:text-primary/80 font-medium transition-colors"
              >
                View Ticket →
              </Link>
            </div>
          )}
        </div>

        {/* User Section - Always visible at bottom */}
        <div className="p-4 border-t border-white/20 dark:border-border flex-shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-white/10 dark:hover:bg-muted/30 transition-colors group">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-white/20 dark:bg-primary flex items-center justify-center backdrop-blur-sm">
                    <span className="text-white dark:text-primary-foreground text-sm font-medium">
                      {user.full_name?.charAt(0)?.toUpperCase() || user.email?.[0]?.toUpperCase() || "U"}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm font-medium text-white dark:text-foreground truncate">
                      Hi, {user.full_name || "User"}
                    </p>
                    <p className="text-xs text-white/70 dark:text-muted-foreground truncate">
                      {user.email || "user@example.com"}
                    </p>
                  </div>
                </div>
                <ChevronUp className="h-4 w-4 text-white/60 dark:text-muted-foreground group-hover:text-white dark:group-hover:text-foreground transition-colors" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="top" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/profile" className="flex items-center cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  <span>My Profile</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings" className="flex items-center cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="flex items-center cursor-pointer text-destructive focus:text-destructive"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>{isLoggingOut ? 'Signing out...' : 'Sign out'}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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