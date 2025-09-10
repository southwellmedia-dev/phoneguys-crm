"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCreateDevice, useUpdateDevice } from "@/lib/hooks/use-admin";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Plus, 
  Loader2, 
  Edit, 
  Smartphone, 
  Search, 
  Download,
  CheckCircle,
  XCircle,
  Calendar,
  Package,
  Cpu
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Device } from "@/lib/types/database.types";
import { DeviceImageSelector } from "./device-image-selector";
import { useQueryClient } from "@tanstack/react-query";

const deviceSchema = z.object({
  manufacturer_id: z.string().min(1, 'Please select a manufacturer'),
  model_name: z.string().min(1, 'Model name is required').max(200, 'Model name too long'),
  model_number: z.string().max(100, 'Model number too long').optional(),
  device_type: z.enum(['smartphone', 'tablet', 'laptop', 'smartwatch', 'desktop', 'earbuds', 'other']).optional(),
  release_year: z.number().int().min(1900).max(new Date().getFullYear() + 1).optional(),
  image_url: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
  specifications: z.record(z.string()).optional(),
});

type DeviceFormData = z.infer<typeof deviceSchema>;

interface SearchResult {
  external_id: string;
  brand: string;
  model: string;
  model_name: string;
  model_number: string;
  release_date: string | null;
  release_year: number | null;
  image_url: string | null;
  category: string | null;
  already_exists: boolean;
  existing_device_id: string | null;
}

interface DeviceDialogEnhancedProps {
  device?: Device;
  trigger?: React.ReactNode;
  manufacturers: Array<{ id: string; name: string; }>;
  onSuccess?: () => void;
  apiKey?: string;
}

export function DeviceDialogEnhanced({ 
  device, 
  trigger, 
  manufacturers,
  onSuccess,
  apiKey
}: DeviceDialogEnhancedProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(device ? "manual" : "search");
  const queryClient = useQueryClient();
  
  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedDevices, setSelectedDevices] = useState<Set<string>>(new Set());
  const [isImporting, setIsImporting] = useState(false);
  const [importingDeviceId, setImportingDeviceId] = useState<string | null>(null);

  const isEdit = !!device;

  const form = useForm<DeviceFormData>({
    resolver: zodResolver(deviceSchema),
    defaultValues: {
      manufacturer_id: device?.manufacturer_id || '',
      model_name: device?.model_name || '',
      model_number: device?.model_number || '',
      device_type: device?.device_type || 'smartphone',
      release_year: device?.release_year || undefined,
      image_url: device?.image_url || '',
      specifications: device?.specifications || {},
    },
  });

  const createDevice = useCreateDevice();
  const updateDevice = useUpdateDevice();

  async function onSubmit(values: DeviceFormData) {
    setIsLoading(true);

    try {
      const url = isEdit
        ? `/api/admin/devices/${device.id}`
        : '/api/admin/devices';

      const response = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `Failed to ${isEdit ? 'update' : 'create'} device`);
      }

      toast.success(`Device ${isEdit ? 'updated' : 'created'} successfully`);

      form.reset();
      setOpen(false);
      
      if (onSuccess) {
        onSuccess();
      } else {
        queryClient.invalidateQueries({ queryKey: ['devices'] });
      }

    } catch (error) {
      console.error(`Error ${isEdit ? 'updating' : 'creating'} device:`, error);
      toast.error(error instanceof Error ? error.message : `Failed to ${isEdit ? 'update' : 'create'} device`);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSearch() {
    if (!searchQuery.trim() || !apiKey) {
      toast.error(!apiKey ? 'API key required for search' : 'Please enter a search query');
      return;
    }

    setIsSearching(true);
    setSelectedDevices(new Set()); // Clear selections on new search
    
    try {
      const response = await fetch('/api/admin/sync-devices/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey,
          query: searchQuery,
          limit: 50 // Increased to get more variants
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Search failed');
      }

      // Sort results: non-existing devices first, then by model name
      const sortedDevices = (result.devices || []).sort((a: SearchResult, b: SearchResult) => {
        if (a.already_exists !== b.already_exists) {
          return a.already_exists ? 1 : -1;
        }
        return a.model_name.localeCompare(b.model_name);
      });

      setSearchResults(sortedDevices);
      
      if (sortedDevices.length === 0) {
        toast.info('No devices found');
      } else {
        const newDevices = sortedDevices.filter((d: SearchResult) => !d.already_exists);
        const existingDevices = sortedDevices.filter((d: SearchResult) => d.already_exists);
        
        let message = `Found ${sortedDevices.length} unique devices (${newDevices.length} new, ${existingDevices.length} existing)`;
        
        // Add duplicate removal info if any were removed
        if (result.duplicatesRemoved && result.duplicatesRemoved > 0) {
          message += ` • ${result.duplicatesRemoved} duplicates filtered`;
        }
        
        toast.success(message);
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error(error instanceof Error ? error.message : 'Search failed');
    } finally {
      setIsSearching(false);
    }
  }

  async function handleImportSelectedDevices() {
    if (!apiKey) {
      toast.error('API key required for import');
      return;
    }

    if (selectedDevices.size === 0) {
      toast.error('Please select devices to import');
      return;
    }

    setIsImporting(true);
    let successCount = 0;
    let errorCount = 0;

    // Get selected devices that don't already exist
    const devicesToImport = searchResults.filter(
      d => selectedDevices.has(d.external_id || d.model_name) && !d.already_exists
    );

    for (const device of devicesToImport) {
      setImportingDeviceId(device.external_id || device.model_name);
      
      try {
        const response = await fetch('/api/admin/sync-devices/import-single', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            apiKey,
            device,
            fetchFullDetails: true
          })
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Import failed');
        }

        successCount++;
        
        // Update the device in search results to show it now exists
        setSearchResults(prev => prev.map(d => 
          d.external_id === device.external_id 
            ? { ...d, already_exists: true } 
            : d
        ));
        
      } catch (error) {
        console.error(`Import error for ${device.model_name}:`, error);
        errorCount++;
      }
      
      // Small delay between imports to avoid rate limiting
      if (devicesToImport.indexOf(device) < devicesToImport.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    setImportingDeviceId(null);
    setIsImporting(false);
    setSelectedDevices(new Set());

    if (successCount > 0) {
      toast.success(`Successfully imported ${successCount} device${successCount > 1 ? 's' : ''}`);
      
      // Refresh devices list
      if (onSuccess) {
        onSuccess();
      } else {
        queryClient.invalidateQueries({ queryKey: ['devices'] });
      }
    }
    
    if (errorCount > 0) {
      toast.error(`Failed to import ${errorCount} device${errorCount > 1 ? 's' : ''}`);
    }

    if (successCount > 0 && errorCount === 0) {
      // Close dialog if all imports were successful
      setSearchResults([]);
      setSearchQuery('');
      setOpen(false);
    }
  }

  function toggleDeviceSelection(deviceId: string) {
    setSelectedDevices(prev => {
      const newSet = new Set(prev);
      if (newSet.has(deviceId)) {
        newSet.delete(deviceId);
      } else {
        newSet.add(deviceId);
      }
      return newSet;
    });
  }

  function selectAllNewDevices() {
    const newDeviceIds = searchResults
      .filter(d => !d.already_exists)
      .map(d => d.external_id || d.model_name);
    setSelectedDevices(new Set(newDeviceIds));
  }

  const defaultTrigger = (
    <Button size="sm" className="inline-flex items-center gap-1">
      {isEdit ? <Edit className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
      {isEdit ? 'Edit' : 'Add Device'}
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Device' : 'Add New Device'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Update the device information below.' : 'Search TechSpecs database or manually add a device.'}
          </DialogDescription>
        </DialogHeader>

        {!isEdit ? (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="search" className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                Search Database
              </TabsTrigger>
              <TabsTrigger value="manual" className="flex items-center gap-2">
                <Edit className="h-4 w-4" />
                Manual Entry
              </TabsTrigger>
            </TabsList>

            <TabsContent value="search" className="space-y-4 mt-4">
              {/* Search Input */}
              <div className="flex gap-2">
                <Input
                  placeholder="Search for a device (e.g., iPhone 14, Galaxy S24)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  disabled={isSearching || !apiKey}
                />
                <Button 
                  onClick={handleSearch} 
                  disabled={isSearching || !apiKey}
                  className="shrink-0"
                >
                  {isSearching ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                  Search
                </Button>
              </div>

              {!apiKey && (
                <div className="text-sm text-muted-foreground text-center py-4">
                  API key required. Please configure TechSpecs API key in the main devices page.
                </div>
              )}

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="space-y-4">
                  {/* Action Bar */}
                  <div className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={selectAllNewDevices}
                        disabled={searchResults.filter(d => !d.already_exists).length === 0}
                      >
                        Select All New
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        {selectedDevices.size} selected
                      </span>
                    </div>
                    <Button
                      size="sm"
                      onClick={handleImportSelectedDevices}
                      disabled={selectedDevices.size === 0 || isImporting}
                    >
                      {isImporting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Importing...
                        </>
                      ) : (
                        <>
                          <Download className="h-4 w-4 mr-2" />
                          Import Selected ({selectedDevices.size})
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Results Grid */}
                  <ScrollArea className="h-[400px] pr-4">
                    <div className="space-y-2">
                      {searchResults.map((device) => {
                        const deviceId = device.external_id || device.model_name;
                        const isSelected = selectedDevices.has(deviceId);
                        const isImporting = importingDeviceId === deviceId;
                        
                        return (
                          <Card 
                            key={deviceId}
                            className={`transition-all ${
                              device.already_exists 
                                ? 'opacity-60 bg-muted/30' 
                                : isSelected 
                                  ? 'ring-2 ring-primary shadow-md' 
                                  : 'hover:shadow-md cursor-pointer'
                            }`}
                            onClick={() => !device.already_exists && toggleDeviceSelection(deviceId)}
                          >
                            <CardContent className="p-3">
                              <div className="flex items-start gap-3">
                                {/* Checkbox */}
                                <div className="mt-1">
                                  <Checkbox
                                    checked={device.already_exists || isSelected}
                                    disabled={device.already_exists}
                                    onCheckedChange={() => toggleDeviceSelection(deviceId)}
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                </div>

                                {/* Device Image */}
                                {device.image_url && (
                                  <img 
                                    src={device.image_url} 
                                    alt={device.model_name}
                                    className="w-12 h-12 object-contain shrink-0"
                                  />
                                )}

                                {/* Device Info */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h4 className="font-semibold text-sm">{device.model_name}</h4>
                                    {device.already_exists && (
                                      <Badge variant="secondary" className="text-xs">
                                        <CheckCircle className="h-3 w-3 mr-1" />
                                        In Database
                                      </Badge>
                                    )}
                                    {isImporting && (
                                      <Badge variant="default" className="text-xs">
                                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                        Importing...
                                      </Badge>
                                    )}
                                  </div>
                                  
                                  <div className="flex flex-wrap gap-3 mt-1 text-xs text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                      <Package className="h-3 w-3" />
                                      {device.brand}
                                    </span>
                                    {device.model_number && (
                                      <span className="flex items-center gap-1">
                                        <Cpu className="h-3 w-3" />
                                        {device.model_number}
                                      </span>
                                    )}
                                    {device.release_year && (
                                      <span className="flex items-center gap-1">
                                        <Calendar className="h-3 w-3" />
                                        {device.release_year}
                                      </span>
                                    )}
                                    {device.category && (
                                      <span className="flex items-center gap-1">
                                        <Smartphone className="h-3 w-3" />
                                        {device.category}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </TabsContent>

            <TabsContent value="manual" className="mt-4">
              <ManualDeviceForm 
                form={form}
                manufacturers={manufacturers}
                isLoading={isLoading}
                onSubmit={onSubmit}
              />
            </TabsContent>
          </Tabs>
        ) : (
          <ManualDeviceForm 
            form={form}
            manufacturers={manufacturers}
            isLoading={isLoading}
            onSubmit={onSubmit}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

// Manual form component
function ManualDeviceForm({ form, manufacturers, isLoading, onSubmit }: any) {
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="manufacturer_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Manufacturer</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                defaultValue={field.value}
                disabled={isLoading}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select manufacturer" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {manufacturers.map((manufacturer: any) => (
                    <SelectItem key={manufacturer.id} value={manufacturer.id}>
                      {manufacturer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="model_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Model Name</FormLabel>
              <FormControl>
                <Input 
                  placeholder="iPhone 15 Pro" 
                  {...field} 
                  disabled={isLoading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="model_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Model Number</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="A2896" 
                    {...field} 
                    disabled={isLoading}
                  />
                </FormControl>
                <FormDescription>Optional identifier</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="release_year"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Release Year</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="2024"
                    {...field}
                    onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                    disabled={isLoading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="device_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Device Type</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                defaultValue={field.value}
                disabled={isLoading}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select device type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="smartphone">Smartphone</SelectItem>
                  <SelectItem value="tablet">Tablet</SelectItem>
                  <SelectItem value="laptop">Laptop</SelectItem>
                  <SelectItem value="smartwatch">Smartwatch</SelectItem>
                  <SelectItem value="desktop">Desktop</SelectItem>
                  <SelectItem value="earbuds">Earbuds</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <DialogFooter>
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Device
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}