"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Calendar, Clock, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createAppointment, fetchCustomerDevices } from "./actions";
import { DeviceSelector } from "@/components/appointments/device-selector";

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
}

const issueTypes = [
  { value: "screen_crack", label: "Screen Crack" },
  { value: "battery_issue", label: "Battery Issue" },
  { value: "charging_port", label: "Charging Port" },
  { value: "water_damage", label: "Water Damage" },
  { value: "software_issue", label: "Software Issue" },
  { value: "speaker_issue", label: "Speaker Issue" },
  { value: "camera_issue", label: "Camera Issue" },
  { value: "button_issue", label: "Button Issue" },
  { value: "other", label: "Other" }
];

export function NewAppointmentClient({ customers, devices }: NewAppointmentClientProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  
  // Form state
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    email: "",
    phone: ""
  });
  const [isNewCustomer, setIsNewCustomer] = useState(false);
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

  // Prepare customer options for combobox
  const customerOptions: ComboboxOption[] = customers.map(c => ({
    value: c.id,
    label: `${c.name} - ${c.email}`,
    secondaryLabel: c.phone
  }));

  // Fetch customer devices when customer is selected
  useEffect(() => {
    async function loadCustomerDevices() {
      if (selectedCustomerId && !isNewCustomer) {
        setLoadingDevices(true);
        console.log('Fetching devices for customer:', selectedCustomerId);
        const result = await fetchCustomerDevices(selectedCustomerId);
        console.log('Customer devices result:', result);
        if (result.success) {
          setCustomerDevices(result.devices || []);
        } else {
          console.error('Failed to fetch devices:', result.error);
        }
        setLoadingDevices(false);
      } else {
        setCustomerDevices([]);
        setSelectedCustomerDeviceId("");
      }
    }
    
    loadCustomerDevices();
  }, [selectedCustomerId, isNewCustomer]);
  
  // Reset device info when switching to new customer
  useEffect(() => {
    if (isNewCustomer) {
      setCustomerDevices([]);
      setSelectedCustomerDeviceId("");
      setSelectedDeviceId("");
      setSerialNumber("");
      setImei("");
      setColor("");
      setStorageSize("");
      setCondition("good");
    }
  }, [isNewCustomer]);

  const handleSubmit = async () => {
    // Validation
    if (!scheduledDate || !scheduledTime) {
      toast.error("Please select date and time");
      return;
    }

    if (!isNewCustomer && !selectedCustomerId) {
      toast.error("Please select a customer or enter new customer details");
      return;
    }

    if (isNewCustomer && (!newCustomer.name || !newCustomer.email)) {
      toast.error("Please enter customer name and email");
      return;
    }

    setIsLoading(true);
    try {
      const appointmentData = {
        customer: isNewCustomer ? newCustomer : { id: selectedCustomerId },
        device_id: selectedDeviceId || undefined,
        customer_device_id: selectedCustomerDeviceId || undefined,
        device_details: {
          serial_number: serialNumber || undefined,
          imei: imei || undefined,
          color: color || undefined,
          storage_size: storageSize || undefined,
          condition: condition || 'good'
        },
        scheduled_date: scheduledDate,
        scheduled_time: scheduledTime,
        duration_minutes: parseInt(duration),
        issues: selectedIssues.length > 0 ? selectedIssues : undefined,
        description: description || undefined,
        notes: notes || undefined,
        urgency,
        source: 'walk-in' as const
      };

      const result = await createAppointment(appointmentData);
      
      if (result.success) {
        toast.success(`Appointment ${result.appointmentNumber} created successfully`);
        router.push(`/appointments/${result.appointmentId}`);
      } else {
        toast.error(result.error || "Failed to create appointment");
      }
    } catch (error) {
      toast.error("Failed to create appointment");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const headerActions = [
    {
      label: "Cancel",
      icon: <ArrowLeft className="h-4 w-4" />,
      variant: "outline" as const,
      onClick: () => router.push('/appointments'),
    },
    {
      label: isLoading ? "Creating..." : "Create Appointment",
      icon: isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />,
      variant: "default" as const,
      onClick: handleSubmit,
      disabled: isLoading,
    },
  ];

  // Get tomorrow's date as minimum
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  return (
    <PageContainer
      title="Schedule Appointment"
      description="Create a new customer appointment"
      actions={headerActions}
    >
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Customer Information */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
            <CardDescription>Select an existing customer or add new</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2 mb-4">
              <Checkbox
                id="new-customer"
                checked={isNewCustomer}
                onCheckedChange={(checked) => setIsNewCustomer(checked as boolean)}
              />
              <Label htmlFor="new-customer">New Customer</Label>
            </div>

            {!isNewCustomer ? (
              <div className="space-y-2">
                <Label>Select Customer</Label>
                <Combobox
                  options={customerOptions}
                  value={selectedCustomerId}
                  onValueChange={setSelectedCustomerId}
                  placeholder="Search customers..."
                  searchPlaceholder="Type to search..."
                  emptyText="No customers found"
                />
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={newCustomer.name}
                    onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})}
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newCustomer.email}
                    onChange={(e) => setNewCustomer({...newCustomer, email: e.target.value})}
                    placeholder="john@example.com"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={newCustomer.phone}
                    onChange={(e) => setNewCustomer({...newCustomer, phone: e.target.value})}
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Appointment Details */}
        <Card>
          <CardHeader>
            <CardTitle>Appointment Details</CardTitle>
            <CardDescription>Set date, time and duration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="date">Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  min={minDate}
                />
              </div>
              <div>
                <Label htmlFor="time">Time *</Label>
                <Input
                  id="time"
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Select value={duration} onValueChange={setDuration}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="45">45 minutes</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                    <SelectItem value="90">1.5 hours</SelectItem>
                    <SelectItem value="120">2 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="urgency">Priority</Label>
                <Select value={urgency} onValueChange={(v) => setUrgency(v as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="walk-in">Walk-in</SelectItem>
                    <SelectItem value="emergency">Emergency</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Device Selection using DeviceSelector */}
        {loadingDevices ? (
          <Card>
            <CardContent className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span>Loading customer devices...</span>
            </CardContent>
          </Card>
        ) : (
          <DeviceSelector
            devices={devices}
            selectedDeviceId={selectedDeviceId}
            onDeviceChange={setSelectedDeviceId}
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
            testMode={true}
          />
        )}

        {/* Issues Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Reported Issues</CardTitle>
            <CardDescription>Select all issues reported by the customer</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {issueTypes.map(issue => (
                <div key={issue.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={issue.value}
                    checked={selectedIssues.includes(issue.value)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedIssues([...selectedIssues, issue.value]);
                      } else {
                        setSelectedIssues(selectedIssues.filter(i => i !== issue.value));
                      }
                    }}
                  />
                  <Label htmlFor={issue.value} className="text-sm font-normal">
                    {issue.label}
                  </Label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
            <CardDescription>Any special notes or requirements</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="description">Problem Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the issues in detail..."
                rows={3}
              />
            </div>
            
            <div>
              <Label htmlFor="notes">Internal Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any special instructions or notes..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}