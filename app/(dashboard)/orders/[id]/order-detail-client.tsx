"use client";

import { useState } from "react";
import { toast } from "sonner";
import { StatusBadge, RepairStatus } from "@/components/orders/status-badge";
import { TimerControl } from "@/components/orders/timer-control";
import { StatusChangeDialog } from "@/components/orders/status-change-dialog";
import { TimeEntriesSection } from "@/components/orders/time-entries-section";
import { TicketPhotosSidebar } from "@/components/orders/ticket-photos-sidebar";
import { AddDeviceToProfileDialog } from "@/components/orders/add-device-to-profile-dialog";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface OrderDetailClientProps {
  order: any;
  orderId: string;
  totalTimeMinutes: number;
  isAdmin?: boolean;
  currentUserId?: string;
  matchingCustomerDevice?: any;
  appointmentData?: any;
  addDeviceToProfile: (data: {
    serial_number?: string;
    imei?: string;
    color?: string;
    storage_size?: string;
  }) => Promise<{ success: boolean; error?: string }>;
}

export function OrderDetailClient({
  order,
  orderId,
  totalTimeMinutes,
  isAdmin = false,
  currentUserId = "",
  matchingCustomerDevice,
  appointmentData,
  addDeviceToProfile,
}: OrderDetailClientProps) {
  const router = useRouter();
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [deletingEntryId, setDeletingEntryId] = useState<string | null>(null);
  const [showAddDeviceDialog, setShowAddDeviceDialog] = useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const handleStatusChange = (newStatus: any, reason?: string) => {
    // Refresh the page to show updated status
    router.refresh();
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
      router.refresh();
    } catch (error) {
      toast.error("Failed to reopen order");
      console.error("Error reopening order:", error);
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

  return (
    <PageContainer
      title={order.ticket_number}
      description="Repair Ticket Details"
      actions={headerActions}
    >
      <div className="flex items-center gap-2 mb-4">
        <StatusBadge status={order.status as RepairStatus} />
      </div>
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
              {new Date(order.created_at).toLocaleDateString()}
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
                      {new Date(
                        appointmentData.scheduled_date
                      ).toLocaleDateString()}{" "}
                      at {appointmentData.scheduled_time}
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
                <div className="bg-slate-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  IN PROFILE
                </div>
              </div>
            ) : (
              <div className="absolute -top-2 right-4 z-10">
                <div className="bg-slate-400 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5" />
                  NOT SAVED
                </div>
              </div>
            )}

            <Card className="overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="p-6">
                {order.device && (
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
                              {order.device.manufacturer?.name}{" "}
                              {order.device.model_name}
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
                          {order.device.device_type && (
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
                          {order.device.release_year && (
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
                              <Button
                                variant="ghost"
                                size="sm"
                                className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0 text-muted-foreground hover:bg-slate-100 dark:hover:bg-slate-800"
                                onClick={() =>
                                  copyToClipboard(
                                    order.imei ||
                                      matchingCustomerDevice?.imei ||
                                      "",
                                    "IMEI"
                                  )
                                }
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        )}
                        {(order.serial_number ||
                          matchingCustomerDevice?.serial_number) && (
                          <div className="flex-1 bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 border border-slate-200 dark:border-slate-700 relative group">
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 font-semibold">
                              Serial Number
                            </p>
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-mono">
                                {order.serial_number ||
                                  matchingCustomerDevice?.serial_number}
                              </p>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0 text-muted-foreground hover:bg-slate-100 dark:hover:bg-slate-800"
                                onClick={() =>
                                  copyToClipboard(
                                    order.serial_number ||
                                      matchingCustomerDevice?.serial_number ||
                                      "",
                                    "Serial Number"
                                  )
                                }
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Parts Availability */}
                      {order.device.parts_availability && (
                        <div
                          className={cn(
                            "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium",
                            order.device.parts_availability === "available"
                              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                              : order.device.parts_availability === "limited"
                              ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                              : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                          )}
                        >
                          <div
                            className={cn(
                              "h-2 w-2 rounded-full",
                              order.device.parts_availability === "available"
                                ? "bg-green-500"
                                : order.device.parts_availability === "limited"
                                ? "bg-amber-500"
                                : "bg-red-500"
                            )}
                          />
                          Parts{" "}
                          {order.device.parts_availability.replace("_", " ")}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* No Device State */}
                {!order.device && (
                  <div className="text-center py-12">
                    <Package2 className="h-16 w-16 text-muted-foreground/40 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">
                      No Device Information
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">
                      This ticket doesn't have device information associated
                      with it yet. Edit the ticket to add device details.
                    </p>
                    <Button variant="outline" asChild>
                      <Link
                        href={`/orders/${orderId}/edit`}
                        className="inline-flex items-center gap-2"
                      >
                        <Edit3 className="h-4 w-4" />
                        Edit Ticket
                      </Link>
                    </Button>
                  </div>
                )}

                {/* Action Button */}
                {!matchingCustomerDevice &&
                  order.customer_id &&
                  order.device_id && (
                    <div className="mt-4 pt-4 border-t">
                      <Button
                        onClick={() => setShowAddDeviceDialog(true)}
                        className="w-full bg-primary hover:bg-primary/90"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Save Device to Customer Profile
                      </Button>
                    </div>
                  )}
              </div>
            </Card>
          </div>

          {/* Services - Clean Professional Design */}
          {order.ticket_services && order.ticket_services.length > 0 && (
            <Card className="overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm">
              <CardHeader className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                <CardTitle className="flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-slate-100 dark:bg-slate-800">
                    <Wrench className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                  </div>
                  Repair Services
                  <Badge variant="secondary" className="ml-auto">
                    {order.ticket_services.length} item
                    {order.ticket_services.length > 1 ? "s" : ""}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-3">
                  {order.ticket_services.map((ts: any, index: number) => (
                    <div
                      key={ts.id}
                      className="group relative p-4 bg-slate-50 dark:bg-slate-800/50 rounded-md border border-slate-200 dark:border-slate-700 hover:shadow-sm transition-all"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex gap-3 flex-1">
                          <div className="flex-shrink-0">
                            <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-700 dark:text-slate-300">
                              {index + 1}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-base mb-1.5">
                              {ts.service?.name}
                            </h4>

                            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mb-2">
                              {ts.service?.category && (
                                <span className="capitalize">
                                  {ts.service.category.replace("_", " ")}
                                </span>
                              )}
                              {ts.service?.estimated_minutes && (
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {ts.service.estimated_minutes} min
                                </span>
                              )}
                              {ts.quantity > 1 && (
                                <Badge variant="secondary" className="text-xs">
                                  Qty: {ts.quantity}
                                </Badge>
                              )}
                            </div>

                            {ts.technician_notes && (
                              <div className="mt-2 p-2 bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-800/50 rounded text-sm">
                                <span className="font-medium text-amber-700 dark:text-amber-400">
                                  Note:
                                </span>{" "}
                                {ts.technician_notes}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="text-lg font-bold text-foreground">
                            $
                            {(
                              ts.unit_price ||
                              ts.service?.base_price ||
                              0
                            ).toFixed(2)}
                          </p>
                          {ts.quantity > 1 && (
                            <p className="text-xs text-muted-foreground">
                              per unit
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Summary Footer */}
                  <div className="pt-3 mt-3 border-t flex justify-between items-center">
                    <div className="text-sm text-muted-foreground">
                      <span>
                        {order.ticket_services.length} service
                        {order.ticket_services.length > 1 ? "s" : ""}
                      </span>
                      {order.ticket_services.some(
                        (ts: any) => ts.service?.estimated_minutes
                      ) && (
                        <span className="ml-3">
                          • Est.{" "}
                          {order.ticket_services.reduce(
                            (sum: number, ts: any) =>
                              sum +
                              (ts.service?.estimated_minutes || 0) *
                                (ts.quantity || 1),
                            0
                          )}{" "}
                          minutes
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">
                        Total Amount
                      </p>
                      <p className="text-xl font-bold">
                        $
                        {order.ticket_services
                          .reduce(
                            (sum: number, ts: any) =>
                              sum +
                              (ts.unit_price || ts.service?.base_price || 0) *
                                (ts.quantity || 1),
                            0
                          )
                          .toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Repair Information - Clean Professional Design */}
          <Card className="overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm">
            <CardHeader className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
              <CardTitle className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-slate-100 dark:bg-slate-800">
                  <AlertCircle className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                </div>
                Repair Details
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-4">
                {/* Issues Section */}
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    Reported Issues
                  </h4>
                  {order.repair_issues && order.repair_issues.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {order.repair_issues.map(
                        (issue: string, index: number) => (
                          <div
                            key={index}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-md text-sm font-medium border border-slate-200 dark:border-slate-700"
                          >
                            <div className="h-1.5 w-1.5 rounded-full bg-slate-500" />
                            {issue}
                          </div>
                        )
                      )}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground italic p-3 bg-slate-50 dark:bg-slate-900/30 rounded-lg border border-dashed">
                      No specific issues reported
                    </div>
                  )}
                </div>

                {/* Description Section */}
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    Problem Description
                  </h4>
                  {order.description ? (
                    <div className="p-4 bg-slate-50 dark:bg-slate-900/30 rounded-lg border">
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">
                        {order.description}
                      </p>
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground italic p-3 bg-slate-50 dark:bg-slate-900/30 rounded-lg border border-dashed">
                      No description provided
                    </div>
                  )}
                </div>

                {/* Additional Info if needed */}
                {order.priority && (
                  <div className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200/50 dark:border-amber-800/50">
                    <span className="text-sm font-medium text-amber-700 dark:text-amber-400">
                      Priority Level
                    </span>
                    <Badge
                      variant={
                        order.priority === "high"
                          ? "destructive"
                          : order.priority === "medium"
                          ? "default"
                          : "secondary"
                      }
                    >
                      {order.priority}
                    </Badge>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Time Entries Section - Clean Professional Design */}
          <Card className="overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm">
            <CardHeader className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-slate-100 dark:bg-slate-800">
                    <Timer className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                  </div>
                  Time Entries
                </CardTitle>
                {totalTimeMinutes > 0 && (
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">
                      Total
                    </p>
                    <p className="text-lg font-bold text-primary">
                      {Math.floor(totalTimeMinutes / 60)}h{" "}
                      {totalTimeMinutes % 60}m
                    </p>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <TimeEntriesSection
                entries={order.time_entries || []}
                totalMinutes={totalTimeMinutes}
                canDelete={isAdmin}
                onDelete={async (entryId) => {
                  setDeletingEntryId(entryId);
                  try {
                    const response = await fetch(
                      `/api/time-entries/${entryId}`,
                      {
                        method: "DELETE",
                      }
                    );

                    if (!response.ok) {
                      throw new Error("Failed to delete time entry");
                    }

                    toast.success("Time entry deleted successfully", {
                      className: "bg-green-500 text-white border-green-600",
                    });
                    router.refresh();
                  } catch (error) {
                    console.error("Failed to delete time entry:", error);
                    toast.error("Failed to delete time entry", {
                      className: "bg-red-500 text-white border-red-600",
                    });
                  } finally {
                    setDeletingEntryId(null);
                  }
                }}
              />
            </CardContent>
          </Card>

          {/* Notes Section - Clean Professional Design */}
          <Card className="overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm">
            <CardHeader className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-slate-100 dark:bg-slate-800">
                    <FileText className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                  </div>
                  Notes & Comments
                </CardTitle>
                {order.ticket_notes?.length > 0 && (
                  <Badge variant="secondary">
                    {order.ticket_notes.length} note
                    {order.ticket_notes.length > 1 ? "s" : ""}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              {order.ticket_notes?.length > 0 ? (
                <div className="space-y-3">
                  {order.ticket_notes.map((note: any, index: number) => (
                    <div
                      key={note.id}
                      className={cn(
                        "relative p-4 rounded-lg border transition-all",
                        note.is_important
                          ? "border-amber-400 bg-amber-50/50 dark:bg-amber-950/20"
                          : "border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900/30"
                      )}
                    >
                      {note.is_important && (
                        <div className="absolute -top-2 -right-2 h-6 w-6 bg-amber-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-bold">
                            !
                          </span>
                        </div>
                      )}
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                              {index + 1}
                            </span>
                          </div>
                          <Badge
                            variant={
                              note.note_type === "internal"
                                ? "default"
                                : "outline"
                            }
                            className="text-xs"
                          >
                            {note.note_type}
                          </Badge>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(note.created_at).toLocaleDateString()} •{" "}
                          {new Date(note.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <p className="text-sm leading-relaxed mt-3">
                        {note.content}
                      </p>
                      <div className="flex items-center gap-1.5 mt-3">
                        <User className="h-3 w-3 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">
                          {note.users?.email || "System"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
                  <p className="text-sm font-medium">No notes yet</p>
                  <p className="text-xs mt-1">
                    Notes and comments will appear here
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Right Side */}
        <div className="space-y-6">
          {/* Timer Control - Clean Professional Design */}
          <TimerControl
            ticketId={orderId}
            ticketNumber={order.ticket_number}
            customerName={order.customers?.name}
            isDisabled={
              order.status === "cancelled" || order.status === "completed"
            }
            disabledReason={
              order.status === "cancelled"
                ? "Order has been cancelled"
                : order.status === "completed"
                ? "Order has been completed"
                : undefined
            }
            className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm"
          />

          {/* Customer Information - Clean Professional Widget */}
          <Card className="overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm">
            <CardHeader className="bg-slate-50 dark:bg-slate-800/50 pb-4 border-b border-slate-200 dark:border-slate-700">
              <CardTitle className="text-sm font-semibold flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-slate-100 dark:bg-slate-800">
                    <User className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                  </div>
                  Customer
                </div>
                {order.customers?.id && (
                  <Link href={`/customers/${order.customers.id}`}>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2 text-xs hover:bg-slate-200 dark:hover:bg-slate-700"
                    >
                      View →
                    </Button>
                  </Link>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        {order.customers?.name?.[0]?.toUpperCase() || "?"}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">
                      {order.customers?.name || "Unknown Customer"}
                    </p>
                    <div className="space-y-1 mt-1">
                      <a
                        href={`mailto:${order.customers?.email}`}
                        className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors"
                      >
                        <Mail className="h-3 w-3" />
                        <span className="truncate">
                          {order.customers?.email || "No email"}
                        </span>
                      </a>
                      <a
                        href={`tel:${order.customers?.phone}`}
                        className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors"
                      >
                        <Phone className="h-3 w-3" />
                        {order.customers?.phone || "No phone"}
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-3 flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 h-8 text-xs"
                >
                  <Phone className="h-3 w-3 mr-1" />
                  Call
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 h-8 text-xs"
                >
                  <Mail className="h-3 w-3 mr-1" />
                  Email
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Ticket Timeline - Clean Professional Widget */}
          <Card className="overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm">
            <CardHeader className="bg-slate-50 dark:bg-slate-800/50 pb-4 border-b border-slate-200 dark:border-slate-700">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-slate-100 dark:bg-slate-800">
                  <Clock className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                </div>
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="relative">
                {/* Timeline Line */}
                <div className="absolute left-4 top-8 bottom-8 w-0.5 bg-gradient-to-b from-slate-200 via-slate-200 to-transparent dark:from-slate-700 dark:via-slate-700" />

                {/* Timeline Items */}
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="relative z-10">
                      <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-primary flex items-center justify-center">
                        <div className="h-3 w-3 rounded-full bg-primary" />
                      </div>
                    </div>
                    <div className="flex-1 pb-4">
                      <p className="text-xs font-medium text-primary">
                        Created
                      </p>
                      <p className="text-sm font-semibold">
                        {new Date(order.created_at).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(order.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="relative z-10">
                      <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 flex items-center justify-center">
                        <div className="h-3 w-3 rounded-full bg-slate-500" />
                      </div>
                    </div>
                    <div className="flex-1 pb-4">
                      <p className="text-xs font-medium text-muted-foreground">
                        Last Updated
                      </p>
                      <p className="text-sm font-semibold">
                        {new Date(order.updated_at).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(order.updated_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="relative z-10">
                      <div
                        className={cn(
                          "h-8 w-8 rounded-full flex items-center justify-center",
                          order.status === "completed"
                            ? "bg-green-100 dark:bg-green-900/30"
                            : order.status === "in_progress"
                            ? "bg-blue-100 dark:bg-blue-900/30"
                            : order.status === "cancelled"
                            ? "bg-red-100 dark:bg-red-900/30"
                            : order.status === "on_hold"
                            ? "bg-yellow-100 dark:bg-yellow-900/30"
                            : "bg-slate-100 dark:bg-slate-900/30"
                        )}
                      >
                        <div
                          className={cn(
                            "h-3 w-3 rounded-full",
                            order.status === "completed"
                              ? "bg-green-500"
                              : order.status === "in_progress"
                              ? "bg-blue-500"
                              : order.status === "cancelled"
                              ? "bg-red-500"
                              : order.status === "on_hold"
                              ? "bg-yellow-500"
                              : "bg-slate-500"
                          )}
                        />
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-medium text-muted-foreground">
                        Current Status
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <StatusBadge status={order.status as RepairStatus} />
                      </div>
                      {totalTimeMinutes > 0 && (
                        <div className="mt-2 p-2 bg-slate-50 dark:bg-slate-900/30 rounded-lg">
                          <p className="text-xs text-muted-foreground">
                            Total Time Logged
                          </p>
                          <p className="text-sm font-bold text-primary">
                            {Math.floor(totalTimeMinutes / 60)}h{" "}
                            {totalTimeMinutes % 60}m
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Photos & Documentation */}
          <TicketPhotosSidebar
            ticketId={orderId}
            ticketNumber={order.ticket_number}
            userId={currentUserId}
            ticketServices={order.ticket_services || []}
          />

          {/* Additional Actions */}
          <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm">
            <CardHeader className="pb-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-slate-100 dark:bg-slate-800">
                  <MoreHorizontal className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                </div>
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full" variant="outline">
                <Phone className="mr-2 h-4 w-4" />
                Call Customer
              </Button>
              <Button className="w-full" variant="outline">
                <FileText className="mr-2 h-4 w-4" />
                Add Note
              </Button>

              {/* Quick Status Actions */}
              {quickStatusActions.map(
                (action, index) =>
                  action.show && (
                    <Button
                      key={index}
                      className="w-full"
                      variant={action.variant}
                      onClick={action.action}
                    >
                      {action.icon}
                      {action.label}
                    </Button>
                  )
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Status Change Dialog */}
      <StatusChangeDialog
        isOpen={showStatusDialog}
        onClose={() => setShowStatusDialog(false)}
        onConfirm={handleStatusChange}
        currentStatus={order.status}
        ticketId={orderId}
        ticketNumber={order.ticket_number}
        customerName={order.customers?.name}
      />

      {/* Add Device to Profile Dialog */}
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
          router.refresh();
        }}
      />
    </PageContainer>
  );
}
