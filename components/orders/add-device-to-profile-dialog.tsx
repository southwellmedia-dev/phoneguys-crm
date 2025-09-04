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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, Wand2 } from 'lucide-react';

interface AddDeviceToProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deviceName: string;
  currentSerial?: string;
  currentImei?: string;
  addDeviceToProfile: (data: {
    serial_number?: string;
    imei?: string;
    color?: string;
    storage_size?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  onSuccess?: () => void;
}

const storageOptions = [
  '16GB', '32GB', '64GB', '128GB', '256GB', '512GB', '1TB', '2TB'
];

const colorOptions = [
  'Black', 'White', 'Silver', 'Gold', 'Rose Gold', 'Blue', 'Green', 
  'Red', 'Purple', 'Yellow', 'Orange', 'Pink', 'Gray', 'Graphite',
  'Midnight', 'Starlight', 'Product Red', 'Sierra Blue', 'Alpine Green',
  'Deep Purple', 'Space Gray', 'Jet Black', 'Natural Titanium', 'Blue Titanium',
  'White Titanium', 'Black Titanium'
];

export function AddDeviceToProfileDialog({
  open,
  onOpenChange,
  deviceName,
  currentSerial,
  currentImei,
  addDeviceToProfile,
  onSuccess,
}: AddDeviceToProfileDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    serial_number: currentSerial || '',
    imei: currentImei || '',
    color: '',
    storage_size: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.serial_number && !formData.imei) {
      toast.error('Please provide either a serial number or IMEI');
      return;
    }

    setLoading(true);

    try {
      const result = await addDeviceToProfile(formData);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to add device to profile');
      }

      toast.success('Device added to customer profile');
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('Error adding device:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to add device');
    } finally {
      setLoading(false);
    }
  };

  const generateTestSerial = () => {
    const fakeSerial = `SN${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    setFormData(prev => ({ ...prev, serial_number: fakeSerial }));
    toast.success('Test serial number generated');
  };

  const generateTestImei = () => {
    const fakeImei = Array.from({length: 15}, () => Math.floor(Math.random() * 10)).join('');
    setFormData(prev => ({ ...prev, imei: fakeImei }));
    toast.success('Test IMEI generated');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Device to Customer Profile</DialogTitle>
          <DialogDescription>
            Add {deviceName} to the customer's device profile for future reference
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Serial Number */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="serial">Serial Number *</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={generateTestSerial}
                  className="text-xs h-auto py-1 px-2"
                >
                  <Wand2 className="h-3 w-3 mr-1" />
                  Generate Test
                </Button>
              </div>
              <Input
                id="serial"
                value={formData.serial_number}
                onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                placeholder="Enter serial number"
                required={!formData.imei}
              />
            </div>

            {/* IMEI */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="imei">IMEI *</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={generateTestImei}
                  className="text-xs h-auto py-1 px-2"
                >
                  <Wand2 className="h-3 w-3 mr-1" />
                  Generate Test
                </Button>
              </div>
              <Input
                id="imei"
                value={formData.imei}
                onChange={(e) => setFormData({ ...formData, imei: e.target.value })}
                placeholder="Enter IMEI number"
                required={!formData.serial_number}
              />
            </div>

            <p className="text-xs text-muted-foreground">
              * At least one identifier (Serial or IMEI) is required
            </p>

            {/* Color (Optional) */}
            <div className="space-y-2">
              <Label htmlFor="color">Color (Optional)</Label>
              <Select
                value={formData.color}
                onValueChange={(value) => setFormData({ ...formData, color: value })}
              >
                <SelectTrigger>
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

            {/* Storage Size (Optional) */}
            <div className="space-y-2">
              <Label htmlFor="storage">Storage (Optional)</Label>
              <Select
                value={formData.storage_size}
                onValueChange={(value) => setFormData({ ...formData, storage_size: value })}
              >
                <SelectTrigger>
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
              Add to Profile
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}