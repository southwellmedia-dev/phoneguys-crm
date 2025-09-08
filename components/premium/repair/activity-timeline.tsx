import { cn } from "@/lib/utils";
import { LucideIcon, User, Wrench, Phone, MessageSquare, DollarSign, Package, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export interface TimelineEvent {
  id: string;
  type: "status" | "note" | "call" | "payment" | "repair" | "message";
  title: string;
  description?: string;
  timestamp: string;
  user?: {
    name: string;
    avatar?: string;
  };
  metadata?: Record<string, any>;
  highlight?: boolean;
}

export interface ActivityTimelineProps {
  events: TimelineEvent[];
  className?: string;
  variant?: "default" | "compact" | "detailed";
}

export function ActivityTimeline({ events, className, variant = "default" }: ActivityTimelineProps) {
  const getIcon = (type: TimelineEvent["type"]): LucideIcon => {
    const icons = {
      status: CheckCircle,
      note: MessageSquare,
      call: Phone,
      payment: DollarSign,
      repair: Wrench,
      message: MessageSquare,
    };
    return icons[type] || AlertCircle;
  };

  const getIconColor = (type: TimelineEvent["type"]) => {
    const colors = {
      status: "text-green-500 bg-green-100 dark:bg-green-900/20",
      note: "text-blue-500 bg-blue-100 dark:bg-blue-900/20",
      call: "text-purple-500 bg-purple-100 dark:bg-purple-900/20",
      payment: "text-emerald-500 bg-emerald-100 dark:bg-emerald-900/20",
      repair: "text-amber-500 bg-amber-100 dark:bg-amber-900/20",
      message: "text-cyan-500 bg-cyan-100 dark:bg-cyan-900/20",
    };
    return colors[type] || "text-gray-500 bg-gray-100";
  };

  if (variant === "compact") {
    return (
      <div className={cn("space-y-2", className)}>
        {events.map((event) => {
          const Icon = getIcon(event.type);
          return (
            <div key={event.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
              <Icon className="h-4 w-4 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{event.title}</p>
              </div>
              <time className="text-xs text-muted-foreground">{event.timestamp}</time>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className={cn("relative", className)}>
      {/* Events */}
      <div className="space-y-6 relative">
        {events.map((event, index) => {
          const Icon = getIcon(event.type);
          const isLast = index === events.length - 1;
          
          return (
            <div
              key={event.id}
              className={cn(
                "relative flex gap-4",
                event.highlight && "scale-[1.02]"
              )}
            >
              {/* Timeline line segment */}
              {!isLast && (
                <div className="absolute left-6 top-12 w-0.5 h-[calc(100%-48px)] bg-border" />
              )}
              
              {/* Icon */}
              <div className={cn(
                "relative z-10 flex h-12 w-12 items-center justify-center rounded-full",
                getIconColor(event.type),
                event.highlight && "ring-2 ring-primary ring-offset-2"
              )}>
                <Icon className="h-5 w-5" />
              </div>
              
              {/* Content */}
              <div className={cn(
                "flex-1 pb-6",
                variant === "detailed" ? "space-y-3" : "space-y-1"
              )}>
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <p className={cn(
                      "font-medium",
                      event.highlight && "text-primary"
                    )}>
                      {event.title}
                    </p>
                    {event.description && (
                      <p className="text-sm text-muted-foreground">
                        {event.description}
                      </p>
                    )}
                  </div>
                  <time className="text-xs text-muted-foreground whitespace-nowrap">
                    {event.timestamp}
                  </time>
                </div>
                
                {variant === "detailed" && (
                  <>
                    {event.user && (
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center">
                          <User className="h-3 w-3" />
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {event.user.name}
                        </span>
                      </div>
                    )}
                    
                    {event.metadata && Object.keys(event.metadata).length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(event.metadata).map(([key, value]) => (
                          <Badge key={key} variant="soft" color="gray" size="sm">
                            {key}: {value}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}