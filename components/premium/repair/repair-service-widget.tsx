import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, DollarSign, Zap, Shield, Star, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

export interface RepairService {
  id: string;
  name: string;
  price: number;
  estimatedTime: string;
  popularity?: "high" | "medium" | "low";
  warranty?: string;
  inStock?: boolean;
  discount?: number;
}

export interface RepairServiceWidgetProps {
  services: RepairService[];
  selectedIds?: string[];
  onSelect?: (id: string) => void;
  className?: string;
  variant?: "grid" | "list" | "compact";
}

export function RepairServiceWidget({
  services,
  selectedIds = [],
  onSelect,
  className,
  variant = "grid"
}: RepairServiceWidgetProps) {
  
  if (variant === "list") {
    return (
      <div className={cn("space-y-2", className)}>
        {services.map((service) => {
          const isSelected = selectedIds.includes(service.id);
          const finalPrice = service.discount 
            ? service.price * (1 - service.discount / 100)
            : service.price;
            
          return (
            <Card
              key={service.id}
              className={cn(
                "cursor-pointer transition-all duration-200",
                isSelected && "ring-2 ring-primary",
                !service.inStock && "opacity-60"
              )}
              onClick={() => onSelect?.(service.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "h-10 w-10 rounded-lg flex items-center justify-center",
                      isSelected ? "bg-primary text-white" : "bg-muted"
                    )}>
                      <Shield className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{service.name}</h4>
                        {service.popularity === "high" && (
                          <Badge variant="soft" color="amber" size="sm">
                            <TrendingUp className="h-3 w-3 mr-1" />
                            Popular
                          </Badge>
                        )}
                        {!service.inStock && (
                          <Badge variant="soft" color="red" size="sm">
                            Out of Stock
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {service.estimatedTime}
                        </span>
                        {service.warranty && (
                          <span className="text-sm text-muted-foreground flex items-center gap-1">
                            <Shield className="h-3 w-3" />
                            {service.warranty}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    {service.discount ? (
                      <div>
                        <p className="text-sm text-muted-foreground line-through">
                          ${service.price}
                        </p>
                        <p className="text-lg font-bold text-green-600">
                          ${finalPrice.toFixed(2)}
                        </p>
                        <Badge variant="soft" color="green" size="sm">
                          {service.discount}% OFF
                        </Badge>
                      </div>
                    ) : (
                      <p className="text-lg font-bold">${service.price}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <div className={cn("grid gap-2", className)}>
        {services.map((service) => {
          const isSelected = selectedIds.includes(service.id);
          
          return (
            <div
              key={service.id}
              className={cn(
                "p-3 rounded-lg border cursor-pointer transition-all",
                isSelected ? "bg-primary/10 border-primary" : "hover:bg-muted/50",
                !service.inStock && "opacity-60"
              )}
              onClick={() => onSelect?.(service.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    readOnly
                    className="h-4 w-4"
                  />
                  <span className="text-sm font-medium">{service.name}</span>
                  {service.popularity === "high" && (
                    <Star className="h-3 w-3 text-amber-500" />
                  )}
                </div>
                <span className="text-sm font-bold">${service.price}</span>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Grid variant (default)
  return (
    <div className={cn("grid gap-4 md:grid-cols-2 lg:grid-cols-3", className)}>
      {services.map((service) => {
        const isSelected = selectedIds.includes(service.id);
        const finalPrice = service.discount 
          ? service.price * (1 - service.discount / 100)
          : service.price;
          
        return (
          <Card
            key={service.id}
            className={cn(
              "relative cursor-pointer transition-all duration-200 hover:shadow-lg",
              isSelected && "ring-2 ring-primary shadow-lg",
              !service.inStock && "opacity-60"
            )}
            onClick={() => onSelect?.(service.id)}
          >
            {service.discount && (
              <div className="absolute -top-2 -right-2 z-10">
                <Badge variant="solid" color="red" className="shadow-lg">
                  {service.discount}% OFF
                </Badge>
              </div>
            )}
            
            {service.popularity === "high" && (
              <div className="absolute top-4 left-4">
                <Badge variant="soft" color="amber" size="sm">
                  <Zap className="h-3 w-3 mr-1" />
                  Most Popular
                </Badge>
              </div>
            )}
            
            <CardHeader className={cn(
              service.popularity === "high" && "pt-12"
            )}>
              <CardTitle className="flex items-center justify-between">
                <span>{service.name}</span>
                <div className={cn(
                  "h-8 w-8 rounded-full flex items-center justify-center",
                  isSelected ? "bg-primary text-white" : "bg-muted"
                )}>
                  {isSelected ? "✓" : ""}
                </div>
              </CardTitle>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-2xl font-bold">
                    {service.discount ? (
                      <>
                        <span className="text-green-600">${finalPrice.toFixed(2)}</span>
                        <span className="text-sm text-muted-foreground line-through ml-2">
                          ${service.price}
                        </span>
                      </>
                    ) : (
                      <span>${service.price}</span>
                    )}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {service.estimatedTime}
                </span>
                {service.warranty && (
                  <span className="flex items-center gap-1">
                    <Shield className="h-4 w-4" />
                    {service.warranty}
                  </span>
                )}
              </div>
              
              {!service.inStock && (
                <Badge variant="soft" color="red" className="w-full justify-center">
                  Parts Out of Stock
                </Badge>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}