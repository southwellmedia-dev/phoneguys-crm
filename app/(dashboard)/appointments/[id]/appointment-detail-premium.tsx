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
  CustomerInfoCard,
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
    previousAppointments: appointment.customerAppointmentCount || 0,
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
    
    // Status-based actions - removed Confirm Appointment button
    
    if (appointment.status === 'confirmed' && !isLocked) {
      actions.push({
        label: "Check In Customer",
        variant: "default" as const,
        onClick: () => setShowCheckInModal(true),
        icon: <User className="h-4 w-4" />,
        disabled: actionLoading.arrived,
      });
    }
    
    // Removed Convert to Ticket button - users should go through assistant flow
    
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

  // Enhanced header actions with admin controls
  const enhancedHeaderActions = React.useMemo(() => {
    const actions = [...headerActions];
    
    // Add admin status control to the front if admin
    if (isAdmin && !isEditing && currentStatus && currentStatus !== 'converted' && currentStatus !== 'cancelled') {
      actions.unshift({
        label: currentStatus.replace(/_/g, ' '),
        variant: "ghost" as const,
        onClick: () => {},
        disabled: isChangingStatus,
        customComponent: (
          <SelectPremium
            options={[
              { value: 'scheduled', label: 'Scheduled' },
              { value: 'confirmed', label: 'Confirmed' },
              { value: 'arrived', label: 'Arrived' },
              { value: 'no_show', label: 'No Show' },
              { value: 'cancelled', label: 'Cancelled' }
            ]}
            value={currentStatus}
            onChange={async (value) => {
              if (value === currentStatus) return;
              
              setIsChangingStatus(true);
              try {
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
                toast.success(`Status updated to ${value}`)
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
            className="w-32"
          />
        )
      });
    }
    
    return actions;
  }, [headerActions, isAdmin, isEditing, currentStatus, isChangingStatus]);

  return (
    <PageContainer
      title={`Appointment ${appointment.appointment_number}`}
      description={`${formattedDate} at ${formattedTime}`}
      actions={enhancedHeaderActions}
      badge={<StatusBadge type="appointment" status={currentStatus} variant="soft" />}
    >
      
      <div className="space-y-6">
        {/* Appointment Status Flow - Clean minimal design */}
        <Card className="border border-gray-200 dark:border-gray-700">
          <CardContent className="pt-6 pb-4">
            {currentStatus === 'arrived' && (
              <div className="text-center space-y-2 mb-4">
                <div className="flex justify-center">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <UserCheck className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold">Customer Checked In</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Ready to convert to repair ticket</p>
                </div>
              </div>
            )}
            <AppointmentStatusFlow 
              currentStatus={currentStatus as any} 
            />
            {isAdmin && currentStatus === 'arrived' && (
              <div className="mt-4 pt-3 border-t flex justify-center">
                <ButtonPremium
                  variant="gradient"
                  size="sm"
                  onClick={() => router.push(`/appointments/${appointmentId}/assistant`)}
                  className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white"
                >
                  <Wrench className="h-3.5 w-3.5 mr-1.5" />
                  Open Appointment Assistant
                </ButtonPremium>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Key Metrics Row - Matching appointments list style */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {/* Appointment Date & Time */}
          <div className="relative overflow-hidden group hover:-translate-y-0.5 transition-transform">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <MetricCard
              title="Appointment"
              value={
                appointment.scheduled_date ? (
                  <>
                    {format(new Date(appointment.scheduled_date), 'MMM d')}
                    <span className="text-sm font-normal ml-2">{formattedTime}</span>
                  </>
                ) : 'Not set'
              }
              subtitle={appointment.scheduled_date ? format(new Date(appointment.scheduled_date), 'EEEE') : 'No date set'}
              icon={<Calendar className="h-4 w-4" />}
              variant="primary"
            />
          </div>
          
          {/* Device */}
          <div className="relative overflow-hidden group hover:-translate-y-0.5 transition-transform">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <MetricCard
              title="Device"
              value={deviceData.modelName || 'Not Selected'}
              subtitle={
                deviceData.modelName 
                  ? `${deviceData.manufacturer || 'Unknown'} • ${deviceData.condition || 'Unknown condition'}`
                  : 'No device selected'
              }
              icon={<Smartphone className="h-4 w-4" />}
              variant={deviceData.id ? "accent-primary" : "default"}
            />
          </div>
          
          {/* Services */}
          <div className="relative overflow-hidden group hover:-translate-y-0.5 transition-transform">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <MetricCard
              title="Services"
              value={selectedServices.length || '0'}
              subtitle={
                selectedServices.length > 0 
                  ? `${availableServices.filter(s => selectedServices.includes(s.id)).reduce((sum, s) => sum + s.estimated_duration_minutes, 0)} min total`
                  : 'No services selected'
              }
              icon={<Wrench className="h-4 w-4" />}
              variant={selectedServices.length > 0 ? "success" : "default"}
              badge={selectedServices.length > 0 ? (
                <div className="flex gap-1 mt-2">
                  {availableServices
                    .filter(s => selectedServices.includes(s.id))
                    .slice(0, 2)
                    .map(service => (
                      <Badge key={service.id} variant="secondary" className="text-[10px] px-1.5 py-0">
                        {service.name.split(' ').slice(0, 2).join(' ')}
                      </Badge>
                    ))}
                  {selectedServices.length > 2 && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                      +{selectedServices.length - 2}
                    </Badge>
                  )}
                </div>
              ) : undefined}
            />
          </div>
          
          {/* Estimated Cost */}
          <div className="relative overflow-hidden group hover:-translate-y-0.5 transition-transform">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <MetricCard
              title="Estimated Total"
              value={`$${availableServices
                .filter(s => selectedServices.includes(s.id))
                .reduce((sum, s) => sum + s.base_price, 0)
                .toFixed(2)}`}
              subtitle={
                selectedServices.length > 0 
                  ? `${selectedServices.length} service${selectedServices.length !== 1 ? 's' : ''} • ${availableServices.filter(s => selectedServices.includes(s.id)).reduce((sum, s) => sum + s.estimated_duration_minutes, 0)} min`
                  : 'No services selected'
              }
              icon={<DollarSign className="h-4 w-4" />}
              variant={selectedServices.length > 0 ? "primary" : "default"}
              trend={selectedServices.length > 0 ? undefined : undefined}
            />
          </div>
        </div>

        {/* Status Notification Banner */}
        {currentStatus === 'converted' && appointment.converted_to_ticket_id && (
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <CheckCircle className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Successfully Converted to Ticket</p>
                  <p className="text-xs text-muted-foreground mt-0.5">This appointment has been processed as a repair ticket</p>
                </div>
              </div>
              <ButtonPremium
                onClick={() => router.push(`/orders/${appointment.converted_to_ticket_id}`)}
                variant="default"
                size="sm"
              >
                <FileText className="h-4 w-4 mr-1.5" />
                View Ticket
              </ButtonPremium>
            </div>
          </div>
        )}
        
        {currentStatus === 'cancelled' && (
          <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-red-900 dark:text-red-100">Appointment Cancelled</p>
                <p className="text-xs text-red-700 dark:text-red-300 mt-0.5">This appointment is no longer active</p>
              </div>
            </div>
          </div>
        )}
        
        {currentStatus === 'no_show' && (
          <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30">
                <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-orange-900 dark:text-orange-100">Customer No-Show</p>
                <p className="text-xs text-orange-700 dark:text-orange-300 mt-0.5">Customer did not arrive for their appointment</p>
              </div>
            </div>
          </div>
        )}

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
                className=""
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
              <Card className="border border-gray-200 dark:border-gray-700">
                <CardHeader className="p-4 pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Wrench className="h-4 w-4 text-muted-foreground" />
                      <CardTitle className="text-sm font-semibold">
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

          {/* Right Column - Secondary Content */}
          <div className="lg:col-span-1 space-y-4">
            {/* Assignee Card */}
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
            
            {/* Customer Information Card */}
            <CustomerInfoCard
              customer={{
                id: customerData.id,
                name: customerData.name || '',
                email: customerData.email,
                phone: customerData.phone,
                address: customerData.address,
                city: customerData.city,
                state: customerData.state,
                zip: customerData.zip,
                notificationPreference: customerData.notificationPreference,
                previousAppointments: appointment.customerAppointmentCount || 0,
                totalRepairs: appointment.customerRepairCount || 0,
                createdAt: customerData.createdAt
              }}
              isEditing={isEditing}
              isLocked={isLocked}
            />
            {/* Appointment Details Card - Compact */}
            {(appointment.urgency || appointment.source || appointment.location) && (
              <Card className="border border-gray-200 dark:border-gray-700">
                <CardHeader className="p-4 pb-3">
                  <CardTitle className="text-sm font-semibold">Additional Details</CardTitle>
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