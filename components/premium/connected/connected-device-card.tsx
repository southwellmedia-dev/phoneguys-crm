"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { 
  Smartphone, 
  Package2, 
  CheckCircle2, 
  AlertCircle,
  Copy,
  Plus,
  Calendar,
  HardDrive,
  Palette,
  Fingerprint,
  Hash
} from "lucide-react";
import { toast } from "sonner";

interface ConnectedDeviceCardProps {
  order: any;
  matchingCustomerDevice?: any;
  onAddToProfile?: () => void;
  className?: string;
}

export function ConnectedDeviceCard({ 
  order, 
  matchingCustomerDevice,
  onAddToProfile,
  className 
}: ConnectedDeviceCardProps) {
  
  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied to clipboard`);
    } catch (error) {
      toast.error("Failed to copy to clipboard");
    }
  };

  const device = order.device;
  const hasDevice = !!device;

  if (!hasDevice) {
    return (
      <Card className={cn("relative overflow-hidden", className)}>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="rounded-full bg-muted p-4 mb-4">
            <Package2 className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No Device Information</h3>
          <p className="text-sm text-muted-foreground text-center max-w-sm">
            This order doesn't have device information associated with it yet.
          </p>
          <Button variant="outline" className="mt-4">
            Add Device Details
          </Button>
        </CardContent>
      </Card>
    );
  }

  const deviceSpecs = [
    {
      icon: Palette,
      label: "Color",
      value: matchingCustomerDevice?.color || order.device_color || "-",
      available: !!(matchingCustomerDevice?.color || order.device_color)
    },
    {
      icon: HardDrive,
      label: "Storage",
      value: matchingCustomerDevice?.storage_size || order.storage_size || "-",
      available: !!(matchingCustomerDevice?.storage_size || order.storage_size)
    },
    {
      icon: Calendar,
      label: "Year",
      value: device.release_year || "-",
      available: !!device.release_year
    },
    {
      icon: Package2,
      label: "Type",
      value: device.device_type || "-",
      available: !!device.device_type
    }
  ];

  const identifiers = [
    {
      icon: Fingerprint,
      label: "IMEI",
      value: order.imei || matchingCustomerDevice?.imei,
      available: !!(order.imei || matchingCustomerDevice?.imei)
    },
    {
      icon: Hash,
      label: "Serial",
      value: order.serial_number || matchingCustomerDevice?.serial_number,
      available: !!(order.serial_number || matchingCustomerDevice?.serial_number)
    }
  ];

  return (
    <Card className={cn(
      "relative overflow-hidden",
      "bg-gradient-to-br from-background via-background to-primary/5",
      className
    )}>
      {/* Status Badge */}
      <div className="absolute top-4 right-4 z-10">
        {matchingCustomerDevice ? (
          <Badge 
            variant="default"
            className="bg-green-500 hover:bg-green-600 text-white font-semibold shadow-lg"
          >
            <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
            IN PROFILE
          </Badge>
        ) : (
          <Badge 
            variant="secondary"
            className="font-semibold shadow-sm"
          >
            <AlertCircle className="h-3.5 w-3.5 mr-1" />
            NOT SAVED
          </Badge>
        )}
      </div>

      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Smartphone className="h-5 w-5 text-primary" />
          </div>
          Device Information
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Device Model Section */}
        <div className="flex items-start gap-4">
          {device.image_url ? (
            <img
              src={device.image_url}
              alt={device.model_name}
              className="w-20 h-20 object-cover rounded-xl shadow-md"
            />
          ) : (
            <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center shadow-inner">
              <Smartphone className="h-8 w-8 text-slate-400" />
            </div>
          )}
          
          <div className="flex-1">
            <h3 className="text-xl font-bold">
              {device.manufacturer?.name} {device.model_name}
            </h3>
            {matchingCustomerDevice?.nickname && (
              <p className="text-sm text-primary font-medium mt-0.5">
                "{matchingCustomerDevice.nickname}"
              </p>
            )}
            
            {/* Parts Availability */}
            {device.parts_availability && (
              <Badge 
                variant="outline"
                className={cn(
                  "mt-2",
                  device.parts_availability === "available" 
                    ? "border-green-500 text-green-600 dark:text-green-400"
                    : device.parts_availability === "limited"
                    ? "border-amber-500 text-amber-600 dark:text-amber-400"
                    : "border-red-500 text-red-600 dark:text-red-400"
                )}
              >
                <div className={cn(
                  "h-2 w-2 rounded-full mr-2",
                  device.parts_availability === "available" ? "bg-green-500"
                    : device.parts_availability === "limited" ? "bg-amber-500"
                    : "bg-red-500"
                )} />
                Parts {device.parts_availability.replace("_", " ")}
              </Badge>
            )}
          </div>
        </div>

        {/* Specifications Grid */}
        <div className="grid grid-cols-2 gap-3">
          {deviceSpecs.filter(spec => spec.available).map((spec, idx) => {
            const Icon = spec.icon;
            return (
              <div 
                key={idx}
                className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border"
              >
                <Icon className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">{spec.label}</p>
                  <p className="text-sm font-semibold truncate">{spec.value}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Identifiers Section */}
        {identifiers.some(id => id.available) && (
          <div className="space-y-2">
            {identifiers.filter(id => id.available).map((identifier, idx) => {
              const Icon = identifier.icon;
              return (
                <div 
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50 border group"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">
                        {identifier.label}
                      </p>
                      <p className="text-sm font-mono font-semibold">
                        {identifier.value}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => copyToClipboard(identifier.value || "", identifier.label)}
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}

        {/* Add to Profile Button */}
        {!matchingCustomerDevice && order.customer_id && device && (
          <Button 
            onClick={onAddToProfile}
            className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
          >
            <Plus className="h-4 w-4 mr-2" />
            Save Device to Customer Profile
          </Button>
        )}
      </CardContent>
    </Card>
  );
}