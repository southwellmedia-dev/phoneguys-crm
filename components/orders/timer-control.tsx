"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Play, Pause, Square, Clock, AlertCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTimer } from "@/lib/contexts/timer-context";
import { StopTimerDialog } from "./stop-timer-dialog";
import { toast } from "sonner";

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
    clearError 
  } = useTimer();
  
  const [showStopDialog, setShowStopDialog] = useState(false);

  // Check if this component's timer is the active one
  const isThisTimerActive = activeTimer?.ticketId === ticketId;
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
    window.location.reload(); // Reload to reset the state
    toast.success("Timer cleared from local storage");
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
      <Card className={cn(isDisabled && "opacity-60", className)}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Clock className={cn("h-5 w-5", isDisabled ? "text-muted-foreground/50" : "text-muted-foreground")} />
              <span className={cn("text-sm font-medium", isDisabled && "text-muted-foreground")}>Timer</span>
            </div>
            {!isDisabled && isThisTimerActive && (
              <span className="flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
            )}
          </div>

          {/* Error Display */}
          {error && !isDisabled && (
            <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-destructive">{error}</span>
                </div>
                {error.includes('timer') && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleClearTimer}
                    className="text-destructive hover:text-destructive"
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                )}
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
              {isThisTimerActive 
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
                  disabled={isLoading || isDisabled}
                  className="flex-1"
                  variant={isDisabled ? "ghost" : "default"}
                >
                  <Play className="mr-2 h-4 w-4" />
                  {hasActiveTimer ? "Switch Timer" : "Start Timer"}
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