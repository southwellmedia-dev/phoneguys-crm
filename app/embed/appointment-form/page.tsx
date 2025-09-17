"use client";

import { FormContainer } from '@/components/public-form/FormContainer';
import { useEffect, useRef } from 'react';

export default function EmbedAppointmentForm() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Function to send height to parent
    const sendHeight = () => {
      if (window.parent !== window && containerRef.current) {
        const height = containerRef.current.scrollHeight;
        window.parent.postMessage({
          type: 'resize',
          data: { height }
        }, '*');
      }
    };

    // Send initial height after mount
    const timer = setTimeout(sendHeight, 100);

    // Monitor for height changes
    const resizeObserver = new ResizeObserver(sendHeight);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    // Also monitor for DOM changes that might affect height
    const mutationObserver = new MutationObserver(sendHeight);
    if (containerRef.current) {
      mutationObserver.observe(containerRef.current, { 
        childList: true, 
        subtree: true,
        attributes: true 
      });
    }

    // Add messaging capability for iframe communication
    const handleMessage = (event: MessageEvent) => {
      // Handle messages from parent window if needed
      if (event.data.type === 'config') {
        // Handle configuration from parent widget
        console.log('Received config:', event.data.data);
      }
    };

    window.addEventListener('message', handleMessage);

    return () => {
      clearTimeout(timer);
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  const handleSuccess = (data: any) => {
    // Send message to parent window if embedded
    if (window.parent !== window) {
      window.parent.postMessage({
        type: 'appointment-confirmed',
        appointmentNumber: data.appointmentNumber,
        data: data
      }, '*');
    }
  };

  const handleError = (error: any) => {
    console.error('Form submission error:', error);
    // Send error message to parent window if embedded
    if (window.parent !== window) {
      window.parent.postMessage({
        type: 'appointment-error',
        error: error.message
      }, '*');
    }
  };

  return (
    <div ref={containerRef} className="bg-white">
      <div className="w-full">
        <div className="space-y-4">
          <div className="text-center pb-4 border-b">
            <h1 className="text-2xl font-semibold">Schedule Your Repair</h1>
            <p className="text-sm text-gray-600 mt-1">
              Book an appointment in just a few steps
            </p>
          </div>

          <FormContainer
            apiBaseUrl={`${process.env.NEXT_PUBLIC_APP_URL || 'https://dashboard.phoneguysrepair.com'}/api/public`}
            onSuccess={handleSuccess}
            onError={handleError}
          />
        </div>
      </div>
    </div>
  );
}