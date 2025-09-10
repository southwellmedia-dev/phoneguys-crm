'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { FormContainer } from '@/components/public-form/form-container';

function PublicFormContent() {
  const searchParams = useSearchParams();
  const [config, setConfig] = useState({
    apiKey: '',
    theme: 'light',
    primaryColor: '#0066cc',
    locale: 'en-US',
    embedded: false,
    origin: ''
  });

  useEffect(() => {
    // Get configuration from URL params
    const newConfig = {
      apiKey: searchParams.get('apiKey') || '',
      theme: searchParams.get('theme') || 'light',
      primaryColor: searchParams.get('primaryColor') || '#0066cc',
      locale: searchParams.get('locale') || 'en-US',
      embedded: searchParams.get('embedded') === 'true',
      origin: searchParams.get('origin') || ''
    };
    setConfig(newConfig);

    // Apply theme
    if (newConfig.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Apply custom primary color
    if (newConfig.primaryColor) {
      document.documentElement.style.setProperty('--primary-color', newConfig.primaryColor);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!config.embedded) return;

    // Listen for messages from parent
    const handleMessage = (event: MessageEvent) => {
      // Verify origin if specified
      if (config.origin && event.origin !== config.origin) return;

      const { type, data } = event.data;

      switch(type) {
        case 'PHONEGUYS_CONFIG':
          // Update configuration
          if (data.config) {
            setConfig(prev => ({ ...prev, ...data.config }));
          }
          break;

        case 'PHONEGUYS_RESET':
          // Reset form
          window.location.reload();
          break;

        case 'PHONEGUYS_PREFILL':
          // Prefill form data
          if (data) {
            // Dispatch custom event for form to handle
            window.dispatchEvent(new CustomEvent('phoneguys:prefill', { detail: data }));
          }
          break;

        case 'PHONEGUYS_SET_THEME':
          // Update theme
          if (data.theme) {
            setConfig(prev => ({ ...prev, theme: data.theme }));
            if (data.theme === 'dark') {
              document.documentElement.classList.add('dark');
            } else {
              document.documentElement.classList.remove('dark');
            }
          }
          break;
      }
    };

    window.addEventListener('message', handleMessage);
    
    // Send ready message
    if (window.parent !== window) {
      window.parent.postMessage({
        type: 'PHONEGUYS_READY'
      }, config.origin || '*');
    }

    // Monitor height changes and notify parent
    const resizeObserver = new ResizeObserver(() => {
      if (window.parent !== window) {
        window.parent.postMessage({
          type: 'PHONEGUYS_RESIZE',
          data: {
            height: document.body.scrollHeight
          }
        }, config.origin || '*');
      }
    });

    resizeObserver.observe(document.body);

    return () => {
      window.removeEventListener('message', handleMessage);
      resizeObserver.disconnect();
    };
  }, [config.embedded, config.origin]);

  const handleSuccess = (appointmentData: any) => {
    if (config.embedded && window.parent !== window) {
      window.parent.postMessage({
        type: 'PHONEGUYS_SUCCESS',
        data: appointmentData
      }, config.origin || '*');
    }
  };

  const handleError = (error: any) => {
    if (config.embedded && window.parent !== window) {
      window.parent.postMessage({
        type: 'PHONEGUYS_ERROR',
        data: error
      }, config.origin || '*');
    }
  };

  // Validate API key
  if (!config.apiKey) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Configuration Error</h1>
          <p className="text-gray-600">API key is required to use this form.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={config.embedded ? '' : 'min-h-screen bg-gray-50 dark:bg-gray-900'}>
      <div className={config.embedded ? 'p-4' : 'container mx-auto py-8 px-4'}>
        {!config.embedded && (
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Schedule Your Repair
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Get your device fixed by our expert technicians
            </p>
          </div>
        )}
        
        <FormContainer 
          apiKey={config.apiKey}
          onSuccess={handleSuccess}
          onError={handleError}
          embedded={config.embedded}
        />
      </div>
    </div>
  );
}

export default function PublicFormPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading form...</p>
        </div>
      </div>
    }>
      <PublicFormContent />
    </Suspense>
  );
}