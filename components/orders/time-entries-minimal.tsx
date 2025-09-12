'use client';

import React from 'react';
import { Clock, User, Info, Calendar, Timer } from 'lucide-react';
import { TimeEntry } from '@/lib/types/database.types';
import { formatDuration } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface TimeEntriesMinimalProps {
  entries: Array<TimeEntry & { user?: { full_name: string; email?: string; role?: string } }>;
}

export function TimeEntriesMinimal({ entries }: TimeEntriesMinimalProps) {
  if (entries.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-sm text-muted-foreground">No time entries yet</p>
      </div>
    );
  }

  // Sort entries by start time (latest first)
  const sortedEntries = [...entries].sort((a, b) => 
    new Date(b.start_time).getTime() - new Date(a.start_time).getTime()
  );

  // Show only the 5 most recent entries
  const recentEntries = sortedEntries.slice(0, 5);
  const hasMore = sortedEntries.length > 5;

  return (
    <div className="space-y-1.5">
      {recentEntries.map((entry) => (
        <div 
          key={entry.id}
          className={`px-3 py-2 rounded-lg border transition-colors ${
            !entry.end_time 
              ? 'border-primary/50 bg-primary/5' 
              : 'border-border bg-card/50 hover:bg-blue-50 dark:hover:bg-blue-950/20'
          }`}
        >
          {/* Single or double line layout */}
          <div className="flex items-center justify-between gap-2">
            {/* Left: Duration, Date, Time, User */}
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex items-center gap-1">
                <Timer className="h-3 w-3 text-muted-foreground" />
                <span className="font-semibold text-xs">
                  {entry.duration_minutes ? 
                    formatDuration(entry.duration_minutes) : 
                    'Active'}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  {new Date(entry.start_time).toLocaleDateString('en-US', {
                    month: '2-digit',
                    day: '2-digit'
                  })}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  {new Date(entry.start_time).toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true
                  })}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <User className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs font-medium truncate">
                  {entry.user?.full_name?.split(' ')[0] || 'Unknown'}
                </span>
              </div>
            </div>
            
            {/* Right: Info icon and Status badge */}
            <div className="flex items-center gap-1.5">
              {entry.description && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="left" className="max-w-xs">
                      <p className="text-xs">{entry.description}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              {!entry.end_time && (
                <Badge variant="default" className="h-4 text-[10px] px-1.5">
                  Live
                </Badge>
              )}
            </div>
          </div>
        </div>
      ))}

      {hasMore && (
        <div className="text-center pt-1">
          <p className="text-[10px] text-muted-foreground">
            +{sortedEntries.length - 5} more
          </p>
        </div>
      )}
    </div>
  );
}