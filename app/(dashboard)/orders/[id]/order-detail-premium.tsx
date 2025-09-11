"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTicket, useUpdateTicketStatus, useStartTimer, useStopTimer, useClearTimer } from "@/lib/hooks/use-tickets";
import { useRealtime } from "@/lib/hooks/use-realtime";
import { useQueryClient } from "@tanstack/react-query";
import { PageContainer } from "@/components/layout/page-container";
import { StatusBadge, RepairStatus } from "@/components/orders/status-badge";
import { TimerControl } from "@/components/orders/timer-control";
import { StatusChangeDialog } from "@/components/orders/status-change-dialog";
import { TimeEntriesSection } from "@/components/orders/time-entries-section";
import { TicketPhotosSidebar } from "@/components/orders/ticket-photos-sidebar";
import { AddDeviceToProfileDialog } from "@/components/orders/add-device-to-profile-dialog";
import { MetricCard } from "@/components/premium/ui/cards/metric-card";
import { CustomerInfoCard, AssigneeCard } from "@/components/premium/features/appointments/ui";
import { DeviceDetailCard } from "@/components/premium/features/appointments/ui/device-detail-card-premium";
import { SkeletonPremium } from "@/components/premium/ui/feedback/skeleton-premium";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ButtonPremium } from "@/components/premium/ui/buttons/button-premium";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { 
  ArrowLeft,
  Edit,
  Mail,
  Phone,
  User,
  Calendar,
  Clock,
  Smartphone,
  AlertCircle,
  FileText,
  Printer,
  CheckCircle2,
  Pause,
  MoreHorizontal,
  Timer,
  Trash2,
  Wrench,
  RotateCcw,
  Plus,
  Copy,
  Package2,
  Edit3,
  DollarSign,
  MessageSquare,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { format } from "date-fns";
import { toast } from "sonner";
import { RepairTicketWithRelations } from "@/lib/types/repair-ticket";
import { SkeletonOrderDetail } from "@/components/ui/skeleton-order-detail";

interface TicketDetailPremiumProps {
  order: RepairTicketWithRelations;
  orderId: string;
  totalTimeMinutes: number;
  isAdmin: boolean;
  currentUserId: string;
  matchingCustomerDevice?: any;
  addDeviceToProfile?: (data: any) => Promise<any>;
  appointmentData?: any;
  technicians: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
  }>;
}

export function TicketDetailPremium({ 
  order: initialOrder, 
  orderId,
  totalTimeMinutes: initialTotalTimeMinutes,
  isAdmin = false,
  currentUserId = "",
  matchingCustomerDevice,
  addDeviceToProfile,
  appointmentData,
  technicians = []
}: TicketDetailPremiumProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: order = initialOrder, showSkeleton: ticketSkeleton } = useTicket(orderId, initialOrder);
  const updateStatusMutation = useUpdateTicketStatus();
  const clearTimerMutation = useClearTimer();
  
  // Set up real-time subscriptions
  useRealtime(['tickets']);
  
  // Calculate total time from order data (real-time updates will keep this current)
  const totalTimeMinutes = order?.time_entries?.reduce(
    (acc: number, entry: any) => acc + (entry.duration_minutes || 0),
    0
  ) || order?.timer_total_minutes || order?.total_time_minutes || initialTotalTimeMinutes || 0;
  
  // Use proper hydration strategy skeleton
  const showSkeleton = ticketSkeleton;
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [deletingEntryId, setDeletingEntryId] = useState<string | null>(null);
  const [showAddDeviceDialog, setShowAddDeviceDialog] = useState(false);
  const [assignedTechId, setAssignedTechId] = useState(order.assigned_to || 'unassigned');

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      return date.toLocaleString();
    } catch {
      return '';
    }
  };

  const handleStatusChange = (newStatus: any, reason?: string) => {
    // Update status using optimistic updates
    updateStatusMutation.mutate({ id: orderId, status: newStatus });
  };

  const handleReopen = async () => {
    try {
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "in_progress",
          reason: "Order reopened",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to reopen order");
      }

      toast.success("Order reopened successfully");
      
      // Update ticket in cache directly
      queryClient.setQueryData(['ticket', orderId], (old: any) => {
        if (!old) return old;
        return { ...old, status: 'in_progress', updated_at: new Date().toISOString() };
      });
      
      // Update ticket lists
      queryClient.setQueriesData(
        { queryKey: ['tickets'], exact: false },
        (old: any[] = []) => {
          return old.map(ticket => 
            ticket.id === orderId 
              ? { ...ticket, status: 'in_progress', updated_at: new Date().toISOString() }
              : ticket
          );
        }
      );
    } catch (error) {
      toast.error("Failed to reopen order");
      console.error("Error reopening order:", error);
    }
  };

  const handleAssignmentChange = async (technicianId: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}/assign`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assigned_to: technicianId || null }),
      });

      if (!response.ok) throw new Error("Failed to update assignment");

      setAssignedTechId(technicianId || 'unassigned');
      
      // Update cache
      queryClient.setQueryData(['ticket', orderId], (old: any) => {
        if (!old) return old;
        return { ...old, assigned_to: technicianId || null };
      });

      const techName = technicians.find(t => t.id === technicianId)?.name || 'Unassigned';
      toast.success(`Ticket ${technicianId ? `assigned to ${techName}` : 'unassigned'}`);
    } catch (error) {
      toast.error("Failed to update assignment");
      console.error(error);
    }
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied to clipboard`);
    } catch (error) {
      toast.error("Failed to copy to clipboard");
    }
  };

  const quickStatusActions = [
    {
      label: "Re-open Order",
      icon: <RotateCcw className="h-4 w-4" />,
      action: handleReopen,
      show: order.status === "cancelled" || order.status === "completed",
      variant: "default" as const,
    },
    {
      label: "Mark Complete",
      icon: <CheckCircle2 className="h-4 w-4" />,
      action: () => setShowStatusDialog(true),
      show: order.status !== "completed" && order.status !== "cancelled",
      variant: "default" as const,
    },
    {
      label: "Put On Hold",
      icon: <Pause className="h-4 w-4" />,
      action: () => setShowStatusDialog(true),
      show: order.status === "in_progress",
      variant: "outline" as const,
    },
  ];

  const headerActions = [
    {
      label: "Back to Orders",
      href: "/orders",
      icon: <ArrowLeft className="h-4 w-4" />,
      variant: "outline" as const,
    },
    ...(order.status === "cancelled" || order.status === "completed"
      ? [
          {
            label: "Re-open Order",
            icon: <RotateCcw className="h-4 w-4" />,
            variant: "default" as const,
            onClick: handleReopen,
          },
        ]
      : []),
    {
      label: "Change Status",
      icon: <MoreHorizontal className="h-4 w-4" />,
      variant: "outline" as const,
      onClick: () => setShowStatusDialog(true),
    },
    {
      label: "Email Customer",
      icon: <Mail className="h-4 w-4" />,
      variant: "outline" as const,
      onClick: () => console.log("Email customer"),
    },
    {
      label: "Print Invoice",
      icon: <Printer className="h-4 w-4" />,
      variant: "outline" as const,
      onClick: () => console.log("Print invoice"),
    },
    {
      label: "Edit Order",
      href: `/orders/${orderId}/edit`,
      icon: <Edit className="h-4 w-4" />,
      variant:
        order.status === "cancelled" || order.status === "completed"
          ? ("outline" as const)
          : ("default" as const),
    },
  ];

  // Show skeleton during navigation or loading
  if (showSkeleton) {
    return <SkeletonOrderDetail />;
  }

  return (
    <PageContainer
      title={order.ticket_number}
      description="Repair Ticket Details"
      badge={<StatusBadge status={order.status as RepairStatus} />}
      actions={headerActions}
    >
      {/* Ticket Status Flow - Matching appointments page style */}
      <div className="mb-6">
        <Card className="border border-gray-200 dark:border-gray-700">
          <CardContent className="pt-6 pb-4">
            <div className="relative">
              {/* Progress line - matching appointments style */}
              <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200 dark:bg-gray-700">
                <div 
                  className="h-full bg-cyan-500 transition-all duration-500"
                  style={{
                    width: order.status === 'cancelled' ? '0%' : 
                           order.status === 'new' ? '0%' :
                           order.status === 'in_progress' ? '50%' :
                           order.status === 'completed' ? '100%' : '0%'
                  }}
                />
              </div>

              {/* Steps - matching appointments style */}
              <div className="relative flex justify-between">
                {[
                  { key: 'new', label: 'New', icon: Clock, description: 'Ticket created' },
                  { key: 'in_progress', label: 'In Progress', icon: Wrench, description: 'Being repaired' },
                  { key: 'completed', label: 'Completed', icon: CheckCircle2, description: 'Ready for pickup' }
                ].map((step, index) => {
                  const isActive = order.status === step.key;
                  const isPast = ['new', 'in_progress', 'completed'].indexOf(order.status) > 
                                ['new', 'in_progress', 'completed'].indexOf(step.key);
                  const isCompleted = isPast || (order.status === 'completed' && step.key === 'completed');
                  const Icon = step.icon;
                  
                  return (
                    <div key={step.key} className="flex flex-col items-center">
                      {/* Step circle - matching appointments style */}
                      <div className={cn(
                        "relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300",
                        isCompleted || isActive
                          ? "border-cyan-500 bg-cyan-500 text-white" 
                          : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-400 dark:text-gray-500",
                        isActive && "ring-4 ring-cyan-100 dark:ring-cyan-900/50 scale-110"
                      )}>
                        <Icon className="h-5 w-5" />
                      </div>

                      {/* Step label - matching appointments style */}
                      <div className="mt-2 text-center">
                        <p className={cn(
                          "text-sm font-medium",
                          isCompleted || isActive ? "text-gray-900 dark:text-gray-100" : "text-gray-500 dark:text-gray-400"
                        )}>
                          {step.label}
                        </p>
                        {step.description && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            {step.description}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Edge case indicator for cancelled status */}
              {order.status === 'cancelled' && (
                <div className="mt-4 p-3 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-center text-gray-600 dark:text-gray-400">
                    ❌ This ticket was cancelled
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Notification Banner - Converted from Appointment */}
      {appointmentData && appointmentData.id && (
        <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                <Calendar className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-green-900 dark:text-green-100">Converted from Appointment</p>
                <p className="text-xs text-green-700 dark:text-green-300 mt-0.5">
                  Appointment #{appointmentData.appointment_number} • 
                  Scheduled for {appointmentData.scheduled_date ? new Date(appointmentData.scheduled_date).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>
            <ButtonPremium
              onClick={() => router.push(`/appointments/${appointmentData.id}`)}
              variant="default"
              size="sm"
              className="bg-green-600 hover:bg-green-700 text-white border-green-600"
            >
              <Calendar className="h-4 w-4 mr-1.5" />
              View Appointment
            </ButtonPremium>
          </div>
        </div>
      )}

      {/* Key Metrics Row - Matching appointments page style */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 mb-6">
        {/* Total Time */}
        <div className="relative overflow-hidden group hover:-translate-y-0.5 transition-transform">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <MetricCard
            title="Time Logged"
            value={`${Math.floor(totalTimeMinutes / 60)}h ${totalTimeMinutes % 60}m`}
            subtitle={totalTimeMinutes > 0 ? 'Total work time' : 'No time logged yet'}
            icon={<Clock className="h-4 w-4" />}
            variant="primary"
          />
        </div>
        
        {/* Services */}
        <div className="relative overflow-hidden group hover:-translate-y-0.5 transition-transform">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <MetricCard
            title="Services"
            value={order.ticket_services?.length || '0'}
            subtitle={
              order.ticket_services?.length > 0 
                ? `${order.ticket_services.length} service${order.ticket_services.length !== 1 ? 's' : ''} selected`
                : 'No services added'
            }
            icon={<Wrench className="h-4 w-4" />}
            variant={order.ticket_services?.length > 0 ? "success" : "default"}
            badge={order.ticket_services?.length > 0 ? (
              <div className="flex gap-1 mt-2">
                {order.ticket_services
                  .slice(0, 2)
                  .map((ts: any) => (
                    <Badge key={ts.id} variant="secondary" className="text-[10px] px-1.5 py-0">
                      {ts.services?.name?.split(' ').slice(0, 2).join(' ')}
                    </Badge>
                  ))}
                {order.ticket_services.length > 2 && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                    +{order.ticket_services.length - 2}
                  </Badge>
                )}
              </div>
            ) : undefined}
          />
        </div>
        
        {/* Total Cost */}
        <div className="relative overflow-hidden group hover:-translate-y-0.5 transition-transform">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <MetricCard
            title="Total Cost"
            value={`$${(() => {
              // Calculate total from services if total_cost is not set
              if (order.ticket_services && order.ticket_services.length > 0) {
                const calculatedTotal = order.ticket_services.reduce((sum: number, ts: any) => {
                  const service = ts.service || ts.services;
                  const price = service?.base_price || ts.price || 0;
                  return sum + price;
                }, 0);
                return (calculatedTotal || order.total_cost || 0).toFixed(2);
              }
              return (order.total_cost || 0).toFixed(2);
            })()}`}
            subtitle={
              order.ticket_services?.length > 0 
                ? `${order.ticket_services.length} service${order.ticket_services.length !== 1 ? 's' : ''}`
                : 'No cost calculated'
            }
            icon={<DollarSign className="h-4 w-4" />}
            variant={order.ticket_services?.length > 0 ? "primary" : "default"}
          />
        </div>
        
        {/* Priority & Date */}
        <div className="relative overflow-hidden group hover:-translate-y-0.5 transition-transform">
          <div className={cn(
            "absolute inset-0 bg-gradient-to-br to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500",
            order.priority === "high" ? "from-red-500/5" : "from-blue-500/5"
          )} />
          <MetricCard
            title="Priority"
            value={order.priority?.charAt(0).toUpperCase() + order.priority?.slice(1) || 'Medium'}
            subtitle={
              order.created_at 
                ? format(new Date(order.created_at), 'MMM d, yyyy')
                : 'No date set'
            }
            icon={order.priority === "high" ? <AlertCircle className="h-4 w-4" /> : <Calendar className="h-4 w-4" />}
            variant={order.priority === "high" ? "destructive" : "default"}
          />
        </div>
      </div>


      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main Content - Left Side */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Appointment Details (if ticket was created from appointment) */}
          {appointmentData && appointmentData.notes && (
            <Card className="border border-gray-200 dark:border-gray-700">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <CardTitle className="text-sm font-semibold">
                    Appointment Notes
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <p className="text-sm text-muted-foreground">
                  {appointmentData.notes}
                </p>
                {appointmentData.issues && appointmentData.issues.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs text-muted-foreground mb-2">Reported Issues:</p>
                    <div className="flex flex-wrap gap-2">
                      {appointmentData.issues.map((issue: string, index: number) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {issue.replace(/_/g, " ")}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Device Information - Premium Design */}
          <DeviceDetailCard
            device={{
              id: order.device?.id || '',
              modelName: order.device?.model_name || `${order.device_brand} ${order.device_model}`,
              manufacturer: order.device?.manufacturer?.name || order.device_brand,
              imageUrl: order.device?.image_url,
              thumbnailUrl: order.device?.thumbnail_url,
              serialNumber: order.serial_number || matchingCustomerDevice?.serial_number || '',
              imei: order.imei || matchingCustomerDevice?.imei || '',
              color: matchingCustomerDevice?.color || '',
              storageSize: matchingCustomerDevice?.storage_size || '',
              condition: matchingCustomerDevice?.condition || 'good',
              issues: order.repair_issues || []
            }}
            isEditing={false}
            isLocked={true}
            isInProfile={!!matchingCustomerDevice}
            onDeviceChange={() => {}}
            onSave={() => {}}
            deviceNickname={matchingCustomerDevice?.nickname}
            showAddToProfile={!matchingCustomerDevice && (order.imei || order.serial_number)}
            onAddToProfile={() => setShowAddDeviceDialog(true)}
          />


          {/* Services Section - Premium Design */}
          <Card className="border border-gray-200 dark:border-gray-700">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wrench className="h-4 w-4 text-muted-foreground" />
                  <CardTitle className="text-sm font-semibold">
                    Services Applied
                  </CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              {order.ticket_services && order.ticket_services.length > 0 ? (
                <div className="space-y-2">
                  {order.ticket_services.map((ticketService: any) => {
                    // Handle both 'service' and 'services' field names
                    const service = ticketService.service || ticketService.services;
                    const price = service?.base_price || ticketService.price || 0;
                    const duration = service?.estimated_duration_minutes || ticketService.duration_minutes || 0;
                    
                    return (
                      <div key={ticketService.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                        <div>
                          <p className="text-sm font-medium">{service?.name || 'Unknown Service'}</p>
                          <p className="text-xs text-muted-foreground">
                            {service?.category?.replace(/_/g, ' ') || 'General'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold">
                            ${price.toFixed(2)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {duration} min
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div className="pt-2 mt-2 border-t">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Total</span>
                      <div className="text-right">
                        <p className="text-base font-bold text-primary">
                          ${(() => {
                            // Calculate total from services
                            const calculatedTotal = order.ticket_services.reduce((sum: number, ts: any) => {
                              const service = ts.service || ts.services;
                              const price = service?.base_price || ts.price || 0;
                              return sum + price;
                            }, 0);
                            // Use calculated total or fallback to order.total_cost
                            return (calculatedTotal || order.total_cost || 0).toFixed(2);
                          })()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {order.ticket_services.reduce((sum: number, ts: any) => {
                            const service = ts.service || ts.services;
                            const duration = service?.estimated_duration_minutes || ts.duration_minutes || 0;
                            return sum + duration;
                          }, 0)} min total
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Wrench className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground mb-3">No services added</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notes Section - Premium Design */}
          {order.ticket_notes && order.ticket_notes.length > 0 && (
            <Card className="border border-gray-200 dark:border-gray-700">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  <CardTitle className="text-sm font-semibold">
                    Technician Notes
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="space-y-3">
                  {order.ticket_notes.map((note: any) => (
                    <div
                      key={note.id}
                      className="p-3 rounded-lg bg-muted/30 border border-muted"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-foreground">
                          {note.user?.full_name || note.user?.email || "Unknown"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {note.created_at ? formatDate(note.created_at) : ''}
                        </span>
                      </div>
                      <p className="text-sm leading-relaxed">{note.content}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Time Entries Section */}
          <TimeEntriesSection 
            entries={order.time_entries || []} 
            totalMinutes={totalTimeMinutes}
            canDelete={isAdmin}
            onDelete={async (entryId: string) => {
              // Delete functionality can be implemented here
              console.log('Delete time entry:', entryId);
            }}
          />
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Timer Control */}
          <TimerControl
            ticketId={orderId}
            ticketNumber={order.ticket_number}
            customerName={order.customer_name || order.customers?.name}
            isDisabled={order.status === "completed" || order.status === "cancelled"}
            disabledReason={
              order.status === "completed" ? "Ticket is completed" :
              order.status === "cancelled" ? "Ticket is cancelled" : undefined
            }
          />

          {/* Assignee Card */}
          {isAdmin && (
            <AssigneeCard
              assignee={order.assigned_to ? {
                id: order.assigned_to,
                name: technicians.find(t => t.id === order.assigned_to)?.name || 'Unknown',
                email: technicians.find(t => t.id === order.assigned_to)?.email,
                role: technicians.find(t => t.id === order.assigned_to)?.role,
                // TODO: Add real stats from database
                stats: {
                  totalAppointments: 24,
                  completedToday: 3,
                  avgDuration: 45,
                  satisfactionRate: 98
                }
              } : null}
              technicians={technicians}
              isEditing={false}
              isLocked={order.status === 'completed' || order.status === 'cancelled'}
              onAssigneeChange={(techId) => handleAssignmentChange(techId || '')}
            />
          )}

          {/* Customer Information Card */}
          <CustomerInfoCard
            customer={{
              id: order.customer_id || '',
              name: order.customer_name || order.customers?.name || 'Unknown',
              email: order.customers?.email || '',
              phone: order.customer_phone || order.customers?.phone || '',
              previousAppointments: order.customerStats?.totalAppointments || order.customers?.total_appointments || 0,
              totalRepairs: order.customerStats?.totalRepairs || order.customers?.total_orders || 1, // At least 1 since this is a repair
              memberSince: order.customers?.created_at || '',
              notificationPreference: 'email',
              // Add ticket-specific context
              currentTicket: {
                number: order.ticket_number,
                status: order.status,
                device: `${order.device_brand} ${order.device_model}`
              }
            }}
            isEditing={false}
            isLocked={true}
            onCustomerChange={() => {}}
          />

          {/* Photos Section */}
          <TicketPhotosSidebar ticketId={orderId} />
        </div>
      </div>

      {/* Status Change Dialog */}
      <StatusChangeDialog
        isOpen={showStatusDialog}
        onClose={() => setShowStatusDialog(false)}
        currentStatus={order.status as RepairStatus}
        onConfirm={handleStatusChange}
        ticketId={orderId}
        ticketNumber={order.ticket_number}
        customerName={order.customer_name || order.customers?.name}
      />

      {/* Add Device to Profile Dialog */}
      {addDeviceToProfile && (
        <AddDeviceToProfileDialog
          open={showAddDeviceDialog}
          onOpenChange={setShowAddDeviceDialog}
          deviceName={`${
            order.device?.manufacturer?.name || order.device_brand
          } ${order.device?.model_name || order.device_model}`}
          currentSerial={order.serial_number}
          currentImei={order.imei}
          addDeviceToProfile={addDeviceToProfile}
          onSuccess={() => {
            toast.success('Device added to customer profile');
            router.refresh();
          }}
        />
      )}
    </PageContainer>
  );
}