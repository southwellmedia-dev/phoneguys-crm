"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ChevronLeft, ChevronRight, Save, X, DollarSign, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { PageContainer } from "@/components/layout/page-container";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface Device {
  id: string;
  model_name: string;
  model_number?: string;
  device_type?: string;
  release_year?: number;
  specifications?: any;
  image_url?: string;
  parts_availability?: string;
  manufacturer: {
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
}

const issueTypes = [
  { value: "screen_crack", label: "Screen Crack", serviceCategory: "screen_repair" },
  { value: "battery_issue", label: "Battery Issue", serviceCategory: "battery_replacement" },
  { value: "charging_port", label: "Charging Port", serviceCategory: "charging_port" },
  { value: "water_damage", label: "Water Damage", serviceCategory: "water_damage" },
  { value: "software_issue", label: "Software Issue", serviceCategory: "software_issue" },
  { value: "speaker_issue", label: "Speaker Issue", serviceCategory: "speaker_repair" },
  { value: "camera_issue", label: "Camera Issue", serviceCategory: "camera_repair" },
  { value: "button_issue", label: "Button Issue", serviceCategory: "button_repair" },
  { value: "other", label: "Other", serviceCategory: "diagnostic" }
];

export function NewOrderClient({ customers, devices, services }: NewOrderClientProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [customerDevices, setCustomerDevices] = useState<any[]>([]);
  
  // Form state - simple useState instead of react-hook-form
  const [formData, setFormData] = useState({
    customerType: "existing",
    customer_id: "",
    new_customer: {
      name: "",
      email: "",
      phone: ""
    },
    device_selection: "new", // "new" or "existing"
    customer_device_id: "", // For existing customer device
    device_id: "",
    device_brand: "",
    device_model: "",
    serial_number: "",
    imei: "",
    device_color: "",
    device_storage: "",
    issue_types: [] as string[],
    issue_description: "",
    priority: "medium",
    selected_services: [] as string[],
    estimated_cost: 0,
    deposit_amount: 0,
    internal_notes: "",
    manual_cost_override: false // Track if user manually changed the cost
  });

  // Prepare combobox options
  const customerOptions: ComboboxOption[] = customers.map(customer => ({
    value: customer.id,
    label: customer.name,
    sublabel: `${customer.email} • ${customer.phone}`
  }));

  const deviceOptions: ComboboxOption[] = devices.map(device => ({
    value: device.id,
    label: `${device.manufacturer.name} ${device.model_name}`,
    sublabel: device.model_number || device.device_type || undefined
  }));
  
  const selectedDevice = formData.device_id ? 
    devices.find(d => d.id === formData.device_id) : undefined;

  // Handle issue type selection and auto-add/remove services
  const toggleIssueType = (issueType: string) => {
    const newIssueTypes = formData.issue_types.includes(issueType)
      ? formData.issue_types.filter(t => t !== issueType)
      : [...formData.issue_types, issueType];
    
    let newSelectedServices = [...formData.selected_services];
    
    const issue = issueTypes.find(i => i.value === issueType);
    if (issue) {
      const relatedService = services.find(s => s.category === issue.serviceCategory);
      
      if (formData.issue_types.includes(issueType)) {
        // Removing the issue type - remove the corresponding service
        if (relatedService) {
          newSelectedServices = newSelectedServices.filter(id => id !== relatedService.id);
        }
      } else {
        // Adding the issue type - add the corresponding service
        if (relatedService && !newSelectedServices.includes(relatedService.id)) {
          newSelectedServices.push(relatedService.id);
        }
      }
    }
    
    // Calculate new total if user hasn't manually overridden the cost
    let newEstimatedCost = formData.estimated_cost;
    if (!formData.manual_cost_override) {
      newEstimatedCost = services
        .filter(s => newSelectedServices.includes(s.id))
        .reduce((sum, s) => sum + (s.base_price || 0), 0);
    }
    
    setFormData(prev => ({
      ...prev,
      issue_types: newIssueTypes,
      selected_services: newSelectedServices,
      estimated_cost: newEstimatedCost
    }));
  };

  const toggleService = (serviceId: string) => {
    const newSelectedServices = formData.selected_services.includes(serviceId)
      ? formData.selected_services.filter(id => id !== serviceId)
      : [...formData.selected_services, serviceId];
    
    // Calculate new total if user hasn't manually overridden the cost
    let newEstimatedCost = formData.estimated_cost;
    if (!formData.manual_cost_override) {
      newEstimatedCost = services
        .filter(s => newSelectedServices.includes(s.id))
        .reduce((sum, s) => sum + (s.base_price || 0), 0);
    }
    
    setFormData(prev => ({
      ...prev,
      selected_services: newSelectedServices,
      estimated_cost: newEstimatedCost
    }));
  };

  // Load customer devices when a customer is selected
  useEffect(() => {
    if (formData.customer_id && formData.customerType === "existing") {
      const loadCustomerDevices = async () => {
        try {
          const response = await fetch(`/api/customers/${formData.customer_id}/devices`);
          if (response.ok) {
            const result = await response.json();
            setCustomerDevices(result.data || []);
          } else {
            console.error("Failed to load customer devices");
            setCustomerDevices([]);
          }
        } catch (error) {
          console.error("Failed to load customer devices:", error);
          setCustomerDevices([]);
        }
      };
      loadCustomerDevices();
    } else {
      setCustomerDevices([]);
    }
  }, [formData.customer_id, formData.customerType]);

  async function handleSubmit() {
    setIsLoading(true);
    try {
      // Create customer if needed
      let customerId = formData.customer_id;
      
      if (formData.customerType === "new") {
        const customerResponse = await fetch("/api/customers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData.new_customer),
        });
        
        if (!customerResponse.ok) {
          const errorData = await customerResponse.json();
          throw new Error(errorData.error || "Failed to create customer");
        }
        
        const customerData = await customerResponse.json();
        customerId = customerData.data.id;
      }

      // Create customer device if it's a new device or if no existing device was selected
      let customerDeviceId = formData.customer_device_id;
      
      // Always create a customer device entry when:
      // 1. It's a new device selection, OR
      // 2. No customer device was selected (even for existing customers)
      if (customerId && formData.device_id && !customerDeviceId) {
        // First check if customer already has this exact device
        const existingDevicesResponse = await fetch(`/api/customers/${customerId}/devices`);
        let shouldCreateDevice = true;
        
        if (existingDevicesResponse.ok) {
          const existingDevices = await existingDevicesResponse.json();
          // Check if device already exists with same serial/IMEI
          const matchingDevice = existingDevices.data?.find((d: any) => 
            d.device_id === formData.device_id &&
            ((formData.serial_number && d.serial_number === formData.serial_number) ||
             (formData.imei && d.imei === formData.imei) ||
             (!formData.serial_number && !formData.imei && !d.serial_number && !d.imei))
          );
          
          if (matchingDevice) {
            customerDeviceId = matchingDevice.id;
            shouldCreateDevice = false;
          }
        }
        
        // Create new device entry if no match found
        if (shouldCreateDevice) {
          const deviceResponse = await fetch(`/api/customers/${customerId}/devices`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              device_id: formData.device_id,
              serial_number: formData.serial_number || null,
              imei: formData.imei || null,
            }),
          });
          
          if (deviceResponse.ok) {
            const deviceResult = await deviceResponse.json();
            customerDeviceId = deviceResult.data?.id;
            toast.success("Device added to customer profile");
          }
        }
      }

      // Calculate estimated cost
      const servicesTotal = services
        .filter(s => formData.selected_services.includes(s.id))
        .reduce((sum, s) => sum + (s.base_price || 0), 0);
        
      // Create repair ticket
      const ticketData = {
        customer_id: customerId,
        customer_device_id: customerDeviceId || null,
        device_id: formData.device_id || null,
        device_brand: formData.device_brand || selectedDevice?.manufacturer.name,
        device_model: formData.device_model || selectedDevice?.model_name,
        serial_number: formData.serial_number || null,
        imei: formData.imei || null,
        issue_type: formData.issue_types,
        issue_description: formData.issue_description,
        priority: formData.priority,
        estimated_cost: formData.estimated_cost || servicesTotal || 0,
        deposit_amount: formData.deposit_amount || 0,
        internal_notes: formData.internal_notes || null,
        status: "new",
        selected_services: formData.selected_services,
      };

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ticketData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || error.message || "Failed to create order");
      }

      const result = await response.json();
      toast.success(`Order ${result.data.ticket_number} created successfully`);
      router.push(`/orders/${result.data.id}`);
    } catch (error) {
      console.error("Error creating order:", error);
      toast.error(error instanceof Error ? error.message : "Failed to create order");
    } finally {
      setIsLoading(false);
    }
  }

  const isStepValid = () => {
    switch(step) {
      case 1: // Customer step
        if (formData.customerType === "existing") {
          return !!formData.customer_id;
        } else {
          return !!(formData.new_customer.name && 
                   formData.new_customer.email && 
                   formData.new_customer.phone);
        }
      case 2: // Device step
        if (formData.device_selection === "existing" && customerDevices.length > 0) {
          return !!formData.customer_device_id;
        } else {
          return !!formData.device_id;
        }
      case 3: // Repair details & services step
        return formData.issue_types.length > 0 && 
               formData.issue_description.length >= 10;
      case 4: // Cost & Notes step
        return true;
      default:
        return false;
    }
  };

  const stepTitles = [
    "Customer Information",
    "Device Information",
    "Repair Details & Services",
    "Cost & Notes"
  ];

  const headerActions = [
    ...(step > 1 ? [{
      label: "Previous Step",
      icon: <ChevronLeft className="h-4 w-4" />,
      variant: "outline" as const,
      onClick: () => setStep(step - 1),
    }] : []),
    {
      label: "Cancel",
      icon: <X className="h-4 w-4" />,
      variant: "destructive" as const,
      onClick: () => router.push('/orders'),
    },
    ...(step < 4 ? [{
      label: "Next Step",
      icon: <ChevronRight className="h-4 w-4" />,
      variant: "default" as const,
      onClick: () => setStep(step + 1),
      disabled: !isStepValid(),
    }] : [{
      label: isLoading ? "Creating..." : "Create Ticket",
      icon: isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />,
      variant: "default" as const,
      onClick: handleSubmit,
      disabled: isLoading,
    }]),
  ];

  return (
    <PageContainer
      title="Create New Ticket"
      description={`Step ${step} of 4: ${stepTitles[step - 1]}`}
      actions={headerActions}
    >
      {/* Progress indicator */}
      <div className="flex gap-2 mb-8">
        {[1, 2, 3, 4].map((s) => (
          <div
            key={s}
            className={`flex-1 h-2 rounded-full transition-colors ${
              s <= step ? "bg-primary" : "bg-muted"
            }`}
          />
        ))}
      </div>

      {/* Step 1: Customer Selection */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
            <CardDescription>
              Select an existing customer or create a new one
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex gap-4">
                <Button
                  type="button"
                  variant={formData.customerType === "existing" ? "default" : "outline"}
                  onClick={() => setFormData(prev => ({ ...prev, customerType: "existing" }))}
                  className="flex-1"
                >
                  Select Existing Customer
                </Button>
                <Button
                  type="button"
                  variant={formData.customerType === "new" ? "default" : "outline"}
                  onClick={() => setFormData(prev => ({ ...prev, customerType: "new" }))}
                  className="flex-1"
                >
                  Create New Customer
                </Button>
              </div>
            </div>

            {formData.customerType === "existing" ? (
              <div className="space-y-2">
                <Label htmlFor="customer">Customer</Label>
                <Combobox
                  options={customerOptions}
                  value={formData.customer_id}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, customer_id: value }))}
                  placeholder="Select a customer..."
                  searchPlaceholder="Type to search by name, email, or phone..."
                  emptyText="No customers found."
                />
                <p className="text-sm text-muted-foreground">
                  Click to browse or search existing customers
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={formData.new_customer.name}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      new_customer: { ...prev.new_customer, name: e.target.value }
                    }))}
                    placeholder="John Doe"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.new_customer.email}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      new_customer: { ...prev.new_customer, email: e.target.value }
                    }))}
                    placeholder="john@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.new_customer.phone}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      new_customer: { ...prev.new_customer, phone: e.target.value }
                    }))}
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 2: Device Information */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Device Information</CardTitle>
            <CardDescription>
              {customerDevices.length > 0 
                ? "Select from customer's existing devices or add a new one"
                : "Select the device for repair"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Device Selection Type - Show only if customer has existing devices */}
            {customerDevices.length > 0 && (
              <div className="space-y-4">
                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant={formData.device_selection === "existing" ? "default" : "outline"}
                    onClick={() => setFormData(prev => ({ ...prev, device_selection: "existing" }))}
                    className="flex-1"
                  >
                    Use Existing Device
                  </Button>
                  <Button
                    type="button"
                    variant={formData.device_selection === "new" ? "default" : "outline"}
                    onClick={() => setFormData(prev => ({ ...prev, device_selection: "new" }))}
                    className="flex-1"
                  >
                    Add New Device
                  </Button>
                </div>
              </div>
            )}

            {/* Show customer's existing devices */}
            {formData.device_selection === "existing" && customerDevices.length > 0 && (
              <div className="space-y-4">
                <Label>Select Customer Device</Label>
                <RadioGroup
                  value={formData.customer_device_id}
                  onValueChange={(value) => {
                    const customerDevice = customerDevices.find(cd => cd.id === value);
                    if (customerDevice) {
                      setFormData(prev => ({
                        ...prev,
                        customer_device_id: value,
                        device_id: customerDevice.device?.id || "",
                        device_brand: customerDevice.device?.manufacturer?.name || "",
                        device_model: customerDevice.device?.model_name || "",
                        serial_number: customerDevice.serial_number || "",
                        imei: customerDevice.imei || ""
                      }));
                    }
                  }}
                >
                  {customerDevices.map((customerDevice) => (
                    <div key={customerDevice.id} className="flex items-center space-x-2 border rounded-lg p-3 hover:bg-muted/50">
                      <RadioGroupItem value={customerDevice.id} id={customerDevice.id} />
                      <Label
                        htmlFor={customerDevice.id}
                        className="flex-1 cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          {customerDevice.device?.image_url && (
                            <img
                              src={customerDevice.device.image_url}
                              alt={customerDevice.device.model_name}
                              className="w-12 h-12 object-cover rounded"
                            />
                          )}
                          <div>
                            <p className="font-medium">
                              {customerDevice.device?.manufacturer?.name} {customerDevice.device?.model_name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {customerDevice.serial_number && `Serial: ${customerDevice.serial_number}`}
                              {customerDevice.serial_number && customerDevice.imei && " • "}
                              {customerDevice.imei && `IMEI: ${customerDevice.imei}`}
                            </p>
                            {customerDevice.purchase_date && (
                              <p className="text-sm text-muted-foreground">
                                Purchased: {new Date(customerDevice.purchase_date).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            )}

            {/* Show device selection for new devices */}
            {(formData.device_selection === "new" || customerDevices.length === 0) && (
              <div className="space-y-2">
                <Label htmlFor="device">Device</Label>
                <Combobox
                  options={deviceOptions}
                  value={formData.device_id}
                  onValueChange={(value) => {
                    const device = devices.find(d => d.id === value);
                    setFormData(prev => ({
                      ...prev,
                      device_id: value,
                      device_brand: device?.manufacturer.name || "",
                      device_model: device?.model_name || "",
                      customer_device_id: "" // Clear customer device selection
                    }));
                  }}
                  placeholder="Search for a device..."
                  searchPlaceholder="Type brand or model to search..."
                  emptyText="Device not found. You can still enter it manually."
                />
                <p className="text-sm text-muted-foreground">
                  Select from our device database or enter manually if not found
                </p>
              </div>
            )}
            
            {selectedDevice && (
              <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg space-y-2">
                <div className="flex items-start gap-4">
                  {selectedDevice.image_url && (
                    <img 
                      src={selectedDevice.image_url} 
                      alt={selectedDevice.model_name}
                      className="w-16 h-16 object-cover rounded"
                    />
                  )}
                  <div className="flex-1">
                    <p className="font-medium">{selectedDevice.manufacturer.name} {selectedDevice.model_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedDevice.release_year && `Released: ${selectedDevice.release_year}`}
                      {selectedDevice.device_type && ` • ${selectedDevice.device_type}`}
                    </p>
                    {selectedDevice.parts_availability && (
                      <p className="text-sm text-muted-foreground">
                        Parts: {selectedDevice.parts_availability.replace('_', ' ')}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="serial">Serial Number (Optional)</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      // Generate fake serial number for testing
                      const fakeSerial = `SN${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
                      setFormData(prev => ({ ...prev, serial_number: fakeSerial }));
                      toast.success("Test serial number generated");
                    }}
                    className="text-xs h-auto py-1 px-2"
                  >
                    Generate Test
                  </Button>
                </div>
                <Input
                  id="serial"
                  value={formData.serial_number}
                  onChange={(e) => setFormData(prev => ({ ...prev, serial_number: e.target.value }))}
                  placeholder="Serial number"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="imei">IMEI (Optional)</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      // Generate fake IMEI for testing (15 digits)
                      const fakeImei = Array.from({length: 15}, () => Math.floor(Math.random() * 10)).join('');
                      setFormData(prev => ({ ...prev, imei: fakeImei }));
                      toast.success("Test IMEI generated");
                    }}
                    className="text-xs h-auto py-1 px-2"
                  >
                    Generate Test
                  </Button>
                </div>
                <Input
                  id="imei"
                  value={formData.imei}
                  onChange={(e) => setFormData(prev => ({ ...prev, imei: e.target.value }))}
                  placeholder="IMEI number"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Repair Details & Services */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Repair Details & Services</CardTitle>
            <CardDescription>
              Describe the issues and select repair services
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Issue Types */}
            <div className="space-y-4">
              <div>
                <Label className="text-base">What issues is the device experiencing?</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Select all that apply - this will automatically suggest relevant repair services
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {issueTypes.map((issue) => (
                  <div
                    key={issue.value}
                    className={`flex items-start space-x-3 space-y-0 rounded-lg border p-4 cursor-pointer transition-colors ${
                      formData.issue_types.includes(issue.value)
                        ? 'bg-primary/5 border-primary'
                        : 'hover:bg-muted/50'
                    }`}
                    onClick={() => toggleIssueType(issue.value)}
                  >
                    <Checkbox
                      checked={formData.issue_types.includes(issue.value)}
                      onCheckedChange={() => toggleIssueType(issue.value)}
                    />
                    <Label className="font-normal cursor-pointer">
                      {issue.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Description and Priority */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="description">Detailed Description</Label>
                <Textarea
                  id="description"
                  value={formData.issue_description}
                  onChange={(e) => setFormData(prev => ({ ...prev, issue_description: e.target.value }))}
                  placeholder="Please describe the issues in detail, including when they started, any damage visible, and any troubleshooting already attempted..."
                  className="min-h-[120px]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <select
                  id="priority"
                  value={formData.priority}
                  onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
                <p className="text-sm text-muted-foreground">Urgency of repair</p>
              </div>
            </div>

            {/* Services Section */}
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-2">Recommended Services</h4>
                <p className="text-xs text-muted-foreground mb-3">
                  Based on the issues selected, these services are recommended. You can add or remove services as needed.
                </p>
              </div>

              {/* Selected Services */}
              {formData.selected_services.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Selected Services:</p>
                  <div className="space-y-2">
                    {services
                      .filter(s => formData.selected_services.includes(s.id))
                      .map(service => (
                        <div key={service.id} className="flex items-center justify-between p-3 bg-primary/5 rounded-lg border border-primary/20">
                          <div className="flex-1">
                            <p className="font-medium text-sm">{service.name}</p>
                            {service.category && (
                              <p className="text-xs text-muted-foreground">
                                Category: {service.category.replace('_', ' ')}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-3">
                            {service.base_price && (
                              <span className="text-sm font-medium">
                                ${service.base_price.toFixed(2)}
                              </span>
                            )}
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleService(service.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Browse All Services */}
              <details className="group">
                <summary className="cursor-pointer text-sm font-medium flex items-center gap-2">
                  <ChevronRight className="h-4 w-4 group-open:rotate-90 transition-transform" />
                  Browse all available services
                </summary>
                <div className="mt-4 space-y-4">
                  {Object.entries(
                    services.reduce((acc, service) => {
                      const category = service.category || 'other';
                      if (!acc[category]) acc[category] = [];
                      acc[category].push(service);
                      return acc;
                    }, {} as Record<string, Service[]>)
                  ).map(([category, categoryServices]) => (
                    <div key={category} className="space-y-2">
                      <h5 className="text-xs font-medium uppercase text-muted-foreground">
                        {category.replace(/_/g, ' ')}
                      </h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {categoryServices.map(service => (
                          <div
                            key={service.id}
                            className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                              formData.selected_services.includes(service.id)
                                ? 'bg-primary/10 border-primary'
                                : 'hover:bg-muted/50'
                            }`}
                            onClick={() => toggleService(service.id)}
                          >
                            <div className="flex items-start gap-3">
                              <Checkbox
                                checked={formData.selected_services.includes(service.id)}
                                onCheckedChange={() => toggleService(service.id)}
                                className="mt-0.5"
                                onClick={(e) => e.stopPropagation()}
                              />
                              <div className="flex-1">
                                <p className="font-medium text-sm">{service.name}</p>
                                {service.description && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {service.description}
                                  </p>
                                )}
                                <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                                  {service.base_price && (
                                    <span className="flex items-center gap-1">
                                      <DollarSign className="h-3 w-3" />
                                      ${service.base_price.toFixed(2)}
                                    </span>
                                  )}
                                  {service.estimated_duration_minutes && (
                                    <span className="flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {service.estimated_duration_minutes}m
                                    </span>
                                  )}
                                  {service.requires_parts && (
                                    <Badge variant="outline" className="text-xs">
                                      Parts Required
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </details>

              {/* Show total estimate */}
              {formData.selected_services.length > 0 && (
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <p className="text-sm font-medium">
                    Services Total: $
                    {services
                      .filter(s => formData.selected_services.includes(s.id))
                      .reduce((sum, s) => sum + (s.base_price || 0), 0)
                      .toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formData.selected_services.length} service(s) selected
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Cost & Notes */}
      {step === 4 && (
        <Card>
          <CardHeader>
            <CardTitle>Cost & Notes</CardTitle>
            <CardDescription>
              Set pricing and add any internal notes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="estimated-cost">Estimated Cost</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="estimated-cost"
                    type="number"
                    step="0.01"
                    value={formData.estimated_cost}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      estimated_cost: parseFloat(e.target.value) || 0,
                      manual_cost_override: true // User manually changed the cost
                    }))}
                    className="pl-9"
                    placeholder="0.00"
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Estimated repair cost
                  {formData.manual_cost_override && formData.selected_services.length > 0 && (
                    <Button
                      type="button"
                      variant="link"
                      size="sm"
                      className="ml-2 h-auto p-0 text-xs"
                      onClick={() => {
                        const calculatedCost = services
                          .filter(s => formData.selected_services.includes(s.id))
                          .reduce((sum, s) => sum + (s.base_price || 0), 0);
                        setFormData(prev => ({
                          ...prev,
                          estimated_cost: calculatedCost,
                          manual_cost_override: false
                        }));
                      }}
                    >
                      (Reset to ${services
                        .filter(s => formData.selected_services.includes(s.id))
                        .reduce((sum, s) => sum + (s.base_price || 0), 0)
                        .toFixed(2)})
                    </Button>
                  )}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="deposit">Deposit Amount</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="deposit"
                    type="number"
                    step="0.01"
                    value={formData.deposit_amount}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      deposit_amount: parseFloat(e.target.value) || 0 
                    }))}
                    className="pl-9"
                    placeholder="0.00"
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Amount to collect upfront
                </p>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes">Internal Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={formData.internal_notes}
                onChange={(e) => setFormData(prev => ({ ...prev, internal_notes: e.target.value }))}
                placeholder="Add any notes for staff about this repair, special instructions, customer preferences, etc..."
                className="min-h-[120px]"
              />
              <p className="text-sm text-muted-foreground">
                These notes are only visible to staff members
              </p>
            </div>

            {/* Order Summary */}
            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">Order Summary</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Customer:</span>
                  <span>{formData.customerType === "existing" 
                    ? customers.find(c => c.id === formData.customer_id)?.name || "Not selected"
                    : formData.new_customer.name || "Not provided"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Device:</span>
                  <span>{selectedDevice ? `${selectedDevice.manufacturer.name} ${selectedDevice.model_name}` : "Not selected"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Issues:</span>
                  <span>{formData.issue_types.length} selected</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Services:</span>
                  <span>{formData.selected_services.length} selected</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Priority:</span>
                  <Badge variant={formData.priority === "urgent" ? "destructive" : formData.priority === "high" ? "default" : "secondary"}>
                    {formData.priority}
                  </Badge>
                </div>
                <div className="border-t pt-2 mt-2 font-medium">
                  <div className="flex justify-between">
                    <span>Estimated Total:</span>
                    <span>${(formData.estimated_cost || services
                      .filter(s => formData.selected_services.includes(s.id))
                      .reduce((sum, s) => sum + (s.base_price || 0), 0)).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </PageContainer>
  );
}