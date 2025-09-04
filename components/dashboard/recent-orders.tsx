"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { DataTable } from "@/components/tables/data-table";
import { dashboardColumns, Order } from "@/components/orders/orders-columns";
import { ArrowRight, Activity, TrendingUp } from "lucide-react";

interface RecentOrdersProps {
  orders: Order[];
}

export function RecentOrders({ orders }: RecentOrdersProps) {
  return (
    <Card className="relative overflow-hidden group">
      {/* Creative corner accent */}
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-2xl group-hover:from-primary/20 transition-colors duration-500" />
      
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 backdrop-blur-sm">
              <Activity className="h-5 w-5 text-primary" />
            </div>
            <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-green-500 rounded-full border-2 border-card" />
          </div>
          <div>
            <CardTitle className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
              Recent Activity
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              Live repair tracking
            </p>
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          className="group/btn hover:bg-primary/10 hover:text-primary transition-all duration-300"
          asChild
        >
          <Link href="/orders">
            <span className="mr-1">View all</span>
            <ArrowRight className="h-3 w-3 transition-transform group-hover/btn:translate-x-1" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="pt-0">
        {/* Remove the extra border wrapper div */}
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