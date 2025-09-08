"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { DetailPageLayout } from "@/components/premium/layout/detail-page-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PhoneDetailCard } from "@/components/premium/cards/phone-detail-card";
import { ActivityTimeline } from "@/components/premium/activity/activity-timeline";
import { TimeEntries } from "@/components/premium/time/time-entries";
import { PremiumTabs } from "@/components/premium/navigation/premium-tabs";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { 
  Clock, 
  User, 
  Calendar,
  Phone,
  Mail,
  MapPin,
  Package,
  AlertCircle,
  CheckCircle,
  XCircle,
  Timer,
  Play,
  Pause,
  MessageSquare,
  FileText,
  DollarSign,
  Wrench,
  Camera,
  Edit,
  Save,
  X
} from "lucide-react";

interface PremiumTicketDetailClientProps {
  ticket: any;
  user: any;
  userRole: string;
}

const statusConfig = {
  pending: { color: "amber", icon: AlertCircle, label: "Pending" },
  in_progress: { color: "cyan", icon: Clock, label: "In Progress" },
  completed: { color: "green", icon: CheckCircle, label: "Completed" },
  cancelled: { color: "gray", icon: XCircle, label: "Cancelled" }
};

export function PremiumTicketDetailClient({ ticket, user, userRole }: PremiumTicketDetailClientProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("details");
  const [isEditing, setIsEditing] = useState(false);
  const [notes, setNotes] = useState("");

  const statusInfo = statusConfig[ticket.status as keyof typeof statusConfig] || statusConfig.pending;
  const StatusIcon = statusInfo.icon;

  // Format time
  const formatTime = (minutes: number) => {
    if (!minutes) return "0m";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  // Timer mutation
  const toggleTimer = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/tickets/${ticket.id}/timer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: ticket.timer_running ? 'stop' : 'start' 
        })
      });
      
      if (!response.ok) throw new Error('Failed to toggle timer');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', ticket.id] });
      toast.success(ticket.timer_running ? 'Timer stopped' : 'Timer started');
      router.refresh();
    },
    onError: () => {
      toast.error('Failed to toggle timer');
    }
  });

  // Status update mutation
  const updateStatus = useMutation({
    mutationFn: async (newStatus: string) => {
      const response = await fetch(`/api/tickets/${ticket.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (!response.ok) throw new Error('Failed to update status');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', ticket.id] });
      toast.success('Status updated');
      router.refresh();
    },
    onError: () => {
      toast.error('Failed to update status');
    }
  });

  // Add note mutation
  const addNote = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/tickets/${ticket.id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: notes })
      });
      
      if (!response.ok) throw new Error('Failed to add note');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', ticket.id] });
      toast.success('Note added');
      setNotes("");
      router.refresh();
    },
    onError: () => {
      toast.error('Failed to add note');
    }
  });

  // Header actions
  const headerActions = [
    {
      label: ticket.timer_running ? "Stop Timer" : "Start Timer",
      icon: ticket.timer_running ? <Pause className="h-4 w-4 mr-1" /> : <Play className="h-4 w-4 mr-1" />,
      variant: ticket.timer_running ? "outline" : "gradient" as const,
      color: "green" as const,
      onClick: () => toggleTimer.mutate()
    },
    {
      label: isEditing ? "Save" : "Edit",
      icon: isEditing ? <Save className="h-4 w-4 mr-1" /> : <Edit className="h-4 w-4 mr-1" />,
      variant: "outline" as const,
      onClick: () => setIsEditing(!isEditing)
    }
  ];

  const moreActions = [
    {
      label: "Print Invoice",
      icon: <FileText className="h-4 w-4 mr-2" />,
      onClick: () => window.print()
    },
    {
      label: "Send SMS",
      icon: <MessageSquare className="h-4 w-4 mr-2" />,
      onClick: () => toast.info("SMS feature coming soon")
    },
    {
      label: "Mark as Completed",
      icon: <CheckCircle className="h-4 w-4 mr-2" />,
      onClick: () => updateStatus.mutate("completed"),
      disabled: ticket.status === "completed"
    },
    {
      label: "Cancel Ticket",
      icon: <XCircle className="h-4 w-4 mr-2" />,
      onClick: () => updateStatus.mutate("cancelled"),
      disabled: ticket.status === "cancelled",
      destructive: true
    }
  ];

  // Tabs for content sections
  const tabs = [
    { id: "details", label: "Details", icon: <Package className="h-4 w-4" /> },
    { id: "activity", label: "Activity", icon: <Clock className="h-4 w-4" /> },
    { id: "time", label: "Time Tracking", icon: <Timer className="h-4 w-4" /> },
    { id: "photos", label: "Photos", icon: <Camera className="h-4 w-4" /> },
    { id: "invoice", label: "Invoice", icon: <DollarSign className="h-4 w-4" /> }
  ];

  // Mock activity data
  const activityItems = [
    {
      id: "1",
      user: ticket.created_by_name || "System",
      action: "created the ticket",
      timestamp: new Date(ticket.created_at),
      type: "create" as const
    },
    ...(ticket.notes || []).map((note: any, idx: number) => ({
      id: `note-${idx}`,
      user: note.created_by_name || "Technician",
      action: note.content,
      timestamp: new Date(note.created_at),
      type: "comment" as const
    })),
    ...(ticket.timer_running ? [{
      id: "timer",
      user: user?.name || "Current User",
      action: "Timer is running",
      timestamp: new Date(),
      type: "timer" as const
    }] : [])
  ].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  // Mock time entries
  const timeEntries = ticket.time_entries || [
    {
      id: "1",
      date: new Date().toISOString(),
      technician: user?.name || "John Doe",
      duration: ticket.total_time_minutes || 0,
      description: "Repair work",
      status: ticket.timer_running ? "active" : "completed"
    }
  ];

  // Render content based on active tab
  const renderTabContent = () => {
    switch (activeTab) {
      case "activity":
        return (
          <div className="space-y-6">
            <ActivityTimeline items={activityItems} />
            
            {/* Add Note Section */}
            <Card variant="outlined">
              <CardHeader>
                <CardTitle className="text-base">Add Note</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Enter your notes here..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="mb-3"
                  rows={3}
                />
                <Button 
                  onClick={() => addNote.mutate()}
                  disabled={!notes.trim()}
                  variant="gradient"
                  color="cyan"
                  size="sm"
                >
                  <MessageSquare className="h-4 w-4 mr-1" />
                  Add Note
                </Button>
              </CardContent>
            </Card>
          </div>
        );

      case "time":
        return (
          <TimeEntries 
            entries={timeEntries}
            onAddEntry={() => toast.info("Add time entry coming soon")}
          />
        );

      case "photos":
        return (
          <Card variant="outlined">
            <CardContent className="py-12 text-center text-muted-foreground">
              <Camera className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
              <p>No photos uploaded yet</p>
              <Button variant="outline" size="sm" className="mt-3">
                Upload Photos
              </Button>
            </CardContent>
          </Card>
        );

      case "invoice":
        return (
          <Card variant="outlined">
            <CardHeader>
              <CardTitle>Invoice Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-sm">Diagnostic Fee</span>
                  <span className="font-medium">$25.00</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-sm">Labor ({formatTime(ticket.total_time_minutes)})</span>
                  <span className="font-medium">$75.00</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-sm">Parts</span>
                  <span className="font-medium">$0.00</span>
                </div>
                <div className="flex justify-between py-3 text-lg font-semibold">
                  <span>Total</span>
                  <span>$100.00</span>
                </div>
              </div>
              <div className="mt-6 flex gap-2">
                <Button variant="gradient" color="green" size="sm">
                  <DollarSign className="h-4 w-4 mr-1" />
                  Process Payment
                </Button>
                <Button variant="outline" size="sm">
                  <FileText className="h-4 w-4 mr-1" />
                  Print Invoice
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      default: // details
        return (
          <div className="space-y-6">
            {/* Repair Information */}
            <Card variant="elevated">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="h-5 w-5" />
                  Repair Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Issue Description</p>
                    <p className="font-medium">{ticket.problem_description || "No description"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Service Type</p>
                    <p className="font-medium">{ticket.service_type || "General Repair"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Priority</p>
                    <Badge variant="soft" color={ticket.priority === "high" ? "red" : ticket.priority === "medium" ? "amber" : "green"}>
                      {ticket.priority || "normal"}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Assigned To</p>
                    <p className="font-medium">{ticket.assigned_to_name || "Unassigned"}</p>
                  </div>
                </div>

                {ticket.internal_notes && (
                  <div className="pt-4 border-t">
                    <p className="text-sm text-muted-foreground mb-1">Internal Notes</p>
                    <p className="text-sm">{ticket.internal_notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Parts & Services */}
            <Card variant="outlined">
              <CardHeader>
                <CardTitle className="text-base">Parts & Services</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">No parts added yet</p>
              </CardContent>
            </Card>
          </div>
        );
    }
  };

  // Sidebar content
  const sidebarContent = (
    <>
      {/* Customer Info */}
      <Card variant="gradient">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4" />
            Customer
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="font-medium">{ticket.customer?.name || "Unknown"}</p>
            {ticket.customer?.phone && (
              <div className="flex items-center gap-2 mt-1">
                <Phone className="h-3 w-3 text-muted-foreground" />
                <span className="text-sm">{ticket.customer.phone}</span>
              </div>
            )}
            {ticket.customer?.email && (
              <div className="flex items-center gap-2 mt-1">
                <Mail className="h-3 w-3 text-muted-foreground" />
                <span className="text-sm">{ticket.customer.email}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Device Info */}
      <PhoneDetailCard
        device={{
          brand: ticket.device?.brand || "Unknown",
          model: ticket.device?.model || "Unknown",
          storage: ticket.storage_size || "Unknown",
          color: ticket.device_color || "Unknown",
          imei: ticket.imei,
          serialNumber: ticket.serial_number
        }}
        variant="elevated"
      />

      {/* Quick Stats */}
      <Card variant="glass">
        <CardHeader>
          <CardTitle className="text-base">Quick Stats</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Total Time</span>
            <Badge variant="soft" color="purple">
              {formatTime(ticket.total_time_minutes)}
            </Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Created</span>
            <span className="text-sm">
              {new Date(ticket.created_at).toLocaleDateString()}
            </span>
          </div>
          {ticket.timer_running && (
            <div className="pt-3 border-t">
              <div className="flex items-center gap-2 text-green-600">
                <Timer className="h-4 w-4 animate-pulse" />
                <span className="text-sm font-medium">Timer Running</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );

  return (
    <div className="h-screen flex overflow-hidden bg-background">
      <Sidebar user={user} />
      
      <div className="flex-1 overflow-hidden">
        <DetailPageLayout
          backHref="/orders"
          backLabel="Back to Tickets"
          title={`Ticket #${ticket.ticket_number}`}
          subtitle={`${ticket.device_info} - ${ticket.customer?.name || "Unknown Customer"}`}
          status={{
            label: statusInfo.label,
            color: statusInfo.color as any,
            variant: "soft"
          }}
          badges={[
            ...(ticket.timer_running ? [{
              label: "Timer Active",
              color: "green" as const,
              variant: "solid" as const
            }] : [])
          ]}
          actions={headerActions}
          moreActions={moreActions}
          sidebar={sidebarContent}
        >
          <PremiumTabs
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            variant="default"
            className="mb-6"
          />
          
          {renderTabContent()}
        </DetailPageLayout>
      </div>
    </div>
  );
}