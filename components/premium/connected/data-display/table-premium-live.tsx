/**
 * TablePremiumLive - Data-aware table component
 * 
 * @description Connected version of TablePremium with real-time data and sorting
 * @category Connected/DataDisplay
 * 
 * @example
 * ```tsx
 * <TablePremiumLive
 *   endpoint="/api/orders"
 *   queryKey={["orders"]}
 *   columns={[
 *     { key: 'ticket_number', label: 'Order #', sortable: true },
 *     { key: 'customer_name', label: 'Customer', sortable: true },
 *     { key: 'status', label: 'Status', render: (value, row) => <StatusBadge status={value} /> }
 *   ]}
 * />
 * ```
 */

'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  TablePremium,
  TablePremiumBody,
  TablePremiumCell,
  TablePremiumHead,
  TablePremiumHeader,
  TablePremiumRow,
  TablePremiumEmpty
} from '@/components/premium/ui/data-display/table-premium';
import { SkeletonTable } from '@/components/premium/ui/feedback/skeleton-premium';
import { useTableData, type SortConfig } from '@/lib/hooks/connected/use-table-data';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface TableColumn<T = any> {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  render?: (value: any, row: T, index: number) => React.ReactNode;
  className?: string;
}

export interface TablePremiumLiveProps<T = any> {
  /** API endpoint to fetch data from */
  endpoint: string;
  /** React Query key for caching */
  queryKey: string[];
  /** Column definitions */
  columns: TableColumn<T>[];
  /** Filters to apply to data fetching */
  filters?: Record<string, any>;
  /** Initial sort configuration */
  initialSort?: SortConfig;
  /** Maximum number of rows to display */
  limit?: number;
  /** Enable row click navigation */
  clickable?: boolean;
  /** Base path for row navigation (e.g., '/orders') */
  basePath?: string;
  /** Custom row click handler */
  onRowClick?: (row: T) => void;
  /** Data transformation function */
  transform?: (data: any) => T[];
  /** Enable real-time updates */
  realtime?: boolean;
  /** Empty state configuration */
  emptyState?: {
    message?: string;
    description?: string;
    icon?: React.ReactNode;
  };
  /** Custom className for table */
  className?: string;
}

export function TablePremiumLive<T = any>({
  endpoint,
  queryKey,
  columns,
  filters,
  initialSort,
  limit,
  clickable = false,
  basePath,
  onRowClick,
  transform,
  realtime = true,
  emptyState = {
    message: "No data available",
    description: "Data will appear here when available"
  },
  className
}: TablePremiumLiveProps<T>) {
  const router = useRouter();
  
  const {
    data,
    error,
    showSkeleton,
    handleSort,
    getSortIcon
  } = useTableData<T>({
    endpoint,
    queryKey,
    filters,
    initialSort,
    pageSize: limit,
    realtime,
    transform
  });

  const getSortIconComponent = (key: string) => {
    const direction = getSortIcon(key);
    switch (direction) {
      case 'asc':
        return <ArrowUp className="h-3 w-3 ml-1" />;
      case 'desc':
        return <ArrowDown className="h-3 w-3 ml-1" />;
      default:
        return <ArrowUpDown className="h-3 w-3 ml-1 opacity-30" />;
    }
  };

  const handleRowClick = (row: T) => {
    if (onRowClick) {
      onRowClick(row);
    } else if (clickable && basePath && (row as any)?.id) {
      router.push(`${basePath}/${(row as any).id}`);
    }
  };

  // Show skeleton during initial load
  if (showSkeleton) {
    return (
      <div className={className}>
        <SkeletonTable 
          rows={limit || 5} 
          columns={columns.length} 
          showHeader 
        />
      </div>
    );
  }

  // Handle error state
  if (error) {
    return (
      <TablePremium className={className}>
        <TablePremiumHeader>
          <TablePremiumRow>
            {columns.map((column) => (
              <TablePremiumHead
                key={column.key}
                align={column.align}
                style={column.width ? { width: column.width } : undefined}
                className={column.className}
              >
                {column.label}
              </TablePremiumHead>
            ))}
          </TablePremiumRow>
        </TablePremiumHeader>
        <TablePremiumBody>
          <TablePremiumRow>
            <TablePremiumCell colSpan={columns.length}>
              <TablePremiumEmpty 
                message="Error loading data"
                description="Please try refreshing the page"
              />
            </TablePremiumCell>
          </TablePremiumRow>
        </TablePremiumBody>
      </TablePremium>
    );
  }

  return (
    <TablePremium className={className}>
      <TablePremiumHeader>
        <TablePremiumRow>
          {columns.map((column) => (
            <TablePremiumHead
              key={column.key}
              align={column.align}
              style={column.width ? { width: column.width } : undefined}
              className={cn(
                column.className,
                column.sortable && "cursor-pointer hover:bg-muted/50 select-none"
              )}
              onClick={column.sortable ? () => handleSort(column.key) : undefined}
            >
              <div className="flex items-center">
                {column.label}
                {column.sortable && getSortIconComponent(column.key)}
              </div>
            </TablePremiumHead>
          ))}
        </TablePremiumRow>
      </TablePremiumHeader>
      <TablePremiumBody>
        {data && data.length > 0 ? (
          data.map((row, index) => (
            <TablePremiumRow
              key={(row as any)?.id || index}
              clickable={clickable || !!onRowClick}
              onClick={() => handleRowClick(row)}
              className={clickable || onRowClick ? "cursor-pointer" : ""}
            >
              {columns.map((column) => {
                const value = (row as any)[column.key];
                const content = column.render 
                  ? column.render(value, row, index)
                  : value;

                return (
                  <TablePremiumCell
                    key={column.key}
                    align={column.align}
                    className={column.className}
                  >
                    {content}
                  </TablePremiumCell>
                );
              })}
            </TablePremiumRow>
          ))
        ) : (
          <TablePremiumRow>
            <TablePremiumCell colSpan={columns.length}>
              <TablePremiumEmpty 
                message={emptyState.message}
                description={emptyState.description}
                icon={emptyState.icon}
              />
            </TablePremiumCell>
          </TablePremiumRow>
        )}
      </TablePremiumBody>
    </TablePremium>
  );
}

TablePremiumLive.displayName = 'TablePremiumLive';