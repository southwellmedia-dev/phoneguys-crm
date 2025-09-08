import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Smartphone, Battery, Wifi, Camera, Speaker, Shield, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PhoneDetailCardProps {
  device: {
    brand: string;
    model: string;
    color?: string;
    storage?: string;
    imei?: string;
    condition?: "excellent" | "good" | "fair" | "poor";
    image?: string;
  };
  issues?: string[];
  warranty?: {
    status: "active" | "expired" | "none";
    expiresAt?: string;
  };
  className?: string;
}

export function PhoneDetailCard({ device, issues = [], warranty, className }: PhoneDetailCardProps) {
  const conditionColors = {
    excellent: "text-green-500",
    good: "text-blue-500",
    fair: "text-amber-500",
    poor: "text-red-500",
  };

  const getDeviceIcon = (brand: string) => {
    // In a real app, you might have brand-specific icons
    return <Smartphone className="h-8 w-8" />;
  };

  return (
    <Card className={cn("relative overflow-hidden", className)}>
      {/* Gradient background accent */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-radial from-primary/10 to-transparent" />
      
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl">
              {getDeviceIcon(device.brand)}
            </div>
            <div>
              <CardTitle className="text-2xl">
                {device.brand} {device.model}
              </CardTitle>
              <div className="flex gap-2 mt-2">
                {device.color && (
                  <Badge variant="soft" color="gray" size="sm">
                    {device.color}
                  </Badge>
                )}
                {device.storage && (
                  <Badge variant="soft" color="blue" size="sm">
                    {device.storage}
                  </Badge>
                )}
                {device.condition && (
                  <Badge variant="outline" className={conditionColors[device.condition]} size="sm">
                    {device.condition}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          {warranty && (
            <div className="text-right">
              <Badge 
                variant={warranty.status === "active" ? "soft" : "outline"}
                color={warranty.status === "active" ? "green" : "gray"}
              >
                <Shield className="h-3 w-3 mr-1" />
                {warranty.status === "active" ? "Under Warranty" : "No Warranty"}
              </Badge>
              {warranty.expiresAt && (
                <p className="text-xs text-muted-foreground mt-1">
                  Expires: {warranty.expiresAt}
                </p>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {device.imei && (
          <div className="p-3 bg-muted/50 rounded-lg font-mono text-sm">
            IMEI: {device.imei}
          </div>
        )}
        
        {issues.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <Wrench className="h-4 w-4 text-primary" />
              Reported Issues
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {issues.map((issue, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="h-1.5 w-1.5 rounded-full bg-red-500" />
                  {issue}
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className="flex gap-2 pt-2">
          <Button size="sm" variant="outline">
            View History
          </Button>
          <Button size="sm" variant="outline">
            Check Parts
          </Button>
          <Button size="sm" variant="gradient">
            Start Diagnostic
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}