"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageContainer } from "@/components/layout/page-container";
import { DataTable } from "@/components/tables/data-table";
import { columns, Order } from "@/components/orders/orders-columns";
import { Plus, Download, RefreshCw } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface OrdersClientProps {
  orders: Order[];
}

export function OrdersClient({ orders: initialOrders }: OrdersClientProps) {
  const router = useRouter();
  const [orders, setOrders] = useState(initialOrders);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Update orders when props change
  useEffect(() => {
    setOrders(initialOrders);
  }, [initialOrders]);

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
          // Refresh the data when any change occurs
          router.refresh();
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
          // Refresh when time entries change
          router.refresh();
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [router]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    router.refresh();
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
      label: "New Order",
      href: "/orders/new",
      icon: <Plus className="h-4 w-4" />,
      variant: "default" as const,
    },
  ];

  return (
    <PageContainer
      title="Orders"
      description="Manage repair orders and track their progress"
      actions={headerActions}
    >
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">Total Orders</p>
            <p className="text-2xl font-bold">{orders.length}</p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">New</p>
            <p className="text-2xl font-bold text-blue-600">
              {orders.filter((o) => o.status === "NEW").length}
            </p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">In Progress</p>
            <p className="text-2xl font-bold text-cyan-600">
              {orders.filter((o) => o.status === "IN_PROGRESS").length}
            </p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">Completed</p>
            <p className="text-2xl font-bold text-green-600">
              {orders.filter((o) => o.status === "COMPLETED").length}
            </p>
          </div>
        </div>

        {/* Orders Table */}
        <DataTable 
          columns={columns} 
          data={orders} 
          searchKey="ticket_number"
          initialSorting={[{ id: "updated_at", desc: true }]}
        />
      </div>
    </PageContainer>
  );
}