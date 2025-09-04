"use client";

import { useState, useEffect } from "react";
import { PageContainer } from "@/components/layout/page-container";
import { DataTable } from "@/components/tables/data-table";
import { columns, Order } from "@/components/orders/orders-columns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Plus, 
  Download, 
  RefreshCw, 
  Package, 
  Clock, 
  CheckCircle2,
  AlertCircle,
  Activity,
  TrendingUp,
  ArrowRight
} from "lucide-react";
import { useTickets } from "@/lib/hooks/use-tickets";
import { useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useShowSkeleton } from "@/lib/hooks/use-navigation-loading";
import { SkeletonOrders } from "@/components/ui/skeleton-orders";

interface OrdersClientProps {
  orders: Order[];
}

export function OrdersClient({ orders: initialOrders }: OrdersClientProps) {
  const queryClient = useQueryClient();
  const { data: orders = initialOrders, isLoading, isFetching, refetch } = useTickets(undefined, initialOrders);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Determine if we should show skeleton
  const showSkeleton = useShowSkeleton(isLoading, isFetching, !!orders);

  // Use React Query data if available, otherwise fall back to initial data
  const safeOrders = Array.isArray(orders) ? orders : [];

  // Set up Supabase real-time subscription
  useEffect(() => {
    const supabase = createClient();
    
    // Subscribe to changes on repair_tickets table
    const channel = supabase
      .channel('orders-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'repair_tickets'
        },
        (payload) => {
          // Invalidate queries instead of router refresh
          queryClient.invalidateQueries({ queryKey: ['tickets'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*', // Also listen to time_entries changes
          schema: 'public',
          table: 'time_entries'
        },
        (payload) => {
          // Invalidate queries when time entries change
          queryClient.invalidateQueries({ queryKey: ['tickets'] });
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    // Reset the refreshing state after a short delay
    setTimeout(() => setIsRefreshing(false), 1000);
  };
  const headerActions = [
    {
      label: isRefreshing ? "Refreshing..." : "Refresh",
      icon: <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />,
      variant: "outline" as const,
      onClick: handleRefresh,
      disabled: isRefreshing,
    },
    {
      label: "Export",
      icon: <Download className="h-4 w-4" />,
      variant: "outline" as const,
      onClick: () => console.log("Export orders"),
    },
    {
      label: "New Ticket",
      href: "/orders/new",
      icon: <Plus className="h-4 w-4" />,
      variant: "default" as const,
    },
  ];

  // Show skeleton during navigation or loading
  if (showSkeleton) {
    return <SkeletonOrders />;
  }

  return (
    <PageContainer
      title="Tickets"
      description="Manage repair tickets and track their progress"
      actions={headerActions}
    >
      <div className="space-y-6">
        {/* Stats Cards - Modern Style */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="relative overflow-hidden group hover:-translate-y-0.5">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Total Tickets
              </CardTitle>
              <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <Package className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-3xl font-bold tracking-tight">{safeOrders.length}</div>
              <p className="text-sm text-muted-foreground">All repair tickets</p>
            </CardContent>
          </Card>
          
          <Card className="relative overflow-hidden group hover:-translate-y-0.5 border-blue-500/20">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                New
              </CardTitle>
              <div className="p-2 rounded-lg bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
                <AlertCircle className="h-4 w-4 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-3xl font-bold tracking-tight text-blue-600">
                {safeOrders.filter((o) => o.status === "NEW").length}
              </div>
              <p className="text-sm text-muted-foreground">Awaiting assignment</p>
            </CardContent>
          </Card>
          
          <Card className="relative overflow-hidden group hover:-translate-y-0.5 border-cyan-500/20">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                In Progress
              </CardTitle>
              <div className="p-2 rounded-lg bg-cyan-500/10 group-hover:bg-cyan-500/20 transition-colors">
                <Clock className="h-4 w-4 text-cyan-600" />
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-3xl font-bold tracking-tight text-cyan-600">
                {safeOrders.filter((o) => o.status === "IN_PROGRESS").length}
              </div>
              <p className="text-sm text-muted-foreground">Currently being repaired</p>
            </CardContent>
          </Card>
          
          <Card className="relative overflow-hidden group hover:-translate-y-0.5 border-green-500/20">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Completed
              </CardTitle>
              <div className="p-2 rounded-lg bg-green-500/10 group-hover:bg-green-500/20 transition-colors">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-3xl font-bold tracking-tight text-green-600">
                {safeOrders.filter((o) => o.status === "COMPLETED").length}
              </div>
              <p className="text-sm text-muted-foreground">Ready for pickup</p>
            </CardContent>
          </Card>
        </div>

        {/* Tickets List Card */}
        <Card className="relative overflow-hidden group">
          {/* Creative corner accent */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-2xl group-hover:from-primary/20 transition-colors duration-500" />
          
          <CardHeader className="pb-4">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 backdrop-blur-sm">
                  <Activity className="h-5 w-5 text-primary" />
                </div>
                <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-green-500 rounded-full border-2 border-card" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                  Repair Tickets
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  {safeOrders.length} total tickets
                </p>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="pt-0">
            <DataTable 
              columns={columns} 
              data={safeOrders} 
              searchKey="ticket_number"
              initialSorting={[{ id: "updated_at", desc: true }]}
            />
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}