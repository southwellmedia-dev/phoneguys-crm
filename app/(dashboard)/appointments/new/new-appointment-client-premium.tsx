"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageContainer } from "@/components/layout/page-container";
import { ButtonPremium } from "@/components/premium/ui/buttons/button-premium";
import { InputPremium } from "@/components/premium/ui/forms/input-premium";
import { TextareaPremium } from "@/components/premium/ui/forms/textarea-premium";
import { SelectPremium } from "@/components/premium/ui/forms/select-premium";
import { CheckboxPremium } from "@/components/premium/ui/forms/checkbox-premium";
import { RadioPremium } from "@/components/premium/ui/forms/radio-premium";
import { FormFieldWrapper, FormSection, FormGrid } from "@/components/premium/ui/forms/form-field-wrapper";
import { PremiumFormSection } from "@/components/premium/forms/premium-form-layout";
import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardDescription, GlassCardContent } from "@/components/premium/ui/cards/glass-card";
import { StatusBadge } from "@/components/premium/ui/badges/status-badge";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { 
  Save, 
  Loader2, 
  User, 
  Phone, 
  Mail, 
  Smartphone, 
  Calendar,
  Clock,
  FileText, 
  AlertCircle, 
  Users, 
  X,
  Plus,
  Wrench,
  CheckCircle,
  AlertTriangle,
  Zap
} from "lucide-react";
import { toast } from "sonner";
import { createAppointment, fetchCustomerDevices } from "./actions";
import { cn } from "@/lib/utils";

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
}

interface Device {
  id: string;
  model_name: string;
  model_number?: string;
  device_type?: string;
  manufacturer: {
    id: string;
    name: string;
  };
}

interface NewAppointmentClientProps {
  customers: Customer[];
  devices: Device[];
  technicians?: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
  }>;
}

const issueTypes = [
  { value: "screen_crack", label: "Screen Crack", icon: "🔨", severity: "high" },
  { value: "battery_issue", label: "Battery Issue", icon: "🔋", severity: "medium" },
  { value: "charging_port", label: "Charging Port", icon: "🔌", severity: "medium" },
  { value: "water_damage", label: "Water Damage", icon: "💧", severity: "high" },
  { value: "software_issue", label: "Software Issue", icon: "💻", severity: "low" },
  { value: "speaker_issue", label: "Speaker Issue", icon: "🔊", severity: "medium" },
  { value: "camera_issue", label: "Camera Issue", icon: "📷", severity: "medium" },
  { value: "button_issue", label: "Button Issue", icon: "🔘", severity: "low" },
  { value: "other", label: "Other", icon: "❓", severity: "low" }
];

const durationOptions = [
  { value: "15", label: "15 minutes" },
  { value: "30", label: "30 minutes" },
  { value: "45", label: "45 minutes" },
  { value: "60", label: "1 hour" },
  { value: "90", label: "1.5 hours" },
  { value: "120", label: "2 hours" },
];

export function NewAppointmentClientPremium({ customers, devices, technicians = [] }: NewAppointmentClientProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  
  // Hydration state - following HYDRATION_STRATEGY.md
  const [isMounted, setIsMounted] = useState(false);
  const [hasLoadedDevices, setHasLoadedDevices] = useState(false);
  
  // Initialize hydration
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  // Form state
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    email: "",
    phone: ""
  });
  const [isNewCustomer, setIsNewCustomer] = useState(true);
  const [selectedDeviceId, setSelectedDeviceId] = useState("");
  const [selectedCustomerDeviceId, setSelectedCustomerDeviceId] = useState("");
  const [customerDevices, setCustomerDevices] = useState<any[]>([]);
  const [loadingDevices, setLoadingDevices] = useState(false);
  
  // Device details state
  const [serialNumber, setSerialNumber] = useState("");
  const [imei, setImei] = useState("");
  const [color, setColor] = useState("");
  const [storageSize, setStorageSize] = useState("");
  const [condition, setCondition] = useState("good");
  
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [duration, setDuration] = useState("30");
  const [selectedIssues, setSelectedIssues] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [urgency, setUrgency] = useState<"scheduled" | "emergency" | "walk-in">("scheduled");
  const [assignedTo, setAssignedTo] = useState("");

  // Validation state
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Prepare customer options for combobox
  const customerOptions: ComboboxOption[] = customers.map(c => ({
    value: c.id,
    label: `${c.name} - ${c.email}`,
    secondaryLabel: c.phone
  }));

  // Prepare device options for combobox
  const deviceOptions: ComboboxOption[] = devices.map(d => ({
    value: d.id,
    label: `${d.manufacturer?.name || ''} ${d.model_name}`.trim(),
    secondaryLabel: d.device_type
  }));

  // Fetch customer devices when customer is selected (only after mount)
  useEffect(() => {
    if (isMounted && selectedCustomerId && !isNewCustomer) {
      setLoadingDevices(true);
      fetchCustomerDevices(selectedCustomerId)
        .then(devices => {
          setCustomerDevices(devices);
          setLoadingDevices(false);
          setHasLoadedDevices(true);
        })
        .catch(error => {
          console.error('Failed to fetch customer devices:', error);
          setLoadingDevices(false);
          setHasLoadedDevices(true); // Mark as loaded even on error
        });
    } else if (isNewCustomer || !selectedCustomerId) {
      setCustomerDevices([]);
      setHasLoadedDevices(false);
    }
  }, [isMounted, selectedCustomerId, isNewCustomer]);

  // Populate device fields when customer device is selected
  useEffect(() => {
    if (selectedCustomerDeviceId && customerDevices.length > 0) {
      const selectedDevice = customerDevices.find(d => d.id === selectedCustomerDeviceId);
      if (selectedDevice) {
        // Populate fields with existing device data
        setSerialNumber(selectedDevice.serial_number || "");
        setImei(selectedDevice.imei || "");
        setColor(selectedDevice.color || "");
        setStorageSize(selectedDevice.storage_size || "");
        setCondition(selectedDevice.condition || "good");
      }
    } else if (!selectedCustomerDeviceId) {
      // Clear fields when no customer device is selected
      setSerialNumber("");
      setImei("");
      setColor("");
      setStorageSize("");
      setCondition("good");
    }
  }, [selectedCustomerDeviceId, customerDevices]);

  const handleToggleIssue = (issue: string) => {
    setSelectedIssues(prev => 
      prev.includes(issue) 
        ? prev.filter(i => i !== issue)
        : [...prev, issue]
    );
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!isNewCustomer && !selectedCustomerId) {
      newErrors.customer = "Please select a customer";
    }
    if (isNewCustomer) {
      if (!newCustomer.name) newErrors.name = "Name is required";
      if (!newCustomer.email) newErrors.email = "Email is required";
    }
    if (!selectedDeviceId && !selectedCustomerDeviceId) {
      newErrors.device = "Please select a device";
    }
    if (!scheduledDate) newErrors.date = "Date is required";
    if (!scheduledTime) newErrors.time = "Time is required";
    if (selectedIssues.length === 0) newErrors.issues = "Please select at least one issue";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsLoading(true);

    try {
      const appointmentData = {
        customer_id: isNewCustomer ? null : selectedCustomerId,
        new_customer: isNewCustomer ? newCustomer : null,
        device_id: selectedDeviceId || null,
        customer_device_id: selectedCustomerDeviceId || null,
        device_details: {
          serial_number: serialNumber || null,
          imei: imei || null,
          color: color || null,
          storage_size: storageSize || null,
          condition: condition
        },
        scheduled_date: scheduledDate,
        scheduled_time: scheduledTime,
        duration_minutes: parseInt(duration),
        issues: selectedIssues,
        issue_description: description || null,
        internal_notes: notes || null,
        urgency,
        source: "in_person",
        status: "scheduled",
        assigned_to: assignedTo || null
      };

      const result = await createAppointment(appointmentData);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to create appointment');
      }

      toast.success("Appointment created successfully!");
      router.push('/appointments');
    } catch (error) {
      console.error('Error creating appointment:', error);
      toast.error(error instanceof Error ? error.message : "Failed to create appointment");
    } finally {
      setIsLoading(false);
    }
  };

  const headerActions = [
    {
      label: "Cancel",
      icon: <X className="h-4 w-4" />,
      variant: "destructive" as const,
      onClick: () => router.push('/appointments'),
    },
    {
      label: isLoading ? "Creating..." : "Create Appointment",
      icon: isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />,
      variant: "success" as const,
      onClick: handleSubmit,
      disabled: isLoading,
    },
  ];


  return (
    <PageContainer
      title="Schedule Appointment"
      description="Create a new customer appointment"
      actions={headerActions}
    >
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Customer Information */}
        <GlassCard>
          <GlassCardHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <GlassCardTitle>Customer Information</GlassCardTitle>
                <GlassCardDescription>Select an existing customer or add new</GlassCardDescription>
              </div>
            </div>
          </GlassCardHeader>
          <GlassCardContent>
            <Tabs defaultValue="new" onValueChange={(value) => {
              const isNew = value === "new";
              setIsNewCustomer(isNew);
              if (isNew) {
                // Clear existing customer selection when switching to new customer
                setSelectedCustomerId("");
                setCustomerDevices([]);
                setSelectedCustomerDeviceId("");
              }
            }}>
              <TabsList className="w-full grid grid-cols-2 bg-gray-100/50 dark:bg-gray-800/50 p-1 rounded-lg">
                <TabsTrigger 
                  value="new" 
                  className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-950 data-[state=active]:shadow-sm transition-all"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Customer
                </TabsTrigger>
                <TabsTrigger 
                  value="existing" 
                  className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-950 data-[state=active]:shadow-sm transition-all"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Existing Customer
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="existing" className="space-y-4 mt-4">
                <FormFieldWrapper
                  label="Select Customer"
                  required
                  error={errors.customer}
                  description="Choose from existing customers"
                >
                  <Combobox
                    options={customerOptions}
                    value={selectedCustomerId}
                    onValueChange={(customerId) => {
                      setSelectedCustomerId(customerId);
                      // Clear device selection when selecting a customer
                      setSelectedDeviceId("");
                    }}
                    placeholder="Search customers..."
                    searchPlaceholder="Type to search..."
                    emptyText="No customers found"
                  />
                  {selectedCustomerId && (() => {
                    const selectedCustomer = customers.find(c => c.id === selectedCustomerId);
                    return selectedCustomer ? (
                      <div className="mt-3 p-4 bg-cyan-50/50 dark:bg-cyan-950/10 rounded-lg border border-cyan-200 dark:border-cyan-800">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-cyan-100 dark:bg-cyan-900/30 rounded-full">
                            <User className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                          </div>
                          <div className="flex-1 space-y-1">
                            <div className="font-semibold text-gray-900 dark:text-gray-100">
                              {selectedCustomer.name}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400 space-y-0.5">
                              <div className="flex items-center gap-2">
                                <Mail className="h-3 w-3" />
                                {selectedCustomer.email}
                              </div>
                              {selectedCustomer.phone && (
                                <div className="flex items-center gap-2">
                                  <Phone className="h-3 w-3" />
                                  {selectedCustomer.phone}
                                </div>
                              )}
                            </div>
                          </div>
                          <CheckCircle className="h-5 w-5 text-cyan-500 shrink-0" />
                        </div>
                      </div>
                    ) : null;
                  })()}
                </FormFieldWrapper>
              </TabsContent>
              
              <TabsContent value="new" className="space-y-4 mt-4">
                <FormFieldWrapper
                  label="Full Name"
                  required
                  error={errors.name}
                >
                  <InputPremium
                    value={newCustomer.name}
                    onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})}
                    placeholder="John Doe"
                    icon={<User className="h-4 w-4" />}
                    variant={errors.name ? "error" : "default"}
                  />
                </FormFieldWrapper>

                <FormGrid columns={2}>
                  <FormFieldWrapper
                    label="Email"
                    required
                    error={errors.email}
                  >
                    <InputPremium
                      type="email"
                      value={newCustomer.email}
                      onChange={(e) => setNewCustomer({...newCustomer, email: e.target.value})}
                      placeholder="john@example.com"
                      icon={<Mail className="h-4 w-4" />}
                      variant={errors.email ? "error" : "default"}
                    />
                  </FormFieldWrapper>

                  <FormFieldWrapper
                    label="Phone"
                  >
                    <InputPremium
                      value={newCustomer.phone}
                      onChange={(e) => setNewCustomer({...newCustomer, phone: e.target.value})}
                      placeholder="(555) 123-4567"
                      icon={<Phone className="h-4 w-4" />}
                    />
                  </FormFieldWrapper>
                </FormGrid>
              </TabsContent>
            </Tabs>
          </GlassCardContent>
        </GlassCard>

        {/* Appointment Schedule */}
        <GlassCard>
          <GlassCardHeader>
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <GlassCardTitle>Appointment Schedule</GlassCardTitle>
                  <GlassCardDescription>Set date, time and duration</GlassCardDescription>
                </div>
              </div>
              <ButtonPremium
                type="button"
                variant="soft"
                size="sm"
                onClick={() => {
                  const now = new Date();
                  setScheduledDate(now.toISOString().split('T')[0]);
                  setScheduledTime(now.toTimeString().slice(0, 5));
                  setUrgency('walk-in');
                }}
                leftIcon={<Clock className="h-4 w-4" />}
              >
                Walk-in (Now)
              </ButtonPremium>
            </div>
          </GlassCardHeader>
          <GlassCardContent className="space-y-4">
            <FormGrid columns={2}>
              <FormFieldWrapper
                label="Date"
                required
                error={errors.date}
              >
                <InputPremium
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  icon={<Calendar className="h-4 w-4" />}
                  variant={errors.date ? "error" : "default"}
                />
              </FormFieldWrapper>

              <FormFieldWrapper
                label="Time"
                required
                error={errors.time}
              >
                <InputPremium
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  icon={<Clock className="h-4 w-4" />}
                  variant={errors.time ? "error" : "default"}
                />
              </FormFieldWrapper>
            </FormGrid>

            <FormGrid columns={2}>
              <FormFieldWrapper
                label="Duration"
                description="Estimated appointment length"
              >
                <SelectPremium
                  value={duration}
                  onChange={(val) => {
                    console.log('Duration changed to:', val);
                    setDuration(val as string);
                  }}
                  options={durationOptions}
                  placeholder="Select duration"
                />
              </FormFieldWrapper>

              <FormFieldWrapper
                label="Urgency"
                description="Appointment priority"
              >
                <SelectPremium
                  value={urgency}
                  onChange={(val) => {
                    console.log('Urgency changed to:', val);
                    setUrgency(val as 'scheduled' | 'emergency' | 'walk-in');
                  }}
                  options={[
                    { value: "scheduled", label: "Scheduled" },
                    { value: "emergency", label: "Emergency" },
                    { value: "walk-in", label: "Walk-in" }
                  ]}
                  placeholder="Select urgency"
                />
              </FormFieldWrapper>
            </FormGrid>

            {technicians.length > 0 && (
              <FormFieldWrapper
                label="Assign To"
                description="Select a technician for this appointment"
                tooltip="Leave empty for auto-assignment"
              >
                <SelectPremium
                  value={assignedTo}
                  onChange={(val) => {
                    console.log('Assigned to changed to:', val);
                    setAssignedTo(val as string);
                  }}
                  options={[
                    { value: "", label: "Auto-assign" },
                    ...technicians.map(t => ({
                      value: t.id,
                      label: t.name,
                      description: t.role
                    }))
                  ]}
                  placeholder="Select technician"
                />
              </FormFieldWrapper>
            )}
          </GlassCardContent>
        </GlassCard>

        {/* Device Information - Full Width */}
        <GlassCard className="lg:col-span-2">
        <GlassCardHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Smartphone className="h-5 w-5 text-primary" />
            </div>
            <div>
              <GlassCardTitle>Device Information</GlassCardTitle>
              <GlassCardDescription>Select the device for repair</GlassCardDescription>
            </div>
          </div>
        </GlassCardHeader>
        <GlassCardContent className="space-y-6">
          {selectedCustomerId && (loadingDevices || customerDevices.length > 0) && (
            <FormFieldWrapper
              label="Customer's Devices"
              description="Select from customer's existing devices"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {loadingDevices ? (
                  // Show skeletons while loading
                  <>
                    <div className="flex items-center gap-3 p-3 rounded-lg border-2 border-border animate-pulse">
                      <div className="w-16 h-16 rounded-lg bg-muted/30 shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-muted/30 rounded w-3/4" />
                        <div className="h-3 bg-muted/30 rounded w-1/2" />
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg border-2 border-border animate-pulse">
                      <div className="w-16 h-16 rounded-lg bg-muted/30 shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-muted/30 rounded w-3/4" />
                        <div className="h-3 bg-muted/30 rounded w-1/2" />
                      </div>
                    </div>
                  </>
                ) : customerDevices.map(device => {
                  const deviceInfo = device.device || device;
                  return (
                    <div
                      key={device.id}
                      onClick={() => {
                        setSelectedCustomerDeviceId(device.id);
                        setSelectedDeviceId(""); // Clear device model selection when customer device is selected
                      }}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all",
                        selectedCustomerDeviceId === device.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      {/* Device Thumbnail */}
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
                      
                      {/* Device Details */}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {deviceInfo.manufacturer?.name} {deviceInfo.model_name}
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
                      
                      {/* Selected Indicator */}
                      {selectedCustomerDeviceId === device.id && (
                        <CheckCircle className="h-5 w-5 text-primary shrink-0" />
                      )}
                    </div>
                  );
                })}
              </div>
            </FormFieldWrapper>
          )}

          {!selectedCustomerDeviceId && (
            <FormFieldWrapper
              label="Select Device Model"
              required={!selectedCustomerDeviceId}
              error={errors.device}
              description="Choose the device model for repair"
            >
              <Combobox
                options={deviceOptions}
                value={selectedDeviceId}
                onValueChange={setSelectedDeviceId}
                placeholder="Search devices..."
                searchPlaceholder="Type to search..."
                emptyText="No devices found"
              />
            </FormFieldWrapper>
          )}

          {(selectedDeviceId || selectedCustomerDeviceId) && (
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
                    value={serialNumber}
                    onChange={(e) => !selectedCustomerDeviceId && setSerialNumber(e.target.value)}
                    placeholder="Enter serial number"
                    disabled={!!selectedCustomerDeviceId}
                    variant={selectedCustomerDeviceId ? "default" : "default"}
                  />
                </FormFieldWrapper>

                <FormFieldWrapper
                  label="IMEI"
                  description={selectedCustomerDeviceId ? "From saved device" : "Device IMEI number"}
                >
                  <InputPremium
                    value={imei}
                    onChange={(e) => !selectedCustomerDeviceId && setImei(e.target.value)}
                    placeholder="Enter IMEI"
                    disabled={!!selectedCustomerDeviceId}
                    variant={selectedCustomerDeviceId ? "default" : "default"}
                  />
                </FormFieldWrapper>

                <FormFieldWrapper
                  label="Color"
                  description={selectedCustomerDeviceId ? "From saved device" : "Device color"}
                >
                  <InputPremium
                    value={color}
                    onChange={(e) => !selectedCustomerDeviceId && setColor(e.target.value)}
                    placeholder="e.g., Black, White, Blue"
                    disabled={!!selectedCustomerDeviceId}
                    variant={selectedCustomerDeviceId ? "default" : "default"}
                  />
                </FormFieldWrapper>

                <FormFieldWrapper
                  label="Storage Size"
                  description={selectedCustomerDeviceId ? "From saved device" : "Device storage capacity"}
                >
                  <SelectPremium
                    value={storageSize}
                    onChange={(val) => !selectedCustomerDeviceId && setStorageSize(val as string)}
                    disabled={!!selectedCustomerDeviceId}
                    options={[
                    { value: "32GB", label: "32 GB" },
                    { value: "64GB", label: "64 GB" },
                    { value: "128GB", label: "128 GB" },
                    { value: "256GB", label: "256 GB" },
                    { value: "512GB", label: "512 GB" },
                    { value: "1TB", label: "1 TB" },
                  ]}
                  placeholder="Select storage"
                />
              </FormFieldWrapper>
            </FormGrid>
            </>
          )}
        </GlassCardContent>
        </GlassCard>

        {/* Issue Selection - Full Width */}
        <GlassCard className="lg:col-span-2">
        <GlassCardHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Wrench className="h-5 w-5 text-primary" />
            </div>
            <div>
              <GlassCardTitle>Repair Issues</GlassCardTitle>
              <GlassCardDescription>Select all issues that need to be addressed</GlassCardDescription>
            </div>
          </div>
        </GlassCardHeader>
        <GlassCardContent className="space-y-6">
          <FormFieldWrapper
            label="Select Issues"
            required
            error={errors.issues}
            description="Choose all applicable issues"
          >
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {issueTypes.map(issue => (
                <div
                  key={issue.value}
                  onClick={() => handleToggleIssue(issue.value)}
                  className={cn(
                    "p-4 rounded-lg border-2 cursor-pointer transition-all flex items-center gap-3",
                    selectedIssues.includes(issue.value)
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <span className="text-2xl">{issue.icon}</span>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{issue.label}</p>
                    <StatusBadge
                      status={
                        issue.severity === "high" ? "error" :
                        issue.severity === "medium" ? "warning" :
                        "info"
                      }
                      size="sm"
                    >
                      {issue.severity}
                    </StatusBadge>
                  </div>
                  {selectedIssues.includes(issue.value) && (
                    <CheckCircle className="h-5 w-5 text-primary" />
                  )}
                </div>
              ))}
            </div>
          </FormFieldWrapper>

          <FormFieldWrapper
            label="Issue Description"
            description="Provide additional details about the issues"
          >
            <TextareaPremium
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the issues in detail..."
              rows={3}
            />
          </FormFieldWrapper>

          <FormFieldWrapper
            label="Internal Notes"
            description="Notes for internal use only"
          >
            <TextareaPremium
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any special instructions or notes..."
              rows={3}
            />
          </FormFieldWrapper>
        </GlassCardContent>
        </GlassCard>
      </div>
    </PageContainer>
  );
}