"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2, ChevronLeft, ChevronRight, Save, X, DollarSign, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { PageContainer } from "@/components/layout/page-container";
import { toast } from "sonner";
import { 
  repairTicketFormSchema, 
  type RepairTicketFormData,
  deviceBrands,
  issueTypes,
  priorityLevels,
  formatIssueType,
  formatPriority
} from "@/lib/validations/forms";

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

// Mapping between issue types and service categories
const issueToServiceMapping: Record<string, string> = {
  'screen_crack': 'screen_repair',
  'battery_issue': 'battery_replacement',
  'charging_port': 'charging_port',
  'water_damage': 'water_damage',
  'software_issue': 'software_issue',
  'speaker_issue': 'speaker_repair',
  'camera_issue': 'camera_repair',
  'button_issue': 'button_repair',
  'other': 'diagnostic'
};

export function NewOrderClient({ customers, devices, services }: NewOrderClientProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [customerType, setCustomerType] = useState<"existing" | "new">("existing");

  const form = useForm<RepairTicketFormData>({
    resolver: zodResolver(repairTicketFormSchema),
    defaultValues: {
      priority: "medium",
      issue_type: [],
      estimated_cost: 0,
      deposit_amount: 0,
    },
  });

  // Prepare customers for combobox
  const customerOptions: ComboboxOption[] = customers.map(customer => ({
    value: customer.id,
    label: customer.name,
    sublabel: `${customer.email} • ${customer.phone}`
  }));

  // Prepare devices for combobox
  const deviceOptions: ComboboxOption[] = devices.map(device => ({
    value: device.id,
    label: `${device.manufacturer.name} ${device.model_name}`,
    sublabel: device.model_number || device.device_type || undefined
  }));
  
  // State for selected device
  const [selectedDevice, setSelectedDevice] = useState<Device | undefined>();
  // State for selected services
  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  async function onSubmit(values: RepairTicketFormData) {
    console.log("Form submission started with values:", values);
    setIsLoading(true);
    try {
      // If new customer, create customer first
      let customerId = values.customer_id;
      
      if (customerType === "new" && values.new_customer) {
        console.log("Creating new customer:", values.new_customer);
        const customerResponse = await fetch("/api/customers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values.new_customer),
        });
        
        if (!customerResponse.ok) {
          const errorData = await customerResponse.json();
          console.error("Customer creation failed:", errorData);
          throw new Error(errorData.error || "Failed to create customer");
        }
        
        const customerData = await customerResponse.json();
        customerId = customerData.data.id;
        console.log("Customer created with ID:", customerId);
      }

      // Calculate estimated cost from selected services if not manually entered
      const servicesTotal = services
        .filter(s => selectedServices.includes(s.id))
        .reduce((sum, s) => sum + (s.base_price || 0), 0);
        
      // Create repair ticket
      const ticketData = {
        customer_id: customerId,
        device_id: values.device_model_id || null, // Now using device_id instead of device_model_id
        device_brand: values.device_brand || selectedDevice?.manufacturer.name,
        device_model: values.device_model || selectedDevice?.model_name,
        serial_number: values.serial_number || null,
        imei: values.imei || null,
        issue_type: values.issue_type,
        issue_description: values.issue_description,
        priority: values.priority,
        estimated_cost: values.estimated_cost || servicesTotal || 0,
        deposit_amount: values.deposit_amount || 0,
        internal_notes: values.internal_notes || null,
        status: "new" as const,
        selected_services: selectedServices, // Include selected services
      };

      console.log("Sending ticket data:", ticketData);
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ticketData),
      });

      console.log("Response status:", response.status);

      if (!response.ok) {
        const error = await response.json();
        console.error("Order creation failed:", error);
        throw new Error(error.error || error.message || "Failed to create order");
      }

      const result = await response.json();
      console.log("Order created successfully:", result);
      
      toast.success(`Order ${result.data.ticket_number} created successfully`);
      
      router.push(`/orders/${result.data.id}`);
    } catch (error) {
      console.error("Error creating order:", error);
      toast.error(error instanceof Error ? error.message : "Failed to create order");
    } finally {
      setIsLoading(false);
    }
  }

  const totalSteps = 4;

  const nextStep = () => {
    if (step < totalSteps) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  // Validation for enabling/disabling Next button
  const isStepValid = () => {
    const values = form.getValues();
    
    switch(step) {
      case 1: // Customer step
        if (customerType === "existing") {
          return !!values.customer_id;
        } else {
          return !!(values.new_customer?.name && 
                   values.new_customer?.email && 
                   values.new_customer?.phone);
        }
      case 2: // Device step
        return !!values.device_model_id;
      case 3: // Repair details & services step
        return !!(values.issue_type && values.issue_type.length > 0 && 
                 values.issue_description && values.issue_description.length >= 10);
      case 4: // Cost & Notes step - always valid
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

  // Header actions based on current step
  const headerActions = [
    ...(step > 1 ? [{
      label: "Previous Step",
      icon: <ChevronLeft className="h-4 w-4" />,
      variant: "outline" as const,
      onClick: prevStep,
    }] : []),
    {
      label: "Cancel",
      icon: <X className="h-4 w-4" />,
      variant: "destructive" as const,
      onClick: () => router.push('/orders'),
    },
    ...(step < totalSteps ? [{
      label: "Next Step",
      icon: <ChevronRight className="h-4 w-4" />,
      variant: isStepValid() ? "success" as const : "outline" as const,
      onClick: nextStep,
      disabled: !isStepValid(),
    }] : [{
      label: isLoading ? "Creating..." : "Create Order",
      icon: isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />,
      variant: "success" as const,
      onClick: () => {
        console.log("Create Order button clicked");
        console.log("Form state valid:", form.formState.isValid);
        console.log("Form errors:", form.formState.errors);
        console.log("Form values:", form.getValues());
        console.log("Form dirty fields:", form.formState.dirtyFields);
        console.log("Form touched fields:", form.formState.touchedFields);
        
        // Manually trigger validation and log results
        form.trigger().then((isValid) => {
          console.log("Manual validation result:", isValid);
          console.log("Errors after manual validation:", form.formState.errors);
          console.log("Customer ID value:", form.getValues('customer_id'));
          console.log("New customer value:", form.getValues('new_customer'));
          console.log("Customer type:", customerType);
          
          // Log the actual error message
          if (form.formState.errors.customer_id) {
            console.log("Customer ID error message:", form.formState.errors.customer_id.message);
            console.log("Customer ID error type:", form.formState.errors.customer_id.type);
          }
          
          if (isValid) {
            form.handleSubmit(onSubmit)();
          } else {
            // Try to force submit anyway if we have a customer_id
            if (form.getValues('customer_id')) {
              console.log("Forcing submit with customer_id");
              // Clear the error and submit
              form.clearErrors('customer_id');
              onSubmit(form.getValues());
            }
          }
        });
      },
      disabled: isLoading,
      className: "bg-green-600 hover:bg-green-700 text-white",
    }]),
  ];

  return (
    <PageContainer
      title="Create New Order"
      description={`Step ${step} of ${totalSteps}: ${stepTitles[step - 1]}`}
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

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
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
                <RadioGroup value={customerType} onValueChange={(value: "existing" | "new") => {
                  setCustomerType(value);
                  // Clear the other field when switching
                  if (value === "existing") {
                    form.setValue('new_customer', undefined);
                  } else {
                    form.setValue('customer_id', undefined);
                  }
                }}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="existing" id="existing" />
                    <Label htmlFor="existing" className="font-medium cursor-pointer">
                      Select Existing Customer
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="new" id="new" />
                    <Label htmlFor="new" className="font-medium cursor-pointer">
                      Create New Customer
                    </Label>
                  </div>
                </RadioGroup>

                {customerType === "existing" ? (
                  <FormField
                    control={form.control}
                    name="customer_id"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Customer</FormLabel>
                        <FormControl>
                          <Combobox
                            options={customerOptions}
                            value={field.value}
                            onValueChange={field.onChange}
                            placeholder="Select a customer..."
                            searchPlaceholder="Type to search by name, email, or phone..."
                            emptyText="No customers found. Try a different search."
                          />
                        </FormControl>
                        <FormDescription>
                          Click to browse or search existing customers
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ) : (
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="new_customer.name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name</FormLabel>
                          <FormControl>
                            <Input placeholder="John Doe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="new_customer.email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="john@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="new_customer.phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone</FormLabel>
                          <FormControl>
                            <Input placeholder="(555) 123-4567" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
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
                  Select the device for repair or add a new one
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="device_model_id"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Device</FormLabel>
                      <FormControl>
                        <Combobox
                          options={deviceOptions}
                          value={field.value}
                          onValueChange={(value) => {
                            field.onChange(value);
                            const device = devices.find(d => d.id === value);
                            setSelectedDevice(device);
                            if (device) {
                              // Auto-populate brand and model fields for backwards compatibility
                              form.setValue('device_brand', device.manufacturer.name as any);
                              form.setValue('device_model', device.model_name);
                            }
                          }}
                          placeholder="Search for a device..."
                          searchPlaceholder="Type brand or model to search..."
                          emptyText="Device not found. You can still enter it manually below."
                        />
                      </FormControl>
                      <FormDescription>
                        Select from our device database or enter manually if not found
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Show selected device info */}
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
                  <FormField
                    control={form.control}
                    name="serial_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Serial Number (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Serial number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="imei"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>IMEI (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="IMEI number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
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
                  Describe the issues and select or confirm the repair services needed
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Repair Issues Selection */}
                <FormField
                  control={form.control}
                  name="issue_type"
                  render={() => (
                    <FormItem>
                      <div className="mb-4">
                        <FormLabel className="text-base">What issues is the device experiencing?</FormLabel>
                        <FormDescription>
                          Select all that apply - this will automatically suggest relevant repair services
                        </FormDescription>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        {issueTypes.map((type) => (
                          <FormField
                            key={type}
                            control={form.control}
                            name="issue_type"
                            render={({ field }) => {
                              return (
                                <FormItem
                                  key={type}
                                  className="flex flex-row items-start space-x-3 space-y-0"
                                >
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(type)}
                                      onCheckedChange={(checked) => {
                                        const newIssues = checked
                                          ? [...field.value, type]
                                          : field.value?.filter((value) => value !== type);
                                        field.onChange(newIssues);
                                        
                                        // Auto-select corresponding service
                                        if (checked && issueToServiceMapping[type]) {
                                          const relatedService = services.find(s => 
                                            s.category === issueToServiceMapping[type]
                                          );
                                          if (relatedService && !selectedServices.includes(relatedService.id)) {
                                            setSelectedServices(prev => [...prev, relatedService.id]);
                                          }
                                        }
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="font-normal cursor-pointer">
                                    {formatIssueType(type)}
                                  </FormLabel>
                                </FormItem>
                              );
                            }}
                          />
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Issue Description and Priority */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="issue_description"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Detailed Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Please describe the issues in detail, including when they started, any damage visible, and any troubleshooting already attempted..."
                            className="min-h-[120px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Priority</FormLabel>
                        <FormControl>
                          <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            {...field}
                          >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            <option value="urgent">Urgent</option>
                          </select>
                        </FormControl>
                        <FormDescription>
                          Urgency of repair
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Services Section - Auto-selected and Manual */}
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium mb-2">Recommended Services</h4>
                    <p className="text-xs text-muted-foreground mb-3">
                      Based on the issues selected, these services are recommended. You can add or remove services as needed.
                    </p>
                  </div>

                  {/* Selected Services */}
                  {selectedServices.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Selected Services:</p>
                      <div className="space-y-2">
                        {services
                          .filter(s => selectedServices.includes(s.id))
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
                                  onClick={() => setSelectedServices(prev => prev.filter(id => id !== service.id))}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Add Additional Services */}
                  <div className="border-t pt-4">
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
                            <div className="grid grid-cols-1 gap-2">
                              {categoryServices.map(service => (
                                <div 
                                  key={service.id}
                                  className={`border rounded p-2 transition-colors text-sm ${
                                    selectedServices.includes(service.id) 
                                      ? 'bg-primary/10 border-primary' 
                                      : 'hover:bg-muted/50'
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <label className="flex items-center gap-2 cursor-pointer flex-1">
                                      <Checkbox 
                                        checked={selectedServices.includes(service.id)}
                                        onCheckedChange={(checked) => {
                                          setSelectedServices(prev => 
                                            checked
                                              ? [...prev, service.id]
                                              : prev.filter(id => id !== service.id)
                                          );
                                        }}
                                      />
                                      <span>{service.name}</span>
                                    </label>
                                    {service.base_price && (
                                      <span className="text-muted-foreground">
                                        ${service.base_price.toFixed(2)}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </details>
                  </div>

                  {/* Total Estimate */}
                  {selectedServices.length > 0 && (
                    <div className="mt-4 p-4 bg-muted rounded-lg">
                      <div className="flex justify-between items-center">
                        <p className="text-sm font-medium">Services Total:</p>
                        <p className="text-lg font-semibold">
                          ${services
                            .filter(s => selectedServices.includes(s.id))
                            .reduce((sum, s) => sum + (s.base_price || 0), 0)
                            .toFixed(2)}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {selectedServices.length} service(s) selected
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
                <CardTitle>Cost Estimation & Notes</CardTitle>
                <CardDescription>
                  Add cost estimates and any internal notes
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="estimated_cost"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estimated Cost ($)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="deposit_amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Deposit Amount ($)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="internal_notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Internal Notes (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Add any internal notes about this repair..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        These notes will only be visible to staff members
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          )}
        </form>
      </Form>
    </PageContainer>
  );
}