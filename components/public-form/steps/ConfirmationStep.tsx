"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Smartphone,
  Calendar,
  Clock,
  User,
  Mail,
  Phone,
  MapPin,
  Wrench,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Bell,
  MessageSquare
} from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface ConfirmationStepProps {
  formData: any;
  devices: any[];
  services: any[];
  onConsentChange?: (consent: { email: boolean; sms: boolean }) => void;
}

export function ConfirmationStep({ formData, devices, services, onConsentChange }: ConfirmationStepProps) {
  const [emailConsent, setEmailConsent] = useState(true); // Default to checked
  const [smsConsent, setSmsConsent] = useState(true); // Default to checked
  
  // Find device details
  const device = devices.find(d => d.id === formData.device?.deviceId);
  
  // Find selected services
  const selectedServices = services.filter(s => formData.issues?.includes(s.id));
  
  // Handle consent changes
  const handleEmailConsentChange = (checked: boolean) => {
    setEmailConsent(checked);
    onConsentChange?.({ email: checked, sms: smsConsent });
  };
  
  const handleSmsConsentChange = (checked: boolean) => {
    setSmsConsent(checked);
    onConsentChange?.({ email: emailConsent, sms: checked });
  };
  
  // Calculate estimated cost
  const calculateEstimatedCost = () => {
    const hasQuoteRequired = selectedServices.some(s => s.requiresQuote);
    if (hasQuoteRequired) return 'Quote Required';
    
    const total = selectedServices.reduce((sum, s) => sum + (s.price || 0), 0);
    if (total === 0) return 'Free Diagnostic';
    
    return `$${total.toFixed(2)}`;
  };
  
  // Calculate estimated duration
  const calculateEstimatedDuration = () => {
    const totalMinutes = selectedServices.reduce((sum, s) => sum + (s.estimatedDuration || 30), 0);
    
    if (totalMinutes < 60) return `${totalMinutes} minutes`;
    
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    return minutes === 0 
      ? `${hours} hour${hours > 1 ? 's' : ''}`
      : `${hours} hour${hours > 1 ? 's' : ''} ${minutes} min`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Review Your Appointment</h2>
        <p className="text-gray-600">Please review your information before submitting</p>
      </div>

      {/* Device Information */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Device Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600">Device:</span>
            <span className="font-medium">{formData.device?.fullName || 'Not specified'}</span>
          </div>
          {formData.device?.serialNumber && (
            <div className="flex justify-between">
              <span className="text-gray-600">Serial Number:</span>
              <span className="font-mono text-sm">{formData.device.serialNumber}</span>
            </div>
          )}
          {formData.device?.color && (
            <div className="flex justify-between">
              <span className="text-gray-600">Color:</span>
              <span>{formData.device.color}</span>
            </div>
          )}
          {formData.device?.storageSize && (
            <div className="flex justify-between">
              <span className="text-gray-600">Storage:</span>
              <span>{formData.device.storageSize}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Issues/Services */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            Selected Services
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {selectedServices.map((service, index) => (
              <div key={service.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>{service.name}</span>
                </div>
                {service.price && !service.requiresQuote && (
                  <Badge variant="secondary">${service.price.toFixed(2)}</Badge>
                )}
                {service.requiresQuote && (
                  <Badge variant="outline">Quote</Badge>
                )}
              </div>
            ))}
          </div>
          
          {formData.issueDescription && (
            <>
              <Separator className="my-3" />
              <div>
                <p className="text-sm text-gray-600 mb-1">Additional Details:</p>
                <p className="text-sm">{formData.issueDescription}</p>
              </div>
            </>
          )}
          
          <Separator className="my-3" />
          
          <div className="flex justify-between items-center">
            <div>
              <p className="font-semibold">Estimated Total:</p>
              <p className="text-sm text-gray-600">Duration: {calculateEstimatedDuration()}</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold">{calculateEstimatedCost()}</p>
              <p className="text-xs text-gray-600">Plus tax</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Appointment Schedule */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Appointment Schedule
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Calendar className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <p className="font-medium">
                {formData.appointmentDate && format(parseISO(formData.appointmentDate), 'EEEE, MMMM d, yyyy')}
              </p>
              <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                <Clock className="h-3 w-3" />
                {formData.appointmentTime}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="h-5 w-5" />
            Contact Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <User className="h-4 w-4 text-gray-500" />
            <span>{formData.customer?.name}</span>
          </div>
          <div className="flex items-center gap-3">
            <Mail className="h-4 w-4 text-gray-500" />
            <span>{formData.customer?.email}</span>
          </div>
          <div className="flex items-center gap-3">
            <Phone className="h-4 w-4 text-gray-500" />
            <span>{formData.customer?.phone}</span>
          </div>
          {formData.customer?.address && (
            <div className="flex items-start gap-3">
              <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
              <span>{formData.customer?.address}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            Stay updated about your appointment and repair status.
          </p>
          
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <Checkbox 
                id="email-consent" 
                checked={emailConsent}
                onCheckedChange={handleEmailConsentChange}
                className="mt-0.5"
              />
              <div className="grid gap-1.5 leading-none">
                <Label
                  htmlFor="email-consent"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2"
                >
                  <Mail className="h-4 w-4" />
                  Email Notifications
                </Label>
                <p className="text-sm text-muted-foreground">
                  Receive appointment confirmations and repair status updates via email
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <Checkbox 
                id="sms-consent" 
                checked={smsConsent}
                onCheckedChange={handleSmsConsentChange}
                className="mt-0.5"
              />
              <div className="grid gap-1.5 leading-none">
                <Label
                  htmlFor="sms-consent"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2"
                >
                  <MessageSquare className="h-4 w-4" />
                  SMS Notifications
                </Label>
                <p className="text-sm text-muted-foreground">
                  Get text message alerts when your device is ready for pickup
                </p>
              </div>
            </div>
          </div>
          
          <div className="text-xs text-gray-500 pt-2 border-t">
            By opting in, you consent to receive automated messages at the phone number and email provided. 
            Message and data rates may apply. You can opt-out at any time by replying STOP to SMS messages 
            or clicking unsubscribe in emails.
          </div>
        </CardContent>
      </Card>

      {/* Important Notice */}
      <Card className="bg-amber-50 border-amber-200">
        <CardContent className="p-4">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800">
              <p className="font-semibold mb-1">Before Your Visit</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Please backup your device data if possible</li>
                <li>Remove any passwords or screen locks</li>
                <li>Bring your device charger if available</li>
                <li>Arrive 5 minutes early for check-in</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Message */}
      <Card className="bg-green-50 border-green-200">
        <CardContent className="p-4">
          <div className="flex gap-3">
            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
            <div className="text-sm text-green-800">
              <p className="font-semibold mb-1">Ready to Submit</p>
              <p>
                By submitting this appointment, you'll receive a confirmation email with your 
                appointment details and directions to our location.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}