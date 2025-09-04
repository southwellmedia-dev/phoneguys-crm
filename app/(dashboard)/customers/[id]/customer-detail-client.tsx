'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCustomer, useUpdateCustomer, useCustomerDevices } from '@/lib/hooks/use-customers';
import { useQueryClient } from '@tanstack/react-query';
import { EditDeviceDialog } from '@/components/customers/edit-device-dialog';
import { PageContainer } from '@/components/layout/page-container';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/orders/status-badge';
import {
  ArrowLeft,
  Edit,
  Mail,
  Phone,
  User,
  Calendar,
  MapPin,
  FileText,
  Package,
  Clock,
  Trash2,
  Plus,
  Smartphone,
} from 'lucide-react';
import { Customer, RepairTicket } from '@/lib/types/database.types';
import { toast } from 'sonner';
import { formatDuration } from '@/lib/utils';
import { useShowSkeleton } from '@/lib/hooks/use-navigation-loading';
import { SkeletonCustomerDetail } from '@/components/ui/skeleton-customer-detail';

interface CustomerDetailClientProps {
  customer: Customer;
  repairs: RepairTicket[];
  customerDevices: any[];
  customerId: string;
  updateDevice: (deviceId: string, data: any) => Promise<{ success: boolean; data?: any; error?: string }>;
}

export function CustomerDetailClient({ customer: initialCustomer, repairs, customerDevices, customerId, updateDevice }: CustomerDetailClientProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: customer = initialCustomer, isLoading, isFetching } = useCustomer(customerId, initialCustomer);
  const [deleting, setDeleting] = useState(false);
  const [editingDevice, setEditingDevice] = useState<any>(null);
  const [devices, setDevices] = useState(customerDevices);
  
  // Determine if we should show skeleton
  const showSkeleton = useShowSkeleton(isLoading, isFetching, !!customer);

  const updateDeviceInList = (updatedDevice: any) => {
    setDevices(prevDevices => 
      prevDevices.map(device => 
        device.id === updatedDevice.id 
          ? { ...device, ...updatedDevice }
          : device
      )
    );
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this customer? This will also delete all associated repair tickets.')) {
      return;
    }

    setDeleting(true);
    try {
      const response = await fetch(`/api/customers/${customerId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete customer');
      }

      toast.success('Customer deleted successfully');
      router.push('/customers');
    } catch (error) {
      console.error('Error deleting customer:', error);
      toast.error('Failed to delete customer');
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatDateTime = (date: string) => {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  // Calculate statistics
  const stats = {
    totalRepairs: repairs.length,
    activeRepairs: repairs.filter(r => r.status !== 'COMPLETED' && r.status !== 'CANCELLED').length,
    completedRepairs: repairs.filter(r => r.status === 'COMPLETED').length,
    totalSpent: repairs.reduce((sum, r) => sum + (r.actual_cost || 0), 0),
  };

  const headerActions = (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" asChild>
        <Link href="/customers">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Customers
        </Link>
      </Button>
      <Button variant="outline" size="sm" asChild>
        <Link href={`/customers/${customerId}/edit`}>
          <Edit className="h-4 w-4 mr-2" />
          Edit
        </Link>
      </Button>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={handleDelete}
        disabled={deleting}
        className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
      >
        <Trash2 className="h-4 w-4 mr-2" />
        {deleting ? 'Deleting...' : 'Delete'}
      </Button>
    </div>
  );

  // Show skeleton during navigation or loading
  if (showSkeleton) {
    return <SkeletonCustomerDetail />;
  }

  return (
    <PageContainer
      title={customer.name}
      description="Customer details and repair history"
      headerActions={headerActions}
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer Information */}
        <div className="lg:col-span-1 space-y-6">
          {/* Contact Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Name</p>
                <p className="font-medium">{customer.name}</p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground mb-1">Email</p>
                <a 
                  href={`mailto:${customer.email}`}
                  className="flex items-center gap-2 text-primary hover:underline"
                >
                  <Mail className="h-4 w-4" />
                  {customer.email}
                </a>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground mb-1">Phone</p>
                <a 
                  href={`tel:${customer.phone}`}
                  className="flex items-center gap-2 text-primary hover:underline"
                >
                  <Phone className="h-4 w-4" />
                  {customer.phone}
                </a>
              </div>

              {customer.address && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Address</p>
                  <div className="flex gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <p className="text-sm">{customer.address}</p>
                  </div>
                </div>
              )}

              <div>
                <p className="text-sm text-muted-foreground mb-1">Customer Since</p>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  {formatDate(customer.created_at)}
                </div>
              </div>

              {customer.notes && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Notes</p>
                  <div className="flex gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <p className="text-sm">{customer.notes}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full justify-start" variant="outline" asChild>
                <Link href={`/orders/new?customer=${customerId}`}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Repair
                </Link>
              </Button>
              <Button className="w-full justify-start" variant="outline" asChild>
                <a href={`mailto:${customer.email}`}>
                  <Mail className="h-4 w-4 mr-2" />
                  Send Email
                </a>
              </Button>
              <Button className="w-full justify-start" variant="outline" asChild>
                <a href={`tel:${customer.phone}`}>
                  <Phone className="h-4 w-4 mr-2" />
                  Call Customer
                </a>
              </Button>
            </CardContent>
          </Card>

          {/* Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-2xl font-bold">{stats.totalRepairs}</p>
                  <p className="text-xs text-muted-foreground">Total Repairs</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.activeRepairs}</p>
                  <p className="text-xs text-muted-foreground">Active</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.completedRepairs}</p>
                  <p className="text-xs text-muted-foreground">Completed</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">${stats.totalSpent}</p>
                  <p className="text-xs text-muted-foreground">Total Spent</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right column - Devices and Repair History */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Devices */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                Devices
              </CardTitle>
              <Button size="sm" variant="outline" asChild>
                <Link href={`/customers/${customerId}/devices`}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Device
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {devices.length === 0 ? (
                <div className="text-center py-4">
                  <Smartphone className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No devices registered</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {devices.map((device) => (
                    <div
                      key={device.id}
                      className="flex items-center gap-3 p-2 rounded-lg border bg-card hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => setEditingDevice(device)}
                    >
                      {device.device?.image_url && (
                        <img
                          src={device.device.image_url}
                          alt={device.device?.model_name}
                          className="w-10 h-10 object-cover rounded"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium truncate">
                            {device.nickname || `${device.device?.manufacturer?.name} ${device.device?.model_name}`}
                          </p>
                          {device.is_primary && (
                            <Badge variant="secondary" className="text-xs">Primary</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {device.color && `${device.color}`}
                          {device.storage_size && ` • ${device.storage_size}`}
                          {device.condition && ` • ${device.condition}`}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {device.serial_number && `S/N: ${device.serial_number}`}
                          {device.imei && ` • IMEI: ${device.imei}`}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingDevice(device);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Repair History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Repair History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {repairs.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                  <p className="text-muted-foreground">No repair history yet</p>
                  <Button className="mt-4" asChild>
                    <Link href={`/orders/new?customer=${customerId}`}>
                      Create First Repair
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {repairs.map((repair) => (
                    <Link
                      key={repair.id}
                      href={`/orders/${repair.id}`}
                      className="block"
                    >
                      <div className="p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">
                                {repair.ticket_number}
                              </span>
                              <StatusBadge status={repair.status} />
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {repair.device_brand} {repair.device_model}
                            </p>
                          </div>
                          {repair.actual_cost && (
                            <span className="font-medium">
                              ${repair.actual_cost}
                            </span>
                          )}
                        </div>
                        
                        {repair.issues && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {repair.issues.map((issue, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {issue.replace(/_/g, ' ')}
                              </Badge>
                            ))}
                          </div>
                        )}
                        
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDateTime(repair.created_at)}
                          </div>
                          {repair.total_time_minutes > 0 && (
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDuration(repair.total_time_minutes)}
                            </div>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Edit Device Dialog */}
      {editingDevice && (
        <EditDeviceDialog
          open={!!editingDevice}
          onOpenChange={(open) => !open && setEditingDevice(null)}
          device={editingDevice}
          customerId={customerId}
          updateDevice={updateDevice}
          onSuccess={(updatedDevice) => {
            // Update the device in the local list
            if (updatedDevice) {
              updateDeviceInList(updatedDevice);
            }
            setEditingDevice(null);
            queryClient.invalidateQueries({ queryKey: ['customer', customerId] });
            queryClient.invalidateQueries({ queryKey: ['customer-devices', customerId] });
          }}
        />
      )}
    </PageContainer>
  );
}