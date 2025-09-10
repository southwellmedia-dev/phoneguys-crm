"use client";

import { useState } from "react";
import { Device } from "@/lib/types/database.types";
import { useDevices, useDeleteDevice } from "@/lib/hooks/use-admin";
import { useRealtime } from "@/lib/hooks/use-realtime";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageContainer } from "@/components/layout/page-container";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Upload, 
  Download,
  Smartphone,
  Image as ImageIcon,
  MoreHorizontal,
  RefreshCw,
  Database,
  Sparkles,
  CheckCircle,
  XCircle,
  AlertCircle,
  Shield,
  Eye,
  ExternalLink
} from "lucide-react";
import { ButtonPremium, ModalPremium, StatusBadge } from "@/components/premium";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { DeviceDialog } from "@/components/admin/device-dialog";
import { DeviceDialogEnhanced } from "@/components/admin/device-dialog-enhanced";
import { DeviceImageUploadDialog } from "@/components/admin/device-image-upload-dialog";
import { SkeletonTable } from "@/components/ui/skeleton-table";
import { SkeletonGrid } from "@/components/ui/skeleton-grid";
import { useShowSkeleton } from "@/lib/hooks/use-navigation-loading";

interface DevicesClientProps {
  initialDevices: Device[];
  manufacturers: Array<{ id: string; name: string; }>;
  fetchMediaGallery: (searchTerm?: string, limit?: number) => Promise<any>;
  uploadDeviceImage: (formData: FormData) => Promise<any>;
  selectDeviceImage: (deviceId: string, imageUrl: string) => Promise<any>;
  removeDeviceImage: (deviceId: string) => Promise<any>;
  uploadToGallery: (file: File) => Promise<{ success: boolean; data?: { url: string }; error?: string }>;
}

export function DevicesClient({ 
  initialDevices, 
  manufacturers, 
  fetchMediaGallery, 
  uploadDeviceImage, 
  selectDeviceImage, 
  removeDeviceImage,
  uploadToGallery
}: DevicesClientProps) {
  const queryClient = useQueryClient();
  // Don't pass initialDevices to force fresh fetch on client side
  const { data: devices = [], isLoading, isFetching, refetch } = useDevices();
  const deleteDevice = useDeleteDevice();
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{ 
    success?: boolean; 
    message?: string; 
    devicesAdded?: number;
    updatedDevices?: Array<{ name: string; fieldsUpdated: string[] }>;
  }>({});
  const [techSpecsConfig, setTechSpecsConfig] = useState({
    apiKey: '04d83eda-1bf1-4a29-a4cf-2db9234fb97e', // Your TechSpecs API key
    limit: 10,
    testMode: true,
    brand: '',
    autoImport: false
  });
  const [newDevicesToImport, setNewDevicesToImport] = useState<any[]>([]);
  const [showImportConfirm, setShowImportConfirm] = useState(false);
  
  // Set up real-time subscriptions
  useRealtime(['admin']);
  
  // Determine if we should show skeleton
  const showSkeleton = useShowSkeleton(isLoading, isFetching, devices.length > 0);
  
  // Ensure devices is always an array
  const safeDevices = Array.isArray(devices) ? devices : [];

  const filteredDevices = safeDevices.filter(device => {
    if (!device) return false;
    const searchLower = searchTerm.toLowerCase();
    return (
      device.model_name?.toLowerCase().includes(searchLower) ||
      device.model_number?.toLowerCase().includes(searchLower) ||
      device.manufacturer?.name?.toLowerCase().includes(searchLower) ||
      device.brand?.toLowerCase().includes(searchLower)
    );
  });

  const handleDeviceUpdate = () => {
    // Query invalidation is handled by mutations
  };

  const handleDelete = async (deviceId: string) => {
    if (!confirm('Are you sure you want to permanently delete this device? This action cannot be undone.')) {
      return;
    }
    deleteDevice.mutate(deviceId);
  };

  const handleImportConfirmedDevices = async (downloadThumbnails: boolean = false) => {
    try {
      const response = await fetch('/api/admin/sync-devices/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          devices: newDevicesToImport,
          downloadThumbnails
        })
      });

      if (!response.ok) {
        throw new Error('Failed to import devices');
      }

      const result = await response.json();
      
      if (result.success) {
        toast.success(`Successfully imported ${result.imported} device(s)`);
        setShowImportConfirm(false);
        setNewDevicesToImport([]);
        
        // Refresh the device list
        setTimeout(async () => {
          await queryClient.invalidateQueries({ queryKey: ['admin', 'devices'] });
          await refetch();
        }, 500);
      } else {
        toast.error('Failed to import devices');
      }
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Failed to import devices');
    }
  };

  const handleTestTechSpecs = async () => {
    if (!techSpecsConfig.apiKey) {
      toast.error('Please enter an API key');
      return;
    }
    
    setSyncing(true);
    setSyncStatus({});
    
    try {
      const response = await fetch('/api/admin/sync-devices/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: techSpecsConfig.apiKey })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        setSyncStatus({
          success: true,
          message: `Test successful! Found device: ${result.device.name}. API Version: ${result.apiVersion}. Credits used: ${result.creditsUsed || 1}`
        });
        toast.success('API connection verified!');
      } else {
        setSyncStatus({
          success: false,
          message: result.error || 'Test failed'
        });
        toast.error(result.error || 'Test failed');
      }
    } catch (error) {
      console.error('Test error:', error);
      setSyncStatus({
        success: false,
        message: error instanceof Error ? error.message : 'Connection test failed'
      });
      toast.error(error instanceof Error ? error.message : 'Connection test failed');
    } finally {
      setSyncing(false);
    }
  };

  const handleSyncDevices = async (source: 'popular' | 'techspecs', config?: typeof techSpecsConfig) => {
    console.log('Starting sync with source:', source);
    setSyncing(true);
    setSyncStatus({});
    
    try {
      const body: any = { source };
      
      if (source === 'techspecs' && config) {
        body.apiKey = config.apiKey;
        body.limit = config.limit;
        body.testMode = config.testMode;
        body.brand = config.brand || undefined;
        body.autoImport = config.autoImport;
        body.fetchFullDetails = config.fetchFullDetails;
      }
      
      const response = await fetch('/api/admin/sync-devices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('Sync result:', result);
      
      if (result.message && result.message.includes('TechSpecs API is currently experiencing issues')) {
        setSyncStatus({
          success: false,
          message: result.message
        });
        toast.error('TechSpecs API is temporarily unavailable. Please try again in a few minutes.');
      } else if (result.success) {
        // Check if there are new devices to confirm
        if (result.newDevices && result.newDevices.length > 0 && !config?.autoImport) {
          setNewDevicesToImport(result.newDevices);
          setShowImportConfirm(true);
          
          let message = `Found ${result.newDevices.length} new device(s)`;
          if (result.devicesUpdated > 0) {
            message += ` and updated ${result.devicesUpdated} existing device(s)`;
          }
          setSyncStatus({
            success: true,
            message: message,
            updatedDevices: result.updatedDevices
          });
          toast.info(message);
        } else {
          const message = result.devicesAdded > 0 
            ? `Added ${result.devicesAdded} new devices${result.devicesUpdated > 0 ? ` and updated ${result.devicesUpdated} existing devices` : ''}`
            : result.devicesUpdated > 0 
            ? `Updated ${result.devicesUpdated} existing devices`
            : 'All devices are already up to date';
            
          setSyncStatus({
            success: true,
            message: message,
            devicesAdded: result.devicesAdded
          });
          
          if (result.devicesAdded > 0 || result.devicesUpdated > 0) {
            toast.success(message);
            // Invalidate and refetch devices after a small delay to ensure DB is updated
            setTimeout(async () => {
              await queryClient.invalidateQueries({ queryKey: ['admin', 'devices'] });
              await refetch();
            }, 500);
          } else {
            toast.info('All devices are already up to date');
          }
        }
      } else {
        setSyncStatus({
          success: false,
          message: result.error || 'Failed to sync devices'
        });
        toast.error(result.error || 'Failed to sync devices');
      }
    } catch (error) {
      console.error('Sync error:', error);
      setSyncStatus({
        success: false,
        message: error instanceof Error ? error.message : 'Network error occurred'
      });
      toast.error(error instanceof Error ? error.message : 'Failed to connect to sync service');
    } finally {
      setSyncing(false);
    }
  };

  const getDeviceTypeColor = (type?: string | null) => {
    switch (type) {
      case 'smartphone': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'tablet': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'laptop': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'smartwatch': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };
  
  const getDeviceSyncStatus = (device: Device) => {
    // Check if device has been synced with comprehensive data
    const hasExternalId = !!device.external_id;
    const hasSpecs = device.specifications && Object.keys(device.specifications).length > 5;
    const hasScreenSize = !!device.screen_size;
    const hasColors = (device.colors && device.colors.length > 0) || (device.color_options && device.color_options.length > 0);
    const hasStorage = (device.storage_sizes && device.storage_sizes.length > 0) || (device.storage_options && device.storage_options.length > 0);
    const hasReleaseDate = !!device.release_date;
    const hasThumbnail = !!device.external_thumbnail_url;
    const lastSynced = device.last_synced_at;
    
    // Calculate completeness score
    const fields = [hasExternalId, hasSpecs, hasScreenSize, hasColors, hasStorage, hasReleaseDate, hasThumbnail];
    const completedFields = fields.filter(f => f).length;
    const totalFields = fields.length;
    
    if (completedFields === totalFields) {
      return { 
        status: 'synced', 
        label: 'Fully Synced', 
        color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
        tooltip: `All ${totalFields} data fields present`
      };
    } else if (completedFields >= totalFields * 0.6) {
      return { 
        status: 'partial', 
        label: 'Partial', 
        color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
        tooltip: `${completedFields}/${totalFields} fields synced`
      };
    } else if (hasExternalId || lastSynced) {
      return { 
        status: 'basic', 
        label: 'Basic', 
        color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
        tooltip: `${completedFields}/${totalFields} fields synced`
      };
    } else {
      return { 
        status: 'not-synced', 
        label: 'Not Synced', 
        color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
        tooltip: 'Device has not been synced'
      };
    }
  };

  const getAvailabilityColor = (availability?: string | null) => {
    switch (availability) {
      case 'readily_available': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'available': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'limited': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'scarce': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      case 'discontinued': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const headerActions = [
    {
      component: (
        <ButtonPremium
          variant="gradient"
          size="sm"
          icon={<Database className="h-4 w-4" />}
          onClick={() => {
            console.log('Sync button clicked, opening modal');
            setShowSyncModal(true);
          }}
        >
          Sync Devices
        </ButtonPremium>
      ),
    },
    {
      label: "Refresh",
      icon: <RefreshCw className="h-4 w-4" />,
      variant: "outline" as const,
      onClick: () => refetch(),
    },
    {
      label: "Import",
      icon: <Upload className="h-4 w-4" />,
      variant: "outline" as const,
      onClick: () => console.log("Import devices"),
    },
    {
      label: "Export", 
      icon: <Download className="h-4 w-4" />,
      variant: "outline" as const,
      onClick: () => console.log("Export devices"),
    },
    {
      component: (
        <DeviceDialogEnhanced 
          manufacturers={manufacturers} 
          onSuccess={handleDeviceUpdate} 
          apiKey={techSpecsConfig.apiKey}
        />
      ),
    },
  ];

  if (showSkeleton) {
    return (
      <PageContainer
        title="Device Management"
        description="Manage your device database and specifications"
        actions={headerActions}
      >
        {viewMode === "table" ? (
          <SkeletonTable rows={8} columns={7} showStats={true} />
        ) : (
          <SkeletonGrid items={12} showStats={true} />
        )}
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Device Management"
      description="Manage your device database and specifications"
      actions={headerActions}
    >
      <div className="space-y-6">

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Devices</CardTitle>
            <Smartphone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{safeDevices.length}</div>
            <p className="text-xs text-muted-foreground">
              Active in database
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fully Synced</CardTitle>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {safeDevices.filter(d => getDeviceSyncStatus(d).status === 'synced').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Complete data
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">With Images</CardTitle>
            <ImageIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {safeDevices.filter(d => d.thumbnail_url || d.external_thumbnail_url).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Have thumbnails
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Manufacturers</CardTitle>
            <Smartphone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(devices.map(d => d.manufacturer_id)).size}
            </div>
            <p className="text-xs text-muted-foreground">
              Unique brands
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Repairs</CardTitle>
            <Smartphone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {devices.reduce((sum, d) => sum + (d.total_repairs_count || 0), 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all devices
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search devices..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === "table" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("table")}
              >
                Table
              </Button>
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("grid")}
              >
                Grid
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {viewMode === "table" ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Device</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Sync</TableHead>
                  <TableHead>Year</TableHead>
                  <TableHead>Parts</TableHead>
                  <TableHead>Repairs</TableHead>
                  <TableHead>Avg Cost</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDevices.map((device) => (
                  <TableRow key={device.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={device.image_url || device.thumbnail_url || ''} alt={device.model_name} />
                          <AvatarFallback>
                            <Smartphone className="h-5 w-5 text-muted-foreground" />
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{device.model_name}</div>
                          <div className="text-sm text-muted-foreground">
                            {device.manufacturer?.name} {device.model_number && `• ${device.model_number}`}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getDeviceTypeColor(device.device_type)}>
                        {device.device_type || 'Unknown'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={getDeviceSyncStatus(device).color}
                        title={getDeviceSyncStatus(device).tooltip}
                      >
                        {getDeviceSyncStatus(device).label}
                      </Badge>
                    </TableCell>
                    <TableCell>{device.release_year || '-'}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getAvailabilityColor(device.parts_availability)}>
                        {device.parts_availability?.replace('_', ' ') || 'Unknown'}
                      </Badge>
                    </TableCell>
                    <TableCell>{device.total_repairs_count || 0}</TableCell>
                    <TableCell>
                      {device.average_repair_cost 
                        ? `$${device.average_repair_cost.toFixed(2)}`
                        : '-'}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DeviceDialogEnhanced 
                            device={device} 
                            manufacturers={manufacturers} 
                            onSuccess={handleDeviceUpdate}
                            apiKey={techSpecsConfig.apiKey}
                            trigger={
                              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                            }
                          />
                          <DeviceImageUploadDialog
                            device={device}
                            onSuccess={handleDeviceUpdate}
                            fetchMediaGallery={fetchMediaGallery}
                            uploadDeviceImage={uploadDeviceImage}
                            selectDeviceImage={selectDeviceImage}
                            removeDeviceImage={removeDeviceImage}
                            trigger={
                              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                <ImageIcon className="h-4 w-4 mr-2" />
                                Update Image
                              </DropdownMenuItem>
                            }
                          />
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={() => handleDelete(device.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredDevices.map((device) => (
                <Card key={device.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="aspect-square relative mb-3 bg-muted rounded-lg overflow-hidden">
                      {(device.image_url || device.thumbnail_url) ? (
                        <img 
                          src={device.image_url || device.thumbnail_url} 
                          alt={device.model_name}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <Smartphone className="h-12 w-12 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <CardTitle className="text-base">{device.model_name}</CardTitle>
                    <CardDescription>
                      {device.manufacturer?.name} • {device.release_year || 'N/A'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Type:</span>
                        <Badge variant="outline" className="text-xs">
                          {device.device_type || 'Unknown'}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Sync:</span>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${getDeviceSyncStatus(device).color}`}
                          title={getDeviceSyncStatus(device).tooltip}
                        >
                          {getDeviceSyncStatus(device).label}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Repairs:</span>
                        <span>{device.total_repairs_count || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Avg Cost:</span>
                        <span>
                          {device.average_repair_cost 
                            ? `$${device.average_repair_cost.toFixed(0)}`
                            : '-'}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <DeviceDialogEnhanced 
                        device={device} 
                        manufacturers={manufacturers} 
                        onSuccess={handleDeviceUpdate}
                        apiKey={techSpecsConfig.apiKey}
                        trigger={
                          <Button variant="outline" size="sm" className="flex-1">
                            Edit
                          </Button>
                        }
                      />
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DeviceImageUploadDialog
                            device={device}
                            onSuccess={handleDeviceUpdate}
                            fetchMediaGallery={fetchMediaGallery}
                            uploadDeviceImage={uploadDeviceImage}
                            selectDeviceImage={selectDeviceImage}
                            removeDeviceImage={removeDeviceImage}
                            trigger={
                              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                <ImageIcon className="h-4 w-4 mr-2" />
                                Update Image
                              </DropdownMenuItem>
                            }
                          />
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={() => handleDelete(device.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      </div>

      {/* Sync Devices Modal */}
      <ModalPremium
        open={showSyncModal}
        onOpenChange={(open) => {
          console.log('Modal state changing to:', open);
          if (!open) {
            setShowSyncModal(false);
            setSyncStatus({});
          }
        }}
        title="Sync Device Database"
        description="Import the latest device information from various sources"
      >
        <div className="space-y-6">
          {!syncing && !syncStatus.message && (
            <>
              <div className="space-y-4">
                <div className="p-4 bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-950/30 dark:to-blue-950/30 rounded-lg border border-cyan-200 dark:border-cyan-800">
                  <h3 className="font-semibold text-cyan-900 dark:text-cyan-100 mb-2">Popular Devices</h3>
                  <p className="text-sm text-cyan-700 dark:text-cyan-300 mb-3">
                    Import 50+ latest devices from Apple, Samsung, and Google. No API key required.
                  </p>
                  <ButtonPremium
                    variant="default"
                    size="sm"
                    icon={<Database className="h-4 w-4" />}
                    onClick={() => {
                      console.log('Sync Popular Devices clicked');
                      handleSyncDevices('popular');
                    }}
                    className="w-full"
                  >
                    Sync Popular Devices
                  </ButtonPremium>
                </div>

                <div className="p-4 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30 rounded-lg border border-purple-200 dark:border-purple-800">
                  <h3 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">TechSpecs API v5</h3>
                  <p className="text-sm text-purple-700 dark:text-purple-300 mb-3">
                    Comprehensive device database with detailed specifications. Requires API key.
                  </p>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-medium text-purple-700 dark:text-purple-300 mb-1 block">
                        API Key
                      </label>
                      <Input
                        placeholder="Enter API key or ID:KEY format"
                        type="password"
                        value={techSpecsConfig.apiKey}
                        onChange={(e) => setTechSpecsConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                        className="w-full"
                      />
                      <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                        Enter just the API key, or use format: API_ID:API_KEY
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-medium text-purple-700 dark:text-purple-300 mb-1 block">
                          Device Limit
                        </label>
                        <Input
                          type="number"
                          min="1"
                          max="50"
                          value={techSpecsConfig.limit}
                          onChange={(e) => setTechSpecsConfig(prev => ({ ...prev, limit: parseInt(e.target.value) || 10 }))}
                          className="w-full"
                        />
                      </div>
                      
                      <div>
                        <label className="text-xs font-medium text-purple-700 dark:text-purple-300 mb-1 block">
                          Manufacturer
                        </label>
                        <select
                          value={techSpecsConfig.brand}
                          onChange={(e) => setTechSpecsConfig(prev => ({ ...prev, brand: e.target.value }))}
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <option value="">All Manufacturers</option>
                          <option value="Apple">Apple</option>
                          <option value="Samsung">Samsung</option>
                          <option value="Google">Google</option>
                          <option value="OnePlus">OnePlus</option>
                          <option value="Xiaomi">Xiaomi</option>
                          <option value="Motorola">Motorola</option>
                          <option value="Sony">Sony</option>
                          <option value="LG">LG</option>
                          <option value="Huawei">Huawei</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 p-2 bg-purple-100 dark:bg-purple-900/30 rounded">
                        <input
                          type="checkbox"
                          id="test-mode"
                          checked={techSpecsConfig.testMode}
                          onChange={(e) => setTechSpecsConfig(prev => ({ ...prev, testMode: e.target.checked }))}
                          className="rounded"
                        />
                        <label htmlFor="test-mode" className="text-xs text-purple-700 dark:text-purple-300">
                          Test Mode (Only sync 1 device first to verify)
                        </label>
                      </div>
                      
                      <div className="flex items-center gap-2 p-2 bg-purple-100 dark:bg-purple-900/30 rounded">
                        <input
                          type="checkbox"
                          id="auto-import"
                          checked={techSpecsConfig.autoImport}
                          onChange={(e) => setTechSpecsConfig(prev => ({ ...prev, autoImport: e.target.checked }))}
                          className="rounded"
                        />
                        <label htmlFor="auto-import" className="text-xs text-purple-700 dark:text-purple-300">
                          Auto-import new devices (skip confirmation)
                        </label>
                      </div>
                      
                      <div className="flex items-center gap-2 p-2 bg-blue-100 dark:bg-blue-900/30 rounded">
                        <input
                          type="checkbox"
                          id="fetch-full-details"
                          checked={techSpecsConfig.fetchFullDetails}
                          onChange={(e) => setTechSpecsConfig(prev => ({ ...prev, fetchFullDetails: e.target.checked }))}
                          className="rounded"
                        />
                        <label htmlFor="fetch-full-details" className="text-xs text-blue-700 dark:text-blue-300">
                          Fetch comprehensive device specifications (uses more API credits)
                        </label>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <ButtonPremium
                        variant="outline"
                        size="sm"
                        onClick={handleTestTechSpecs}
                        disabled={!techSpecsConfig.apiKey || syncing}
                        className="flex-1"
                      >
                        Test Connection
                      </ButtonPremium>
                      <ButtonPremium
                        variant="gradient"
                        size="sm"
                        icon={<Database className="h-4 w-4" />}
                        onClick={() => {
                          if (techSpecsConfig.apiKey) {
                            handleSyncDevices('techspecs', techSpecsConfig);
                          } else {
                            toast.error('Please enter an API key');
                          }
                        }}
                        disabled={!techSpecsConfig.apiKey || syncing}
                        className="flex-1"
                      >
                        {techSpecsConfig.testMode ? 'Test Sync (1 device)' : `Sync ${techSpecsConfig.limit} Devices`}
                      </ButtonPremium>
                    </div>
                    
                    {/* Initial Sync Button - for populating empty database */}
                    <div className="mt-3 p-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 rounded-lg border border-green-200 dark:border-green-800">
                      <div className="flex items-start gap-2">
                        <div className="flex-1">
                          <h4 className="text-sm font-semibold text-green-900 dark:text-green-100">Initial Database Setup</h4>
                          <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                            One-click setup to populate your database with the latest 100 smartphones from all major brands with full specifications
                          </p>
                        </div>
                        <ButtonPremium
                          variant="gradient"
                          size="sm"
                          icon={<Sparkles className="h-4 w-4" />}
                          onClick={async () => {
                            if (!techSpecsConfig.apiKey) {
                              toast.error('Please enter an API key first');
                              return;
                            }
                            
                            setSyncing(true);
                            toast.info('Starting initial sync with full details... This may take 5-10 minutes');
                            
                            try {
                              const response = await fetch('/api/admin/sync-devices/initial', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  apiKey: techSpecsConfig.apiKey,
                                  totalDevices: 100,
                                  autoImport: true,
                                  fetchFullDetails: true
                                })
                              });
                              
                              const result = await response.json();
                              
                              if (result.success) {
                                toast.success(`Successfully imported ${result.devicesImported} devices!`);
                                
                                // Show brand breakdown
                                if (result.brandBreakdown) {
                                  console.log('Brand breakdown:', result.brandBreakdown);
                                }
                                
                                // Refresh the devices list
                                refetch();
                              } else {
                                toast.error(result.error || 'Initial sync failed');
                              }
                            } catch (error) {
                              console.error('Initial sync error:', error);
                              toast.error('Failed to perform initial sync');
                            } finally {
                              setSyncing(false);
                            }
                          }}
                          disabled={!techSpecsConfig.apiKey || syncing}
                        >
                          Initial Sync (100 Devices)
                        </ButtonPremium>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-purple-600 dark:text-purple-400 mt-2">
                    Get your API key at <a href="https://techspecs.io" target="_blank" rel="noopener noreferrer" className="underline">techspecs.io</a>
                  </p>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <StatusBadge status="info" variant="soft" />
                  <span>Current devices in database: {safeDevices.length}</span>
                </div>
              </div>
            </>
          )}

          {syncing && (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
                <RefreshCw className="h-6 w-6 text-primary animate-spin" />
              </div>
              <p className="text-lg font-medium">Syncing devices...</p>
              <p className="text-sm text-muted-foreground mt-1">This may take a few moments</p>
            </div>
          )}

          {syncStatus.message && (
            <div className="space-y-4">
              <div className={`p-4 rounded-lg ${
                syncStatus.success 
                  ? 'bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800' 
                  : 'bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800'
              }`}>
                <div className="flex items-start gap-3">
                  <StatusBadge 
                    status={syncStatus.success ? 'success' : 'error'} 
                    variant="soft"
                  />
                  <div className="flex-1">
                    <p className={`font-medium ${
                      syncStatus.success 
                        ? 'text-green-900 dark:text-green-100' 
                        : 'text-red-900 dark:text-red-100'
                    }`}>
                      {syncStatus.message}
                    </p>
                    {syncStatus.devicesAdded && syncStatus.devicesAdded > 0 && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {syncStatus.devicesAdded} new devices added to your database
                      </p>
                    )}
                    {syncStatus.updatedDevices && syncStatus.updatedDevices.length > 0 && (
                      <div className="mt-3 space-y-2">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Updated devices:</p>
                        <div className="max-h-48 overflow-y-auto space-y-1">
                          {syncStatus.updatedDevices.map((device, idx) => (
                            <div key={idx} className="text-sm text-gray-600 dark:text-gray-400 pl-2">
                              <span className="font-medium">{device.name}:</span>
                              <span className="ml-2">{device.fieldsUpdated.join(', ')}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end gap-2">
                <ButtonPremium
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSyncStatus({});
                  }}
                >
                  Sync More
                </ButtonPremium>
                <ButtonPremium
                  variant="default"
                  size="sm"
                  onClick={() => {
                    setShowSyncModal(false);
                    setSyncStatus({});
                  }}
                >
                  Done
                </ButtonPremium>
              </div>
            </div>
          )}
        </div>
      </ModalPremium>

      {/* Import Confirmation Modal */}
      <ModalPremium
        open={showImportConfirm}
        onOpenChange={setShowImportConfirm}
        title="Confirm Device Import"
        description={`Found ${newDevicesToImport.length} new device(s) not in your database`}
      >
        <div className="space-y-4">
          <div className="max-h-96 overflow-y-auto space-y-2 border rounded-lg p-3">
            {newDevicesToImport.map((device, index) => (
              <div key={index} className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded">
                <div className="flex items-center gap-3">
                  {device.image_url && (
                    <img 
                      src={device.image_url} 
                      alt={device.name}
                      className="w-10 h-10 object-cover rounded"
                    />
                  )}
                  <div>
                    <div className="font-medium">{device.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {device.brand} • {device.model}
                      {device.release_date && ` • ${new Date(device.release_date).getFullYear()}`}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
            <input
              type="checkbox"
              id="download-thumbnails"
              className="rounded"
            />
            <label htmlFor="download-thumbnails" className="text-sm">
              Download and store thumbnails locally (recommended)
            </label>
          </div>
          
          <div className="flex justify-end gap-2">
            <ButtonPremium
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowImportConfirm(false);
                setNewDevicesToImport([]);
              }}
            >
              Cancel
            </ButtonPremium>
            <ButtonPremium
              variant="gradient"
              size="sm"
              onClick={() => {
                const downloadThumbnails = (document.getElementById('download-thumbnails') as HTMLInputElement)?.checked;
                handleImportConfirmedDevices(downloadThumbnails);
              }}
            >
              Import {newDevicesToImport.length} Device{newDevicesToImport.length !== 1 ? 's' : ''}
            </ButtonPremium>
          </div>
        </div>
      </ModalPremium>
    </PageContainer>
  );
}