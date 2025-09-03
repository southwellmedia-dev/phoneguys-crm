"use client";

import { ColumnDef } from "@tanstack/react-table";
import { StatusBadge, RepairStatus } from "@/components/orders/status-badge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Eye, Edit, Clock, CheckCircle, Package } from "lucide-react";
import Link from "next/link";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowUpDown } from "lucide-react";

export interface Order {
  id: string;
  ticket_number: string;
  customer_id?: string;
  customer_name: string;
  customer_phone: string;
  device_brand: string;
  device_model: string;
  repair_issues: string[];
  status: RepairStatus;
  created_at: string;
  updated_at: string;
  timer_total_minutes?: number;
}

// Define all available columns as an object for easy access
const columnDefinitions = {
  select: {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  } as ColumnDef<Order>,
  
  ticket_number: {
    accessorKey: "ticket_number",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Ticket #
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      return (
        <Link 
          href={`/orders/${row.original.id}`}
          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
            <Package className="h-4 w-4 text-primary" />
          </div>
          <div className="font-medium hover:underline">{row.getValue("ticket_number")}</div>
        </Link>
      );
    },
  } as ColumnDef<Order>,

  ticket_number_simple: {
    accessorKey: "ticket_number",
    header: "Ticket",
    cell: ({ row }) => {
      return (
        <Link 
          href={`/orders/${row.original.id}`}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
            <Package className="h-3.5 w-3.5 text-primary" />
          </div>
          <span className="font-medium hover:underline">{row.getValue("ticket_number")}</span>
        </Link>
      );
    },
  } as ColumnDef<Order>,
  
  customer_name: {
    accessorKey: "customer_name",
    header: "Customer",
    cell: ({ row }) => {
      const customerId = row.original.customer_id;
      const customerName = row.original.customer_name;
      
      return (
        <div>
          {customerId ? (
            <Link 
              href={`/customers/${customerId}`}
              className="font-medium hover:underline hover:text-primary transition-colors"
            >
              {customerName}
            </Link>
          ) : (
            <div className="font-medium">{customerName}</div>
          )}
          <div className="text-sm text-muted-foreground">
            {row.original.customer_phone}
          </div>
        </div>
      );
    },
  } as ColumnDef<Order>,

  customer_name_simple: {
    accessorKey: "customer_name",
    header: "Customer",
    cell: ({ row }) => {
      const customerId = row.original.customer_id;
      const customerName = row.original.customer_name;
      
      if (customerId) {
        return (
          <Link 
            href={`/customers/${customerId}`}
            className="hover:underline hover:text-primary transition-colors"
          >
            {customerName}
          </Link>
        );
      }
      return <span>{customerName}</span>;
    },
  } as ColumnDef<Order>,
  
  device: {
    accessorKey: "device",
    header: "Device",
    cell: ({ row }) => {
      return (
        <div>
          <div>{row.original.device_brand} {row.original.device_model}</div>
          {row.original.repair_issues && row.original.repair_issues.length > 0 && (
            <div className="flex gap-1 mt-1">
              {row.original.repair_issues.slice(0, 2).map((issue, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {issue}
                </Badge>
              ))}
              {row.original.repair_issues.length > 2 && (
                <Badge variant="secondary" className="text-xs">
                  +{row.original.repair_issues.length - 2}
                </Badge>
              )}
            </div>
          )}
        </div>
      );
    },
  } as ColumnDef<Order>,

  device_simple: {
    accessorKey: "device",
    header: "Device",
    cell: ({ row }) => {
      return (
        <div className="text-sm">
          {row.original.device_brand} {row.original.device_model}
        </div>
      );
    },
  } as ColumnDef<Order>,
  
  status: {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      return <StatusBadge status={row.getValue("status")} />;
    },
  } as ColumnDef<Order>,
  
  created_at: {
    accessorKey: "created_at",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Created
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const date = new Date(row.getValue("created_at"));
      return (
        <div className="text-sm">
          <div>{date.toLocaleDateString()}</div>
          <div className="text-muted-foreground text-xs">{date.toLocaleTimeString()}</div>
        </div>
      );
    },
  } as ColumnDef<Order>,

  last_activity_simple: {
    accessorKey: "updated_at",
    header: "Last Activity",
    cell: ({ row }) => {
      const date = new Date(row.getValue("updated_at"));
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      
      let relativeTime = '';
      if (diffDays > 7) {
        relativeTime = date.toLocaleDateString();
      } else if (diffDays > 0) {
        relativeTime = `${diffDays}d ago`;
      } else if (diffHours > 0) {
        relativeTime = `${diffHours}h ago`;
      } else {
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        relativeTime = diffMinutes > 0 ? `${diffMinutes}m ago` : 'Just now';
      }
      
      return <span className="text-sm text-muted-foreground">{relativeTime}</span>;
    },
  } as ColumnDef<Order>,
  
  updated_at: {
    accessorKey: "updated_at",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Last Activity
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const date = new Date(row.getValue("updated_at"));
      const created = new Date(row.original.created_at);
      
      // Only show if different from created date (more than 1 minute difference)
      if (Math.abs(date.getTime() - created.getTime()) < 60000) {
        return <span className="text-sm text-muted-foreground">--</span>;
      }
      
      // Format relative time
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      
      let relativeTime = '';
      if (diffDays > 0) {
        relativeTime = `${diffDays}d ago`;
      } else if (diffHours > 0) {
        relativeTime = `${diffHours}h ago`;
      } else {
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        relativeTime = `${diffMinutes}m ago`;
      }
      
      return (
        <div className="text-sm">
          <div>{date.toLocaleDateString()}</div>
          <div className="text-muted-foreground text-xs">{relativeTime}</div>
        </div>
      );
    },
  } as ColumnDef<Order>,
  
  timer_total_minutes: {
    accessorKey: "timer_total_minutes",
    header: "Time Spent",
    cell: ({ row }) => {
      const minutes = row.getValue("timer_total_minutes") as number;
      if (!minutes) return <span className="text-muted-foreground">--</span>;
      
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return (
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          <span>{hours}h {mins}m</span>
        </div>
      );
    },
  } as ColumnDef<Order>,
  
  actions: {
    id: "actions",
    cell: ({ row }) => {
      const order = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem asChild>
              <Link href={`/orders/${order.id}`} className="flex items-center">
                <Eye className="mr-2 h-4 w-4" />
                View details
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/orders/${order.id}/edit`} className="flex items-center">
                <Edit className="mr-2 h-4 w-4" />
                Edit order
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="flex items-center">
              <Clock className="mr-2 h-4 w-4" />
              Start timer
            </DropdownMenuItem>
            <DropdownMenuItem className="flex items-center">
              <CheckCircle className="mr-2 h-4 w-4" />
              Mark complete
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(order.ticket_number)}
            >
              Copy ticket number
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  } as ColumnDef<Order>,

  actions_simple: {
    id: "actions",
    header: () => <span className="sr-only">Actions</span>,
    cell: ({ row }) => {
      return (
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/orders/${row.original.id}`}>
            <Eye className="h-4 w-4" />
          </Link>
        </Button>
      );
    },
  } as ColumnDef<Order>,
};

// Full columns for the main orders page
export const columns: ColumnDef<Order>[] = [
  columnDefinitions.select,
  columnDefinitions.ticket_number,
  columnDefinitions.customer_name,
  columnDefinitions.device,
  columnDefinitions.status,
  columnDefinitions.created_at,
  columnDefinitions.updated_at,
  columnDefinitions.timer_total_minutes,
  columnDefinitions.actions,
];

// Simple columns for the dashboard recent orders
export const dashboardColumns: ColumnDef<Order>[] = [
  columnDefinitions.ticket_number_simple,
  columnDefinitions.customer_name_simple,
  columnDefinitions.device_simple,
  columnDefinitions.status,
  columnDefinitions.last_activity_simple,
  columnDefinitions.actions_simple,
];

// Minimal columns for embedded views
export const minimalColumns: ColumnDef<Order>[] = [
  columnDefinitions.ticket_number_simple,
  columnDefinitions.status,
  columnDefinitions.created_at_simple,
];

// Helper function to create custom column sets
export function createColumns(columnKeys: (keyof typeof columnDefinitions)[]): ColumnDef<Order>[] {
  return columnKeys.map(key => columnDefinitions[key]).filter(Boolean);
}