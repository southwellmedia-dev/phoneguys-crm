"use client";

import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Smartphone, Tablet, Laptop, Search, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Device {
  id: string;
  name: string;
  manufacturer?: string;
  type?: string;
  fullName: string;
}

interface DeviceStepProps {
  devices: Device[];
  selectedDevice?: any;
  onUpdate: (device: any) => void;
}

export function DeviceStep({ devices, selectedDevice, onUpdate }: DeviceStepProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedManufacturer, setSelectedManufacturer] = useState<string | null>(null);
  const [deviceDetails, setDeviceDetails] = useState({
    serialNumber: selectedDevice?.serialNumber || '',
    imei: selectedDevice?.imei || '',
    color: selectedDevice?.color || '',
    storageSize: selectedDevice?.storageSize || '',
    condition: selectedDevice?.condition || 'good'
  });

  // Group devices by manufacturer
  const devicesByManufacturer = useMemo(() => {
    const grouped = devices.reduce((acc: any, device) => {
      const manufacturer = device.manufacturer || 'Other';
      if (!acc[manufacturer]) {
        acc[manufacturer] = [];
      }
      acc[manufacturer].push(device);
      return acc;
    }, {});
    return grouped;
  }, [devices]);

  // Get unique manufacturers
  const manufacturers = Object.keys(devicesByManufacturer).sort();

  // Filter devices based on search
  const { filteredDevices, totalCount } = useMemo(() => {
    let filtered = devices;
    
    if (selectedManufacturer) {
      filtered = devicesByManufacturer[selectedManufacturer] || [];
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(device => 
        device.fullName.toLowerCase().includes(query) ||
        device.name.toLowerCase().includes(query)
      );
    }
    
    const total = filtered.length;
    return { 
      filteredDevices: filtered.slice(0, 30), // Limit to 30 results for better selection
      totalCount: total
    };
  }, [devices, searchQuery, selectedManufacturer, devicesByManufacturer]);

  const handleDeviceSelect = (device: Device) => {
    onUpdate({
      deviceId: device.id,
      name: device.name,
      manufacturer: device.manufacturer || '',
      fullName: device.fullName,
      ...deviceDetails
    });
  };

  const updateDetails = (field: string, value: string) => {
    const updatedDetails = { ...deviceDetails, [field]: value };
    setDeviceDetails(updatedDetails);
    
    if (selectedDevice?.deviceId) {
      onUpdate({
        ...selectedDevice,
        ...updatedDetails
      });
    }
  };

  const getDeviceIcon = (type?: string) => {
    switch (type?.toLowerCase()) {
      case 'tablet':
        return <Tablet className="h-5 w-5" />;
      case 'laptop':
        return <Laptop className="h-5 w-5" />;
      default:
        return <Smartphone className="h-5 w-5" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-1">Select Your Device</h2>
        <p className="text-sm text-gray-600">Choose your device model to get started</p>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          placeholder="Search for your device model..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Manufacturer Filter */}
      <div className="space-y-2">
        <Label>Popular Brands</Label>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant={selectedManufacturer === null ? "default" : "outline"}
            onClick={() => setSelectedManufacturer(null)}
          >
            All
          </Button>
          {['Apple', 'Samsung', 'Google', 'OnePlus', 'Xiaomi'].map(brand => {
            if (manufacturers.includes(brand)) {
              return (
                <Button
                  key={brand}
                  type="button"
                  size="sm"
                  variant={selectedManufacturer === brand ? "default" : "outline"}
                  onClick={() => setSelectedManufacturer(brand)}
                >
                  {brand}
                </Button>
              );
            }
            return null;
          })}
        </div>
      </div>

      {/* Device Grid */}
      <div className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredDevices.map((device) => (
          <Card
            key={device.id}
            className={cn(
              "cursor-pointer transition-all hover:shadow-md",
              selectedDevice?.deviceId === device.id && "ring-2 ring-primary"
            )}
            onClick={() => handleDeviceSelect(device)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    {getDeviceIcon(device.type)}
                  </div>
                  <div>
                    <p className="font-medium">{device.name}</p>
                    <p className="text-sm text-gray-500">{device.manufacturer}</p>
                  </div>
                </div>
                {selectedDevice?.deviceId === device.id && (
                  <div className="h-5 w-5 bg-primary rounded-full flex items-center justify-center">
                    <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        </div>
        
        {totalCount > 30 && (
          <div className="text-center py-2 text-sm text-gray-500">
            Showing 30 of {totalCount} devices. Use search to find your specific model.
          </div>
        )}
      </div>

      {/* Device Details (Optional) */}
      {selectedDevice?.deviceId && (
        <Card>
          <CardContent className="p-4 space-y-4">
            <h3 className="font-semibold">Device Details (Optional)</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="serialNumber">Serial Number</Label>
                <Input
                  id="serialNumber"
                  value={deviceDetails.serialNumber}
                  onChange={(e) => updateDetails('serialNumber', e.target.value)}
                  placeholder="Enter serial number"
                />
              </div>
              <div>
                <Label htmlFor="imei">IMEI</Label>
                <Input
                  id="imei"
                  value={deviceDetails.imei}
                  onChange={(e) => updateDetails('imei', e.target.value)}
                  placeholder="Enter IMEI"
                />
              </div>
              <div>
                <Label htmlFor="color">Color</Label>
                <Input
                  id="color"
                  value={deviceDetails.color}
                  onChange={(e) => updateDetails('color', e.target.value)}
                  placeholder="e.g., Black, Silver"
                />
              </div>
              <div>
                <Label htmlFor="storage">Storage Size</Label>
                <select
                  id="storage"
                  className="w-full h-10 px-3 rounded-md border border-input bg-background"
                  value={deviceDetails.storageSize}
                  onChange={(e) => updateDetails('storageSize', e.target.value)}
                >
                  <option value="">Select storage</option>
                  <option value="32GB">32GB</option>
                  <option value="64GB">64GB</option>
                  <option value="128GB">128GB</option>
                  <option value="256GB">256GB</option>
                  <option value="512GB">512GB</option>
                  <option value="1TB">1TB</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {!selectedDevice?.deviceId && filteredDevices.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">No devices found. Try a different search.</p>
        </div>
      )}
    </div>
  );
}