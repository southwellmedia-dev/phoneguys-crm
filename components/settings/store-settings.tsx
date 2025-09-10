'use client';

import { useState } from 'react';
import { useUpdateStoreSettings } from '@/lib/hooks/use-settings';
import { ButtonPremium } from '@/components/premium/ui/buttons';
import { InputPremium, TextareaPremium } from '@/components/premium/ui/forms';
import { LoadingSpinner } from '@/components/premium/ui/feedback';
import type { StoreSettings as StoreSettingsType } from '@/lib/types/database.types';
import { Save, MapPin, Phone, Mail, Globe } from 'lucide-react';

interface StoreSettingsProps {
  initialData: StoreSettingsType | null;
}

const DEFAULT_SETTINGS: Partial<StoreSettingsType> = {
  store_name: 'The Phone Guys',
  store_email: 'info@phoneguys.com',
  store_phone: '',
  store_address: '',
  store_city: '',
  store_state: '',
  store_zip: '',
  store_country: 'USA',
  store_website: '',
  store_description: '',
  tax_rate: 0,
  currency: 'USD',
  timezone: 'America/New_York',
};

export function StoreSettings({ initialData }: StoreSettingsProps) {
  const [settings, setSettings] = useState<Partial<StoreSettingsType>>(
    initialData || DEFAULT_SETTINGS
  );
  const updateMutation = useUpdateStoreSettings();

  const handleChange = (field: keyof StoreSettingsType, value: any) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    await updateMutation.mutateAsync(settings);
  };

  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="font-medium text-lg">Basic Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-1 block">
              Store Name
            </label>
            <InputPremium
              value={settings.store_name || ''}
              onChange={(e) => handleChange('store_name', e.target.value)}
              placeholder="Your store name"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">
              <Globe className="w-4 h-4 inline mr-1" />
              Website
            </label>
            <InputPremium
              type="url"
              value={settings.store_website || ''}
              onChange={(e) => handleChange('store_website', e.target.value)}
              placeholder="https://example.com"
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium mb-1 block">
            Store Description
          </label>
          <TextareaPremium
            value={settings.store_description || ''}
            onChange={(e) => handleChange('store_description', e.target.value)}
            placeholder="Brief description of your store"
            rows={3}
          />
        </div>
      </div>

      {/* Contact Information */}
      <div className="space-y-4">
        <h3 className="font-medium text-lg">Contact Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-1 block">
              <Mail className="w-4 h-4 inline mr-1" />
              Email Address
            </label>
            <InputPremium
              type="email"
              value={settings.store_email || ''}
              onChange={(e) => handleChange('store_email', e.target.value)}
              placeholder="store@example.com"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">
              <Phone className="w-4 h-4 inline mr-1" />
              Phone Number
            </label>
            <InputPremium
              type="tel"
              value={settings.store_phone || ''}
              onChange={(e) => handleChange('store_phone', e.target.value)}
              placeholder="(555) 123-4567"
            />
          </div>
        </div>
      </div>

      {/* Location */}
      <div className="space-y-4">
        <h3 className="font-medium text-lg">
          <MapPin className="w-4 h-4 inline mr-1" />
          Location
        </h3>
        
        <div>
          <label className="text-sm font-medium mb-1 block">
            Street Address
          </label>
          <InputPremium
            value={settings.store_address || ''}
            onChange={(e) => handleChange('store_address', e.target.value)}
            placeholder="123 Main Street"
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="col-span-2 md:col-span-1">
            <label className="text-sm font-medium mb-1 block">
              City
            </label>
            <InputPremium
              value={settings.store_city || ''}
              onChange={(e) => handleChange('store_city', e.target.value)}
              placeholder="City"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">
              State
            </label>
            <InputPremium
              value={settings.store_state || ''}
              onChange={(e) => handleChange('store_state', e.target.value)}
              placeholder="State"
              maxLength={2}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">
              ZIP Code
            </label>
            <InputPremium
              value={settings.store_zip || ''}
              onChange={(e) => handleChange('store_zip', e.target.value)}
              placeholder="12345"
            />
          </div>
        </div>
      </div>

      {/* Business Settings */}
      <div className="space-y-4">
        <h3 className="font-medium text-lg">Business Settings</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium mb-1 block">
              Tax Rate (%)
            </label>
            <InputPremium
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={settings.tax_rate || 0}
              onChange={(e) => handleChange('tax_rate', parseFloat(e.target.value))}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">
              Currency
            </label>
            <InputPremium
              value={settings.currency || 'USD'}
              onChange={(e) => handleChange('currency', e.target.value)}
              maxLength={3}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">
              Timezone
            </label>
            <InputPremium
              value={settings.timezone || 'America/New_York'}
              onChange={(e) => handleChange('timezone', e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t">
        <ButtonPremium
          onClick={handleSave}
          disabled={updateMutation.isPending}
          variant="gradient"
          size="lg"
        >
          {updateMutation.isPending ? (
            <>
              <LoadingSpinner size="sm" className="mr-2" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Store Settings
            </>
          )}
        </ButtonPremium>
      </div>
    </div>
  );
}