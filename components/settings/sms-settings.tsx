'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { InputPremium } from '@/components/premium/ui/forms/input-premium';
import { SwitchPremium } from '@/components/premium/ui/forms/switch-premium';
import { SelectPremium } from '@/components/premium/ui/forms/select-premium';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Phone, MessageSquare, Settings, TestTube, CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react';
import { toast } from 'sonner';
import { getSMSService } from '@/lib/services/sms.service';
import { previewAllTemplates } from '@/lib/templates/sms-templates';

interface SMSSettingsProps {
  onSave?: (settings: SMSSettings) => void;
  onTest?: (phoneNumber: string) => Promise<boolean>;
}

interface SMSSettings {
  enabled: boolean;
  businessName: string;
  businessPhone: string;
  useDetailedTemplates: boolean;
  rateLimit: number;
  twilioAccountSid: string;
  twilioAuthToken: string;
  twilioPhoneNumber: string;
}

export function SMSSettings({ onSave, onTest }: SMSSettingsProps) {
  const [settings, setSettings] = useState<SMSSettings>({
    enabled: false,
    businessName: 'The Phone Guys',
    businessPhone: '(555) 123-4567',
    useDetailedTemplates: false,
    rateLimit: 100,
    twilioAccountSid: '',
    twilioAuthToken: '',
    twilioPhoneNumber: ''
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testPhone, setTestPhone] = useState('');
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);
  const [configStatus, setConfigStatus] = useState<'unknown' | 'configured' | 'missing'>('unknown');
  const [showTemplatePreview, setShowTemplatePreview] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadSettings();
    checkTwilioConfig();
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      // In a real implementation, this would fetch from your settings API
      const response = await fetch('/api/admin/settings/sms');
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      }
    } catch (error) {
      console.error('Failed to load SMS settings:', error);
      toast.error('Failed to load SMS settings');
    } finally {
      setIsLoading(false);
    }
  };

  const checkTwilioConfig = () => {
    const smsService = getSMSService();
    const isReady = smsService.isReady();
    setConfigStatus(isReady ? 'configured' : 'missing');
  };

  const handleSettingChange = (key: keyof SMSSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      
      // Validate required fields
      if (settings.enabled) {
        if (!settings.businessName.trim()) {
          toast.error('Business name is required');
          return;
        }
        if (!settings.businessPhone.trim()) {
          toast.error('Business phone is required');
          return;
        }
      }

      // In a real implementation, this would save to your settings API
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      onSave?.(settings);
      setHasChanges(false);
      toast.success('SMS settings saved successfully');
    } catch (error) {
      console.error('Failed to save SMS settings:', error);
      toast.error('Failed to save SMS settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestSMS = async () => {
    if (!testPhone.trim()) {
      toast.error('Please enter a phone number to test');
      return;
    }

    try {
      setIsTesting(true);
      setTestResult(null);
      
      const success = await onTest?.(testPhone) ?? false;
      setTestResult(success ? 'success' : 'error');
      
      if (success) {
        toast.success('Test SMS sent successfully!');
      } else {
        toast.error('Failed to send test SMS');
      }
    } catch (error) {
      console.error('Test SMS failed:', error);
      setTestResult('error');
      toast.error('Test SMS failed');
    } finally {
      setIsTesting(false);
    }
  };

  const getStatusIcon = () => {
    switch (configStatus) {
      case 'configured':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'missing':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusText = () => {
    switch (configStatus) {
      case 'configured':
        return 'Twilio configured and ready';
      case 'missing':
        return 'Twilio credentials missing';
      default:
        return 'Checking configuration...';
    }
  };

  const templatePreviews = showTemplatePreview ? previewAllTemplates() : [];

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            SMS Configuration Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-4">
            {getStatusIcon()}
            <span className="text-sm font-medium">{getStatusText()}</span>
          </div>
          
          {configStatus === 'missing' && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Twilio credentials are not configured. Please add TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER to your environment variables.
              </AlertDescription>
            </Alert>
          )}
          
          {configStatus === 'configured' && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                SMS service is properly configured and ready to send notifications.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Main Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            SMS Notification Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Enable SMS */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable SMS Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Send SMS notifications to customers for ticket status updates
              </p>
            </div>
            <SwitchPremium
              checked={settings.enabled}
              onCheckedChange={(checked) => handleSettingChange('enabled', checked)}
              disabled={configStatus !== 'configured'}
            />
          </div>

          <Separator />

          {/* Business Information */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Business Information</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Business Name</Label>
                <InputPremium
                  placeholder="The Phone Guys"
                  value={settings.businessName}
                  onChange={(e) => handleSettingChange('businessName', e.target.value)}
                  disabled={!settings.enabled}
                />
                <p className="text-xs text-muted-foreground">
                  Name included in SMS messages
                </p>
              </div>
              
              <div className="space-y-2">
                <Label>Business Phone</Label>
                <InputPremium
                  placeholder="(555) 123-4567"
                  value={settings.businessPhone}
                  onChange={(e) => handleSettingChange('businessPhone', e.target.value)}
                  disabled={!settings.enabled}
                />
                <p className="text-xs text-muted-foreground">
                  Contact number included in SMS messages
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Message Settings */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Message Settings</h4>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Use Detailed Templates</Label>
                <p className="text-sm text-muted-foreground">
                  Send longer, more detailed SMS messages (may use more characters)
                </p>
              </div>
              <SwitchPremium
                checked={settings.useDetailedTemplates}
                onCheckedChange={(checked) => handleSettingChange('useDetailedTemplates', checked)}
                disabled={!settings.enabled}
              />
            </div>

            <div className="space-y-2">
              <Label>Rate Limit (per hour)</Label>
              <SelectPremium
                value={settings.rateLimit.toString()}
                onValueChange={(value) => handleSettingChange('rateLimit', parseInt(value))}
                disabled={!settings.enabled}
              >
                <option value="50">50 messages/hour</option>
                <option value="100">100 messages/hour</option>
                <option value="200">200 messages/hour</option>
                <option value="500">500 messages/hour</option>
              </SelectPremium>
              <p className="text-xs text-muted-foreground">
                Maximum SMS messages to send per hour
              </p>
            </div>
          </div>

          <Separator />

          {/* Template Preview */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">Message Templates</h4>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowTemplatePreview(!showTemplatePreview)}
              >
                {showTemplatePreview ? 'Hide' : 'Show'} Preview
              </Button>
            </div>
            
            {showTemplatePreview && (
              <div className="space-y-3">
                {templatePreviews.map((template, index) => (
                  <div key={template.templateKey} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline">{template.templateKey}</Badge>
                      <Badge variant={template.withinLimit ? "default" : "destructive"}>
                        {template.characterCount} chars
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-1">
                      {template.description}
                    </p>
                    <p className="text-sm bg-muted p-2 rounded">
                      {template.message}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Test SMS */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            Test SMS Service
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <InputPremium
              placeholder="+1234567890"
              value={testPhone}
              onChange={(e) => setTestPhone(e.target.value)}
              disabled={!settings.enabled || configStatus !== 'configured'}
              className="flex-1"
            />
            <Button
              onClick={handleTestSMS}
              disabled={!settings.enabled || isTesting || configStatus !== 'configured'}
              variant="outline"
            >
              {isTesting ? 'Sending...' : 'Send Test'}
            </Button>
          </div>
          
          {testResult && (
            <Alert variant={testResult === 'success' ? 'default' : 'destructive'}>
              {testResult === 'success' ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
              <AlertDescription>
                {testResult === 'success' 
                  ? 'Test SMS sent successfully!' 
                  : 'Failed to send test SMS. Check your Twilio configuration.'}
              </AlertDescription>
            </Alert>
          )}
          
          <p className="text-xs text-muted-foreground">
            <Info className="h-3 w-3 inline mr-1" />
            Enter a valid phone number to test SMS functionality
          </p>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={!hasChanges || isLoading}
          size="lg"
        >
          {isLoading ? 'Saving...' : 'Save SMS Settings'}
        </Button>
      </div>
    </div>
  );
}