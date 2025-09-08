"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DetailPageLayout } from "@/components/premium/layout/detail-page-layout";
import { PremiumTabs, TabPanel } from "@/components/premium/navigation/premium-tabs";
import { 
  ConnectedOrderHeader,
  ConnectedDeviceCard,
  ConnectedServicesCard,
  ConnectedTimeTracker,
  ConnectedActivityFeed
} from "@/components/premium/connected";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useTicket, useUpdateTicketStatus } from "@/lib/hooks/use-tickets";
import { useRealtime } from "@/lib/hooks/use-realtime";
import { useShowSkeleton } from "@/lib/hooks/use-navigation-loading";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Clock,
  User,
  Phone,
  Mail,
  MapPin,
  Package,
  AlertCircle,
  CheckCircle,
  XCircle,
  Timer,
  Activity,
  Camera,
  FileText,
  DollarSign,
  Edit,
  MoreHorizontal,
  Printer,
  RotateCcw,
  ChevronRight,
  Calendar,
  TrendingUp,
  Shield,
  Zap
} from "lucide-react";

interface PremiumOrderDetailClientProps {
  order: any;
  orderId: string;
  totalTimeMinutes: number;
  isAdmin?: boolean;
  currentUserId?: string;
  matchingCustomerDevice?: any;
  appointmentData?: any;
  technicians?: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
  }>;
}

export function PremiumOrderDetailClient({
  order: initialOrder,
  orderId,
  totalTimeMinutes: initialTotalTimeMinutes,
  isAdmin = false,
  currentUserId = "",
  matchingCustomerDevice,
  appointmentData,
  technicians = []
}: PremiumOrderDetailClientProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: order = initialOrder, isLoading, isFetching } = useTicket(orderId, initialOrder);
  const updateStatusMutation = useUpdateTicketStatus();
  
  // Set up real-time subscriptions
  useRealtime(['tickets']);
  
  // State
  const [activeTab, setActiveTab] = useState("overview");
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  
  // Determine if we should show skeleton
  const showSkeleton = useShowSkeleton(isLoading, isFetching, !!order);

  // Calculate total time from order data
  const totalTimeMinutes = order?.time_entries?.reduce(
    (acc: number, entry: any) => acc + (entry.duration_minutes || 0),
    0
  ) || order?.timer_total_minutes || order?.total_time_minutes || initialTotalTimeMinutes || 0;

  // Handle status change
  const handleStatusChange = (newStatus: string) => {
    updateStatusMutation.mutate({ id: orderId, status: newStatus });
  };

  // Handle reopen
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
      queryClient.invalidateQueries({ queryKey: ['ticket', orderId] });
    } catch (error) {
      toast.error("Failed to reopen order");
    }
  };

  // Tab configuration
  const tabs = [
    { id: "overview", label: "Overview", icon: <Package className="h-4 w-4" /> },
    { id: "activity", label: "Activity", icon: <Activity className="h-4 w-4" />, badge: order.ticket_notes?.length || 0 },
    { id: "time", label: "Time Tracking", icon: <Timer className="h-4 w-4" />, badge: order.time_entries?.length || 0 },
    { id: "photos", label: "Photos", icon: <Camera className="h-4 w-4" /> },
    { id: "invoice", label: "Invoice", icon: <DollarSign className="h-4 w-4" /> }
  ];

  // Page actions
  const pageActions = [
    {
      label: "Edit Order",
      icon: <Edit className="h-4 w-4" />,
      href: `/orders/${orderId}/edit`,
      variant: "outline" as const
    },
    {
      label: "Print Invoice",
      icon: <Printer className="h-4 w-4" />,
      onClick: () => console.log("Print invoice"),
      variant: "outline" as const
    }
  ];

  const moreActions = [
    {
      label: "Email Customer",
      icon: <Mail className="h-4 w-4" />,
      onClick: () => console.log("Email customer")
    },
    {
      label: "Change Status",
      icon: <Activity className="h-4 w-4" />,
      onClick: () => setShowStatusDialog(true)
    },
    ...(order.status === "cancelled" || order.status === "completed" ? [{
      label: "Re-open Order",
      icon: <RotateCcw className="h-4 w-4" />,
      onClick: handleReopen
    }] : [])
  ];

  // Loading skeleton
  if (showSkeleton) {
    return (
      <DetailPageLayout
        backHref="/orders"
        backLabel="Orders"
        title="Loading..."
        subtitle="Please wait while we load the order details"
      >
        <div className="space-y-6">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </DetailPageLayout>
    );
  }

  // Customer info widget
  const CustomerWidget = (
    <>
      <Card className="overflow-hidden bg-gradient-to-br from-background via-background to-primary/5">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4" />
            Customer Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {order.customers ? (
            <>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-sm font-bold text-primary">
                    {order.customers.name?.[0]?.toUpperCase() || "?"}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{order.customers.name}</p>
                  <p className="text-xs text-muted-foreground">Customer #{order.customer_id?.slice(-6)}</p>
                </div>
              </div>

              <div className="space-y-2">
                {order.customers.email && (
                  <a 
                    href={`mailto:${order.customers.email}`}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Mail className="h-3.5 w-3.5" />
                    <span className="truncate">{order.customers.email}</span>
                  </a>
                )}
                {order.customers.phone && (
                  <a 
                    href={`tel:${order.customers.phone}`}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Phone className="h-3.5 w-3.5" />
                    <span>{order.customers.phone}</span>
                  </a>
                )}
                {order.customers.address && (
                  <div className="flex items-start gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5 mt-0.5" />
                    <span className="text-xs">{order.customers.address}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <Button size="sm" variant="outline" className="flex-1">
                  <Phone className="h-3.5 w-3.5" />
                </Button>
                <Button size="sm" variant="outline" className="flex-1">
                  <Mail className="h-3.5 w-3.5" />
                </Button>
                <Button 
                  size="sm" 
                  variant="default" 
                  className="flex-1"
                  onClick={() => router.push(`/customers/${order.customer_id}`)}
                >
                  View
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center py-4 text-muted-foreground text-sm">
              No customer information available
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-sm">
            <TrendingUp className="h-4 w-4" />
            Quick Stats
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Created</span>
            <span className="text-sm font-medium">
              {new Date(order.created_at).toLocaleDateString()}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Last Updated</span>
            <span className="text-sm font-medium">
              {new Date(order.updated_at).toLocaleDateString()}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Assigned To</span>
            <span className="text-sm font-medium">
              {order.users?.full_name || order.users?.email || "Unassigned"}
            </span>
          </div>
          {order.priority && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Priority</span>
              <Badge 
                variant={order.priority === "high" ? "destructive" : order.priority === "medium" ? "default" : "secondary"}
                className="text-xs"
              >
                {order.priority}
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );

  return (
    <DetailPageLayout
      backHref="/orders"
      backLabel="Orders"
      title={order.ticket_number}
      subtitle={`Created ${new Date(order.created_at).toLocaleDateString()} • ${order.customers?.name || "Unknown Customer"}`}
      status={{
        label: order.status.replace("_", " ").toUpperCase(),
        color: order.status === "completed" ? "green" : 
               order.status === "in_progress" ? "cyan" :
               order.status === "on_hold" ? "amber" :
               order.status === "cancelled" ? "gray" : "default"
      }}
      actions={pageActions}
      moreActions={moreActions}
      sidebar={CustomerWidget}
      maxWidth="wide"
    >
      <div className="space-y-6">
        {/* Order Header Metrics */}
        <ConnectedOrderHeader order={order} />

        {/* Tabs Navigation */}
        <PremiumTabs
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          variant="soft"
          size="md"
        />

        {/* Tab Content */}
        <div className="min-h-[400px]">
          {/* Overview Tab */}
          <TabPanel value="overview" activeValue={activeTab}>
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2 space-y-6">
                <ConnectedDeviceCard 
                  order={order}
                  matchingCustomerDevice={matchingCustomerDevice}
                  onAddToProfile={() => console.log("Add to profile")}
                />
                <ConnectedServicesCard 
                  services={order.ticket_services || []}
                />
              </div>
              <div className="space-y-6">
                <ConnectedTimeTracker
                  ticketId={orderId}
                  ticketNumber={order.ticket_number}
                  customerName={order.customers?.name}
                  timeEntries={order.time_entries}
                  timerRunning={order.timer_running}
                  timerStartTime={order.timer_start_time}
                  totalMinutes={totalTimeMinutes}
                  isDisabled={order.status === "completed" || order.status === "cancelled"}
                  disabledReason={
                    order.status === "completed" ? "Order is completed" :
                    order.status === "cancelled" ? "Order is cancelled" : undefined
                  }
                />
              </div>
            </div>
          </TabPanel>

          {/* Activity Tab */}
          <TabPanel value="activity" activeValue={activeTab}>
            <ConnectedActivityFeed
              ticketId={orderId}
              notes={order.ticket_notes}
              showAddNote={order.status !== "completed" && order.status !== "cancelled"}
            />
          </TabPanel>

          {/* Time Tracking Tab */}
          <TabPanel value="time" activeValue={activeTab}>
            <Card>
              <CardHeader>
                <CardTitle>Time Tracking Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <Timer className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Time tracking details will be shown here</p>
                </div>
              </CardContent>
            </Card>
          </TabPanel>

          {/* Photos Tab */}
          <TabPanel value="photos" activeValue={activeTab}>
            <Card>
              <CardHeader>
                <CardTitle>Photos & Documentation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <Camera className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Photos and documentation will be shown here</p>
                </div>
              </CardContent>
            </Card>
          </TabPanel>

          {/* Invoice Tab */}
          <TabPanel value="invoice" activeValue={activeTab}>
            <Card>
              <CardHeader>
                <CardTitle>Invoice & Payment</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Invoice and payment details will be shown here</p>
                </div>
              </CardContent>
            </Card>
          </TabPanel>
        </div>
      </div>
    </DetailPageLayout>
  );
}