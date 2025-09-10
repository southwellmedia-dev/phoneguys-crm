'use client';

import { useState } from 'react';
import { useUpdateAppointmentSettings } from '@/lib/hooks/use-settings';
import { ButtonPremium } from '@/components/premium/ui/buttons';
import { InputPremium, SelectPremium, SwitchPremium } from '@/components/premium/ui/forms';
import { LoadingSpinner } from '@/components/premium/ui/feedback';
import type { AppointmentSettings as AppointmentSettingsType } from '@/lib/types/database.types';
import { Save, Clock, Calendar, Users } from 'lucide-react';

interface AppointmentSettingsProps {
  initialData: AppointmentSettingsType | null;
}

const DEFAULT_SETTINGS: Partial<AppointmentSettingsType> = {
  slot_duration_minutes: 30,
  buffer_time_minutes: 0,
  max_advance_days: 30,
  min_advance_hours: 2,
  max_appointments_per_slot: 1,
  allow_same_day_appointments: true,
  allow_weekend_appointments: true,
  send_confirmation_email: true,
  send_reminder_email: true,
  reminder_hours_before: 24,
};

export function AppointmentSettings({ initialData }: AppointmentSettingsProps) {
  const [settings, setSettings] = useState<Partial<AppointmentSettingsType>>(
    initialData || DEFAULT_SETTINGS
  );
  const updateMutation = useUpdateAppointmentSettings();

  const handleChange = (field: keyof AppointmentSettingsType, value: any) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    await updateMutation.mutateAsync(settings);
  };

  const slotDurationOptions = [
    { value: '15', label: '15 minutes' },
    { value: '30', label: '30 minutes' },
    { value: '45', label: '45 minutes' },
    { value: '60', label: '1 hour' },
    { value: '90', label: '1.5 hours' },
    { value: '120', label: '2 hours' },
  ];

  const bufferTimeOptions = [
    { value: '0', label: 'No buffer' },
    { value: '5', label: '5 minutes' },
    { value: '10', label: '10 minutes' },
    { value: '15', label: '15 minutes' },
    { value: '30', label: '30 minutes' },
  ];

  return (
    <div className="space-y-6">
      {/* Time Slot Configuration */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Clock className="w-5 h-5 text-cyan-500" />
          <h3 className="font-medium text-lg">Time Slot Configuration</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-1 block">
              Appointment Duration
            </label>
            <SelectPremium
              value={String(settings.slot_duration_minutes || 30)}
              onValueChange={(value) => 
                handleChange('slot_duration_minutes', parseInt(value))
              }
              options={slotDurationOptions}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">
              Buffer Time Between Appointments
            </label>
            <SelectPremium
              value={String(settings.buffer_time_minutes || 0)}
              onValueChange={(value) => 
                handleChange('buffer_time_minutes', parseInt(value))
              }
              options={bufferTimeOptions}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">
              Maximum Appointments Per Time Slot
            </label>
            <InputPremium
              type="number"
              min="1"
              max="10"
              value={settings.max_appointments_per_slot || 1}
              onChange={(e) => 
                handleChange('max_appointments_per_slot', parseInt(e.target.value))
              }
            />
          </div>
        </div>
      </div>

      {/* Booking Rules */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Calendar className="w-5 h-5 text-cyan-500" />
          <h3 className="font-medium text-lg">Booking Rules</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-1 block">
              How far in advance can customers book? (days)
            </label>
            <InputPremium
              type="number"
              min="1"
              max="365"
              value={settings.max_advance_days || 30}
              onChange={(e) => 
                handleChange('max_advance_days', parseInt(e.target.value))
              }
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">
              Minimum notice required (hours)
            </label>
            <InputPremium
              type="number"
              min="0"
              max="168"
              value={settings.min_advance_hours || 2}
              onChange={(e) => 
                handleChange('min_advance_hours', parseInt(e.target.value))
              }
            />
          </div>
        </div>

        <div className="space-y-3">
          <SwitchPremium
            checked={settings.allow_same_day_appointments || false}
            onChange={(e) => 
              handleChange('allow_same_day_appointments', e.target.checked)
            }
            label="Allow same-day appointments"
          />

          <SwitchPremium
            checked={settings.allow_weekend_appointments !== false}
            onChange={(e) => 
              handleChange('allow_weekend_appointments', e.target.checked)
            }
            label="Allow weekend appointments"
          />
        </div>
      </div>

      {/* Notifications */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Users className="w-5 h-5 text-cyan-500" />
          <h3 className="font-medium text-lg">Notifications</h3>
        </div>
        
        <div className="space-y-3">
          <SwitchPremium
            checked={settings.send_confirmation_email !== false}
            onChange={(e) => 
              handleChange('send_confirmation_email', e.target.checked)
            }
            label="Send confirmation email when appointment is booked"
          />

          <div className="flex items-center gap-4">
            <SwitchPremium
              checked={settings.send_reminder_email !== false}
              onChange={(e) => 
                handleChange('send_reminder_email', e.target.checked)
              }
              label="Send reminder email"
            />
            
            {settings.send_reminder_email && (
              <div className="flex items-center gap-2">
                <InputPremium
                  type="number"
                  min="1"
                  max="72"
                  value={settings.reminder_hours_before || 24}
                  onChange={(e) => 
                    handleChange('reminder_hours_before', parseInt(e.target.value))
                  }
                  className="w-20"
                />
                <span className="text-sm">hours before</span>
              </div>
            )}
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
              Save Appointment Settings
            </>
          )}
        </ButtonPremium>
      </div>
    </div>
  );
}