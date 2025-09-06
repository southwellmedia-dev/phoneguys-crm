"use client";

import { useState, useEffect } from "react";
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
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTicket, useUpdateTicketStatus, useDeleteTicket } from "@/lib/hooks/use-tickets-simple";
import { useQueryClient } from "@tanstack/react-query";
import { createClient } from '@/lib/supabase/client';
import { AnimatedPage } from "@/components/motion/animated-page";
import { StaggerContainer } from "@/components/motion/stagger-container";
import { AnimatedCard } from "@/components/motion/animated-card";
import { DeleteTicketDialog } from "@/components/orders/delete-ticket-dialog";

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
  order: initialOrder,
  orderId,
  totalTimeMinutes,
  isAdmin = false,
  currentUserId = "",
  matchingCustomerDevice,
  appointmentData,
  addDeviceToProfile,
}: OrderDetailClientProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: order = initialOrder, isLoading } = useTicket(orderId, initialOrder);
  const updateStatusMutation = useUpdateTicketStatus();
  const deleteTicketMutation = useDeleteTicket();
  
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [showAddDeviceDialog, setShowAddDeviceDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  // Simple real-time subscription for this specific ticket
  useEffect(() => {
    const supabase = createClient();
    
    const channel = supabase
      .channel(`ticket-${orderId}`)
      .on('postgres_changes', 
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'repair_tickets',
          filter: `id=eq.${orderId}`
        },
        () => {
          // Invalidate this specific ticket
          queryClient.invalidateQueries({ queryKey: ['ticket', orderId] });
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId, queryClient]);

  const handleStatusChange = async (newStatus: string, reason?: string) => {
    await updateStatusMutation.mutateAsync({ id: orderId, status: newStatus });
    setShowStatusDialog(false);
  };

  const handleDeleteTicket = async () => {
    await deleteTicketMutation.mutateAsync(orderId);
    router.push('/orders');
  };

  const handleAddDeviceToProfile = async (data: any) => {
    const result = await addDeviceToProfile(data);
    if (result.success) {
      toast.success('Device added to profile');
      setShowAddDeviceDialog(false);
    } else {
      toast.error(result.error || 'Failed to add device');
    }
  };

  // Simple loading state
  if (isLoading && !order) {
    return (
      <PageContainer title="Loading..." description="">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </PageContainer>
    );
  }

  if (!order) {
    return (
      <PageContainer title="Ticket Not Found" description="">
        <Card>
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">This ticket could not be found.</p>
            <Button asChild className="mt-4">
              <Link href="/orders">Back to Orders</Link>
            </Button>
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  const headerActions = [
    {
      label: "Back",
      href: "/orders",
      icon: <ArrowLeft className="h-4 w-4" />,
      variant: "outline" as const,
    },
    {
      label: "Print",
      icon: <Printer className="h-4 w-4" />,
      variant: "outline" as const,
      onClick: () => window.print(),
    },
    {
      label: "Edit",
      icon: <Edit className="h-4 w-4" />,
      variant: "default" as const,
      href: `/orders/${orderId}/edit`,
    },
  ];

  return (
    <PageContainer
      title={`Ticket #${order.ticket_number}`}
      description={`Repair ticket for ${order.customers?.name || "Unknown Customer"}`}
      actions={headerActions}
    >
      <AnimatedPage>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Status and Timer Card */}
          <AnimatedCard>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Status & Timer</CardTitle>
                <StatusBadge status={order.status} />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Current Status</p>
                  <div className="flex items-center gap-2 mt-1">
                    <StatusBadge status={order.status} />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowStatusDialog(true)}
                      disabled={updateStatusMutation.isPending}
                    >
                      <Edit3 className="h-3 w-3 mr-1" />
                      Change
                    </Button>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Time</p>
                  <p className="text-2xl font-bold">
                    {Math.floor(totalTimeMinutes / 60)}h {totalTimeMinutes % 60}m
                  </p>
                </div>
              </div>
              
              <TimerControl
                ticketId={orderId}
                initialIsRunning={order.timer_is_running}
                initialStartTime={order.timer_started_at}
                currentUserId={currentUserId}
                assignedTo={order.assigned_to}
                isAdmin={isAdmin}
                status={order.status}
              />
            </CardContent>
          </Card>
          </AnimatedCard>

          {/* Customer Information */}
          <AnimatedCard>
          <Card>
            <CardHeader>
              <CardTitle>Customer Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{order.customers?.name || "Unknown Customer"}</span>
              </div>
              {order.customers?.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <a href={`mailto:${order.customers.email}`} className="text-primary hover:underline">
                    {order.customers.email}
                  </a>
                </div>
              )}
              {order.customers?.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <a href={`tel:${order.customers.phone}`} className="text-primary hover:underline">
                    {order.customers.phone}
                  </a>
                </div>
              )}
            </CardContent>
          </Card>
          </AnimatedCard>

          {/* Device Information */}
          <AnimatedCard>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Device Information</CardTitle>
                {!matchingCustomerDevice && order.customers && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowAddDeviceDialog(true)}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add to Profile
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <Smartphone className="h-4 w-4 text-muted-foreground" />
                <span>
                  {order.device?.manufacturer?.name || order.device_brand || ""} {order.device?.model_name || order.device_model || ""}
                </span>
              </div>
              {order.device_imei && (
                <div>
                  <span className="text-sm text-muted-foreground">IMEI:</span>
                  <span className="ml-2 font-mono text-sm">{order.device_imei}</span>
                </div>
              )}
              {order.device_serial_number && (
                <div>
                  <span className="text-sm text-muted-foreground">Serial:</span>
                  <span className="ml-2 font-mono text-sm">{order.device_serial_number}</span>
                </div>
              )}
            </CardContent>
          </Card>
          </AnimatedCard>

          {/* Repair Issues */}
          <AnimatedCard>
          <Card>
            <CardHeader>
              <CardTitle>Repair Issues</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {order.repair_issues?.map((issue: string, index: number) => (
                  <Badge key={index} variant="secondary">
                    {issue.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </Badge>
                ))}
              </div>
              {order.issue_description && (
                <div className="mt-4">
                  <p className="text-sm text-muted-foreground mb-1">Description:</p>
                  <p className="text-sm">{order.issue_description}</p>
                </div>
              )}
            </CardContent>
          </Card>
          </AnimatedCard>

          {/* Time Entries */}
          <TimeEntriesSection 
            entries={order.time_entries || []}
            totalMinutes={totalTimeMinutes}
            canDelete={isAdmin}
          />
        </div>

        {/* Right Column - Photos and Actions */}
        <div className="space-y-6">
          <TicketPhotosSidebar ticketId={orderId} />
          
          {/* Danger Zone */}
          {isAdmin && (
            <Card className="border-destructive/20">
              <CardHeader>
                <CardTitle className="text-destructive">Danger Zone</CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={() => setShowDeleteDialog(true)}
                  disabled={deleteTicketMutation.isPending}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Ticket
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Dialogs */}
      <StatusChangeDialog
        isOpen={showStatusDialog}
        onClose={() => setShowStatusDialog(false)}
        onConfirm={handleStatusChange}
        currentStatus={order.status}
        ticketId={orderId}
        ticketNumber={order.ticket_number}
        customerName={order.customers?.name}
      />
      
      {showAddDeviceDialog && (
        <AddDeviceToProfileDialog
          open={showAddDeviceDialog}
          onOpenChange={setShowAddDeviceDialog}
          device={{
            brand: order.device?.manufacturer?.name || order.device_brand || "",
            model: order.device?.model_name || order.device_model || "",
            serial_number: order.device_serial_number,
            imei: order.device_imei,
          }}
          onAdd={handleAddDeviceToProfile}
        />
      )}
      
      <DeleteTicketDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        ticketNumber={order.ticket_number}
        onConfirm={handleDeleteTicket}
      />
      </AnimatedPage>
    </PageContainer>
  );
}