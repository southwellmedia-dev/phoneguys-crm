'use client';

import * as React from 'react';
import { StatusBadge } from '@/components/premium/ui/badges/status-badge';
import { InputPremium } from '@/components/premium/ui/forms/input-premium';
import { SelectPremium, type SelectOption } from '@/components/premium/ui/forms/select-premium';
import { FormFieldWrapper, FormGrid } from '@/components/premium/ui/forms/form-field-wrapper';
import { cn } from '@/lib/utils';
import { 
  Smartphone,
  HardDrive,
  Palette,
  Hash,
  Shield,
  AlertTriangle,
  CheckCircle,
  Info,
  User
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
    icon: CheckCircle,
    status: 'success' as const
  },
  good: { 
    label: 'Good', 
    color: 'text-blue-600',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    icon: CheckCircle,
    status: 'info' as const
  },
  fair: { 
    label: 'Fair', 
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
    icon: AlertTriangle,
    status: 'warning' as const
  },
  poor: { 
    label: 'Poor', 
    color: 'text-red-600',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    icon: AlertTriangle,
    status: 'error' as const
  }
};

const storageOptions: SelectOption[] = [
  { value: '16GB', label: '16GB' },
  { value: '32GB', label: '32GB' },
  { value: '64GB', label: '64GB' },
  { value: '128GB', label: '128GB' },
  { value: '256GB', label: '256GB' },
  { value: '512GB', label: '512GB' },
  { value: '1TB', label: '1TB' }
];

const colorOptions: SelectOption[] = [
  { value: 'Black', label: 'Black' },
  { value: 'White', label: 'White' },
  { value: 'Silver', label: 'Silver' },
  { value: 'Gold', label: 'Gold' },
  { value: 'Blue', label: 'Blue' },
  { value: 'Red', label: 'Red' },
  { value: 'Green', label: 'Green' },
  { value: 'Purple', label: 'Purple' },
  { value: 'Other', label: 'Other' }
];

const conditionOptions: SelectOption[] = [
  { value: 'excellent', label: 'Excellent', description: 'Like new, no visible damage' },
  { value: 'good', label: 'Good', description: 'Minor signs of use' },
  { value: 'fair', label: 'Fair', description: 'Moderate wear and tear' },
  { value: 'poor', label: 'Poor', description: 'Significant damage or issues' }
];

export const DeviceDetailCardPremium = React.forwardRef<HTMLDivElement, DeviceDetailCardProps>(
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

    // Prepare device options for SelectPremium
    const deviceOptions: SelectOption[] = [
      ...customerDevices.map(cd => ({
        value: cd.id,
        label: `${cd.devices?.manufacturer?.name || ''} ${cd.devices?.model_name || ''}`,
        description: cd.nickname ? `Nickname: ${cd.nickname}` : cd.color ? `Color: ${cd.color}` : undefined,
        icon: <Smartphone className="h-3.5 w-3.5" />
      })),
      ...availableDevices.map(d => ({
        value: d.id,
        label: `${d.manufacturer?.name || ''} ${d.model_name}`,
        icon: <Smartphone className="h-3.5 w-3.5" />
      }))
    ];

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

            {/* Condition Badge and Customer Device Indicator */}
            {!isEditing && (
              <div className="flex items-center gap-2">
                {/* Customer Device Indicator */}
                {device.nickname && (
                  <StatusBadge
                    type="general"
                    status="success"
                    variant="soft"
                    className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800"
                  >
                    <User className="h-3 w-3 mr-1" />
                    Customer Device
                  </StatusBadge>
                )}
                {device.condition && (
                  <StatusBadge
                    type="general"
                    status={conditionConfig[condition].status}
                    variant="soft"
                    className="text-xs"
                  >
                    {conditionConfig[condition].label}
                  </StatusBadge>
                )}
              </div>
            )}
          </div>

          {/* Device Details */}
          <div className="space-y-4">
            {/* Device Selection */}
            {isEditing && deviceOptions.length > 0 && (
              <SelectPremium
                label="Select Device"
                options={deviceOptions}
                value={device.nickname ? customerDevices.find(cd => cd.nickname === device.nickname)?.id : device.id || ''}
                onChange={handleDeviceSelect}
                disabled={isLocked}
                placeholder="Choose a device"
                searchable
                variant="default"
                size="sm"
              />
            )}

            {/* Device Model Display - Enhanced */}
            {(device.id || device.modelName) && (
              <div className={cn(
                "relative overflow-hidden rounded-lg p-4",
                device.nickname 
                  ? "bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-2 border-green-200 dark:border-green-800"
                  : "bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20"
              )}>
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
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-xs text-muted-foreground">Device</p>
                      {device.nickname && (
                        <span className="text-xs font-medium text-green-600 dark:text-green-400 flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Linked to Customer
                        </span>
                      )}
                    </div>
                    {device.manufacturer && device.modelName ? (
                      <>
                        <p className="font-semibold text-base leading-tight">
                          {device.manufacturer}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {device.modelName}
                        </p>
                      </>
                    ) : device.modelName ? (
                      <p className="font-semibold text-base leading-tight">
                        {device.modelName}
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Device not specified
                      </p>
                    )}
                    {(device.nickname || device.color || device.storageSize) && (
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        {device.nickname && (
                          <StatusBadge 
                            type="general" 
                            status="info" 
                            variant="soft"
                            className="text-xs"
                          >
                            {device.nickname}
                          </StatusBadge>
                        )}
                        {device.color && (
                          <StatusBadge 
                            type="general" 
                            status="inactive" 
                            variant="soft"
                            className="text-xs"
                          >
                            <Palette className="h-3 w-3 mr-1" />
                            {device.color}
                          </StatusBadge>
                        )}
                        {device.storageSize && (
                          <StatusBadge 
                            type="general" 
                            status="inactive" 
                            variant="soft"
                            className="text-xs"
                          >
                            <HardDrive className="h-3 w-3 mr-1" />
                            {device.storageSize}
                          </StatusBadge>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Device Fields - Show in edit mode */}
            {isEditing && (
              <FormGrid columns={2} gap="sm" responsive>
                <InputPremium
                  label="Serial Number"
                  value={device.serialNumber || ''}
                  onChange={(e) => handleFieldChange('serialNumber', e.target.value)}
                  placeholder="Enter serial number"
                  disabled={isLocked}
                  leftIcon={<Hash className="h-3.5 w-3.5" />}
                  variant="default"
                  size="sm"
                />
                
                <InputPremium
                  label="IMEI"
                  value={device.imei || ''}
                  onChange={(e) => handleFieldChange('imei', e.target.value)}
                  placeholder="Enter IMEI"
                  disabled={isLocked}
                  leftIcon={<Shield className="h-3.5 w-3.5" />}
                  variant="default"
                  size="sm"
                />
                
                <SelectPremium
                  label="Color"
                  options={colorOptions}
                  value={device.color || ''}
                  onChange={(value) => handleFieldChange('color', value)}
                  placeholder="Select color"
                  disabled={isLocked}
                  leftIcon={<Palette className="h-3.5 w-3.5" />}
                  variant="default"
                  size="sm"
                />
                
                <SelectPremium
                  label="Storage"
                  options={storageOptions}
                  value={device.storageSize || ''}
                  onChange={(value) => handleFieldChange('storageSize', value)}
                  placeholder="Select storage"
                  disabled={isLocked}
                  leftIcon={<HardDrive className="h-3.5 w-3.5" />}
                  variant="default"
                  size="sm"
                />
                
                <div className="col-span-2">
                  <SelectPremium
                    label="Condition"
                    options={conditionOptions}
                    value={device.condition || 'good'}
                    onChange={(value) => handleFieldChange('condition', value)}
                    disabled={isLocked}
                    variant="default"
                    size="sm"
                  />
                </div>
                
                <div className="col-span-2">
                  <InputPremium
                    label="Nickname (Optional)"
                    value={device.nickname || ''}
                    onChange={(e) => handleFieldChange('nickname', e.target.value)}
                    placeholder="e.g., 'Work Phone'"
                    disabled={isLocked}
                    helperText="A friendly name to identify this device"
                    variant="default"
                    size="sm"
                  />
                </div>
              </FormGrid>
            )}

            {/* Read-only Display */}
            {!isEditing && (device.serialNumber || device.imei) && (
              <div className="space-y-2 pt-2 border-t">
                {device.serialNumber && (
                  <div className="flex items-center gap-2 text-sm">
                    <Hash className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">Serial:</span>
                    <span className="font-mono">{device.serialNumber}</span>
                  </div>
                )}
                {device.imei && (
                  <div className="flex items-center gap-2 text-sm">
                    <Shield className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">IMEI:</span>
                    <span className="font-mono">{device.imei}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
);

DeviceDetailCardPremium.displayName = 'DeviceDetailCardPremium';

export { DeviceDetailCardPremium as DeviceDetailCard };