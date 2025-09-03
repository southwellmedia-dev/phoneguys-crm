"use client";

import { useState } from "react";
import { toast } from "sonner";
import { StatusBadge, RepairStatus } from "@/components/orders/status-badge";
import { TimerControl } from "@/components/orders/timer-control";
import { StatusChangeDialog } from "@/components/orders/status-change-dialog";
import { TimeEntriesSection } from "@/components/orders/time-entries-section";
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

interface OrderDetailClientProps {
  order: any;
  orderId: string;
  totalTimeMinutes: number;
  isAdmin?: boolean;
}

export function OrderDetailClient({ order, orderId, totalTimeMinutes, isAdmin = false }: OrderDetailClientProps) {
  const router = useRouter();
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [deletingEntryId, setDeletingEntryId] = useState<string | null>(null);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const handleStatusChange = (newStatus: any, reason?: string) => {
    // Refresh the page to show updated status
    router.refresh();
  };


  const quickStatusActions = [
    {
      label: "Mark Complete",
      icon: <CheckCircle2 className="h-4 w-4" />,
      action: () => setShowStatusDialog(true),
      show: order.status !== 'completed',
      variant: "default" as const,
    },
    {
      label: "Put On Hold",
      icon: <Pause className="h-4 w-4" />,
      action: () => setShowStatusDialog(true),
      show: order.status === 'in_progress',
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
      variant: "default" as const,
    },
  ];

  return (
    <PageContainer
      title={order.ticket_number}
      description={
        <div className="flex items-center gap-2">
          <span>Repair Order Details</span>
          <StatusBadge status={order.status as RepairStatus} />
        </div>
      }
      actions={headerActions}
    >
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content - Left Side */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium">
                    {order.customers?.name || "Unknown Customer"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    {order.customers?.email || "No email"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    {order.customers?.phone || "No phone"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Device Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                Device Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Brand</p>
                  <p className="font-medium">{order.device_brand}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Model</p>
                  <p className="font-medium">{order.device_model}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Serial Number</p>
                  <p className="font-medium font-mono">
                    {order.serial_number || "Not provided"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">IMEI</p>
                  <p className="font-medium font-mono">
                    {order.imei || "Not provided"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Repair Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Repair Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Issues</p>
                <div className="flex flex-wrap gap-2">
                  {order.repair_issues?.map((issue: string, index: number) => (
                    <Badge key={index} variant="secondary">
                      {issue}
                    </Badge>
                  )) || <span className="text-muted-foreground">No issues listed</span>}
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">Description</p>
                <p className="whitespace-pre-wrap">
                  {order.description || "No description provided"}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Time Entries Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Timer className="h-5 w-5" />
                Time Entries
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TimeEntriesSection 
                entries={order.time_entries || []} 
                totalMinutes={totalTimeMinutes}
                canDelete={isAdmin}
                onDelete={async (entryId) => {
                  setDeletingEntryId(entryId);
                  try {
                    const response = await fetch(`/api/time-entries/${entryId}`, {
                      method: 'DELETE',
                    });
                    
                    if (!response.ok) {
                      throw new Error('Failed to delete time entry');
                    }
                    
                    toast.success("Time entry deleted successfully", {
                      className: "bg-green-500 text-white border-green-600",
                    });
                    router.refresh();
                  } catch (error) {
                    console.error('Failed to delete time entry:', error);
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

          {/* Notes Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {order.ticket_notes?.length > 0 ? (
                <div className="space-y-4">
                  {order.ticket_notes.map((note: any) => (
                    <div
                      key={note.id}
                      className={`p-4 rounded-lg border ${
                        note.is_important
                          ? "border-yellow-500 bg-yellow-500/10"
                          : "bg-muted/50"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{note.note_type}</Badge>
                          {note.is_important && (
                            <Badge variant="destructive">Important</Badge>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(note.created_at)}
                        </span>
                      </div>
                      <p className="text-sm">{note.content}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        by {note.users?.email || "System"}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No notes yet</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Right Side */}
        <div className="space-y-6">
          {/* Timer Control */}
          <TimerControl
            ticketId={orderId}
            ticketNumber={order.ticket_number}
            customerName={order.customers?.name}
          />

          {/* Order Details */}
          <Card>
            <CardHeader>
              <CardTitle>Order Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Created
                </span>
                <span className="text-sm font-medium">
                  {formatDate(order.created_at)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Updated
                </span>
                <span className="text-sm font-medium">
                  {formatDate(order.updated_at)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <StatusBadge status={order.status as RepairStatus} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Time</span>
                <span className="text-sm font-medium">
                  {Math.floor(totalTimeMinutes / 60)}h {totalTimeMinutes % 60}m
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Additional Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Actions</CardTitle>
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
              {quickStatusActions.map((action, index) => (
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
              ))}
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
    </PageContainer>
  );
}