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
      {/* Key Metrics Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {/* Total Time - Primary metric with cyan accent */}
        <div className="bg-white dark:bg-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <div className="p-1.5 rounded-md bg-primary/10">
              <Clock className="h-4 w-4 text-primary" />
            </div>
            <span className="text-2xl font-bold text-foreground">
              {Math.floor(totalTimeMinutes / 60)}h {totalTimeMinutes % 60}m
            </span>
          </div>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
            Total Time
          </p>
        </div>

        {/* Services - Neutral with subtle emphasis */}
        <div className="bg-white dark:bg-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="p-1.5 rounded-md bg-slate-100 dark:bg-slate-800">
              <Wrench className="h-4 w-4 text-slate-600 dark:text-slate-400" />
            </div>
            <span className="text-2xl font-bold text-foreground">
              {order.ticket_services?.length || 0}
            </span>
          </div>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
            Services
          </p>
        </div>

        {/* Notes - Neutral */}
        <div className="bg-white dark:bg-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="p-1.5 rounded-md bg-slate-100 dark:bg-slate-800">
              <FileText className="h-4 w-4 text-slate-600 dark:text-slate-400" />
            </div>
            <span className="text-2xl font-bold text-foreground">
              {order.ticket_notes?.length || 0}
            </span>
          </div>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
            Notes
          </p>
        </div>

        {/* Created Date - High priority gets red accent, otherwise neutral */}
        <div
          className={cn(
            "bg-white dark:bg-slate-900 rounded-lg p-4 border shadow-sm",
            order.priority === "high"
              ? "border-red-200 dark:border-red-900/50"
              : "border-slate-200 dark:border-slate-700"
          )}
        >
          <div className="flex items-center justify-between mb-2">
            <div
              className={cn(
                "p-1.5 rounded-md",
                order.priority === "high"
                  ? "bg-red-50 dark:bg-red-950/50"
                  : "bg-slate-100 dark:bg-slate-800"
              )}
            >
              {order.priority === "high" ? (
                <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
              ) : (
                <Calendar className="h-4 w-4 text-slate-600 dark:text-slate-400" />
              )}
            </div>
            <span className="text-sm font-bold text-foreground">
              {order.created_at ? new Date(order.created_at).toLocaleDateString() : 'N/A'}
            </span>
          </div>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
            Created
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content - Left Side */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Appointment Information (if ticket was created from appointment) */}
          {appointmentData && (
            <Card className="overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-slate-100 dark:bg-slate-800">
                    <Calendar className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                  </div>
                  <span className="text-foreground">
                    Created from Appointment
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Appointment Number
                    </p>
                    <p className="font-medium">
                      {appointmentData.appointment_number}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Scheduled Date & Time
                    </p>
                    <p className="font-medium">
                      {appointmentData.scheduled_date ? new Date(
                        appointmentData.scheduled_date
                      ).toLocaleDateString() : 'N/A'}{" "}
                      at {appointmentData.scheduled_time || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Source</p>
                    <Badge variant="outline">{appointmentData.source}</Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Priority</p>
                    <Badge
                      variant={
                        appointmentData.urgency === "emergency"
                          ? "destructive"
                          : "secondary"
                      }
                    >
                      {appointmentData.urgency}
                    </Badge>
                  </div>
                </div>

                {appointmentData.issues &&
                  appointmentData.issues.length > 0 && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">
                        Reported Issues
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {appointmentData.issues.map(
                          (issue: string, index: number) => (
                            <Badge key={index} variant="secondary">
                              {issue.replace(/_/g, " ")}
                            </Badge>
                          )
                        )}
                      </div>
                    </div>
                  )}

                {appointmentData.description && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Appointment Description
                    </p>
                    <p className="text-sm bg-muted/50 p-3 rounded-lg">
                      {appointmentData.description}
                    </p>
                  </div>
                )}

                {appointmentData.notes && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Appointment Notes
                    </p>
                    <p className="text-sm bg-slate-50 dark:bg-slate-800/50 p-3 rounded-md border border-slate-200 dark:border-slate-700">
                      {appointmentData.notes}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Device Information - Completely Redesigned */}
          <div className="relative">
            {/* Device Status Badge */}
            {matchingCustomerDevice ? (
              <div className="absolute -top-2 right-4 z-10">
                <div className="bg-green-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  IN PROFILE
                </div>
              </div>
            ) : (
              <div className="absolute -top-2 right-4 z-10">
                <div className="bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5" />
                  NOT SAVED
                </div>
              </div>
            )}

            <Card className="overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="p-6">
                {order.device ? (
                  <div className="flex gap-6">
                    {/* Device Image Section */}
                    <div className="flex-shrink-0">
                      {order.device.image_url ? (
                        <div className="relative">
                          <img
                            src={order.device.image_url}
                            alt={order.device.model_name}
                            className="w-32 h-32 object-cover rounded-2xl shadow-xl"
                          />
                          <div className="absolute -bottom-2 -right-2 bg-primary text-white rounded-full p-2 shadow-lg">
                            <Smartphone className="h-4 w-4" />
                          </div>
                        </div>
                      ) : (
                        <div className="w-32 h-32 rounded-2xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                          <Smartphone className="h-12 w-12 text-slate-400" />
                        </div>
                      )}
                    </div>

                    {/* Device Details Section */}
                    <div className="flex-1 space-y-4">
                      <div>
                        <div className="flex items-start justify-between mb-1">
                          <div>
                            <h3 className="text-2xl font-bold text-foreground">
                              {order.device.manufacturer?.name || order.device_brand}{" "}
                              {order.device.model_name || order.device_model}
                            </h3>
                            {matchingCustomerDevice?.nickname && (
                              <p className="text-sm text-primary font-medium mt-0.5">
                                "{matchingCustomerDevice.nickname}"
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Device Specs Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                          {order.device?.device_type && (
                            <div className="bg-white dark:bg-slate-800 rounded-lg p-2.5 border">
                              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">
                                Type
                              </p>
                              <p className="text-sm font-semibold">
                                {order.device.device_type}
                              </p>
                            </div>
                          )}
                          {matchingCustomerDevice?.color && (
                            <div className="bg-white dark:bg-slate-800 rounded-lg p-2.5 border">
                              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">
                                Color
                              </p>
                              <p className="text-sm font-semibold">
                                {matchingCustomerDevice.color}
                              </p>
                            </div>
                          )}
                          {matchingCustomerDevice?.storage_size && (
                            <div className="bg-white dark:bg-slate-800 rounded-lg p-2.5 border">
                              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">
                                Storage
                              </p>
                              <p className="text-sm font-semibold">
                                {matchingCustomerDevice.storage_size}
                              </p>
                            </div>
                          )}
                          {order.device?.release_year && (
                            <div className="bg-white dark:bg-slate-800 rounded-lg p-2.5 border">
                              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">
                                Year
                              </p>
                              <p className="text-sm font-semibold">
                                {order.device.release_year}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* IMEI/Serial Section */}
                      <div className="flex gap-3">
                        {(order.imei || matchingCustomerDevice?.imei) && (
                          <div className="flex-1 bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 border border-slate-200 dark:border-slate-700 relative group">
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 font-semibold">
                              IMEI
                            </p>
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-mono">
                                {order.imei || matchingCustomerDevice?.imei}
                              </p>
                              <button
                                onClick={() =>
                                  copyToClipboard(
                                    order.imei || matchingCustomerDevice?.imei || "",
                                    "IMEI"
                                  )
                                }
                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Copy className="h-3.5 w-3.5 text-slate-400 hover:text-slate-600" />
                              </button>
                            </div>
                          </div>
                        )}
                        {(order.serial_number || matchingCustomerDevice?.serial_number) && (
                          <div className="flex-1 bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 border border-slate-200 dark:border-slate-700 relative group">
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 font-semibold">
                              Serial Number
                            </p>
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-mono">
                                {order.serial_number || matchingCustomerDevice?.serial_number}
                              </p>
                              <button
                                onClick={() =>
                                  copyToClipboard(
                                    order.serial_number || matchingCustomerDevice?.serial_number || "",
                                    "Serial Number"
                                  )
                                }
                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Copy className="h-3.5 w-3.5 text-slate-400 hover:text-slate-600" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Add to Profile Button */}
                      {!matchingCustomerDevice && (order.imei || order.serial_number) && (
                        <Button
                          onClick={() => setShowAddDeviceDialog(true)}
                          className="w-full"
                          variant="outline"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Device to Customer Profile
                        </Button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Smartphone className="h-12 w-12 text-slate-400 mx-auto mb-3" />
                    <p className="text-muted-foreground">
                      Device: {order.device_brand} {order.device_model}
                    </p>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Repair Issues */}
          <Card className="overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-slate-100 dark:bg-slate-800">
                  <AlertCircle className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                </div>
                <span className="text-foreground">Repair Issues</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {order.repair_issues && order.repair_issues.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {order.repair_issues.map((issue: string, index: number) => (
                    <Badge key={index} variant="secondary">
                      {issue.replace(/_/g, " ")}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No issues reported
                </p>
              )}
            </CardContent>
          </Card>

          {/* Services Section */}
          {order.ticket_services && order.ticket_services.length > 0 && (
            <Card className="overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-slate-100 dark:bg-slate-800">
                    <Wrench className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                  </div>
                  <span className="text-foreground">Services</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {order.ticket_services.map((service: any) => (
                    <div
                      key={service.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700"
                    >
                      <div>
                        <p className="font-medium">{service.service?.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {service.service?.category?.replace(/_/g, " ")}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">
                          ${service.service?.base_price?.toFixed(2)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {service.service?.estimated_duration_minutes} min
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notes Section */}
          {order.ticket_notes && order.ticket_notes.length > 0 && (
            <Card className="overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-slate-100 dark:bg-slate-800">
                    <MessageSquare className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                  </div>
                  <span className="text-foreground">Notes</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {order.ticket_notes.map((note: any) => (
                    <div
                      key={note.id}
                      className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">
                          {note.user?.full_name || note.user?.email || "Unknown"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {note.created_at ? formatDate(note.created_at) : ''}
                        </span>
                      </div>
                      <p className="text-sm">{note.content}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Time Entries Section */}
          <TimeEntriesSection 
            entries={order.time_entries || []} 
            ticketId={orderId}
            isAdmin={isAdmin}
          />
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Timer Control */}
          <TimerControl
            ticketId={orderId}
            isRunning={order.timer_is_running || false}
            startedAt={order.timer_started_at}
            totalMinutes={totalTimeMinutes}
            canControl={
              order.status !== "completed" && order.status !== "cancelled"
            }
            onClearTimer={
              isAdmin
                ? async () => {
                    if (confirm("Are you sure you want to clear the timer?")) {
                      clearTimerMutation.mutate(orderId);
                    }
                  }
                : undefined
            }
          />

          {/* Assignment & Status Controls */}
          {isAdmin && (
            <Card className="overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm">
              <CardHeader>
                <CardTitle className="text-sm font-medium">
                  Assignment & Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">
                    Assigned To
                  </Label>
                  <Select value={assignedTechId || "unassigned"} onValueChange={(value) => handleAssignmentChange(value === "unassigned" ? "" : value)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Unassigned" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {technicians.map((tech) => (
                        <SelectItem key={tech.id} value={tech.id}>
                          {tech.name} ({tech.role})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex flex-col gap-2">
                  {quickStatusActions
                    .filter((action) => action.show)
                    .map((action, index) => (
                      <Button
                        key={index}
                        onClick={action.action}
                        variant={action.variant}
                        className="w-full justify-start"
                      >
                        {action.icon}
                        <span className="ml-2">{action.label}</span>
                      </Button>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Customer Information */}
          <Card className="overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-slate-100 dark:bg-slate-800">
                  <User className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                </div>
                <span className="text-foreground">Customer</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="font-medium">
                  {order.customer_name || order.customers?.name || "Unknown"}
                </p>
              </div>
              {order.customer_phone && (
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <p className="font-medium">{order.customer_phone}</p>
                  </div>
                </div>
              )}
              {order.customers?.email && (
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <p className="font-medium text-sm truncate">
                      {order.customers.email}
                    </p>
                  </div>
                </div>
              )}
              {order.customer_id && (
                <Link
                  href={`/customers/${order.customer_id}`}
                  className="inline-flex items-center text-sm text-primary hover:text-primary/90 font-medium"
                >
                  View Profile →
                </Link>
              )}
            </CardContent>
          </Card>

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