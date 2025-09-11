"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Play, Pause, Square, Clock, AlertCircle, XCircle, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTimer } from "@/lib/contexts/timer-context";
import { StopTimerDialog } from "./stop-timer-dialog";
import { toast } from "sonner";
import { useClearTimer } from "@/lib/hooks/use-tickets";
import { useTicket } from "@/lib/hooks/use-tickets";

interface TimerControlProps {
  ticketId: string;
  ticketNumber?: string;
  customerName?: string;
  className?: string;
  isDisabled?: boolean;
  disabledReason?: string;
}

export function TimerControl({
  ticketId,
  ticketNumber,
  customerName,
  className,
  isDisabled = false,
  disabledReason,
}: TimerControlProps) {
  const { 
    activeTimer, 
    isLoading, 
    error, 
    startTimer, 
    pauseTimer,
    recoverTimer, 
    clearError 
  } = useTimer();
  
  const [showStopDialog, setShowStopDialog] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Get ticket data to check timer status
  const { data: ticketData } = useTicket(ticketId);
  const clearTimerMutation = useClearTimer();
  
  // Check if user is admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        // Use window.location.origin to ensure we're hitting the correct host
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
        const response = await fetch(`${baseUrl}/api/auth/session`);
        if (response.ok) {
          const data = await response.json();
          setIsAdmin(data.user?.role === 'admin' || data.user?.role === 'super_admin');
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
      }
    };
    checkAdminStatus();
  }, []);

  // Check if this component's timer is the active one
  const isThisTimerActive = activeTimer && activeTimer.ticketId === ticketId;
  const hasActiveTimer = !!activeTimer;

  const handleStart = async () => {
    try {
      clearError();
      const success = await startTimer(ticketId, ticketNumber, customerName);
      if (success) {
        toast.success("Timer started");
      } else if (error) {
        toast.error(error);
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

  const handleStopConfirm = () => {
    setShowStopDialog(false);
  };

  const handleClearTimer = () => {
    // Clear the timer from local storage directly
    localStorage.removeItem('phoneguys_active_timer');
    clearError();
    // Force refresh the timer context
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
      // Also clear local storage if it's the same timer
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
      } else {
        toast.error("No active timer found to recover");
      }
    } catch (error) {
      toast.error("Failed to recover timer");
    }
  };

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <>
      <Card className={cn("overflow-hidden", isDisabled && "opacity-60", className)}>
        <div className="bg-gradient-to-r from-emerald-50/50 to-green-50/50 dark:from-emerald-950/20 dark:to-green-950/20 border-b p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500/20 to-green-500/20 dark:from-emerald-500/10 dark:to-green-500/10">
                <Clock className={cn("h-4 w-4", isDisabled ? "text-muted-foreground/50" : "text-emerald-600 dark:text-emerald-400")} />
              </div>
              <div>
                <span className={cn("text-sm font-semibold", isDisabled ? "text-muted-foreground" : "bg-gradient-to-r from-emerald-600 to-green-600 dark:from-emerald-400 dark:to-green-400 bg-clip-text text-transparent")}>
                  Timer
                </span>
                {!isDisabled && isThisTimerActive && (
                  <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1">
                    <span className="flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-1.5 w-1.5 rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
                    </span>
                    Recording time
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
        <CardContent className="p-6">

          {/* Error Display & Recovery Options */}
          {(error || (!activeTimer && ticketData?.timer_is_running)) && !isDisabled && (
            <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                  <span className="text-sm font-medium text-amber-900 dark:text-amber-100">
                    {error || "Timer state mismatch detected"}
                  </span>
                </div>
                <div className="text-xs text-amber-700 dark:text-amber-300 mb-2">
                  {!activeTimer && ticketData?.timer_is_running 
                    ? "The database shows a timer is running but it's not active locally."
                    : "There may be an issue with the timer state."}
                </div>
                <div className="flex gap-2 flex-wrap">
                  {!activeTimer && ticketData?.timer_is_running && (
                    <Button
                      size="sm"
                      variant="default"
                      onClick={handleRecoverTimer}
                      className="text-xs"
                      disabled={isLoading}
                      title="Recover timer from database"
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
                    title="Reset local timer state"
                  >
                    <XCircle className="h-3 w-3 mr-1" />
                    Reset Local
                  </Button>
                  {isAdmin && ticketData?.timer_is_running && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleClearDatabaseTimer}
                      className="text-orange-600 hover:text-orange-700"
                      title="Clear database timer (Admin)"
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
            {!isDisabled && hasActiveTimer && !isThisTimerActive && (
              <div className="mt-2 space-y-2">
                <p className="text-sm text-muted-foreground">
                  Timer active on another ticket
                </p>
                {activeTimer?.ticketNumber && (
                  <p className="text-xs text-muted-foreground">
                    Ticket: {activeTimer.ticketNumber}
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="flex gap-2">
            {!isThisTimerActive ? (
              <>
                <Button
                  onClick={handleStart}
                  disabled={isLoading || isDisabled || (ticketData?.timer_is_running && !isAdmin)}
                  className="flex-1"
                  variant={isDisabled ? "ghost" : "default"}
                >
                  <Play className="mr-2 h-4 w-4" />
                  {ticketData?.timer_is_running ? "Timer Already Running" : hasActiveTimer ? "Switch Timer" : "Start Timer"}
                </Button>
                {hasActiveTimer && !isDisabled && (
                  <Button
                    onClick={handleClearTimer}
                    disabled={isLoading}
                    variant="outline"
                    size="icon"
                    title="Clear orphaned timer"
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                )}
                {isAdmin && ticketData?.timer_is_running && !isThisTimerActive && (
                  <Button
                    onClick={handleClearDatabaseTimer}
                    disabled={isLoading || clearTimerMutation.isPending}
                    variant="outline"
                    size="icon"
                    title="Clear database timer (Admin only)"
                  >
                    <Shield className="h-4 w-4 text-orange-600" />
                  </Button>
                )}
              </>
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

          {!isDisabled && isThisTimerActive && activeTimer && (
            <div className="mt-4 pt-4 border-t">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total time:</span>
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
        </CardContent>
      </Card>

      {/* Stop Timer Dialog */}
      <StopTimerDialog
        isOpen={showStopDialog}
        onClose={() => setShowStopDialog(false)}
        onConfirm={handleStopConfirm}
      />
    </>
  );
}