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
  currentUserId = '',
  matchingCustomerDevice,
  appointmentData,
  addDeviceToProfile
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
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: 'in_progress',
          reason: 'Order reopened'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to reopen order');
      }

      toast.success('Order reopened successfully');
      router.refresh();
    } catch (error) {
      toast.error('Failed to reopen order');
      console.error('Error reopening order:', error);
    }
  };


  const quickStatusActions = [
    {
      label: "Re-open Order",
      icon: <RotateCcw className="h-4 w-4" />,
      action: handleReopen,
      show: order.status === 'cancelled' || order.status === 'completed',
      variant: "default" as const,
    },
    {
      label: "Mark Complete",
      icon: <CheckCircle2 className="h-4 w-4" />,
      action: () => setShowStatusDialog(true),
      show: order.status !== 'completed' && order.status !== 'cancelled',
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
    ...(order.status === 'cancelled' || order.status === 'completed' ? [
      {
        label: "Re-open Order",
        icon: <RotateCcw className="h-4 w-4" />,
        variant: "default" as const,
        onClick: handleReopen,
      }
    ] : []),
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
      variant: order.status === 'cancelled' || order.status === 'completed' ? "outline" as const : "default" as const,
    },
  ];

  return (
    <PageContainer
      title={order.ticket_number}
      description={
        <div className="flex items-center gap-2">
          <span>Repair Ticket Details</span>
          <StatusBadge status={order.status as RepairStatus} />
        </div>
      }
      actions={headerActions}
    >
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content - Left Side */}
        <div className="lg:col-span-2 space-y-6">
          {/* Appointment Information (if ticket was created from appointment) */}
          {appointmentData && (
            <Card className="border-blue-200 dark:border-blue-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                  <Calendar className="h-5 w-5" />
                  Created from Appointment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Appointment Number</p>
                    <p className="font-medium">{appointmentData.appointment_number}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Scheduled Date & Time</p>
                    <p className="font-medium">
                      {new Date(appointmentData.scheduled_date).toLocaleDateString()} at {appointmentData.scheduled_time}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Source</p>
                    <Badge variant="outline">{appointmentData.source}</Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Priority</p>
                    <Badge variant={appointmentData.urgency === 'emergency' ? 'destructive' : 'secondary'}>
                      {appointmentData.urgency}
                    </Badge>
                  </div>
                </div>
                
                {appointmentData.issues && appointmentData.issues.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Reported Issues</p>
                    <div className="flex flex-wrap gap-2">
                      {appointmentData.issues.map((issue: string, index: number) => (
                        <Badge key={index} variant="secondary">
                          {issue.replace(/_/g, ' ')}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {appointmentData.description && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Appointment Description</p>
                    <p className="text-sm bg-muted/50 p-3 rounded-lg">{appointmentData.description}</p>
                  </div>
                )}
                
                {appointmentData.notes && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Appointment Notes</p>
                    <p className="text-sm bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg">{appointmentData.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Device Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5" />
                  Device Information
                </div>
                <div className="flex items-center gap-2">
                  {matchingCustomerDevice ? (
                    <Badge variant="default" className="bg-green-500">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      In Profile
                    </Badge>
                  ) : (
                    <>
                      <Badge variant="secondary">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Not in Profile
                      </Badge>
                      {order.customer_id && order.device_id && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setShowAddDeviceDialog(true)}
                        >
                          Add to Profile
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Device Header with Image */}
              <div className="space-y-4">
                {order.device && (
                  <div className="flex items-start gap-4">
                    {order.device.image_url && (
                      <img 
                        src={order.device.image_url} 
                        alt={order.device.model_name}
                        className="w-24 h-24 object-cover rounded-lg border"
                      />
                    )}
                    <div className="flex-1">
                      <div className="mb-3">
                        <h3 className="text-lg font-semibold">
                          {order.device.manufacturer?.name} {order.device.model_name}
                        </h3>
                        {matchingCustomerDevice?.nickname && (
                          <p className="text-sm text-muted-foreground italic">
                            "{matchingCustomerDevice.nickname}"
                          </p>
                        )}
                      </div>
                      
                      {/* Quick Info Pills */}
                      <div className="flex flex-wrap gap-2 mb-3">
                        {order.device.device_type && (
                          <Badge variant="outline" className="text-xs">
                            {order.device.device_type}
                          </Badge>
                        )}
                        {order.device.release_year && (
                          <Badge variant="outline" className="text-xs">
                            Released {order.device.release_year}
                          </Badge>
                        )}
                        {matchingCustomerDevice?.color && (
                          <Badge variant="outline" className="text-xs">
                            {matchingCustomerDevice.color}
                          </Badge>
                        )}
                        {matchingCustomerDevice?.storage_size && (
                          <Badge variant="outline" className="text-xs">
                            {matchingCustomerDevice.storage_size}
                          </Badge>
                        )}
                        {order.device.parts_availability && (
                          <Badge 
                            variant={order.device.parts_availability === 'available' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            Parts: {order.device.parts_availability.replace('_', ' ')}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Detailed Information Section */}
                <div className="border-t pt-4">
                  <h4 className="text-sm font-semibold mb-3 text-muted-foreground">Device Details</h4>
                  <div className="grid gap-4 md:grid-cols-2">
                    {/* Identifiers */}
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Serial Number</p>
                        <p className="font-medium font-mono text-sm">
                          {order.serial_number || matchingCustomerDevice?.serial_number || (
                            <span className="text-muted-foreground italic">Not provided</span>
                          )}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">IMEI</p>
                        <p className="font-medium font-mono text-sm">
                          {order.imei || matchingCustomerDevice?.imei || (
                            <span className="text-muted-foreground italic">Not provided</span>
                          )}
                        </p>
                      </div>
                      {order.device?.model_number && (
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wider">Model Number</p>
                          <p className="font-medium text-sm">{order.device.model_number}</p>
                        </div>
                      )}
                    </div>

                    {/* Customer Device Info */}
                    <div className="space-y-3">
                      {matchingCustomerDevice ? (
                        <>
                          {matchingCustomerDevice.condition && (
                            <div>
                              <p className="text-xs text-muted-foreground uppercase tracking-wider">Condition</p>
                              <p className="font-medium text-sm capitalize">{matchingCustomerDevice.condition}</p>
                            </div>
                          )}
                          {matchingCustomerDevice.purchase_date && (
                            <div>
                              <p className="text-xs text-muted-foreground uppercase tracking-wider">Purchase Date</p>
                              <p className="font-medium text-sm">
                                {new Date(matchingCustomerDevice.purchase_date).toLocaleDateString()}
                              </p>
                            </div>
                          )}
                          {matchingCustomerDevice.warranty_expires && (
                            <div>
                              <p className="text-xs text-muted-foreground uppercase tracking-wider">Warranty Expires</p>
                              <p className="font-medium text-sm">
                                {new Date(matchingCustomerDevice.warranty_expires).toLocaleDateString()}
                              </p>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="bg-muted/50 rounded-lg p-3">
                          <p className="text-xs text-muted-foreground mb-2">
                            This device is not saved to the customer's profile
                          </p>
                          {order.customer_id && order.device_id && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => setShowAddDeviceDialog(true)}
                              className="w-full"
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              Add to Profile
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Customer Device Notes */}
                  {matchingCustomerDevice?.notes && (
                    <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Customer Notes</p>
                      <p className="text-sm">{matchingCustomerDevice.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Services */}
          {order.ticket_services && order.ticket_services.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="h-5 w-5" />
                  Repair Services
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {order.ticket_services.map((ts: any) => (
                    <div key={ts.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">{ts.service?.name}</p>
                        <div className="flex items-center gap-4 mt-1">
                          {ts.service?.category && (
                            <p className="text-sm text-muted-foreground">
                              Category: {ts.service.category.replace('_', ' ')}
                            </p>
                          )}
                          {ts.service?.estimated_minutes && (
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Est: {ts.service.estimated_minutes} min
                            </p>
                          )}
                        </div>
                        {ts.technician_notes && (
                          <p className="text-sm text-muted-foreground mt-1">{ts.technician_notes}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          ${(ts.unit_price || ts.service?.base_price || 0).toFixed(2)}
                        </p>
                        {ts.quantity > 1 && (
                          <p className="text-sm text-muted-foreground">Qty: {ts.quantity}</p>
                        )}
                      </div>
                    </div>
                  ))}
                  <div className="pt-3 border-t">
                    <div className="flex justify-between items-center mb-2">
                      <p className="font-medium">Total Services</p>
                      <p className="font-semibold">
                        ${order.ticket_services.reduce((sum: number, ts: any) => 
                          sum + ((ts.unit_price || ts.service?.base_price || 0) * (ts.quantity || 1)), 0
                        ).toFixed(2)}
                      </p>
                    </div>
                    {order.ticket_services.some((ts: any) => ts.service?.estimated_minutes) && (
                      <div className="flex justify-between items-center">
                        <p className="text-sm text-muted-foreground">Total Estimated Time</p>
                        <p className="text-sm">
                          {order.ticket_services.reduce((sum: number, ts: any) => 
                            sum + ((ts.service?.estimated_minutes || 0) * (ts.quantity || 1)), 0
                          )} minutes
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

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

          {/* Time Entries Section - Back on the left side */}
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
            isDisabled={order.status === 'cancelled' || order.status === 'completed'}
            disabledReason={order.status === 'cancelled' ? 'Order has been cancelled' : order.status === 'completed' ? 'Order has been completed' : undefined}
          />

          {/* Customer Information - Moved to right sidebar */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Customer
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="font-medium">
                  {order.customers?.name || "Unknown Customer"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium text-sm flex items-center gap-2">
                  <Mail className="h-3 w-3 text-muted-foreground" />
                  {order.customers?.email || "No email"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <p className="font-medium text-sm flex items-center gap-2">
                  <Phone className="h-3 w-3 text-muted-foreground" />
                  {order.customers?.phone || "No phone"}
                </p>
              </div>
              {order.customers?.id && (
                <Link href={`/customers/${order.customers.id}`}>
                  <Button size="sm" variant="outline" className="w-full mt-2">
                    View Profile
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>

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

          {/* Photos & Documentation */}
          <TicketPhotosSidebar 
            ticketId={orderId}
            ticketNumber={order.ticket_number}
            userId={currentUserId}
            ticketServices={order.ticket_services || []}
          />

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

      {/* Add Device to Profile Dialog */}
      <AddDeviceToProfileDialog
        open={showAddDeviceDialog}
        onOpenChange={setShowAddDeviceDialog}
        deviceName={`${order.device?.manufacturer?.name || order.device_brand} ${order.device?.model_name || order.device_model}`}
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