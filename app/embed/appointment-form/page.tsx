"use client";

import { FormContainer } from '@/components/public-form/FormContainer';
import { useEffect, useRef } from 'react';

export default function EmbedAppointmentForm() {
  const containerRef = useRef<HTMLDivElement>(null);
  const lastHeightRef = useRef<number>(0);
  const isUpdatingRef = useRef<boolean>(false);

  useEffect(() => {
    // Function to send height to parent
    const sendHeight = () => {
      if (window.parent !== window && !isUpdatingRef.current) {
        // Get ALL possible height measurements
        const body = document.body;
        const html = document.documentElement;
        const container = containerRef.current;
        
        // Get the maximum height from all sources
        const height = Math.max(
          container ? container.scrollHeight : 0,
          container ? container.offsetHeight : 0,
          body.scrollHeight,
          body.offsetHeight,
          html.clientHeight,
          html.scrollHeight,
          html.offsetHeight,
          // Also check the actual content bounds
          document.documentElement.getBoundingClientRect().height
        );
        
        // Only send if height actually changed (with 5px tolerance)
        if (Math.abs(height - lastHeightRef.current) > 5) {
          console.log('[Embed] Sending height update:', height);
          lastHeightRef.current = height;
          isUpdatingRef.current = true;
          
          window.parent.postMessage({
            type: 'resize',
            data: { height }
          }, '*');
          
          // Reset flag after a delay
          setTimeout(() => {
            isUpdatingRef.current = false;
          }, 100);
        }
      }
    };

    // Send height updates with debouncing
    let timeoutId: NodeJS.Timeout;
    const sendHeightDebounced = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(sendHeight, 50);
    };

    // Send initial height after mount
    setTimeout(sendHeight, 100);

    // Monitor for height changes on our container only
    const resizeObserver = new ResizeObserver(() => {
      sendHeightDebounced();
    });
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    // Monitor for DOM changes in our container
    const mutationObserver = new MutationObserver(() => {
      sendHeightDebounced();
    });
    if (containerRef.current) {
      mutationObserver.observe(containerRef.current, { 
        childList: true, 
        subtree: true,
        attributes: false, // Don't watch attribute changes to avoid loops
        characterData: false
      });
    }

    // Listen for window resize
    window.addEventListener('resize', sendHeightDebounced);

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
      clearTimeout(timeoutId);
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      window.removeEventListener('message', handleMessage);
      window.removeEventListener('resize', sendHeightDebounced);
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
    <div ref={containerRef} className="bg-white min-h-screen">
      <style jsx global>{`
        html, body {
          height: auto !important;
          overflow: visible !important;
          margin: 0;
          padding: 0;
        }
      `}</style>
      <div className="w-full">
        <FormContainer
          apiBaseUrl={`${process.env.NEXT_PUBLIC_APP_URL || 'https://dashboard.phoneguysrepair.com'}/api/public`}
          onSuccess={handleSuccess}
          onError={handleError}
          embedded={true}
        />
      </div>
    </div>
  );
}