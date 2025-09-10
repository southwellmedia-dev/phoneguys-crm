"use client";

import { useState } from 'react';
import { 
  CardPremium,
  ButtonPremium,
  StatusBadge,
  InputPremium,
  AlertPremium
} from '@/components/premium';
import { 
  Copy,
  Check,
  Code,
  Globe,
  Key,
  RefreshCw,
  ExternalLink,
  Shield
} from 'lucide-react';

export function IntegrationCode() {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [apiKey] = useState('pk_live_51234567890abcdef');
  const [showApiKey, setShowApiKey] = useState(false);

  const handleCopy = (text: string, section: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const embedCode = `<!-- Phone Guys Appointment Form -->
<div id="phoneguys-appointment-form"></div>
<script src="https://yourcrm.com/widget.js" 
        data-api-key="${apiKey}"
        data-theme="light"
        async>
</script>`;

  const iframeCode = `<iframe 
  src="https://yourcrm.com/public-form"
  width="100%"
  height="800"
  frameborder="0"
  style="border: 1px solid #e5e7eb; border-radius: 8px;">
</iframe>`;

  const apiExample = `// Submit appointment via API
fetch('https://yourcrm.com/api/public/appointments', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': '${apiKey}'
  },
  body: JSON.stringify({
    customer: {
      name: 'John Doe',
      email: 'john@example.com',
      phone: '(555) 123-4567'
    },
    device: {
      deviceId: 'device-uuid',
      color: 'Black',
      storageSize: '128GB'
    },
    issues: ['screen_repair', 'battery_replacement'],
    appointmentDate: '2024-01-15',
    appointmentTime: '14:00',
    source: 'website'
  })
})
.then(response => response.json())
.then(data => console.log('Appointment created:', data));`;

  return (
    <div className="space-y-6">
      {/* API Key Section */}
      <CardPremium
        title="API Configuration"
        description="Your API key for form authentication"
        variant="default"
        actions={
          <StatusBadge status="active" variant="soft">
            <Shield className="mr-1 h-3 w-3" />
            Secure
          </StatusBadge>
        }
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <InputPremium
                type={showApiKey ? 'text' : 'password'}
                value={apiKey}
                readOnly
                leftIcon={<Key className="h-4 w-4" />}
                variant="default"
              />
            </div>
            <ButtonPremium
              variant="ghost"
              size="sm"
              onClick={() => setShowApiKey(!showApiKey)}
            >
              {showApiKey ? 'Hide' : 'Show'}
            </ButtonPremium>
            <ButtonPremium
              variant="ghost"
              size="sm"
              icon={copiedSection === 'apikey' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              onClick={() => handleCopy(apiKey, 'apikey')}
            >
              {copiedSection === 'apikey' ? 'Copied!' : 'Copy'}
            </ButtonPremium>
            <ButtonPremium
              variant="ghost"
              size="sm"
              icon={<RefreshCw className="h-4 w-4" />}
            >
              Regenerate
            </ButtonPremium>
          </div>

          <AlertPremium
            variant="info"
            title="Keep your API key secure"
          >
            Never expose your API key in client-side code. Use it only in server-side implementations or configure domain restrictions.
          </AlertPremium>
        </div>
      </CardPremium>

      {/* JavaScript Widget */}
      <CardPremium
        title="JavaScript Widget"
        description="Embed the form directly into your website with our widget"
        variant="default"
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge status="success" variant="soft">
              Recommended
            </StatusBadge>
            <ButtonPremium
              variant="ghost"
              size="sm"
              icon={<ExternalLink className="h-4 w-4" />}
            >
              View Docs
            </ButtonPremium>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="relative">
            <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
              <code>{embedCode}</code>
            </pre>
            <ButtonPremium
              variant="ghost"
              size="sm"
              className="absolute top-2 right-2 bg-gray-800 hover:bg-gray-700 text-white"
              icon={copiedSection === 'embed' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              onClick={() => handleCopy(embedCode, 'embed')}
            >
              {copiedSection === 'embed' ? 'Copied!' : 'Copy'}
            </ButtonPremium>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-medium text-sm mb-2">Features</h4>
              <ul className="space-y-1 text-xs text-muted-foreground">
                <li>• Automatically styled to match your site</li>
                <li>• Real-time availability checking</li>
                <li>• Mobile responsive</li>
                <li>• Async loading (won't slow your site)</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-sm mb-2">Customization</h4>
              <ul className="space-y-1 text-xs text-muted-foreground">
                <li>• <code className="bg-gray-100 px-1">data-theme</code>: "light" or "dark"</li>
                <li>• <code className="bg-gray-100 px-1">data-primary-color</code>: Hex color</li>
                <li>• <code className="bg-gray-100 px-1">data-font-family</code>: Font name</li>
                <li>• <code className="bg-gray-100 px-1">data-locale</code>: Language code</li>
              </ul>
            </div>
          </div>
        </div>
      </CardPremium>

      {/* iFrame Embed */}
      <CardPremium
        title="iFrame Embed"
        description="Embed the form in an iframe for complete isolation"
        variant="default"
      >
        <div className="space-y-4">
          <div className="relative">
            <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
              <code>{iframeCode}</code>
            </pre>
            <ButtonPremium
              variant="ghost"
              size="sm"
              className="absolute top-2 right-2 bg-gray-800 hover:bg-gray-700 text-white"
              icon={copiedSection === 'iframe' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              onClick={() => handleCopy(iframeCode, 'iframe')}
            >
              {copiedSection === 'iframe' ? 'Copied!' : 'Copy'}
            </ButtonPremium>
          </div>

          <AlertPremium
            variant="warning"
            title="iFrame Limitations"
          >
            iFrames provide better security isolation but may have limitations with responsive design and cross-domain communication.
          </AlertPremium>
        </div>
      </CardPremium>

      {/* API Integration */}
      <CardPremium
        title="Direct API Integration"
        description="Build your own custom form and submit via our API"
        variant="default"
        actions={
          <ButtonPremium
            variant="ghost"
            size="sm"
            icon={<Code className="h-4 w-4" />}
          >
            API Reference
          </ButtonPremium>
        }
      >
        <div className="space-y-4">
          <div className="relative">
            <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
              <code>{apiExample}</code>
            </pre>
            <ButtonPremium
              variant="ghost"
              size="sm"
              className="absolute top-2 right-2 bg-gray-800 hover:bg-gray-700 text-white"
              icon={copiedSection === 'api' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              onClick={() => handleCopy(apiExample, 'api')}
            >
              {copiedSection === 'api' ? 'Copied!' : 'Copy'}
            </ButtonPremium>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <CardPremium variant="ghost" className="text-center p-4">
              <div className="text-2xl font-bold text-cyan-600">POST</div>
              <div className="text-xs text-muted-foreground mt-1">/api/public/appointments</div>
            </CardPremium>
            <CardPremium variant="ghost" className="text-center p-4">
              <div className="text-2xl font-bold text-green-600">GET</div>
              <div className="text-xs text-muted-foreground mt-1">/api/public/availability</div>
            </CardPremium>
            <CardPremium variant="ghost" className="text-center p-4">
              <div className="text-2xl font-bold text-purple-600">GET</div>
              <div className="text-xs text-muted-foreground mt-1">/api/public/services</div>
            </CardPremium>
          </div>
        </div>
      </CardPremium>

      {/* Domain Whitelist */}
      <CardPremium
        title="Allowed Domains"
        description="Configure which domains can use your API key"
        variant="default"
      >
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <InputPremium
              placeholder="https://example.com"
              leftIcon={<Globe className="h-4 w-4" />}
              variant="default"
            />
            <ButtonPremium variant="default">
              Add Domain
            </ButtonPremium>
          </div>

          <div className="space-y-2">
            {['https://clientsite.com', 'https://www.clientsite.com', 'https://staging.clientsite.com'].map((domain, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">{domain}</span>
                </div>
                <ButtonPremium variant="ghost" size="sm" className="text-red-600">
                  Remove
                </ButtonPremium>
              </div>
            ))}
          </div>
        </div>
      </CardPremium>
    </div>
  );
}