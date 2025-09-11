'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ButtonPremium } from '@/components/premium/ui/buttons/button-premium';
import { 
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Clock,
  Star,
  ExternalLink,
  Bell,
  Package
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export interface CustomerData {
  id?: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  avatar?: string;
  notificationPreference?: 'email' | 'sms' | 'phone' | 'none';
  createdAt?: string;
  previousAppointments?: number;
  totalRepairs?: number;
  memberSince?: string;
  loyaltyTier?: 'bronze' | 'silver' | 'gold' | 'platinum';
}

export interface CustomerInfoCardProps {
  customer: CustomerData;
  isEditing?: boolean;
  isLocked?: boolean;
  onCustomerEdit?: () => void;
  className?: string;
}

export function CustomerInfoCard({
  customer,
  isEditing = false,
  isLocked = false,
  onCustomerEdit,
  className
}: CustomerInfoCardProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getNotificationIcon = (preference?: string) => {
    switch (preference) {
      case 'email':
        return <Mail className="h-3 w-3" />;
      case 'sms':
      case 'phone':
        return <Phone className="h-3 w-3" />;
      default:
        return <Bell className="h-3 w-3" />;
    }
  };

  const getLoyaltyColor = (tier?: string) => {
    switch (tier) {
      case 'platinum':
        return 'text-purple-600 dark:text-purple-400';
      case 'gold':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'silver':
        return 'text-gray-600 dark:text-gray-400';
      default:
        return 'text-orange-600 dark:text-orange-400';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      year: 'numeric' 
    });
  };

  return (
    <Card className={cn(
      "border border-gray-200 dark:border-gray-700",
      className
    )}>
      <CardContent className="p-4 space-y-4">
        {/* Customer Identity */}
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={customer.avatar} />
              <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                {getInitials(customer.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <div className="font-medium text-sm truncate">{customer.name}</div>
                {customer.loyaltyTier && (
                  <Star className={cn("h-3.5 w-3.5", getLoyaltyColor(customer.loyaltyTier))} />
                )}
              </div>
              {customer.email && (
                <div className="text-xs text-muted-foreground truncate">{customer.email}</div>
              )}
            </div>
          </div>
          {customer.id && !isEditing && !isLocked && (
            <Link 
              href={`/customers/${customer.id}`}
              className="text-xs font-medium text-primary hover:text-primary/90 transition-colors flex items-center gap-1"
            >
              <ExternalLink className="h-3 w-3" />
            </Link>
          )}
        </div>

        {/* Contact Information */}
        <div className="space-y-2 pt-3 border-t">
          {customer.phone && (
            <div className="flex items-center gap-2">
              <Phone className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs">{customer.phone}</span>
            </div>
          )}
          {customer.email && (
            <div className="flex items-center gap-2">
              <Mail className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs truncate">{customer.email}</span>
            </div>
          )}
          {(customer.address || customer.city) && (
            <div className="flex items-start gap-2">
              <MapPin className="h-3.5 w-3.5 text-muted-foreground mt-0.5" />
              <div className="text-xs">
                {customer.address && <div>{customer.address}</div>}
                {customer.city && (
                  <div>{customer.city}{customer.state ? `, ${customer.state}` : ''} {customer.zip}</div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Customer Stats */}
        <div className="grid grid-cols-2 gap-3 pt-3 border-t">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>Appointments</span>
            </div>
            <div className="font-medium text-sm">
              {customer.previousAppointments || 0}
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Package className="h-3 w-3" />
              <span>Repairs</span>
            </div>
            <div className="font-medium text-sm">
              {customer.totalRepairs || 0}
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>Member Since</span>
            </div>
            <div className="font-medium text-sm">
              {formatDate(customer.memberSince || customer.createdAt)}
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              {getNotificationIcon(customer.notificationPreference)}
              <span>Notify Via</span>
            </div>
            <div className="font-medium text-sm capitalize">
              {customer.notificationPreference || 'Email'}
            </div>
          </div>
        </div>

        {/* Loyalty Status */}
        {customer.loyaltyTier && (
          <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50">
            <span className="text-xs text-muted-foreground">Loyalty Status</span>
            <Badge variant="outline" className="text-xs capitalize">
              <Star className={cn("h-3 w-3 mr-1", getLoyaltyColor(customer.loyaltyTier))} />
              {customer.loyaltyTier}
            </Badge>
          </div>
        )}

        {/* Edit Button */}
        {!isLocked && !isEditing && onCustomerEdit && (
          <ButtonPremium
            onClick={onCustomerEdit}
            variant="outline"
            size="sm"
            className="w-full"
          >
            Edit Customer Information
          </ButtonPremium>
        )}
      </CardContent>
    </Card>
  );
}