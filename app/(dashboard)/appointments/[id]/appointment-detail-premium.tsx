"use client";

import * as React from "react";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAppointment, useUpdateAppointment } from "@/lib/hooks/use-appointments";
import { useRealtime } from "@/lib/hooks/use-realtime";
import { PageContainer } from "@/components/layout/page-container";
import {
  ServiceSelectorCard,
  NotesCard,
  AssigneeCard,
  ScheduleCard,
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
  AppointmentStatusBadge, 
  AppointmentStatusFlow 
} from "@/components/appointments/flow";
import { ConfirmationModal } from "@/components/appointments/flow/confirmation-modal";
import { CheckInModal } from "@/components/appointments/flow/check-in-modal";
import { 
  Calendar,
  Clock,
  MapPin,
  User,
  UserCheck,
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
import { cn } from "@/lib/utils";
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
  
  // Use React Query properly with HYDRATION_STRATEGY.md pattern
  // The key is to use initialData and disable refetching
  const { data: appointment = initialAppointment } = useAppointment(appointmentId, initialAppointment);
  const updateAppointment = useUpdateAppointment();
  const showSkeleton = false; // We have initialData
  
  // Set up real-time subscriptions (this updates React Query cache properly)
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
  
  // Modal states for the new flow
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  
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
  
  // Track selected customer device ID separately
  const [selectedCustomerDeviceId, setSelectedCustomerDeviceId] = useState<string | null>(
    appointment.customer_device_id || null
  );

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

  // Following HYDRATION_STRATEGY.md - Initialize state properly
  const [deviceData, setDeviceData] = useState<DeviceData>(() => ({
    id: appointment.device_id || null,
    manufacturer: appointment.devices?.manufacturers?.name || appointment.devices?.manufacturer?.name,
    modelName: appointment.devices?.model_name,
    serialNumber: appointment.customer_devices?.serial_number || '',
    imei: appointment.customer_devices?.imei || '',
    color: appointment.customer_devices?.color || '',
    storageSize: appointment.customer_devices?.storage_size || '',
    condition: appointment.customer_devices?.condition || 'good',
    issues: appointment.issues || []
  }));

  const [selectedServices, setSelectedServices] = useState<string[]>(() => 
    appointment.service_ids || []
  );
  
  // Use refs to ensure we always have current state values
  const stateRef = useRef({
    deviceData,
    selectedServices,
    selectedCustomerDeviceId: null as string | null,
    notes: {} as NotesData
  });
  
  // Update ref whenever state changes
  useEffect(() => {
    stateRef.current.deviceData = deviceData;
  }, [deviceData]);
  
  useEffect(() => {
    stateRef.current.selectedServices = selectedServices;
  }, [selectedServices]);

  const [notes, setNotes] = useState<NotesData>({
    customerNotes: parsedNotes.customer_notes || '',
    technicianNotes: parsedNotes.technician_notes || '',
    additionalIssues: parsedNotes.additional_issues || ''
  });
  
  useEffect(() => {
    stateRef.current.notes = notes;
  }, [notes]);
  
  useEffect(() => {
    stateRef.current.selectedCustomerDeviceId = selectedCustomerDeviceId;
  }, [selectedCustomerDeviceId]);

  // Per HYDRATION_STRATEGY.md - Don't update state from props after mount
  // State is initialized once and managed locally during editing

  const handleServiceToggle = (serviceId: string) => {
    console.log('Toggling service:', serviceId);
    setSelectedServices(prev => {
      const newServices = prev.includes(serviceId)
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId];
      console.log('New selected services:', newServices);
      return newServices;
    });
  };

  // Use ref to ensure we have the latest state
  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Use ref to get current state values
      const currentState = stateRef.current;
      
      console.log('Current state before save (from ref):');
      console.log('- deviceData:', currentState.deviceData);
      console.log('- selectedCustomerDeviceId:', currentState.selectedCustomerDeviceId);
      console.log('- selectedServices:', currentState.selectedServices);
      
      // Create formData object similar to the enhanced version
      const formData = {
        // Device details
        device_id: currentState.deviceData.id || null,
        customer_device_id: currentState.selectedCustomerDeviceId || null,
        serial_number: currentState.deviceData.serialNumber || '',
        imei: currentState.deviceData.imei || '',
        color: currentState.deviceData.color || '',
        storage_size: currentState.deviceData.storageSize || '',
        device_condition: currentState.deviceData.condition || 'good',
        
        // Services - this is the critical field
        selected_services: currentState.selectedServices || [],
        estimated_cost: availableServices
          .filter(s => currentState.selectedServices.includes(s.id))
          .reduce((sum, s) => sum + s.base_price, 0),
        
        // Notes
        customer_notes: currentState.notes.customerNotes || '',
        technician_notes: currentState.notes.technicianNotes || '',
        additional_issues: currentState.notes.additionalIssues || '',
        
        // Customer preferences
        notification_preference: customerData.notificationPreference || 'email',
      };
      
      console.log('Sending formData to server:', formData);
      
      const result = await updateAppointmentDetails(appointmentId, formData);
      
      if (result.success) {
        toast.success('Appointment details updated successfully');
        setIsEditing(false);
        
        // Force refresh the appointment data to ensure UI updates
        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();
        const { data: updatedAppointment } = await supabase
          .from('appointments')
          .select(`
            *,
            customers (*),
            devices (*),
            customer_devices (*)
          `)
          .eq('id', appointmentId)
          .single();
          
        if (updatedAppointment) {
          // Update local state with fresh data
          setSelectedServices(updatedAppointment.service_ids || []);
          setDeviceData({
            id: updatedAppointment.device_id,
            manufacturer: updatedAppointment.devices?.manufacturers?.name,
            modelName: updatedAppointment.devices?.model_name,
            serialNumber: updatedAppointment.customer_devices?.serial_number || '',
            imei: updatedAppointment.customer_devices?.imei || '',
            color: updatedAppointment.customer_devices?.color || '',
            storageSize: updatedAppointment.customer_devices?.storage_size || '',
            condition: updatedAppointment.customer_devices?.condition || 'good',
            issues: updatedAppointment.issues || []
          });
          setSelectedCustomerDeviceId(updatedAppointment.customer_device_id);
        }
      } else {
        toast.error(result.error || 'Failed to update appointment details');
      }
    } catch (error) {
      toast.error('Failed to update appointment details');
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirm = async (data: { notes?: string; notificationMethod?: 'email' | 'sms' | 'phone' | 'none' }) => {
    setActionLoading(prev => ({ ...prev, confirm: true }));
    try {
      await confirmAppointment(appointmentId, data.notes);
      toast.success('Appointment confirmed');
      setCurrentStatus('confirmed');
      setShowConfirmModal(false);
    } catch (error) {
      toast.error('Failed to confirm appointment');
      throw error;
    } finally {
      setActionLoading(prev => ({ ...prev, confirm: false }));
    }
  };

  const handleCheckIn = async (data: { notes?: string; verified: boolean; proceedToAssistant: boolean }) => {
    setActionLoading(prev => ({ ...prev, arrived: true }));
    try {
      await markAppointmentArrived(appointmentId, data.notes);
      toast.success('Customer checked in successfully');
      setCurrentStatus('arrived');
      setShowCheckInModal(false);
      
      // Navigate to assistant view if requested
      if (data.proceedToAssistant) {
        router.push(`/appointments/${appointmentId}/assistant`);
      }
    } catch (error) {
      toast.error('Failed to check in customer');
      throw error;
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
      router.push(`/orders/${result.ticket.id}`);
    } catch (error) {
      toast.error('Failed to convert appointment');
    } finally {
      setActionLoading(prev => ({ ...prev, convert: false }));
    }
  };

  const handleAssigneeChange = async (technicianId: string | null) => {
    try {
      console.log('🔄 handleAssigneeChange called with technicianId:', technicianId);
      console.log('📞 About to call updateAppointmentDetails server action...');
      
      const result = await updateAppointmentDetails(appointmentId, {
        assigned_to: technicianId
      });
      
      console.log('📥 Server action result:', result);
      console.log('✅ handleAssigneeChange completed successfully');
      // The real-time subscription will update the UI
    } catch (error) {
      console.error('❌ Error in handleAssigneeChange:', error);
      console.error('❌ Error stack:', error.stack);
      throw error;
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
          variant: "gradient-success" as const,
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
        label: "Confirm Appointment",
        variant: "default" as const,
        onClick: () => setShowConfirmModal(true),
        icon: <CheckCircle className="h-4 w-4" />,
        disabled: actionLoading.confirm,
      });
    }
    
    if (appointment.status === 'confirmed' && !isLocked) {
      actions.push({
        label: "Check In Customer",
        variant: "default" as const,
        onClick: () => setShowCheckInModal(true),
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
        onClick: () => {
          console.log('Entering edit mode with state:', {
            deviceData,
            selectedServices,
            selectedCustomerDeviceId
          });
          setIsEditing(true);
        },
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
                        if (result.success && result.ticket) {
                          setCurrentStatus('converted');
                          toast.success('Converted to ticket successfully');
                          router.push(`/orders/${result.ticket.id}`);
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
        {/* Appointment Status Flow - Colored based on status */}
        <Card className={cn(
          "border-2 transition-all shadow-sm",
          currentStatus === 'scheduled' && "border-blue-300 dark:border-blue-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30",
          currentStatus === 'confirmed' && "border-green-300 dark:border-green-700 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30",
          currentStatus === 'arrived' && "border-purple-300 dark:border-purple-700 bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-950/30 dark:to-violet-950/30",
          currentStatus === 'converted' && "border-teal-300 dark:border-teal-700 bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-950/30 dark:to-cyan-950/30",
          currentStatus === 'cancelled' && "border-red-300 dark:border-red-700 bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-950/30 dark:to-rose-950/30",
          currentStatus === 'no_show' && "border-orange-300 dark:border-orange-700 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30"
        )}>
          <CardContent className="pt-6 pb-4">
            {currentStatus === 'arrived' && (
              <div className="text-center space-y-3 mb-4">
                <div className="flex justify-center">
                  <div className={cn(
                    "p-2.5 rounded-full",
                    "bg-purple-100 dark:bg-purple-900/30"
                  )}>
                    <UserCheck className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
                <div>
                  <h3 className="text-base font-semibold">Customer Checked In</h3>
                  <p className="text-sm text-muted-foreground mt-1">Ready to convert to repair ticket</p>
                </div>
              </div>
            )}
            <AppointmentStatusFlow 
              currentStatus={currentStatus as any} 
            />
            {isAdmin && (currentStatus === 'scheduled' || currentStatus === 'confirmed' || currentStatus === 'arrived') && (
              <div className="mt-4 pt-3 border-t border-current/10 flex justify-center">
                <ButtonPremium
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push(`/appointments/${appointmentId}/assistant`)}
                  className="text-xs"
                >
                  <Wrench className="h-3 w-3 mr-1.5" />
                  Appointment Assistant
                </ButtonPremium>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Schedule and Metrics Row */}
        <div className="grid gap-4 lg:grid-cols-3">
          {/* Schedule Card - Prominent Date/Time Display */}
          <ScheduleCard
            scheduledDate={appointment.scheduled_date}
            scheduledTime={appointment.scheduled_time}
            duration={appointment.duration_minutes}
            location={appointment.location || undefined}
            className="lg:col-span-1"
          />
          
          {/* Services Summary Card */}
          <MetricCard
            title="Services & Duration"
            value={
              showSkeleton ? (
                <SkeletonPremium className="h-8 w-20" />
              ) : (
                <div className="space-y-1">
                  <div className="text-2xl font-bold">
                    {selectedServices.length}
                  </div>
                  <div className="text-xs opacity-75">
                    service{selectedServices.length !== 1 ? 's' : ''} selected
                  </div>
                </div>
              )
            }
            description={
              selectedServices.length > 0 ? (
                <div className="space-y-2 mt-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Total Time:</span>
                    <span className="font-medium">
                      {availableServices
                        .filter(s => selectedServices.includes(s.id))
                        .reduce((sum, s) => sum + s.estimated_duration_minutes, 0)} min
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Est. Cost:</span>
                    <span className="font-semibold text-primary">
                      ${availableServices
                        .filter(s => selectedServices.includes(s.id))
                        .reduce((sum, s) => sum + s.base_price, 0)
                        .toFixed(2)}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-muted-foreground mt-2">
                  No services selected yet
                </div>
              )
            }
            variant={selectedServices.length > 0 ? "accent-success" : "default"}
            icon={<Wrench />}
            size="md"
            badge={selectedServices.length > 0 && (
              <Badge variant="success" className="text-xs">
                Ready
              </Badge>
            )}
          />
          
          {/* Quick Actions Card - Premium Styled */}
          <Card className={cn(
            "border-2 transition-all shadow-md hover:shadow-lg",
            currentStatus === 'scheduled' && "border-blue-300 dark:border-blue-700 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30",
            currentStatus === 'confirmed' && "border-green-300 dark:border-green-700 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30",
            currentStatus === 'arrived' && "border-purple-300 dark:border-purple-700 bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/30 dark:to-violet-950/30",
            currentStatus === 'converted' && "border-teal-300 dark:border-teal-700 bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-950/30 dark:to-cyan-950/30",
            currentStatus === 'cancelled' && "border-red-300 dark:border-red-700 bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/30 dark:to-rose-950/30",
            currentStatus === 'no_show' && "border-orange-300 dark:border-orange-700 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30"
          )}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "p-2 rounded-lg",
                    currentStatus === 'scheduled' && "bg-blue-500/10",
                    currentStatus === 'confirmed' && "bg-green-500/10",
                    currentStatus === 'arrived' && "bg-purple-500/10",
                    (currentStatus === 'converted' || currentStatus === 'cancelled' || currentStatus === 'no_show') && "bg-gray-500/10"
                  )}>
                    {currentStatus === 'scheduled' && <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
                    {currentStatus === 'confirmed' && <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />}
                    {currentStatus === 'arrived' && <UserCheck className="h-4 w-4 text-purple-600 dark:text-purple-400" />}
                    {(currentStatus === 'converted' || currentStatus === 'cancelled' || currentStatus === 'no_show') && <AlertCircle className="h-4 w-4 text-gray-600 dark:text-gray-400" />}
                  </div>
                  <CardTitle className="text-base font-semibold">Quick Actions</CardTitle>
                </div>
                <AppointmentStatusBadge status={currentStatus} size="sm" />
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {showSkeleton ? (
                <SkeletonPremium className="h-20 w-full" />
              ) : (
                <>
                  {/* Show actions based on appointment status */}
                  {currentStatus === 'scheduled' && (
                    <>
                      <ButtonPremium
                        onClick={() => setShowConfirmModal(true)}
                        disabled={actionLoading.confirm || isLocked}
                        loading={actionLoading.confirm}
                        variant="gradient"
                        size="sm"
                        className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white border-0 shadow-md"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Confirm Appointment
                      </ButtonPremium>
                      <ButtonPremium
                        onClick={handleCancel}
                        disabled={actionLoading.cancel || isLocked}
                        loading={actionLoading.cancel}
                        variant="outline"
                        size="sm"
                        className="w-full border-red-200 hover:bg-red-50 hover:border-red-300 hover:text-red-700 dark:border-red-800 dark:hover:bg-red-950/50"
                      >
                        Cancel Appointment
                      </ButtonPremium>
                    </>
                  )}
                  
                  {currentStatus === 'confirmed' && (
                    <>
                      <ButtonPremium
                        onClick={() => setShowCheckInModal(true)}
                        disabled={actionLoading.arrived || isLocked}
                        loading={actionLoading.arrived}
                        variant="gradient"
                        size="sm"
                        className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white border-0 shadow-md"
                      >
                        <UserCheck className="h-4 w-4 mr-2" />
                        Check-In Customer
                      </ButtonPremium>
                      <ButtonPremium
                        onClick={handleCancel}
                        disabled={actionLoading.cancel || isLocked}
                        loading={actionLoading.cancel}
                        variant="outline"
                        size="sm"
                        className="w-full border-red-200 hover:bg-red-50 hover:border-red-300 hover:text-red-700 dark:border-red-800 dark:hover:bg-red-950/50"
                      >
                        Cancel Appointment
                      </ButtonPremium>
                    </>
                  )}
                  
                  {currentStatus === 'arrived' && (
                    <ButtonPremium
                      onClick={handleConvertToTicket}
                      disabled={actionLoading.convert || isLocked || !deviceData.id || selectedServices.length === 0}
                      loading={actionLoading.convert}
                      variant="gradient"
                      size="sm"
                      className="w-full bg-gradient-to-r from-purple-500 to-violet-500 hover:from-purple-600 hover:to-violet-600 text-white border-0 shadow-md"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Convert to Ticket
                    </ButtonPremium>
                  )}
                  
                  {currentStatus === 'converted' && appointment.converted_to_ticket_id && (
                    <div className="space-y-3">
                      <div className="text-center py-3 px-4 rounded-lg bg-gradient-to-br from-teal-100 to-cyan-100 dark:from-teal-900/40 dark:to-cyan-900/40 border border-teal-200 dark:border-teal-800">
                        <div className="p-2.5 rounded-full bg-teal-500/20 mx-auto w-fit mb-2">
                          <CheckCircle className="h-6 w-6 text-teal-600 dark:text-teal-400" />
                        </div>
                        <p className="text-sm font-semibold text-teal-900 dark:text-teal-100">
                          Successfully Converted
                        </p>
                        <p className="text-xs text-teal-700 dark:text-teal-300 mt-1">
                          This appointment is now a repair ticket
                        </p>
                      </div>
                      <ButtonPremium
                        onClick={() => router.push(`/orders/${appointment.converted_to_ticket_id}`)}
                        variant="gradient"
                        size="sm"
                        className="w-full bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white border-0"
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        View Repair Ticket
                      </ButtonPremium>
                    </div>
                  )}
                  
                  {currentStatus === 'cancelled' && (
                    <div className="text-center py-3 px-4 rounded-lg bg-gradient-to-br from-red-100 to-rose-100 dark:from-red-900/40 dark:to-rose-900/40 border border-red-200 dark:border-red-800">
                      <div className="p-2.5 rounded-full bg-red-500/20 mx-auto w-fit mb-2">
                        <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                      </div>
                      <p className="text-sm font-semibold text-red-900 dark:text-red-100">
                        Appointment Cancelled
                      </p>
                      <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                        This appointment is no longer active
                      </p>
                    </div>
                  )}
                  
                  {currentStatus === 'no_show' && (
                    <div className="text-center py-3 px-4 rounded-lg bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-900/40 dark:to-amber-900/40 border border-orange-200 dark:border-orange-800">
                      <div className="p-2.5 rounded-full bg-orange-500/20 mx-auto w-fit mb-2">
                        <AlertCircle className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                      </div>
                      <p className="text-sm font-semibold text-orange-900 dark:text-orange-100">
                        Customer No-Show
                      </p>
                      <p className="text-xs text-orange-700 dark:text-orange-300 mt-1">
                        Customer did not arrive for appointment
                      </p>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
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
                  console.log('Device change called with ID:', deviceId);
                  const device = availableDevices.find(d => d.id === deviceId);
                  if (device) {
                    // Clear customer device selection when selecting a different device
                    setSelectedCustomerDeviceId(null);
                    setDeviceData(prev => ({
                      ...prev,
                      id: device.id,
                      modelName: device.model_name,
                      manufacturer: device.manufacturer?.name,
                      imageUrl: device.image_url,
                      thumbnailUrl: device.thumbnail_url
                    }));
                  } else if (deviceId) {
                    // Device ID from customer device - just set the ID
                    console.log('Setting device ID from customer device:', deviceId);
                    setDeviceData(prev => ({
                      ...prev,
                      id: deviceId
                    }));
                  }
                }}
                customerDevices={customerDevices}
                selectedCustomerDeviceId={selectedCustomerDeviceId}
                onCustomerDeviceChange={(customerDeviceId) => {
                  setSelectedCustomerDeviceId(customerDeviceId);
                  const cd = customerDevices.find(d => d.id === customerDeviceId);
                  if (cd) {
                    setDeviceData({
                      id: cd.device_id || cd.devices?.id,
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
                onConditionChange={(value) => setDeviceData(prev => ({ ...prev, condition: value }))}
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
            {/* Estimated Cost Card - First in sidebar */}
            <Card className={selectedServices.length === 0 
              ? "bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950/20 dark:to-gray-900/20 border-gray-200 dark:border-gray-700 opacity-75"
              : "bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-800"
            }>
              <CardHeader className="p-4 pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={selectedServices.length === 0 
                      ? "p-2 rounded-lg bg-gray-500/10"
                      : "p-2 rounded-lg bg-green-500/10"
                    }>
                      <DollarSign className={selectedServices.length === 0 
                        ? "h-4 w-4 text-gray-600 dark:text-gray-400"
                        : "h-4 w-4 text-green-600 dark:text-green-400"
                      } />
                    </div>
                    <CardTitle className={selectedServices.length === 0 
                      ? "text-base font-semibold text-gray-900 dark:text-gray-100"
                      : "text-base font-semibold text-green-900 dark:text-green-100"
                    }>
                      Estimated Cost
                    </CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                {selectedServices.length === 0 ? (
                  <div className="space-y-2">
                    <div className="text-lg font-medium text-gray-500 dark:text-gray-400">
                      No estimate available
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Select services to calculate cost
                    </div>
                    {!isLocked && !isEditing && (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="text-xs font-medium text-primary hover:text-primary/90 transition-colors mt-2"
                      >
                        Add Services →
                      </button>
                    )}
                  </div>
                ) : (
                  <>
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
                  </>
                )}
              </CardContent>
            </Card>
            
            {/* Assignee Card - Second in sidebar */}
            <AssigneeCard
              assignee={appointment.assigned_to ? {
                id: appointment.assigned_to,
                name: technicians.find(t => t.id === appointment.assigned_to)?.name || 'Unknown',
                email: technicians.find(t => t.id === appointment.assigned_to)?.email,
                role: technicians.find(t => t.id === appointment.assigned_to)?.role,
                // TODO: Add real stats from database
                stats: {
                  totalAppointments: 24,
                  completedToday: 3,
                  avgDuration: 45,
                  satisfactionRate: 98
                }
              } : null}
              technicians={technicians}
              isEditing={isEditing}
              isLocked={isLocked}
              onAssigneeChange={handleAssigneeChange}
            />
            
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

      {/* Modals */}
      <ConfirmationModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        appointmentId={appointmentId}
        customerName={customerData.name}
        customerEmail={customerData.email}
        customerPhone={customerData.phone}
        scheduledDate={appointment.scheduled_date}
        scheduledTime={appointment.scheduled_time}
        services={availableServices
          .filter(s => selectedServices.includes(s.id))
          .map(s => s.name)}
        onConfirm={handleConfirm}
      />
      
      <CheckInModal
        isOpen={showCheckInModal}
        onClose={() => setShowCheckInModal(false)}
        appointmentId={appointmentId}
        customerName={customerData.name}
        customerPhone={customerData.phone}
        scheduledTime={formattedTime}
        onCheckIn={handleCheckIn}
      />

    </PageContainer>
  );
}