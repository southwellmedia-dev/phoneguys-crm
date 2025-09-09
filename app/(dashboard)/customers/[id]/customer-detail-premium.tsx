'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCustomer, useCustomerDevices } from '@/lib/hooks/use-customers';
import { useQueryClient } from '@tanstack/react-query';
import { EditDeviceDialog } from '@/components/customers/edit-device-dialog';
import { PageContainer } from '@/components/layout/page-container';
import { DeleteCustomerDialog } from '@/components/customers/delete-customer-dialog';
import { createClient } from '@/lib/supabase/client';

// Premium Components
import { ButtonPremium } from '@/components/premium/ui/buttons/button-premium';
import { BadgePremium } from '@/components/premium/ui/badges/badge-premium';
import { StatCard } from '@/components/premium/ui/cards/stat-card';
import { TablePremiumLive } from '@/components/premium/connected/data-display/table-premium-live';
import { StatusBadge } from '@/components/premium/ui/badges/status-badge';
import { InfoCard } from '@/components/premium/ui/cards/info-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Icons
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
  Shield,
  CheckCircle,
  AlertCircle,
  DollarSign,
  Activity,
  Wrench,
  UserCheck,
} from 'lucide-react';

import { Customer, RepairTicket } from '@/lib/types/database.types';
import { toast } from 'sonner';
import { formatDuration } from '@/lib/utils';
import { useShowSkeleton } from '@/lib/hooks/use-navigation-loading';
import { SkeletonCustomerDetail } from '@/components/ui/skeleton-customer-detail';

interface CustomerDetailPremiumProps {
  customer: Customer;
  repairs: RepairTicket[];
  customerDevices: any[];
  customerId: string;
  updateDevice: (deviceId: string, data: any) => Promise<{ success: boolean; data?: any; error?: string }>;
}

export function CustomerDetailPremium({ 
  customer: initialCustomer, 
  repairs, 
  customerDevices, 
  customerId, 
  updateDevice 
}: CustomerDetailPremiumProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: customer = initialCustomer, isLoading, isFetching } = useCustomer(customerId, initialCustomer);
  const [deleting, setDeleting] = useState(false);
  const [editingDevice, setEditingDevice] = useState<any>(null);
  const [devices, setDevices] = useState(customerDevices);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  
  // Hydration strategy
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isLoading && !isFetching && customer) {
      setHasLoadedOnce(true);
    }
  }, [isLoading, isFetching, customer]);

  // Check if user is admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user && user.email) {
        const { data: profile } = await supabase
          .from('users')
          .select('role')
          .eq('email', user.email)
          .single();
        
        setIsAdmin(profile?.role === 'admin' || profile?.role === 'super_admin');
      }
    };
    if (isMounted) {
      checkAdminStatus();
    }
  }, [isMounted]);
  
  // Determine if we should show skeleton
  const showSkeleton = !hasLoadedOnce || isLoading || isFetching;

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
    activeRepairs: repairs.filter(r => r.status !== 'completed' && r.status !== 'cancelled').length,
    completedRepairs: repairs.filter(r => r.status === 'completed').length,
    totalSpent: repairs.reduce((sum, r) => sum + (r.actual_cost || 0), 0),
  };

  // Header actions
  const headerActions = [
    {
      label: "Back",
      icon: <ArrowLeft className="h-4 w-4" />,
      variant: "outline" as const,
      href: "/customers",
    },
    {
      label: "Edit",
      icon: <Edit className="h-4 w-4" />,
      variant: "outline" as const,
      href: `/customers/${customerId}/edit`,
    },
    {
      label: deleting ? "Deleting..." : "Delete",
      icon: <Trash2 className="h-4 w-4" />,
      variant: "destructive" as const,
      onClick: handleDelete,
      disabled: deleting,
    },
  ];

  // Repair history columns
  const repairColumns = [
    {
      key: 'ticket_number',
      label: 'Ticket #',
      sortable: true,
      render: (value: string, row: any) => (
        <span className="font-mono text-sm">{value}</span>
      )
    },
    {
      key: 'device_model',
      label: 'Device',
      render: (value: string, row: any) => (
        <div>
          <div className="font-medium">{row.device_brand} {value}</div>
          {row.repair_issues?.length > 0 && (
            <div className="text-xs text-muted-foreground">
              {row.repair_issues.join(', ')}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (value: string) => <StatusBadge status={value} />
    },
    {
      key: 'created_at',
      label: 'Date',
      sortable: true,
      render: (value: string) => formatDateTime(value)
    },
    {
      key: 'actual_cost',
      label: 'Cost',
      align: 'right' as const,
      render: (value: number) => value ? `$${value.toFixed(2)}` : '-'
    }
  ];

  // Show skeleton during navigation or loading
  if (showSkeleton) {
    return <SkeletonCustomerDetail />;
  }

  return (
    <PageContainer
      title={customer.name}
      description="Customer profile and repair history"
      actions={headerActions}
    >
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Sidebar - Customer Info & Actions */}
        <div className="lg:col-span-4 space-y-6">
          {/* Contact Information Card */}
          <Card className="rounded-lg border bg-card">
            <CardContent className="p-4">
              <div className="-mx-2">
                <InfoCard
                  label="Full Name"
                  value={customer.name}
                  icon={<UserCheck className="h-4 w-4" />}
                />
                
                <InfoCard
                  label="Email Address"
                  value={customer.email}
                  icon={<Mail className="h-4 w-4" />}
                  action={
                    <ButtonPremium
                      size="sm"
                      variant="outline"
                      onClick={() => window.location.href = `mailto:${customer.email}`}
                      className="text-xs h-7 px-2"
                    >
                      <Mail className="h-3 w-3 mr-1" />
                      Send
                    </ButtonPremium>
                  }
                />
                
                <InfoCard
                  label="Phone Number"
                  value={customer.phone}
                  icon={<Phone className="h-4 w-4" />}
                  action={
                    <ButtonPremium
                      size="sm"
                      variant="outline"
                      onClick={() => window.location.href = `tel:${customer.phone}`}
                      className="text-xs h-7 px-2"
                    >
                      <Phone className="h-3 w-3 mr-1" />
                      Call
                    </ButtonPremium>
                  }
                />

                {customer.address && (
                  <InfoCard
                    label="Address"
                    value={customer.address}
                    icon={<MapPin className="h-4 w-4" />}
                  />
                )}

                <InfoCard
                  label="Customer Since"
                  value={formatDate(customer.created_at)}
                  icon={<Calendar className="h-4 w-4" />}
                />

                {customer.notes && (
                  <InfoCard
                    label="Notes"
                    value={customer.notes}
                    icon={<FileText className="h-4 w-4" />}
                  />
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="rounded-lg border bg-card">
            <CardHeader className="p-4 pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="space-y-2">
                <ButtonPremium
                  className="w-full justify-start"
                  variant="gradient"
                  onClick={() => router.push(`/orders/new?customer=${customerId}`)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Repair
                </ButtonPremium>
                
                <ButtonPremium
                  className="w-full justify-start"
                  variant="outline"
                  onClick={() => window.location.href = `mailto:${customer.email}`}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Send Email
                </ButtonPremium>
                
                <ButtonPremium
                  className="w-full justify-start"
                  variant="outline"
                  onClick={() => window.location.href = `tel:${customer.phone}`}
                >
                  <Phone className="h-4 w-4 mr-2" />
                  Call Customer
                </ButtonPremium>
                
                {isAdmin && (
                  <DeleteCustomerDialog
                    customerId={customerId}
                    customerName={customer.name}
                    trigger={
                      <ButtonPremium
                        className="w-full justify-start"
                        variant="destructive"
                      >
                        <Shield className="h-4 w-4 mr-2" />
                        Delete Customer (Admin)
                      </ButtonPremium>
                    }
                    onSuccess={() => router.push('/customers')}
                  />
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-8 space-y-6">
          {/* Statistics Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <StatCard
              label="Total Repairs"
              value={stats.totalRepairs.toString()}
              icon={<Package />}
              variant="default"
              size="sm"
              trendLabel="All time"
            />
            <StatCard
              label="Active"
              value={stats.activeRepairs.toString()}
              icon={<Clock />}
              variant="accent-warning"
              size="sm"
              trendLabel="In progress"
            />
            <StatCard
              label="Completed"
              value={stats.completedRepairs.toString()}
              icon={<CheckCircle />}
              variant="success"
              size="sm"
              trendLabel="Finished"
            />
            <StatCard
              label="Total Spent"
              value={`$${stats.totalSpent.toFixed(0)}`}
              icon={<DollarSign />}
              variant="primary"
              size="sm"
              trendLabel="Lifetime value"
            />
          </div>

          {/* Customer Devices */}
          <Card className="rounded-lg border bg-card">
            <CardHeader className="p-4 pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Smartphone className="h-4 w-4" />
                  Registered Devices
                </CardTitle>
                <ButtonPremium
                  size="sm"
                  variant="outline"
                  onClick={() => router.push(`/customers/${customerId}/devices`)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Device
                </ButtonPremium>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              {devices.length === 0 ? (
                <div className="text-center py-8">
                  <Smartphone className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">No devices registered</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Add a device to track repairs for this customer
                  </p>
                </div>
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  {devices.map((device) => (
                    <div
                      key={device.id}
                      className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors cursor-pointer group"
                      onClick={() => setEditingDevice(device)}
                    >
                      {device.device?.image_url ? (
                        <img
                          src={device.device.image_url}
                          alt={device.device?.model_name}
                          className="w-12 h-12 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                          <Smartphone className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">
                          {device.device?.brand} {device.device?.model_name}
                        </p>
                        {device.serial_number && (
                          <p className="text-xs text-muted-foreground truncate">
                            SN: {device.serial_number}
                          </p>
                        )}
                      </div>
                      <Edit className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Repair History */}
          <Card className="rounded-lg border bg-card">
            <CardHeader className="p-4 pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Wrench className="h-4 w-4" />
                Repair History
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <TablePremiumLive
                endpoint={`/api/customers/${customerId}/repairs`}
                queryKey={['customer-repairs', customerId]}
                columns={repairColumns}
                initialSort={{ key: 'created_at', direction: 'desc' }}
                clickable={true}
                basePath="/orders"
                emptyState={{
                  message: "No repair history",
                  description: "Repairs for this customer will appear here",
                  icon: <Package className="h-12 w-12 text-muted-foreground/50" />
                }}
                className="table-modern"
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Device Dialog */}
      {editingDevice && (
        <EditDeviceDialog
          device={editingDevice}
          onClose={() => setEditingDevice(null)}
          onUpdate={async (updates) => {
            const result = await updateDevice(editingDevice.id, updates);
            if (result.success && result.data) {
              updateDeviceInList(result.data);
              setEditingDevice(null);
              toast.success('Device updated successfully');
            } else {
              toast.error(result.error || 'Failed to update device');
            }
          }}
        />
      )}
    </PageContainer>
  );
}