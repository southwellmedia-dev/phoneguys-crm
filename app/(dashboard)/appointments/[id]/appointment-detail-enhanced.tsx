"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppointment, useUpdateAppointment } from "@/lib/hooks/use-appointments";
import { useQueryClient } from "@tanstack/react-query";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DeviceSelector } from "@/components/appointments/device-selector";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  Smartphone,
  AlertCircle,
  CheckCircle,
  XCircle,
  ArrowRight,
  Edit,
  Save,
  Plus,
  Trash2,
  FileText,
  DollarSign,
  MessageSquare,
  Wrench,
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

interface Service {
  id: string;
  name: string;
  category: string;
  base_price: number;
  estimated_duration_minutes: number;
}

interface AppointmentDetailEnhancedProps {
  appointment: any;
  appointmentId: string;
  availableServices: Service[];
  availableDevices: any[];
  customerDevices?: any[];
}

const statusConfig = {
  scheduled: { label: 'Scheduled', className: 'bg-blue-100 text-blue-800', icon: Clock },
  confirmed: { label: 'Confirmed', className: 'bg-green-100 text-green-800', icon: CheckCircle },
  arrived: { label: 'Arrived', className: 'bg-purple-100 text-purple-800', icon: User },
  no_show: { label: 'No Show', className: 'bg-red-100 text-red-800', icon: XCircle },
  cancelled: { label: 'Cancelled', className: 'bg-gray-100 text-gray-800', icon: XCircle },
  converted: { label: 'Converted to Ticket', className: 'bg-cyan-100 text-cyan-800', icon: ArrowRight },
};

export function AppointmentDetailEnhanced({ 
  appointment: initialAppointment, 
  appointmentId, 
  availableServices,
  availableDevices,
  customerDevices = []
}: AppointmentDetailEnhancedProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: appointment = initialAppointment } = useAppointment(appointmentId, initialAppointment);
  const updateAppointment = useUpdateAppointment();
  const [isConverting, setIsConverting] = useState(false);
  const [showConvertDialog, setShowConvertDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Parse notes if they're in JSON format
  const parsedNotes = (() => {
    try {
      if (appointment.notes && typeof appointment.notes === 'string' && appointment.notes.startsWith('{')) {
        return JSON.parse(appointment.notes);
      }
    } catch (e) {
      // If parsing fails, treat as plain text customer notes
    }
    return { customer_notes: appointment.notes || '', technician_notes: '' };
  })();
  
  // Form state for editable fields
  const [formData, setFormData] = useState({
    // Device details
    device_id: appointment.device_id || '',
    customer_device_id: appointment.customer_device_id || '',
    serial_number: appointment.customer_devices?.serial_number || '',
    imei: appointment.customer_devices?.imei || '',
    color: appointment.customer_devices?.color || '',
    storage_size: appointment.customer_devices?.storage_size || '',
    device_condition: appointment.customer_devices?.condition || 'good',
    
    // Services
    selected_services: appointment.service_ids || [],
    estimated_cost: appointment.estimated_cost || 0,
    
    // Issues and notes
    issues: appointment.issues || [],
    additional_issues: '',
    technician_notes: parsedNotes.technician_notes || '',
    customer_notes: parsedNotes.customer_notes || '',
    
    // Customer preferences
    notification_preference: 'email',
    warranty_status: 'none',
  });

  // Calculate total estimated cost based on selected services
  const calculateEstimatedCost = () => {
    return formData.selected_services.reduce((total, serviceId) => {
      const service = availableServices.find(s => s.id === serviceId);
      return total + (service?.base_price || 0);
    }, 0);
  };

  const handleServiceToggle = (serviceId: string) => {
    setFormData(prev => ({
      ...prev,
      selected_services: prev.selected_services.includes(serviceId)
        ? prev.selected_services.filter(id => id !== serviceId)
        : [...prev.selected_services, serviceId],
    }));
  };

  // Update form data when appointment changes (e.g., from real-time updates)
  useEffect(() => {
    const parsedNotes = (() => {
      try {
        if (appointment.notes && typeof appointment.notes === 'string' && appointment.notes.startsWith('{')) {
          return JSON.parse(appointment.notes);
        }
      } catch (e) {
        // If parsing fails, treat as plain text customer notes
      }
      return { customer_notes: appointment.notes || '', technician_notes: '' };
    })();

    setFormData({
      device_id: appointment.device_id || '',
      customer_device_id: appointment.customer_device_id || '',
      serial_number: appointment.customer_devices?.serial_number || '',
      imei: appointment.customer_devices?.imei || '',
      color: appointment.customer_devices?.color || '',
      storage_size: appointment.customer_devices?.storage_size || '',
      device_condition: appointment.customer_devices?.condition || '',
      selected_services: appointment.service_ids || [],
      estimated_cost: appointment.estimated_cost || 0,
      issues: appointment.issues || [],
      additional_issues: '',
      technician_notes: parsedNotes.technician_notes || '',
      customer_notes: parsedNotes.customer_notes || '',
      notification_preference: 'email',
      warranty_status: 'none',
    });
  }, [appointment]);

  const handleSaveDetails = async () => {
    setIsSaving(true);
    try {
      const result = await updateAppointmentDetails(appointmentId, formData);
      if (result.success) {
        toast.success("Appointment details updated successfully");
        setIsEditing(false);
        // Real-time will handle the cache update
      } else {
        toast.error(result.error || "Failed to update details");
      }
    } catch (error) {
      toast.error("Failed to update appointment details");
    } finally {
      setIsSaving(false);
    }
  };

  const handleConvertToTicket = async () => {
    setIsConverting(true);
    try {
      // Include all the collected data when converting
      const result = await convertAppointmentToTicket(appointmentId, formData);
      
      if (result.success) {
        toast.success(`Successfully converted to ticket ${result.ticketNumber}`);
        router.push(`/orders/${result.ticket.id}`);
      } else {
        toast.error(result.error || "Failed to convert appointment");
      }
    } catch (error) {
      toast.error("Failed to convert appointment");
      console.error(error);
    } finally {
      setIsConverting(false);
      setShowConvertDialog(false);
    }
  };

  const status = statusConfig[appointment.status as keyof typeof statusConfig];
  const StatusIcon = status.icon;

  const headerActions = [
    {
      label: "Back",
      icon: <ArrowLeft className="h-4 w-4" />,
      variant: "outline" as const,
      onClick: () => router.push('/appointments'),
    },
  ];

  // Add save/edit toggle
  if (appointment.status === 'arrived' || appointment.status === 'confirmed') {
    headerActions.push({
      label: isEditing ? "Save Changes" : "Edit Details",
      icon: isEditing ? <Save className="h-4 w-4" /> : <Edit className="h-4 w-4" />,
      variant: isEditing ? "default" : "outline" as const,
      onClick: isEditing ? handleSaveDetails : () => setIsEditing(true),
      disabled: isSaving,
    });
  }

  // Add convert to ticket button
  if (appointment.status !== 'cancelled' && appointment.status !== 'converted') {
    headerActions.push({
      label: "Convert to Ticket",
      icon: <FileText className="h-4 w-4" />,
      variant: "default" as const,
      onClick: () => setShowConvertDialog(true),
    });
  }

  return (
    <>
      <PageContainer
        title={appointment.appointment_number}
        description={
          <div className="flex items-center gap-2">
            <span>Appointment Details</span>
            <Badge className={status.className}>
              <StatusIcon className="mr-1 h-3 w-3" />
              {status.label}
            </Badge>
            {isEditing && (
              <Badge variant="secondary" className="ml-2">
                <Edit className="mr-1 h-3 w-3" />
                Editing Mode
              </Badge>
            )}
          </div>
        }
        actions={headerActions}
      >
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content - Left Side */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Quick Actions Bar (for arrived appointments) */}
            {appointment.status === 'arrived' && (
              <Card className="border-purple-200 bg-purple-50/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="flex flex-wrap gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => setIsEditing(!isEditing)}
                    >
                      {isEditing ? <Save className="mr-1 h-3 w-3" /> : <Edit className="mr-1 h-3 w-3" />}
                      {isEditing ? 'Save Changes' : 'Edit Details'}
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => setShowConvertDialog(true)}
                    >
                      <FileText className="mr-1 h-3 w-3" />
                      Convert to Ticket
                    </Button>
                    <Button size="sm" variant="outline">
                      <MessageSquare className="mr-1 h-3 w-3" />
                      Send SMS Update
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Customer Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Customer Information
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Name</p>
                    <p className="font-medium">{appointment.customers?.name || 'Walk-in Customer'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">
                      {appointment.customers?.email || 'Not provided'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="font-medium">
                      {appointment.customers?.phone || 'Not provided'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Notification Preference</p>
                    {isEditing ? (
                      <Select 
                        value={formData.notification_preference}
                        onValueChange={(value) => setFormData({...formData, notification_preference: value})}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="sms">SMS</SelectItem>
                          <SelectItem value="both">Both</SelectItem>
                          <SelectItem value="none">None</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="font-medium capitalize">{formData.notification_preference}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Device Information - Using DeviceSelector Component */}
            <DeviceSelector
              devices={availableDevices}
              selectedDeviceId={formData.device_id}
              onDeviceChange={(value) => setFormData({...formData, device_id: value})}
              customerDevices={customerDevices}
              selectedCustomerDeviceId={formData.customer_device_id}
              onCustomerDeviceChange={(value) => setFormData({...formData, customer_device_id: value})}
              serialNumber={formData.serial_number}
              onSerialNumberChange={(value) => setFormData({...formData, serial_number: value})}
              imei={formData.imei}
              onImeiChange={(value) => setFormData({...formData, imei: value})}
              color={formData.color}
              onColorChange={(value) => setFormData({...formData, color: value})}
              storageSize={formData.storage_size}
              onStorageSizeChange={(value) => setFormData({...formData, storage_size: value})}
              condition={formData.device_condition}
              onConditionChange={(value) => setFormData({...formData, device_condition: value})}
              isEditing={isEditing}
              testMode={true}
            />
            
            {/* Warranty Information Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Warranty Information
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <Label>Warranty Status</Label>
                  {isEditing ? (
                    <Select 
                      value={formData.warranty_status}
                      onValueChange={(value) => setFormData({...formData, warranty_status: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No Warranty</SelectItem>
                        <SelectItem value="manufacturer">Manufacturer Warranty</SelectItem>
                        <SelectItem value="extended">Extended Warranty</SelectItem>
                        <SelectItem value="expired">Expired</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="font-medium mt-1 capitalize">{formData.warranty_status.replace('_', ' ')}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Services Selection - Editable */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="h-5 w-5" />
                  Required Services
                  {isEditing && <Badge variant="secondary" className="ml-2 text-xs">Editable</Badge>}
                </CardTitle>
                <CardDescription>
                  {isEditing ? "Select all services needed for this repair" : "Services identified for this repair"}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                {isEditing ? (
                  <div className="space-y-3">
                    {availableServices.map((service) => (
                      <div key={service.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                        <div className="flex items-center space-x-3">
                          <Checkbox
                            checked={formData.selected_services.includes(service.id)}
                            onCheckedChange={() => handleServiceToggle(service.id)}
                          />
                          <div>
                            <p className="font-medium">{service.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {service.category.replace('_', ' ')} • {service.estimated_duration_minutes} min
                            </p>
                          </div>
                        </div>
                        <p className="font-medium">${service.base_price}</p>
                      </div>
                    ))}
                    
                    {formData.selected_services.length > 0 && (
                      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                        <div className="flex justify-between items-center">
                          <p className="font-medium">Estimated Total:</p>
                          <p className="text-xl font-bold text-blue-600">
                            ${calculateEstimatedCost()}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    {formData.selected_services.length > 0 ? (
                      <div className="space-y-2">
                        {formData.selected_services.map(serviceId => {
                          const service = availableServices.find(s => s.id === serviceId);
                          return service ? (
                            <div key={serviceId} className="flex justify-between p-2 bg-gray-50 rounded">
                              <span>{service.name}</span>
                              <span className="font-medium">${service.base_price}</span>
                            </div>
                          ) : null;
                        })}
                        <div className="pt-2 border-t">
                          <div className="flex justify-between font-medium">
                            <span>Estimated Total:</span>
                            <span>${calculateEstimatedCost()}</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-muted-foreground">No services selected yet</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Notes Section - Always Editable */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Notes & Additional Information
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div>
                  <Label>Technician Notes (Internal)</Label>
                  <Textarea
                    value={formData.technician_notes}
                    onChange={(e) => setFormData({...formData, technician_notes: e.target.value})}
                    placeholder="Add internal notes about the repair, diagnosis, or customer interactions..."
                    className="mt-1"
                    rows={4}
                    disabled={!isEditing}
                  />
                </div>
                
                <div>
                  <Label>Customer Notes</Label>
                  <Textarea
                    value={formData.customer_notes}
                    onChange={(e) => setFormData({...formData, customer_notes: e.target.value})}
                    placeholder="Notes visible to customer..."
                    className="mt-1"
                    rows={3}
                    disabled={!isEditing}
                  />
                </div>
                
                <div>
                  <Label>Additional Issues Found</Label>
                  <Textarea
                    value={formData.additional_issues}
                    onChange={(e) => setFormData({...formData, additional_issues: e.target.value})}
                    placeholder="Document any additional issues discovered during inspection..."
                    className="mt-1"
                    rows={3}
                    disabled={!isEditing}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Appointment Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Appointment Info
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Date & Time</p>
                  <p className="font-medium">
                    {format(new Date(appointment.scheduled_date), 'PPP')}
                  </p>
                  <p className="text-sm">
                    {appointment.scheduled_time} ({appointment.duration_minutes} minutes)
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground">Source</p>
                  <p className="font-medium capitalize">{appointment.source}</p>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground">Urgency</p>
                  <p className="font-medium capitalize">{appointment.urgency}</p>
                </div>
                
                {appointment.arrived_at && (
                  <div>
                    <p className="text-sm text-muted-foreground">Arrived At</p>
                    <p className="font-medium">
                      {format(new Date(appointment.arrived_at), 'p')}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Original Issues */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Reported Issues
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                {appointment.issues && appointment.issues.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {appointment.issues.map((issue: string) => (
                      <Badge key={issue} variant="secondary">
                        {issue.replace('_', ' ')}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No issues reported</p>
                )}
                
                {appointment.description && (
                  <div className="mt-3">
                    <p className="text-sm text-muted-foreground mb-1">Description</p>
                    <p className="text-sm">{appointment.description}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Status Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Status Actions</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-2">
                {appointment.status === 'scheduled' && (
                  <Button 
                    className="w-full" 
                    variant="outline"
                    onClick={async () => {
                      const result = await confirmAppointment(appointmentId);
                      if (result.success) {
                        toast.success("Appointment confirmed");
                        // Real-time will handle the cache update
                      }
                    }}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Confirm Appointment
                  </Button>
                )}
                
                {(appointment.status === 'scheduled' || appointment.status === 'confirmed') && (
                  <Button 
                    className="w-full" 
                    variant="outline"
                    onClick={async () => {
                      const result = await markAppointmentArrived(appointmentId);
                      if (result.success) {
                        toast.success("Customer marked as arrived");
                        // Real-time will handle the cache update
                      }
                    }}
                  >
                    <User className="mr-2 h-4 w-4" />
                    Customer Arrived
                  </Button>
                )}
                
                {appointment.status !== 'cancelled' && appointment.status !== 'converted' && (
                  <Button 
                    className="w-full" 
                    variant="destructive"
                    onClick={() => setShowCancelDialog(true)}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Cancel Appointment
                  </Button>
                )}
                
                {appointment.status === 'converted' && appointment.converted_to_ticket_id && (
                  <Button 
                    className="w-full" 
                    onClick={() => router.push(`/orders/${appointment.converted_to_ticket_id}`)}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    View Ticket
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </PageContainer>

      {/* Convert to Ticket Dialog */}
      <AlertDialog open={showConvertDialog} onOpenChange={setShowConvertDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Convert to Repair Ticket</AlertDialogTitle>
            <AlertDialogDescription>
              This will create a new repair ticket with all the information from this appointment.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {formData.selected_services.length > 0 && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="font-medium mb-2">The following will be included:</p>
              <ul className="text-sm space-y-1">
                <li>• Customer information</li>
                <li>• Device details: {formData.serial_number || 'Device info'}</li>
                <li>• {formData.selected_services.length} selected services</li>
                <li>• Estimated cost: ${calculateEstimatedCost()}</li>
                {formData.technician_notes && <li>• Technician notes</li>}
              </ul>
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConvertToTicket} disabled={isConverting}>
              {isConverting ? "Converting..." : "Convert to Ticket"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Appointment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this appointment? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Appointment</AlertDialogCancel>
            <AlertDialogAction 
              onClick={async () => {
                const result = await cancelAppointment(appointmentId, "Cancelled by staff");
                if (result.success) {
                  toast.success("Appointment cancelled");
                  // Real-time will handle the cache update
                }
                setShowCancelDialog(false);
              }}
              className="bg-destructive text-destructive-foreground"
            >
              Cancel Appointment
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}