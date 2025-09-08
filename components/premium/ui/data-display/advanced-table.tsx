/**
 * Advanced Table Component
 * 
 * @description Data-driven table with sorting, custom cells, and row actions
 * @category Data Display
 * 
 * @example
 * ```tsx
 * const columns: TableColumn<Data>[] = [
 *   { header: 'Name', accessorKey: 'name', sortable: true },
 *   { header: 'Status', accessorKey: 'status', cell: (row) => <StatusBadge status={row.status} /> }
 * ];
 * 
 * <AdvancedTable data={data} columns={columns} onRowClick={(row) => navigate(row.id)} />
 * ```
 */

import * as React from "react";
import { cn } from "@/lib/utils";
import { ChevronUp, ChevronDown } from "lucide-react";

export interface TableColumn<T = any> {
  header: string;
  accessorKey: keyof T;
  sortable?: boolean;
  cell?: (row: T) => React.ReactNode;
  align?: "left" | "center" | "right";
  width?: string;
}

interface AdvancedTableProps<T = any> {
  data: T[];
  columns: TableColumn<T>[];
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
  sortable?: boolean;
  className?: string;
}

export function AdvancedTable<T extends Record<string, any>>({
  data,
  columns,
  onRowClick,
  emptyMessage = "No data available",
  sortable = true,
  className
}: AdvancedTableProps<T>) {
  const [sortConfig, setSortConfig] = React.useState<{
    key: keyof T | null;
    direction: "asc" | "desc";
  }>({ key: null, direction: "asc" });

  const sortedData = React.useMemo(() => {
    if (!sortConfig.key || !sortable) return data;

    return [...data].sort((a, b) => {
      const aValue = a[sortConfig.key!];
      const bValue = b[sortConfig.key!];

      if (aValue === bValue) return 0;

      const result = aValue < bValue ? -1 : 1;
      return sortConfig.direction === "asc" ? result : -result;
    });
  }, [data, sortConfig, sortable]);

  const handleSort = (column: TableColumn<T>) => {
    if (!column.sortable || !sortable) return;

    setSortConfig(current => ({
      key: column.accessorKey,
      direction: 
        current.key === column.accessorKey && current.direction === "asc"
          ? "desc"
          : "asc"
    }));
  };

  const getSortIcon = (column: TableColumn<T>) => {
    if (!column.sortable || !sortable) return null;
    
    if (sortConfig.key !== column.accessorKey) {
      return (
        <div className="flex flex-col opacity-30">
          <ChevronUp className="h-3 w-3 -mb-1" />
          <ChevronDown className="h-3 w-3" />
        </div>
      );
    }

    return sortConfig.direction === "asc" ? (
      <ChevronUp className="h-3 w-3" />
    ) : (
      <ChevronDown className="h-3 w-3" />
    );
  };

  return (
    <div className={cn("relative w-full overflow-auto rounded-lg border border-border/50", className)}>
      <table className="w-full caption-bottom text-sm">
        <thead className="border-b border-border/50 bg-muted/30">
          <tr>
            {columns.map((column, index) => (
              <th
                key={index}
                className={cn(
                  "h-11 px-4 text-left align-middle font-medium text-muted-foreground",
                  column.align === "center" && "text-center",
                  column.align === "right" && "text-right",
                  column.sortable && sortable && "cursor-pointer select-none hover:text-foreground transition-colors"
                )}
                style={{ width: column.width }}
                onClick={() => handleSort(column)}
              >
                <div className={cn(
                  "flex items-center gap-2",
                  column.align === "center" && "justify-center",
                  column.align === "right" && "justify-end"
                )}>
                  <span className="text-xs font-medium">{column.header}</span>
                  {getSortIcon(column)}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="[&_tr:last-child]:border-0">
          {sortedData.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="h-32 text-center text-sm text-muted-foreground"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            sortedData.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className={cn(
                  "border-b border-border/30 transition-colors",
                  onRowClick && "cursor-pointer hover:bg-muted/30"
                )}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((column, colIndex) => (
                  <td
                    key={colIndex}
                    className={cn(
                      "px-4 py-3 align-middle text-sm",
                      column.align === "center" && "text-center",
                      column.align === "right" && "text-right"
                    )}
                  >
                    {column.cell ? column.cell(row) : String(row[column.accessorKey])}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

// Export for backwards compatibility
export { AdvancedTable as TablePremium };
export type { TableColumn };