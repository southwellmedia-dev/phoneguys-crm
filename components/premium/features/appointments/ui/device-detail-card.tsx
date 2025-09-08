'use client';

import * as React from 'react';
import { StatusBadge } from '@/components/premium/ui/badges/status-badge';
import { InputPremium } from '@/components/premium/ui/forms/input-premium';
import { SelectPremium, type SelectOption } from '@/components/premium/ui/forms/select-premium';
import { FormFieldWrapper } from '@/components/premium/ui/forms/form-field-wrapper';
import { cn } from '@/lib/utils';
import { 
  Smartphone,
  HardDrive,
  Palette,
  Hash,
  Shield,
  AlertTriangle,
  CheckCircle,
  Info
} from 'lucide-react';

export interface DeviceData {
  id?: string;
  manufacturer?: string;
  modelName?: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  serialNumber?: string;
  imei?: string;
  color?: string;
  storageSize?: string;
  condition?: 'excellent' | 'good' | 'fair' | 'poor';
  nickname?: string;
  issues?: string[];
}

export interface DeviceDetailCardProps {
  /** Device data */
  device: DeviceData;
  /** Available devices for selection */
  availableDevices?: Array<{
    id: string;
    model_name: string;
    image_url?: string;
    thumbnail_url?: string;
    manufacturer?: { name: string };
  }>;
  /** Customer's existing devices */
  customerDevices?: Array<{
    id: string;
    device_id: string;
    nickname?: string;
    serial_number?: string;
    imei?: string;
    color?: string;
    storage_size?: string;
    condition?: string;
    devices?: {
      id: string;
      model_name: string;
      image_url?: string;
      thumbnail_url?: string;
      manufacturer?: { name: string };
    };
  }>;
  /** Whether in edit mode */
  isEditing?: boolean;
  /** Whether the form is locked */
  isLocked?: boolean;
  /** Callback for device data change */
  onDeviceChange?: (device: DeviceData) => void;
  /** Custom className */
  className?: string;
}

const conditionConfig = {
  excellent: { 
    label: 'Excellent', 
    color: 'text-green-600',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    icon: CheckCircle 
  },
  good: { 
    label: 'Good', 
    color: 'text-blue-600',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    icon: CheckCircle 
  },
  fair: { 
    label: 'Fair', 
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
    icon: AlertTriangle 
  },
  poor: { 
    label: 'Poor', 
    color: 'text-red-600',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    icon: AlertTriangle 
  }
};

const storageOptions = ['16GB', '32GB', '64GB', '128GB', '256GB', '512GB', '1TB'];
const colorOptions = ['Black', 'White', 'Silver', 'Gold', 'Blue', 'Red', 'Green', 'Purple', 'Other'];

export const DeviceDetailCard = React.forwardRef<HTMLDivElement, DeviceDetailCardProps>(
  ({ 
    device,
    availableDevices = [],
    customerDevices = [],
    isEditing = false,
    isLocked = false,
    onDeviceChange,
    className
  }, ref) => {
    const handleFieldChange = (field: keyof DeviceData, value: any) => {
      if (onDeviceChange && !isLocked) {
        onDeviceChange({
          ...device,
          [field]: value
        });
      }
    };

    const handleDeviceSelect = (deviceId: string) => {
      // Check if it's a customer device first
      const customerDevice = customerDevices.find(cd => cd.id === deviceId);
      if (customerDevice && customerDevice.devices && onDeviceChange) {
        onDeviceChange({
          ...device,
          id: customerDevice.device_id,
          modelName: customerDevice.devices.model_name,
          manufacturer: customerDevice.devices.manufacturer?.name,
          imageUrl: customerDevice.devices.image_url,
          thumbnailUrl: customerDevice.devices.thumbnail_url,
          serialNumber: customerDevice.serial_number || '',
          imei: customerDevice.imei || '',
          color: customerDevice.color || '',
          storageSize: customerDevice.storage_size || '',
          condition: (customerDevice.condition as any) || 'good',
          nickname: customerDevice.nickname
        });
        return;
      }
      
      // Otherwise it's a new device selection
      const selected = availableDevices.find(d => d.id === deviceId);
      if (selected && onDeviceChange) {
        onDeviceChange({
          ...device,
          id: selected.id,
          modelName: selected.model_name,
          manufacturer: selected.manufacturer?.name,
          imageUrl: selected.image_url,
          thumbnailUrl: selected.thumbnail_url,
          // Clear customer-specific fields
          serialNumber: '',
          imei: '',
          color: '',
          storageSize: '',
          nickname: undefined
        });
      }
    };

    const condition = device.condition || 'good';
    const ConditionIcon = conditionConfig[condition].icon;

    return (
      <div 
        ref={ref}
        className={cn("rounded-lg border bg-card", className)}
      >
        <div className="p-4">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Smartphone className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h3 className="text-base font-semibold">Device Information</h3>
                <p className="text-xs text-muted-foreground">
                  Device details and specifications
                </p>
              </div>
            </div>

            {/* Condition Badge */}
            {!isEditing && (
              <div className={cn(
                "px-3 py-1.5 rounded-full flex items-center gap-1.5",
                conditionConfig[condition].bgColor
              )}>
                <ConditionIcon className={cn("h-3.5 w-3.5", conditionConfig[condition].color)} />
                <span className={cn("text-xs font-medium", conditionConfig[condition].color)}>
                  {conditionConfig[condition].label}
                </span>
              </div>
            )}
          </div>

          {/* Device Details */}
          <div className="space-y-4">
            {/* Device Selection */}
            {isEditing && (availableDevices.length > 0 || customerDevices.length > 0) && (
              <div className="space-y-2">
                <Label className="text-sm">Select Device</Label>
                <Select
                  value={device.nickname ? customerDevices.find(cd => cd.nickname === device.nickname)?.id : device.id || ''}
                  onValueChange={handleDeviceSelect}
                  disabled={isLocked}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a device" />
                  </SelectTrigger>
                  <SelectContent>
                    {customerDevices.length > 0 && (
                      <>
                        <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">Customer's Devices</div>
                        {customerDevices.map(cd => (
                          <SelectItem key={cd.id} value={cd.id}>
                            <div className="flex items-center gap-2">
                              <span>{cd.devices?.manufacturer?.name} {cd.devices?.model_name}</span>
                              {cd.nickname && (
                                <Badge variant="secondary" className="text-xs">
                                  {cd.nickname}
                                </Badge>
                              )}
                              {cd.color && <span className="text-xs text-muted-foreground">• {cd.color}</span>}
                            </div>
                          </SelectItem>
                        ))}
                        {availableDevices.length > 0 && (
                          <div className="my-1 border-t" />
                        )}
                      </>
                    )}
                    {availableDevices.length > 0 && (
                      <>
                        {customerDevices.length > 0 && (
                          <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">All Devices</div>
                        )}
                        {availableDevices.map(d => (
                          <SelectItem key={d.id} value={d.id}>
                            {d.manufacturer?.name} {d.model_name}
                          </SelectItem>
                        ))}
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Device Model Display - Enhanced */}
            {(device.id || device.modelName) && (
              <div className="relative overflow-hidden rounded-lg bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 p-4">
                <div className="flex items-start gap-4">
                  {/* Device Icon/Thumbnail */}
                  <div className="relative">
                    <div className="w-20 h-24 rounded-lg overflow-hidden bg-gradient-to-b from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center border border-border/50">
                      {device.thumbnailUrl || device.imageUrl ? (
                        <img 
                          src={device.thumbnailUrl || device.imageUrl} 
                          alt={`${device.manufacturer} ${device.modelName}`}
                          className="w-full h-full object-contain"
                        />
                      ) : device.manufacturer?.toLowerCase().includes('apple') || device.modelName?.toLowerCase().includes('iphone') ? (
                        <div className="relative">
                          <div className="w-14 h-18 rounded-lg bg-gray-900 dark:bg-gray-200 flex items-center justify-center">
                            <div className="w-12 h-16 rounded-md bg-gray-800 dark:bg-gray-300">
                              {/* iPhone notch */}
                              <div className="w-6 h-1 bg-gray-900 dark:bg-gray-200 rounded-full mx-auto mt-1" />
                            </div>
                          </div>
                        </div>
                      ) : device.manufacturer?.toLowerCase().includes('samsung') || device.manufacturer?.toLowerCase().includes('google') ? (
                        <div className="relative">
                          <div className="w-14 h-18 rounded-lg bg-gray-800 dark:bg-gray-300 flex items-center justify-center">
                            <div className="w-12 h-16 rounded-md bg-gradient-to-b from-gray-700 to-gray-900 dark:from-gray-200 dark:to-gray-400">
                              {/* Android camera hole */}
                              <div className="w-2 h-2 bg-gray-800 dark:bg-gray-300 rounded-full mx-auto mt-2" />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <Smartphone className="h-10 w-10 text-gray-400" />
                      )}
                    </div>
                    {/* Device condition indicator */}
                    <div className={cn(
                      "absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-card flex items-center justify-center",
                      condition === 'excellent' && "bg-green-500",
                      condition === 'good' && "bg-blue-500",
                      condition === 'fair' && "bg-yellow-500",
                      condition === 'poor' && "bg-red-500"
                    )}>
                      <ConditionIcon className="h-3 w-3 text-white" />
                    </div>
                  </div>
                  
                  {/* Device Info */}
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground mb-1">Device</p>
                    {device.manufacturer && device.modelName ? (
                      <>
                        <p className="font-semibold text-lg leading-tight">
                          {device.manufacturer}
                        </p>
                        <p className="text-base text-muted-foreground">
                          {device.modelName}
                        </p>
                      </>
                    ) : device.modelName ? (
                      <p className="font-semibold text-lg leading-tight">
                        {device.modelName}
                      </p>
                    ) : (
                      <p className="text-base text-muted-foreground">
                        Device not specified
                      </p>
                    )}
                    {(device.nickname || device.color || device.storageSize) && (
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        {device.nickname && (
                          <Badge variant="secondary" className="text-xs">
                            {device.nickname}
                          </Badge>
                        )}
                        {device.color && (
                          <Badge variant="outline" className="text-xs">
                            {device.color}
                          </Badge>
                        )}
                        {device.storageSize && (
                          <Badge variant="outline" className="text-xs">
                            {device.storageSize}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Identification Numbers - Show in edit mode */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm flex items-center gap-1">
                  <Hash className="h-3.5 w-3.5" />
                  Serial Number
                </Label>
                {isEditing && !isLocked ? (
                  <Input
                    value={device.serialNumber || ''}
                    onChange={(e) => handleFieldChange('serialNumber', e.target.value)}
                    placeholder="Enter serial number"
                  />
                ) : (
                  <p className="font-medium font-mono text-sm">
                    {device.serialNumber || 'Not provided'}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-sm flex items-center gap-1">
                  <Shield className="h-3.5 w-3.5" />
                  IMEI
                </Label>
                {isEditing && !isLocked ? (
                  <Input
                    value={device.imei || ''}
                    onChange={(e) => handleFieldChange('imei', e.target.value)}
                    placeholder="Enter IMEI"
                  />
                ) : (
                  <p className="font-medium font-mono text-sm">
                    {device.imei || 'Not provided'}
                  </p>
                )}
              </div>
            </div>

            {/* Specifications */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm flex items-center gap-1">
                  <Palette className="h-3.5 w-3.5" />
                  Color
                </Label>
                {isEditing && !isLocked ? (
                  <Select
                    value={device.color || ''}
                    onValueChange={(value) => handleFieldChange('color', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select color" />
                    </SelectTrigger>
                    <SelectContent>
                      {colorOptions.map(color => (
                        <SelectItem key={color} value={color}>
                          {color}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge variant="secondary">
                    {device.color || 'Not specified'}
                  </Badge>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-sm flex items-center gap-1">
                  <HardDrive className="h-3.5 w-3.5" />
                  Storage
                </Label>
                {isEditing && !isLocked ? (
                  <Select
                    value={device.storageSize || ''}
                    onValueChange={(value) => handleFieldChange('storageSize', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select storage" />
                    </SelectTrigger>
                    <SelectContent>
                      {storageOptions.map(size => (
                        <SelectItem key={size} value={size}>
                          {size}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge variant="secondary">
                    {device.storageSize || 'Not specified'}
                  </Badge>
                )}
              </div>
            </div>

            {/* Condition */}
            {isEditing && (
              <div className="space-y-2">
                <Label className="text-sm">Device Condition</Label>
                <Select
                  value={condition}
                  onValueChange={(value) => handleFieldChange('condition', value)}
                  disabled={isLocked}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(conditionConfig).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          <config.icon className={cn("h-4 w-4", config.color)} />
                          {config.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Issues */}
            {device.issues && device.issues.length > 0 && (
              <div className="pt-3 border-t">
                <div className="flex items-center gap-2 mb-2">
                  <Info className="h-4 w-4 text-muted-foreground" />
                  <Label className="text-sm">Reported Issues</Label>
                </div>
                <div className="flex flex-wrap gap-2">
                  {device.issues.map((issue, index) => (
                    <Badge key={index} variant="outline">
                      {issue.replace(/_/g, ' ')}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
);

DeviceDetailCard.displayName = 'DeviceDetailCard';