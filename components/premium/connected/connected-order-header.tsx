"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/premium/cards/stat-card";
import { cn } from "@/lib/utils";
import { 
  Clock, 
  DollarSign, 
  Wrench, 
  FileText,
  AlertCircle,
  CheckCircle,
  XCircle,
  Timer,
  Package
} from "lucide-react";

interface ConnectedOrderHeaderProps {
  order: any;
  className?: string;
}

const statusConfig = {
  pending: { 
    color: "amber", 
    icon: AlertCircle, 
    label: "Pending",
    bgClass: "bg-amber-50 dark:bg-amber-950/20",
    borderClass: "border-amber-200 dark:border-amber-800/50",
    iconClass: "text-amber-600 dark:text-amber-400"
  },
  in_progress: { 
    color: "cyan", 
    icon: Timer, 
    label: "In Progress",
    bgClass: "bg-cyan-50 dark:bg-cyan-950/20",
    borderClass: "border-cyan-200 dark:border-cyan-800/50",
    iconClass: "text-cyan-600 dark:text-cyan-400"
  },
  on_hold: {
    color: "yellow",
    icon: Clock,
    label: "On Hold",
    bgClass: "bg-yellow-50 dark:bg-yellow-950/20",
    borderClass: "border-yellow-200 dark:border-yellow-800/50",
    iconClass: "text-yellow-600 dark:text-yellow-400"
  },
  completed: { 
    color: "green", 
    icon: CheckCircle, 
    label: "Completed",
    bgClass: "bg-green-50 dark:bg-green-950/20",
    borderClass: "border-green-200 dark:border-green-800/50",
    iconClass: "text-green-600 dark:text-green-400"
  },
  cancelled: { 
    color: "gray", 
    icon: XCircle, 
    label: "Cancelled",
    bgClass: "bg-gray-50 dark:bg-gray-950/20",
    borderClass: "border-gray-200 dark:border-gray-800/50",
    iconClass: "text-gray-600 dark:text-gray-400"
  }
};

export function ConnectedOrderHeader({ order, className }: ConnectedOrderHeaderProps) {
  const statusInfo = statusConfig[order.status as keyof typeof statusConfig] || statusConfig.pending;
  const StatusIcon = statusInfo.icon;

  // Calculate total time
  const totalTimeMinutes = order?.time_entries?.reduce(
    (acc: number, entry: any) => acc + (entry.duration_minutes || 0),
    0
  ) || order?.timer_total_minutes || order?.total_time_minutes || 0;

  const formatTime = (minutes: number) => {
    if (!minutes) return "0m";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  // Calculate total amount from services
  const totalAmount = order.ticket_services?.reduce(
    (sum: number, ts: any) =>
      sum + (ts.unit_price || ts.service?.base_price || 0) * (ts.quantity || 1),
    0
  ) || 0;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Priority Indicator - Moved to top */}
      {order.priority && (
        <div className={cn(
          "flex items-center gap-2 p-3 rounded-lg border",
          order.priority === "high" 
            ? "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800/50"
            : order.priority === "medium"
            ? "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/50"
            : "bg-slate-50 dark:bg-slate-950/20 border-slate-200 dark:border-slate-800/50"
        )}>
          <AlertCircle className={cn(
            "h-4 w-4",
            order.priority === "high" 
              ? "text-red-600 dark:text-red-400"
              : order.priority === "medium"
              ? "text-amber-600 dark:text-amber-400"
              : "text-slate-600 dark:text-slate-400"
          )} />
          <span className="text-sm font-medium">
            {order.priority === "high" ? "High Priority" : order.priority === "medium" ? "Medium Priority" : "Low Priority"}
          </span>
        </div>
      )}

      {/* Metrics Grid - Mixed Components */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Time Card - Custom solid style */}
        <Card variant="solid" color="cyan" className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-white/80 uppercase tracking-wider">Total Time</p>
              <p className="text-2xl font-bold text-white mt-1">{formatTime(totalTimeMinutes)}</p>
            </div>
            <Clock className="h-5 w-5 text-white/30" />
          </div>
        </Card>
        
        <StatCard
          title="Total Amount"
          value={`$${totalAmount.toFixed(2)}`}
          icon={DollarSign}
          variant="floating"
          color="green"
        />
        <StatCard
          title="Services"
          value={String(order.ticket_services?.length || 0)}
          icon={Wrench}
          variant="floating"
          color="purple"
        />
        <StatCard
          title="Notes"
          value={String(order.ticket_notes?.length || 0)}
          icon={FileText}
          variant="floating"
          color="amber"
        />
      </div>
    </div>
  );
}