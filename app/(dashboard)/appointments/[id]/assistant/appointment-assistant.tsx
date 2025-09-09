'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { 
  ArrowLeft, 
  Save, 
  FileText, 
  XCircle,
  User,
  Phone,
  Mail,
  MapPin,
  Clock,
  DollarSign,
  CheckCircle,
  AlertCircle,
  Wrench,
  Smartphone
} from 'lucide-react';
import { PageContainer } from '@/components/layout/page-container';
import { ButtonPremium } from '@/components/premium/ui/buttons/button-premium';
import { Button } from '@/components/ui/button';
import { CardPremium } from '@/components/premium/ui/cards/card-premium';
import { MetricCard } from '@/components/premium/ui/cards/metric-card';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { AppointmentStatusFlow } from '@/components/appointments/flow';
import { ConversionModal } from '@/components/appointments/flow/conversion-modal';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Combobox, type ComboboxOption } from '@/components/ui/combobox';
import { FormFieldWrapper, FormGrid } from '@/components/premium/ui/forms/form-field-wrapper';
import { InputPremium } from '@/components/premium/ui/forms/input-premium';
import { updateAppointmentDetails, convertAppointmentToTicket, cancelAppointment } from '../actions';

interface AppointmentAssistantProps {
  appointment: any;
  services: any[];
  devices: any[];
  customerDevices: any[];
  technicians: any[];
}

export function AppointmentAssistant({
  appointment,
  services,
  devices,
  customerDevices,
  technicians
}: AppointmentAssistantProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [showConversionModal, setShowConversionModal] = useState(false);
  
  // Parse existing notes
  const parsedNotes = appointment.notes ? 
    (typeof appointment.notes === 'string' ? 
      JSON.parse(appointment.notes) : appointment.notes) 
    : {};

  // State management with refs for persistence
  const [selectedServices, setSelectedServices] = useState<string[]>(
    appointment.service_ids || []
  );
  const [assignedTo, setAssignedTo] = useState(appointment.assigned_to || 'unassigned');
  const [estimatedCost, setEstimatedCost] = useState(appointment.estimated_cost || 0);
  const [notes, setNotes] = useState({
    customerNotes: parsedNotes.customer_notes || '',
    technicianNotes: parsedNotes.technician_notes || '',
    additionalIssues: parsedNotes.additional_issues || ''
  });
  // Initialize with customer device if it exists
  const initialCustomerDevice = appointment.customer_device_id ? 
    customerDevices.find(d => d.id === appointment.customer_device_id) || appointment.customer_devices
    : null;
    
  const [selectedCustomerDeviceId, setSelectedCustomerDeviceId] = useState(appointment.customer_device_id || null);
  const [deviceData, setDeviceData] = useState({
    id: appointment.device_id || initialCustomerDevice?.device_id || '',
    serialNumber: initialCustomerDevice?.serial_number || appointment.customer_devices?.serial_number || '',
    imei: initialCustomerDevice?.imei || appointment.customer_devices?.imei || '',
    color: initialCustomerDevice?.color || appointment.customer_devices?.color || '',
    storageSize: initialCustomerDevice?.storage_size || appointment.customer_devices?.storage_size || '',
    condition: initialCustomerDevice?.condition || appointment.customer_devices?.condition || 'good'
  });

  // Use ref to track state for reliable saves
  const stateRef = useRef({
    selectedServices,
    assignedTo,
    estimatedCost,
    notes,
    deviceData,
    selectedCustomerDeviceId
  });

  // Update ref when state changes
  useEffect(() => {
    stateRef.current = {
      selectedServices,
      assignedTo,
      estimatedCost,
      notes,
      deviceData,
      selectedCustomerDeviceId
    };
  }, [selectedServices, assignedTo, estimatedCost, notes, deviceData, selectedCustomerDeviceId]);

  // Calculate total cost based on selected services
  useEffect(() => {
    const total = services
      .filter(s => selectedServices.includes(s.id))
      .reduce((sum, s) => sum + (s.base_price || 0), 0);
    setEstimatedCost(total);
  }, [selectedServices, services]);

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
      const currentState = stateRef.current;
      
      const formData = {
        device_id: currentState.deviceData.id,
        customer_device_id: currentState.selectedCustomerDeviceId,
        selected_services: currentState.selectedServices,
        service_ids: currentState.selectedServices,
        estimated_cost: currentState.estimatedCost,
        assigned_to: currentState.assignedTo === 'unassigned' ? null : currentState.assignedTo,
        customer_notes: currentState.notes.customerNotes,
        technician_notes: currentState.notes.technicianNotes,
        additional_issues: currentState.notes.additionalIssues
      };

      const result = await updateAppointmentDetails(appointment.id, formData);
      
      if (result.success) {
        toast.success('Appointment saved successfully');
      } else {
        toast.error(result.error || 'Failed to save appointment');
      }
    } catch (error) {
      toast.error('Failed to save appointment');
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleConvertToTicket = async (data: any) => {
    try {
      // First save current state
      await handleSave();
      
      // Prepare additional data for conversion
      const currentState = stateRef.current;
      const additionalData = {
        ...data,
        device_id: currentState.deviceData.id,
        customer_device_id: currentState.selectedCustomerDeviceId,
        selected_services: currentState.selectedServices,
        estimated_cost: currentState.estimatedCost,
        notes: currentState.notes
      };
      
      // Then convert to ticket with additional data
      const result = await convertAppointmentToTicket(appointment.id, additionalData);
      
      if (result.success && result.ticket) {
        toast.success('Appointment converted to ticket successfully');
        router.push(`/orders/${result.ticket.id}`);
      } else {
        throw new Error(result.error || 'Failed to convert');
      }
    } catch (error) {
      toast.error('Failed to convert appointment to ticket');
      throw error;
    }
  };

  const handleCancelAppointment = async () => {
    if (!confirm('Are you sure you want to cancel this appointment? This action cannot be undone.')) {
      return;
    }

    try {
      const reason = prompt('Please provide a reason for cancellation:');
      if (!reason) return;

      await cancelAppointment(appointment.id, reason);
      toast.success('Appointment cancelled successfully');
      router.push(`/appointments/${appointment.id}`);
    } catch (error) {
      toast.error('Failed to cancel appointment');
      console.error(error);
    }
  };

  const customer = appointment.customers;
  const formattedDate = appointment.scheduled_date 
    ? format(new Date(appointment.scheduled_date), 'EEEE, MMMM d, yyyy')
    : 'Date not scheduled';
  const formattedTime = appointment.scheduled_time || 'Time not set';

  return (
    <PageContainer
      title="Appointment Assistant"
      description={`Helping ${customer?.name} with their appointment`}
      actions={
        <>
          <Button
            variant="outline"
            onClick={() => router.push(`/appointments/${appointment.id}`)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Details
          </Button>
          <ButtonPremium
            variant="default"
            onClick={handleSave}
            disabled={isSaving}
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save Progress'}
          </ButtonPremium>
          <ButtonPremium
            variant="gradient-success"
            onClick={() => setShowConversionModal(true)}
          >
            <FileText className="h-4 w-4 mr-2" />
            Convert to Ticket
          </ButtonPremium>
        </>
      }
    >
      <div className="space-y-6">
        {/* Status Flow */}
        <Card className="border-cyan-200 bg-gradient-to-r from-cyan-50 to-blue-50">
          <CardContent className="pt-6">
            <AppointmentStatusFlow currentStatus={appointment.status} />
          </CardContent>
        </Card>

        {/* Prominent Appointment Status Card - Green for In Progress */}
        <Card className="bg-gradient-to-r from-green-600 to-green-500 text-white border-0 shadow-lg">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 rounded-lg">
                  <Clock className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white/90 flex items-center gap-2">
                    APPOINTMENT IN PROGRESS
                    <span className="h-2 w-2 bg-white rounded-full animate-pulse" />
                  </p>
                  <p className="text-2xl font-bold">
                    {appointment.scheduled_date 
                      ? format(new Date(appointment.scheduled_date), 'EEEE, MMMM d')
                      : 'Not scheduled'}
                  </p>
                  <p className="text-lg text-white/90">{formattedTime}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-white/80">Duration</p>
                <p className="text-xl font-semibold">{appointment.duration_minutes || 30} min</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Key Info Row */}
        <div className="grid gap-4 md:grid-cols-3">
          <MetricCard
            title="Selected Services"
            value={selectedServices.length}
            variant="default"
            icon={<Wrench />}
            size="sm"
          />
          <MetricCard
            title="Estimated Cost"
            value={`$${estimatedCost.toFixed(2)}`}
            variant="accent-primary"
            icon={<DollarSign />}
            size="sm"
          />
          <MetricCard
            title="Status"
            value={appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
            variant={appointment.status === 'arrived' ? 'success' : 'default'}
            icon={<CheckCircle />}
            size="sm"
          />
        </div>

        {/* Device Selection */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left Column - Assignment & Customer */}
          <div className="space-y-6">
            {/* Assignment - Moved to top */}
            <CardPremium variant="outline">
              <CardHeader>
                <CardTitle>Assignment</CardTitle>
              </CardHeader>
              <CardContent>
                <Label htmlFor="technician">Assigned Technician</Label>
                <Select value={assignedTo} onValueChange={setAssignedTo}>
                  <SelectTrigger id="technician">
                    <SelectValue placeholder="Select technician" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {technicians.map((tech) => (
                      <SelectItem key={tech.id} value={tech.id}>
                        {tech.full_name} ({tech.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </CardPremium>

            {/* Customer Card */}
            <CardPremium variant="outline">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Customer Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-lg font-semibold">{customer?.name}</p>
                </div>
                {customer?.phone && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    {customer.phone}
                  </div>
                )}
                {customer?.email && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    {customer.email}
                  </div>
                )}
                {customer?.address && (
                  <div className="flex items-start gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 mt-0.5" />
                    <div>
                      {customer.address}<br />
                      {customer.city}, {customer.state} {customer.zip_code}
                    </div>
                  </div>
                )}
                {customer?.total_orders > 0 && (
                  <div className="pt-2 border-t">
                    <Badge variant="secondary">
                      {customer.total_orders} Previous Orders
                    </Badge>
                  </div>
                )}
              </CardContent>
            </CardPremium>

            {/* Device Selection */}
            <CardPremium variant="outline">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5" />
                  Device Information
                </CardTitle>
                <CardDescription>Select the device for repair</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Customer's Devices Grid */}
                {customerDevices.length > 0 && (
                  <div className="space-y-2">
                    <Label>Customer's Devices</Label>
                    <div className="grid grid-cols-1 gap-3">
                      {customerDevices.map(device => {
                        const deviceInfo = device.devices || device.device || device;
                        return (
                          <div
                            key={device.id}
                            onClick={() => {
                              setSelectedCustomerDeviceId(device.id);
                              setDeviceData({
                                id: device.device_id || deviceInfo.id,
                                serialNumber: device.serial_number || '',
                                imei: device.imei || '',
                                color: device.color || '',
                                storageSize: device.storage_size || '',
                                condition: device.condition || 'good'
                              });
                            }}
                            className={cn(
                              "flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all",
                              selectedCustomerDeviceId === device.id
                                ? "border-primary bg-primary/5"
                                : "border-border hover:border-primary/50"
                            )}
                          >
                        <div className="w-16 h-16 rounded-lg bg-muted/30 flex items-center justify-center shrink-0 overflow-hidden">
                          {deviceInfo.thumbnail_url || deviceInfo.image_url ? (
                            <img 
                              src={deviceInfo.thumbnail_url || deviceInfo.image_url} 
                              alt={deviceInfo.model_name}
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <Smartphone className="h-8 w-8 text-muted-foreground" />
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">
                            {deviceInfo.manufacturers?.name || deviceInfo.manufacturer?.name || ''} {deviceInfo.model_name}
                          </p>
                          <p className="text-sm text-muted-foreground truncate">
                            {device.serial_number || 'No serial number'}
                          </p>
                          {device.storage_size && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {device.storage_size} • {device.color || 'Unknown color'}
                            </p>
                          )}
                        </div>
                        
                        {selectedCustomerDeviceId === device.id && (
                          <CheckCircle className="h-5 w-5 text-primary shrink-0" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Device Model Selection */}
            {!selectedCustomerDeviceId && (
              <FormFieldWrapper
                label="Select Device Model"
                description="Choose the device model for repair"
              >
                <Combobox
                  options={devices.map(d => ({
                    value: d.id,
                    label: `${d.manufacturers?.name || ''} ${d.model_name}`.trim(),
                    secondaryLabel: d.device_type
                  }))}
                  value={deviceData.id}
                  onValueChange={(deviceId) => {
                    const device = devices.find(d => d.id === deviceId);
                    if (device) {
                      setSelectedCustomerDeviceId(null);
                      setDeviceData({
                        id: deviceId,
                        serialNumber: '',
                        imei: '',
                        color: '',
                        storageSize: '',
                        condition: 'good'
                      });
                    }
                  }}
                  placeholder="Search devices..."
                  searchPlaceholder="Type to search..."
                  emptyText="No devices found"
                />
              </FormFieldWrapper>
            )}

            {/* Device Details */}
            {(deviceData.id || selectedCustomerDeviceId) && (
              <>
                {selectedCustomerDeviceId && (
                  <div className="mb-4 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border-2 border-green-500 shadow-sm">
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                      <span className="font-semibold text-green-900 dark:text-green-100">Using saved device information</span>
                      <span className="text-green-700 dark:text-green-300">• Fields are pre-filled from customer's device</span>
                    </div>
                  </div>
                )}
                <FormGrid columns={2}>
                  <FormFieldWrapper
                    label="Serial Number"
                    description={selectedCustomerDeviceId ? "From saved device" : "Device serial number"}
                  >
                    <InputPremium
                      value={deviceData.serialNumber}
                      onChange={(e) => !selectedCustomerDeviceId && setDeviceData(prev => ({ ...prev, serialNumber: e.target.value }))}
                      placeholder="Enter serial number"
                      disabled={!!selectedCustomerDeviceId}
                    />
                  </FormFieldWrapper>

                  <FormFieldWrapper
                    label="IMEI"
                    description={selectedCustomerDeviceId ? "From saved device" : "Device IMEI number"}
                  >
                    <InputPremium
                      value={deviceData.imei}
                      onChange={(e) => !selectedCustomerDeviceId && setDeviceData(prev => ({ ...prev, imei: e.target.value }))}
                      placeholder="Enter IMEI"
                      disabled={!!selectedCustomerDeviceId}
                    />
                  </FormFieldWrapper>

                  <FormFieldWrapper
                    label="Color"
                    description={selectedCustomerDeviceId ? "From saved device" : "Device color"}
                  >
                    <InputPremium
                      value={deviceData.color}
                      onChange={(e) => !selectedCustomerDeviceId && setDeviceData(prev => ({ ...prev, color: e.target.value }))}
                      placeholder="e.g., Black, White, Blue"
                      disabled={!!selectedCustomerDeviceId}
                    />
                  </FormFieldWrapper>

                  <FormFieldWrapper
                    label="Storage Size"
                    description={selectedCustomerDeviceId ? "From saved device" : "Storage capacity"}
                  >
                    <InputPremium
                      value={deviceData.storageSize}
                      onChange={(e) => !selectedCustomerDeviceId && setDeviceData(prev => ({ ...prev, storageSize: e.target.value }))}
                      placeholder="e.g., 128GB, 256GB"
                      disabled={!!selectedCustomerDeviceId}
                    />
                  </FormFieldWrapper>
                </FormGrid>
              </>
            )}
          </CardContent>
        </CardPremium>
          </div>

          {/* Right Column - Services & Notes */}
          <div className="space-y-6">
            {/* Services Selection */}
            <CardPremium variant="outline">
              <CardHeader>
                <CardTitle>Services Selection</CardTitle>
                <CardDescription>
                  Select all services to be performed
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Originally Reported Issues - As Helper Pills */}
                {appointment.issues && appointment.issues.length > 0 && (
                  <div className="p-3 bg-blue-50/50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                          Customer reported these issues:
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {appointment.issues.map((issue: string, index: number) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                            >
                              {issue}
                            </span>
                          ))}
                        </div>
                        {appointment.description && (
                          <p className="text-xs text-blue-700 dark:text-blue-300 mt-2 italic">
                            "{appointment.description}"
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {services.map((service) => (
                    <div
                      key={service.id}
                      className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-gray-50 hover:border-gray-300 transition-colors cursor-pointer"
                      onClick={() => handleServiceToggle(service.id)}
                    >
                      <Checkbox
                        id={service.id}
                        checked={selectedServices.includes(service.id)}
                        onCheckedChange={() => handleServiceToggle(service.id)}
                      />
                      <div className="flex-1">
                        <Label
                          htmlFor={service.id}
                          className="text-sm font-medium cursor-pointer"
                        >
                          {service.name}
                        </Label>
                        {service.description && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {service.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-xs">
                          <span className="font-semibold text-green-600">
                            ${service.base_price?.toFixed(2) || '0.00'}
                          </span>
                          {service.estimated_duration_minutes && (
                            <span className="text-muted-foreground">
                              ~{service.estimated_duration_minutes} min
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </CardPremium>

            {/* Notes */}
            <CardPremium variant="outline">
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="customer-notes">Customer Notes</Label>
                  <Textarea
                    id="customer-notes"
                    value={notes.customerNotes}
                    onChange={(e) => setNotes(prev => ({ ...prev, customerNotes: e.target.value }))}
                    placeholder="Notes from the customer..."
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="tech-notes">Technician Notes</Label>
                  <Textarea
                    id="tech-notes"
                    value={notes.technicianNotes}
                    onChange={(e) => setNotes(prev => ({ ...prev, technicianNotes: e.target.value }))}
                    placeholder="Technical notes..."
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="issues">Additional Issues</Label>
                  <Textarea
                    id="issues"
                    value={notes.additionalIssues}
                    onChange={(e) => setNotes(prev => ({ ...prev, additionalIssues: e.target.value }))}
                    placeholder="Any additional issues discovered..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </CardPremium>
          </div>
        </div>

        {/* Action Bar */}
        <Card className="bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium">Ready to proceed?</p>
                <p className="text-xs text-muted-foreground">
                  Save your progress or convert this appointment to a repair ticket
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => router.push(`/appointments/${appointment.id}`)}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCancelAppointment}
                  className="border-red-200 hover:bg-red-50 hover:border-red-300 text-red-600"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Cancel Appointment
                </Button>
                <ButtonPremium
                  variant="default"
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? 'Saving...' : 'Save Progress'}
                </ButtonPremium>
                <ButtonPremium
                  variant="gradient-success"
                  onClick={() => setShowConversionModal(true)}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Convert to Ticket
                </ButtonPremium>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Conversion Modal */}
      <ConversionModal
        isOpen={showConversionModal}
        onClose={() => setShowConversionModal(false)}
        appointmentId={appointment.id}
        customerName={customer?.name || ''}
        deviceInfo={
          deviceData.id
            ? `${devices.find(d => d.id === deviceData.id)?.model_name || 'Unknown Device'}`
            : 'No device selected'
        }
        selectedServices={services.filter(s => selectedServices.includes(s.id))}
        estimatedCost={estimatedCost}
        notes={notes}
        onConvert={handleConvertToTicket}
      />
    </PageContainer>
  );
}