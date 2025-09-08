/**
 * Premium Table Component
 * 
 * @description Modern, fintech-style table with clean lines and subtle interactions
 * @category Data Display
 * 
 * @example
 * ```tsx
 * <TablePremium>
 *   <TablePremiumHeader>
 *     <TablePremiumRow>
 *       <TablePremiumHead>Order ID</TablePremiumHead>
 *       <TablePremiumHead>Customer</TablePremiumHead>
 *       <TablePremiumHead>Status</TablePremiumHead>
 *       <TablePremiumHead align="right">Amount</TablePremiumHead>
 *     </TablePremiumRow>
 *   </TablePremiumHeader>
 *   <TablePremiumBody>
 *     <TablePremiumRow>
 *       <TablePremiumCell>#12345</TablePremiumCell>
 *       <TablePremiumCell>John Doe</TablePremiumCell>
 *       <TablePremiumCell><StatusBadge status="active" /></TablePremiumCell>
 *       <TablePremiumCell align="right">$299.00</TablePremiumCell>
 *     </TablePremiumRow>
 *   </TablePremiumBody>
 * </TablePremium>
 * ```
 */

import * as React from "react";
import { cn } from "@/lib/utils";

const TablePremium = React.forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => (
  <div className="relative w-full overflow-auto rounded-lg border border-border/50">
    <table
      ref={ref}
      className={cn(
        "w-full caption-bottom text-sm",
        className
      )}
      {...props}
    />
  </div>
));
TablePremium.displayName = "TablePremium";

const TablePremiumHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead 
    ref={ref} 
    className={cn(
      "border-b border-border/50 bg-muted/30",
      className
    )} 
    {...props} 
  />
));
TablePremiumHeader.displayName = "TablePremiumHeader";

const TablePremiumBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn("[&_tr:last-child]:border-0", className)}
    {...props}
  />
));
TablePremiumBody.displayName = "TablePremiumBody";

const TablePremiumFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn(
      "border-t border-border/50 bg-muted/30 font-medium [&>tr]:last:border-b-0",
      className
    )}
    {...props}
  />
));
TablePremiumFooter.displayName = "TablePremiumFooter";

const TablePremiumRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement> & {
    clickable?: boolean;
    selected?: boolean;
  }
>(({ className, clickable = false, selected = false, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      "border-b border-border/30 transition-colors",
      clickable && "cursor-pointer hover:bg-muted/30",
      selected && "bg-primary/5",
      "[&:has([role=checkbox]:checked)]:bg-primary/5",
      className
    )}
    {...props}
  />
));
TablePremiumRow.displayName = "TablePremiumRow";

interface TablePremiumHeadProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  sortable?: boolean;
  sorted?: "asc" | "desc" | false;
  onSort?: () => void;
}

const TablePremiumHead = React.forwardRef<
  HTMLTableCellElement,
  TablePremiumHeadProps
>(({ className, children, align = "left", sortable = false, sorted = false, onSort, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      "h-11 px-4 text-left align-middle font-medium text-muted-foreground",
      align === "center" && "text-center",
      align === "right" && "text-right",
      sortable && "cursor-pointer select-none hover:text-foreground transition-colors",
      "[&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
      className
    )}
    onClick={sortable ? onSort : undefined}
    {...props}
  >
    <div className={cn(
      "flex items-center gap-2",
      align === "center" && "justify-center",
      align === "right" && "justify-end"
    )}>
      <span className="text-xs font-medium">{children}</span>
      {sortable && (
        <div className="flex flex-col">
          <svg
            className={cn(
              "h-3 w-3 transition-colors",
              sorted === "asc" ? "text-foreground" : "text-muted-foreground/30"
            )}
            viewBox="0 0 12 12"
          >
            <path d="M6 3L9 7H3L6 3Z" fill="currentColor" />
          </svg>
          <svg
            className={cn(
              "h-3 w-3 -mt-1 transition-colors",
              sorted === "desc" ? "text-foreground" : "text-muted-foreground/30"
            )}
            viewBox="0 0 12 12"
          >
            <path d="M6 9L3 5H9L6 9Z" fill="currentColor" />
          </svg>
        </div>
      )}
    </div>
  </th>
));
TablePremiumHead.displayName = "TablePremiumHead";

interface TablePremiumCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
  muted?: boolean;
  highlight?: "success" | "warning" | "error" | "info" | "primary";
}

const TablePremiumCell = React.forwardRef<
  HTMLTableCellElement,
  TablePremiumCellProps
>(({ className, align = "left", muted = false, highlight, ...props }, ref) => (
  <td
    ref={ref}
    className={cn(
      "px-4 py-3 align-middle",
      align === "center" && "text-center",
      align === "right" && "text-right",
      muted && "text-muted-foreground",
      highlight === "success" && "text-green-600 dark:text-green-500 font-medium",
      highlight === "warning" && "text-yellow-600 dark:text-yellow-500 font-medium",
      highlight === "error" && "text-red-600 dark:text-red-500 font-medium",
      highlight === "info" && "text-blue-600 dark:text-blue-500 font-medium",
      highlight === "primary" && "text-primary font-medium",
      "[&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
      className
    )}
    {...props}
  />
));
TablePremiumCell.displayName = "TablePremiumCell";

const TablePremiumCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    className={cn("mt-4 text-sm text-muted-foreground", className)}
    {...props}
  />
));
TablePremiumCaption.displayName = "TablePremiumCaption";

// Empty state component
interface TablePremiumEmptyProps {
  message?: string;
  description?: string;
  icon?: React.ReactNode;
}

const TablePremiumEmpty: React.FC<TablePremiumEmptyProps> = ({
  message = "No data available",
  description,
  icon
}) => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    {icon && (
      <div className="mb-4 text-muted-foreground">
        {icon}
      </div>
    )}
    <p className="text-sm font-medium text-muted-foreground">{message}</p>
    {description && (
      <p className="mt-1 text-xs text-muted-foreground/60">{description}</p>
    )}
  </div>
);

export {
  TablePremium,
  TablePremiumHeader,
  TablePremiumBody,
  TablePremiumFooter,
  TablePremiumHead,
  TablePremiumRow,
  TablePremiumCell,
  TablePremiumCaption,
  TablePremiumEmpty,
};