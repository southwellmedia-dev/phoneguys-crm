'use client';

import React from 'react';
import { Calendar, Clock, User, Smartphone, MapPin } from 'lucide-react';
import { SearchResult } from '@/lib/services/global-search.service';
import { Appointment } from '@/lib/repositories/appointment.repository';
import { StatusBadge } from '@/components/premium';
import { cn } from '@/lib/utils';

interface AppointmentSearchResultProps {
  result: SearchResult;
  isSelected?: boolean;
  onClick?: () => void;
}

export function AppointmentSearchResult({ result, isSelected, onClick }: AppointmentSearchResultProps) {
  const appointment = result.data as Appointment;

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getUrgencyColor = (urgency: string | null) => {
    switch (urgency) {
      case 'emergency': return 'text-red-600 dark:text-red-400';
      case 'walk-in': return 'text-orange-600 dark:text-orange-400';
      case 'scheduled': return 'text-blue-600 dark:text-blue-400';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <div
      className={cn(
        "group flex items-start gap-3 px-3 py-2.5 rounded-lg transition-all cursor-pointer",
        "hover:bg-primary/5 dark:hover:bg-primary/10",
        isSelected && "bg-primary/10 dark:bg-primary/20"
      )}
      onClick={onClick}
    >
      {/* Icon */}
      <div className={cn(
        "mt-0.5 p-2 rounded-md transition-colors",
        "bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400",
        "group-hover:bg-blue-200 dark:group-hover:bg-blue-900"
      )}>
        <Calendar className="h-4 w-4" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm text-foreground truncate">
            {result.title}
          </span>
          {appointment.status && (
            <StatusBadge 
              status={appointment.status as any} 
              variant="soft"
              size="sm"
            />
          )}
          {appointment.urgency && (
            <span className={cn(
              "text-xs font-medium capitalize",
              getUrgencyColor(appointment.urgency)
            )}>
              {appointment.urgency}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-3 mt-0.5">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>{formatDate(appointment.scheduled_date)}</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{formatTime(appointment.scheduled_time)}</span>
          </div>
          {appointment.duration_minutes && (
            <span className="text-xs text-muted-foreground">
              ({appointment.duration_minutes} min)
            </span>
          )}
        </div>

        {appointment.devices && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
            <Smartphone className="h-3 w-3" />
            <span>
              {appointment.devices.manufacturer?.name || ''} {appointment.devices.model_name}
            </span>
          </div>
        )}

        {appointment.description && (
          <div className="text-xs text-muted-foreground mt-1 truncate">
            {appointment.description}
          </div>
        )}

        {appointment.estimated_cost && (
          <div className="text-xs font-medium text-primary mt-1">
            Est. ${appointment.estimated_cost.toFixed(2)}
          </div>
        )}
      </div>

      {/* Action hint */}
      <div className={cn(
        "text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity",
        isSelected && "opacity-100"
      )}>
        Enter →
      </div>
    </div>
  );
}