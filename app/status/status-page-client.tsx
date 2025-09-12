'use client';

import { useState, useEffect } from 'react';
import { StatusLookupForm } from '@/components/status/status-lookup-form';
import { StatusDisplayPremium } from '@/components/status/status-display-premium';
import { useStatusLookup } from '@/lib/hooks/use-status-lookup';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function StatusPageClient() {
  const [storePhone, setStorePhone] = useState<string>('(469) 608-1050');
  
  useEffect(() => {
    const fetchSettings = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('store_settings')
        .select('store_phone')
        .single();
      
      if (data?.store_phone) {
        setStorePhone(data.store_phone);
      }
    };
    
    fetchSettings();
  }, []);
  const [lookupData, setLookupData] = useState<{
    type: 'ticket' | 'appointment';
    identifier: string;
    email: string;
  } | null>(null);

  const { data, isLoading, error, refetch } = useStatusLookup(lookupData);

  const handleLookup = (type: 'ticket' | 'appointment', identifier: string, email: string) => {
    setLookupData({ type, identifier, email });
  };

  const handleReset = () => {
    setLookupData(null);
  };

  return (
    <div className="space-y-6">
      {/* Show form when no lookup is active or there's an error */}
      {(!lookupData || error) && (
        <div className="bg-white rounded-lg shadow-lg p-6 md:p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">
            Check Your Status
          </h2>
          
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {error.message || 'Unable to find the requested information. Please check your details and try again.'}
              </AlertDescription>
            </Alert>
          )}

          <StatusLookupForm 
            onSubmit={handleLookup} 
            isLoading={isLoading}
          />
        </div>
      )}

      {/* Show status display when we have data */}
      {lookupData && data && !error && (
        <StatusDisplayPremium
          type={lookupData.type}
          data={data.data}
          timeline={data.timeline}
          onBack={handleReset}
          storePhone={storePhone}
        />
      )}

      {/* Help Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Need Help?
        </h3>
        <div className="space-y-3 text-sm text-gray-600">
          <div>
            <strong>Where to find your reference number:</strong>
            <ul className="mt-1 ml-5 list-disc space-y-1">
              <li>
                <strong>Ticket Number:</strong> Starts with "TPG" or "TKT" followed by 4 digits (e.g., TPG0003, TKT0001)
              </li>
              <li>
                <strong>Appointment Number:</strong> Starts with "APT" followed by 4 digits (e.g., APT0007)
              </li>
            </ul>
          </div>
          <div>
            <strong>Email Address:</strong> Use the same email address you provided when creating your appointment or dropping off your device.
          </div>
          <div className="pt-3 border-t">
            <p>
              Still having trouble? Contact us at{' '}
              <a href={`tel:${storePhone.replace(/\D/g, '')}`} className="text-cyan-600 hover:text-cyan-700 font-medium">
                {storePhone}
              </a>{' '}
              or visit our store during business hours.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}