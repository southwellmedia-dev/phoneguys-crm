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
import { ArrowLeft, Save, Loader2 } from 'lucide-react';

// Edit order validation schema
const editOrderSchema = z.object({
  device_model_id: z.string().uuid().optional(),
  device_brand: z.string(),
  device_model: z.string(),
  serial_number: z.string().optional(),
  imei: z.string().optional(),
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

interface EditOrderClientProps {
  order: any;
  customers: any[];
  devices: any[];
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

export default function EditOrderClient({ order, customers = [], devices = [] }: EditOrderClientProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  
  // Prepare combobox options
  const customerOptions: ComboboxOption[] = customers.map(customer => ({
    value: customer.id,
    label: customer.name,
    sublabel: `${customer.email} • ${customer.phone}`
  }));
  
  const deviceOptions: ComboboxOption[] = devices.map(device => ({
    value: device.id,
    label: `${device.manufacturers?.name || 'Unknown'} ${device.model_name}`,
    sublabel: device.model_number || device.device_type || undefined
  }));
  
  // Initialize form with existing order data
  const form = useForm<EditOrderFormData>({
    resolver: zodResolver(editOrderSchema),
    defaultValues: {
      device_model_id: order.device_model_id || undefined,
      device_brand: order.device_brand,
      device_model: order.device_model,
      serial_number: order.serial_number || '',
      imei: order.imei || '',
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
          
          {/* Device Information */}
          <Card>
            <CardHeader>
              <CardTitle>Device Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="device_model_id"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Device Model</FormLabel>
                    <FormControl>
                      <Combobox
                        options={deviceOptions}
                        value={field.value}
                        onValueChange={(value) => {
                          field.onChange(value);
                          const device = devices.find(d => d.id === value);
                          if (device) {
                            form.setValue('device_brand', device.manufacturers.name);
                            form.setValue('device_model', device.model_name);
                          }
                        }}
                        placeholder="Select a device..."
                        searchPlaceholder="Search devices..."
                        emptyText="Device not found"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="serial_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Serial Number</FormLabel>
                      <FormControl>
                        <Input placeholder="Optional" {...field} />
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
                      <FormLabel>IMEI</FormLabel>
                      <FormControl>
                        <Input placeholder="Optional" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>
          
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
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
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