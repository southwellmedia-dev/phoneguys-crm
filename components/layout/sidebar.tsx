"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  ChevronDown,
  ScrollText,
  MoreHorizontal,
  Bell,
} from "lucide-react";
import { useTimer } from "@/lib/contexts/timer-context";
import { StopTimerDialog } from "@/components/orders/stop-timer-dialog";
import { UserRole } from "@/lib/types/database.types";
import { Button } from "@/components/ui/button";
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

import { Calendar, Globe } from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Appointments", href: "/appointments", icon: Calendar },
  { name: "Tickets", href: "/orders", icon: Package },
  { name: "Customers", href: "/customers", icon: Users },
];

const adminNavigation = [
  { name: "Users", href: "/admin/users", icon: Users },
  { name: "Devices", href: "/admin/devices", icon: Smartphone },
  { name: "Services", href: "/admin/services", icon: Wrench },
  { name: "Media Gallery", href: "/admin/media", icon: Image },
];

const extrasNavigation = [
  { name: "Reports", href: "/reports", icon: FileText },
  { name: "Active Timers", href: "/admin/active-timers", icon: Timer },
  { name: "Integration", href: "/admin/website-integration", icon: Globe },
  { name: "Audit Logs", href: "/admin/audit-logs", icon: ScrollText },
  { name: "Settings", href: "/admin/settings", icon: Settings },
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
  const [isExtrasExpanded, setIsExtrasExpanded] = useState(() => {
    // Auto-expand if any extras item is currently active
    return extrasNavigation.some(item => 
      pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))
    );
  });
  
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
    <aside className="w-64 h-screen flex-shrink-0 relative border-r bg-gradient-to-br from-primary via-primary to-primary/90 border-primary/20 dark:bg-gradient-to-br dark:from-card dark:via-card dark:to-card dark:border-border/50">
      {/* Enhanced gradient overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/20 dark:from-transparent dark:via-transparent dark:to-black/10 pointer-events-none" />
      
      <div className="relative flex flex-col h-full overflow-hidden">
        {/* Logo Section - Full width */}
        <div className="px-6 py-6 border-b border-white/10 dark:border-border/50 bg-gradient-to-r from-transparent via-white/5 to-transparent dark:from-transparent dark:via-muted/5 dark:to-transparent">
          <Link href="/" className="group block">
            {/* Light mode logo */}
            <img
              src="https://egotypldqzdzjclikmeg.supabase.co/storage/v1/object/public/device-images/phoneguys-logo.png"
              alt="The Phone Guys"
              className="w-full h-auto object-contain transition-transform duration-300 group-hover:scale-105 dark:hidden"
            />
            {/* Dark mode logo */}
            <img
              src="https://egotypldqzdzjclikmeg.supabase.co/storage/v1/object/public/device-images/phoneguys-darkmode-logo.svg"
              alt="The Phone Guys"
              className="w-full h-auto object-contain transition-transform duration-300 group-hover:scale-105 hidden dark:block"
            />
          </Link>
        </div>

        {/* Navigation Links - Scrollable if needed */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <div className="space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href || 
                (item.href !== "/" && pathname.startsWith(item.href));
              
              if (item.disabled) {
                return (
                  <div
                    key={item.name}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm opacity-40 cursor-not-allowed"
                  >
                    <item.icon className="h-5 w-5 text-white/40 dark:text-muted-foreground flex-shrink-0" />
                    <span className="text-white/40 dark:text-muted-foreground">{item.name}</span>
                  </div>
                );
              }
              
              return (
                <motion.div
                  key={item.name}
                  whileHover={{ scale: 1.02, x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                >
                  <Link
                    href={item.href}
                    className={cn(
                      "relative flex items-center gap-3 px-3 py-2.5 rounded-lg group",
                      isActive
                        ? "bg-white/20 dark:bg-primary/10 backdrop-blur-sm"
                        : ""
                    )}
                  >
                    {/* Hover background effect */}
                    <motion.div
                      className="absolute inset-0 rounded-lg bg-white/10 dark:bg-muted/10"
                      initial={{ opacity: 0 }}
                      whileHover={{ opacity: isActive ? 0 : 1 }}
                      transition={{ duration: 0.2 }}
                    />
                    
                    {/* Animated icon */}
                    <motion.div
                      whileHover={{ rotate: [0, -10, 10, -10, 0] }}
                      transition={{ duration: 0.5 }}
                      className="relative z-10"
                    >
                      <item.icon className={cn(
                        "h-5 w-5 flex-shrink-0 transition-colors",
                        isActive 
                          ? "text-white dark:text-primary" 
                          : "text-white/70 dark:text-muted-foreground group-hover:text-white dark:group-hover:text-foreground"
                      )} />
                    </motion.div>
                    
                    {/* Text label */}
                    <span className={cn(
                      "text-sm transition-colors relative z-10",
                      isActive 
                        ? "text-white dark:text-foreground font-semibold" 
                        : "text-white/80 dark:text-muted-foreground font-medium group-hover:text-white dark:group-hover:text-foreground"
                    )}>
                      {item.name}
                    </span>
                    
                    {/* Animated active indicator */}
                    <AnimatePresence>
                      {isActive && (
                        <motion.div 
                          className="absolute right-3 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-white dark:bg-primary rounded-full"
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        />
                      )}
                    </AnimatePresence>
                  </Link>
                </motion.div>
              );
            })}

            {/* Admin Section - Only visible for admin users */}
            {user.role === 'admin' && (
              <>
                <div className="mt-6 pt-6 border-t border-white/10 dark:border-border/20">
                  {/* Section header */}
                  <div className="px-3 mb-2">
                    <span className="text-xs font-semibold text-white/40 dark:text-muted-foreground uppercase tracking-wider">
                      Admin
                    </span>
                  </div>
                  
                  {/* Admin navigation items */}
                  <div className="space-y-1">
                    {adminNavigation.map((item) => {
                    const isActive = pathname === item.href || 
                      (item.href !== "/" && pathname.startsWith(item.href));
                    
                    if (item.disabled) {
                      return (
                        <div
                          key={item.name}
                          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm opacity-40 cursor-not-allowed"
                        >
                          <item.icon className="h-4 w-4 text-white/40 dark:text-muted-foreground flex-shrink-0" />
                          <span className="text-white/40 dark:text-muted-foreground text-sm">{item.name}</span>
                        </div>
                      );
                    }
                    
                    return (
                      <motion.div
                        key={item.name}
                        whileHover={{ scale: 1.02, x: 3 }}
                        whileTap={{ scale: 0.98 }}
                        transition={{ type: "spring", stiffness: 400, damping: 25 }}
                      >
                        <Link
                          href={item.href}
                          className={cn(
                            "relative flex items-center gap-3 px-3 py-2 rounded-lg group",
                            isActive
                              ? "bg-white/15 dark:bg-accent/10"
                              : ""
                          )}
                        >
                          {/* Hover background */}
                          <motion.div
                            className="absolute inset-0 rounded-lg bg-white/10 dark:bg-muted/10"
                            initial={{ opacity: 0 }}
                            whileHover={{ opacity: isActive ? 0 : 1 }}
                            transition={{ duration: 0.2 }}
                          />
                          
                          {/* Animated icon */}
                          <motion.div
                            whileHover={{ scale: 1.2 }}
                            transition={{ type: "spring", stiffness: 400, damping: 17 }}
                            className="relative z-10"
                          >
                            <item.icon className={cn(
                              "h-4 w-4 flex-shrink-0 transition-colors",
                              isActive 
                                ? "text-white dark:text-accent" 
                                : "text-white/60 dark:text-muted-foreground group-hover:text-white/80 dark:group-hover:text-foreground"
                            )} />
                          </motion.div>
                          
                          <span className={cn(
                            "text-sm transition-colors relative z-10",
                            isActive 
                              ? "text-white dark:text-accent font-semibold" 
                              : "text-white/70 dark:text-muted-foreground font-medium group-hover:text-white/90 dark:group-hover:text-foreground"
                          )}>
                            {item.name}
                          </span>
                          
                          <AnimatePresence>
                            {isActive && (
                              <motion.div 
                                className="absolute right-3 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-white dark:bg-accent rounded-full"
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0, opacity: 0 }}
                                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                              />
                            )}
                          </AnimatePresence>
                        </Link>
                      </motion.div>
                    );
                  })}

                  {/* Extras Section - Collapsible */}
                  <div className="mt-4">
                    <button
                      onClick={() => setIsExtrasExpanded(!isExtrasExpanded)}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm hover:bg-white/5 dark:hover:bg-muted/10 transition-colors group"
                    >
                      <span className="text-xs font-semibold text-white/40 dark:text-muted-foreground uppercase tracking-wider group-hover:text-white/60">
                        More
                      </span>
                      <ChevronDown className={cn(
                        "h-3.5 w-3.5 text-white/30 dark:text-muted-foreground transition-transform duration-200",
                        isExtrasExpanded && "rotate-180"
                      )} />
                    </button>
                    
                    {/* Expanded content with animation */}
                    <AnimatePresence>
                      {isExtrasExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: "easeInOut" }}
                          className="overflow-hidden"
                        >
                          <div className="mt-2 space-y-1">
                            {extrasNavigation.map((item, index) => {
                              const isActive = pathname === item.href || 
                                (item.href !== "/" && pathname.startsWith(item.href));
                              
                              return (
                                <motion.div
                                  key={item.name}
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: index * 0.05 }}
                                  whileHover={{ x: 3 }}
                                  whileTap={{ scale: 0.98 }}
                                >
                                  <Link
                                    href={item.href}
                                    className={cn(
                                      "relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm group",
                                      isActive
                                        ? "bg-white/15 dark:bg-primary/10"
                                        : ""
                                    )}
                                  >
                                    {/* Hover background */}
                                    <motion.div
                                      className="absolute inset-0 rounded-lg bg-white/10 dark:bg-muted/10"
                                      initial={{ opacity: 0 }}
                                      whileHover={{ opacity: isActive ? 0 : 1 }}
                                      transition={{ duration: 0.2 }}
                                    />
                                    
                                    <item.icon className={cn(
                                      "h-4 w-4 flex-shrink-0 transition-colors relative z-10",
                                      isActive 
                                        ? "text-white dark:text-primary" 
                                        : "text-white/60 dark:text-muted-foreground group-hover:text-white/80 dark:group-hover:text-foreground"
                                    )} />
                                    
                                    <span className={cn(
                                      "text-sm transition-colors relative z-10",
                                      isActive 
                                        ? "text-white dark:text-foreground font-semibold" 
                                        : "text-white/70 dark:text-muted-foreground font-medium group-hover:text-white/90 dark:group-hover:text-foreground"
                                    )}>
                                      {item.name}
                                    </span>
                                    
                                    <AnimatePresence>
                                      {isActive && (
                                        <motion.div 
                                          className="absolute right-3 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-white dark:bg-primary rounded-full"
                                          initial={{ scale: 0 }}
                                          animate={{ scale: 1 }}
                                          exit={{ scale: 0 }}
                                        />
                                      )}
                                    </AnimatePresence>
                                  </Link>
                                </motion.div>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </nav>

        {/* Timer Section - Fixed at bottom */}
        <div className="p-3 border-t border-white/10 dark:border-border/20 flex-shrink-0">
          {!activeTimer ? (
            /* Inactive state */
            <div className="px-3 py-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Timer className="h-4 w-4 text-white/40 dark:text-muted-foreground" />
                  <span className="text-sm text-white/40 dark:text-muted-foreground">No active timer</span>
                </div>
              </div>
            </div>
          ) : (
            /* Active state */
            <div className="bg-white/10 dark:bg-primary/5 rounded-lg px-3 py-2.5">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-white/60 dark:text-muted-foreground uppercase tracking-wider">
                  {activeTimer.isPaused ? 'Paused' : 'Timer Running'}
                </span>
                {!activeTimer.isPaused && (
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white dark:bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-white dark:bg-primary"></span>
                  </span>
                )}
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xl font-mono text-white dark:text-foreground font-semibold">
                    {formatTime(activeTimer.elapsedSeconds)}
                  </p>
                  <p className="text-xs text-white/60 dark:text-muted-foreground mt-0.5">
                    {activeTimer.ticketNumber || `Ticket #${activeTimer.ticketId.slice(-8)}`}
                  </p>
                </div>
                
                <div className="flex items-center gap-1">
                  <button 
                    onClick={handlePauseTimer}
                    className="p-1.5 hover:bg-white/10 dark:hover:bg-primary/10 rounded transition-colors"
                    title={activeTimer.isPaused ? "Resume" : "Pause"}
                  >
                    {activeTimer.isPaused ? (
                      <Play className="h-4 w-4 text-white dark:text-primary" />
                    ) : (
                      <Pause className="h-4 w-4 text-white dark:text-primary" />
                    )}
                  </button>
                  <button 
                    onClick={handleStopTimer}
                    className="p-1.5 hover:bg-white/10 dark:hover:bg-destructive/10 rounded transition-colors"
                    title="Stop"
                  >
                    <Timer className="h-4 w-4 text-white dark:text-destructive" />
                  </button>
                </div>
              </div>
              
              <Link 
                href={`/orders/${activeTimer.ticketId}`}
                className="inline-block mt-2 text-xs text-white/80 dark:text-primary hover:text-white dark:hover:text-primary/80 transition-colors"
              >
                View Ticket →
              </Link>
            </div>
          )}
        </div>

        {/* User Section - Always visible at bottom */}
        <div className="p-3 border-t border-white/10 dark:border-border/20 flex-shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-white/10 dark:hover:bg-muted/10 transition-colors h-auto">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white/20 dark:bg-primary/20 flex items-center justify-center">
                    <span className="text-white dark:text-primary-foreground text-sm font-medium">
                      {user.full_name?.charAt(0)?.toUpperCase() || user.email?.[0]?.toUpperCase() || "U"}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm font-medium text-white dark:text-foreground truncate">
                      {user.full_name || "User"}
                    </p>
                    <p className="text-xs text-white/60 dark:text-muted-foreground truncate">
                      {user.email || "user@example.com"}
                    </p>
                  </div>
                </div>
                <ChevronUp className="h-4 w-4 text-white/40 dark:text-muted-foreground" />
              </Button>
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