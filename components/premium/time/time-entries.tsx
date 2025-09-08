"use client";

import { cn } from "@/lib/utils";
import { Clock, Play, Pause, CheckCircle, User, DollarSign, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export interface TimeEntry {
  id: string;
  taskName: string;
  duration: string; // "1h 30m" format
  startTime: string;
  endTime?: string;
  user: {
    name: string;
    avatar?: string;
    role?: string;
  };
  rate?: number;
  total?: number;
  status: "active" | "paused" | "completed";
  category?: string;
  notes?: string;
}

export interface TimeEntriesProps {
  entries: TimeEntry[];
  variant?: "default" | "elevated" | "timeline" | "compact";
  showTotals?: boolean;
  onEntryClick?: (entry: TimeEntry) => void;
  onAction?: (action: "play" | "pause" | "stop", entry: TimeEntry) => void;
  className?: string;
}

export function TimeEntries({
  entries,
  variant = "list",
  showTotals = true,
  onEntryClick,
  onAction,
  className
}: TimeEntriesProps) {
  
  const totalHours = entries.reduce((acc, entry) => {
    const [hours, minutes] = entry.duration.split(/[hm]/).filter(Boolean).map(Number);
    return acc + hours + (minutes || 0) / 60;
  }, 0);

  const totalEarnings = entries.reduce((acc, entry) => acc + (entry.total || 0), 0);

  const getStatusIcon = (status: TimeEntry["status"]) => {
    switch (status) {
      case "active":
        return <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />;
      case "paused":
        return <div className="h-2 w-2 rounded-full bg-amber-500" />;
      case "completed":
        return <div className="h-2 w-2 rounded-full bg-gray-400" />;
    }
  };

  const getStatusColor = (status: TimeEntry["status"]) => {
    switch (status) {
      case "active":
        return "green";
      case "paused":
        return "amber";
      case "completed":
        return "gray";
    }
  };

  if (variant === "timeline") {
    return (
      <div className={cn("space-y-6", className)}>
        {showTotals && (
          <div className="grid gap-4 md:grid-cols-2 mb-8">
            <Card variant="solid" color="cyan" className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/80">Total Time Today</p>
                  <p className="text-3xl font-bold text-white">{totalHours.toFixed(1)}h</p>
                </div>
                <Clock className="h-10 w-10 text-white/30" />
              </div>
            </Card>
            <Card variant="elevated" className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Billable Amount</p>
                  <p className="text-3xl font-bold text-green-600">${totalEarnings.toFixed(2)}</p>
                </div>
                <DollarSign className="h-10 w-10 text-green-500/20" />
              </div>
            </Card>
          </div>
        )}

        <div className="relative">
          <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-border" />
          
          {entries.map((entry, idx) => (
            <div key={entry.id} className="relative flex gap-4 pb-8 last:pb-0">
              <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 shadow-sm border border-primary/20">
                <Clock className="h-6 w-6 text-muted-foreground" />
                <div className="absolute -bottom-1 -right-1">
                  {getStatusIcon(entry.status)}
                </div>
              </div>
              
              <div className="flex-1">
                <Card 
                  variant={entry.status === "active" ? "solid" : "elevated"}
                  color={entry.status === "active" ? "green" : undefined}
                  className={cn(
                    "p-4 cursor-pointer hover:shadow-elevation-3 transition-all hover:-translate-y-1",
                    entry.status === "active" && "shadow-colored"
                  )}
                  onClick={() => onEntryClick?.(entry)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className={cn(
                        "font-semibold",
                        entry.status === "active" && "text-white"
                      )}>{entry.taskName}</h4>
                      <p className={cn(
                        "text-sm",
                        entry.status === "active" ? "text-white/80" : "text-muted-foreground"
                      )}>
                        {entry.startTime} {entry.endTime && `- ${entry.endTime}`}
                      </p>
                    </div>
                    <Badge variant="soft" color={getStatusColor(entry.status)} size="sm">
                      {entry.status}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {entry.duration}
                    </span>
                    {entry.total && (
                      <span className="flex items-center gap-1 text-green-600">
                        <DollarSign className="h-3 w-3" />
                        ${entry.total.toFixed(2)}
                      </span>
                    )}
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <User className="h-3 w-3" />
                      {entry.user.name}
                    </span>
                  </div>
                  
                  {entry.notes && (
                    <p className="mt-2 text-sm text-muted-foreground">{entry.notes}</p>
                  )}
                  
                  {onAction && entry.status !== "completed" && (
                    <div className="flex gap-2 mt-3">
                      {entry.status === "active" ? (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            onAction("pause", entry);
                          }}
                        >
                          <Pause className="h-3 w-3 mr-1" />
                          Pause
                        </Button>
                      ) : (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            onAction("play", entry);
                          }}
                        >
                          <Play className="h-3 w-3 mr-1" />
                          Resume
                        </Button>
                      )}
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          onAction("stop", entry);
                        }}
                      >
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Complete
                      </Button>
                    </div>
                  )}
                </Card>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (variant === "elevated") {
    return (
      <div className={cn("space-y-4", className)}>
        {showTotals && (
          <div className="grid gap-6 md:grid-cols-3 mb-8">
            <Card variant="solid" color="cyan" className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/80">Active Timers</p>
                  <p className="text-3xl font-bold text-white">
                    {entries.filter(e => e.status === "active").length}
                  </p>
                </div>
                <Play className="h-10 w-10 text-white/30" />
              </div>
            </Card>
            <Card variant="gradient" className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Hours</p>
                  <p className="text-3xl font-bold">{totalHours.toFixed(1)}h</p>
                </div>
                <Clock className="h-10 w-10 text-primary/20" />
              </div>
            </Card>
            <Card variant="elevated" className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Billable</p>
                  <p className="text-3xl font-bold text-green-600">${totalEarnings.toFixed(2)}</p>
                </div>
                <DollarSign className="h-10 w-10 text-green-500/20" />
              </div>
            </Card>
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {entries.map((entry) => (
            <Card
              key={entry.id}
              variant={entry.status === "active" ? "solid" : "elevated"}
              color={entry.status === "active" ? "green" : undefined}
              className={cn(
                "relative p-6 cursor-pointer hover:shadow-elevation-3 transition-all duration-300",
                "hover:-translate-y-2",
                entry.status === "active" && "shadow-colored"
              )}
              onClick={() => onEntryClick?.(entry)}
            >
              <div className="absolute top-4 right-4">
                {getStatusIcon(entry.status)}
              </div>
              
              <div className="space-y-3">
                <div>
                  <h4 className={cn(
                    "font-semibold text-lg",
                    entry.status === "active" ? "text-white" : "text-foreground"
                  )}>{entry.taskName}</h4>
                  {entry.category && (
                    <Badge variant="soft" color="blue" size="sm" className="mt-1">
                      {entry.category}
                    </Badge>
                  )}
                </div>
                
                <div className={cn(
                  "flex items-center gap-2 text-sm",
                  entry.status === "active" ? "text-white/80" : "text-muted-foreground"
                )}>
                  <User className="h-3 w-3" />
                  {entry.user.name}
                  {entry.user.role && (
                    <span className="text-xs">• {entry.user.role}</span>
                  )}
                </div>
                
                <div className={cn(
                  "grid grid-cols-2 gap-4 pt-4 border-t",
                  entry.status === "active" ? "border-white/20" : "border-border"
                )}>
                  <div>
                    <p className={cn(
                      "text-xs",
                      entry.status === "active" ? "text-white/70" : "text-muted-foreground"
                    )}>Duration</p>
                    <p className={cn(
                      "font-semibold",
                      entry.status === "active" ? "text-white" : "text-foreground"
                    )}>{entry.duration}</p>
                  </div>
                  {entry.rate && (
                    <div>
                      <p className={cn(
                        "text-xs",
                        entry.status === "active" ? "text-white/70" : "text-muted-foreground"
                      )}>Rate</p>
                      <p className={cn(
                        "font-semibold",
                        entry.status === "active" ? "text-white" : "text-foreground"
                      )}>${entry.rate}/hr</p>
                    </div>
                  )}
                </div>
                
                <div className={cn(
                  "flex items-center justify-between pt-4 border-t",
                  entry.status === "active" ? "border-white/20" : "border-border"
                )}>
                  <span className={cn(
                    "text-xs",
                    entry.status === "active" ? "text-white/70" : "text-muted-foreground"
                  )}>
                    {entry.startTime}
                  </span>
                  {entry.total && (
                    <span className={cn(
                      "font-bold",
                      entry.status === "active" ? "text-white" : "text-green-600"
                    )}>
                      ${entry.total.toFixed(2)}
                    </span>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <div className={cn("space-y-2", className)}>
        {entries.map((entry) => (
          <div
            key={entry.id}
            className={cn(
              "flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all",
              "hover:bg-muted/50",
              entry.status === "active" && "bg-green-50 dark:bg-green-950/20 border-green-500"
            )}
            onClick={() => onEntryClick?.(entry)}
          >
            <div className="flex items-center gap-3">
              {getStatusIcon(entry.status)}
              <div>
                <p className="font-medium text-sm">{entry.taskName}</p>
                <p className="text-xs text-muted-foreground">{entry.user.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium">{entry.duration}</span>
              {entry.total && (
                <span className="text-sm font-bold text-green-600">
                  ${entry.total.toFixed(2)}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Default list variant
  return (
    <div className={cn("space-y-4", className)}>
      {showTotals && (
        <Card variant="glass" className="p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex gap-8">
              <div>
                <p className="text-sm text-muted-foreground">Total Time</p>
                <p className="text-2xl font-bold">{totalHours.toFixed(1)} hours</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Billable Amount</p>
                <p className="text-2xl font-bold text-green-600">${totalEarnings.toFixed(2)}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Badge variant="solid" color="green">
                {entries.filter(e => e.status === "active").length} Active
              </Badge>
              <Badge variant="soft" color="gray">
                {entries.filter(e => e.status === "completed").length} Completed
              </Badge>
            </div>
          </div>
        </Card>
      )}

      <div className="space-y-3">
        {entries.map((entry) => (
          <Card
            key={entry.id}
            variant={entry.status === "active" ? "solid" : "elevated"}
            color={entry.status === "active" ? "green" : undefined}
            className={cn(
              "p-4 cursor-pointer hover:shadow-elevation-3 transition-all hover:-translate-y-1",
              entry.status === "active" && "shadow-colored"
            )}
            onClick={() => onEntryClick?.(entry)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  {getStatusIcon(entry.status)}
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <h4 className="font-medium">{entry.taskName}</h4>
                  <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                    <span>{entry.user.name}</span>
                    <span>•</span>
                    <span>{entry.startTime} {entry.endTime && `- ${entry.endTime}`}</span>
                    {entry.category && (
                      <>
                        <span>•</span>
                        <span>{entry.category}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="font-semibold">{entry.duration}</p>
                  {entry.rate && (
                    <p className="text-xs text-muted-foreground">${entry.rate}/hr</p>
                  )}
                </div>
                {entry.total && (
                  <div className="text-right">
                    <p className="font-bold text-green-600">${entry.total.toFixed(2)}</p>
                  </div>
                )}
                {onAction && entry.status !== "completed" && (
                  <Button
                    size="sm"
                    variant={entry.status === "active" ? "outline" : "gradient"}
                    onClick={(e) => {
                      e.stopPropagation();
                      onAction(entry.status === "active" ? "pause" : "play", entry);
                    }}
                  >
                    {entry.status === "active" ? (
                      <Pause className="h-3 w-3" />
                    ) : (
                      <Play className="h-3 w-3" />
                    )}
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}