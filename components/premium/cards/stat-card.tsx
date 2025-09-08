import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

export interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon?: LucideIcon;
  variant?: "default" | "background-number" | "gradient-border" | "floating" | "split";
  color?: "cyan" | "purple" | "green" | "amber" | "red";
  className?: string;
}

export function StatCard({
  title,
  value,
  change,
  icon: Icon,
  variant = "default",
  color = "cyan",
  className,
}: StatCardProps) {
  const colorClasses = {
    cyan: "from-cyan-500 to-blue-500 text-cyan-500",
    purple: "from-purple-500 to-pink-500 text-purple-500",
    green: "from-green-500 to-emerald-500 text-green-500",
    amber: "from-amber-500 to-orange-500 text-amber-500",
    red: "from-red-500 to-rose-500 text-red-500",
  };

  if (variant === "background-number") {
    return (
      <Card className={cn("relative overflow-hidden group hover:shadow-lg transition-all duration-300", className)}>
        {/* Large background number */}
        <div className="absolute -right-8 -top-8 text-[120px] font-bold text-muted/10 dark:text-muted/5 select-none">
          {value}
        </div>
        
        {/* Content */}
        <div className="relative p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            {Icon && (
              <Icon className={cn("h-4 w-4", colorClasses[color].split(" ")[2])} />
            )}
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-bold">{value}</p>
            {change !== undefined && (
              <span className={cn(
                "text-xs font-medium",
                change > 0 ? "text-green-500" : "text-red-500"
              )}>
                {change > 0 ? "+" : ""}{change}%
              </span>
            )}
          </div>
        </div>
      </Card>
    );
  }

  if (variant === "gradient-border") {
    return (
      <div className={cn("relative p-[2px] rounded-xl bg-gradient-to-r", colorClasses[color].split(" ").slice(0, 2).join(" "), className)}>
        <Card className="relative h-full border-0">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              {Icon && (
                <div className={cn("p-2 rounded-lg bg-gradient-to-br", colorClasses[color].split(" ").slice(0, 2).join(" "), "bg-opacity-10")}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
              )}
              {change !== undefined && (
                <span className={cn(
                  "text-xs font-medium px-2 py-1 rounded-full",
                  change > 0 ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400" 
                           : "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400"
                )}>
                  {change > 0 ? "↑" : "↓"} {Math.abs(change)}%
                </span>
              )}
            </div>
            <p className="text-2xl font-bold mb-1">{value}</p>
            <p className="text-sm text-muted-foreground">{title}</p>
          </div>
        </Card>
      </div>
    );
  }

  if (variant === "floating") {
    return (
      <Card className={cn(
        "relative overflow-hidden hover:-translate-y-2 hover:shadow-2xl transition-all duration-300",
        "before:absolute before:inset-0 before:bg-gradient-to-br before:opacity-0 hover:before:opacity-10 before:transition-opacity",
        `before:${colorClasses[color].split(" ").slice(0, 2).join(" ")}`,
        className
      )}>
        <div className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">{title}</p>
              <p className="text-3xl font-bold">{value}</p>
            </div>
            {Icon && (
              <div className="p-3 bg-muted/50 rounded-full">
                <Icon className={cn("h-6 w-6", colorClasses[color].split(" ")[2])} />
              </div>
            )}
          </div>
        </div>
      </Card>
    );
  }

  if (variant === "split") {
    return (
      <Card className={cn("relative overflow-hidden p-0", className)}>
        <div className="flex h-full">
          <div className={cn("w-2 bg-gradient-to-b", colorClasses[color].split(" ").slice(0, 2).join(" "))} />
          <div className="flex-1 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">{title}</p>
                <p className="text-2xl font-bold">{value}</p>
              </div>
              {Icon && <Icon className={cn("h-5 w-5", colorClasses[color].split(" ")[2])} />}
            </div>
          </div>
        </div>
      </Card>
    );
  }

  // Default variant
  return (
    <Card className={cn("p-6", className)}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-muted-foreground">{title}</p>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </div>
      <p className="text-2xl font-bold">{value}</p>
      {change !== undefined && (
        <p className={cn(
          "text-xs mt-1",
          change > 0 ? "text-green-500" : "text-red-500"
        )}>
          {change > 0 ? "+" : ""}{change}% from last period
        </p>
      )}
    </Card>
  );
}