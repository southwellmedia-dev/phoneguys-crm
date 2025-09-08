/**
 * Premium Header Component
 * 
 * @description Enhanced header with proper height, breadcrumbs, search, and notifications
 * @category Navigation
 * 
 * @example
 * ```tsx
 * <HeaderPremium
 *   user={currentUser}
 *   breadcrumbs={[
 *     { label: 'Dashboard', href: '/' },
 *     { label: 'Orders', href: '/orders' },
 *     { label: 'Order #123', current: true }
 *   ]}
 *   notifications={3}
 * />
 * ```
 */

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { 
  Search, 
  Bell, 
  Menu, 
  ChevronRight,
  Sun,
  Moon,
  Settings,
  LogOut,
  User,
  HelpCircle,
  Command
} from "lucide-react";
import { ButtonPremium } from "../buttons/button-premium";
import { StatusBadge } from "../badges/status-badge";
import { useTheme } from "next-themes";

interface Breadcrumb {
  label: string;
  href?: string;
  current?: boolean;
}

interface HeaderPremiumProps {
  user?: {
    name?: string;
    email?: string;
    avatar?: string;
    role?: string;
  };
  breadcrumbs?: Breadcrumb[];
  notifications?: number;
  showSearch?: boolean;
  showMobileMenu?: boolean;
  onMobileMenuClick?: () => void;
  className?: string;
}

export const HeaderPremium = React.forwardRef<HTMLElement, HeaderPremiumProps>(
  ({ 
    user,
    breadcrumbs = [],
    notifications = 0,
    showSearch = true,
    showMobileMenu = true,
    onMobileMenuClick,
    className,
    ...props 
  }, ref) => {
    const pathname = usePathname();
    const { theme, setTheme } = useTheme();
    const [searchOpen, setSearchOpen] = React.useState(false);
    const [searchQuery, setSearchQuery] = React.useState("");
    const [notificationOpen, setNotificationOpen] = React.useState(false);
    const [userMenuOpen, setUserMenuOpen] = React.useState(false);

    // Generate breadcrumbs from pathname if not provided
    const autoBreadcrumbs = React.useMemo(() => {
      if (breadcrumbs.length > 0) return breadcrumbs;
      
      const paths = pathname.split('/').filter(Boolean);
      const crumbs: Breadcrumb[] = [
        { label: 'Dashboard', href: '/' }
      ];
      
      let href = '';
      paths.forEach((path, index) => {
        href += `/${path}`;
        const label = path.charAt(0).toUpperCase() + path.slice(1).replace(/-/g, ' ');
        crumbs.push({
          label,
          href: index === paths.length - 1 ? undefined : href,
          current: index === paths.length - 1
        });
      });
      
      return crumbs;
    }, [pathname, breadcrumbs]);

    return (
      <header
        ref={ref}
        className={cn(
          "h-20 border-b border-border bg-card/95 backdrop-blur-sm sticky top-0 z-40",
          className
        )}
        {...props}
      >
        <div className="h-full px-6 flex flex-col justify-center">
          {/* Top Section - Main Controls */}
          <div className="flex items-center justify-between h-12">
            {/* Left Side - Mobile Menu & Breadcrumbs */}
            <div className="flex items-center gap-4">
              {showMobileMenu && (
                <ButtonPremium
                  variant="ghost"
                  size="sm"
                  className="lg:hidden"
                  onClick={onMobileMenuClick}
                >
                  <Menu className="h-5 w-5" />
                </ButtonPremium>
              )}
              
              {/* Breadcrumbs */}
              <nav className="hidden md:flex items-center space-x-1">
                {autoBreadcrumbs.map((crumb, index) => (
                  <React.Fragment key={index}>
                    {index > 0 && (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                    {crumb.current ? (
                      <span className="text-sm font-medium text-foreground">
                        {crumb.label}
                      </span>
                    ) : (
                      <Link
                        href={crumb.href || '#'}
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {crumb.label}
                      </Link>
                    )}
                  </React.Fragment>
                ))}
              </nav>
            </div>

            {/* Right Side - Actions */}
            <div className="flex items-center gap-2">
              {/* Search */}
              {showSearch && (
                <div className="relative">
                  <div className={cn(
                    "absolute right-0 top-0 overflow-hidden transition-all duration-300",
                    searchOpen ? "w-64" : "w-10"
                  )}>
                    <div className="relative flex items-center">
                      <input
                        type="text"
                        placeholder="Search..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={cn(
                          "w-full h-10 pl-10 pr-4 text-sm bg-muted/50 border border-border rounded-lg",
                          "focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary",
                          "placeholder:text-muted-foreground",
                          !searchOpen && "opacity-0 pointer-events-none"
                        )}
                        onKeyDown={(e) => {
                          if (e.key === 'Escape') {
                            setSearchOpen(false);
                            setSearchQuery("");
                          }
                        }}
                      />
                      <button
                        onClick={() => {
                          setSearchOpen(!searchOpen);
                          if (searchOpen) setSearchQuery("");
                        }}
                        className={cn(
                          "absolute left-0 h-10 w-10 flex items-center justify-center",
                          "text-muted-foreground hover:text-foreground transition-colors"
                        )}
                      >
                        <Search className="h-4 w-4" />
                      </button>
                      {searchOpen && (
                        <kbd className="absolute right-3 hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                          <span className="text-xs">ESC</span>
                        </kbd>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Quick Command */}
              <ButtonPremium
                variant="ghost"
                size="sm"
                className="hidden lg:flex items-center gap-2"
              >
                <Command className="h-4 w-4" />
                <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                  <span className="text-xs">⌘</span>K
                </kbd>
              </ButtonPremium>

              {/* Notifications */}
              <div className="relative">
                <ButtonPremium
                  variant="ghost"
                  size="sm"
                  onClick={() => setNotificationOpen(!notificationOpen)}
                  className="relative"
                >
                  <Bell className="h-4 w-4" />
                  {notifications > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-medium">
                      {notifications > 9 ? '9+' : notifications}
                    </span>
                  )}
                </ButtonPremium>

                {/* Notification Dropdown */}
                {notificationOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-card border rounded-lg shadow-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold">Notifications</h3>
                      <StatusBadge status="info" size="xs">
                        {notifications} New
                      </StatusBadge>
                    </div>
                    <div className="space-y-2">
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-sm font-medium">New order received</p>
                        <p className="text-xs text-muted-foreground mt-1">2 minutes ago</p>
                      </div>
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-sm font-medium">Repair completed</p>
                        <p className="text-xs text-muted-foreground mt-1">15 minutes ago</p>
                      </div>
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-sm font-medium">Customer waiting</p>
                        <p className="text-xs text-muted-foreground mt-1">1 hour ago</p>
                      </div>
                    </div>
                    <ButtonPremium variant="soft" size="sm" fullWidth className="mt-3">
                      View All Notifications
                    </ButtonPremium>
                  </div>
                )}
              </div>

              {/* Theme Toggle */}
              <ButtonPremium
                variant="ghost"
                size="sm"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              >
                {theme === 'dark' ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </ButtonPremium>

              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center text-white font-medium">
                    {user?.name?.charAt(0) || 'U'}
                  </div>
                  <div className="hidden lg:block text-left">
                    <p className="text-sm font-medium">{user?.name || 'User'}</p>
                    <p className="text-xs text-muted-foreground">{user?.role || 'Member'}</p>
                  </div>
                </button>

                {/* User Dropdown */}
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-card border rounded-lg shadow-lg py-2">
                    <div className="px-4 py-2 border-b">
                      <p className="text-sm font-medium">{user?.name || 'User'}</p>
                      <p className="text-xs text-muted-foreground">{user?.email || 'user@example.com'}</p>
                    </div>
                    <Link href="/profile" className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-muted transition-colors">
                      <User className="h-4 w-4" />
                      My Profile
                    </Link>
                    <Link href="/settings" className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-muted transition-colors">
                      <Settings className="h-4 w-4" />
                      Settings
                    </Link>
                    <Link href="/help" className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-muted transition-colors">
                      <HelpCircle className="h-4 w-4" />
                      Help & Support
                    </Link>
                    <div className="border-t mt-2 pt-2">
                      <button className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors w-full">
                        <LogOut className="h-4 w-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Section - Page Title & Actions (optional) */}
          <div className="flex items-center justify-between h-8">
            <h1 className="text-lg font-semibold text-muted-foreground">
              {autoBreadcrumbs[autoBreadcrumbs.length - 1]?.label}
            </h1>
          </div>
        </div>

        {/* Click outside handlers */}
        {(notificationOpen || userMenuOpen || searchOpen) && (
          <div
            className="fixed inset-0 z-30"
            onClick={() => {
              setNotificationOpen(false);
              setUserMenuOpen(false);
              setSearchOpen(false);
            }}
          />
        )}
      </header>
    );
  }
);

HeaderPremium.displayName = "HeaderPremium";