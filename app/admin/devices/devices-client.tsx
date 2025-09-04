"use client";

import { useState } from "react";
import { Device } from "@/lib/types/database.types";
import { useDevices, useDeleteDevice } from "@/lib/hooks/use-admin";
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
  MoreHorizontal
} from "lucide-react";
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
  const { data: devices = initialDevices, isLoading, isFetching, refetch } = useDevices(initialDevices);
  const deleteDevice = useDeleteDevice();
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  
  // Determine if we should show skeleton
  const showSkeleton = useShowSkeleton(isLoading, isFetching, !!devices);
  
  // Ensure devices is always an array
  const safeDevices = Array.isArray(devices) ? devices : [];

  const filteredDevices = safeDevices.filter(device => 
    device.model_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    device.model_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    device.manufacturer?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDeviceUpdate = () => {
    // Query invalidation is handled by mutations
  };

  const handleDelete = async (deviceId: string) => {
    if (!confirm('Are you sure you want to permanently delete this device? This action cannot be undone.')) {
      return;
    }
    deleteDevice.mutate(deviceId);
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
      label: "Refresh",
      icon: <Upload className="h-4 w-4" />,
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
        <DeviceDialog 
          manufacturers={manufacturers} 
          onSuccess={handleDeviceUpdate} 
          fetchMediaGallery={fetchMediaGallery}
          uploadToGallery={uploadToGallery}
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
      <div className="grid gap-4 md:grid-cols-4">
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
            <CardTitle className="text-sm font-medium">With Images</CardTitle>
            <ImageIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {safeDevices.filter(d => d.thumbnail_url).length}
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
                          <DeviceDialog 
                            device={device} 
                            manufacturers={manufacturers} 
                            onSuccess={handleDeviceUpdate}
                            fetchMediaGallery={fetchMediaGallery}
                            uploadToGallery={uploadToGallery}
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
                      <DeviceDialog 
                        device={device} 
                        manufacturers={manufacturers} 
                        onSuccess={handleDeviceUpdate}
                        fetchMediaGallery={fetchMediaGallery}
                        uploadToGallery={uploadToGallery}
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
    </PageContainer>
  );
}