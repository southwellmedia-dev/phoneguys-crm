"use client";

import { useUserActivity } from '@/lib/hooks/use-user-profile';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Activity,
  Clock,
  FileText,
  Package,
  Users,
  Calendar,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface UserActivityTimelineProps {
  userId: string;
  days?: number;
}

export function UserActivityTimeline({ userId, days = 7 }: UserActivityTimelineProps) {
  const { data: activityData, isLoading } = useUserActivity(userId, days);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Activity Timeline</CardTitle>
          <CardDescription>Recent user activities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'ticket_created':
      case 'ticket_assigned':
        return <Package className="h-4 w-4" />;
      case 'ticket_status_changed':
      case 'ticket_completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'appointment_created':
      case 'appointment_converted':
        return <Calendar className="h-4 w-4" />;
      case 'note_created':
        return <FileText className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getActivityColor = (type: string) => {
    if (type.includes('completed') || type.includes('converted')) return 'text-green-600';
    if (type.includes('created') || type.includes('assigned')) return 'text-blue-600';
    if (type.includes('cancelled')) return 'text-red-600';
    return 'text-gray-600';
  };

  const formatActivityType = (type: string) => {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Activity Timeline</CardTitle>
          <CardDescription>
            Last {days} days of activity • {activityData?.summary?.totalActivities || 0} total activities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px] pr-4">
            <div className="space-y-6">
              {activityData?.timeline?.map((day: any) => (
                <div key={day.date} className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="h-px flex-1 bg-border" />
                    <span className="text-sm font-medium text-muted-foreground">
                      {new Date(day.date).toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </span>
                    <div className="h-px flex-1 bg-border" />
                  </div>
                  
                  <div className="space-y-3">
                    {day.activities.map((activity: any) => (
                      <div key={activity.id} className="flex items-start gap-3 pl-4">
                        <div className={`mt-1 ${getActivityColor(activity.activity_type)}`}>
                          {getActivityIcon(activity.activity_type)}
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium">
                              {formatActivityType(activity.activity_type)}
                            </p>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                            </span>
                          </div>
                          {activity.details && Object.keys(activity.details).length > 0 && (
                            <div className="flex items-center gap-2 flex-wrap">
                              {activity.details.ticket_number && (
                                <Badge variant="outline" className="text-xs">
                                  {activity.details.ticket_number}
                                </Badge>
                              )}
                              {activity.details.appointment_number && (
                                <Badge variant="outline" className="text-xs">
                                  {activity.details.appointment_number}
                                </Badge>
                              )}
                              {activity.details.old_status && activity.details.new_status && (
                                <span className="text-xs text-muted-foreground">
                                  {activity.details.old_status} → {activity.details.new_status}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              
              {(!activityData?.timeline || activityData.timeline.length === 0) && (
                <div className="text-center py-8">
                  <Info className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No activity recorded in the last {days} days</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Activity Summary */}
      {activityData?.summary && (
        <Card>
          <CardHeader>
            <CardTitle>Activity Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <p className="text-sm font-medium">Total Activities</p>
                <p className="text-2xl font-bold">{activityData.summary.totalActivities}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Days Active</p>
                <p className="text-2xl font-bold">{activityData.summary.daysActive}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Most Active Day</p>
                <p className="text-sm font-medium">
                  {activityData.summary.mostActiveDay?.date ? 
                    new Date(activityData.summary.mostActiveDay.date).toLocaleDateString() : 
                    'N/A'
                  }
                </p>
                <p className="text-xs text-muted-foreground">
                  {activityData.summary.mostActiveDay?.activities?.length || 0} activities
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}