'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ButtonPremium } from '@/components/premium/ui/buttons/button-premium';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  User, 
  Mail, 
  Phone, 
  Calendar,
  Smartphone,
  Shield,
  AlertCircle,
  CheckCircle2,
  Package,
  Wrench,
  Hash,
  Palette,
  HardDrive,
  Star,
  Clock,
  ChevronRight,
  Plus,
  Edit,
  ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import Image from 'next/image';

interface CustomerDeviceCardProps {
  customer: {
    id?: string;
    name?: string;
    email?: string;
    phone?: string;
    previousAppointments?: number;
    totalRepairs?: number;
    memberSince?: string;
    notificationPreference?: string;
    currentTicket?: {
      number: string;
      status: string;
      device: string;
    };
  };
  device: {
    id?: string;
    modelName?: string;
    manufacturer?: string;
    imageUrl?: string;
    thumbnailUrl?: string;
    serialNumber?: string;
    imei?: string;
    color?: string;
    storageSize?: string;
    condition?: string;
    issues?: string[];
    nickname?: string;
  };
  isInProfile?: boolean;
  showAddToProfile?: boolean;
  onAddToProfile?: () => void;
  onEditCustomer?: () => void;
  onEditDevice?: () => void;
  isEditing?: boolean;
  isLocked?: boolean;
  className?: string;
}

export function CustomerDeviceCard({
  customer = {},
  device = {},
  isInProfile = false,
  showAddToProfile = false,
  onAddToProfile,
  onEditCustomer,
  onEditDevice,
  isEditing = false,
  isLocked = false,
  className
}: CustomerDeviceCardProps) {
  
  const router = useRouter();
  const [imageError, setImageError] = useState(false);
  
  // Get customer initials for avatar
  const getInitials = (name?: string) => {
    if (!name) return 'C';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };
  
  // Format member since date
  const memberDuration = customer.memberSince 
    ? formatDistanceToNow(new Date(customer.memberSince), { addSuffix: false })
    : null;
  
  // Get condition color
  const getConditionColor = (condition?: string) => {
    switch (condition?.toLowerCase()) {
      case 'excellent':
      case 'good':
        return 'text-green-600 bg-green-50 dark:bg-green-950/20';
      case 'fair':
        return 'text-amber-600 bg-amber-50 dark:bg-amber-950/20';
      case 'poor':
        return 'text-red-600 bg-red-50 dark:bg-red-950/20';
      default:
        return 'text-gray-600 bg-gray-50 dark:bg-gray-950/20';
    }
  };
  
  // Get device image URL
  const deviceImage = device.thumbnailUrl || device.imageUrl;
  const shouldShowImage = deviceImage && !imageError;
  
  return (
    <Card className={cn("overflow-hidden border border-gray-200 dark:border-gray-700", className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-semibold">Customer & Device Information</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {isInProfile && (
              <Badge variant="outline" className="text-xs bg-green-50 dark:bg-green-950/20 text-green-600 border-green-200">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                In Profile
              </Badge>
            )}
            {customer.currentTicket && (
              <Badge variant="secondary" className="text-xs">
                {customer.currentTicket.number}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="grid lg:grid-cols-2 divide-x divide-gray-200 dark:divide-gray-700">
          
          {/* Customer Section */}
          <div className="p-6">
            <div className="space-y-4">
              {/* Customer Header */}
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={`https://avatar.vercel.sh/${customer.email || 'customer'}.png`} />
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                    {getInitials(customer.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="font-semibold text-base">{customer.name || 'Unknown Customer'}</h3>
                  {memberDuration && (
                    <p className="text-xs text-muted-foreground">Customer for {memberDuration}</p>
                  )}
                </div>
                {onEditCustomer && !isLocked && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={onEditCustomer}
                    className="h-7 w-7 p-0"
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                )}
              </div>
              
              {/* Contact Info */}
              <div className="space-y-2">
                {customer.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-3 w-3 text-muted-foreground" />
                    <a href={`mailto:${customer.email}`} className="text-primary hover:underline">
                      {customer.email}
                    </a>
                  </div>
                )}
                {customer.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-3 w-3 text-muted-foreground" />
                    <a href={`tel:${customer.phone}`} className="text-primary hover:underline">
                      {customer.phone}
                    </a>
                  </div>
                )}
              </div>
              
              {/* Customer Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-2 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Appointments</span>
                  </div>
                  <p className="text-lg font-semibold mt-1">{customer.previousAppointments || 0}</p>
                </div>
                <div className="p-2 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-1.5">
                    <Wrench className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Total Repairs</span>
                  </div>
                  <p className="text-lg font-semibold mt-1">{customer.totalRepairs || 0}</p>
                </div>
              </div>
              
              {/* View Profile Button */}
              {customer.id && (
                <ButtonPremium
                  onClick={() => router.push(`/customers/${customer.id}`)}
                  variant="default"
                  size="sm"
                  className="w-full"
                >
                  <ExternalLink className="h-3 w-3 mr-1.5" />
                  View Full Profile
                </ButtonPremium>
              )}
              
              {/* Loyalty Status */}
              {customer.totalRepairs && customer.totalRepairs >= 5 && (
                <div className="p-2 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-amber-600" />
                    <span className="text-xs font-medium text-amber-900 dark:text-amber-100">
                      Loyal Customer
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Device Section */}
          <div className="p-6">
            <div className="space-y-4">
              {/* Device Header */}
              <div className="flex items-start gap-3">
                {shouldShowImage ? (
                  <div className="relative h-12 w-12 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden flex-shrink-0">
                    <Image
                      src={deviceImage}
                      alt={device.modelName || 'Device'}
                      fill
                      className="object-contain p-1"
                      onError={() => setImageError(true)}
                    />
                  </div>
                ) : (
                  <div className="h-12 w-12 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                    <Smartphone className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="font-semibold text-base">
                    {device.modelName || 'Unknown Device'}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {device.manufacturer || 'Unknown Brand'}
                  </p>
                  {device.nickname && (
                    <p className="text-xs text-primary mt-0.5">"{device.nickname}"</p>
                  )}
                </div>
                {onEditDevice && !isLocked && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={onEditDevice}
                    className="h-7 w-7 p-0"
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                )}
              </div>
              
              {/* Device Details */}
              <div className="space-y-2">
                {device.serialNumber && (
                  <div className="flex items-center gap-2 text-sm">
                    <Hash className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground">Serial:</span>
                    <span className="font-mono text-xs">{device.serialNumber}</span>
                  </div>
                )}
                {device.imei && (
                  <div className="flex items-center gap-2 text-sm">
                    <Shield className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground">IMEI:</span>
                    <span className="font-mono text-xs">{device.imei}</span>
                  </div>
                )}
                {(device.color || device.storageSize) && (
                  <div className="flex items-center gap-3 text-sm">
                    {device.color && (
                      <div className="flex items-center gap-1">
                        <Palette className="h-3 w-3 text-muted-foreground" />
                        <span>{device.color}</span>
                      </div>
                    )}
                    {device.storageSize && (
                      <div className="flex items-center gap-1">
                        <HardDrive className="h-3 w-3 text-muted-foreground" />
                        <span>{device.storageSize}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {/* Device Condition */}
              {device.condition && (
                <div className={cn(
                  "inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium",
                  getConditionColor(device.condition)
                )}>
                  <Package className="h-3 w-3" />
                  {device.condition.charAt(0).toUpperCase() + device.condition.slice(1)} Condition
                </div>
              )}
              
              {/* Issues */}
              {device.issues && device.issues.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground font-medium">Reported Issues:</p>
                  <div className="flex flex-wrap gap-1">
                    {device.issues.slice(0, 3).map((issue, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {issue}
                      </Badge>
                    ))}
                    {device.issues.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{device.issues.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}
              
              {/* Add to Profile Button */}
              {showAddToProfile && !isInProfile && onAddToProfile && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onAddToProfile}
                  className="w-full"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Device to Profile
                </Button>
              )}
              
              {/* Device Status in Profile */}
              {isInProfile && (
                <div className="p-2 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-xs font-medium text-green-900 dark:text-green-100">
                      Device saved to customer profile
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
          
        </div>
      </CardContent>
    </Card>
  );
}