'use client';

import { useState } from 'react';
import { Bell, CheckCheck, Loader2, AlertCircle, Info, AlertTriangle, Clock, User, Wrench, Calendar, X, ArrowRightLeft, MessageCircle, AtSign, Reply, Ticket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ButtonPremium } from '@/components/premium/ui/buttons';
import { SkeletonPremium } from '@/components/premium/ui/feedback';
import { useInternalNotifications } from '@/lib/hooks/use-internal-notifications';
import { InternalNotificationWithUser, InternalNotificationPriority, InternalNotificationType } from '@/lib/types/internal-notification.types';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';

export function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    isMarkingAsRead,
    isMarkingAllAsRead,
    showSkeleton,
  } = useInternalNotifications({ limit: 20 });

  const handleNotificationClick = (notification: InternalNotificationWithUser) => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
    
    // Navigate to action URL if available
    if (notification.action_url) {
      window.location.href = notification.action_url;
    }
  };

  const handleMarkAllAsRead = () => {
    if (unreadCount > 0) {
      markAllAsRead();
    }
  };

  // Get icon based on notification type
  const getNotificationIcon = (type?: string | null, priority?: string | null) => {
    // Type-specific icons
    switch (type) {
      // Appointment notifications - all use cyan calendar
      case InternalNotificationType.NEW_APPOINTMENT:
      case InternalNotificationType.APPOINTMENT_ASSIGNED:
      case InternalNotificationType.APPOINTMENT_STATUS_CHANGE:
        return <Calendar className="h-4 w-4 text-cyan-500" />;
      
      case InternalNotificationType.APPOINTMENT_UNASSIGNED:
        return (
          <div className="relative">
            <Calendar className="h-4 w-4 text-cyan-500" />
            <X className="h-2.5 w-2.5 text-orange-500 absolute -bottom-0.5 -right-0.5" />
          </div>
        );
      
      case InternalNotificationType.APPOINTMENT_TRANSFERRED:
        return (
          <div className="relative">
            <Calendar className="h-4 w-4 text-cyan-500" />
            <ArrowRightLeft className="h-2.5 w-2.5 text-purple-500 absolute -bottom-0.5 -right-0.5" />
          </div>
        );
      
      // Ticket notifications - all use orange ticket icon
      case InternalNotificationType.TICKET_ASSIGNED:
      case InternalNotificationType.NEW_TICKET:
      case InternalNotificationType.TICKET_STATUS_CHANGE:
        return <Ticket className="h-4 w-4 text-orange-500" />;
      
      case InternalNotificationType.TICKET_UNASSIGNED:
        return (
          <div className="relative">
            <Ticket className="h-4 w-4 text-orange-500" />
            <X className="h-2.5 w-2.5 text-red-500 absolute -bottom-0.5 -right-0.5" />
          </div>
        );
      
      case InternalNotificationType.TICKET_TRANSFERRED:
        return (
          <div className="relative">
            <Ticket className="h-4 w-4 text-orange-500" />
            <ArrowRightLeft className="h-2.5 w-2.5 text-purple-500 absolute -bottom-0.5 -right-0.5" />
          </div>
        );
      
      case InternalNotificationType.TICKET_COMPLETED:
        return (
          <div className="relative">
            <Ticket className="h-4 w-4 text-orange-500" />
            <CheckCheck className="h-2.5 w-2.5 text-green-500 absolute -bottom-0.5 -right-0.5" />
          </div>
        );
      
      case InternalNotificationType.TICKET_ON_HOLD:
        return (
          <div className="relative">
            <Ticket className="h-4 w-4 text-orange-500" />
            <Clock className="h-2.5 w-2.5 text-yellow-500 absolute -bottom-0.5 -right-0.5" />
          </div>
        );
      
      case InternalNotificationType.USER_MENTION:
        return <User className="h-4 w-4 text-purple-500" />;
      
      // Comment notifications with purple styling
      case InternalNotificationType.COMMENT_MENTION:
        return (
          <div className="relative">
            <MessageCircle className="h-4 w-4 text-purple-500 fill-purple-100" />
            <AtSign className="h-2.5 w-2.5 text-purple-600 absolute -bottom-0.5 -right-0.5" />
          </div>
        );
      
      case InternalNotificationType.COMMENT_REPLY:
        return (
          <div className="relative">
            <MessageCircle className="h-4 w-4 text-purple-500 fill-purple-100" />
            <Reply className="h-2.5 w-2.5 text-purple-600 absolute -bottom-0.5 -right-0.5" />
          </div>
        );
      
      case InternalNotificationType.COMMENT_ADDED:
        return <MessageCircle className="h-4 w-4 text-purple-500 fill-purple-100" />;
      
      case InternalNotificationType.COMMENT_REACTION:
        return (
          <div className="relative">
            <MessageCircle className="h-4 w-4 text-purple-500 fill-purple-100" />
            <span className="text-[10px] absolute -bottom-0.5 -right-0.5">👍</span>
          </div>
        );
      
      case InternalNotificationType.SYSTEM_ALERT:
        return priority === InternalNotificationPriority.URGENT || priority === InternalNotificationPriority.HIGH
          ? <AlertCircle className="h-4 w-4 text-red-500" />
          : <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      
      default:
        return <Info className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const NotificationItem = ({ notification }: { notification: InternalNotificationWithUser }) => {
    const timeAgo = formatDistanceToNow(new Date(notification.created_at!), { addSuffix: true });
    
    return (
      <div
        className={cn(
          "flex items-start gap-3 px-4 py-3 cursor-pointer transition-all duration-200",
          "hover:bg-cyan-50 dark:hover:bg-cyan-950/20",
          !notification.is_read && "bg-cyan-500/5 border-l-2 border-cyan-500"
        )}
        onClick={() => handleNotificationClick(notification)}
      >
        <div className="mt-0.5 flex-shrink-0">
          {getNotificationIcon(notification.type, notification.priority)}
        </div>
        <div className="flex-1 min-w-0 space-y-1">
          <p className={cn(
            "text-sm leading-tight",
            !notification.is_read ? "font-semibold text-foreground" : "text-muted-foreground"
          )}>
            {notification.title}
          </p>
          <p className={cn(
            "text-xs leading-relaxed break-words",
            "text-muted-foreground"
          )}>
            {notification.message}
          </p>
          <p className="text-xs text-muted-foreground/60">
            {timeAgo}
          </p>
        </div>
        {!notification.is_read && (
          <div className="flex-shrink-0">
            <div className="w-2 h-2 bg-cyan-500 rounded-full mt-1.5 animate-pulse" />
          </div>
        )}
      </div>
    );
  };

  const NotificationSkeleton = () => (
    <div className="flex items-start gap-3 px-4 py-3">
      <SkeletonPremium className="h-4 w-4 rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <SkeletonPremium className="h-4 w-3/4" />
        <SkeletonPremium className="h-3 w-full" />
        <SkeletonPremium className="h-3 w-1/4" />
      </div>
    </div>
  );

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative h-9 w-9"
        >
          <Bell className="h-[16px] w-[16px]" />
          {unreadCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 flex">
              <span className="animate-ping absolute inline-flex h-4 w-4 rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex items-center justify-center">
                <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-cyan-500 px-1 text-[10px] font-semibold text-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              </span>
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent 
        className="w-[420px] p-0 overflow-hidden bg-background border-border" 
        align="end" 
        sideOffset={8}
        forceMount
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
          <h3 className="font-semibold text-sm">
            Notifications
            {unreadCount > 0 && (
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                ({unreadCount} unread)
              </span>
            )}
          </h3>
          {unreadCount > 0 && (
            <ButtonPremium
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs hover:bg-cyan-100 dark:hover:bg-cyan-950/30"
              onClick={(e) => {
                e.stopPropagation();
                handleMarkAllAsRead();
              }}
              disabled={isMarkingAllAsRead}
            >
              {isMarkingAllAsRead ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <>
                  <CheckCheck className="h-3 w-3 mr-1" />
                  Mark all read
                </>
              )}
            </ButtonPremium>
          )}
        </div>
        
        {/* Notifications List */}
        <ScrollArea className="h-[400px] w-full">
          {showSkeleton || isLoading ? (
            <div className="py-2">
              <NotificationSkeleton />
              <NotificationSkeleton />
              <NotificationSkeleton />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <div className="rounded-full bg-muted/50 p-3 mb-4">
                <Bell className="h-6 w-6 text-muted-foreground/50" />
              </div>
              <p className="text-sm font-medium text-muted-foreground mb-1">
                All caught up!
              </p>
              <p className="text-xs text-muted-foreground/60 text-center">
                You have no new notifications
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                />
              ))}
            </div>
          )}
        </ScrollArea>
        
        {/* Footer */}
        {notifications.length > 0 && (
          <div className="px-4 py-2 border-t border-border bg-muted/20">
            <p className="text-xs text-center text-muted-foreground">
              Showing {notifications.length} most recent
            </p>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}