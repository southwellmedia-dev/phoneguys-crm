import { SettingsClient } from './settings-client';
import { SettingsService } from '@/lib/services/settings.service';
import { requireAuth } from '@/lib/auth/helpers';
import { redirect } from 'next/navigation';

export default async function SettingsPage() {
  // Check admin access
  const authResult = await requireAuth();
  if (!authResult.user) {
    redirect('/auth/login');
  }

  // Use service to fetch settings
  const settingsService = new SettingsService();
  const settings = await settingsService.getAllSettings();

  return (
    <SettingsClient 
      initialBusinessHours={settings.businessHours || []}
      initialStoreSettings={settings.storeSettings}
      initialAppointmentSettings={settings.appointmentSettings}
    />
  );
}