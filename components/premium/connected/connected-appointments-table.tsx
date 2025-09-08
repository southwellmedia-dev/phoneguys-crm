"use client";

import { useState } from "react";
import Link from "next/link";
import { useTodaysAppointments } from "@/lib/hooks/use-dashboard";
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
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  XCircle
} from "lucide-react";

interface ConnectedAppointmentsTableProps {
  title?: string;
  variant?: "default" | "elevated" | "glass" | "gradient";
  showFilters?: boolean;
  limit?: number;
  showViewAll?: boolean;
  showAllAppointments?: boolean; // Show all appointments, not just today's
  className?: string;
}

const statusConfig = {
  scheduled: { color: "cyan", icon: Calendar, label: "Scheduled" },
  confirmed: { color: "green", icon: CheckCircle, label: "Confirmed" },
  completed: { color: "green", icon: CheckCircle, label: "Completed" },
  cancelled: { color: "red", icon: XCircle, label: "Cancelled" },
  no_show: { color: "amber", icon: AlertCircle, label: "No Show" }
};

export function ConnectedAppointmentsTable({
  title = "Appointments",
  variant = "gradient",
  showFilters = false,
  limit,
  showViewAll = false,
  showAllAppointments = false,
  className
}: ConnectedAppointmentsTableProps) {
  const { data: appointments, isLoading } = useTodaysAppointments();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [timeFilter, setTimeFilter] = useState<string>("all");

  // Filter appointments
  const filteredAppointments = (appointments || []).filter(appointment => {
    // Filter by status
    if (statusFilter !== "all" && appointment.status !== statusFilter) {
      return false;
    }
    
    // Filter by time (morning/afternoon)
    if (timeFilter !== "all" && appointment.scheduled_time) {
      const hour = parseInt(appointment.scheduled_time.split(':')[0]);
      if (timeFilter === "morning" && hour >= 12) return false;
      if (timeFilter === "afternoon" && hour < 12) return false;
    }
    
    return true;
  });

  const displayAppointments = limit ? filteredAppointments.slice(0, limit) : filteredAppointments;

  const formatTime = (time: string) => {
    if (!time) return "TBD";
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return "Tomorrow";
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const columns = [
    {
      key: 'scheduled_time',
      header: 'Time',
      render: (value: any, appointment: any) => {
        if (!appointment) return <span className="text-sm">-</span>;
        
        return (
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="font-medium text-sm">{formatTime(appointment?.scheduled_time)}</p>
              <p className="text-xs text-muted-foreground">{formatDate(appointment?.scheduled_date)}</p>
            </div>
          </div>
        );
      }
    },
    {
      key: 'customer_name',
      header: 'Customer',
      render: (value: any, appointment: any) => {
        if (!appointment) return <span className="text-sm">-</span>;
        
        return (
          <div>
            <div className="flex items-center gap-2">
              <User className="h-3 w-3 text-muted-foreground" />
              <span className="text-sm font-medium">
                {appointment?.customer_name || 'Unknown'}
              </span>
            </div>
            {appointment?.customer_phone && (
              <div className="flex items-center gap-2 mt-1">
                <Phone className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  {appointment.customer_phone}
                </span>
              </div>
            )}
          </div>
        );
      }
    },
    {
      key: 'service_type',
      header: 'Service',
      render: (value: any, appointment: any) => {
        if (!appointment) return <span className="text-sm">-</span>;
        
        return (
          <div>
            <p className="text-sm">{appointment?.service_type || appointment?.notes || 'General Repair'}</p>
            {(appointment?.issues || appointment?.description) && (
              <p className="text-xs text-muted-foreground mt-1">
                {Array.isArray(appointment.issues) 
                  ? appointment.issues.join(', ') 
                  : (appointment.issues || appointment.description)}
              </p>
            )}
          </div>
        );
      }
    },
    {
      key: 'status',
      header: 'Status',
      render: (value: any, appointment: any) => {
        if (!appointment) return <span className="text-sm">-</span>;
        
        const config = statusConfig[appointment?.status as keyof typeof statusConfig] || statusConfig.scheduled;
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
      key: 'notes',
      header: 'Notes',
      render: (value: any, appointment: any) => (
        <p className="text-xs text-muted-foreground max-w-[200px] truncate">
          {appointment?.notes || '—'}
        </p>
      )
    }
  ];

  const actions = (appointment: any) => (
    <div className="flex items-center gap-1">
      {appointment.converted_to_ticket_id ? (
        <Link href={`/orders/${appointment.converted_to_ticket_id}`}>
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
            View Ticket
          </Button>
        </Link>
      ) : (
        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
          Convert
        </Button>
      )}
    </div>
  );

  const headerActions = (
    <div className="flex items-center gap-2">
      {showFilters && (
        <>
          <Select value={timeFilter} onValueChange={setTimeFilter}>
            <SelectTrigger className="w-[100px] h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Times</SelectItem>
              <SelectItem value="morning">Morning</SelectItem>
              <SelectItem value="afternoon">Afternoon</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[120px] h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </>
      )}
      {showViewAll && (
        <Link href="/appointments">
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
      data={displayAppointments}
      columns={columns}
      variant={variant}
      actions={actions}
      headerActions={headerActions}
      emptyMessage="No appointments scheduled"
      className={className}
      footer={
        displayAppointments.length > 0 && (
          <div className="text-xs text-muted-foreground">
            Showing {displayAppointments.length} of {filteredAppointments.length} appointments
          </div>
        )
      }
    />
  );
}