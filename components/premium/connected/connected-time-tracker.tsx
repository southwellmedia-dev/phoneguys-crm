"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { 
  Play, 
  Pause, 
  Clock,
  Timer,
  AlertCircle,
  CheckCircle,
  User,
  Calendar,
  TrendingUp
} from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface TimeEntry {
  id: string;
  duration_minutes: number;
  description?: string;
  created_at: string;
  user?: {
    name?: string;
    email?: string;
  };
}

interface ConnectedTimeTrackerProps {
  ticketId: string;
  ticketNumber: string;
  customerName?: string;
  timeEntries?: TimeEntry[];
  timerRunning?: boolean;
  timerStartTime?: string;
  totalMinutes?: number;
  isDisabled?: boolean;
  disabledReason?: string;
  className?: string;
}

export function ConnectedTimeTracker({
  ticketId,
  ticketNumber,
  customerName,
  timeEntries = [],
  timerRunning = false,
  timerStartTime,
  totalMinutes = 0,
  isDisabled = false,
  disabledReason,
  className
}: ConnectedTimeTrackerProps) {
  const queryClient = useQueryClient();
  const [currentTime, setCurrentTime] = useState(0);
  const [isRunning, setIsRunning] = useState(timerRunning);

  // Calculate current session time
  useEffect(() => {
    if (isRunning && timerStartTime) {
      const interval = setInterval(() => {
        const start = new Date(timerStartTime).getTime();
        const now = Date.now();
        const diff = Math.floor((now - start) / 1000 / 60); // minutes
        setCurrentTime(diff);
      }, 1000);

      return () => clearInterval(interval);
    } else {
      setCurrentTime(0);
    }
  }, [isRunning, timerStartTime]);

  const formatTime = (minutes: number) => {
    if (!minutes) return "00:00:00";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    const secs = 0; // We're tracking in minutes
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatShortTime = (minutes: number) => {
    if (!minutes) return "0m";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  // Timer mutation
  const toggleTimer = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/orders/${ticketId}/timer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: isRunning ? 'stop' : 'start' 
        })
      });
      
      if (!response.ok) throw new Error('Failed to toggle timer');
      return response.json();
    },
    onMutate: () => {
      // Optimistic update
      setIsRunning(!isRunning);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] });
      toast.success(
        isRunning ? 'Timer stopped successfully' : 'Timer started',
        {
          description: `Tracking time for ${ticketNumber}`
        }
      );
    },
    onError: () => {
      // Revert optimistic update
      setIsRunning(isRunning);
      toast.error('Failed to toggle timer');
    }
  });

  // Recent entries (last 3)
  const recentEntries = timeEntries.slice(0, 3);

  // Calculate today's time
  const todayTime = timeEntries
    .filter(entry => {
      const entryDate = new Date(entry.created_at).toDateString();
      const today = new Date().toDateString();
      return entryDate === today;
    })
    .reduce((sum, entry) => sum + entry.duration_minutes, 0);

  return (
    <Card className={cn(
      "relative overflow-hidden",
      "bg-gradient-to-br from-background via-background to-cyan-500/5",
      isDisabled && "opacity-60",
      className
    )}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-500/10">
              <Timer className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
            </div>
            Time Tracker
          </CardTitle>
          {isRunning && (
            <Badge variant="default" className="bg-cyan-500 hover:bg-cyan-600 animate-pulse">
              <div className="h-2 w-2 rounded-full bg-white mr-2 animate-pulse" />
              RUNNING
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Current Timer Display */}
        <div className="relative p-6 rounded-xl bg-gradient-to-br from-cyan-50 to-cyan-100 dark:from-cyan-950/30 dark:to-cyan-900/20 border border-cyan-200 dark:border-cyan-800/50">
          <div className="text-center space-y-2">
            <p className="text-sm font-medium text-cyan-700 dark:text-cyan-400 uppercase tracking-wider">
              {isRunning ? "Current Session" : "Timer Stopped"}
            </p>
            <div className="text-4xl font-bold font-mono text-cyan-900 dark:text-cyan-100">
              {formatTime(isRunning ? currentTime : 0)}
            </div>
            {customerName && (
              <p className="text-sm text-cyan-600 dark:text-cyan-400">
                {customerName} • {ticketNumber}
              </p>
            )}
          </div>

          {/* Timer Control Button */}
          <Button
            onClick={() => toggleTimer.mutate()}
            disabled={isDisabled || toggleTimer.isPending}
            className={cn(
              "w-full mt-4",
              isRunning 
                ? "bg-red-500 hover:bg-red-600 text-white"
                : "bg-cyan-500 hover:bg-cyan-600 text-white"
            )}
            size="lg"
          >
            {toggleTimer.isPending ? (
              <span className="flex items-center gap-2">
                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Processing...
              </span>
            ) : isRunning ? (
              <>
                <Pause className="h-5 w-5 mr-2" />
                Stop Timer
              </>
            ) : (
              <>
                <Play className="h-5 w-5 mr-2" />
                Start Timer
              </>
            )}
          </Button>

          {isDisabled && disabledReason && (
            <div className="mt-3 p-2 rounded-lg bg-amber-100 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50">
              <p className="text-xs text-amber-700 dark:text-amber-400 flex items-center gap-1">
                <AlertCircle className="h-3.5 w-3.5" />
                {disabledReason}
              </p>
            </div>
          )}
        </div>

        {/* Time Statistics */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-muted/50 border">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Total Time
              </p>
            </div>
            <p className="text-lg font-bold">{formatShortTime(totalMinutes)}</p>
          </div>
          
          <div className="p-3 rounded-lg bg-muted/50 border">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Today
              </p>
            </div>
            <p className="text-lg font-bold">{formatShortTime(todayTime)}</p>
          </div>
        </div>

        {/* Recent Time Entries */}
        {recentEntries.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Recent Entries
            </h4>
            <div className="space-y-2">
              {recentEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30 border"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded bg-muted">
                      <User className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {formatShortTime(entry.duration_minutes)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(entry.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  {entry.description && (
                    <p className="text-xs text-muted-foreground truncate max-w-[100px]">
                      {entry.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
            
            {timeEntries.length > 3 && (
              <Button variant="outline" size="sm" className="w-full">
                View All {timeEntries.length} Entries
              </Button>
            )}
          </div>
        )}

        {/* Productivity Tip */}
        {totalMinutes > 120 && (
          <div className="p-3 rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border border-purple-200 dark:border-purple-800/50">
            <div className="flex items-start gap-2">
              <TrendingUp className="h-4 w-4 text-purple-600 dark:text-purple-400 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs font-semibold text-purple-700 dark:text-purple-400">
                  High Productivity!
                </p>
                <p className="text-xs text-purple-600 dark:text-purple-400 mt-0.5">
                  You've logged over 2 hours on this ticket. Great progress!
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}