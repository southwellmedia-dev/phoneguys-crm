'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Package } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/orders/status-badge';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import type { ActivityLogItem } from '@/app/api/activity/route';

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
  if (activityTypes.ticket_status_changed > 0) {
    summaryParts.push(`${activityTypes.ticket_status_changed} status change${activityTypes.ticket_status_changed > 1 ? 's' : ''}`);
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
              <p className="text-sm font-medium">
                {activities.length > 1 ? (
                  <>
                    {entityNumber && (
                      <span className="font-mono">#{entityNumber}</span>
                    )}
                    {!entityNumber && entityType && (
                      <span className="capitalize">{entityType}</span>
                    )}
                    {' - '}
                    <span className="text-muted-foreground">{activities.length} activities</span>
                  </>
                ) : (
                  firstActivity.title
                )}
              </p>
              
              {/* Summary or single activity description */}
              <div className="mt-1">
                {activities.length > 1 ? (
                  <p className="text-sm text-muted-foreground">
                    {summary}
                  </p>
                ) : (
                  <>
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
                  </>
                )}
              </div>
              
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