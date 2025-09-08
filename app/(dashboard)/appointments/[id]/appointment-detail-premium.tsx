"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppointment, useUpdateAppointment } from "@/lib/hooks/use-appointments";
import { useRealtime } from "@/lib/hooks/use-realtime";
import { PageContainer } from "@/components/layout/page-container";
import {
  ServiceSelectorCard,
  NotesCard,
  type CustomerData,
  type Service,
  type NotesData
} from "@/components/premium/features/appointments/ui";
import { DeviceDetailCard, type DeviceData } from "@/components/premium/features/appointments/ui/device-detail-card-premium";
import { DeviceSelector } from "@/components/appointments/device-selector";
import { StatusBadge } from "@/components/premium/ui/badges/status-badge";
import { MetricCard } from "@/components/premium/ui/cards/metric-card";
import { SkeletonPremium } from "@/components/premium/ui/feedback/skeleton-premium";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SelectPremium } from "@/components/premium/ui/forms/select-premium";
import { ButtonPremium } from "@/components/premium/ui/buttons/button-premium";
import Link from "next/link";
import { 
  Calendar,
  Clock,
  MapPin,
  User,
  AlertCircle,
  Save,
  Edit,
  CheckCircle,
  Phone,
  Mail,
  Smartphone,
  FileText,
  Wrench,
  DollarSign
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { 
  convertAppointmentToTicket, 
  confirmAppointment, 
  markAppointmentArrived, 
  cancelAppointment,
  updateAppointmentDetails
} from "./actions";

interface AppointmentDetailPremiumProps {
  appointment: any;
  appointmentId: string;
  availableServices: Service[];
  availableDevices: any[];
  customerDevices?: any[];
  technicians?: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
  }>;
}

export function AppointmentDetailPremium({ 
  appointment: initialAppointment, 
  appointmentId, 
  availableServices,
  availableDevices,
  customerDevices = [],
  technicians = []
}: AppointmentDetailPremiumProps) {
  const router = useRouter();
  const { data: appointment = initialAppointment, showSkeleton } = useAppointment(appointmentId, initialAppointment);
  const updateAppointment = useUpdateAppointment();
  
  // Set up real-time subscriptions
  useRealtime(['appointments']);
  
  // Check if user is admin
  useEffect(() => {
    async function checkAdminStatus() {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Check metadata for role
        const role = user.app_metadata?.role || user.user_metadata?.role;
        if (role === 'admin') {
          setIsAdmin(true);
        } else {
          // Fallback to database check
          const { data: userData } = await supabase
            .from('users')
            .select('role')
            .eq('email', user.email)
            .single();
          setIsAdmin(userData?.role === 'admin');
        }
      }
    }
    checkAdminStatus();
  }, []);
  
  // Update currentStatus when appointment changes
  useEffect(() => {
    setCurrentStatus(appointment.status);
  }, [appointment.status]);
  
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(appointment.status);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isChangingStatus, setIsChangingStatus] = useState(false);
  const [actionLoading, setActionLoading] = useState({
    confirm: false,
    arrived: false,
    cancel: false,
    convert: false
  });
  
  // Check if appointment is locked
  const isLocked = appointment.status === 'converted' || 
                   appointment.status === 'cancelled' || 
                   appointment.status === 'no_show';
  
  // Parse notes
  const parsedNotes = (() => {
    try {
      if (appointment.notes && typeof appointment.notes === 'string' && appointment.notes.startsWith('{')) {
        return JSON.parse(appointment.notes);
      }
    } catch (e) {
      // If parsing fails, treat as plain text
    }
    return { customer_notes: appointment.notes || '', technician_notes: '' };
  })();
  
  // Form state
  const [customerData, setCustomerData] = useState<CustomerData>({
    id: appointment.customer_id,
    name: appointment.customers?.name || appointment.customer_name || '',
    email: appointment.customers?.email || appointment.customer_email || '',
    phone: appointment.customers?.phone || appointment.customer_phone || '',
    address: appointment.customers?.address,
    city: appointment.customers?.city,
    state: appointment.customers?.state,
    zip: appointment.customers?.zip,
    previousAppointments: appointment.customers?.appointment_count || 0,
    notificationPreference: appointment.notification_preference || 'email',
    createdAt: appointment.customers?.created_at
  });

  // Find if there's a customer device selected
  const customerDevice = React.useMemo(() => {
    // Check if the appointment has a customer_device_id
    if (appointment.customer_device_id) {
      return customerDevices.find(cd => cd.id === appointment.customer_device_id);
    }
    // Check if the device_id matches a customer device
    if (appointment.device_id && customerDevices.length > 0) {
      return customerDevices.find(cd => cd.device_id === appointment.device_id || cd.devices?.id === appointment.device_id);
    }
    return null;
  }, [appointment.customer_device_id, appointment.device_id, customerDevices]);

  const [deviceData, setDeviceData] = useState<DeviceData>({
    id: appointment.device_id,
    manufacturer: appointment.devices?.manufacturers?.name,
    modelName: appointment.devices?.model_name,
    serialNumber: appointment.customer_devices?.serial_number || '',
    imei: appointment.customer_devices?.imei || '',
    color: appointment.customer_devices?.color || '',
    storageSize: appointment.customer_devices?.storage_size || '',
    condition: appointment.customer_devices?.condition || 'good',
    issues: appointment.issues || []
  });

  const [selectedServices, setSelectedServices] = useState<string[]>(
    appointment.service_ids || []
  );

  const [notes, setNotes] = useState<NotesData>({
    customerNotes: parsedNotes.customer_notes || '',
    technicianNotes: parsedNotes.technician_notes || '',
    additionalIssues: parsedNotes.additional_issues || ''
  });

  // Update form data when appointment changes
  useEffect(() => {
    const parsedNotes = (() => {
      try {
        if (appointment.notes && typeof appointment.notes === 'string' && appointment.notes.startsWith('{')) {
          return JSON.parse(appointment.notes);
        }
      } catch (e) {}
      return { customer_notes: appointment.notes || '', technician_notes: '' };
    })();

    setCustomerData({
      id: appointment.customer_id,
      name: appointment.customers?.name || appointment.customer_name || '',
      email: appointment.customers?.email || appointment.customer_email || '',
      phone: appointment.customers?.phone || appointment.customer_phone || '',
      address: appointment.customers?.address,
      city: appointment.customers?.city,
      state: appointment.customers?.state,
      zip: appointment.customers?.zip,
      previousAppointments: appointment.customers?.appointment_count || 0,
      notificationPreference: appointment.notification_preference || 'email',
      createdAt: appointment.customers?.created_at
    });

    setDeviceData({
      id: appointment.device_id,
      manufacturer: appointment.devices?.manufacturers?.name,
      modelName: appointment.devices?.model_name,
      serialNumber: appointment.customer_devices?.serial_number || '',
      imei: appointment.customer_devices?.imei || '',
      color: appointment.customer_devices?.color || '',
      storageSize: appointment.customer_devices?.storage_size || '',
      condition: appointment.customer_devices?.condition || 'good',
      issues: appointment.issues || []
    });

    setSelectedServices(appointment.service_ids || []);
    
    setNotes({
      customerNotes: parsedNotes.customer_notes || '',
      technicianNotes: parsedNotes.technician_notes || '',
      additionalIssues: parsedNotes.additional_issues || ''
    });
  }, [appointment]);

  const handleServiceToggle = (serviceId: string) => {
    setSelectedServices(prev => 
      prev.includes(serviceId)
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const notesJson = JSON.stringify({
        customer_notes: notes.customerNotes,
        technician_notes: notes.technicianNotes,
        additional_issues: notes.additionalIssues
      });

      await updateAppointmentDetails(appointmentId, {
        device_id: deviceData.id,
        service_ids: selectedServices,
        notes: notesJson,
        notification_preference: customerData.notificationPreference,
        // Device details would need to be saved to customer_devices table
      });

      toast.success('Appointment details updated successfully');
      setIsEditing(false);
    } catch (error) {
      toast.error('Failed to update appointment details');
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirm = async () => {
    setActionLoading(prev => ({ ...prev, confirm: true }));
    try {
      await confirmAppointment(appointmentId);
      toast.success('Appointment confirmed');
    } catch (error) {
      toast.error('Failed to confirm appointment');
    } finally {
      setActionLoading(prev => ({ ...prev, confirm: false }));
    }
  };

  const handleMarkArrived = async () => {
    setActionLoading(prev => ({ ...prev, arrived: true }));
    try {
      await markAppointmentArrived(appointmentId);
      toast.success('Customer marked as arrived');
    } catch (error) {
      toast.error('Failed to update appointment');
    } finally {
      setActionLoading(prev => ({ ...prev, arrived: false }));
    }
  };

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this appointment?')) return;
    
    setActionLoading(prev => ({ ...prev, cancel: true }));
    try {
      await cancelAppointment(appointmentId);
      toast.success('Appointment cancelled');
    } catch (error) {
      toast.error('Failed to cancel appointment');
    } finally {
      setActionLoading(prev => ({ ...prev, cancel: false }));
    }
  };

  const handleConvertToTicket = async () => {
    if (!confirm('Convert this appointment to a repair ticket?')) return;
    
    setActionLoading(prev => ({ ...prev, convert: true }));
    try {
      const result = await convertAppointmentToTicket(appointmentId);
      toast.success('Successfully converted to ticket');
      router.push(`/orders/${result.ticketId}`);
    } catch (error) {
      toast.error('Failed to convert appointment');
    } finally {
      setActionLoading(prev => ({ ...prev, convert: false }));
    }
  };

  // Format date and time for header
  const formattedDate = React.useMemo(() => {
    if (!appointment.scheduled_date) return '';
    const date = new Date(appointment.scheduled_date + 'T' + appointment.scheduled_time);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      month: 'long', 
      day: 'numeric',
      year: 'numeric'
    });
  }, [appointment.scheduled_date, appointment.scheduled_time]);
  
  const formattedTime = React.useMemo(() => {
    if (!appointment.scheduled_time) return '';
    const [hours, minutes] = appointment.scheduled_time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  }, [appointment.scheduled_time]);

  const headerActions = React.useMemo(() => {
    if (isEditing) {
      return [
        {
          label: "Cancel",
          variant: "outline" as const,
          onClick: () => setIsEditing(false),
          disabled: isSaving,
        },
        {
          label: isSaving ? "Saving..." : "Save Changes",
          variant: "gradient" as const,
          onClick: handleSave,
          disabled: isSaving,
          icon: isSaving ? <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save className="h-4 w-4" />,
        }
      ];
    }
    
    const actions = [];
    
    // Status-based actions
    if (appointment.status === 'scheduled' && !isLocked) {
      actions.push({
        label: "Confirm",
        variant: "default" as const,
        onClick: handleConfirm,
        icon: <CheckCircle className="h-4 w-4" />,
        disabled: actionLoading.confirm,
      });
    }
    
    if (appointment.status === 'confirmed' && !isLocked) {
      actions.push({
        label: "Mark Arrived",
        variant: "default" as const,
        onClick: handleMarkArrived,
        icon: <User className="h-4 w-4" />,
        disabled: actionLoading.arrived,
      });
    }
    
    if ((appointment.status === 'scheduled' || appointment.status === 'confirmed' || appointment.status === 'arrived') && !isLocked) {
      actions.push({
        label: "Convert to Ticket",
        variant: "success" as const,
        onClick: handleConvertToTicket,
        icon: <FileText className="h-4 w-4" />,
        disabled: actionLoading.convert,
      });
    }
    
    if (!isLocked) {
      actions.push({
        label: "Edit",
        variant: "outline" as const,
        onClick: () => setIsEditing(true),
        icon: <Edit className="h-4 w-4" />,
      });
    }
    
    return actions;
  }, [isEditing, isSaving, appointment.status, isLocked, actionLoading]);

  return (
    <PageContainer
      title={`Appointment ${appointment.appointment_number}`}
      description={`${formattedDate} at ${formattedTime}`}
      actions={headerActions}
      badge={<StatusBadge type="appointment" status={currentStatus} variant="soft" />}
    >
      {/* Status Bar - Admin Only */}
      {isAdmin && (
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 border-b border-gray-200 dark:border-gray-700 -mx-6 -mt-6 px-6 py-3 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Status:</span>
              <StatusBadge 
                type="appointment" 
                status={currentStatus} 
                variant="solid"
                className="text-xs"
              />
            </div>
            
            {currentStatus !== 'converted' && currentStatus !== 'cancelled' && (
              <div className="flex items-center gap-2">
                <SelectPremium
                  options={[
                    { value: 'scheduled', label: 'Scheduled', description: 'Appointment is scheduled' },
                    { value: 'confirmed', label: 'Confirmed', description: 'Customer confirmed attendance' },
                    { value: 'arrived', label: 'Arrived', description: 'Customer has arrived' },
                    { value: 'no_show', label: 'No Show', description: 'Customer did not show up' },
                    { value: 'cancelled', label: 'Cancelled', description: 'Appointment was cancelled' },
                    { value: 'converted', label: 'Converted', description: 'Converted to repair ticket' }
                  ]}
                  value={currentStatus}
                  onChange={async (value) => {
                    if (value === currentStatus) return;
                    
                    setIsChangingStatus(true);
                    try {
                      if (value === 'converted') {
                        const result = await convertAppointmentToTicket(appointment.id);
                        if (result.success && result.ticketId) {
                          setCurrentStatus('converted');
                          toast.success('Converted to ticket successfully');
                          router.push(`/orders/${result.ticketId}`);
                        } else {
                          throw new Error(result.message || 'Failed to convert');
                        }
                      } else {
                        const { createClient } = await import('@/lib/supabase/client');
                        const supabase = createClient();
                        const { error } = await supabase
                          .from('appointments')
                          .update({ 
                            status: value,
                            updated_at: new Date().toISOString()
                          })
                          .eq('id', appointment.id);
                        
                        if (error) throw error;
                        
                        setCurrentStatus(value as any);
                        toast.success(`Status updated to ${value}`);
                      }
                    } catch (error) {
                      toast.error('Failed to update status');
                      console.error(error);
                    } finally {
                      setIsChangingStatus(false);
                    }
                  }}
                  placeholder="Change status"
                  size="sm"
                  variant="ghost"
                  disabled={isChangingStatus}
                  loading={isChangingStatus}
                  className="w-40"
                />
                
                {currentStatus === 'arrived' && (
                  <ButtonPremium
                    onClick={handleConvertToTicket}
                    size="sm"
                    variant="gradient"
                    className="bg-gradient-to-r from-purple-500 to-purple-600"
                    disabled={isChangingStatus || actionLoading.convert}
                  >
                    <FileText className="h-3.5 w-3.5 mr-1" />
                    Convert to Ticket
                  </ButtonPremium>
                )}
              </div>
            )}
            
            {(currentStatus === 'converted' || currentStatus === 'cancelled') && (
              <StatusBadge 
                type="general" 
                status={currentStatus === 'converted' ? 'success' : 'inactive'}
                variant="soft"
                className="text-xs"
              >
                {currentStatus === 'converted' ? 'This appointment has been converted' : 'This appointment was cancelled'}
              </StatusBadge>
            )}
          </div>
        </div>
      )}
      
      <div className="space-y-6">

        {/* Key Metrics Row */}
        <div className="grid gap-4 md:grid-cols-3">
          <MetricCard
            title="Scheduled Time"
            value={showSkeleton ? <SkeletonPremium className="h-5 w-16" /> : formattedTime}
            variant="accent-primary"
            icon={<Clock />}
            size="sm"
          />
          <MetricCard
            title="Duration"
            value={showSkeleton ? <SkeletonPremium className="h-5 w-12" /> : `${appointment.duration_minutes} min`}
            variant="default"
            icon={<Calendar />}
            size="sm"
          />
          <MetricCard
            title="Services"
            value={showSkeleton ? <SkeletonPremium className="h-5 w-8" /> : selectedServices.length.toString()}
            variant="default"
            icon={<CheckCircle />}
            size="sm"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column - Primary Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Device Information - Most Important */}
            {isEditing ? (
              <DeviceSelector
                devices={availableDevices}
                selectedDeviceId={deviceData.id}
                onDeviceChange={(deviceId) => {
                  const device = availableDevices.find(d => d.id === deviceId);
                  if (device) {
                    setDeviceData(prev => ({
                      ...prev,
                      id: device.id,
                      modelName: device.model_name,
                      manufacturer: device.manufacturer?.name,
                      imageUrl: device.image_url,
                      thumbnailUrl: device.thumbnail_url
                    }));
                  }
                }}
                customerDevices={customerDevices}
                selectedCustomerDeviceId={customerDevice?.id}
                onCustomerDeviceChange={(customerDeviceId) => {
                  const cd = customerDevices.find(d => d.id === customerDeviceId);
                  if (cd) {
                    setDeviceData({
                      id: cd.device_id,
                      manufacturer: cd.devices?.manufacturer?.name,
                      modelName: cd.devices?.model_name,
                      imageUrl: cd.devices?.image_url,
                      thumbnailUrl: cd.devices?.thumbnail_url,
                      serialNumber: cd.serial_number || '',
                      imei: cd.imei || '',
                      color: cd.color || '',
                      storageSize: cd.storage_size || '',
                      condition: cd.condition as any || 'good',
                      nickname: cd.nickname
                    });
                  }
                }}
                serialNumber={deviceData.serialNumber || ''}
                onSerialNumberChange={(value) => setDeviceData(prev => ({ ...prev, serialNumber: value }))}
                imei={deviceData.imei || ''}
                onImeiChange={(value) => setDeviceData(prev => ({ ...prev, imei: value }))}
                color={deviceData.color || ''}
                onColorChange={(value) => setDeviceData(prev => ({ ...prev, color: value }))}
                storageSize={deviceData.storageSize || ''}
                onStorageSizeChange={(value) => setDeviceData(prev => ({ ...prev, storageSize: value }))}
                condition={deviceData.condition || 'good'}
                onConditionChange={(value) => setDeviceData(prev => ({ ...prev, condition: value as any }))}
                isEditing={true}
              />
            ) : (
              <DeviceDetailCard
                device={deviceData}
                availableDevices={availableDevices}
                customerDevices={customerDevices}
                isEditing={false}
                isLocked={isLocked}
                onDeviceChange={setDeviceData}
                className="border-primary"
              />
            )}

            {/* Services */}
            {isEditing ? (
              <ServiceSelectorCard
                services={availableServices}
                selectedServices={selectedServices}
                isEditing={isEditing}
                isLocked={isLocked}
                onServiceToggle={handleServiceToggle}
              />
            ) : (
              <Card className="rounded-lg border bg-card">
                <CardHeader className="p-4 pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Wrench className="h-4 w-4 text-primary" />
                      </div>
                      <CardTitle className="text-base font-semibold">
                        Services Required
                      </CardTitle>
                    </div>
                    {!isLocked && selectedServices.length === 0 && (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="text-xs text-primary hover:text-primary/90 transition-colors"
                      >
                        Add Services
                      </button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  {selectedServices.length > 0 ? (
                    <div className="space-y-2">
                      {availableServices
                        .filter(s => selectedServices.includes(s.id))
                        .map(service => (
                          <div key={service.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                            <div>
                              <p className="text-sm font-medium">{service.name}</p>
                              <p className="text-xs text-muted-foreground">{service.category.replace(/_/g, ' ')}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-semibold">${service.base_price.toFixed(2)}</p>
                              <p className="text-xs text-muted-foreground">{service.estimated_duration_minutes} min</p>
                            </div>
                          </div>
                        ))}
                      <div className="pt-2 mt-2 border-t">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Total</span>
                          <div className="text-right">
                            <p className="text-base font-bold text-primary">
                              ${availableServices.filter(s => selectedServices.includes(s.id)).reduce((sum, s) => sum + s.base_price, 0).toFixed(2)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {availableServices.filter(s => selectedServices.includes(s.id)).reduce((sum, s) => sum + s.estimated_duration_minutes, 0)} min total
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Wrench className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground mb-3">No services selected yet</p>
                      {!isLocked && (
                        <button
                          onClick={() => setIsEditing(true)}
                          className="text-sm font-medium text-primary hover:text-primary/90 transition-colors"
                        >
                          Select Services
                        </button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Notes */}
            <NotesCard
              notes={notes}
              isEditing={isEditing}
              isLocked={isLocked}
              onNotesChange={setNotes}
            />
          </div>

          {/* Right Column - Customer & Details */}
          <div className="space-y-6">
            {/* Estimated Cost Card - Moved to top of sidebar */}
            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-800">
              <CardHeader className="p-4 pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-green-500/10">
                      <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                    <CardTitle className="text-base font-semibold text-green-900 dark:text-green-100">
                      Estimated Cost
                    </CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {showSkeleton ? (
                    <SkeletonPremium className="h-9 w-24" />
                  ) : (
                    `$${availableServices.filter(s => selectedServices.includes(s.id)).reduce((sum, s) => sum + s.base_price, 0).toFixed(2)}`
                  )}
                </div>
                <div className="text-xs text-green-600/70 dark:text-green-400/70 mt-1">
                  {selectedServices.length} service{selectedServices.length !== 1 ? 's' : ''} • 
                  {availableServices.filter(s => selectedServices.includes(s.id)).reduce((sum, s) => sum + s.estimated_duration_minutes, 0)} min
                </div>
              </CardContent>
            </Card>
            
            {/* Enhanced Customer Information Card */}
            <Card className="bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-950/20 dark:to-blue-950/20 border-cyan-200 dark:border-cyan-800">
              <CardHeader className="p-4 pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-cyan-500/10">
                      <User className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                    </div>
                    <CardTitle className="text-base font-semibold text-cyan-900 dark:text-cyan-100">
                      Customer
                    </CardTitle>
                  </div>
                  {customerData.id && !isEditing && (
                    <Link 
                      href={`/customers/${customerData.id}`}
                      className="text-xs font-medium text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 dark:hover:text-cyan-300 transition-colors"
                    >
                      View Profile →
                    </Link>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="space-y-3">
                  {/* Customer Avatar/Initial */}
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-full bg-cyan-500 text-white flex items-center justify-center font-semibold text-lg">
                      {customerData.name?.charAt(0).toUpperCase() || 'C'}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{customerData.name}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">{customerData.email}</p>
                    </div>
                  </div>
                  
                  {/* Contact Info */}
                  <div className="space-y-2 pt-2 border-t border-cyan-200/50 dark:border-cyan-800/50">
                    <div className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 text-cyan-500" />
                      <span className="text-xs font-medium">{customerData.phone}</span>
                    </div>
                    {customerData.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-3.5 w-3.5 text-cyan-500" />
                        <span className="text-xs text-gray-600 dark:text-gray-400 truncate">{customerData.email}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Customer Stats */}
                  {customerData.previousAppointments > 0 && (
                    <div className="bg-cyan-100/50 dark:bg-cyan-900/20 rounded-lg p-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-cyan-700 dark:text-cyan-300">Customer History</span>
                        <StatusBadge 
                          type="general" 
                          status="success" 
                          variant="soft"
                          className="text-xs"
                        >
                          {customerData.previousAppointments} visits
                        </StatusBadge>
                      </div>
                    </div>
                  )}
                  
                  {/* Notification Preference */}
                  {customerData.notificationPreference && (
                    <div className="flex items-center gap-2">
                      <StatusBadge 
                        type="general" 
                        status="info" 
                        variant="soft"
                        className="text-xs"
                      >
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Notify via {customerData.notificationPreference}
                      </StatusBadge>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            {/* Appointment Details Card - Compact */}
            {(appointment.urgency || appointment.source || appointment.location) && (
              <Card className="border-border/50">
                <CardHeader className="p-4 pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Details</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 space-y-2">
                  {appointment.urgency && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Urgency</span>
                      <Badge variant={appointment.urgency === 'high' ? 'destructive' : 'secondary'} className="text-xs">
                        {appointment.urgency}
                      </Badge>
                    </div>
                  )}
                  {appointment.source && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Source</span>
                      <Badge variant="outline" className="text-xs">{appointment.source}</Badge>
                    </div>
                  )}
                  {appointment.location && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Location</p>
                      <p className="text-xs">{appointment.location}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}


          </div>
        </div>
      </div>

    </PageContainer>
  );
}