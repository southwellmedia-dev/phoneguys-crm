'use client';

import { useState, useEffect } from 'react';
import { Search, Smartphone, Tablet, Check } from 'lucide-react';

interface Device {
  id: string;
  brand: string;
  model: string;
  name: string;
  image_url?: string;
  colors?: string[];
  storage_sizes?: string[];
  release_date?: string;
}

interface DeviceSelectorProps {
  onSelect: (device: Device, options: { color?: string; storage?: string }) => void;
  selectedDevice?: Device;
}

export function DeviceSelector({ onSelect, selectedDevice }: DeviceSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [devices, setDevices] = useState<Device[]>([]);
  const [brands, setBrands] = useState<{ brand: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [selectedStorage, setSelectedStorage] = useState<string>('');

  useEffect(() => {
    fetchDevices();
  }, [selectedBrand, searchQuery]);

  const fetchDevices = async () => {
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set('search', searchQuery);
      if (selectedBrand) params.set('brand', selectedBrand);
      params.set('limit', '20');

      const response = await fetch(`/api/admin/sync-devices?${params}`);
      const data = await response.json();
      
      setDevices(data.devices || []);
      if (!selectedBrand) {
        setBrands(data.brands || []);
      }
    } catch (error) {
      console.error('Error fetching devices:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeviceSelect = (device: Device) => {
    if (selectedDevice?.id === device.id) {
      // Deselect if clicking the same device
      onSelect(device, { color: '', storage: '' });
      setSelectedColor('');
      setSelectedStorage('');
    } else {
      onSelect(device, { color: selectedColor, storage: selectedStorage });
    }
  };

  const popularBrands = ['Apple', 'Samsung', 'Google', 'OnePlus', 'Xiaomi'];

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search for your device..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
        />
      </div>

      {/* Brand Filter */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-gray-700">Select Brand</h3>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedBrand('')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              !selectedBrand 
                ? 'bg-cyan-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Brands
          </button>
          {popularBrands.map((brand) => (
            <button
              key={brand}
              onClick={() => setSelectedBrand(brand)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedBrand === brand 
                  ? 'bg-cyan-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {brand}
            </button>
          ))}
        </div>
      </div>

      {/* Device Grid */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 rounded-lg h-40"></div>
              <div className="mt-2 h-4 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      ) : devices.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {devices.map((device) => (
            <button
              key={device.id}
              onClick={() => handleDeviceSelect(device)}
              className={`relative p-4 rounded-lg border-2 transition-all hover:shadow-lg ${
                selectedDevice?.id === device.id
                  ? 'border-cyan-600 bg-cyan-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {selectedDevice?.id === device.id && (
                <div className="absolute top-2 right-2 w-6 h-6 bg-cyan-600 rounded-full flex items-center justify-center">
                  <Check className="h-4 w-4 text-white" />
                </div>
              )}
              
              <div className="aspect-square mb-3 flex items-center justify-center">
                {device.image_url ? (
                  <img 
                    src={device.image_url} 
                    alt={device.name}
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  <Smartphone className="h-16 w-16 text-gray-400" />
                )}
              </div>
              
              <div className="text-left">
                <div className="text-xs text-gray-500">{device.brand}</div>
                <div className="text-sm font-medium text-gray-900 line-clamp-2">
                  {device.name}
                </div>
                {device.release_date && (
                  <div className="text-xs text-gray-400 mt-1">
                    Released {new Date(device.release_date).getFullYear()}
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Smartphone className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500">No devices found</p>
          <p className="text-sm text-gray-400 mt-1">Try adjusting your search or filters</p>
        </div>
      )}

      {/* Device Options (shown when device is selected) */}
      {selectedDevice && (
        <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-medium text-gray-900">Device Details</h3>
          
          {selectedDevice.colors && selectedDevice.colors.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Color</label>
              <div className="flex flex-wrap gap-2">
                {selectedDevice.colors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                      selectedColor === color
                        ? 'bg-cyan-600 text-white'
                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {selectedDevice.storage_sizes && selectedDevice.storage_sizes.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Storage</label>
              <div className="flex flex-wrap gap-2">
                {selectedDevice.storage_sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedStorage(size)}
                    className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                      selectedStorage === size
                        ? 'bg-cyan-600 text-white'
                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Custom Device Option */}
      <div className="border-t pt-4">
        <button
          onClick={() => {
            // Handle custom device input
            const customDevice: Device = {
              id: 'custom',
              brand: 'Other',
              model: 'Custom Device',
              name: 'I\'ll describe my device'
            };
            handleDeviceSelect(customDevice);
          }}
          className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors"
        >
          <p className="text-gray-600">Can't find your device?</p>
          <p className="text-sm text-gray-400 mt-1">Click here to enter custom device details</p>
        </button>
      </div>
    </div>
  );
}