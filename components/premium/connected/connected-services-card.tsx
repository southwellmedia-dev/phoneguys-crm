"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { 
  Wrench, 
  Clock, 
  DollarSign,
  AlertCircle,
  CheckCircle,
  Package,
  Zap,
  Shield,
  Cpu
} from "lucide-react";

interface Service {
  id: string;
  service?: {
    name: string;
    category?: string;
    estimated_minutes?: number;
    base_price?: number;
    description?: string;
  };
  unit_price?: number;
  quantity: number;
  technician_notes?: string;
  status?: string;
}

interface ConnectedServicesCardProps {
  services: Service[];
  className?: string;
}

const categoryIcons: Record<string, any> = {
  screen_repair: Zap,
  battery: Shield,
  diagnostic: Cpu,
  software: Package,
  hardware: Wrench,
  default: Wrench
};

const categoryColors: Record<string, string> = {
  screen_repair: "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/20",
  battery: "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/20",
  diagnostic: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/20",
  software: "text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/20",
  hardware: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20",
  default: "text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-950/20"
};

export function ConnectedServicesCard({ services, className }: ConnectedServicesCardProps) {
  if (!services || services.length === 0) {
    return (
      <Card className={cn("relative overflow-hidden", className)}>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="rounded-full bg-muted p-4 mb-4">
            <Wrench className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No Services Added</h3>
          <p className="text-sm text-muted-foreground text-center max-w-sm">
            No repair services have been added to this order yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Calculate totals
  const totalAmount = services.reduce(
    (sum, service) => sum + ((service.unit_price || service.service?.base_price || 0) * service.quantity),
    0
  );

  const totalEstimatedTime = services.reduce(
    (sum, service) => sum + ((service.service?.estimated_minutes || 0) * service.quantity),
    0
  );

  const formatTime = (minutes: number) => {
    if (!minutes) return "0m";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  return (
    <Card className={cn("relative overflow-hidden", className)}>
      <CardHeader className="bg-gradient-to-r from-primary/5 via-primary/3 to-transparent">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Wrench className="h-5 w-5 text-primary" />
            </div>
            Repair Services
          </CardTitle>
          <Badge variant="secondary" className="font-semibold">
            {services.length} {services.length === 1 ? "Service" : "Services"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-6 space-y-4">
        {/* Services List */}
        <div className="space-y-3">
          {services.map((service, index) => {
            const category = service.service?.category || "default";
            const Icon = categoryIcons[category] || categoryIcons.default;
            const colorClass = categoryColors[category] || categoryColors.default;
            
            return (
              <div
                key={service.id || index}
                className="group relative p-4 rounded-xl border bg-gradient-to-r from-background via-background to-muted/30 hover:shadow-md transition-all"
              >
                <div className="flex items-start gap-4">
                  {/* Service Number & Icon */}
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                      {index + 1}
                    </div>
                    <div className={cn("p-2 rounded-lg", colorClass)}>
                      <Icon className="h-4 w-4" />
                    </div>
                  </div>

                  {/* Service Details */}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold text-base">
                          {service.service?.name}
                        </h4>
                        {service.service?.category && (
                          <Badge variant="outline" className="mt-1 text-xs">
                            {service.service.category.replace("_", " ")}
                          </Badge>
                        )}
                      </div>
                      
                      {/* Price */}
                      <div className="text-right">
                        <p className="text-lg font-bold">
                          ${((service.unit_price || service.service?.base_price || 0) * service.quantity).toFixed(2)}
                        </p>
                        {service.quantity > 1 && (
                          <p className="text-xs text-muted-foreground">
                            ${(service.unit_price || service.service?.base_price || 0).toFixed(2)} × {service.quantity}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Service Meta */}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {service.service?.estimated_minutes && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          <span>{formatTime(service.service.estimated_minutes * service.quantity)}</span>
                        </div>
                      )}
                      {service.quantity > 1 && (
                        <Badge variant="secondary" className="text-xs">
                          Qty: {service.quantity}
                        </Badge>
                      )}
                      {service.status && (
                        <div className="flex items-center gap-1">
                          {service.status === "completed" ? (
                            <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                          ) : (
                            <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
                          )}
                          <span className="capitalize">{service.status}</span>
                        </div>
                      )}
                    </div>

                    {/* Technician Notes */}
                    {service.technician_notes && (
                      <div className="mt-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/50">
                        <p className="text-sm">
                          <span className="font-semibold text-amber-700 dark:text-amber-400">Note:</span>{" "}
                          {service.technician_notes}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary Footer */}
        <div className="pt-4 border-t space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Services Total</span>
            <span className="font-medium">{services.length} items</span>
          </div>
          
          {totalEstimatedTime > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                Estimated Time
              </span>
              <span className="font-medium">{formatTime(totalEstimatedTime)}</span>
            </div>
          )}
          
          <div className="flex items-center justify-between pt-2 border-t">
            <span className="text-base font-semibold">Total Amount</span>
            <span className="text-xl font-bold text-primary">
              ${totalAmount.toFixed(2)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}