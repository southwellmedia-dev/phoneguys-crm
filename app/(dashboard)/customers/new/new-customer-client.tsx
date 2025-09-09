'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { customerFormSchema, CustomerFormData } from '@/lib/validations/forms';
import { PageContainer } from '@/components/layout/page-container';
import { ButtonPremium } from '@/components/premium/ui/buttons/button-premium';
import { InputPremium } from '@/components/premium/ui/forms/input-premium';
import { TextareaPremium } from '@/components/premium/ui/forms/textarea-premium';
import { FormFieldWrapper, FormSection, FormGrid } from '@/components/premium/ui/forms/form-field-wrapper';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from 'sonner';
import { Save, X, Loader2, User, Mail, Phone, MapPin, FileText } from 'lucide-react';

export default function NewCustomerClient() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  
  const form = useForm<CustomerFormData>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      zip_code: '',
      notes: '',
    },
  });
  
  async function onSubmit(values: CustomerFormData) {
    setIsLoading(true);
    try {
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create customer');
      }
      
      const data = await response.json();
      
      toast.success("Customer created successfully");
      
      // Redirect to customer details page
      router.push(`/customers/${data.data.id}`);
    } catch (error) {
      console.error('Error creating customer:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create customer');
    } finally {
      setIsLoading(false);
    }
  }
  
  const headerActions = [
    {
      label: "Cancel",
      icon: <X className="h-4 w-4" />,
      variant: "destructive" as const,
      onClick: () => router.push('/customers'),
    },
    {
      label: isLoading ? "Creating..." : "Create Customer",
      icon: isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />,
      variant: "success" as const,
      onClick: form.handleSubmit(onSubmit),
      disabled: isLoading,
    }
  ];
  
  return (
    <PageContainer
      title="Add New Customer"
      description="Create a new customer profile"
      actions={headerActions}
    >
      <Form {...form}>
        <div className="space-y-6">
          {/* Basic Information */}
          <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b border-border/50">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Basic Information</CardTitle>
              </div>
              <CardDescription>
                Enter the customer's contact details
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <FormSection separator={false}>
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field, fieldState }) => (
                    <FormFieldWrapper
                      label="Full Name"
                      required
                      error={fieldState.error?.message}
                    >
                      <InputPremium 
                        placeholder="John Doe" 
                        icon={<User className="h-4 w-4" />}
                        variant={fieldState.error ? "error" : "default"}
                        {...field} 
                      />
                    </FormFieldWrapper>
                  )}
                />
                
                <FormGrid columns={2}>
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field, fieldState }) => (
                      <FormFieldWrapper
                        label="Email Address"
                        required
                        error={fieldState.error?.message}
                      >
                        <InputPremium 
                          type="email" 
                          placeholder="john@example.com"
                          icon={<Mail className="h-4 w-4" />}
                          variant={fieldState.error ? "error" : "default"}
                          {...field} 
                        />
                      </FormFieldWrapper>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field, fieldState }) => (
                      <FormFieldWrapper
                        label="Phone Number"
                        required
                        error={fieldState.error?.message}
                      >
                        <InputPremium 
                          placeholder="(555) 123-4567"
                          icon={<Phone className="h-4 w-4" />}
                          variant={fieldState.error ? "error" : "default"}
                          {...field} 
                        />
                      </FormFieldWrapper>
                    )}
                  />
                </FormGrid>
              </FormSection>
            </CardContent>
          </Card>
          
          {/* Address Information */}
          <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b border-border/50">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Address Information</CardTitle>
              </div>
              <CardDescription>
                Optional address details for the customer
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <FormSection separator={false}>
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field, fieldState }) => (
                    <FormFieldWrapper
                      label="Street Address"
                      error={fieldState.error?.message}
                      description="Customer's physical address"
                    >
                      <InputPremium 
                        placeholder="123 Main St" 
                        icon={<MapPin className="h-4 w-4" />}
                        variant={fieldState.error ? "error" : "default"}
                        {...field} 
                      />
                    </FormFieldWrapper>
                  )}
                />
                
                <FormGrid columns={3}>
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field, fieldState }) => (
                      <FormFieldWrapper
                        label="City"
                        error={fieldState.error?.message}
                      >
                        <InputPremium 
                          placeholder="New York" 
                          variant={fieldState.error ? "error" : "default"}
                          {...field} 
                        />
                      </FormFieldWrapper>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="state"
                    render={({ field, fieldState }) => (
                      <FormFieldWrapper
                        label="State"
                        error={fieldState.error?.message}
                      >
                        <InputPremium 
                          placeholder="NY" 
                          variant={fieldState.error ? "error" : "default"}
                          {...field} 
                        />
                      </FormFieldWrapper>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="zip_code"
                    render={({ field, fieldState }) => (
                      <FormFieldWrapper
                        label="ZIP Code"
                        error={fieldState.error?.message}
                      >
                        <InputPremium 
                          placeholder="10001" 
                          variant={fieldState.error ? "error" : "default"}
                          {...field} 
                        />
                      </FormFieldWrapper>
                    )}
                  />
                </FormGrid>
              </FormSection>
            </CardContent>
          </Card>
          
          {/* Additional Notes */}
          <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b border-border/50">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Additional Information</CardTitle>
              </div>
              <CardDescription>
                Any additional notes about the customer
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <FormField
                control={form.control}
                name="notes"
                render={({ field, fieldState }) => (
                  <FormFieldWrapper
                    label="Internal Notes"
                    description="These notes are for internal use only and won't be visible to the customer"
                    error={fieldState.error?.message}
                  >
                    <TextareaPremium 
                      placeholder="Customer preferences, special requirements, important information..."
                      rows={4}
                      variant={fieldState.error ? "error" : "default"}
                      {...field} 
                    />
                  </FormFieldWrapper>
                )}
              />
            </CardContent>
          </Card>
        </div>
      </Form>
    </PageContainer>
  );
}