'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface EditDeviceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  device: any;
  customerId: string;
  updateDevice: (deviceId: string, data: any) => Promise<{ success: boolean; data?: any; error?: string }>;
  onSuccess?: (updatedDevice?: any) => void;
}

const storageOptions = [
  '16GB', '32GB', '64GB', '128GB', '256GB', '512GB', '1TB', '2TB'
];

const conditionOptions = [
  { value: 'excellent', label: 'Excellent' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
  { value: 'poor', label: 'Poor' },
  { value: 'broken', label: 'Broken' },
];

const colorOptions = [
  'Black', 'White', 'Silver', 'Gold', 'Rose Gold', 'Blue', 'Green', 
  'Red', 'Purple', 'Yellow', 'Orange', 'Pink', 'Gray', 'Graphite',
  'Midnight', 'Starlight', 'Product Red', 'Sierra Blue', 'Alpine Green',
  'Deep Purple', 'Space Gray', 'Jet Black', 'Natural Titanium', 'Blue Titanium',
  'White Titanium', 'Black Titanium'
];

export function EditDeviceDialog({
  open,
  onOpenChange,
  device,
  customerId,
  updateDevice,
  onSuccess,
}: EditDeviceDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    serial_number: device?.serial_number || '',
    imei: device?.imei || '',
    color: device?.color || '',
    storage_size: device?.storage_size || '',
    nickname: device?.nickname || '',
    purchase_date: device?.purchase_date || '',
    warranty_expires: device?.warranty_expires || '',
    condition: device?.condition || '',
    notes: device?.notes || '',
    is_primary: device?.is_primary || false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await updateDevice(device.id, formData);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to update device');
      }

      toast.success('Device updated successfully');
      onOpenChange(false);
      onSuccess?.(result.data);
    } catch (error) {
      console.error('Error updating device:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update device');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Device</DialogTitle>
          <DialogDescription>
            {device?.device?.manufacturer?.name} {device?.device?.model_name}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Device Nickname */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="nickname" className="text-right">
                Nickname
              </Label>
              <Input
                id="nickname"
                value={formData.nickname}
                onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                placeholder="My iPhone"
                className="col-span-3"
              />
            </div>

            {/* Serial Number */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="serial_number" className="text-right">
                Serial Number
              </Label>
              <Input
                id="serial_number"
                value={formData.serial_number}
                onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                placeholder="Serial number"
                className="col-span-3"
              />
            </div>

            {/* IMEI */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="imei" className="text-right">
                IMEI
              </Label>
              <Input
                id="imei"
                value={formData.imei}
                onChange={(e) => setFormData({ ...formData, imei: e.target.value })}
                placeholder="IMEI number"
                className="col-span-3"
              />
            </div>

            {/* Color */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="color" className="text-right">
                Color
              </Label>
              <Select
                value={formData.color}
                onValueChange={(value) => setFormData({ ...formData, color: value })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select color" />
                </SelectTrigger>
                <SelectContent>
                  {colorOptions.map((color) => (
                    <SelectItem key={color} value={color}>
                      {color}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Storage Size */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="storage_size" className="text-right">
                Storage
              </Label>
              <Select
                value={formData.storage_size}
                onValueChange={(value) => setFormData({ ...formData, storage_size: value })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select storage size" />
                </SelectTrigger>
                <SelectContent>
                  {storageOptions.map((size) => (
                    <SelectItem key={size} value={size}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Condition */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="condition" className="text-right">
                Condition
              </Label>
              <Select
                value={formData.condition}
                onValueChange={(value) => setFormData({ ...formData, condition: value })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select condition" />
                </SelectTrigger>
                <SelectContent>
                  {conditionOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Purchase Date */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="purchase_date" className="text-right">
                Purchase Date
              </Label>
              <Input
                id="purchase_date"
                type="date"
                value={formData.purchase_date}
                onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                className="col-span-3"
              />
            </div>

            {/* Warranty Expires */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="warranty_expires" className="text-right">
                Warranty Expires
              </Label>
              <Input
                id="warranty_expires"
                type="date"
                value={formData.warranty_expires}
                onChange={(e) => setFormData({ ...formData, warranty_expires: e.target.value })}
                className="col-span-3"
              />
            </div>

            {/* Notes */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="notes" className="text-right">
                Notes
              </Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Any additional notes about this device"
                className="col-span-3"
                rows={3}
              />
            </div>

            {/* Is Primary Device */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="is_primary" className="text-right">
                Primary Device
              </Label>
              <div className="col-span-3 flex items-center space-x-2">
                <Switch
                  id="is_primary"
                  checked={formData.is_primary}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_primary: checked })}
                />
                <Label htmlFor="is_primary" className="font-normal">
                  Set as customer's primary device
                </Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}