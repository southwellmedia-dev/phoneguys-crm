'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageContainer } from '@/components/layout/page-container';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Combobox, ComboboxOption } from '@/components/ui/combobox';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ArrowLeft, Save, Loader2, DollarSign, Clock } from 'lucide-react';
import { DeviceSelector } from '@/components/appointments/device-selector';
import { Badge } from '@/components/ui/badge';

// Edit order validation schema
const editOrderSchema = z.object({
  device_id: z.string().uuid().optional(),
  device_brand: z.string(),
  device_model: z.string(),
  serial_number: z.string().optional(),
  imei: z.string().optional(),
  color: z.string().optional(),
  storage_size: z.string().optional(),
  condition: z.string().optional(),
  repair_issues: z.array(z.string()).min(1, "Select at least one issue"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  status: z.enum(['new', 'in_progress', 'on_hold', 'completed', 'cancelled']),
  estimated_cost: z.number().min(0).optional(),
  actual_cost: z.number().min(0).optional(),
  deposit_amount: z.number().min(0).optional(),
  estimated_completion: z.string().optional(),
});

type EditOrderFormData = z.infer<typeof editOrderSchema>;

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

interface CustomerDevice {
  id: string;
  device_id: string;
  serial_number?: string;
  imei?: string;
  color?: string;
  storage_size?: string;
  condition?: string;
  nickname?: string;
  device?: Device;
}

interface EditOrderClientProps {
  order: any;
  customers: any[];
  devices: Device[];
  services: Service[];
  customerDevices?: CustomerDevice[];
}

const issueTypes = [
  { value: "screen_crack", label: "Screen Crack" },
  { value: "battery_issue", label: "Battery Issue" },
  { value: "charging_port", label: "Charging Port" },
  { value: "water_damage", label: "Water Damage" },
  { value: "software_issue", label: "Software Issue" },
  { value: "speaker_issue", label: "Speaker Issue" },
  { value: "microphone_issue", label: "Microphone Issue" },
  { value: "camera_issue", label: "Camera Issue" },
  { value: "button_issue", label: "Button Issue" },
  { value: "other", label: "Other" },
];

export default function EditOrderClient({ order, customers = [], devices = [], services = [], customerDevices = [] }: EditOrderClientProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  
  // Check if the order is locked for editing
  const isCompleted = order.status === 'completed';
  const isCancelled = order.status === 'cancelled';
  
  // Prepare combobox options
  const customerOptions: ComboboxOption[] = customers.map(customer => ({
    value: customer.id,
    label: customer.name,
    sublabel: `${customer.email} • ${customer.phone}`
  }));
  
  const deviceOptions: ComboboxOption[] = devices.map(device => ({
    value: device.id,
    label: `${device.manufacturer?.name || 'Unknown'} ${device.model_name}`,
    sublabel: device.model_number || device.device_type || undefined
  }));
  
  // State for selected device and services
  const [selectedDevice, setSelectedDevice] = useState<Device | undefined>(
    order.device_id ? devices.find(d => d.id === order.device_id) : undefined
  );
  const [selectedServices, setSelectedServices] = useState<string[]>(
    order.ticket_services?.map((ts: any) => ts.service_id) || []
  );
  
  // Device selector state
  const [selectedDeviceId, setSelectedDeviceId] = useState(order.device_id || '');
  const [selectedCustomerDeviceId, setSelectedCustomerDeviceId] = useState(order.customer_device_id || '');
  const [serialNumber, setSerialNumber] = useState(order.serial_number || '');
  const [imei, setImei] = useState(order.imei || '');
  const [color, setColor] = useState(order.color || '');
  const [storageSize, setStorageSize] = useState(order.storage_size || '');
  const [condition, setCondition] = useState(order.condition || 'good');
  
  // Initialize form with existing order data
  const form = useForm<EditOrderFormData>({
    resolver: zodResolver(editOrderSchema),
    defaultValues: {
      device_id: order.device_id || order.device_model_id || undefined,
      device_brand: order.device_brand || order.device?.manufacturer?.name || '',
      device_model: order.device_model || order.device?.model_name || '',
      serial_number: order.serial_number || '',
      imei: order.imei || '',
      color: order.color || '',
      storage_size: order.storage_size || '',
      condition: order.condition || 'good',
      repair_issues: order.repair_issues || [],
      description: order.description || '',
      priority: order.priority,
      status: order.status,
      estimated_cost: order.estimated_cost || 0,
      actual_cost: order.actual_cost || 0,
      deposit_amount: order.deposit_amount || 0,
      estimated_completion: order.estimated_completion ? 
        new Date(order.estimated_completion).toISOString().slice(0, 16) : '',
    }
  });
  
  async function onSubmit(values: EditOrderFormData) {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/orders/${order.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...values,
          device_id: selectedDeviceId,
          serial_number: serialNumber,
          imei: imei,
          color: color,
          storage_size: storageSize,
          condition: condition,
          customer_device_id: selectedCustomerDeviceId || null,
          selected_services: selectedServices, // Include selected services
          estimated_completion: values.estimated_completion ? 
            new Date(values.estimated_completion).toISOString() : null
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update order');
      }
      
      toast.success("Order updated successfully");
      
      router.push(`/orders/${order.id}`);
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update order');
    } finally {
      setIsLoading(false);
    }
  }
  
  // Show warning if viewing a completed ticket
  const CompletedWarning = () => {
    if (!isCompleted && !isCancelled) return null;
    
    return (
      <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
        <div className="flex items-center gap-2">
          <span className="text-amber-600 dark:text-amber-400 font-semibold">
            ⚠️ Limited Editing Mode
          </span>
          <Badge variant={isCompleted ? 'default' : 'secondary'}>
            {order.status}
          </Badge>
        </div>
        <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
          {isCompleted 
            ? "This ticket is completed. Only notes and administrative fields can be edited."
            : "This ticket is cancelled. Only notes can be edited."}
        </p>
      </div>
    );
  };
  
  const headerActions = [
    {
      label: "Back to Order",
      icon: <ArrowLeft className="h-4 w-4" />,
      variant: "outline" as const,
      onClick: () => router.push(`/orders/${order.id}`),
    },
    {
      label: isLoading ? "Saving..." : "Save Changes",
      icon: isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />,
      variant: "default" as const,
      onClick: () => {
        console.log("Save button clicked");
        console.log("Form valid:", form.formState.isValid);
        console.log("Form errors:", form.formState.errors);
        console.log("Form values:", form.getValues());
        form.handleSubmit(onSubmit, (errors) => {
          console.log("Validation errors:", errors);
        })();
      },
      disabled: isLoading,
      className: "bg-green-600 hover:bg-green-700 text-white",
    }
  ];
  
  return (
    <PageContainer
      title={`Edit Order #${order.ticket_number}`}
      description="Update order details and status"
      actions={headerActions}
    >
      <CompletedWarning />
      <Form {...form}>
        <div className="space-y-6">
          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle>Customer Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium">{order.customers?.name || "Unknown Customer"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{order.customers?.email || "No email"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{order.customers?.phone || "No phone"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Customer ID</p>
                  <p className="font-medium text-xs text-muted-foreground">{order.customer_id}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Device Information - Using DeviceSelector */}
          <DeviceSelector
            devices={devices}
            selectedDeviceId={selectedDeviceId}
            onDeviceChange={(deviceId) => {
              setSelectedDeviceId(deviceId);
              const device = devices.find(d => d.id === deviceId);
              if (device) {
                form.setValue('device_brand', device.manufacturer.name);
                form.setValue('device_model', device.model_name);
              }
            }}
            customerDevices={customerDevices}
            selectedCustomerDeviceId={selectedCustomerDeviceId}
            onCustomerDeviceChange={setSelectedCustomerDeviceId}
            serialNumber={serialNumber}
            onSerialNumberChange={setSerialNumber}
            imei={imei}
            onImeiChange={setImei}
            color={color}
            onColorChange={setColor}
            storageSize={storageSize}
            onStorageSizeChange={setStorageSize}
            condition={condition}
            onConditionChange={setCondition}
            isEditing={true}
            testMode={false}
          />
          
          {/* Repair Details */}
          <Card>
            <CardHeader>
              <CardTitle>Repair Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="repair_issues"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Issues</FormLabel>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {issueTypes.map(issue => (
                        <div key={issue.value} className="flex items-center space-x-2">
                          <Checkbox
                            id={issue.value}
                            checked={field.value?.includes(issue.value)}
                            onCheckedChange={(checked) => {
                              const updated = checked
                                ? [...(field.value || []), issue.value]
                                : (field.value || []).filter(v => v !== issue.value);
                              field.onChange(updated);
                            }}
                          />
                          <label
                            htmlFor={issue.value}
                            className="text-sm font-medium leading-none cursor-pointer"
                          >
                            {issue.label}
                          </label>
                        </div>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Detailed description of the issues..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Priority</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isCompleted || isCancelled}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="new">New</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="on_hold">On Hold</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>
          
          {/* Service Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Service Selection</CardTitle>
              <CardDescription>
                Select the repair services needed for this device
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Select one or more services to perform on this device.
              </p>
              
              {/* Group services by category */}
              {Object.entries(
                services.reduce((acc, service) => {
                  const category = service.category || 'other';
                  if (!acc[category]) acc[category] = [];
                  acc[category].push(service);
                  return acc;
                }, {} as Record<string, Service[]>)
              ).map(([category, categoryServices]) => (
                <div key={category} className="space-y-2">
                  <h4 className="font-medium capitalize">
                    {category.replace(/_/g, ' ')}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {categoryServices.map(service => (
                      <div 
                        key={service.id}
                        className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                          selectedServices.includes(service.id) 
                            ? 'bg-primary/10 border-primary' 
                            : 'hover:bg-muted/50'
                        }`}
                        onClick={(e) => {
                          // Prevent editing if completed or cancelled
                          if (isCompleted || isCancelled) return;
                          // Prevent triggering if clicking on checkbox itself
                          if ((e.target as HTMLElement).closest('button[role="checkbox"]')) {
                            return;
                          }
                          setSelectedServices(prev => 
                            prev.includes(service.id)
                              ? prev.filter(id => id !== service.id)
                              : [...prev, service.id]
                          );
                        }}
                      >
                        <div className="flex items-start gap-3">
                          <Checkbox 
                            checked={selectedServices.includes(service.id)}
                            disabled={isCompleted || isCancelled}
                            onCheckedChange={(checked) => {
                              if (isCompleted || isCancelled) return;
                              setSelectedServices(prev => 
                                checked
                                  ? [...prev, service.id]
                                  : prev.filter(id => id !== service.id)
                              );
                            }}
                            className="mt-0.5"
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
              
              {/* Show total estimate */}
              {selectedServices.length > 0 && (
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <p className="text-sm font-medium">
                    Services Total: $
                    {services
                      .filter(s => selectedServices.includes(s.id))
                      .reduce((sum, s) => sum + (s.base_price || 0), 0)
                      .toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {selectedServices.length} service(s) selected
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Cost & Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Cost & Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                          disabled={isCompleted || isCancelled}
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
                  name="actual_cost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Actual Cost ($)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01"
                          disabled={isCompleted || isCancelled}
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
                          disabled={isCompleted || isCancelled}
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
                name="estimated_completion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estimated Completion</FormLabel>
                    <FormControl>
                      <Input 
                        type="datetime-local"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      When the repair is expected to be completed
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        </div>
      </Form>
    </PageContainer>
  );
}