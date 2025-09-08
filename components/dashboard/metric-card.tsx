import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon, TrendingUp, TrendingDown, ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  priority?: "high" | "medium" | "low";
  variant?: "default" | "solid" | "gradient" | "outlined" | "glass";
  color?: "default" | "cyan" | "red" | "green" | "amber" | "navy" | "purple";
  className?: string;
}

export function MetricCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  priority = "medium",
  variant,
  color,
  className,
}: MetricCardProps) {
  // Determine variant and color based on priority if not explicitly set
  const cardVariant = variant || (priority === "high" ? "solid" : priority === "low" ? "outlined" : "default");
  const cardColor = color || (priority === "high" ? "cyan" : "default");
  
  // Adjust text color for solid cards
  const isInverted = cardVariant === "solid";
  
  return (
    <Card 
      variant={cardVariant as any}
      color={cardColor as any}
      className={cn(
        "relative overflow-hidden group",
        priority === "high" && "hover:-translate-y-1",
        priority === "medium" && "hover:-translate-y-0.5",
        className
      )}
    >
      {/* Subtle background pattern for high priority cards */}
      {priority === "high" && (
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-gradient-glow" />
        </div>
      )}
      
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className={cn(
          "font-semibold uppercase tracking-wider",
          priority === "high" ? "text-sm" : "text-xs",
          isInverted ? "text-white/90" : "text-muted-foreground"
        )}>
          {title}
        </CardTitle>
        {Icon && (
          <div className={cn(
            "rounded-lg transition-all duration-300",
            priority === "high" 
              ? "p-3 bg-white/20 group-hover:bg-white/30" 
              : priority === "medium"
              ? "p-2 bg-primary/10 group-hover:bg-primary/20"
              : "p-2 bg-muted/50 group-hover:bg-muted",
            isInverted && "bg-white/10 group-hover:bg-white/20"
          )}>
            <Icon className={cn(
              priority === "high" ? "h-5 w-5" : "h-4 w-4",
              isInverted ? "text-white" : "text-primary"
            )} />
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-baseline space-x-3">
          <div className={cn(
            "font-bold tracking-tight",
            priority === "high" ? "text-4xl" : priority === "medium" ? "text-3xl" : "text-2xl",
            isInverted && "text-white"
          )}>
            {value}
          </div>
          {trend && (
            <div className={cn(
              "flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs font-medium",
              trend.isPositive 
                ? isInverted 
                  ? "bg-white/20 text-white"
                  : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                : isInverted
                  ? "bg-white/20 text-white"
                  : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
            )}>
              {trend.isPositive ? (
                <ArrowUp className="h-3 w-3" />
              ) : (
                <ArrowDown className="h-3 w-3" />
              )}
              <span>{Math.abs(trend.value)}%</span>
            </div>
          )}
        </div>
        
        {description && (
          <p className={cn(
            "text-sm",
            isInverted ? "text-white/80" : "text-muted-foreground"
          )}>
            {description}
          </p>
        )}
        
        {trend && priority !== "low" && (
          <div className={cn(
            "pt-2 border-t",
            isInverted ? "border-white/20" : "border-border"
          )}>
            <div className="flex items-center justify-between">
              <span className={cn(
                "text-xs",
                isInverted ? "text-white/60" : "text-muted-foreground"
              )}>
                vs. yesterday
              </span>
              <div className={cn(
                "h-1 w-16 rounded-full overflow-hidden",
                isInverted ? "bg-white/20" : "bg-muted"
              )}>
                <div 
                  className={cn(
                    "h-full rounded-full transition-all duration-1000",
                    trend.isPositive 
                      ? isInverted ? "bg-white" : "bg-green-500"
                      : isInverted ? "bg-white" : "bg-red-500"
                  )}
                  style={{ width: `${Math.min(Math.abs(trend.value), 100)}%` }}
                />
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}