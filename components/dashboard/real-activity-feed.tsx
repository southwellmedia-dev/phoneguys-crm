'use client';

import React, { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/orders/status-badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Activity, 
  Package,
  UserCheck,
  RefreshCw,
  CheckCircle,
  Play,
  Pause,
  MessageCircle,
  UserPlus,
  User,
  Calendar,
  ArrowRight,
  Lock,
  AlertTriangle,
  Clock,
  Filter,
  ChevronRight
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import type { ActivityLogItem } from '@/app/api/activity/route';
import { GroupedActivityItem } from './grouped-activity-item';
import { ACTIVITY_COLOR_CLASSES } from '@/lib/constants/activity-colors';

interface RealActivityFeedProps {
  limit?: number;
  className?: string;
  showFilters?: boolean;
  compact?: boolean;
}

const iconMap: Record<string, React.ReactNode> = {
  'package': <Package className="h-4 w-4" />,
  'user-check': <UserCheck className="h-4 w-4" />,
  'refresh': <RefreshCw className="h-4 w-4" />,
  'check-circle': <CheckCircle className="h-4 w-4" />,
  'play': <Play className="h-4 w-4" />,
  'pause': <Pause className="h-4 w-4" />,
  'message-circle': <MessageCircle className="h-4 w-4" />,
  'user-plus': <UserPlus className="h-4 w-4" />,
  'user': <User className="h-4 w-4" />,
  'calendar': <Calendar className="h-4 w-4" />,
  'arrow-right': <ArrowRight className="h-4 w-4" />,
  'lock': <Lock className="h-4 w-4" />,
  'alert-triangle': <AlertTriangle className="h-4 w-4" />,
  'activity': <Activity className="h-4 w-4" />
};

// Use centralized color system
const getColorClasses = (color: string) => {
  const colorClass = ACTIVITY_COLOR_CLASSES[color as keyof typeof ACTIVITY_COLOR_CLASSES] || ACTIVITY_COLOR_CLASSES.gray;
  return `${colorClass.background} ${colorClass.text}`;
};

const colorMap: Record<string, string> = {
  'blue': getColorClasses('blue'),
  'green': getColorClasses('green'),
  'yellow': getColorClasses('yellow'),
  'orange': getColorClasses('orange'),
  'purple': getColorClasses('purple'),
  'red': getColorClasses('red'),
  'gray': getColorClasses('gray'),
  'cyan': getColorClasses('cyan')
};

export function RealActivityFeed({ 
  limit = 20, 
  className, 
  showFilters = false,
  compact = false 
}: RealActivityFeedProps) {
  const queryClient = useQueryClient();
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);

  // Fetch activity logs from the API
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['activity-logs', limit, selectedFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: limit.toString() });
      if (selectedFilter) {
        params.append('activity_type', selectedFilter);
      }
      
      const response = await fetch(`/api/activity?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch activity logs');
      }
      const result = await response.json();
      return result;
    },
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000 // Refresh every minute
  });

  // Set up real-time subscription for activity logs
  useEffect(() => {
    const supabase = createClient();
    
    const channel = supabase
      .channel('activity-logs')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_activity_logs'
        },
        (payload) => {
          // Refresh the query to get properly formatted data
          // Rather than trying to format it here, let the API handle it
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch]);

  const activities = data?.data || [];
  const activityTypes = data?.activityTypes || [];

  // Group consecutive activities for the same entity
  const groupedActivities = React.useMemo(() => {
    if (activities.length === 0) return [];
    
    const groups: { activities: ActivityLogItem[], isGroup: boolean }[] = [];
    let currentGroup: ActivityLogItem[] = [activities[0]];
    
    for (let i = 1; i < activities.length; i++) {
      const current = activities[i];
      const previous = activities[i - 1];
      
      // Get the ticket/appointment numbers from both activities
      const currentTicket = current.details?.ticket_number;
      const previousTicket = previous.details?.ticket_number;
      const currentAppt = current.details?.appointment_number;
      const previousAppt = previous.details?.appointment_number;
      
      // Check if this activity is for the same entity as the previous one
      // This could be same entity_id OR same ticket_number OR same appointment_number
      const sameDirectEntity = current.entity_id === previous.entity_id && 
                              current.entity_type === previous.entity_type &&
                              current.entity_id !== null;
      
      // Check if they reference the same ticket or appointment
      const sameTicketReference = currentTicket && previousTicket && currentTicket === previousTicket;
      const sameApptReference = currentAppt && previousAppt && currentAppt === previousAppt;
      
      // Group if either condition is true
      const shouldGroup = sameDirectEntity || sameTicketReference || sameApptReference;
      
      if (shouldGroup) {
        // Add to current group
        currentGroup.push(current);
      } else {
        // Save the current group and start a new one
        groups.push({
          activities: currentGroup,
          isGroup: currentGroup.length > 1
        });
        currentGroup = [current];
      }
    }
    
    // Don't forget the last group
    if (currentGroup.length > 0) {
      groups.push({
        activities: currentGroup,
        isGroup: currentGroup.length > 1
      });
    }
    
    return groups;
  }, [activities]);

  const getEntityLink = (activity: ActivityLogItem): string | null => {
    if (!activity.entity_id) return null;
    
    switch (activity.entity_type) {
      case 'repair_ticket':
      case 'ticket':
        return `/orders/${activity.entity_id}`;
      case 'appointment':
        return `/appointments/${activity.entity_id}`;
      case 'customer':
        return `/customers/${activity.entity_id}`;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-start gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
            <p>Failed to load activity</p>
            <Button onClick={() => refetch()} variant="outline" size="sm" className="mt-2">
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Activity
          </CardTitle>
          <div className="flex items-center gap-2">
            {showFilters && activityTypes.length > 0 && (
              <select
                value={selectedFilter || ''}
                onChange={(e) => setSelectedFilter(e.target.value || null)}
                className="text-sm border rounded-md px-2 py-1"
              >
                <option value="">All Activities</option>
                {activityTypes.map(type => (
                  <option key={type} value={type}>
                    {type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </option>
                ))}
              </select>
            )}
            <Button
              onClick={() => refetch()}
              variant="ghost"
              size="sm"
              className="h-8 px-2"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className={cn(
          "w-full",
          compact ? "h-[300px]" : "h-[540px]"
        )}>
          {activities.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No recent activity</p>
              <p className="text-sm mt-1">Activities will appear here as they happen</p>
            </div>
          ) : (
            <div>
              {groupedActivities.map((group, groupIndex) => {
                // If it's a group, use the grouped component
                if (group.isGroup) {
                  return (
                    <GroupedActivityItem
                      key={`group-${groupIndex}`}
                      activities={group.activities}
                      iconMap={iconMap}
                      colorMap={colorMap}
                      getEntityLink={getEntityLink}
                    />
                  );
                }
                
                // Otherwise render a single activity as before
                const activity = group.activities[0];
                const link = getEntityLink(activity);
                const content = (
                  <div className={cn(
                    "flex items-start gap-3 p-4 transition-colors border-b last:border-b-0",
                    link && "hover:bg-muted/50 cursor-pointer",
                    // Highlight new appointment requests
                    activity.activity_type === 'appointment_created' && 
                    activity.details?.status === 'scheduled' && 
                    "bg-amber-50/50 dark:bg-amber-900/10 border-l-4 border-amber-500",
                    // Highlight appointment conversions
                    activity.activity_type === 'appointment_converted' && 
                    "bg-green-50/50 dark:bg-green-900/10 border-l-4 border-green-500",
                    // Highlight ticket assigned from conversion
                    activity.activity_type === 'ticket_assigned' && 
                    (activity.details?.from_appointment || activity.details?.appointment_number) && 
                    "bg-green-50/50 dark:bg-green-900/10 border-l-4 border-green-500"
                  )}>
                    {/* Add spacing for alignment with grouped items */}
                    <div className="w-5" />
                    
                    <div className={cn(
                      "rounded-full p-2",
                      colorMap[activity.color || 'gray'],
                      // Pulse animation for new appointment requests
                      activity.activity_type === 'appointment_created' && 
                      activity.details?.status === 'scheduled' && 
                      "animate-pulse",
                      // Pulse animation for conversions
                      (activity.activity_type === 'appointment_converted' || 
                       (activity.activity_type === 'ticket_assigned' && 
                        (activity.details?.from_appointment || activity.details?.appointment_number))) && 
                      "animate-pulse"
                    )}>
                      {iconMap[activity.icon || 'activity']}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">
                            {activity.title}
                          </p>
                          <div className="mt-1">
                            {/* Show status badges for status changes */}
                            {activity.activity_type === 'ticket_status_changed' && activity.details && (
                              <div className="flex items-center gap-2 mb-1">
                                {activity.details.old_status && (
                                  <>
                                    <StatusBadge status={activity.details.old_status} size="xs" />
                                    <span className="text-xs text-muted-foreground">→</span>
                                  </>
                                )}
                                {activity.details.new_status && (
                                  <StatusBadge status={activity.details.new_status} size="xs" />
                                )}
                              </div>
                            )}
                            {/* Show regular description if not a status change */}
                            {activity.activity_type !== 'ticket_status_changed' && (
                              <p className="text-sm text-muted-foreground">
                                {activity.description}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-muted-foreground">
                              {activity.user_name}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              •
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {/* Show ticket/appointment number badge */}
                          {(activity.details?.ticket_number || activity.details?.appointment_number) && (
                            <Badge variant="secondary" className="text-xs font-mono">
                              {activity.details?.ticket_number 
                                ? `#${activity.details.ticket_number}`
                                : activity.details?.appointment_number 
                                ? `${activity.details.appointment_number}`
                                : null
                              }
                            </Badge>
                          )}
                          {link && (
                            <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );

                return link ? (
                  <Link key={activity.id} href={link} className="block">
                    {content}
                  </Link>
                ) : (
                  <div key={activity.id}>
                    {content}
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}