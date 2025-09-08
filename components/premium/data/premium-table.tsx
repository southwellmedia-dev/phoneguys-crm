"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  ChevronDown, 
  ChevronUp, 
  ChevronsUpDown, 
  MoreHorizontal,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from "lucide-react";

export interface Column<T> {
  key: keyof T | string;
  header: string;
  sortable?: boolean;
  width?: string;
  align?: "left" | "center" | "right";
  render?: (value: any, row: T) => React.ReactNode;
  headerClassName?: string;
  cellClassName?: string;
}

export interface PremiumTableProps<T> {
  data: T[];
  columns: Column<T>[];
  variant?: "default" | "elevated" | "glass" | "gradient" | "premium";
  size?: "sm" | "md" | "lg";
  hoverable?: boolean;
  stickyHeader?: boolean;
  className?: string;
  onRowClick?: (row: T) => void;
  selectedRows?: T[];
  onSelectionChange?: (rows: T[]) => void;
  actions?: (row: T) => React.ReactNode;
}

export function PremiumTable<T extends Record<string, any>>({
  data,
  columns,
  variant = "default",
  size = "md",
  hoverable = true,
  stickyHeader = false,
  className,
  onRowClick,
  selectedRows = [],
  onSelectionChange,
  actions
}: PremiumTableProps<T>) {
  const [sortColumn, setSortColumn] = React.useState<string | null>(null);
  const [sortDirection, setSortDirection] = React.useState<"asc" | "desc">("asc");

  const handleSort = (column: Column<T>) => {
    if (!column.sortable) return;
    
    const key = column.key as string;
    if (sortColumn === key) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(key);
      setSortDirection("asc");
    }
  };

  const sortedData = React.useMemo(() => {
    if (!sortColumn) return data;
    
    return [...data].sort((a, b) => {
      const aVal = a[sortColumn];
      const bVal = b[sortColumn];
      
      if (aVal === bVal) return 0;
      
      const comparison = aVal > bVal ? 1 : -1;
      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [data, sortColumn, sortDirection]);

  const sizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base"
  };

  const paddingClasses = {
    sm: "px-3 py-2",
    md: "px-4 py-3",
    lg: "px-6 py-4"
  };

  const getSortIcon = (column: Column<T>) => {
    if (!column.sortable) return null;
    
    const key = column.key as string;
    if (sortColumn !== key) {
      return <ChevronsUpDown className="ml-2 h-3 w-3 text-muted-foreground/50" />;
    }
    
    return sortDirection === "asc" 
      ? <ArrowUp className="ml-2 h-3 w-3 text-primary" />
      : <ArrowDown className="ml-2 h-3 w-3 text-primary" />;
  };

  // Remove cards variant - not needed
  
  const tableVariantClasses = {
    default: "rounded-xl border bg-card shadow-elevation-1",
    elevated: "rounded-xl border bg-card shadow-elevation-3 hover:shadow-strong transition-all duration-300",
    glass: "rounded-xl border border-white/20 backdrop-blur-[var(--glass-blur)] bg-white/50 dark:bg-gray-950/50 shadow-glass",
    gradient: "rounded-xl border bg-gradient-subtle shadow-elevation-2",
    premium: "rounded-2xl border-0 bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-950/50 shadow-strong hover:shadow-colored transition-all duration-500"
  };

  const getHeaderBg = () => {
    switch(variant) {
      case "glass":
        return "bg-white/60 dark:bg-gray-950/60 backdrop-blur-sm";
      case "gradient":
        return "bg-gradient-to-r from-primary/10 to-primary/5";
      case "elevated":
        return "bg-muted/80";
      case "premium":
        return "bg-gradient-to-r from-primary/5 via-primary/3 to-primary/5 backdrop-blur-sm border-b border-primary/10";
      default:
        return "bg-muted/50";
    }
  };

  return (
    <div className={cn(
      "overflow-hidden transition-all duration-300",
      tableVariantClasses[variant],
      hoverable && "hover:shadow-elevation-3",
      className
    )}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className={cn(
            getHeaderBg(),
            stickyHeader && "sticky top-0 z-10"
          )}>
            <tr className="border-b border-border/50">
              {columns.map((column) => (
                <th
                  key={column.key as string}
                  className={cn(
                    paddingClasses[size],
                    "text-left font-medium text-muted-foreground",
                    column.sortable && "cursor-pointer hover:text-foreground transition-colors select-none",
                    column.align === "center" && "text-center",
                    column.align === "right" && "text-right",
                    column.headerClassName
                  )}
                  style={{ width: column.width }}
                  onClick={() => handleSort(column)}
                >
                  <div className={cn(
                    "flex items-center",
                    column.align === "center" && "justify-center",
                    column.align === "right" && "justify-end"
                  )}>
                    {column.header}
                    {getSortIcon(column)}
                  </div>
                </th>
              ))}
              {actions && (
                <th className={cn(paddingClasses[size], "w-10")}></th>
              )}
            </tr>
          </thead>
          <tbody>
            {sortedData.map((row, idx) => (
              <tr
                key={idx}
                className={cn(
                  "border-b border-border/30 last:border-b-0 transition-all duration-200",
                  hoverable && "hover:bg-primary/5 cursor-pointer",
                  idx % 2 === 1 && variant === "default" && "bg-muted/20",
                  selectedRows.includes(row) && "bg-primary/10 hover:bg-primary/15",
                  sizeClasses[size]
                )}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((column) => {
                  const value = column.render 
                    ? column.render(row[column.key as keyof T], row)
                    : row[column.key as keyof T];
                    
                  return (
                    <td
                      key={column.key as string}
                      className={cn(
                        paddingClasses[size],
                        column.align === "center" && "text-center",
                        column.align === "right" && "text-right",
                        column.cellClassName
                      )}
                    >
                      {value}
                    </td>
                  );
                })}
                {actions && (
                  <td className={cn(paddingClasses[size], "text-right")}>
                    {actions(row)}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Example usage helper component
export function TableActions({ onEdit, onDelete, onView }: {
  onEdit?: () => void;
  onDelete?: () => void;
  onView?: () => void;
}) {
  return (
    <div className="flex items-center gap-1">
      {onView && (
        <Button size="sm" variant="ghost" onClick={onView}>
          View
        </Button>
      )}
      {onEdit && (
        <Button size="sm" variant="ghost" onClick={onEdit}>
          Edit
        </Button>
      )}
      {onDelete && (
        <Button size="sm" variant="ghost" onClick={onDelete}>
          Delete
        </Button>
      )}
    </div>
  );
}