"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowRight,
  Clock,
  Package,
  AlertCircle,
  CheckCircle,
  Smartphone,
  Timer,
  User,
  Calendar,
  Filter,
  Eye
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Ticket {
  id: string;
  ticket_number: string;
  device_info: string;
  customer_name: string;
  status: string;
  created_at: string;
  timer_running: boolean;
  total_time_minutes: number;
  assigned_to?: string;
}

interface TicketsTableProps {
  tickets: Ticket[];
  title?: string;
  showFilters?: boolean;
  currentUserId?: string;
  currentUserRole?: string;
  variant?: "default" | "compact" | "detailed";
  className?: string;
  showViewAll?: boolean;
  viewAllHref?: string;
  limit?: number;
}

const statusConfig = {
  pending: { color: "amber", icon: AlertCircle, label: "Pending" },
  in_progress: { color: "cyan", icon: Clock, label: "In Progress" },
  completed: { color: "green", icon: CheckCircle, label: "Completed" },
  cancelled: { color: "gray", icon: AlertCircle, label: "Cancelled" }
};

export function TicketsTable({
  tickets,
  title = "Tickets",
  showFilters = false,
  currentUserId,
  currentUserRole,
  variant = "default",
  className,
  showViewAll = false,
  viewAllHref = "/orders",
  limit
}: TicketsTableProps) {
  const [filter, setFilter] = useState<"all" | "mine">("mine");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Filter tickets based on selected filters
  const filteredTickets = tickets.filter(ticket => {
    // Filter by ownership
    if (filter === "mine" && currentUserId && ticket.assigned_to !== currentUserId) {
      return false;
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
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
    }
  };

  if (variant === "compact") {
    return (
      <Card variant="elevated" className={className}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Package className="h-4 w-4" />
              {title}
            </CardTitle>
            {showViewAll && (
              <Link href={viewAllHref}>
                <Button variant="ghost" size="sm">
                  View All
                  <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </Link>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {displayTickets.length > 0 ? (
              displayTickets.map((ticket) => {
                const config = statusConfig[ticket.status as keyof typeof statusConfig] || statusConfig.pending;
                const Icon = config.icon;
                
                return (
                  <Link key={ticket.id} href={`/orders/${ticket.id}`}>
                    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "h-8 w-8 rounded-lg flex items-center justify-center",
                          "bg-gradient-to-br from-primary/20 to-primary/10"
                        )}>
                          <Smartphone className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">#{ticket.ticket_number}</p>
                          <p className="text-xs text-muted-foreground">{ticket.device_info}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="soft" size="sm" color={config.color as any}>
                          <Icon className="h-3 w-3 mr-1" />
                          {config.label}
                        </Badge>
                        {ticket.timer_running && (
                          <Timer className="h-3 w-3 text-green-500 animate-pulse" />
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No tickets found</p>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant={variant === "detailed" ? "elevated" : "gradient"} className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Package className="h-5 w-5" />
            {title}
          </CardTitle>
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
              <Link href={viewAllHref}>
                <Button variant="outline" size="sm">
                  View All
                  <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ticket</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Device</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayTickets.length > 0 ? (
                displayTickets.map((ticket) => {
                  const config = statusConfig[ticket.status as keyof typeof statusConfig] || statusConfig.pending;
                  const Icon = config.icon;
                  
                  return (
                    <TableRow key={ticket.id}>
                      <TableCell className="font-medium">
                        #{ticket.ticket_number}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">{ticket.customer_name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Smartphone className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">{ticket.device_info}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="soft" size="sm" color={config.color as any}>
                          <Icon className="h-3 w-3 mr-1" />
                          {config.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {ticket.timer_running ? (
                            <Timer className="h-3 w-3 text-green-500 animate-pulse" />
                          ) : (
                            <Clock className="h-3 w-3 text-muted-foreground" />
                          )}
                          <span className="text-sm">{formatTime(ticket.total_time_minutes)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(ticket.created_at)}
                      </TableCell>
                      <TableCell>
                        <Link href={`/orders/${ticket.id}`}>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                            <Eye className="h-3 w-3" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No tickets found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        {displayTickets.length > 0 && (
          <div className="mt-4 text-xs text-muted-foreground text-right">
            Showing {displayTickets.length} of {filteredTickets.length} tickets
          </div>
        )}
      </CardContent>
    </Card>
  );
}