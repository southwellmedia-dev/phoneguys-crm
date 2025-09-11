"use client";

import { useState } from 'react';
import { 
  CardPremium,
  ButtonPremium,
  AlertPremium,
  TabNav
} from '@/components/premium';
import { 
  Code,
  Copy,
  CheckCircle,
  BookOpen,
  Globe,
  Shield,
  Terminal,
  FileCode,
  Settings,
  Zap
} from 'lucide-react';

interface IntegrationGuideProps {
  apiKey?: string;
}

export function IntegrationGuide({ apiKey }: IntegrationGuideProps) {
  const [activeTab, setActiveTab] = useState('quickstart');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://crm.phoneguys.com';

  const tabs = [
    { id: 'quickstart', label: 'Quick Start', icon: <Zap className="h-4 w-4" /> },
    { id: 'javascript', label: 'JavaScript', icon: <Code className="h-4 w-4" /> },
    { id: 'astro', label: 'Astro', icon: <FileCode className="h-4 w-4" /> },
    { id: 'api', label: 'API Reference', icon: <Terminal className="h-4 w-4" /> }
  ];

  const copyToClipboard = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Modern JavaScript embed code
  const jsEmbedSimple = `<!-- Add this where you want the form to appear -->
<div id="phoneguys-appointment-widget"></div>

<!-- Add this before closing </body> tag -->
<script src="${baseUrl}/embed/widget.js"></script>
<script>
  const widget = new PhoneGuysWidget({
    apiKey: '${apiKey || 'YOUR_API_KEY_HERE'}',
    containerId: 'phoneguys-appointment-widget'
  });
</script>`;

  // Advanced JavaScript embed with options
  const jsEmbedAdvanced = `<!-- Modal trigger button -->
<button id="schedule-repair-btn">Schedule Repair</button>

<!-- Widget container -->
<div id="phoneguys-appointment-widget"></div>

<!-- Widget script -->
<script src="${baseUrl}/embed/widget.js"></script>
<script>
  const widget = new PhoneGuysWidget({
    apiKey: '${apiKey || 'YOUR_API_KEY_HERE'}',
    containerId: 'phoneguys-appointment-widget',
    position: 'modal', // 'inline', 'modal', or 'slide-in'
    theme: 'light',
    primaryColor: '#06b6d4',
    maxWidth: '650px',
    onSuccess: function(data) {
      console.log('Appointment confirmed:', data.appointmentNumber);
      // Redirect to thank you page or show custom message
      window.location.href = '/thank-you?appointment=' + data.appointmentNumber;
    },
    onError: function(error) {
      console.error('Error:', error);
      alert('Sorry, there was an error. Please try again.');
    }
  });

  // Open widget when button is clicked
  document.getElementById('schedule-repair-btn').addEventListener('click', function() {
    widget.open();
  });
</script>`;

  // Floating button example
  const jsEmbedFloating = `<!-- Just add this to any page for a floating button -->
<div id="phoneguys-appointment-widget"></div>

<script src="${baseUrl}/embed/widget.js"></script>
<script>
  new PhoneGuysWidget({
    apiKey: '${apiKey || 'YOUR_API_KEY_HERE'}',
    containerId: 'phoneguys-appointment-widget',
    position: 'slide-in',
    autoOpen: false // Widget opens when FAB is clicked
  });
</script>`;

  // Astro component with JS widget
  const astroComponent = `---
// AppointmentWidget.astro
const apiKey = import.meta.env.PUBLIC_PHONEGUYS_API_KEY || '${apiKey || 'YOUR_API_KEY_HERE'}';
const widgetUrl = '${baseUrl}/embed/widget.js';
---

<div id="phoneguys-appointment-widget"></div>

<script define:vars={{ apiKey, widgetUrl }}>
  // Load widget script dynamically
  const script = document.createElement('script');
  script.src = widgetUrl;
  script.onload = function() {
    new PhoneGuysWidget({
      apiKey: apiKey,
      containerId: 'phoneguys-appointment-widget',
      position: 'inline'
    });
  };
  document.head.appendChild(script);
</script>

<style>
  /* Optional: Custom styling for your site */
  #phoneguys-appointment-widget {
    margin: 2rem 0;
  }
</style>`;

  // Direct API example
  const apiExample = `// Direct API call example
const API_KEY = '${apiKey || 'YOUR_API_KEY_HERE'}';
const API_URL = '${baseUrl}/api/public/appointments';

const appointmentData = {
  customer: {
    name: "John Doe",
    email: "john@example.com",
    phone: "5555551234",
    address: "123 Main St"
  },
  device: {
    deviceId: "device-uuid", // Get from device selection
    serialNumber: "ABC123",
    color: "Black",
    storageSize: "128GB",
    condition: "Good"
  },
  issues: ["screen_repair"], // Array of service IDs
  issueDescription: "Screen is cracked in the corner",
  appointmentDate: "2025-01-20",
  appointmentTime: "14:00",
  duration: 30,
  source: "website",
  sourceUrl: window.location.href
};

fetch(API_URL, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': API_KEY
  },
  body: JSON.stringify(appointmentData)
})
.then(response => response.json())
.then(data => {
  if (data.success) {
    console.log('Success!', data.data);
    alert(\`Appointment confirmed! Your number is: \${data.data.appointmentNumber}\`);
  } else {
    console.error('Error:', data.error);
  }
})
.catch(error => {
  console.error('Network error:', error);
});`;

  const renderTabContent = () => {
    switch(activeTab) {
      case 'quickstart':
        return (
          <div className="space-y-6">
            <AlertPremium variant="info" title="Quickest Setup">
              Add the appointment form to your website in under 2 minutes with our JavaScript widget.
            </AlertPremium>

            <div className="space-y-4">
              <CardPremium
                title="Step 1: Copy Your API Key"
                variant="ghost"
              >
                {apiKey ? (
                  <div className="bg-muted rounded p-3 font-mono text-sm flex justify-between items-center">
                    <code className="text-xs">{apiKey}</code>
                    <ButtonPremium
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(apiKey, 'apikey-quick')}
                    >
                      {copiedCode === 'apikey-quick' ? <CheckCircle className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    </ButtonPremium>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Generate an API key in the Settings tab first.
                  </p>
                )}
              </CardPremium>

              <CardPremium
                title="Step 2: Add This Code to Your Website"
                variant="ghost"
              >
                <div className="relative">
                  <pre className="bg-muted rounded p-4 overflow-x-auto text-xs">
                    <code>{jsEmbedSimple}</code>
                  </pre>
                  <ButtonPremium
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => copyToClipboard(jsEmbedSimple, 'simple')}
                  >
                    {copiedCode === 'simple' ? <CheckCircle className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  </ButtonPremium>
                </div>
              </CardPremium>

              <CardPremium
                title="Step 3: That's It!"
                variant="ghost"
              >
                <p className="text-sm text-muted-foreground">
                  The form will automatically appear where you placed the div. It's fully responsive and includes:
                </p>
                <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                  <li>✓ Multi-step form with progress indicator</li>
                  <li>✓ Device and service selection</li>
                  <li>✓ Real-time availability checking</li>
                  <li>✓ Mobile-responsive design</li>
                  <li>✓ Automatic confirmation emails</li>
                </ul>
              </CardPremium>
            </div>
          </div>
        );

      case 'javascript':
        return (
          <div className="space-y-6">
            <AlertPremium variant="success" title="Modern JavaScript Widget">
              Our JavaScript widget provides a seamless, customizable experience for your users.
            </AlertPremium>

            <CardPremium
              title="Inline Form"
              description="Embed the form directly in your page content"
              variant="ghost"
            >
              <div className="relative">
                <pre className="bg-muted rounded p-4 overflow-x-auto text-xs">
                  <code>{jsEmbedSimple}</code>
                </pre>
                <ButtonPremium
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => copyToClipboard(jsEmbedSimple, 'js-inline')}
                >
                  {copiedCode === 'js-inline' ? <CheckCircle className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                </ButtonPremium>
              </div>
            </CardPremium>

            <CardPremium
              title="Modal Popup"
              description="Open the form in a beautiful modal overlay"
              variant="ghost"
            >
              <div className="relative">
                <pre className="bg-muted rounded p-4 overflow-x-auto text-xs max-h-96 overflow-y-auto">
                  <code>{jsEmbedAdvanced}</code>
                </pre>
                <ButtonPremium
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => copyToClipboard(jsEmbedAdvanced, 'js-modal')}
                >
                  {copiedCode === 'js-modal' ? <CheckCircle className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                </ButtonPremium>
              </div>
            </CardPremium>

            <CardPremium
              title="Floating Action Button"
              description="Add a floating button that opens the form in a slide-in panel"
              variant="ghost"
            >
              <div className="relative">
                <pre className="bg-muted rounded p-4 overflow-x-auto text-xs">
                  <code>{jsEmbedFloating}</code>
                </pre>
                <ButtonPremium
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => copyToClipboard(jsEmbedFloating, 'js-floating')}
                >
                  {copiedCode === 'js-floating' ? <CheckCircle className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                </ButtonPremium>
              </div>
            </CardPremium>

            <CardPremium
              title="Widget API Methods"
              description="Control the widget programmatically"
              variant="ghost"
            >
              <pre className="bg-muted rounded p-4 overflow-x-auto text-xs">
                <code>{`// Available methods
widget.open();           // Open the widget
widget.close();          // Close the widget
widget.destroy();        // Remove the widget

// Event handlers
widget.on('success', function(data) {
  console.log('Appointment created:', data);
});

widget.on('error', function(error) {
  console.error('Error occurred:', error);
});

// Prefill form data
widget.submit({
  customerName: 'John Doe',
  customerEmail: 'john@example.com'
});`}</code>
              </pre>
            </CardPremium>
          </div>
        );

      case 'astro':
        return (
          <div className="space-y-6">
            <AlertPremium variant="info" title="Astro Integration">
              Use our widget seamlessly in your Astro website with these components.
            </AlertPremium>

            <CardPremium
              title="Astro Component"
              description="Create a reusable component for your Astro site"
              variant="ghost"
            >
              <div className="relative">
                <pre className="bg-muted rounded p-4 overflow-x-auto text-xs">
                  <code>{astroComponent}</code>
                </pre>
                <ButtonPremium
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => copyToClipboard(astroComponent, 'astro-comp')}
                >
                  {copiedCode === 'astro-comp' ? <CheckCircle className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                </ButtonPremium>
              </div>
            </CardPremium>

            <CardPremium
              title="Usage in Astro Pages"
              description="How to use the component in your pages"
              variant="ghost"
            >
              <pre className="bg-muted rounded p-4 overflow-x-auto text-xs">
                <code>{`---
// src/pages/schedule.astro
import Layout from '../layouts/Layout.astro';
import AppointmentWidget from '../components/AppointmentWidget.astro';
---

<Layout title="Schedule Your Repair">
  <main>
    <h1>Book Your Device Repair</h1>
    <p>Schedule your appointment online in just a few minutes.</p>
    
    <AppointmentWidget />
    
    <section>
      <h2>What to Expect</h2>
      <ul>
        <li>Fast, professional service</li>
        <li>Transparent pricing</li>
        <li>Quality parts with warranty</li>
      </ul>
    </section>
  </main>
</Layout>`}</code>
              </pre>
            </CardPremium>

            <CardPremium
              title="Environment Variables"
              description="Add to your .env file"
              variant="ghost"
            >
              <pre className="bg-muted rounded p-4 overflow-x-auto text-xs">
                <code>{`# .env
PUBLIC_PHONEGUYS_API_KEY=${apiKey || 'YOUR_API_KEY_HERE'}`}</code>
              </pre>
            </CardPremium>
          </div>
        );

      case 'api':
        return (
          <div className="space-y-6">
            <AlertPremium variant="info" title="Direct API Integration">
              Build your own custom form and submit directly to our API.
            </AlertPremium>

            <CardPremium
              title="API Endpoint"
              variant="ghost"
            >
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium mb-2">Endpoint</h4>
                  <div className="bg-muted rounded p-3 font-mono text-sm">
                    POST {baseUrl}/api/public/appointments
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-2">Headers</h4>
                  <div className="bg-muted rounded p-3 font-mono text-sm">
                    <div>Content-Type: application/json</div>
                    <div>x-api-key: {apiKey || 'YOUR_API_KEY_HERE'}</div>
                  </div>
                </div>
              </div>
            </CardPremium>

            <CardPremium
              title="JavaScript Example"
              description="Complete example with fetch API"
              variant="ghost"
            >
              <div className="relative">
                <pre className="bg-muted rounded p-4 overflow-x-auto text-xs max-h-96 overflow-y-auto">
                  <code>{apiExample}</code>
                </pre>
                <ButtonPremium
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => copyToClipboard(apiExample, 'api-example')}
                >
                  {copiedCode === 'api-example' ? <CheckCircle className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                </ButtonPremium>
              </div>
            </CardPremium>

            <CardPremium
              title="Response Format"
              variant="ghost"
            >
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium mb-2">Success Response</h4>
                  <pre className="bg-muted rounded p-3 overflow-x-auto text-xs">
                    <code>{JSON.stringify({
  success: true,
  data: {
    appointmentId: "uuid-here",
    appointmentNumber: "APT-20250120-001",
    status: "scheduled",
    scheduledDate: "2025-01-20",
    scheduledTime: "14:00",
    formattedDate: "Monday, January 20, 2025",
    formattedTime: "2:00 PM",
    message: "Your appointment has been confirmed..."
  }
}, null, 2)}</code>
                  </pre>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-2">Error Response</h4>
                  <pre className="bg-muted rounded p-3 overflow-x-auto text-xs">
                    <code>{JSON.stringify({
  success: false,
  error: "Validation failed",
  details: {
    customer: {
      email: ["Invalid email format"]
    }
  }
}, null, 2)}</code>
                  </pre>
                </div>
              </div>
            </CardPremium>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <CardPremium
        title="Integration Guide"
        description="Choose your preferred integration method"
      >
        <div className="space-y-6">
          <TabNav
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
          {renderTabContent()}
        </div>
      </CardPremium>
    </div>
  );
}