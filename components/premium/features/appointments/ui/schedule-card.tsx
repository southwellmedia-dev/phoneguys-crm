"use client";

import * as React from "react";
import { MetricCard } from "@/components/premium/ui/cards/metric-card";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, 
  Clock, 
  MapPin,
  CalendarDays,
  Timer
} from "lucide-react";
import { format, parseISO, isToday, isTomorrow, isPast, differenceInDays } from "date-fns";
import { cn } from "@/lib/utils";

export interface ScheduleCardProps {
  scheduledDate: string;
  scheduledTime: string;
  duration?: number;
  location?: string;
  className?: string;
}

export function ScheduleCard({
  scheduledDate,
  scheduledTime,
  duration = 30,
  location,
  className
}: ScheduleCardProps) {
  // Parse the date and time safely
  const appointmentDate = React.useMemo(() => {
    if (!scheduledDate || !scheduledTime) {
      return null;
    }
    try {
      // Try to parse the ISO date string
      const dateStr = `${scheduledDate}T${scheduledTime}`;
      const parsed = parseISO(dateStr);
      // Check if the date is valid
      if (isNaN(parsed.getTime())) {
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  }, [scheduledDate, scheduledTime]);

  // If no valid date, return null early
  if (!appointmentDate) {
    return (
      <MetricCard
        title="Appointment Schedule"
        value="Not Scheduled"
        description="No date/time set for this appointment"
        variant="default"
        icon={<CalendarDays />}
        size="md"
        className={className}
      />
    );
  }

  // Format the date beautifully
  const formattedDate = React.useMemo(() => {
    return format(appointmentDate, "EEEE, MMMM d, yyyy");
  }, [appointmentDate]);

  const dayOfWeek = React.useMemo(() => {
    return format(appointmentDate, "EEEE");
  }, [appointmentDate]);

  const monthDay = React.useMemo(() => {
    return format(appointmentDate, "MMMM d");
  }, [appointmentDate]);

  const year = React.useMemo(() => {
    return format(appointmentDate, "yyyy");
  }, [appointmentDate]);

  // Format the time
  const formattedTime = React.useMemo(() => {
    return format(appointmentDate, "h:mm a");
  }, [appointmentDate]);

  // Calculate end time
  const endTime = React.useMemo(() => {
    const endDate = new Date(appointmentDate.getTime() + duration * 60000);
    return format(endDate, "h:mm a");
  }, [appointmentDate, duration]);

  // Determine relative date label
  const relativeDateLabel = React.useMemo(() => {
    if (isToday(appointmentDate)) return "Today";
    if (isTomorrow(appointmentDate)) return "Tomorrow";
    if (isPast(appointmentDate)) return "Past";
    const days = differenceInDays(appointmentDate, new Date());
    if (days <= 7) return `In ${days} days`;
    return null;
  }, [appointmentDate]);

  // Determine status color
  const statusColor = React.useMemo(() => {
    if (isPast(appointmentDate)) return "destructive";
    if (isToday(appointmentDate)) return "default";
    if (isTomorrow(appointmentDate)) return "secondary";
    return "outline";
  }, [appointmentDate]);

  // Determine variant based on status
  const cardVariant = React.useMemo(() => {
    if (isPast(appointmentDate)) return "error";
    if (isToday(appointmentDate)) return "success";
    if (isTomorrow(appointmentDate)) return "primary";
    return "accent-primary";
  }, [appointmentDate]);

  return (
    <MetricCard
      title="Appointment Schedule"
      value={
        <div className="space-y-2">
          <div className="text-2xl font-bold">
            {monthDay}
          </div>
          <div className="text-sm opacity-90">
            {dayOfWeek}, {year}
          </div>
        </div>
      }
      description={
        <div className="space-y-3 mt-4">
          {/* Time Display */}
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span className="font-semibold">{formattedTime}</span>
            <span className="text-xs opacity-75">({duration} min)</span>
          </div>
          
          {/* Location if provided */}
          {location && (
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 mt-0.5" />
              <span className="text-sm">{location}</span>
            </div>
          )}
          
          {/* Status */}
          <div className="flex items-center justify-between pt-2 border-t border-current/10">
            <div className="flex items-center gap-2">
              <Timer className="h-3.5 w-3.5" />
              <span className="text-xs font-medium">{duration} minutes</span>
            </div>
            {relativeDateLabel && (
              <Badge 
                variant={statusColor}
                className="text-xs"
              >
                {relativeDateLabel}
              </Badge>
            )}
          </div>
        </div>
      }
      variant={cardVariant}
      icon={<CalendarDays />}
      size="md"
      className={className}
    />
  );
}