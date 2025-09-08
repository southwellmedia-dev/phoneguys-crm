"use client";

import { useState } from "react";
import Link from "next/link";
import { useRecentTickets } from "@/lib/hooks/use-dashboard";
import { PremiumTable } from "@/components/premium/data/premium-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Clock,
  AlertCircle,
  CheckCircle,
  Smartphone,
  Timer,
  Eye,
  ArrowRight,
  User
} from "lucide-react";

interface ConnectedTicketsTableProps {
  title?: string;
  variant?: "default" | "elevated" | "glass" | "gradient";
  showFilters?: boolean;
  currentUserId?: string;
  currentUserRole?: string;
  limit?: number;
  showViewAll?: boolean;
  className?: string;
}

const statusConfig = {
  pending: { color: "amber", icon: AlertCircle, label: "Pending" },
  in_progress: { color: "cyan", icon: Clock, label: "In Progress" },
  completed: { color: "green", icon: CheckCircle, label: "Completed" },
  cancelled: { color: "gray", icon: AlertCircle, label: "Cancelled" }
};

export function ConnectedTicketsTable({
  title = "Repair Tickets",
  variant = "elevated",
  showFilters = false,
  currentUserId,
  currentUserRole,
  limit,
  showViewAll = false,
  className
}: ConnectedTicketsTableProps) {
  const { data: tickets, isLoading } = useRecentTickets();
  const [filter, setFilter] = useState<"all" | "mine">("mine");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Filter tickets based on selected filters
  const filteredTickets = (tickets || []).filter(ticket => {
    // For technicians, filter by assignment (when we have that data)
    // For now, show all for "mine" if user is technician
    if (filter === "mine" && currentUserRole === "technician") {
      // TODO: Filter by assigned_to when that field is available
      return ticket.status === "in_progress" || ticket.status === "pending";
    }
    
    // Filter by status
    if (statusFilter !== "all" && ticket.status !== statusFilter) {
      return false;
    }
    
    return true;
  });

  const displayTickets = limit ? filteredTickets.slice(0, limit) : filteredTickets;

  const formatTime = (minutes: number) => {
    if (!minutes) return "—";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return `Today, ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday, ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const columns = [
    {
      key: 'ticket_number',
      header: 'Ticket',
      render: (value: any, ticket: any) => (
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
            <Smartphone className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="font-medium">#{ticket.ticket_number}</p>
            <p className="text-xs text-muted-foreground">{ticket.device_info}</p>
          </div>
        </div>
      )
    },
    {
      key: 'customer_name',
      header: 'Customer',
      render: (value: any, ticket: any) => (
        <div className="flex items-center gap-2">
          <User className="h-3 w-3 text-muted-foreground" />
          <span className="text-sm">{ticket.customer_name}</span>
        </div>
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: (value: any, ticket: any) => {
        const config = statusConfig[ticket.status as keyof typeof statusConfig] || statusConfig.pending;
        const Icon = config.icon;
        return (
          <Badge variant="soft" size="sm" color={config.color as any}>
            <Icon className="h-3 w-3 mr-1" />
            {config.label}
          </Badge>
        );
      }
    },
    {
      key: 'total_time_minutes',
      header: 'Time',
      render: (value: any, ticket: any) => (
        <div className="flex items-center gap-1">
          {ticket.timer_running ? (
            <Timer className="h-3 w-3 text-green-500 animate-pulse" />
          ) : (
            <Clock className="h-3 w-3 text-muted-foreground" />
          )}
          <span className="text-sm">{formatTime(ticket.total_time_minutes)}</span>
        </div>
      )
    },
    {
      key: 'created_at',
      header: 'Created',
      render: (value: any, ticket: any) => (
        <span className="text-sm text-muted-foreground">
          {formatDate(ticket.created_at)}
        </span>
      )
    }
  ];

  const actions = (ticket: any) => (
    <Link href={`/orders/${ticket.id}`}>
      <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
        <Eye className="h-3 w-3" />
      </Button>
    </Link>
  );

  const headerActions = (
    <div className="flex items-center gap-2">
      {showFilters && (
        <>
          <Select value={filter} onValueChange={(value: any) => setFilter(value)}>
            <SelectTrigger className="w-[100px] h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mine">My Tickets</SelectItem>
              <SelectItem value="all">All Tickets</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[120px] h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </>
      )}
      {showViewAll && (
        <Link href="/orders">
          <Button variant="outline" size="sm">
            View All
            <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        </Link>
      )}
    </div>
  );

  if (isLoading) {
    return (
      <PremiumTable
        title={title}
        data={[]}
        columns={columns}
        variant={variant}
        loading
        className={className}
      />
    );
  }

  return (
    <PremiumTable
      title={title}
      data={displayTickets}
      columns={columns}
      variant={variant}
      actions={actions}
      headerActions={headerActions}
      emptyMessage="No tickets found"
      className={className}
      footer={
        displayTickets.length > 0 && (
          <div className="text-xs text-muted-foreground">
            Showing {displayTickets.length} of {filteredTickets.length} tickets
          </div>
        )
      }
    />
  );
}