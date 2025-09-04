import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type RepairStatus = "new" | "in_progress" | "on_hold" | "completed" | "cancelled";

const statusConfig: Record<
  RepairStatus,
  { label: string; className: string }
> = {
  new: {
    label: "New",
    className: "bg-primary text-primary-foreground border-transparent hover:bg-primary/90",
  },
  in_progress: {
    label: "In Progress",
    className: "bg-yellow-500 text-white border-transparent hover:bg-yellow-600",
  },
  on_hold: {
    label: "On Hold",
    className: "bg-gray-500 text-white border-transparent hover:bg-gray-600",
  },
  completed: {
    label: "Completed",
    className: "bg-green-500 text-white border-transparent hover:bg-green-600",
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-destructive text-destructive-foreground border-transparent hover:bg-destructive/90",
  },
};

interface StatusBadgeProps {
  status: RepairStatus | string | undefined | null;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  // Handle null/undefined status
  if (!status) {
    console.warn('Status is null or undefined. Using default.');
    return (
      <Badge
        variant="outline"
        className={cn("bg-gray-500 text-white border-transparent", className)}
      >
        Unknown
      </Badge>
    );
  }

  const config = statusConfig[status as RepairStatus];

  // Handle invalid status values gracefully
  if (!config) {
    console.warn(`Invalid status value: "${status}". Using default.`);
    return (
      <Badge
        variant="outline"
        className={cn("bg-gray-500 text-white border-transparent", className)}
      >
        {status || 'Unknown'}
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className={cn(config.className, className)}
    >
      {config.label}
    </Badge>
  );
}