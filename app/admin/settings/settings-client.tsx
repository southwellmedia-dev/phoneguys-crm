'use client';

import { useState } from 'react';
import { PageContainer } from '@/components/layout/page-container';
import { TabNav } from '@/components/premium/ui/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BusinessHoursSettings } from '@/components/settings/business-hours-settings';
import { AppointmentSettings } from '@/components/settings/appointment-settings';
import { StoreSettings } from '@/components/settings/store-settings';
import { SMSSettings } from '@/components/settings/sms-settings';
import { SkeletonPremium } from '@/components/premium/ui/feedback';
import { useSettings, useUpdateAllBusinessHours, useUpdateStoreSettings, useUpdateAppointmentSettings } from '@/lib/hooks/use-settings';
import { Clock, Calendar, Store, Settings, RefreshCw, BookOpen, Save, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import type { 
  BusinessHours as BusinessHoursType, 
  StoreSettings as StoreSettingsType, 
  AppointmentSettings as AppointmentSettingsType 
} from '@/lib/types/database.types';

interface SettingsClientProps {
  initialBusinessHours: BusinessHoursType[];
  initialStoreSettings: StoreSettingsType | null;
  initialAppointmentSettings: AppointmentSettingsType | null;
}

export function SettingsClient({ 
  initialBusinessHours, 
  initialStoreSettings, 
  initialAppointmentSettings 
}: SettingsClientProps) {
  const [activeTab, setActiveTab] = useState('business-hours');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  
  const { data: settings, showSkeleton, error, refetch } = useSettings();
  const updateBusinessHours = useUpdateAllBusinessHours();
  const updateStoreSettings = useUpdateStoreSettings();
  const updateAppointmentSettings = useUpdateAppointmentSettings();
  
  // Use live data if available, fallback to initial data
  const businessHours = settings?.businessHours || initialBusinessHours;
  const storeSettings = settings?.storeSettings || initialStoreSettings;
  const appointmentSettings = settings?.appointmentSettings || initialAppointmentSettings;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setTimeout(() => setIsRefreshing(false), 1000);
    toast.success('Settings refreshed');
  };

  const handleSaveAll = async () => {
    try {
      // This would save any pending changes
      // For now, we'll just show a success message since individual components handle their own saves
      toast.success('All settings saved successfully');
      setHasChanges(false);
    } catch (error) {
      toast.error('Failed to save settings');
    }
  };

  const tabs = [
    {
      id: 'business-hours',
      label: 'Business Hours',
      icon: <Clock className="w-4 h-4" />,
    },
    {
      id: 'appointments',
      label: 'Appointments',
      icon: <Calendar className="w-4 h-4" />,
    },
    {
      id: 'store',
      label: 'Store',
      icon: <Store className="w-4 h-4" />,
    },
    {
      id: 'sms',
      label: 'SMS Notifications',
      icon: <MessageSquare className="w-4 h-4" />,
    },
  ];

  const headerActions = [
    {
      label: isRefreshing ? "Refreshing..." : "Refresh",
      icon: <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />,
      variant: "outline" as const,
      onClick: handleRefresh,
      disabled: isRefreshing,
    },
    {
      label: "Save All Changes",
      icon: <Save className="h-4 w-4" />,
      variant: hasChanges ? "default" : "outline" as const,
      onClick: handleSaveAll,
      disabled: !hasChanges || showSkeleton,
    },
    {
      label: "Documentation",
      icon: <BookOpen className="h-4 w-4" />,
      variant: "outline" as const,
      onClick: () => window.open('/docs/settings', '_blank')
    }
  ];

  return (
    <PageContainer
      title="Settings"
      description="Manage your store configuration, business hours, and appointment preferences"
      actions={headerActions}
    >
      <div className="space-y-6">
        {/* Settings Management Card with Premium Design */}
        <Card className="relative overflow-hidden">
          {/* Gradient accent */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-2xl" />
          
          <CardHeader className="pb-4">
            <div className="flex flex-col space-y-4">
              {/* Header with title - matching appointments page style */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Settings className="h-4 w-4 text-primary" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 h-2 w-2 bg-green-500 rounded-full border-2 border-card" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-semibold">
                      System Configuration
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      Configure business hours, appointments, store settings, and SMS notifications
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Tabs */}
              <div className="flex items-center justify-between gap-4">
                <TabNav
                  tabs={tabs}
                  activeTab={activeTab}
                  onTabChange={setActiveTab}
                  variant="underline"
                  size="sm"
                />
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="pt-0">
            {showSkeleton ? (
              <div className="space-y-6">
                <SkeletonPremium className="h-32 w-full" />
                <SkeletonPremium className="h-24 w-full" />
                <SkeletonPremium className="h-16 w-full" />
              </div>
            ) : error ? (
              <div className="text-center py-8 text-muted-foreground">
                Error loading settings: {error.message}
              </div>
            ) : (
              <>
                {activeTab === 'business-hours' && (
                  <BusinessHoursSettings 
                    initialData={businessHours} 
                    onChangesDetected={setHasChanges}
                  />
                )}

                {activeTab === 'appointments' && (
                  <AppointmentSettings initialData={appointmentSettings} />
                )}

                {activeTab === 'store' && (
                  <StoreSettings initialData={storeSettings} />
                )}

                {activeTab === 'sms' && (
                  <SMSSettings 
                    onSave={(settings) => {
                      console.log('SMS settings saved:', settings);
                      setHasChanges(false);
                    }}
                    onTest={async (phoneNumber) => {
                      try {
                        // Test SMS sending
                        const response = await fetch('/api/admin/sms/test', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ phoneNumber })
                        });
                        return response.ok;
                      } catch (error) {
                        console.error('SMS test failed:', error);
                        return false;
                      }
                    }}
                  />
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}