'use client';

import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { 
  User, 
  Phone, 
  Mail, 
  MapPin,
  Calendar,
  Bell,
  History,
  ExternalLink,
  UserCircle
} from 'lucide-react';
import Link from 'next/link';

export interface CustomerData {
  id?: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  previousAppointments?: number;
  notificationPreference?: 'email' | 'sms' | 'both' | 'none';
  createdAt?: string;
}

export interface CustomerDetailCardProps {
  /** Customer data */
  customer: CustomerData;
  /** Whether in edit mode */
  isEditing?: boolean;
  /** Whether the form is locked */
  isLocked?: boolean;
  /** Callback for customer data change */
  onCustomerChange?: (customer: CustomerData) => void;
  /** Custom className */
  className?: string;
}

export const CustomerDetailCard = React.forwardRef<HTMLDivElement, CustomerDetailCardProps>(
  ({ 
    customer,
    isEditing = false,
    isLocked = false,
    onCustomerChange,
    className
  }, ref) => {
    const handleFieldChange = (field: keyof CustomerData, value: any) => {
      if (onCustomerChange && !isLocked) {
        onCustomerChange({
          ...customer,
          [field]: value
        });
      }
    };

    // Format member since date
    const memberSince = React.useMemo(() => {
      if (!customer.createdAt) return null;
      const date = new Date(customer.createdAt);
      return date.toLocaleDateString('en-US', { 
        month: 'short',
        year: 'numeric'
      });
    }, [customer.createdAt]);

    return (
      <div 
        ref={ref}
        className={cn("rounded-lg border bg-card", className)}
      >
        <div className="p-4">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <UserCircle className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h3 className="text-base font-semibold">Customer Information</h3>
                {memberSince && (
                  <p className="text-xs text-muted-foreground">
                    Member since {memberSince}
                  </p>
                )}
              </div>
            </div>
            
            {customer.id && !isEditing && (
              <Link 
                href={`/customers/${customer.id}`}
                className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                View Profile
              </Link>
            )}
          </div>

          {/* Customer Details */}
          <div className="space-y-4">
            {/* Name */}
            <div className="space-y-2">
              <Label className="text-sm flex items-center gap-1">
                <User className="h-3.5 w-3.5" />
                Full Name
              </Label>
              {isEditing && !isLocked ? (
                <Input
                  value={customer.name}
                  onChange={(e) => handleFieldChange('name', e.target.value)}
                  placeholder="Enter customer name"
                />
              ) : (
                <p className="font-medium">{customer.name || 'Not provided'}</p>
              )}
            </div>

            {/* Contact Information */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm flex items-center gap-1">
                  <Phone className="h-3.5 w-3.5" />
                  Phone
                </Label>
                {isEditing && !isLocked ? (
                  <Input
                    type="tel"
                    value={customer.phone}
                    onChange={(e) => handleFieldChange('phone', e.target.value)}
                    placeholder="(555) 123-4567"
                  />
                ) : (
                  <p className="font-medium">
                    {customer.phone ? (
                      <a 
                        href={`tel:${customer.phone}`}
                        className="text-primary hover:underline"
                      >
                        {customer.phone}
                      </a>
                    ) : (
                      'Not provided'
                    )}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-sm flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5" />
                  Email
                </Label>
                {isEditing && !isLocked ? (
                  <Input
                    type="email"
                    value={customer.email}
                    onChange={(e) => handleFieldChange('email', e.target.value)}
                    placeholder="customer@example.com"
                  />
                ) : (
                  <p className="font-medium">
                    {customer.email ? (
                      <a 
                        href={`mailto:${customer.email}`}
                        className="text-primary hover:underline break-all"
                      >
                        {customer.email}
                      </a>
                    ) : (
                      'Not provided'
                    )}
                  </p>
                )}
              </div>
            </div>

            {/* Address */}
            {(isEditing || customer.address) && (
              <div className="space-y-2">
                <Label className="text-sm flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  Address
                </Label>
                {isEditing && !isLocked ? (
                  <div className="space-y-2">
                    <Input
                      value={customer.address || ''}
                      onChange={(e) => handleFieldChange('address', e.target.value)}
                      placeholder="Street address"
                    />
                    <div className="grid grid-cols-3 gap-2">
                      <Input
                        value={customer.city || ''}
                        onChange={(e) => handleFieldChange('city', e.target.value)}
                        placeholder="City"
                      />
                      <Input
                        value={customer.state || ''}
                        onChange={(e) => handleFieldChange('state', e.target.value)}
                        placeholder="State"
                        maxLength={2}
                      />
                      <Input
                        value={customer.zip || ''}
                        onChange={(e) => handleFieldChange('zip', e.target.value)}
                        placeholder="ZIP"
                        maxLength={10}
                      />
                    </div>
                  </div>
                ) : (
                  <p className="font-medium">
                    {customer.address && (
                      <>
                        {customer.address}<br />
                        {customer.city && `${customer.city}, `}
                        {customer.state} {customer.zip}
                      </>
                    )}
                  </p>
                )}
              </div>
            )}

            {/* Notification Preference */}
            <div className="space-y-2">
              <Label className="text-sm flex items-center gap-1">
                <Bell className="h-3.5 w-3.5" />
                Notification Preference
              </Label>
              {isEditing && !isLocked ? (
                <Select
                  value={customer.notificationPreference || 'email'}
                  onValueChange={(value) => handleFieldChange('notificationPreference', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email Only</SelectItem>
                    <SelectItem value="sms">SMS Only</SelectItem>
                    <SelectItem value="both">Email & SMS</SelectItem>
                    <SelectItem value="none">No Notifications</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="capitalize">
                    {customer.notificationPreference || 'email'}
                  </Badge>
                </div>
              )}
            </div>

            {/* Previous Appointments */}
            {customer.previousAppointments !== undefined && customer.previousAppointments > 0 && (
              <div className="pt-3 border-t">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <History className="h-4 w-4" />
                    <span>Previous appointments</span>
                  </div>
                  <Badge variant="outline">{customer.previousAppointments}</Badge>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
);

CustomerDetailCard.displayName = 'CustomerDetailCard';