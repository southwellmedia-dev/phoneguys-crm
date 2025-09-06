"use client";

import { useState, useEffect } from "react";
import { PageContainer } from "@/components/layout/page-container";
import { DataTable } from "@/components/tables/data-table";
import { columns, Order } from "@/components/orders/orders-columns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AnimatedPage } from "@/components/motion/animated-page";
import { StaggerContainer } from "@/components/motion/stagger-container";
import { AnimatedCard } from "@/components/motion/animated-card";
import { motion } from "framer-motion";
import { 
  Plus, 
  Download, 
  RefreshCw, 
  Package, 
  Package2,
  Clock, 
  CheckCircle2,
  AlertCircle,
  Activity,
  TrendingUp,
  ArrowRight
} from "lucide-react";
import { useTickets } from "@/lib/hooks/use-tickets-simple";
import { useSimpleRealtime } from "@/lib/hooks/use-simple-realtime";
import { useQueryClient } from "@tanstack/react-query";
import { createClient } from '@/lib/supabase/client';

interface OrdersClientProps {
  orders: Order[];
}

export function OrdersClient({ orders: initialOrders }: OrdersClientProps) {
  const queryClient = useQueryClient();
  const { data: orders = initialOrders, isLoading, refetch } = useTickets(undefined, initialOrders);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Simple real-time subscription
  useEffect(() => {
    const supabase = createClient();
    
    const channel = supabase
      .channel('orders-realtime')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'repair_tickets' },
        () => {
          // Simple invalidation on any change
          queryClient.invalidateQueries({ queryKey: ['tickets'] });
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const safeOrders = Array.isArray(orders) ? orders : [];

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
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

  // Calculate stats with additional metrics
  const stats = {
    total: safeOrders.length,
    inProgress: safeOrders.filter(o => o.status === 'IN_PROGRESS').length,
    completed: safeOrders.filter(o => o.status === 'COMPLETED').length,
    urgent: safeOrders.filter(o => o.status === 'WAITING_FOR_PARTS').length,
    new: safeOrders.filter(o => o.status === 'NEW').length,
    todayCount: safeOrders.filter(o => {
      const today = new Date().toDateString();
      return new Date(o.created_at).toDateString() === today;
    }).length,
  };

  // Calculate percentage changes (mock data for demo - would be calculated from historical data)
  const growthRate = 12; // This would be calculated from actual data
  const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  // Loading state with skeleton
  if (isLoading && !orders) {
    return (
      <PageContainer
        title="Tickets"
        description="Loading repair tickets..."
        actions={headerActions}
      >
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Tickets"
      description="Manage repair tickets and track their progress"
      actions={headerActions}
    >
      <AnimatedPage>
      <div className="space-y-6">
        {/* Stats Cards - Modern Style with gradients and animations */}
        <StaggerContainer className="grid gap-4 md:grid-cols-4">
          <AnimatedCard>
          <Card className="relative overflow-hidden group hover:shadow-lg transition-shadow">
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
              <div className="flex items-baseline gap-2">
                <motion.div
                  className="text-3xl font-bold tracking-tight"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, delay: 0.1 }}
                >
                  {stats.total}
                </motion.div>
                <motion.div
                  className="flex items-center gap-1"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <TrendingUp className="h-3 w-3 text-green-500" />
                  <span className="text-xs font-medium text-green-500">+{growthRate}%</span>
                </motion.div>
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.todayCount} created today
              </p>
            </CardContent>
          </Card>
          </AnimatedCard>

          <AnimatedCard>
          <Card className="relative overflow-hidden group hover:shadow-lg transition-shadow">
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                In Progress
              </CardTitle>
              <div className="p-2 rounded-lg bg-yellow-500/10 group-hover:bg-yellow-500/20 transition-colors">
                <Clock className="h-4 w-4 text-yellow-500" />
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-baseline gap-2">
                <motion.div
                  className="text-3xl font-bold tracking-tight"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, delay: 0.2 }}
                >
                  {stats.inProgress}
                </motion.div>
                {stats.inProgress > 0 && (
                  <motion.div
                    className="flex items-center gap-1"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    <Activity className="h-3 w-3 text-yellow-500 animate-pulse" />
                    <span className="text-xs font-medium text-yellow-500">Active</span>
                  </motion.div>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Being worked on now
              </p>
            </CardContent>
          </Card>
          </AnimatedCard>

          <AnimatedCard>
          <Card className="relative overflow-hidden group hover:shadow-lg transition-shadow">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Completed
              </CardTitle>
              <div className="p-2 rounded-lg bg-green-500/10 group-hover:bg-green-500/20 transition-colors">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-baseline gap-2">
                <motion.div
                  className="text-3xl font-bold tracking-tight"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, delay: 0.3 }}
                >
                  {stats.completed}
                </motion.div>
                <motion.div
                  className="flex items-center gap-1"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <span className="text-xs font-medium text-muted-foreground">
                    {completionRate}% rate
                  </span>
                </motion.div>
              </div>
              <p className="text-xs text-muted-foreground">
                Ready for pickup
              </p>
            </CardContent>
          </Card>
          </AnimatedCard>

          <AnimatedCard>
          <Card className="relative overflow-hidden group hover:shadow-lg transition-shadow">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Action Needed
              </CardTitle>
              <div className="p-2 rounded-lg bg-orange-500/10 group-hover:bg-orange-500/20 transition-colors">
                <AlertCircle className="h-4 w-4 text-orange-500" />
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-baseline gap-2">
                <motion.div
                  className="text-3xl font-bold tracking-tight"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, delay: 0.4 }}
                >
                  {stats.urgent + stats.new}
                </motion.div>
                {stats.urgent > 0 && (
                  <motion.div
                    className="flex items-center gap-1"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                  >
                    <ArrowRight className="h-3 w-3 text-orange-500" />
                    <span className="text-xs font-medium text-orange-500">Urgent</span>
                  </motion.div>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.urgent} waiting • {stats.new} new
              </p>
            </CardContent>
          </Card>
          </AnimatedCard>
        </StaggerContainer>

        {/* Orders Table with enhanced styling */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
        <Card className="relative overflow-hidden">
          {/* Subtle gradient background effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.02] via-transparent to-transparent pointer-events-none" />
          
          <CardHeader className="border-b bg-gradient-to-r from-background to-muted/10">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="text-xl font-semibold flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-primary/10">
                    <Package2 className="h-4 w-4 text-primary" />
                  </div>
                  Recent Tickets
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Track and manage all repair tickets in one place
                </p>
              </div>
              <div className="flex items-center gap-2">
                {isRefreshing && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-2 text-sm text-muted-foreground"
                  >
                    <RefreshCw className="h-3 w-3 animate-spin" />
                    <span>Updating...</span>
                  </motion.div>
                )}
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-0">
            <DataTable 
              columns={columns} 
              data={safeOrders}
              searchPlaceholder="Search by ticket number, customer, or device..."
              searchColumn="ticket_number"
              showColumnToggle={true}
              showPagination={true}
            />
          </CardContent>
        </Card>
        </motion.div>
      </div>
      </AnimatedPage>
    </PageContainer>
  );
}