"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Wrench, Clock, DollarSign, Package, AlertCircle, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SummaryRepairService {
  id: string;
  name: string;
  description?: string;
  unit_price: number;
  quantity: number;
  estimated_minutes?: number;
  status?: "pending" | "in_progress" | "completed";
  parts_required?: string[];
  warranty_days?: number;
}

export interface RepairServicesSummaryProps {
  services: SummaryRepairService[];
  variant?: "default" | "elevated" | "glass" | "compact" | "gradient" | "cyan" | "priority";
  showServiceDetails?: boolean;
  showTotals?: boolean;
  onServiceClick?: (service: SummaryRepairService) => void;
  onEditServices?: () => void;
  className?: string;
}

export function RepairServicesSummary({
  services,
  variant = "default",
  showServiceDetails = true,
  showTotals = true,
  onServiceClick,
  onEditServices,
  className
}: RepairServicesSummaryProps) {
  const totalAmount = services.reduce((sum, service) => sum + (service.unit_price * service.quantity), 0);
  const totalTime = services.reduce((sum, service) => sum + ((service.estimated_minutes || 0) * service.quantity), 0);
  const completedServices = services.filter(s => s.status === "completed").length;
  
  const getStatusColor = (status?: string) => {
    switch (status) {
      case "completed": return "green";
      case "in_progress": return "blue";
      case "pending": return "amber";
      default: return "gray";
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case "completed": return <CheckCircle className="h-3 w-3" />;
      case "in_progress": return <Clock className="h-3 w-3" />;
      case "pending": return <AlertCircle className="h-3 w-3" />;
      default: return <Package className="h-3 w-3" />;
    }
  };

  // Priority variant - Solid cyan for urgent repairs
  if (variant === "priority" || variant === "cyan") {
    const urgentServices = services.filter(s => s.status === "pending").length;
    return (
      <Card variant="solid" color="cyan" className={cn("overflow-hidden", className)}>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-xl">
                <Wrench className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl text-white">Priority Repair Services</CardTitle>
                <p className="text-sm text-white/80 mt-1">
                  {urgentServices > 0 ? `${urgentServices} urgent services pending` : 'All services on track'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-white">${totalAmount.toFixed(2)}</div>
              <div className="text-sm text-white/70">Total Value</div>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-3">
            {services.slice(0, 3).map((service, index) => (
              <div
                key={service.id}
                className="flex items-center justify-between p-3 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20"
              >
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-sm font-medium text-white">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-white">{service.name}</p>
                    {service.status && (
                      <div className="flex items-center gap-2 mt-1">
                        {getStatusIcon(service.status)}
                        <span className="text-xs text-white/70 capitalize">{service.status.replace('_', ' ')}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-white">${(service.unit_price * service.quantity).toFixed(2)}</p>
                </div>
              </div>
            ))}
            
            {services.length > 3 && (
              <div className="text-center pt-2">
                <p className="text-sm text-white/70">+{services.length - 3} more services</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Gradient variant - Modern premium look
  if (variant === "gradient") {
    return (
      <Card variant="gradient" className={cn("overflow-hidden", className)}>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/20 rounded-xl">
                <Wrench className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl">Service Package</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {services.length} premium services • {Math.ceil(totalTime / 60)}h estimated
                </p>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Premium service showcase */}
          <div className="grid gap-3">
            {services.map((service) => (
              <div key={service.id} className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-primary/5 to-transparent border">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-2 h-8 rounded-full",
                    service.status === "completed" ? "bg-green-500" :
                    service.status === "in_progress" ? "bg-blue-500" : "bg-amber-500"
                  )} />
                  <div>
                    <p className="font-medium">{service.name}</p>
                    <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                      {service.estimated_minutes && <span>{service.estimated_minutes}min</span>}
                      {service.warranty_days && <span>{service.warranty_days}d warranty</span>}
                    </div>
                  </div>
                </div>
                <p className="font-semibold">${(service.unit_price * service.quantity).toFixed(2)}</p>
              </div>
            ))}
          </div>

          {showTotals && (
            <div className="pt-4 border-t bg-gradient-to-r from-primary/10 to-primary/5 -mx-6 px-6 mt-6">
              <div className="flex justify-between items-center py-3">
                <div className="text-sm font-medium">Package Total</div>
                <div className="text-xl font-bold text-primary">${totalAmount.toFixed(2)}</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  if (variant === "compact") {
    return (
      <Card variant="elevated" className={cn("p-4", className)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10">
              <Wrench className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">{services.length} Services</h3>
              <p className="text-sm text-muted-foreground">${totalAmount.toFixed(2)} total</p>
            </div>
          </div>
          <Badge variant="soft" color={completedServices === services.length ? "green" : "blue"}>
            {completedServices}/{services.length} Complete
          </Badge>
        </div>
      </Card>
    );
  }

  // Default and other variants
  return (
    <Card variant={variant} className={cn("overflow-hidden", className)}>
      
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl">
              <Wrench className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">Repair Services</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {services.length} service{services.length !== 1 ? 's' : ''} selected
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge 
              variant="soft" 
              color={completedServices === services.length ? "green" : completedServices > 0 ? "blue" : "amber"}
            >
              {completedServices === services.length ? "All Complete" : `${completedServices}/${services.length} Done`}
            </Badge>
            {onEditServices && (
              <Button variant="outline" size="sm" onClick={onEditServices}>
                Edit Services
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Services List */}
        <div className="space-y-3">
          {services.map((service, index) => (
            <div
              key={service.id}
              className={cn(
                "flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors",
                onServiceClick && "cursor-pointer"
              )}
              onClick={() => onServiceClick?.(service)}
            >
              <div className="flex items-center gap-3 flex-1">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                  {index + 1}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium truncate">{service.name}</p>
                    {service.status && (
                      <Badge variant="soft" color={getStatusColor(service.status)} size="sm">
                        {getStatusIcon(service.status)}
                        <span className="ml-1 capitalize">{service.status.replace('_', ' ')}</span>
                      </Badge>
                    )}
                  </div>
                  
                  {showServiceDetails && (
                    <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                      {service.quantity > 1 && <span>Qty: {service.quantity}</span>}
                      {service.estimated_minutes && <span>{service.estimated_minutes * service.quantity}min</span>}
                      {service.warranty_days && <span>{service.warranty_days}d warranty</span>}
                    </div>
                  )}
                </div>
              </div>

              <div className="text-right">
                <p className="font-semibold">${(service.unit_price * service.quantity).toFixed(2)}</p>
                {service.quantity > 1 && (
                  <p className="text-xs text-muted-foreground">${service.unit_price.toFixed(2)} × {service.quantity}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        {showTotals && (
          <div className="pt-4 border-t">
            <div className="flex justify-between items-center">
              <div className="text-sm text-muted-foreground">
                {services.length} service{services.length !== 1 ? 's' : ''}
                {totalTime > 0 && <span> • {Math.ceil(totalTime / 60)}h {totalTime % 60}m estimated</span>}
              </div>
              <div className="text-right">
                <p className="text-lg font-bold">${totalAmount.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}