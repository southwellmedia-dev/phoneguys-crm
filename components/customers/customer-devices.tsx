'use client';

import { useState, useEffect } from 'react';
import { CustomerDeviceService } from '@/lib/services/customer-device.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Smartphone,
  Plus,
  MoreVertical,
  Edit,
  History,
  Star,
  StarOff,
  Trash2,
  Calendar,
  Shield,
  HardDrive,
  Hash,
  Palette,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { CustomerDevice } from '@/lib/types/database.types';
import { DeviceRepository } from '@/lib/repositories/device.repository';

interface CustomerDevicesProps {
  customerId: string;
  customerName?: string;
}

export function CustomerDevices({ customerId, customerName }: CustomerDevicesProps) {
  const [devices, setDevices] = useState<CustomerDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDevice, setShowAddDevice] = useState(false);
  const [showEditDevice, setShowEditDevice] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<CustomerDevice | null>(null);
  const [availableDevices, setAvailableDevices] = useState<any[]>([]);
  
  // Form state
  const [formData, setFormData] = useState({
    device_id: '',
    serial_number: '',
    imei: '',
    color: '',
    storage_size: '',
    nickname: '',
    purchase_date: '',
    warranty_expires: '',
    condition: 'good' as string,
    notes: '',
    is_primary: false,
  });

  useEffect(() => {
    loadDevices();
    loadAvailableDevices();
  }, [customerId]);

  const loadDevices = async () => {
    try {
      const service = new CustomerDeviceService();
      const customerDevices = await service.getCustomerDevices(customerId);
      setDevices(customerDevices);
    } catch (error) {
      console.error('Error loading devices:', error);
      toast.error('Failed to load devices');
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableDevices = async () => {
    try {
      const repo = new DeviceRepository();
      const allDevices = await repo.findAll();
      setAvailableDevices(allDevices);
    } catch (error) {
      console.error('Error loading available devices:', error);
    }
  };

  const handleAddDevice = async () => {
    if (!formData.device_id) {
      toast.error('Please select a device model');
      return;
    }

    try {
      const service = new CustomerDeviceService();
      await service.addDeviceToCustomer(customerId, formData);
      toast.success('Device added successfully');
      setShowAddDevice(false);
      resetForm();
      loadDevices();
    } catch (error: any) {
      toast.error(error.message || 'Failed to add device');
    }
  };

  const handleUpdateDevice = async () => {
    if (!selectedDevice) return;

    try {
      const service = new CustomerDeviceService();
      await service.updateDevice(selectedDevice.id, formData);
      toast.success('Device updated successfully');
      setShowEditDevice(false);
      resetForm();
      loadDevices();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update device');
    }
  };

  const handleSetPrimary = async (deviceId: string) => {
    try {
      const service = new CustomerDeviceService();
      await service.updateDevice(deviceId, { is_primary: true });
      toast.success('Primary device updated');
      loadDevices();
    } catch (error) {
      toast.error('Failed to set primary device');
    }
  };

  const handleDeleteDevice = async (deviceId: string) => {
    if (!confirm('Are you sure you want to remove this device?')) return;

    try {
      const service = new CustomerDeviceService();
      await service.updateDevice(deviceId, { is_active: false });
      toast.success('Device removed');
      loadDevices();
    } catch (error) {
      toast.error('Failed to remove device');
    }
  };

  const resetForm = () => {
    setFormData({
      device_id: '',
      serial_number: '',
      imei: '',
      color: '',
      storage_size: '',
      nickname: '',
      purchase_date: '',
      warranty_expires: '',
      condition: 'good',
      notes: '',
      is_primary: false,
    });
    setSelectedDevice(null);
  };

  const openEditDialog = (device: CustomerDevice) => {
    setSelectedDevice(device);
    setFormData({
      device_id: device.device_id || '',
      serial_number: device.serial_number || '',
      imei: device.imei || '',
      color: device.color || '',
      storage_size: device.storage_size || '',
      nickname: device.nickname || '',
      purchase_date: device.purchase_date || '',
      warranty_expires: device.warranty_expires || '',
      condition: device.condition || 'good',
      notes: device.notes || '',
      is_primary: device.is_primary || false,
    });
    setShowEditDevice(true);
  };

  const getConditionBadge = (condition?: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
      excellent: 'default',
      good: 'secondary',
      fair: 'outline',
      poor: 'destructive',
      broken: 'destructive',
    };
    return (
      <Badge variant={variants[condition || 'fair'] || 'outline'}>
        {condition || 'Unknown'}
      </Badge>
    );
  };

  const getWarrantyStatus = (expiryDate?: string) => {
    if (!expiryDate) return null;
    const today = new Date();
    const expiry = new Date(expiryDate);
    const daysLeft = Math.floor((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysLeft < 0) {
      return <Badge variant="outline" className="text-muted-foreground">Expired</Badge>;
    } else if (daysLeft < 30) {
      return <Badge variant="destructive">Expires in {daysLeft} days</Badge>;
    } else if (daysLeft < 90) {
      return <Badge variant="secondary">Expires in {Math.floor(daysLeft / 30)} months</Badge>;
    } else {
      return <Badge variant="default">Active</Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">Loading devices...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              Devices ({devices.length})
            </CardTitle>
            <Button size="sm" onClick={() => setShowAddDevice(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Device
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {devices.length === 0 ? (
            <div className="text-center py-8">
              <Smartphone className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">No devices registered</p>
              <Button variant="outline" onClick={() => setShowAddDevice(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Device
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {devices.map((device) => (
                <div
                  key={device.id}
                  className={`p-4 rounded-lg border ${
                    device.is_primary ? 'border-primary bg-primary/5' : 'bg-muted/30'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      {device.device?.image_url && (
                        <img
                          src={device.device.image_url}
                          alt={device.device.model_name}
                          className="w-16 h-16 object-cover rounded"
                        />
                      )}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">
                            {device.nickname || 
                             `${device.device?.manufacturer?.name} ${device.device?.model_name}` ||
                             'Unknown Device'}
                          </h4>
                          {device.is_primary && (
                            <Badge variant="default" className="gap-1">
                              <Star className="h-3 w-3" />
                              Primary
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          {device.serial_number && (
                            <span className="flex items-center gap-1">
                              <Hash className="h-3 w-3" />
                              {device.serial_number}
                            </span>
                          )}
                          {device.color && (
                            <span className="flex items-center gap-1">
                              <Palette className="h-3 w-3" />
                              {device.color}
                            </span>
                          )}
                          {device.storage_size && (
                            <span className="flex items-center gap-1">
                              <HardDrive className="h-3 w-3" />
                              {device.storage_size}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3">
                          {getConditionBadge(device.condition)}
                          {getWarrantyStatus(device.warranty_expires)}
                          {device.previous_repairs && device.previous_repairs.length > 0 && (
                            <Badge variant="outline">
                              {device.previous_repairs.length} repair{device.previous_repairs.length !== 1 ? 's' : ''}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditDialog(device)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Details
                        </DropdownMenuItem>
                        {!device.is_primary && (
                          <DropdownMenuItem onClick={() => handleSetPrimary(device.id)}>
                            <Star className="h-4 w-4 mr-2" />
                            Set as Primary
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem>
                          <History className="h-4 w-4 mr-2" />
                          View History
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => handleDeleteDevice(device.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Remove Device
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Device Dialog */}
      <Dialog open={showAddDevice} onOpenChange={setShowAddDevice}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Device</DialogTitle>
            <DialogDescription>
              Register a device for {customerName || 'this customer'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="device">Device Model*</Label>
              <Select 
                value={formData.device_id} 
                onValueChange={(value) => setFormData({...formData, device_id: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a device..." />
                </SelectTrigger>
                <SelectContent>
                  {availableDevices.map((device) => (
                    <SelectItem key={device.id} value={device.id}>
                      {device.manufacturer?.name} {device.model_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="serial">Serial Number</Label>
                <Input
                  id="serial"
                  value={formData.serial_number}
                  onChange={(e) => setFormData({...formData, serial_number: e.target.value})}
                  placeholder="Enter serial number"
                />
              </div>
              <div>
                <Label htmlFor="imei">IMEI</Label>
                <Input
                  id="imei"
                  value={formData.imei}
                  onChange={(e) => setFormData({...formData, imei: e.target.value})}
                  placeholder="Enter IMEI"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="color">Color</Label>
                <Input
                  id="color"
                  value={formData.color}
                  onChange={(e) => setFormData({...formData, color: e.target.value})}
                  placeholder="e.g., Space Gray"
                />
              </div>
              <div>
                <Label htmlFor="storage">Storage</Label>
                <Input
                  id="storage"
                  value={formData.storage_size}
                  onChange={(e) => setFormData({...formData, storage_size: e.target.value})}
                  placeholder="e.g., 128GB"
                />
              </div>
              <div>
                <Label htmlFor="condition">Condition</Label>
                <Select 
                  value={formData.condition} 
                  onValueChange={(value) => setFormData({...formData, condition: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="excellent">Excellent</SelectItem>
                    <SelectItem value="good">Good</SelectItem>
                    <SelectItem value="fair">Fair</SelectItem>
                    <SelectItem value="poor">Poor</SelectItem>
                    <SelectItem value="broken">Broken</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="purchase">Purchase Date</Label>
                <Input
                  id="purchase"
                  type="date"
                  value={formData.purchase_date}
                  onChange={(e) => setFormData({...formData, purchase_date: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="warranty">Warranty Expires</Label>
                <Input
                  id="warranty"
                  type="date"
                  value={formData.warranty_expires}
                  onChange={(e) => setFormData({...formData, warranty_expires: e.target.value})}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="nickname">Nickname (Optional)</Label>
              <Input
                id="nickname"
                value={formData.nickname}
                onChange={(e) => setFormData({...formData, nickname: e.target.value})}
                placeholder="e.g., Work Phone"
              />
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                placeholder="Any additional notes about this device..."
                rows={3}
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="primary"
                checked={formData.is_primary}
                onChange={(e) => setFormData({...formData, is_primary: e.target.checked})}
                className="rounded"
              />
              <Label htmlFor="primary" className="font-normal">
                Set as primary device
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDevice(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddDevice}>
              Add Device
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Device Dialog (similar to Add) */}
      <Dialog open={showEditDevice} onOpenChange={setShowEditDevice}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Device</DialogTitle>
            <DialogDescription>
              Update device information
            </DialogDescription>
          </DialogHeader>

          {/* Same form fields as Add Dialog */}
          <div className="grid gap-4 py-4">
            {/* ... same fields as add dialog ... */}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDevice(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateDevice}>
              Update Device
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}