"use client";

import { useState, useEffect } from 'react';
import { DeviceStep } from './steps/DeviceStep';
import { IssuesStep } from './steps/IssuesStep';
import { ScheduleStep } from './steps/ScheduleStep';
import { ContactStep } from './steps/ContactStep';
import { ConfirmationStep } from './steps/ConfirmationStep';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePrefetchAvailability } from '@/lib/hooks/use-availability';

export interface FormData {
  // Device info
  device: {
    deviceId: string;
    name: string;
    manufacturer: string;
    serialNumber?: string;
    imei?: string;
    color?: string;
    storageSize?: string;
    condition?: string;
  };
  
  // Issues
  issues: string[];
  issueDescription?: string;
  
  // Schedule
  appointmentDate: string;
  appointmentTime: string;
  duration: number;
  
  // Contact
  customer: {
    name: string;
    email: string;
    phone: string;
    address?: string;
  };
  
  // Consent
  consent: {
    email: boolean;
    sms: boolean;
    consent_given_at?: string;
    ip_address?: string;
  };
  
  // Metadata
  source: 'website';
  sourceUrl?: string;
  notes?: string;
}

interface FormContainerProps {
  apiKey?: string;
  apiBaseUrl?: string;
  onSuccess?: (appointmentData: any) => void;
  onError?: (error: any) => void;
  embedded?: boolean;
  className?: string;
}

const STEPS = [
  { id: 1, name: 'Device', description: 'Select your device' },
  { id: 2, name: 'Issues', description: 'Describe the problems' },
  { id: 3, name: 'Schedule', description: 'Pick date & time' },
  { id: 4, name: 'Contact', description: 'Your information' },
  { id: 5, name: 'Confirm', description: 'Review & submit' }
];

export function FormContainer({
  apiKey,
  apiBaseUrl = '/api/public',
  onSuccess,
  onError,
  embedded = false,
  className
}: FormContainerProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<Partial<FormData>>({
    source: 'website',
    sourceUrl: typeof window !== 'undefined' ? window.location.href : undefined,
    duration: 30,
    consent: {
      email: true,
      sms: true
    }
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [devices, setDevices] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [loadingDevices, setLoadingDevices] = useState(true);
  const [loadingServices, setLoadingServices] = useState(true);
  
  // Prefetch availability data when user reaches step 2
  const { prefetchAvailability } = usePrefetchAvailability(apiBaseUrl, apiKey);

  // Load devices and services on mount
  useEffect(() => {
    fetchDevices();
    fetchServices();
  }, []);

  // Prefetch availability when user is on step 2 (Issues)
  useEffect(() => {
    if (currentStep === 2) {
      // Start prefetching availability data in the background
      prefetchAvailability().catch(console.error);
    }
  }, [currentStep, prefetchAvailability]);

  const fetchDevices = async () => {
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      };
      if (apiKey) {
        headers['x-api-key'] = apiKey;
      }
      const response = await fetch(`${apiBaseUrl}/devices`, { headers });
      const data = await response.json();
      if (data.success) {
        setDevices(data.data.devices || []);
      }
    } catch (error) {
      console.error('Failed to fetch devices:', error);
    } finally {
      setLoadingDevices(false);
    }
  };

  const fetchServices = async () => {
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      };
      if (apiKey) {
        headers['x-api-key'] = apiKey;
      }
      const response = await fetch(`${apiBaseUrl}/services`, { headers });
      const data = await response.json();
      if (data.success) {
        setServices(data.data.services || []);
      }
    } catch (error) {
      console.error('Failed to fetch services:', error);
    } finally {
      setLoadingServices(false);
    }
  };

  const updateFormData = (data: Partial<FormData>) => {
    setFormData(prev => ({ ...prev, ...data }));
  };

  const canProceed = (): boolean => {
    switch (currentStep) {
      case 1:
        return !!formData.device?.deviceId;
      case 2:
        return (formData.issues?.length || 0) > 0;
      case 3:
        return !!formData.appointmentDate && !!formData.appointmentTime;
      case 4:
        return !!(
          formData.customer?.name &&
          formData.customer?.email &&
          formData.customer?.phone
        );
      case 5:
        return true; // Can always submit from confirmation
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (canProceed() && currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!canProceed()) return;

    setIsSubmitting(true);
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      };
      if (apiKey) {
        headers['x-api-key'] = apiKey;
      }
      
      const response = await fetch(`${apiBaseUrl}/appointments`, {
        method: 'POST',
        headers,
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (result.success) {
        // Update formData with the appointment number from the response
        setFormData(prev => ({
          ...prev,
          appointmentNumber: result.data.appointmentNumber
        }));
        onSuccess?.(result.data);
        // Show success message and reset form
        setCurrentStep(STEPS.length + 1); // Show success state
      } else {
        throw new Error(result.message || result.error || 'Failed to submit appointment');
      }
    } catch (error) {
      console.error('Submission error:', error);
      onError?.(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const progress = (currentStep / STEPS.length) * 100;

  // Success state
  if (currentStep > STEPS.length) {
    return (
      <div className="text-center py-12">
        <div className="mb-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
        <h2 className="text-2xl font-bold mb-2">Appointment Scheduled!</h2>
        <p className="text-gray-600 mb-4">
          Your appointment number is: <span className="font-mono font-bold">{formData.appointmentNumber}</span>
        </p>
        <p className="text-gray-600">
          We've sent a confirmation email to {formData.customer?.email}
        </p>
        <Button
          onClick={() => {
            setCurrentStep(1);
            setFormData({
              source: 'website',
              sourceUrl: typeof window !== 'undefined' ? window.location.href : undefined,
              duration: 30,
              consent: {
                email: true,
                sms: true
              }
            });
          }}
          className="mt-6"
        >
          Schedule Another Appointment
        </Button>
      </div>
    );
  }

  return (
    <div className={cn("w-full max-w-2xl mx-auto", className)}>
      {/* Progress Bar */}
      <div className="mb-8">
        <Progress value={progress} className="h-2" />
        <div className="flex justify-between mt-2">
          {STEPS.map((step) => (
            <div
              key={step.id}
              className={cn(
                "text-xs",
                step.id === currentStep ? "text-primary font-semibold" : "text-gray-500"
              )}
            >
              {step.name}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="min-h-[400px]">
        {loadingDevices || loadingServices ? (
          <div className="flex items-center justify-center h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {currentStep === 1 && (
              <DeviceStep
                devices={devices}
                selectedDevice={formData.device}
                onUpdate={(device) => updateFormData({ device })}
              />
            )}
            
            {currentStep === 2 && (
              <IssuesStep
                services={services}
                selectedIssues={formData.issues || []}
                issueDescription={formData.issueDescription}
                onUpdate={(issues, description) => 
                  updateFormData({ issues, issueDescription: description })
                }
              />
            )}
            
            {currentStep === 3 && (
              <ScheduleStep
                selectedDate={formData.appointmentDate}
                selectedTime={formData.appointmentTime}
                apiBaseUrl={apiBaseUrl}
                apiKey={apiKey}
                onUpdate={(date, time) => 
                  updateFormData({ appointmentDate: date, appointmentTime: time })
                }
              />
            )}
            
            {currentStep === 4 && (
              <ContactStep
                customer={formData.customer}
                onUpdate={(customer) => updateFormData({ customer })}
              />
            )}
            
            {currentStep === 5 && (
              <ConfirmationStep
                formData={formData as FormData}
                devices={devices}
                services={services}
                onConsentChange={(consent) => {
                  updateFormData({ 
                    consent: {
                      ...consent,
                      consent_given_at: new Date().toISOString()
                    }
                  });
                }}
              />
            )}
          </>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-8">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentStep === 1}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>

        {currentStep < STEPS.length ? (
          <Button
            onClick={handleNext}
            disabled={!canProceed()}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={!canProceed() || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit Appointment'
            )}
          </Button>
        )}
      </div>
    </div>
  );
}