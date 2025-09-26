'use client';

import React, { useState } from 'react';
import { 
  ChevronDown, 
  ChevronRight, 
  Package, 
  RefreshCw, 
  UserCheck, 
  StickyNote, 
  Timer, 
  MessageCircle, 
  ArrowRight,
  Clock
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/orders/status-badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import type { ActivityLogItem } from '@/app/api/activity/route';
import { ACTIVITY_GROUP_ICONS } from '@/lib/constants/activity-colors';

interface GroupedActivityItemProps {
  activities: ActivityLogItem[];
  iconMap: Record<string, React.ReactNode>;
  colorMap: Record<string, string>;
  getEntityLink: (activity: ActivityLogItem) => string | null;
}

export function GroupedActivityItem({ 
  activities, 
  iconMap, 
  colorMap,
  getEntityLink 
}: GroupedActivityItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  if (activities.length === 0) return null;
  
  const firstActivity = activities[0];
  const lastActivity = activities[activities.length - 1];
  const entityNumber = firstActivity.details?.ticket_number || firstActivity.details?.appointment_number;
  const entityType = firstActivity.entity_type === 'repair_ticket' || firstActivity.entity_type === 'ticket' 
    ? 'ticket' 
    : firstActivity.entity_type;
  
  // Get a summary of activity types
  const activityTypes = activities.reduce((acc, act) => {
    const type = act.activity_type;
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const summaryParts: string[] = [];
  if (activityTypes.appointment_converted > 0) {
    summaryParts.push(`${activityTypes.appointment_converted} conversion${activityTypes.appointment_converted > 1 ? 's' : ''}`);
  }
  // Combine ticket and appointment status changes
  const totalStatusChanges = (activityTypes.ticket_status_changed || 0) + (activityTypes.appointment_status_changed || 0);
  if (totalStatusChanges > 0) {
    summaryParts.push(`${totalStatusChanges} status change${totalStatusChanges > 1 ? 's' : ''}`);
  }
  if (activityTypes.ticket_assigned > 0) {
    summaryParts.push(`${activityTypes.ticket_assigned} assignment${activityTypes.ticket_assigned > 1 ? 's' : ''}`);
  }
  if (activityTypes.note_created > 0) {
    summaryParts.push(`${activityTypes.note_created} note${activityTypes.note_created > 1 ? 's' : ''}`);
  }
  if (activityTypes.timer_start > 0 || activityTypes.timer_stop > 0) {
    const timerCount = (activityTypes.timer_start || 0) + (activityTypes.timer_stop || 0);
    summaryParts.push(`${timerCount} timer action${timerCount > 1 ? 's' : ''}`);
  }
  if (activityTypes.comment_created > 0 || activityTypes.comment_reply > 0) {
    const commentCount = (activityTypes.comment_created || 0) + (activityTypes.comment_reply || 0);
    summaryParts.push(`${commentCount} comment${commentCount > 1 ? 's' : ''}`);
  }
  
  // If no specific summary, just say X activities
  const summary = summaryParts.length > 0 
    ? summaryParts.join(', ')
    : `${activities.length} activities`;
  
  // Get the most recent status for display
  const latestStatusChange = activities.find(a => a.activity_type === 'ticket_status_changed');
  const currentStatus = latestStatusChange?.details?.new_status || latestStatusChange?.details?.to_status;
  
  // Create activity type icons with counts using centralized color system
  const activityIcons: Array<{ icon: React.ReactNode; tooltip: string; count: number; color: string }> = [];
  
  if (activityTypes.appointment_converted > 0) {
    activityIcons.push({
      icon: <ArrowRight className={cn("h-3 w-3", ACTIVITY_GROUP_ICONS.conversions.color)} />,
      tooltip: `${activityTypes.appointment_converted} conversion${activityTypes.appointment_converted > 1 ? 's' : ''}`,
      count: activityTypes.appointment_converted,
      color: ACTIVITY_GROUP_ICONS.conversions.color
    });
  }
  
  // Include both ticket and appointment status changes
  const statusChangeCount = (activityTypes.ticket_status_changed || 0) + (activityTypes.appointment_status_changed || 0);
  if (statusChangeCount > 0) {
    activityIcons.push({
      icon: <RefreshCw className={cn("h-3 w-3", ACTIVITY_GROUP_ICONS.statusChanges.color)} />,
      tooltip: `${statusChangeCount} status change${statusChangeCount > 1 ? 's' : ''}`,
      count: statusChangeCount,
      color: ACTIVITY_GROUP_ICONS.statusChanges.color
    });
  }
  
  if (activityTypes.ticket_assigned > 0) {
    activityIcons.push({
      icon: <UserCheck className={cn("h-3 w-3", ACTIVITY_GROUP_ICONS.assignments.color)} />,
      tooltip: `${activityTypes.ticket_assigned} assignment${activityTypes.ticket_assigned > 1 ? 's' : ''}`,
      count: activityTypes.ticket_assigned,
      color: ACTIVITY_GROUP_ICONS.assignments.color
    });
  }
  
  if (activityTypes.note_created > 0) {
    activityIcons.push({
      icon: <StickyNote className={cn("h-3 w-3", ACTIVITY_GROUP_ICONS.notes.color)} />,
      tooltip: `${activityTypes.note_created} note${activityTypes.note_created > 1 ? 's' : ''}`,
      count: activityTypes.note_created,
      color: ACTIVITY_GROUP_ICONS.notes.color
    });
  }
  
  if (activityTypes.timer_start > 0 || activityTypes.timer_stop > 0) {
    const timerCount = (activityTypes.timer_start || 0) + (activityTypes.timer_stop || 0);
    activityIcons.push({
      icon: <Timer className={cn("h-3 w-3", ACTIVITY_GROUP_ICONS.timers.color)} />,
      tooltip: `${timerCount} timer action${timerCount > 1 ? 's' : ''}`,
      count: timerCount,
      color: ACTIVITY_GROUP_ICONS.timers.color
    });
  }
  
  if (activityTypes.comment_created > 0 || activityTypes.comment_reply > 0) {
    const commentCount = (activityTypes.comment_created || 0) + (activityTypes.comment_reply || 0);
    activityIcons.push({
      icon: <MessageCircle className={cn("h-3 w-3", ACTIVITY_GROUP_ICONS.comments.color)} />,
      tooltip: `${commentCount} comment${commentCount > 1 ? 's' : ''}`,
      count: commentCount,
      color: ACTIVITY_GROUP_ICONS.comments.color
    });
  }
  
  // Add generic activity icon if there are other types
  const knownTypes = [
    'appointment_converted', 
    'ticket_status_changed', 
    'appointment_status_changed', // Added this
    'ticket_assigned', 
    'note_created', 
    'timer_start', 
    'timer_stop', 
    'comment_created', 
    'comment_reply'
  ];
  const hasOtherTypes = activities.some(a => !knownTypes.includes(a.activity_type));
  if (hasOtherTypes) {
    const otherCount = activities.filter(a => !knownTypes.includes(a.activity_type)).length;
    activityIcons.push({
      icon: <Clock className={cn("h-3 w-3", ACTIVITY_GROUP_ICONS.other.color)} />,
      tooltip: `${otherCount} other activit${otherCount > 1 ? 'ies' : 'y'}`,
      count: otherCount,
      color: ACTIVITY_GROUP_ICONS.other.color
    });
  }
  
  return (
    <div className="border-b last:border-b-0">
      {/* Group Header */}
      <div
        className={cn(
          "flex items-start gap-3 p-4 transition-colors cursor-pointer hover:bg-muted/50",
          activities.length > 1 && "group"
        )}
        onClick={() => activities.length > 1 && setIsExpanded(!isExpanded)}
      >
        {/* Chevron for expandable groups */}
        {activities.length > 1 && (
          <div className="flex items-center justify-center w-5 pt-1">
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            )}
          </div>
        )}
        
        {/* Icon */}
        <div className={cn(
          "rounded-full p-2",
          colorMap[firstActivity.color || 'gray'],
          activities.length === 1 && "ml-5" // Align single items with grouped items
        )}>
          {iconMap[firstActivity.icon || 'activity']}
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                {activities.length > 1 ? (
                  <>
                    <p className="text-sm font-medium">
                      {entityNumber && (
                        <span className="font-mono">#{entityNumber}</span>
                      )}
                      {!entityNumber && entityType && (
                        <span className="capitalize">{entityType}</span>
                      )}
                    </p>
                    {/* Activity type icons */}
                    {activityIcons.length > 0 && (
                      <TooltipProvider delayDuration={300}>
                        <div className="flex items-center gap-1">
                          {activityIcons.map((item, index) => (
                            <Tooltip key={index}>
                              <TooltipTrigger asChild>
                                <div className="flex items-center gap-0.5">
                                  <div className="p-1 rounded hover:bg-muted/50 transition-colors">
                                    {item.icon}
                                  </div>
                                  {item.count > 1 && (
                                    <span className={cn("text-xs font-medium", item.color)}>
                                      {item.count}
                                    </span>
                                  )}
                                </div>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="text-xs">
                                {item.tooltip}
                              </TooltipContent>
                            </Tooltip>
                          ))}
                        </div>
                      </TooltipProvider>
                    )}
                    {/* Total activities count as a subtle badge */}
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5">
                      {activities.length} total
                    </Badge>
                  </>
                ) : (
                  <p className="text-sm font-medium">
                    {firstActivity.title}
                  </p>
                )}
              </div>
              
              {/* Summary or single activity description */}
              {activities.length === 1 && (
                <div className="mt-1">
                  {firstActivity.activity_type === 'ticket_status_changed' && firstActivity.details && (
                    <div className="flex items-center gap-2 mb-1">
                      {firstActivity.details.old_status && (
                        <>
                          <StatusBadge status={firstActivity.details.old_status} size="xs" />
                          <span className="text-xs text-muted-foreground">→</span>
                        </>
                      )}
                      {firstActivity.details.new_status && (
                        <StatusBadge status={firstActivity.details.new_status} size="xs" />
                      )}
                    </div>
                  )}
                  {firstActivity.activity_type !== 'ticket_status_changed' && (
                    <p className="text-sm text-muted-foreground">
                      {firstActivity.description}
                    </p>
                  )}
                </div>
              )}
              
              {/* Time and user info */}
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-muted-foreground">
                  {activities.length > 1 
                    ? `${firstActivity.user_name} and others`
                    : firstActivity.user_name
                  }
                </span>
                <span className="text-xs text-muted-foreground">•</span>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(lastActivity.created_at), { addSuffix: true })}
                </span>
              </div>
            </div>
            
            {/* Badges */}
            <div className="flex items-center gap-2">
              {entityNumber && activities.length > 1 && (
                <Badge variant="secondary" className="text-xs font-mono">
                  #{entityNumber}
                </Badge>
              )}
              {currentStatus && activities.length > 1 && (
                <StatusBadge status={currentStatus} size="xs" />
              )}
              {activities.length === 1 && (firstActivity.details?.ticket_number || firstActivity.details?.appointment_number) && (
                <Badge variant="secondary" className="text-xs font-mono">
                  {firstActivity.details?.ticket_number 
                    ? `#${firstActivity.details.ticket_number}`
                    : firstActivity.details?.appointment_number 
                    ? `${firstActivity.details.appointment_number}`
                    : null
                  }
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Expanded Activities */}
      {isExpanded && activities.length > 1 && (
        <div className="bg-muted/30 border-t">
          {activities.map((activity, index) => (
            <div
              key={activity.id}
              className={cn(
                "flex items-start gap-3 px-4 py-3 ml-9",
                index !== activities.length - 1 && "border-b border-border/50"
              )}
            >
              {/* Activity Icon */}
              <div className={cn(
                "rounded-full p-1.5",
                colorMap[activity.color || 'gray'],
                "scale-90"
              )}>
                {iconMap[activity.icon || 'activity']}
              </div>
              
              {/* Activity Content */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">
                  {activity.title}
                </p>
                {activity.activity_type === 'ticket_status_changed' && activity.details ? (
                  <div className="flex items-center gap-2 mt-1">
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
                ) : (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {activity.description}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-muted-foreground">
                    {activity.user_name}
                  </span>
                  <span className="text-xs text-muted-foreground">•</span>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}