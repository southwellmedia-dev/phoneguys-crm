"use client";

import { ActivityTimeline, ActivityTimelineProps, TimelineEvent } from "@/components/premium/repair/activity-timeline";
import { useTicket } from "@/lib/hooks/use-tickets";
import { useRealtime } from "@/lib/hooks/use-realtime";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Clock } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

interface ConnectedActivityTimelineProps extends Omit<ActivityTimelineProps, 'events'> {
  ticketId: string;
  title?: string;
  showCard?: boolean;
  maxEvents?: number;
  className?: string;
}

// Transform ticket data into timeline events
const transformTicketToEvents = (ticket: any): TimelineEvent[] => {
  if (!ticket) return [];
  
  const events: TimelineEvent[] = [];
  
  // Add creation event
  events.push({
    id: `ticket-created-${ticket.id}`,
    type: "status",
    title: "Ticket Created",
    description: `Ticket #${ticket.ticket_number} was created`,
    timestamp: new Date(ticket.created_at).toLocaleString(),
    user: {
      name: ticket.created_by?.name || "System"
    },
    highlight: false
  });

  // Add status changes from ticket history or notes
  if (ticket.ticket_notes && Array.isArray(ticket.ticket_notes)) {
    ticket.ticket_notes.forEach((note: any) => {
      // Determine event type based on note content
      let eventType: TimelineEvent["type"] = "note";
      let title = "Note Added";
      
      if (note.note_type === 'status_change' || note.content?.includes('status changed')) {
        eventType = "status";
        title = "Status Updated";
      } else if (note.note_type === 'customer_contact') {
        eventType = "call";
        title = "Customer Contact";
      } else if (note.note_type === 'payment') {
        eventType = "payment";
        title = "Payment Processed";
      } else if (note.note_type === 'repair_work') {
        eventType = "repair";
        title = "Repair Work";
      }

      events.push({
        id: note.id,
        type: eventType,
        title,
        description: note.content,
        timestamp: new Date(note.created_at).toLocaleString(),
        user: {
          name: note.created_by?.name || note.user?.name || "Unknown User"
        }
      });
    });
  }

  // Add time entries as repair events
  if (ticket.time_entries && Array.isArray(ticket.time_entries)) {
    ticket.time_entries.forEach((entry: any) => {
      events.push({
        id: entry.id,
        type: "repair",
        title: "Work Session",
        description: entry.description || entry.work_notes || "Time tracked on repair",
        timestamp: new Date(entry.created_at).toLocaleString(),
        user: {
          name: entry.technician?.name || entry.user?.name || "Technician"
        },
        metadata: {
          duration: entry.minutes_worked ? `${entry.minutes_worked}min` : undefined,
          billable: entry.is_billable ? "Yes" : "No"
        }
      });
    });
  }

  // Add current status as highlighted event if ticket is active
  const activeStatuses = ['in_progress', 'waiting_parts', 'testing'];
  if (activeStatuses.includes(ticket.status)) {
    events.push({
      id: `current-status-${ticket.id}`,
      type: "status",
      title: `Currently: ${ticket.status.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}`,
      description: ticket.timer_is_running ? "Timer is running" : "Ready for work",
      timestamp: "Now",
      highlight: true,
      metadata: ticket.timer_is_running ? {
        "Timer Status": "Running",
        "Started": ticket.timer_started_at ? new Date(ticket.timer_started_at).toLocaleString() : "Unknown"
      } : undefined
    });
  }

  // Sort events by timestamp (newest first for timeline display)
  return events.sort((a, b) => {
    if (a.timestamp === "Now") return -1;
    if (b.timestamp === "Now") return 1;
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });
};

// Loading skeleton
function TimelineSkeleton({ variant }: { variant?: ActivityTimelineProps['variant'] }) {
  const itemCount = variant === "compact" ? 3 : 5;
  
  if (variant === "compact") {
    return (
      <div className="space-y-2">
        {Array.from({ length: itemCount }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-2">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="flex-1 h-4" />
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {Array.from({ length: itemCount }).map((_, i) => (
        <div key={i} className="flex gap-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Error state
function TimelineError({ error, className }: { error: string; className?: string }) {
  return (
    <div className={cn("flex items-center justify-center p-8 text-center", className)}>
      <div className="space-y-2">
        <AlertCircle className="h-8 w-8 text-red-500 mx-auto" />
        <p className="text-sm text-muted-foreground">{error}</p>
      </div>
    </div>
  );
}

// Empty state
function TimelineEmpty({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-center p-8 text-center", className)}>
      <div className="space-y-2">
        <Clock className="h-8 w-8 text-muted-foreground mx-auto" />
        <p className="text-sm text-muted-foreground">No activity recorded yet</p>
      </div>
    </div>
  );
}

export function ConnectedActivityTimeline({
  ticketId,
  title = "Activity Timeline",
  showCard = true,
  maxEvents,
  variant = "default",
  className
}: ConnectedActivityTimelineProps) {
  const queryClient = useQueryClient();
  const { data: ticket, isLoading, error } = useTicket(ticketId);
  
  // Set up real-time updates for ticket changes
  useRealtime({
    channel: `ticket-activity-${ticketId}`,
    table: 'repair_tickets',
    filter: `id=eq.${ticketId}`,
    onUpdate: (payload) => {
      // Update the ticket data in cache to refresh timeline
      queryClient.setQueryData(['ticket', ticketId], (old: any) => ({
        ...old,
        ...payload.new,
        updated_at: new Date().toISOString()
      }));
    }
  });

  // Listen for new notes/time entries
  useRealtime({
    channel: `ticket-notes-${ticketId}`,
    table: 'ticket_notes',
    filter: `ticket_id=eq.${ticketId}`,
    onInsert: (payload) => {
      // Add new note to ticket data
      queryClient.setQueryData(['ticket', ticketId], (old: any) => {
        if (!old) return old;
        const newNote = payload.new;
        return {
          ...old,
          ticket_notes: [...(old.ticket_notes || []), newNote],
          updated_at: new Date().toISOString()
        };
      });
    }
  });

  const events = transformTicketToEvents(ticket);
  const displayEvents = maxEvents ? events.slice(0, maxEvents) : events;
  
  const content = (() => {
    if (isLoading) return <TimelineSkeleton variant={variant} />;
    if (error) return <TimelineError error="Failed to load activity timeline" />;
    if (displayEvents.length === 0) return <TimelineEmpty />;
    
    return (
      <ActivityTimeline
        events={displayEvents}
        variant={variant}
      />
    );
  })();
  
  if (!showCard) {
    return <div className={className}>{content}</div>;
  }
  
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          {title}
          {displayEvents.length > 0 && (
            <span className="text-sm font-normal text-muted-foreground">
              ({displayEvents.length} events)
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {content}
      </CardContent>
    </Card>
  );
}

function cn(...args: any[]) {
  return args.filter(Boolean).join(' ');
}