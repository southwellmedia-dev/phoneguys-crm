"use client";

import { useState } from 'react';
import { 
  CardPremium,
  ButtonPremium,
  StatusBadge,
  InputPremium,
  SwitchPremium,
  SelectPremium,
  AlertPremium
} from '@/components/premium';
import { 
  Settings,
  Save,
  RefreshCw,
  Bell,
  Shield,
  Clock,
  Calendar,
  Mail,
  MessageSquare
} from 'lucide-react';

export function IntegrationSettings() {
  const [settings, setSettings] = useState({
    autoConfirmation: true,
    requireApproval: false,
    sendNotifications: true,
    allowWeekends: false,
    allowHolidays: false,
    minLeadTime: '24',
    maxAdvanceBooking: '30',
    defaultDuration: '30',
    confirmationEmail: true,
    reminderEmail: true,
    reminderTime: '24',
    duplicateCheck: true,
    rateLimit: '10',
    captchaEnabled: true
  });

  const handleSave = () => {
    console.log('Saving settings:', settings);
    // Save to API
  };

  return (
    <div className="space-y-6">
      {/* Booking Rules */}
      <CardPremium
        title="Booking Rules"
        description="Configure how appointments can be scheduled"
        variant="default"
        actions={
          <ButtonPremium
            variant="default"
            size="sm"
            icon={<Save className="h-4 w-4" />}
            onClick={handleSave}
          >
            Save Changes
          </ButtonPremium>
        }
      >
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Minimum Lead Time</label>
              <SelectPremium
                value={settings.minLeadTime}
                onChange={(value) => setSettings({ ...settings, minLeadTime: value })}
                options={[
                  { value: '0', label: 'No minimum', description: 'Allow immediate bookings' },
                  { value: '2', label: '2 hours', description: 'Require 2 hours notice' },
                  { value: '24', label: '24 hours', description: 'Require 1 day notice' },
                  { value: '48', label: '48 hours', description: 'Require 2 days notice' },
                ]}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Maximum Advance Booking</label>
              <SelectPremium
                value={settings.maxAdvanceBooking}
                onChange={(value) => setSettings({ ...settings, maxAdvanceBooking: value })}
                options={[
                  { value: '7', label: '1 week' },
                  { value: '14', label: '2 weeks' },
                  { value: '30', label: '1 month' },
                  { value: '60', label: '2 months' },
                  { value: '90', label: '3 months' },
                ]}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Default Appointment Duration</label>
              <SelectPremium
                value={settings.defaultDuration}
                onChange={(value) => setSettings({ ...settings, defaultDuration: value })}
                options={[
                  { value: '15', label: '15 minutes' },
                  { value: '30', label: '30 minutes' },
                  { value: '45', label: '45 minutes' },
                  { value: '60', label: '1 hour' },
                  { value: '90', label: '1.5 hours' },
                  { value: '120', label: '2 hours' },
                ]}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Reminder Time</label>
              <SelectPremium
                value={settings.reminderTime}
                onChange={(value) => setSettings({ ...settings, reminderTime: value })}
                options={[
                  { value: '0', label: 'No reminder' },
                  { value: '2', label: '2 hours before' },
                  { value: '24', label: '24 hours before' },
                  { value: '48', label: '48 hours before' },
                ]}
              />
            </div>
          </div>

          <div className="space-y-4">
            <SwitchPremium
              checked={settings.allowWeekends}
              onCheckedChange={(checked) => setSettings({ ...settings, allowWeekends: checked })}
              label="Allow Weekend Appointments"
              description="Accept bookings for Saturday and Sunday"
            />

            <SwitchPremium
              checked={settings.allowHolidays}
              onCheckedChange={(checked) => setSettings({ ...settings, allowHolidays: checked })}
              label="Allow Holiday Bookings"
              description="Accept bookings on public holidays"
            />

            <SwitchPremium
              checked={settings.requireApproval}
              onCheckedChange={(checked) => setSettings({ ...settings, requireApproval: checked })}
              label="Require Manual Approval"
              description="All appointments must be approved by staff before confirmation"
              variant="warning"
            />
          </div>
        </div>
      </CardPremium>

      {/* Notifications */}
      <CardPremium
        title="Notification Settings"
        description="Configure automated emails and alerts"
        variant="default"
      >
        <div className="space-y-4">
          <SwitchPremium
            checked={settings.sendNotifications}
            onCheckedChange={(checked) => setSettings({ ...settings, sendNotifications: checked })}
            label="Enable Notifications"
            description="Send automated notifications for appointments"
            icon={<Bell className="h-4 w-4" />}
          />

          <SwitchPremium
            checked={settings.confirmationEmail}
            onCheckedChange={(checked) => setSettings({ ...settings, confirmationEmail: checked })}
            label="Confirmation Emails"
            description="Send confirmation email immediately after booking"
            icon={<Mail className="h-4 w-4" />}
            disabled={!settings.sendNotifications}
          />

          <SwitchPremium
            checked={settings.reminderEmail}
            onCheckedChange={(checked) => setSettings({ ...settings, reminderEmail: checked })}
            label="Reminder Emails"
            description="Send reminder email before appointment"
            icon={<Clock className="h-4 w-4" />}
            disabled={!settings.sendNotifications}
          />

          <AlertPremium
            variant="info"
            title="Email Templates"
          >
            Customize your email templates in the Email Settings section of your admin panel.
          </AlertPremium>
        </div>
      </CardPremium>

      {/* Security */}
      <CardPremium
        title="Security & Spam Prevention"
        description="Protect your form from abuse and spam"
        variant="default"
      >
        <div className="space-y-4">
          <SwitchPremium
            checked={settings.captchaEnabled}
            onCheckedChange={(checked) => setSettings({ ...settings, captchaEnabled: checked })}
            label="Enable reCAPTCHA"
            description="Require users to complete a CAPTCHA challenge"
            icon={<Shield className="h-4 w-4" />}
            variant="success"
          />

          <SwitchPremium
            checked={settings.duplicateCheck}
            onCheckedChange={(checked) => setSettings({ ...settings, duplicateCheck: checked })}
            label="Duplicate Prevention"
            description="Prevent the same email from booking multiple appointments in a short time"
          />

          <div className="space-y-2">
            <label className="text-sm font-medium">Rate Limiting</label>
            <div className="flex items-center gap-3">
              <InputPremium
                type="number"
                value={settings.rateLimit}
                onChange={(e) => setSettings({ ...settings, rateLimit: e.target.value })}
                className="w-24"
              />
              <span className="text-sm text-muted-foreground">submissions per IP per hour</span>
            </div>
          </div>

          <AlertPremium
            variant="warning"
            title="Security Note"
          >
            These settings help prevent spam but may also affect legitimate users. Monitor your form analytics to find the right balance.
          </AlertPremium>
        </div>
      </CardPremium>

      {/* Auto-Response */}
      <CardPremium
        title="Auto-Response Messages"
        description="Customize automatic messages sent to customers"
        variant="default"
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Confirmation Message</label>
            <textarea
              className="w-full p-3 text-sm border rounded-lg resize-none"
              rows={3}
              placeholder="Thank you for scheduling your appointment. We'll see you on {date} at {time}."
              defaultValue="Thank you for scheduling your appointment. We'll see you on {date} at {time}. Your appointment number is {appointment_number}."
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Reminder Message</label>
            <textarea
              className="w-full p-3 text-sm border rounded-lg resize-none"
              rows={3}
              placeholder="This is a reminder about your appointment tomorrow at {time}."
              defaultValue="This is a reminder about your appointment on {date} at {time}. Please bring your device and charger if available."
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <MessageSquare className="h-3 w-3" />
            <span>Available variables: {'{date}'}, {'{time}'}, {'{appointment_number}'}, {'{customer_name}'}</span>
          </div>
        </div>
      </CardPremium>

      {/* Test Configuration */}
      <CardPremium
        title="Test Your Configuration"
        description="Send a test appointment to verify your settings"
        variant="ghost"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              Submit a test appointment to see how your form works with current settings.
            </p>
          </div>
          <ButtonPremium
            variant="gradient"
            icon={<RefreshCw className="h-4 w-4" />}
          >
            Send Test Appointment
          </ButtonPremium>
        </div>
      </CardPremium>
    </div>
  );
}