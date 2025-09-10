"use client";

import { useState } from 'react';
import { FormContainer } from '@/components/public-form/FormContainer';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Monitor, Tablet, Smartphone, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

type DeviceView = 'desktop' | 'tablet' | 'mobile';

export function FormPreview() {
  const [deviceView, setDeviceView] = useState<DeviceView>('desktop');
  const [key, setKey] = useState(0); // For resetting the form

  const handleSuccess = (data: any) => {
    console.log('Test submission:', data);
    // Show success message
    alert(`Test submission successful! Appointment #${data.appointmentNumber}`);
    // Reset form
    setKey(prev => prev + 1);
  };

  const handleError = (error: any) => {
    console.error('Test submission error:', error);
    alert('Test submission failed. Check console for details.');
  };

  const deviceSizes = {
    desktop: 'w-full',
    tablet: 'max-w-2xl',
    mobile: 'max-w-sm'
  };

  return (
    <div className="space-y-4">
      {/* Device View Selector */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Preview as:</span>
          <div className="flex gap-1">
            <Button
              variant={deviceView === 'desktop' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDeviceView('desktop')}
            >
              <Monitor className="h-4 w-4" />
            </Button>
            <Button
              variant={deviceView === 'tablet' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDeviceView('tablet')}
            >
              <Tablet className="h-4 w-4" />
            </Button>
            <Button
              variant={deviceView === 'mobile' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDeviceView('mobile')}
            >
              <Smartphone className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="secondary">Test Mode</Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setKey(prev => prev + 1)}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset Form
          </Button>
        </div>
      </div>

      {/* Form Preview Container */}
      <div className="relative">
        <div 
          className={cn(
            "mx-auto transition-all duration-300 border rounded-lg p-4 bg-white",
            deviceSizes[deviceView]
          )}
        >
          <div className="space-y-4">
            <div className="text-center pb-4 border-b">
              <h3 className="text-xl font-semibold">Schedule Your Repair</h3>
              <p className="text-sm text-gray-600 mt-1">
                Book an appointment in just a few steps
              </p>
            </div>

            <FormContainer
              key={key}
              apiBaseUrl="/api/public"
              onSuccess={handleSuccess}
              onError={handleError}
            />
          </div>
        </div>

        {/* Device Frame Overlay (optional visual enhancement) */}
        {deviceView === 'mobile' && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="mx-auto max-w-sm h-full border-8 border-gray-800 rounded-3xl"></div>
          </div>
        )}
      </div>

      {/* Info Box */}
      <Card className="bg-blue-50 border-blue-200">
        <div className="p-4">
          <p className="text-sm text-blue-800">
            <strong>Testing Note:</strong> Submissions from this preview are marked as test data and won't affect your statistics. 
            The form connects to your live API endpoints to ensure accurate testing.
          </p>
        </div>
      </Card>
    </div>
  );
}