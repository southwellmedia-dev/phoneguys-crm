"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Smartphone, 
  Package, 
  Plus,
  Check,
  Shuffle,
  Star,
  Shield,
  Zap
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface Device {
  id: string;
  model_name: string;
  manufacturer?: {
    name: string;
  };
}

export interface CustomerDevice {
  id: string;
  device_id: string;
  serial_number?: string;
  imei?: string;
  color?: string;
  storage_size?: string;
  condition?: "excellent" | "good" | "fair" | "poor" | "broken";
  nickname?: string;
  device?: Device;
  devices?: Device;
}

export interface DeviceSelectorProps {
  devices: Device[];
  selectedDeviceId?: string;
  onDeviceChange: (deviceId: string) => void;
  customerDevices?: CustomerDevice[];
  selectedCustomerDeviceId?: string;
  onCustomerDeviceChange?: (customerDeviceId: string) => void;
  serialNumber?: string;
  onSerialNumberChange?: (value: string) => void;
  imei?: string;
  onImeiChange?: (value: string) => void;
  color?: string;
  onColorChange?: (value: string) => void;
  storageSize?: string;
  onStorageSizeChange?: (value: string) => void;
  condition?: string;
  onConditionChange?: (value: string) => void;
  variant?: "default" | "elevated" | "glass" | "compact";
  showTestControls?: boolean;
  className?: string;
}

export function DeviceSelector({
  devices,
  selectedDeviceId,
  onDeviceChange,
  customerDevices = [],
  selectedCustomerDeviceId,
  onCustomerDeviceChange,
  serialNumber = "",
  onSerialNumberChange,
  imei = "",
  onImeiChange,
  color = "",
  onColorChange,
  storageSize = "",
  onStorageSizeChange,
  condition = "good",
  onConditionChange,
  variant = "default",
  showTestControls = false,
  className
}: DeviceSelectorProps) {
  const [deviceSource, setDeviceSource] = React.useState<'new' | 'existing'>(
    customerDevices.length > 0 && selectedCustomerDeviceId ? 'existing' : 'new'
  );

  const deviceOptions: ComboboxOption[] = React.useMemo(() => 
    devices.map(device => ({
      value: device.id,
      label: device.model_name,
      sublabel: device.manufacturer?.name
    })), [devices]
  );

  const generateTestSerialNumber = () => {
    const prefix = "SN";
    const random = Math.random().toString(36).substring(2, 12).toUpperCase();
    return `${prefix}${random}`;
  };

  const generateTestIMEI = () => {
    const tac = "35698907";
    const serial = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    const checkDigit = Math.floor(Math.random() * 10).toString();
    return `${tac}${serial}${checkDigit}`;
  };

  const handleCustomerDeviceSelect = (customerDeviceId: string) => {
    const customerDevice = customerDevices.find(cd => cd.id === customerDeviceId);
    if (customerDevice) {
      if (customerDevice.device_id) {
        onDeviceChange(customerDevice.device_id);
      } else if (customerDevice.devices?.id) {
        onDeviceChange(customerDevice.devices.id);
      } else if (customerDevice.device?.id) {
        onDeviceChange(customerDevice.device.id);
      }
      
      onSerialNumberChange?.(customerDevice.serial_number || '');
      onImeiChange?.(customerDevice.imei || '');
      onColorChange?.(customerDevice.color || '');
      onStorageSizeChange?.(customerDevice.storage_size || '');
      onConditionChange?.(customerDevice.condition || 'good');
      onCustomerDeviceChange?.(customerDeviceId);
    }
  };

  const getConditionColor = (cond: string) => {
    switch (cond) {
      case "excellent": return "green";
      case "good": return "blue";
      case "fair": return "amber";
      case "poor": return "red";
      case "broken": return "red";
      default: return "gray";
    }
  };

  const getConditionIcon = (cond: string) => {
    switch (cond) {
      case "excellent": return <Star className="h-3 w-3" />;
      case "good": return <Shield className="h-3 w-3" />;
      case "fair": return <Zap className="h-3 w-3" />;
      default: return null;
    }
  };

  if (variant === "compact") {
    return (
      <Card variant="elevated" className={cn("p-4", className)}>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10">
              <Smartphone className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">Device Selection</h3>
              <p className="text-xs text-muted-foreground">Choose or add device</p>
            </div>
          </div>
          
          <Combobox
            options={deviceOptions}
            value={selectedDeviceId || ''}
            onValueChange={onDeviceChange}
            placeholder="Search device model..."
            searchPlaceholder="Type to search..."
            emptyText="No devices found"
          />
        </div>
      </Card>
    );
  }

  return (
    <Card variant={variant} className={cn("overflow-hidden", className)}>
      {/* Header */}
      <div className="p-6 bg-gradient-to-r from-primary/5 to-primary/10 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10">
              <Smartphone className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Device Information</h3>
              <p className="text-sm text-muted-foreground">Configure device details</p>
            </div>
          </div>
          {selectedDeviceId && (
            <Badge variant="soft" color="green">
              <Check className="h-3 w-3 mr-1" />
              Selected
            </Badge>
          )}
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Device Source Selection */}
        {customerDevices.length > 0 && (
          <div className="space-y-4">
            <Label className="text-sm font-medium">Device Source</Label>
            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant={deviceSource === 'existing' ? 'solid' : 'outline'}
                color={deviceSource === 'existing' ? 'cyan' : undefined}
                onClick={() => setDeviceSource('existing')}
                className="justify-start"
              >
                <Package className="mr-2 h-4 w-4" />
                Existing ({customerDevices.length})
              </Button>
              <Button
                type="button"
                variant={deviceSource === 'new' ? 'solid' : 'outline'}
                color={deviceSource === 'new' ? 'cyan' : undefined}
                onClick={() => setDeviceSource('new')}
                className="justify-start"
              >
                <Plus className="mr-2 h-4 w-4" />
                New Device
              </Button>
            </div>
          </div>
        )}

        {/* Existing Device Selection */}
        {deviceSource === 'existing' && customerDevices.length > 0 && (
          <div className="space-y-4">
            <Label className="text-sm font-medium">Customer Devices</Label>
            <div className="grid gap-3">
              {customerDevices.map((cd) => (
                <Card
                  key={cd.id}
                  variant={selectedCustomerDeviceId === cd.id ? "solid" : "outline"}
                  color={selectedCustomerDeviceId === cd.id ? "cyan" : undefined}
                  className={cn(
                    "p-4 cursor-pointer transition-all hover:shadow-md",
                    selectedCustomerDeviceId !== cd.id && "hover:border-primary/50"
                  )}
                  onClick={() => handleCustomerDeviceSelect(cd.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className={cn(
                        "font-medium",
                        selectedCustomerDeviceId === cd.id && "text-white"
                      )}>
                        {cd.nickname || cd.devices?.model_name || cd.device?.model_name || 'Unknown Device'}
                      </div>
                      {(cd.devices?.manufacturer?.name || cd.device?.manufacturer?.name) && (
                        <div className={cn(
                          "text-sm",
                          selectedCustomerDeviceId === cd.id ? "text-white/80" : "text-muted-foreground"
                        )}>
                          {cd.devices?.manufacturer?.name || cd.device?.manufacturer?.name}
                        </div>
                      )}
                      <div className={cn(
                        "flex gap-3 text-xs",
                        selectedCustomerDeviceId === cd.id ? "text-white/70" : "text-muted-foreground"
                      )}>
                        {cd.color && <span>{cd.color}</span>}
                        {cd.storage_size && <span>• {cd.storage_size}</span>}
                        {cd.condition && (
                          <div className="flex items-center gap-1">
                            <span>•</span>
                            {getConditionIcon(cd.condition)}
                            <span className="capitalize">{cd.condition}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    {selectedCustomerDeviceId === cd.id && (
                      <Check className="h-5 w-5 text-white" />
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* New Device Entry */}
        {deviceSource === 'new' && (
          <div className="space-y-6">
            {/* Device Model */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Device Model</Label>
              <Combobox
                options={deviceOptions}
                value={selectedDeviceId || ''}
                onValueChange={onDeviceChange}
                placeholder="Search and select device model..."
                searchPlaceholder="Type to search devices..."
                emptyText="No devices found. Try a different search."
              />
            </div>

            {/* Device Details Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Serial Number</Label>
                  {showTestControls && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => onSerialNumberChange?.(generateTestSerialNumber())}
                      className="h-6 px-2 text-xs"
                    >
                      <Shuffle className="mr-1 h-3 w-3" />
                      Test
                    </Button>
                  )}
                </div>
                <Input
                  value={serialNumber}
                  onChange={(e) => onSerialNumberChange?.(e.target.value)}
                  placeholder="Enter serial number"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">IMEI</Label>
                  {showTestControls && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => onImeiChange?.(generateTestIMEI())}
                      className="h-6 px-2 text-xs"
                    >
                      <Shuffle className="mr-1 h-3 w-3" />
                      Test
                    </Button>
                  )}
                </div>
                <Input
                  value={imei}
                  onChange={(e) => onImeiChange?.(e.target.value)}
                  placeholder="Enter IMEI"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Color</Label>
                <Input
                  value={color}
                  onChange={(e) => onColorChange?.(e.target.value)}
                  placeholder="Enter color"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Storage Size</Label>
                <Select 
                  value={storageSize}
                  onValueChange={onStorageSizeChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select storage" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="16GB">16GB</SelectItem>
                    <SelectItem value="32GB">32GB</SelectItem>
                    <SelectItem value="64GB">64GB</SelectItem>
                    <SelectItem value="128GB">128GB</SelectItem>
                    <SelectItem value="256GB">256GB</SelectItem>
                    <SelectItem value="512GB">512GB</SelectItem>
                    <SelectItem value="1TB">1TB</SelectItem>
                    <SelectItem value="2TB">2TB</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Device Condition */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Device Condition</Label>
              <Select 
                value={condition}
                onValueChange={onConditionChange}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="excellent">
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-green-500" />
                      <span>Excellent - Like New</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="good">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-blue-500" />
                      <span>Good - Minor Wear</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="fair">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-amber-500" />
                      <span>Fair - Visible Wear</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="poor">Poor - Heavy Wear</SelectItem>
                  <SelectItem value="broken">Broken - Non-functional</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Current Selection Summary */}
            {(selectedDeviceId || serialNumber || imei) && (
              <Card variant="soft" className="p-4">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  Device Summary
                </h4>
                <div className="space-y-2 text-sm">
                  {selectedDeviceId && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Model:</span>
                      <span className="font-medium">
                        {devices.find(d => d.id === selectedDeviceId)?.model_name || 'Selected'}
                      </span>
                    </div>
                  )}
                  {serialNumber && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Serial:</span>
                      <span className="font-mono text-xs">{serialNumber}</span>
                    </div>
                  )}
                  {color && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Color:</span>
                      <span>{color}</span>
                    </div>
                  )}
                  {condition && (
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Condition:</span>
                      <Badge variant="soft" color={getConditionColor(condition)} size="sm">
                        {getConditionIcon(condition)}
                        <span className="ml-1 capitalize">{condition}</span>
                      </Badge>
                    </div>
                  )}
                </div>
              </Card>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}