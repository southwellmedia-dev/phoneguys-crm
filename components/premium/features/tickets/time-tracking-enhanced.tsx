'use client';

import React, { useState, useMemo } from 'react';
import { 
  LineChart,
  Line,
  BarChart,
  Bar,
  ComposedChart,
  Area,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine,
  Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Clock, 
  TrendingUp, 
  Timer,
  Play,
  Pause,
  Square,
  AlertCircle,
  ChevronRight,
  Activity,
  User,
  Calendar,
  Shield,
  XCircle,
  Trash2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTimer } from '@/lib/contexts/timer-context';
import { StopTimerDialog } from '@/components/orders/stop-timer-dialog';
import { TimeEntry } from '@/lib/types/database.types';
import { formatDuration } from '@/lib/utils';
import { toast } from 'sonner';
import { useClearTimer, useTicket, useDeleteTimeEntry } from '@/lib/hooks/use-tickets';
import { format } from 'date-fns';

interface TimeTrackingEnhancedProps {
  ticketId: string;
  ticketNumber?: string;
  customerName?: string;
  entries: Array<TimeEntry & { user?: { full_name: string } }>;
  estimatedMinutes?: number;
  actualMinutes?: number;
  isDisabled?: boolean;
  disabledReason?: string;
  isAdmin?: boolean;
  className?: string;
}

export function TimeTrackingEnhanced({
  ticketId,
  ticketNumber,
  customerName,
  entries = [],
  estimatedMinutes = 0,
  actualMinutes = 0,
  isDisabled = false,
  disabledReason,
  isAdmin = false,
  className
}: TimeTrackingEnhancedProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [showStopDialog, setShowStopDialog] = useState(false);
  
  const { 
    activeTimer, 
    isLoading, 
    error, 
    startTimer, 
    pauseTimer,
    recoverTimer, 
    clearError 
  } = useTimer();
  
  const { data: ticketData } = useTicket(ticketId);
  const clearTimerMutation = useClearTimer();
  const deleteTimeEntryMutation = useDeleteTimeEntry(ticketId);
  
  const isThisTimerActive = activeTimer && activeTimer.ticketId === ticketId;
  const hasActiveTimer = !!activeTimer;
  const isOtherTimerActive = hasActiveTimer && !isThisTimerActive;
  
  // Calculate progress percentage
  const progressPercentage = estimatedMinutes > 0 
    ? Math.min((actualMinutes / estimatedMinutes) * 100, 100)
    : 0;
  
  // Determine status color based on progress
  const getProgressColor = () => {
    if (progressPercentage >= 100) return 'text-red-600 dark:text-red-400';
    if (progressPercentage >= 80) return 'text-amber-600 dark:text-amber-400';
    return 'text-emerald-600 dark:text-emerald-400';
  };
  
  // Prepare chart data with estimated time reference
  const chartData = useMemo(() => {
    if (!entries || entries.length === 0) return [];

    const sortedEntries = [...entries].sort((a, b) => 
      new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
    );

    let cumulativeMinutes = 0;
    const estimatedHours = parseFloat((estimatedMinutes / 60).toFixed(2));
    
    return sortedEntries.map((entry, index) => {
      const duration = entry.duration_minutes || 0;
      cumulativeMinutes += duration;
      
      return {
        index: index + 1,
        sessionNumber: `S${index + 1}`,
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
        sessionHours: parseFloat((duration / 60).toFixed(2)),
        cumulativeHours: parseFloat((cumulativeMinutes / 60).toFixed(2)),
        estimatedHours: estimatedHours, // Add estimated reference
        percentOfEstimate: estimatedMinutes > 0 ? parseFloat(((cumulativeMinutes / estimatedMinutes) * 100).toFixed(1)) : 0
      };
    });
  }, [entries, estimatedMinutes]);
  
  // Timer functions
  const handleStart = async () => {
    try {
      clearError();
      const success = await startTimer(ticketId, ticketNumber, customerName);
      if (success) {
        toast.success("Timer started");
        setActiveTab('timer');
      }
    } catch (error) {
      toast.error("Failed to start timer");
    }
  };

  const handlePause = async () => {
    if (!isThisTimerActive) return;
    
    try {
      clearError();
      const success = await pauseTimer();
      if (success) {
        toast.success("Timer paused");
      }
    } catch (error) {
      toast.error("Failed to pause timer");
    }
  };

  const handleStop = () => {
    if (!isThisTimerActive) return;
    setShowStopDialog(true);
  };

  const handleClearTimer = () => {
    localStorage.removeItem('phoneguys_active_timer');
    clearError();
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'phoneguys_active_timer',
      newValue: null,
      url: window.location.href
    }));
    toast.success("Timer cleared successfully");
  };
  
  const handleClearDatabaseTimer = async () => {
    if (!isAdmin) {
      toast.error("Only administrators can clear database timers");
      return;
    }
    
    try {
      await clearTimerMutation.mutateAsync(ticketId);
      if (isThisTimerActive) {
        localStorage.removeItem('phoneguys_active_timer');
        window.location.reload();
      }
    } catch (error) {
      console.error('Error clearing database timer:', error);
    }
  };

  const handleRecoverTimer = async () => {
    try {
      const success = await recoverTimer(ticketId);
      if (success) {
        toast.success("Timer recovered successfully");
        setActiveTab('timer');
      } else {
        toast.error("No active timer found to recover");
      }
    } catch (error) {
      toast.error("Failed to recover timer");
    }
  };

  const handleDeleteEntry = async (entryId: string) => {
    if (!isAdmin) {
      toast.error("Only administrators can delete time entries");
      return;
    }

    if (!confirm("Are you sure you want to delete this time entry?")) {
      return;
    }

    // Use the mutation with optimistic updates - no page refresh needed!
    deleteTimeEntryMutation.mutate(entryId);
  };

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };
  
  // Custom tooltip for chart
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border rounded-lg shadow-lg p-3 space-y-1">
          <p className="font-semibold text-sm">{data.sessionNumber}</p>
          <p className="text-xs text-muted-foreground">{data.date} at {data.time}</p>
          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground">Session:</span>
            <span className="text-xs font-medium" style={{ color: 'rgb(251, 146, 60)' }}>
              {formatDuration(data.duration)}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground">Total:</span>
            <span className="text-xs font-medium text-primary">
              {formatDuration(data.cumulative)}
            </span>
          </div>
          {estimatedMinutes > 0 && (
            <div className="flex items-center gap-1 pt-1 border-t">
              <span className="text-xs text-muted-foreground">Progress:</span>
              <span className={cn(
                "text-xs font-medium",
                data.percentOfEstimate >= 100 ? "text-red-600" : "text-green-600"
              )}>
                {data.percentOfEstimate}% of estimate
              </span>
            </div>
          )}
          <p className="text-xs text-muted-foreground">By {data.technician}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <>
      <Card className={cn(
        "overflow-hidden border transition-all duration-300",
        isThisTimerActive 
          ? "border-green-500 dark:border-green-400 bg-green-50/50 dark:bg-green-950/20 shadow-lg shadow-green-500/20" 
          : isOtherTimerActive
          ? "border-gray-300 dark:border-gray-600 opacity-60"
          : "border-gray-200 dark:border-gray-700",
        className
      )}>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className={cn(
                "h-4 w-4 transition-colors",
                isThisTimerActive 
                  ? "text-green-600 dark:text-green-400" 
                  : "text-muted-foreground"
              )} />
              <CardTitle className="text-sm font-semibold">
                Time Tracking
                {isThisTimerActive && (
                  <span className="ml-2 inline-flex items-center">
                    <span className="flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                  </span>
                )}
              </CardTitle>
            </div>
            <div className="flex items-center gap-2">
              {isOtherTimerActive && (
                <Badge 
                  variant="destructive" 
                  className="text-xs animate-pulse"
                >
                  Timer Active Elsewhere
                </Badge>
              )}
              {estimatedMinutes > 0 && !isOtherTimerActive && (
                <Badge 
                  variant="outline" 
                  className={cn("text-xs", getProgressColor())}
                >
                  {progressPercentage.toFixed(0)}% of estimate
                </Badge>
              )}
              <Badge variant="secondary" className="text-xs">
                {entries.length} entries
              </Badge>
            </div>
          </div>
          
          {/* Progress Bar */}
          {estimatedMinutes > 0 && (
            <div className="mt-3 space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{formatDuration(actualMinutes)} logged</span>
                <span>{formatDuration(estimatedMinutes)} estimated</span>
              </div>
              <div className="relative h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                <div 
                  className={cn(
                    "h-full transition-all duration-300",
                    progressPercentage >= 100 
                      ? "bg-red-500 dark:bg-red-600" 
                      : progressPercentage >= 80 
                      ? "bg-amber-500 dark:bg-amber-600"
                      : "bg-green-500 dark:bg-green-600"
                  )}
                  style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                />
              </div>
            </div>
          )}
        </CardHeader>
        
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className={cn(
              "grid w-full grid-cols-3 rounded-none border-b",
              isThisTimerActive && "bg-gradient-to-r from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/30 border-green-300 dark:border-green-800"
            )}>
              <TabsTrigger value="overview" className={cn(
                "text-xs",
                isThisTimerActive && "data-[state=active]:bg-green-200/50 dark:data-[state=active]:bg-green-900/50"
              )}>
                <TrendingUp className="h-3 w-3 mr-1" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="timer" className={cn(
                "text-xs",
                isThisTimerActive && "font-semibold data-[state=active]:bg-green-200/50 dark:data-[state=active]:bg-green-900/50"
              )}>
                <Timer className={cn(
                  "h-3 w-3 mr-1",
                  isThisTimerActive && "text-green-600 dark:text-green-400"
                )} />
                Timer
                {isThisTimerActive && (
                  <span className="ml-1 inline-flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-red-500 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="entries" className={cn(
                "text-xs",
                isThisTimerActive && "data-[state=active]:bg-green-200/50 dark:data-[state=active]:bg-green-900/50"
              )}>
                <Activity className="h-3 w-3 mr-1" />
                Entries
              </TabsTrigger>
            </TabsList>
            
            {/* Overview Tab */}
            <TabsContent value="overview" className="mt-0 p-4">
              {chartData.length >= 2 ? (
                <div className="space-y-4">
                  <ResponsiveContainer width="100%" height={200}>
                    <ComposedChart data={chartData} margin={{ top: 10, right: 5, left: 5, bottom: 5 }}>
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
                      <Legend 
                        wrapperStyle={{ fontSize: '10px' }}
                        iconSize={10}
                        height={20}
                      />
                      
                      {/* Session Time Bars - render first so they're behind */}
                      <Bar 
                        dataKey="sessionHours" 
                        fill="rgb(251 146 60)"
                        opacity={0.6}
                        name="Session Time"
                        radius={[4, 4, 0, 0]}
                      />
                      
                      {/* Cumulative Time Area */}
                      <Area 
                        type="monotone" 
                        dataKey="cumulativeHours" 
                        fill="hsl(var(--primary))"
                        stroke="hsl(var(--primary))"
                        fillOpacity={0.2}
                        strokeWidth={2}
                        name="Total Time"
                      />
                      
                      {/* Estimated Time Reference Line - render last so it's on top */}
                      {estimatedMinutes > 0 && (
                        <ReferenceLine 
                          y={parseFloat((estimatedMinutes / 60).toFixed(2))} 
                          stroke="rgb(34 197 94)" 
                          strokeDasharray="8 4"
                          strokeWidth={2}
                          label={{ 
                            value: `Estimate: ${Math.floor(estimatedMinutes/60)}h ${estimatedMinutes%60}m`, 
                            position: "right", 
                            style: { 
                              fontSize: 11, 
                              fill: 'rgb(34 197 94)',
                              fontWeight: 600
                            } 
                          }}
                        />
                      )}
                    </ComposedChart>
                  </ResponsiveContainer>
                  
                  {/* Summary Stats */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-xs text-muted-foreground">Total Time</p>
                      <p className="text-lg font-semibold">{formatDuration(actualMinutes)}</p>
                      {estimatedMinutes > 0 && (
                        <p className={cn(
                          "text-xs mt-1",
                          actualMinutes > estimatedMinutes ? "text-red-600" : "text-green-600"
                        )}>
                          {actualMinutes > estimatedMinutes ? '+' : ''}
                          {formatDuration(Math.abs(actualMinutes - estimatedMinutes))}
                          {actualMinutes > estimatedMinutes ? ' over' : ' under'}
                        </p>
                      )}
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-xs text-muted-foreground">Estimated</p>
                      <p className="text-lg font-semibold">
                        {estimatedMinutes > 0 ? formatDuration(estimatedMinutes) : 'None'}
                      </p>
                      {estimatedMinutes > 0 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          From services
                        </p>
                      )}
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-xs text-muted-foreground">Avg Session</p>
                      <p className="text-lg font-semibold">
                        {entries.length > 0 
                          ? formatDuration(Math.round(actualMinutes / entries.length))
                          : '0m'}
                      </p>
                      {entries.length > 0 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {entries.length} session{entries.length !== 1 ? 's' : ''}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Clock className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground mb-3">
                    {entries.length === 0 
                      ? 'No time entries yet' 
                      : 'Need at least 2 entries for chart'}
                  </p>
                  {!isDisabled && !isOtherTimerActive && (
                    <Button
                      size="sm"
                      onClick={handleStart}
                      disabled={isLoading || ticketData?.timer_is_running || isOtherTimerActive}
                    >
                      <Play className="h-3 w-3 mr-1" />
                      Start Timer
                    </Button>
                  )}
                  {!isDisabled && isOtherTimerActive && (
                    <div className="text-xs text-amber-600 dark:text-amber-400">
                      Timer active on {activeTimer?.ticketNumber || 'another ticket'}
                    </div>
                  )}
                </div>
              )}
              
              {/* Quick Start Timer Button at Bottom */}
              {!isDisabled && !isThisTimerActive && (
                <div className="mt-4 pt-4 border-t">
                  <Button
                    onClick={() => {
                      handleStart();
                      setActiveTab('timer'); // Switch to timer tab after starting
                    }}
                    disabled={isLoading || isOtherTimerActive || ticketData?.timer_is_running}
                    className="w-full"
                    size="lg"
                    variant={isOtherTimerActive ? "outline" : "default"}
                  >
                    {isOtherTimerActive ? (
                      <>
                        <AlertCircle className="h-4 w-4 mr-2" />
                        Timer Active on {activeTimer?.ticketNumber || 'Another Ticket'}
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Start Timer
                      </>
                    )}
                  </Button>
                  {isOtherTimerActive && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 text-center mt-2">
                      Stop the other timer first to track time here
                    </p>
                  )}
                </div>
              )}
              {isThisTimerActive && (
                <div className="mt-4 pt-4 border-t">
                  <Button
                    onClick={() => setActiveTab('timer')}
                    className="w-full"
                    size="lg"
                    variant="outline"
                  >
                    <Timer className="h-4 w-4 mr-2 text-green-600 dark:text-green-400" />
                    <span className="flex items-center gap-2">
                      Timer Running - {formatTime(activeTimer?.elapsedSeconds || 0)}
                      <span className="flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                      </span>
                    </span>
                  </Button>
                  <p className="text-xs text-green-600 dark:text-green-400 text-center mt-2">
                    Click to view timer controls
                  </p>
                </div>
              )}
            </TabsContent>
            
            {/* Timer Tab */}
            <TabsContent value="timer" className="mt-0 p-4">
              {/* Error/Recovery Display */}
              {(error || (!activeTimer && ticketData?.timer_is_running)) && !isDisabled && (
                <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                      <span className="text-sm font-medium text-amber-900 dark:text-amber-100">
                        {error || "Timer state mismatch detected"}
                      </span>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {!activeTimer && ticketData?.timer_is_running && (
                        <Button
                          size="sm"
                          variant="default"
                          onClick={handleRecoverTimer}
                          className="text-xs"
                          disabled={isLoading}
                        >
                          <Play className="h-3 w-3 mr-1" />
                          Recover Timer
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleClearTimer}
                        className="text-xs"
                      >
                        <XCircle className="h-3 w-3 mr-1" />
                        Reset Local
                      </Button>
                      {isAdmin && ticketData?.timer_is_running && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={handleClearDatabaseTimer}
                          className="text-xs text-orange-600"
                        >
                          <Shield className="h-3 w-3 mr-1" />
                          Clear DB
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Disabled Message */}
              {isDisabled && disabledReason && (
                <div className="mb-4 p-3 bg-muted/50 border border-muted-foreground/20 rounded-lg">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm text-muted-foreground">{disabledReason}</span>
                  </div>
                </div>
              )}

              {/* Timer Display */}
              <div className="text-center mb-6">
                <div className={cn(
                  "text-4xl font-mono font-bold",
                  isDisabled ? "text-muted-foreground/50" : isThisTimerActive ? "text-primary" : "text-muted-foreground"
                )}>
                  {isThisTimerActive && activeTimer
                    ? formatTime(activeTimer.elapsedSeconds) 
                    : "00:00:00"
                  }
                </div>
                {!isDisabled && isOtherTimerActive && (
                  <div className="mt-2 space-y-2 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
                    <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                      ⚠️ Timer active on another ticket
                    </p>
                    {activeTimer?.ticketNumber && (
                      <p className="text-xs text-amber-700 dark:text-amber-300">
                        Currently tracking: {activeTimer.ticketNumber}
                        {activeTimer.customerName && ` - ${activeTimer.customerName}`}
                      </p>
                    )}
                    <p className="text-xs text-amber-600 dark:text-amber-400">
                      Stop the other timer first to track time on this ticket
                    </p>
                  </div>
                )}
                {isThisTimerActive && (
                  <p className="text-xs text-muted-foreground mt-2 flex items-center justify-center gap-1">
                    <span className="flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-1.5 w-1.5 rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
                    </span>
                    Recording time
                  </p>
                )}
              </div>

              {/* Timer Controls */}
              <div className="flex gap-2">
                {!isThisTimerActive ? (
                  <Button
                    onClick={handleStart}
                    disabled={isLoading || isDisabled || isOtherTimerActive || (ticketData?.timer_is_running && !isAdmin)}
                    className="flex-1"
                    variant={isDisabled || isOtherTimerActive ? "ghost" : "default"}
                  >
                    <Play className="mr-2 h-4 w-4" />
                    {isOtherTimerActive 
                      ? `Timer Active on ${activeTimer?.ticketNumber || 'Another Ticket'}` 
                      : ticketData?.timer_is_running 
                      ? "Timer Already Running" 
                      : "Start Timer"}
                  </Button>
                ) : (
                  <>
                    <Button
                      onClick={handlePause}
                      disabled={isLoading || isDisabled}
                      className="flex-1"
                      variant={isDisabled ? "ghost" : "outline"}
                    >
                      <Pause className="mr-2 h-4 w-4" />
                      Pause
                    </Button>
                    <Button
                      onClick={handleStop}
                      disabled={isLoading || isDisabled}
                      variant={isDisabled ? "ghost" : "destructive"}
                    >
                      <Square className="mr-2 h-4 w-4" />
                      Stop
                    </Button>
                  </>
                )}
              </div>

              {/* Timer Stats */}
              {!isDisabled && isThisTimerActive && activeTimer && (
                <div className="mt-4 pt-4 border-t">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Session time:</span>
                    <span className="font-medium">
                      {Math.floor(activeTimer.elapsedSeconds / 60)} minutes
                    </span>
                  </div>
                  {activeTimer.elapsedSeconds >= 3600 && (
                    <div className="flex justify-between text-sm mt-1">
                      <span className="text-muted-foreground">Billing hours:</span>
                      <span className="font-medium">
                        {(activeTimer.elapsedSeconds / 3600).toFixed(2)} hours
                      </span>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
            
            {/* Entries Tab */}
            <TabsContent value="entries" className="mt-0 p-0">
              <div className="max-h-[400px] overflow-y-auto">
                {entries && entries.length > 0 ? (
                  <div className="divide-y">
                    {[...entries].sort((a, b) => 
                      new Date(b.start_time).getTime() - new Date(a.start_time).getTime()
                    ).map((entry: any) => (
                      <div key={entry.id} className="group p-4 hover:bg-muted/50 transition-colors">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <User className="h-3 w-3 text-muted-foreground" />
                              <span className="text-sm font-medium truncate">
                                {entry.user?.full_name || 'Unknown'}
                              </span>
                              {!entry.end_time && (
                                <Badge variant="outline" className="text-xs px-1 py-0">
                                  Active
                                </Badge>
                              )}
                            </div>
                            
                            {entry.description && (
                              <p className="text-xs text-muted-foreground mb-1 line-clamp-2">
                                {entry.description}
                              </p>
                            )}
                            
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {format(new Date(entry.start_time), 'MMM d, h:mm a')}
                              </span>
                              {entry.end_time && (
                                <span className="flex items-center gap-1">
                                  <ChevronRight className="h-3 w-3" />
                                  {format(new Date(entry.end_time), 'h:mm a')}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-start gap-2">
                            <div className="text-right">
                              <p className="text-sm font-semibold">
                                {formatDuration(entry.duration_minutes || 0)}
                              </p>
                              {entry.rate && (
                                <p className="text-xs text-muted-foreground">
                                  ${(entry.duration_minutes * entry.rate / 60).toFixed(2)}
                                </p>
                              )}
                            </div>
                            {isAdmin && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0"
                                onClick={() => handleDeleteEntry(entry.id)}
                                title="Delete time entry"
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Activity className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No time entries yet</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Stop Timer Dialog */}
      <StopTimerDialog
        isOpen={showStopDialog}
        onClose={() => setShowStopDialog(false)}
        onConfirm={() => setShowStopDialog(false)}
      />
    </>
  );
}