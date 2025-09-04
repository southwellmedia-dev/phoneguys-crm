"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { DataTable } from "@/components/tables/data-table";
import { dashboardColumns, Order } from "@/components/orders/orders-columns";

interface RecentOrdersProps {
  orders: Order[];
}

export function RecentOrders({ orders }: RecentOrdersProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Recent Tickets</CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/orders">View all</Link>
        </Button>
      </CardHeader>
      <CardContent>
        <DataTable 
          columns={dashboardColumns} 
          data={orders}
          searchKey=""
          showColumnToggle={false}
          showPagination={false}
          showRowSelection={false}
        />
      </CardContent>
    </Card>
  );
}