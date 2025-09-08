"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Play, Pause, Square, Clock, AlertCircle, User, DollarSign } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface TimerState {
  ticketId: string;
  ticketNumber?: string;
  customerName?: string;
  elapsedSeconds: number;
  isRunning: boolean;
  startTime?: string;
}

export interface TimerWidgetProps {
  timer?: TimerState;
  variant?: "default" | "compact" | "elevated" | "glass";
  onStart?: () => void;
  onPause?: () => void;
  onStop?: () => void;
  disabled?: boolean;
  disabledReason?: string;
  className?: string;
}

export function TimerWidget({
  timer,
  variant = "default",
  onStart,
  onPause,
  onStop,
  disabled = false,
  disabledReason,
  className
}: TimerWidgetProps) {
  const [currentTime, setCurrentTime] = useState(timer?.elapsedSeconds || 0);

  useEffect(() => {
    if (!timer?.isRunning) return;
    
    const interval = setInterval(() => {
      setCurrentTime(prev => prev + 1);
    }, 1000);
    
    return () => clearInterval(interval);
  }, [timer?.isRunning]);

  useEffect(() => {
    if (timer) {
      setCurrentTime(timer.elapsedSeconds);
    }
  }, [timer]);

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };


  const getCardVariant = () => {
    if (disabled) return "outline";
    if (timer?.isRunning) {
      switch (variant) {
        case "elevated": return "elevated";
        case "glass": return "glass";
        default: return "solid";
      }
    }
    return variant === "compact" ? "outline" : "gradient";
  };

  const getCardColor = () => {
    if (disabled) return undefined;
    if (timer?.isRunning) return "green";
    return undefined;
  };

  if (variant === "compact") {
    return (
      <Card
        variant={getCardVariant()}
        color={getCardColor()}
        className={cn(
          "p-4 transition-all duration-300",
          timer?.isRunning && "shadow-colored",
          disabled && "opacity-60",
          className
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "relative p-2 rounded-lg",
              timer?.isRunning 
                ? "bg-white/20" 
                : "bg-primary/10"
            )}>
              <Clock className={cn(
                "h-4 w-4",
                timer?.isRunning 
                  ? "text-white" 
                  : "text-primary"
              )} />
              {timer?.isRunning && (
                <div className="absolute -top-1 -right-1 h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </div>
              )}
            </div>
            <div>
              <div className={cn(
                "text-lg font-mono font-bold",
                timer?.isRunning ? "text-white" : "text-foreground"
              )}>
                {formatTime(currentTime)}
              </div>
              {timer?.ticketNumber && (
                <p className={cn(
                  "text-xs",
                  timer?.isRunning ? "text-white/70" : "text-muted-foreground"
                )}>
                  #{timer.ticketNumber}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex gap-1">
            {!timer?.isRunning ? (
              <Button
                size="sm"
                onClick={onStart}
                disabled={disabled}
                variant={timer?.isRunning ? "ghost" : "outline"}
              >
                <Play className="h-3 w-3" />
              </Button>
            ) : (
              <>
                <Button
                  size="sm"
                  onClick={onPause}
                  disabled={disabled}
                  variant="ghost"
                  className="text-white hover:bg-white/10"
                >
                  <Pause className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  onClick={onStop}
                  disabled={disabled}
                  variant="ghost"
                  className="text-white hover:bg-white/10"
                >
                  <Square className="h-3 w-3" />
                </Button>
              </>
            )}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card
      variant={getCardVariant()}
      color={getCardColor()}
      className={cn(
        "overflow-hidden transition-all duration-300",
        timer?.isRunning && "shadow-colored",
        disabled && "opacity-60",
        className
      )}
    >
      {/* Header */}
      <div className={cn(
        "p-4 border-b",
        timer?.isRunning 
          ? "bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-200/20" 
          : "bg-gradient-to-r from-primary/5 to-primary/10 border-border"
      )}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "relative p-2 rounded-xl",
              timer?.isRunning 
                ? "bg-gradient-to-br from-green-500/20 to-emerald-500/20" 
                : "bg-gradient-to-br from-primary/20 to-primary/10"
            )}>
              <Clock className={cn(
                "h-5 w-5",
                timer?.isRunning 
                  ? "text-green-600 dark:text-green-400" 
                  : "text-primary"
              )} />
              {timer?.isRunning && (
                <div className="absolute -top-1 -right-1 h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </div>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={cn(
                  "font-semibold",
                  timer?.isRunning 
                    ? "text-green-600 dark:text-green-400" 
                    : "text-foreground"
                )}>
                  Timer
                </span>
                {timer?.isRunning && (
                  <Badge variant="soft" color="green" size="sm">
                    Recording
                  </Badge>
                )}
              </div>
              {timer?.ticketNumber && (
                <p className="text-xs text-muted-foreground">
                  Ticket #{timer.ticketNumber}
                </p>
              )}
            </div>
          </div>
          
          {timer?.customerName && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="h-4 w-4" />
              <span>{timer.customerName}</span>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Disabled/Error Message */}
        {disabled && disabledReason && (
          <div className="p-3 bg-muted/50 border border-muted-foreground/20 rounded-xl">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="text-sm text-muted-foreground">{disabledReason}</span>
            </div>
          </div>
        )}

        {/* Time Display */}
        <div className="text-center">
          <div className={cn(
            "text-5xl font-mono font-bold mb-2 transition-colors",
            timer?.isRunning ? "text-green-600 dark:text-green-400" : "text-foreground"
          )}>
            {formatTime(currentTime)}
          </div>
          {timer?.startTime && (
            <p className="text-sm text-muted-foreground">
              Started at {timer.startTime}
            </p>
          )}
        </div>


        {/* Controls */}
        <div className="space-y-3">
          {!timer?.isRunning ? (
            <Button
              onClick={onStart}
              disabled={disabled}
              className="w-full"
              size="lg"
              variant="gradient"
            >
              <Play className="mr-2 h-5 w-5" />
              Start Timer
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                onClick={onPause}
                disabled={disabled}
                className="flex-1"
                size="lg"
                variant="outline"
              >
                <Pause className="mr-2 h-4 w-4" />
                Pause
              </Button>
              <Button
                onClick={onStop}
                disabled={disabled}
                size="lg"
                variant="destructive"
              >
                <Square className="mr-2 h-4 w-4" />
                Stop
              </Button>
            </div>
          )}
        </div>

        {/* Stats */}
        {timer?.isRunning && currentTime > 0 && (
          <div className="pt-4 border-t space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total minutes:</span>
              <span className="font-medium">{Math.floor(currentTime / 60)}</span>
            </div>
            {currentTime >= 3600 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Hours:</span>
                <span className="font-medium">{(currentTime / 3600).toFixed(2)}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}