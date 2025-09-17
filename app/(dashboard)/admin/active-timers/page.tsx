"use client";

import { useState } from 'react';
import { PageContainer } from '@/components/layout/page-container';
import { useActiveTimers, useClearActiveTimer } from '@/lib/hooks/use-admin';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
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
import {
  Clock,
  Timer,
  User,
  FileText,
  Pause,
  Play,
  XCircle,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { formatDuration } from '@/lib/utils';

export default function ActiveTimersPage() {
  const { data: timers, isLoading, error, refetch } = useActiveTimers();
  const clearTimerMutation = useClearActiveTimer();
  const [selectedTimer, setSelectedTimer] = useState<any>(null);
  const [showClearDialog, setShowClearDialog] = useState(false);

  const handleClearTimer = () => {
    if (!selectedTimer) return;
    
    clearTimerMutation.mutate(
      { ticketId: selectedTimer.ticket_id, reason: 'Admin cleared timer' },
      {
        onSuccess: () => {
          setShowClearDialog(false);
          setSelectedTimer(null);
        },
      }
    );
  };

  const formatElapsedTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    }
    if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    }
    return `${secs}s`;
  };

  const getTimerStatus = (timer: any) => {
    if (timer.is_paused) {
      return { label: 'Paused', variant: 'warning' as const };
    }
    if (timer.auto_paused_at) {
      return { label: 'Auto-Paused', variant: 'secondary' as const };
    }
    const timeSinceHeartbeat = Date.now() - new Date(timer.last_heartbeat).getTime();
    if (timeSinceHeartbeat > 60000) {
      return { label: 'Stale', variant: 'destructive' as const };
    }
    return { label: 'Active', variant: 'success' as const };
  };

  if (isLoading) {
    return (
      <PageContainer
        title="Active Timers"
        description="Monitor and manage all active timers across the system"
      >
        <Card>
          <CardHeader>
            <CardTitle>Loading timers...</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-4 w-[200px]" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer
        title="Active Timers"
        description="Monitor and manage all active timers across the system"
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Error Loading Timers
            </CardTitle>
            <CardDescription>
              {error.message || 'Failed to load active timers'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => refetch()} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Active Timers"
      description="Monitor and manage all active timers across the system"
      actions={
        <div className="flex items-center gap-2">
          <Badge variant="outline">
            {timers?.length || 0} Active Timer{timers?.length !== 1 ? 's' : ''}
          </Badge>
          <Button
            onClick={() => refetch()}
            variant="outline"
            size="sm"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      }
    >
      <Card>
        <CardHeader>
          <CardTitle>Timer Management</CardTitle>
          <CardDescription>
            View all active timers and clear stuck or abandoned timers. Timers auto-pause after 4 hours of inactivity.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {timers && timers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ticket</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Started</TableHead>
                  <TableHead>Elapsed</TableHead>
                  <TableHead>Last Activity</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {timers.map((timer: any) => {
                  const status = getTimerStatus(timer);
                  return (
                    <TableRow key={timer.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium">
                              {timer.ticket_number || 'Unknown'}
                            </div>
                            {timer.customer_name && (
                              <div className="text-sm text-muted-foreground">
                                {timer.customer_name}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {timer.user_name || 'Unknown'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={status.variant}>
                          {timer.is_paused && <Pause className="h-3 w-3 mr-1" />}
                          {!timer.is_paused && <Play className="h-3 w-3 mr-1" />}
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {format(new Date(timer.start_time), 'MMM d, h:mm a')}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(timer.start_time), { addSuffix: true })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Timer className="h-4 w-4 text-muted-foreground" />
                          <span className="font-mono text-sm">
                            {formatElapsedTime(timer.elapsed_seconds || 0)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {formatDistanceToNow(new Date(timer.last_heartbeat), { addSuffix: true })}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          onClick={() => {
                            setSelectedTimer(timer);
                            setShowClearDialog(true);
                          }}
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Clear
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Clock className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Active Timers</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                There are currently no active timers in the system. Timers will appear here when technicians start tracking time.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear Timer</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to clear this timer? This will stop the timer without creating a time entry.
              {selectedTimer && (
                <div className="mt-4 p-3 bg-muted rounded-lg">
                  <div className="text-sm space-y-1">
                    <div>
                      <strong>Ticket:</strong> {selectedTimer.ticket_number || 'Unknown'}
                    </div>
                    <div>
                      <strong>User:</strong> {selectedTimer.user_name || 'Unknown'}
                    </div>
                    <div>
                      <strong>Elapsed:</strong> {formatElapsedTime(selectedTimer.elapsed_seconds || 0)}
                    </div>
                  </div>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClearTimer}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Clear Timer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
}