"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Smartphone,
  Shuffle,
  Package,
  Plus,
  Check,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
interface Device {
  id: string;
  model_name: string;
  manufacturer?: {
    name: string;
  };
}

interface CustomerDevice {
  id: string;
  device_id: string;
  serial_number?: string;
  imei?: string;
  color?: string;
  storage_size?: string;
  condition?: string;
  nickname?: string;
  device?: Device; // Can come as 'device' from some queries
  devices?: Device; // Can come as 'devices' from other queries (when using device_id alias)
}

interface DeviceSelectorProps {
  // Device selection
  devices: Device[];
  selectedDeviceId?: string;
  onDeviceChange: (deviceId: string) => void;

  // Customer devices
  customerDevices?: CustomerDevice[];
  selectedCustomerDeviceId?: string;
  onCustomerDeviceChange?: (customerDeviceId: string) => void;

  // Device details
  serialNumber: string;
  onSerialNumberChange: (value: string) => void;
  imei: string;
  onImeiChange: (value: string) => void;
  color: string;
  onColorChange: (value: string) => void;
  storageSize: string;
  onStorageSizeChange: (value: string) => void;
  condition: string;
  onConditionChange: (value: string) => void;

  // Edit mode
  isEditing?: boolean;

  // Test mode (for generating test data)
  testMode?: boolean;
}

export function DeviceSelector({
  devices,
  selectedDeviceId,
  onDeviceChange,
  customerDevices = [],
  selectedCustomerDeviceId,
  onCustomerDeviceChange,
  serialNumber,
  onSerialNumberChange,
  imei,
  onImeiChange,
  color,
  onColorChange,
  storageSize,
  onStorageSizeChange,
  condition,
  onConditionChange,
  isEditing = true,
  testMode = true, // Enable test mode by default for now
}: DeviceSelectorProps) {
  const [deviceSource, setDeviceSource] = React.useState<"new" | "existing">(
    customerDevices.length > 0 && selectedCustomerDeviceId ? "existing" : "new"
  );

  // Prepare device options for combobox
  const deviceOptions: ComboboxOption[] = React.useMemo(
    () =>
      devices.map((device) => ({
        value: device.id,
        label: device.model_name,
        sublabel: device.manufacturer?.name,
      })),
    [devices]
  );

  // Generate test serial number
  const generateTestSerialNumber = () => {
    const prefix = "SN";
    const random = Math.random().toString(36).substring(2, 12).toUpperCase();
    return `${prefix}${random}`;
  };

  // Generate test IMEI
  const generateTestIMEI = () => {
    // Generate a valid-looking IMEI (15 digits)
    const tac = "35698907"; // Type Allocation Code (8 digits)
    const serial = Math.floor(Math.random() * 1000000)
      .toString()
      .padStart(6, "0");
    const checkDigit = Math.floor(Math.random() * 10).toString();
    return `${tac}${serial}${checkDigit}`;
  };

  // Handle customer device selection
  const handleCustomerDeviceSelect = (customerDeviceId: string) => {
    const customerDevice = customerDevices.find(
      (cd) => cd.id === customerDeviceId
    );
    if (customerDevice) {
      // IMPORTANT: Set the device_id from the customer device
      if (customerDevice.device_id) {
        console.log(
          "Setting device_id from customer device:",
          customerDevice.device_id
        );
        onDeviceChange(customerDevice.device_id);
      } else if (customerDevice.devices?.id) {
        // Handle 'devices' property (from device_id alias)
        console.log(
          "Setting device_id from devices property:",
          customerDevice.devices.id
        );
        onDeviceChange(customerDevice.devices.id);
      } else if (customerDevice.device?.id) {
        // Handle 'device' property
        console.log(
          "Setting device_id from device property:",
          customerDevice.device.id
        );
        onDeviceChange(customerDevice.device.id);
      }

      // Set all the device details
      onSerialNumberChange(customerDevice.serial_number || "");
      onImeiChange(customerDevice.imei || "");
      onColorChange(customerDevice.color || "");
      onStorageSizeChange(customerDevice.storage_size || "");
      onConditionChange(customerDevice.condition || "good");

      if (onCustomerDeviceChange) {
        onCustomerDeviceChange(customerDeviceId);
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Smartphone className="h-5 w-5" />
          Device Information
          {isEditing && (
            <Badge variant="secondary" className="ml-2 text-xs">
              Editable
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Device Source Selection (if customer has devices) */}
        {customerDevices.length > 0 && isEditing && (
          <div className="space-y-3">
            <Label>Device Source</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={deviceSource === "existing" ? "default" : "outline"}
                size="sm"
                onClick={() => setDeviceSource("existing")}
                className="flex-1"
              >
                <Package className="mr-2 h-4 w-4" />
                Customer's Devices ({customerDevices.length})
              </Button>
              <Button
                type="button"
                variant={deviceSource === "new" ? "default" : "outline"}
                size="sm"
                onClick={() => setDeviceSource("new")}
                className="flex-1"
              >
                <Plus className="mr-2 h-4 w-4" />
                New Device
              </Button>
            </div>
          </div>
        )}

        {/* Existing Device Selection */}
        {deviceSource === "existing" && customerDevices.length > 0 && (
          <div className="space-y-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
            <Label>Select Customer Device</Label>
            <div className="space-y-2">
              {customerDevices.map((cd) => (
                <div
                  key={cd.id}
                  onClick={() => handleCustomerDeviceSelect(cd.id)}
                  className={cn(
                    "p-3 border rounded-lg cursor-pointer transition-colors",
                    selectedCustomerDeviceId === cd.id
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
                      : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="font-medium">
                        {cd.nickname ||
                          cd.devices?.model_name ||
                          cd.device?.model_name ||
                          "Unknown Device"}
                      </div>
                      {(cd.devices?.manufacturer?.name ||
                        cd.device?.manufacturer?.name) && (
                        <div className="text-sm text-muted-foreground">
                          {cd.devices?.manufacturer?.name ||
                            cd.device?.manufacturer?.name}
                        </div>
                      )}
                      <div className="flex gap-2 text-xs text-muted-foreground">
                        {cd.serial_number && (
                          <span>SN: {cd.serial_number}</span>
                        )}
                        {cd.color && <span>• {cd.color}</span>}
                        {cd.storage_size && <span>• {cd.storage_size}</span>}
                      </div>
                    </div>
                    {selectedCustomerDeviceId === cd.id && (
                      <Check className="h-5 w-5 text-blue-500" />
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <AlertCircle className="h-3 w-3" />
              <span>
                Device details will be auto-filled from customer profile
              </span>
            </div>
          </div>
        )}

        {/* New Device Entry */}
        {deviceSource === "new" && (
          <>
            <div className="space-y-2">
              <Label>Device Model</Label>
              {isEditing ? (
                <Combobox
                  options={deviceOptions}
                  value={selectedDeviceId || ""}
                  onValueChange={onDeviceChange}
                  placeholder="Search and select device model..."
                  searchPlaceholder="Type to search devices..."
                  emptyText="No devices found. Try a different search."
                />
              ) : (
                <p className="font-medium mt-1">
                  {(() => {
                    // First try to get device name from selected customer device
                    if (
                      selectedCustomerDeviceId &&
                      customerDevices.length > 0
                    ) {
                      const customerDevice = customerDevices.find(
                        (cd) => cd.id === selectedCustomerDeviceId
                      );
                      if (customerDevice) {
                        // Try different property paths for the device name
                        const deviceName =
                          customerDevice.nickname ||
                          customerDevice.devices?.model_name ||
                          customerDevice.device?.model_name ||
                          "Device information not available";
                        const manufacturer =
                          customerDevice.devices?.manufacturer?.name ||
                          customerDevice.device?.manufacturer?.name ||
                          "";
                        return manufacturer
                          ? `${manufacturer} ${deviceName}`
                          : deviceName;
                      }
                    }
                    // Otherwise, try to find in the devices list
                    const device = devices.find(
                      (d) => d.id === selectedDeviceId
                    );
                    if (device) {
                      return device.manufacturer?.name
                        ? `${device.manufacturer.name} ${device.model_name}`
                        : device.model_name;
                    }
                    return "Not specified";
                  })()}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Serial Number</Label>
                  {testMode && isEditing && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        onSerialNumberChange(generateTestSerialNumber())
                      }
                      className="h-6 px-2 text-xs"
                    >
                      <Shuffle className="mr-1 h-3 w-3" />
                      Test
                    </Button>
                  )}
                </div>
                {isEditing ? (
                  <Input
                    value={serialNumber}
                    onChange={(e) => onSerialNumberChange(e.target.value)}
                    placeholder="Enter serial number"
                  />
                ) : (
                  <p className="font-medium mt-1">
                    {serialNumber || "Not provided"}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>IMEI</Label>
                  {testMode && isEditing && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => onImeiChange(generateTestIMEI())}
                      className="h-6 px-2 text-xs"
                    >
                      <Shuffle className="mr-1 h-3 w-3" />
                      Test
                    </Button>
                  )}
                </div>
                {isEditing ? (
                  <Input
                    value={imei}
                    onChange={(e) => onImeiChange(e.target.value)}
                    placeholder="Enter IMEI"
                  />
                ) : (
                  <p className="font-medium mt-1">{imei || "Not provided"}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Color</Label>
                {isEditing ? (
                  <Input
                    value={color}
                    onChange={(e) => onColorChange(e.target.value)}
                    placeholder="Enter color"
                  />
                ) : (
                  <p className="font-medium mt-1">{color || "Not specified"}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Storage Size</Label>
                {isEditing ? (
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
                ) : (
                  <p className="font-medium mt-1">
                    {storageSize || "Not specified"}
                  </p>
                )}
              </div>
            </div>
          </>
        )}

        {/* Device Condition (always shown) */}
        <div className="space-y-2">
          <Label>Device Condition</Label>
          {isEditing ? (
            <Select value={condition} onValueChange={onConditionChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="excellent">Excellent - Like New</SelectItem>
                <SelectItem value="good">Good - Minor Wear</SelectItem>
                <SelectItem value="fair">Fair - Visible Wear</SelectItem>
                <SelectItem value="poor">Poor - Heavy Wear</SelectItem>
                <SelectItem value="broken">Broken - Non-functional</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <p className="font-medium mt-1 capitalize">{condition}</p>
          )}
        </div>

        {/* Test Mode Indicator */}
        {testMode && isEditing && (
          <div className="p-2 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <div className="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-400">
              <AlertCircle className="h-3 w-3" />
              <span>
                Test mode enabled - Random test data generators available
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
