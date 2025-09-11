'use client';

import React, { useState, useMemo } from 'react';
import { 
  LineChart,
  Line,
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Dot
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { 
  Clock, 
  User, 
  Calendar, 
  Trash2, 
  Timer,
  FileText,
  TrendingUp
} from 'lucide-react';
import { TimeEntry } from '@/lib/types/database.types';
import { formatDuration } from '@/lib/utils';
import { toast } from 'sonner';

interface TimeEntriesSectionProps {
  entries: Array<TimeEntry & { user?: { full_name: string; email?: string; role?: string } }>;
  totalMinutes: number;
  canDelete?: boolean;
  onDelete?: (entryId: string) => Promise<void>;
}

export function TimeEntriesSection({ entries, totalMinutes, canDelete = false, onDelete }: TimeEntriesSectionProps) {
  const [deleteEntry, setDeleteEntry] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Prepare chart data from entries
  const chartData = useMemo(() => {
    if (!entries || entries.length === 0) return [];

    // Sort entries by start time
    const sortedEntries = [...entries].sort((a, b) => 
      new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
    );

    // Create data points for the chart
    let cumulativeMinutes = 0;
    return sortedEntries.map((entry, index) => {
      const duration = entry.duration_minutes || 0;
      cumulativeMinutes += duration;
      
      return {
        index: index + 1,
        sessionNumber: `Session ${index + 1}`,
        date: new Date(entry.start_time).toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        }),
        time: new Date(entry.start_time).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        }),
        duration: duration,
        cumulative: cumulativeMinutes,
        technician: entry.user?.full_name || 'Unknown User',
        description: entry.description || '',
        isActive: !entry.end_time,
        hours: parseFloat((duration / 60).toFixed(2)),
        cumulativeHours: parseFloat((cumulativeMinutes / 60).toFixed(2)),
      };
    });
  }, [entries]);

  const handleDelete = async () => {
    if (!deleteEntry || !onDelete) return;

    setDeleting(true);
    try {
      await onDelete(deleteEntry);
      toast.success('Time entry deleted successfully');
    } catch (error) {
      console.error('Failed to delete time entry:', error);
      toast.error('Failed to delete time entry');
    } finally {
      setDeleting(false);
      setDeleteEntry(null);
    }
  };

  const formatTimeRange = (entry: TimeEntry) => {
    const startTime = new Date(entry.start_time).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
    
    if (entry.end_time) {
      const endTime = new Date(entry.end_time).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
      return `${startTime} - ${endTime}`;
    }
    
    return `${startTime} - In progress`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
    });
  };

  // Custom tooltip for chart
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border rounded-lg shadow-lg p-3 space-y-1">
          <p className="font-semibold">{data.sessionNumber}</p>
          <p className="text-sm">{data.date} at {data.time}</p>
          <p className="text-sm">Duration: {formatDuration(data.duration)}</p>
          <p className="text-sm">Total: {formatDuration(data.cumulative)}</p>
          <p className="text-sm text-muted-foreground">By {data.technician}</p>
          {data.isActive && (
            <Badge variant="default" className="text-xs">Active</Badge>
          )}
        </div>
      );
    }
    return null;
  };

  // Group entries by date for the list view
  const groupedEntries = useMemo(() => {
    return entries.reduce((acc, entry) => {
      const date = formatDate(entry.start_time);
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(entry);
      return acc;
    }, {} as Record<string, typeof entries>);
  }, [entries]);

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <div className="p-4 rounded-full bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-900/20 dark:to-amber-900/20 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
          <Timer className="h-8 w-8 text-orange-500 dark:text-orange-400" />
        </div>
        <h3 className="font-medium text-sm mb-1">No time entries yet</h3>
        <p className="text-xs text-muted-foreground">Start the timer to begin tracking work time</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {/* Time Tracking Chart - only show if there are 2+ entries */}
        {chartData.length >= 2 && (
          <Card className="border border-gray-200 dark:border-gray-700">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <CardTitle className="text-sm font-semibold">Time Tracking Overview</CardTitle>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-[2px] bg-primary"></div>
                    <span>Cumulative</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-[2px] bg-orange-500" style={{backgroundImage: 'repeating-linear-gradient(90deg, rgb(251 146 60), rgb(251 146 60) 3px, transparent 3px, transparent 6px)'}}></div>
                    <span>Session</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-2">
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                  <XAxis 
                    dataKey="sessionNumber" 
                    className="text-xs"
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis 
                    className="text-xs"
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    label={{ value: 'Hours', angle: -90, position: 'insideLeft', style: { fill: 'hsl(var(--muted-foreground))', fontSize: 10 } }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line 
                    type="monotone" 
                    dataKey="cumulativeHours" 
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ r: 3, fill: 'hsl(var(--primary))' }}
                    activeDot={{ r: 5, fill: 'hsl(var(--primary))' }}
                    name="Total Hours"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="hours" 
                    stroke="rgb(251 146 60)"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={{ r: 3, fill: 'rgb(251 146 60)' }}
                    activeDot={{ r: 5, fill: 'rgb(251 146 60)' }}
                    name="Session Hours"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Time Entries List */}
        <Card className="border border-gray-200 dark:border-gray-700">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm font-semibold">Time Entries</CardTitle>
              <Badge variant="secondary" className="ml-auto">
                {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(groupedEntries).map(([date, dateEntries]) => (
              <div key={date} className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  {date}
                  <span className="text-xs">
                    ({dateEntries.length} {dateEntries.length === 1 ? 'entry' : 'entries'})
                  </span>
                </div>
              
              {dateEntries.map((entry) => (
                <div 
                  key={entry.id}
                  className={`flex items-start gap-3 p-3 rounded-lg border transition-colors hover:bg-muted/50 ${
                    !entry.end_time ? 'border-primary/50 bg-primary/5' : 'bg-card'
                  }`}
                >
                  {/* Time Duration Badge */}
                  <div className="flex items-center gap-2 min-w-[80px]">
                    <Clock className="h-3.5 w-3.5 text-primary" />
                    <span className="font-medium">
                      {entry.duration_minutes ? 
                        formatDuration(entry.duration_minutes) : 
                        'Active'}
                    </span>
                  </div>

                  {/* Main Content */}
                  <div className="flex-1 space-y-1">
                    {/* Time Range and Technician */}
                    <div className="flex items-center gap-3 text-sm">
                      <span className="text-muted-foreground">
                        {formatTimeRange(entry)}
                      </span>
                      <span className="text-muted-foreground">•</span>
                      <div className="flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="font-medium">
                          {entry.user?.full_name || 'Unknown User'}
                        </span>
                        {entry.user?.role && (
                          <Badge variant="outline" className="h-5 text-xs ml-1">
                            {entry.user.role}
                          </Badge>
                        )}
                      </div>
                      {!entry.end_time && (
                        <Badge variant="default" className="h-5 text-xs animate-pulse">
                          Active
                        </Badge>
                      )}
                    </div>

                    {/* Description */}
                    {entry.description && (
                      <p className="text-sm text-muted-foreground">
                        {entry.description}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  {canDelete && entry.end_time && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:bg-destructive hover:text-white"
                      onClick={() => setDeleteEntry(entry.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          ))}
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteEntry} onOpenChange={() => setDeleteEntry(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Time Entry</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this time entry? This action cannot be undone
              and will affect billing calculations.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? 'Deleting...' : 'Delete Entry'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}