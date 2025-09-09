"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageContainer } from "@/components/layout/page-container";
import { ButtonPremium } from "@/components/premium/ui/buttons/button-premium";
import { InputPremium } from "@/components/premium/ui/forms/input-premium";
import { TextareaPremium } from "@/components/premium/ui/forms/textarea-premium";
import { SelectPremium } from "@/components/premium/ui/forms/select-premium";
import { CheckboxPremium } from "@/components/premium/ui/forms/checkbox-premium";
import { FormFieldWrapper, FormGrid } from "@/components/premium/ui/forms/form-field-wrapper";
import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardDescription, GlassCardContent } from "@/components/premium/ui/cards/glass-card";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { 
  Save, 
  Loader2, 
  User, 
  Phone, 
  Mail, 
  Smartphone, 
  Wrench,
  AlertCircle, 
  Users, 
  X,
  Plus,
  CheckCircle,
  Package,
  DollarSign,
  Clock,
  FileText,
  Zap,
  Calendar,
  Info
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { fetchCustomerDevices, createOrder } from "./actions";

interface Device {
  id: string;
  model_name: string;
  model_number?: string;
  device_type?: string;
  release_year?: number;
  specifications?: any;
  image_url?: string;
  thumbnail_url?: string;
  parts_availability?: string;
  manufacturer?: {
    id: string;
    name: string;
  };
}

interface Service {
  id: string;
  name: string;
  description?: string;
  category?: string;
  base_price?: number;
  estimated_duration_minutes?: number;
  requires_parts: boolean;
  skill_level?: string;
}

interface NewOrderClientProps {
  customers: Array<{ id: string; name: string; email: string; phone: string }>;
  devices: Device[];
  services: Service[];
  technicians: Array<{ id: string; name: string; email: string; role: string }>;
}

const issueTypes = [
  { value: "screen_crack", label: "Screen Crack", icon: "📱", serviceCategory: "screen_repair" },
  { value: "battery_issue", label: "Battery Issue", icon: "🔋", serviceCategory: "battery_replacement" },
  { value: "charging_port", label: "Charging Port", icon: "🔌", serviceCategory: "charging_port" },
  { value: "water_damage", label: "Water Damage", icon: "💧", serviceCategory: "water_damage" },
  { value: "software_issue", label: "Software Issue", icon: "💻", serviceCategory: "software_issue" },
  { value: "speaker_issue", label: "Speaker Issue", icon: "🔊", serviceCategory: "speaker_repair" },
  { value: "camera_issue", label: "Camera Issue", icon: "📷", serviceCategory: "camera_repair" },
  { value: "button_issue", label: "Button Issue", icon: "🔘", serviceCategory: "button_repair" },
  { value: "other", label: "Other", icon: "❓", serviceCategory: "diagnostic" }
];

const priorityOptions = [
  { value: "low", label: "Low", description: "Can wait 3-5 days" },
  { value: "medium", label: "Medium", description: "Within 1-2 days" },
  { value: "high", label: "High", description: "Within 24 hours" },
  { value: "urgent", label: "Urgent", description: "Immediate attention" }
];

export function NewOrderClientPremium({ customers, devices, services, technicians }: NewOrderClientProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  
  // Hydration state - following HYDRATION_STRATEGY.md
  const [isMounted, setIsMounted] = useState(false);
  const [hasLoadedDevices, setHasLoadedDevices] = useState(false);
  
  // Initialize hydration
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  const [customerDevices, setCustomerDevices] = useState<any[]>([]);
  
  // Form state
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zip_code: "",
    notes: ""
  });
  const [isNewCustomer, setIsNewCustomer] = useState(true);
  const [selectedDeviceId, setSelectedDeviceId] = useState("");
  const [selectedCustomerDeviceId, setSelectedCustomerDeviceId] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [imei, setImei] = useState("");
  const [color, setColor] = useState("");
  const [storageSize, setStorageSize] = useState("");
  const [selectedIssues, setSelectedIssues] = useState<string[]>([]);
  const [issueDescription, setIssueDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [assignedTo, setAssignedTo] = useState("");
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [estimatedCost, setEstimatedCost] = useState(0);
  const [depositAmount, setDepositAmount] = useState(0);
  const [internalNotes, setInternalNotes] = useState("");
  const [estimatedCompletion, setEstimatedCompletion] = useState("");
  
  // Validation state
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Prepare options for comboboxes
  const customerOptions: ComboboxOption[] = customers.map(c => ({
    value: c.id,
    label: `${c.name} - ${c.email}`,
    secondaryLabel: c.phone
  }));

  const deviceOptions: ComboboxOption[] = devices.map(d => ({
    value: d.id,
    label: `${d.manufacturer?.name || ''} ${d.model_name}`.trim(),
    secondaryLabel: d.device_type
  }));

  const technicianOptions = technicians.map(t => ({
    value: t.id,
    label: t.name,
    description: t.role
  }));

  // Fetch customer devices when customer is selected (only after mount)
  useEffect(() => {
    if (isMounted && selectedCustomerId && !isNewCustomer) {
      fetchCustomerDevices(selectedCustomerId)
        .then(devices => {
          setCustomerDevices(devices);
          setHasLoadedDevices(true);
        })
        .catch(error => {
          console.error('Failed to fetch customer devices:', error);
          setHasLoadedDevices(true); // Mark as loaded even on error
        });
    } else if (isNewCustomer || !selectedCustomerId) {
      setCustomerDevices([]);
      setHasLoadedDevices(false);
    }
  }, [isMounted, selectedCustomerId, isNewCustomer]);

  // Auto-calculate costs based on selected services
  useEffect(() => {
    if (selectedServices.length > 0) {
      const total = selectedServices.reduce((sum, serviceId) => {
        const service = services.find(s => s.id === serviceId);
        return sum + (service?.base_price || 0);
      }, 0);
      setEstimatedCost(total);
      setDepositAmount(Math.ceil(total * 0.3)); // 30% deposit
    } else {
      setEstimatedCost(0);
      setDepositAmount(0);
    }
  }, [selectedServices, services]);

  // Auto-select services based on issues
  useEffect(() => {
    // Get services that should be selected based on current issues
    const suggestedServices = selectedIssues.map(issue => {
      const issueType = issueTypes.find(it => it.value === issue);
      if (issueType) {
        const matchingService = services.find(s => 
          s.category === issueType.serviceCategory
        );
        return matchingService?.id;
      }
      return null;
    }).filter(Boolean) as string[];
    
    // Only keep manually selected services and auto-suggested ones
    setSelectedServices(suggestedServices);
  }, [selectedIssues, services]);

  // Handle customer device selection
  useEffect(() => {
    if (selectedCustomerDeviceId && customerDevices.length > 0) {
      const device = customerDevices.find(d => d.id === selectedCustomerDeviceId);
      if (device) {
        setSerialNumber(device.serial_number || "");
        setImei(device.imei || "");
        setColor(device.color || "");
        setStorageSize(device.storage_size || "");
      }
    }
  }, [selectedCustomerDeviceId, customerDevices]);


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
    if (selectedIssues.length === 0) {
      newErrors.issues = "Please select at least one issue";
    }
    if (!priority) newErrors.priority = "Priority is required";

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
      const result = await createOrder({
        customer_id: isNewCustomer ? null : selectedCustomerId,
        new_customer: isNewCustomer ? newCustomer : null,
        device_id: selectedDeviceId || null,
        customer_device_id: selectedCustomerDeviceId || null,
        device_details: {
          serial_number: serialNumber,
          imei: imei,
          color: color,
          storage_size: storageSize
        },
        issue_types: selectedIssues,
        issue_description: issueDescription,
        priority: priority,
        assigned_to: assignedTo || null,
        selected_services: selectedServices,
        estimated_cost: estimatedCost,
        deposit_amount: depositAmount,
        internal_notes: internalNotes,
        estimated_completion: estimatedCompletion || null
      });

      if (result.success) {
        toast.success("Order created successfully!");
        router.push(`/orders/${result.data.id}`);
      } else {
        throw new Error(result.error || "Failed to create order");
      }
    } catch (error) {
      console.error("Error creating order:", error);
      toast.error("Failed to create order. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const headerActions = [
    {
      label: "Cancel",
      icon: <X className="h-4 w-4" />,
      variant: "destructive" as const,
      onClick: () => router.push('/orders'),
    },
    {
      label: isLoading ? "Creating..." : "Create Order",
      icon: isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />,
      variant: "success" as const,
      onClick: handleSubmit,
      disabled: isLoading,
    },
  ];

  return (
    <PageContainer
      title="New Repair Order"
      description="Create a new repair ticket for a customer"
      actions={headerActions}
    >
      <div className="grid gap-6">
        {/* First Row - Customer & Timing */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Customer Information */}
          <GlassCard>
          <GlassCardHeader>
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <GlassCardTitle>Customer Information</GlassCardTitle>
                  <GlassCardDescription>Select an existing customer or add new</GlassCardDescription>
                </div>
              </div>
            </div>
          </GlassCardHeader>
          <GlassCardContent>
            <Tabs defaultValue="new" onValueChange={(value) => {
              const isNew = value === "new";
              setIsNewCustomer(isNew);
              if (isNew) {
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

                <FormFieldWrapper
                  label="Street Address"
                  description="Customer's street address"
                >
                  <InputPremium
                    value={newCustomer.address}
                    onChange={(e) => setNewCustomer({...newCustomer, address: e.target.value})}
                    placeholder="123 Main Street"
                  />
                </FormFieldWrapper>

                <FormGrid columns={3}>
                  <FormFieldWrapper
                    label="City"
                  >
                    <InputPremium
                      value={newCustomer.city}
                      onChange={(e) => setNewCustomer({...newCustomer, city: e.target.value})}
                      placeholder="San Francisco"
                    />
                  </FormFieldWrapper>

                  <FormFieldWrapper
                    label="State"
                  >
                    <InputPremium
                      value={newCustomer.state}
                      onChange={(e) => setNewCustomer({...newCustomer, state: e.target.value})}
                      placeholder="CA"
                      maxLength={2}
                    />
                  </FormFieldWrapper>

                  <FormFieldWrapper
                    label="ZIP Code"
                  >
                    <InputPremium
                      value={newCustomer.zip_code}
                      onChange={(e) => setNewCustomer({...newCustomer, zip_code: e.target.value})}
                      placeholder="94102"
                    />
                  </FormFieldWrapper>
                </FormGrid>

                <FormFieldWrapper
                  label="Customer Notes"
                  description="Any special notes about this customer"
                >
                  <TextareaPremium
                    value={newCustomer.notes}
                    onChange={(e) => setNewCustomer({...newCustomer, notes: e.target.value})}
                    placeholder="Preferred contact method, special requirements, etc."
                    rows={2}
                  />
                </FormFieldWrapper>
              </TabsContent>
            </Tabs>
          </GlassCardContent>
        </GlassCard>

        {/* Timing & Financial */}
        <GlassCard>
          <GlassCardHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <GlassCardTitle>Timing & Financial</GlassCardTitle>
                <GlassCardDescription>Set deadlines and payment information</GlassCardDescription>
              </div>
            </div>
          </GlassCardHeader>
          <GlassCardContent className="space-y-4">
            <FormFieldWrapper
              label="Priority"
              required
              error={errors.priority}
              description="Set repair priority and timeline"
            >
              <SelectPremium
                value={priority}
                onChange={(val) => setPriority(val as string)}
                options={priorityOptions}
                placeholder="Select priority"
              />
            </FormFieldWrapper>

            <FormFieldWrapper
              label="Estimated Completion"
              description="When the repair should be completed"
            >
              <InputPremium
                type="date"
                value={estimatedCompletion}
                onChange={(e) => setEstimatedCompletion(e.target.value)}
                icon={<Calendar className="h-4 w-4" />}
                min={new Date().toISOString().split('T')[0]}
              />
            </FormFieldWrapper>

            <FormFieldWrapper
              label="Assign To"
              description="Select technician to handle repair"
            >
              <SelectPremium
                value={assignedTo}
                onChange={(val) => setAssignedTo(val as string)}
                options={technicianOptions}
                placeholder="Select technician"
                leftIcon={<User className="h-4 w-4" />}
              />
            </FormFieldWrapper>

            {/* Cost Information Alert */}
            <div className="flex items-start gap-2 p-2.5 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <Info className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
              <div className="text-xs text-blue-900 dark:text-blue-100">
                <span className="font-medium">Automatic Calculation</span>
                <span className="text-blue-700 dark:text-blue-300 ml-1">
                  • Costs below are automatically calculated based on selected services in the Repair Details section
                </span>
              </div>
            </div>

            <FormGrid columns={2}>
              <FormFieldWrapper
                label="Estimated Cost"
                description="Auto-calculated from services"
              >
                <InputPremium
                  type="number"
                  value={estimatedCost}
                  placeholder="0.00"
                  icon={<DollarSign className="h-4 w-4" />}
                  disabled
                  variant="default"
                />
              </FormFieldWrapper>

              <FormFieldWrapper
                label="Deposit Amount"
                description="30% of total cost"
              >
                <InputPremium
                  type="number"
                  value={depositAmount}
                  placeholder="0.00"
                  icon={<DollarSign className="h-4 w-4" />}
                  disabled
                  variant="default"
                />
              </FormFieldWrapper>
            </FormGrid>
          </GlassCardContent>
        </GlassCard>
        </div>

        {/* Device Information - Full Width */}
        <GlassCard>
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
            {selectedCustomerId && (customerDevices.length > 0 || !hasLoadedDevices) && (
              <FormFieldWrapper
                label="Customer's Devices"
                description="Select from customer's existing devices"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {!hasLoadedDevices && isMounted ? (
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
                          setSelectedDeviceId("");
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
                    />
                  </FormFieldWrapper>

                  <FormFieldWrapper
                    label="Storage Size"
                    description={selectedCustomerDeviceId ? "From saved device" : "Storage capacity"}
                  >
                    <InputPremium
                      value={storageSize}
                      onChange={(e) => !selectedCustomerDeviceId && setStorageSize(e.target.value)}
                      placeholder="e.g., 128GB, 256GB"
                      disabled={!!selectedCustomerDeviceId}
                    />
                  </FormFieldWrapper>
                </FormGrid>
              </>
            )}
          </GlassCardContent>
        </GlassCard>

        {/* Repair Details - Full Width */}
        <GlassCard>
          <GlassCardHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <Wrench className="h-5 w-5 text-primary" />
              </div>
              <div>
                <GlassCardTitle>Repair Details</GlassCardTitle>
                <GlassCardDescription>Describe the issues and select services</GlassCardDescription>
              </div>
            </div>
          </GlassCardHeader>
          <GlassCardContent className="space-y-6">
            <FormFieldWrapper
              label="Issue Types"
              required
              error={errors.issues}
              description="Select all that apply"
            >
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {issueTypes.map(issue => (
                  <div
                    key={issue.value}
                    onClick={() => {
                      setSelectedIssues(prev =>
                        prev.includes(issue.value)
                          ? prev.filter(i => i !== issue.value)
                          : [...prev, issue.value]
                      );
                    }}
                    className={cn(
                      "flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all",
                      selectedIssues.includes(issue.value)
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <span className="text-lg">{issue.icon}</span>
                    <span className="text-sm font-medium">{issue.label}</span>
                    {selectedIssues.includes(issue.value) && (
                      <CheckCircle className="h-4 w-4 text-primary ml-auto" />
                    )}
                  </div>
                ))}
              </div>
            </FormFieldWrapper>

            <FormFieldWrapper
              label="Issue Description"
              description="Provide detailed description of the problems"
            >
              <TextareaPremium
                value={issueDescription}
                onChange={(e) => setIssueDescription(e.target.value)}
                placeholder="Describe the issues in detail..."
                rows={4}
              />
            </FormFieldWrapper>


            <FormFieldWrapper
              label="Services"
              description="Services to be performed (auto-selected based on issues)"
            >
              <div className="space-y-2">
                {services
                  .filter(service => {
                    // Show selected services or services matching issue categories
                    return selectedServices.includes(service.id) || 
                           selectedIssues.some(issue => {
                             const issueType = issueTypes.find(it => it.value === issue);
                             return issueType?.serviceCategory === service.category;
                           });
                  })
                  .map(service => (
                    <div
                      key={service.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-900/50"
                    >
                      <div className="flex items-center gap-3">
                        <CheckboxPremium
                          checked={selectedServices.includes(service.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedServices(prev => [...prev, service.id]);
                            } else {
                              setSelectedServices(prev => prev.filter(s => s !== service.id));
                            }
                          }}
                        />
                        <div>
                          <div className="font-medium">{service.name}</div>
                          {service.description && (
                            <div className="text-sm text-muted-foreground">{service.description}</div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">${service.base_price?.toFixed(2) || '0.00'}</div>
                        {service.estimated_duration_minutes && (
                          <div className="text-xs text-muted-foreground">
                            ~{service.estimated_duration_minutes} min
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </FormFieldWrapper>


            <FormFieldWrapper
              label="Internal Notes"
              description="Notes for technicians (not visible to customers)"
            >
              <TextareaPremium
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
                placeholder="Add any internal notes..."
                rows={3}
              />
            </FormFieldWrapper>
          </GlassCardContent>
        </GlassCard>
      </div>
    </PageContainer>
  );
}