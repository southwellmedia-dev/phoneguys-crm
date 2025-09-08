"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Zap, 
  Mail, 
  Phone, 
  MessageSquare,
  Printer,
  Download,
  Upload,
  Edit,
  Copy,
  ExternalLink,
  RefreshCw,
  Archive,
  Trash2,
  AlertCircle,
  CheckCircle,
  Clock,
  DollarSign,
  FileText,
  Settings,
  Share
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  description?: string;
  variant?: "default" | "primary" | "success" | "warning" | "destructive" | "outline" | "ghost";
  color?: "cyan" | "green" | "red" | "amber" | "blue" | "purple" | "gray";
  disabled?: boolean;
  loading?: boolean;
  badge?: string | number;
  shortcut?: string;
  onClick: () => void;
}

export interface QuickActionsProps {
  actions: QuickAction[];
  variant?: "default" | "elevated" | "glass" | "grid" | "list" | "premium" | "minimal";
  columns?: 2 | 3 | 4;
  showDescriptions?: boolean;
  showShortcuts?: boolean;
  title?: string;
  className?: string;
}

export function QuickActions({
  actions,
  variant = "default",
  columns = 2,
  showDescriptions = true,
  showShortcuts = false,
  title = "Quick Actions",
  className
}: QuickActionsProps) {
  
  const getActionVariant = (action: QuickAction) => {
    if (action.variant) return action.variant;
    if (action.disabled) return "ghost";
    return "outline";
  };

  // Premium glass variant - Modern floating actions
  if (variant === "glass") {
    return (
      <Card variant="glass" className={cn("backdrop-blur-md border-white/20", className)}>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="p-2 rounded-lg bg-gradient-to-br from-primary/30 to-primary/20 backdrop-blur-sm">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">{title}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {actions.length} quick actions available
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {actions.map((action) => (
              <Button
                key={action.id}
                variant="glass"
                onClick={action.onClick}
                disabled={action.disabled}
                loading={action.loading}
                className={cn(
                  "h-16 flex-col gap-2 bg-white/5 backdrop-blur-sm border-white/20 hover:bg-white/10 transition-all",
                  action.color === "green" && "hover:border-green-400/50",
                  action.color === "blue" && "hover:border-blue-400/50",
                  action.color === "red" && "hover:border-red-400/50",
                  action.disabled && "opacity-50"
                )}
              >
                <div className={cn(
                  "p-2 rounded-lg transition-colors",
                  action.color === "green" && "bg-green-500/20 text-green-400",
                  action.color === "blue" && "bg-blue-500/20 text-blue-400",
                  action.color === "red" && "bg-red-500/20 text-red-400",
                  !action.color && "bg-primary/20 text-primary"
                )}>
                  {action.icon}
                </div>
                <span className="text-xs font-medium">{action.label}</span>
                {action.badge && (
                  <div className="absolute -top-1 -right-1">
                    <Badge variant="solid" color="red" size="sm">
                      {action.badge}
                    </Badge>
                  </div>
                )}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Minimal variant - Clean and focused
  if (variant === "minimal") {
    return (
      <div className={cn("space-y-3", className)}>
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        <div className="flex flex-wrap gap-2">
          {actions.map((action) => (
            <Button
              key={action.id}
              size="sm"
              variant="ghost"
              onClick={action.onClick}
              disabled={action.disabled}
              loading={action.loading}
              className={cn(
                "relative h-10 px-3 hover:bg-primary/10 hover:text-primary transition-colors",
                action.disabled && "opacity-50"
              )}
            >
              {action.icon}
              <span className="ml-2">{action.label}</span>
              {action.badge && (
                <Badge variant="soft" size="sm" className="ml-1">
                  {action.badge}
                </Badge>
              )}
            </Button>
          ))}
        </div>
      </div>
    );
  }

  if (variant === "list") {
    return (
      <Card variant="elevated" className={cn("", className)}>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <CardTitle className="text-lg">{title}</CardTitle>
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-2">
            {actions.map((action) => (
              <Button
                key={action.id}
                variant={getActionVariant(action)}
                color={action.color}
                onClick={action.onClick}
                disabled={action.disabled}
                loading={action.loading}
                className="w-full justify-start h-auto p-3"
              >
                <div className="flex items-center gap-3 w-full">
                  <div className="flex-shrink-0">{action.icon}</div>
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <span>{action.label}</span>
                      {action.badge && (
                        <Badge variant="soft" size="sm">
                          {action.badge}
                        </Badge>
                      )}
                    </div>
                    {showDescriptions && action.description && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {action.description}
                      </p>
                    )}
                  </div>
                  {showShortcuts && action.shortcut && (
                    <Badge variant="outline" size="sm" className="text-xs">
                      {action.shortcut}
                    </Badge>
                  )}
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (variant === "grid") {
    return (
      <Card variant="elevated" className={cn("overflow-hidden", className)}>
        
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl">
              <Zap className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">{title}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {actions.length} action{actions.length !== 1 ? 's' : ''} available
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className={cn(
            "grid gap-4",
            columns === 2 && "grid-cols-2",
            columns === 3 && "grid-cols-3",
            columns === 4 && "grid-cols-4"
          )}>
            {actions.map((action) => (
              <Card
                key={action.id}
                variant="soft"
                className={cn(
                  "group relative p-4 cursor-pointer transition-all hover:shadow-md hover:-translate-y-1",
                  action.disabled && "opacity-50 cursor-not-allowed",
                  !action.disabled && "hover:border-primary/50"
                )}
                onClick={action.disabled ? undefined : action.onClick}
              >
                {action.badge && (
                  <div className="absolute -top-2 -right-2">
                    <Badge variant="solid" color="red" size="sm">
                      {action.badge}
                    </Badge>
                  </div>
                )}

                <div className="text-center space-y-3">
                  <div className={cn(
                    "mx-auto w-12 h-12 rounded-xl flex items-center justify-center transition-all",
                    action.disabled 
                      ? "bg-muted" 
                      : "bg-gradient-to-br from-primary/20 to-primary/10 group-hover:from-primary/30 group-hover:to-primary/20"
                  )}>
                    <div className={cn(
                      "transition-all",
                      action.disabled ? "text-muted-foreground" : "text-primary"
                    )}>
                      {action.icon}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className={cn(
                      "font-medium mb-1",
                      action.disabled ? "text-muted-foreground" : "text-foreground"
                    )}>
                      {action.label}
                    </h4>
                    {showDescriptions && action.description && (
                      <p className="text-xs text-muted-foreground">
                        {action.description}
                      </p>
                    )}
                  </div>

                  {showShortcuts && action.shortcut && (
                    <Badge variant="outline" size="sm" className="text-xs">
                      {action.shortcut}
                    </Badge>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Default compact horizontal layout
  return (
    <Card variant={variant} className={cn("p-4", className)}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10">
            <Zap className="h-4 w-4 text-primary" />
          </div>
          <h3 className="font-semibold">{title}</h3>
        </div>
        <Badge variant="soft" size="sm">
          {actions.length} actions
        </Badge>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {actions.map((action) => (
          <Button
            key={action.id}
            size="sm"
            variant={getActionVariant(action)}
            color={action.color}
            onClick={action.onClick}
            disabled={action.disabled}
            loading={action.loading}
            className="relative"
          >
            {action.icon}
            <span className="ml-2">{action.label}</span>
            {action.badge && (
              <Badge variant="solid" size="sm" className="ml-2">
                {action.badge}
              </Badge>
            )}
          </Button>
        ))}
      </div>
    </Card>
  );
}

// Predefined action sets for common use cases
export const commonActions = {
  customer: [
    {
      id: "email",
      label: "Email Customer",
      icon: <Mail className="h-4 w-4" />,
      description: "Send email to customer",
      color: "blue" as const,
      shortcut: "Ctrl+E"
    },
    {
      id: "call",
      label: "Call Customer", 
      icon: <Phone className="h-4 w-4" />,
      description: "Make phone call",
      color: "green" as const,
      shortcut: "Ctrl+P"
    },
    {
      id: "sms",
      label: "Send SMS",
      icon: <MessageSquare className="h-4 w-4" />,
      description: "Send text message",
      color: "purple" as const
    }
  ],
  
  document: [
    {
      id: "print",
      label: "Print Invoice",
      icon: <Printer className="h-4 w-4" />,
      description: "Print repair invoice"
    },
    {
      id: "download",
      label: "Download PDF",
      icon: <Download className="h-4 w-4" />,
      description: "Download as PDF"
    },
    {
      id: "share",
      label: "Share Link",
      icon: <Share className="h-4 w-4" />,
      description: "Copy shareable link"
    }
  ],

  order: [
    {
      id: "edit",
      label: "Edit Order",
      icon: <Edit className="h-4 w-4" />,
      description: "Modify order details",
      color: "blue" as const
    },
    {
      id: "duplicate",
      label: "Duplicate",
      icon: <Copy className="h-4 w-4" />,
      description: "Create copy of order"
    },
    {
      id: "complete",
      label: "Mark Complete",
      icon: <CheckCircle className="h-4 w-4" />,
      description: "Mark order as completed",
      variant: "primary" as const,
      color: "green" as const
    },
    {
      id: "archive",
      label: "Archive",
      icon: <Archive className="h-4 w-4" />,
      description: "Move to archive"
    }
  ]
};