'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/components/ui/tooltip';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  User, 
  Mail, 
  Phone,
  Calendar, 
  Package, 
  Clock, 
  CheckCircle,
  ArrowUpRight,
  Activity,
  Smartphone,
  MapPin
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { format } from 'date-fns';

interface CustomerStats {
  totalTickets: number;
  completedTickets: number;
  activeTickets: number;
  totalDevices: number;
  lastVisit?: string;
  totalSpent: number;
}

interface CustomerData {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  created_at?: string;
  customer_type?: string;
}

interface CustomerTooltipProps {
  customerId?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  children: React.ReactNode;
  className?: string;
  showStats?: boolean;
  showProfileLink?: boolean;
}

async function fetchCustomerStats(customerId: string): Promise<CustomerStats> {
  const supabase = createClient();
  
  // Fetch ticket statistics
  const { data: tickets, error: ticketsError } = await supabase
    .from('repair_tickets')
    .select('status, actual_cost, updated_at')
    .eq('customer_id', customerId);

  if (ticketsError || !tickets) {
    return {
      totalTickets: 0,
      completedTickets: 0,
      activeTickets: 0,
      totalDevices: 0,
      totalSpent: 0
    };
  }

  // Fetch customer devices
  const { data: devices } = await supabase
    .from('customer_devices')
    .select('id')
    .eq('customer_id', customerId);

  const completed = tickets.filter(t => t.status === 'completed');
  const active = tickets.filter(t => ['new', 'in_progress', 'on_hold'].includes(t.status));
  
  // Calculate total spent
  const totalSpent = tickets.reduce((total, t) => total + (t.actual_cost || 0), 0);
  
  // Find last visit
  const lastVisit = tickets.length > 0 
    ? tickets.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())[0].updated_at
    : undefined;

  return {
    totalTickets: tickets.length,
    completedTickets: completed.length,
    activeTickets: active.length,
    totalDevices: devices?.length || 0,
    lastVisit,
    totalSpent
  };
}

async function fetchCustomerData(customerId: string): Promise<CustomerData | null> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('customers')
    .select('id, name, email, phone, address, created_at, customer_type')
    .eq('id', customerId)
    .single();
    
  if (error || !data) return null;
  return data;
}

export function CustomerTooltip({
  customerId,
  customerName,
  customerEmail,
  customerPhone,
  children,
  className,
  showStats = true,
  showProfileLink = true
}: CustomerTooltipProps) {
  const [customerData, setCustomerData] = useState<CustomerData | null>(null);
  const [customerStats, setCustomerStats] = useState<CustomerStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen || !customerId) return;
    
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [data, stats] = await Promise.all([
          fetchCustomerData(customerId),
          showStats ? fetchCustomerStats(customerId) : Promise.resolve(null)
        ]);
        setCustomerData(data);
        setCustomerStats(stats);
      } catch (error) {
        console.error('Failed to load customer data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [isOpen, customerId, showStats]);

  // If no customerId, just render children without tooltip
  if (!customerId) {
    return <>{children}</>;
  }

  const displayName = customerData?.name || customerName || 'Unknown Customer';
  const displayEmail = customerData?.email || customerEmail || '';
  const displayPhone = customerData?.phone || customerPhone || '';
  const initials = displayName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip open={isOpen} onOpenChange={setIsOpen}>
        <TooltipTrigger asChild className={className}>
          {children}
        </TooltipTrigger>
        <TooltipContent 
          side="top" 
          align="center" 
          className="w-80 p-0 overflow-hidden border-primary/20 shadow-xl animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95"
          sideOffset={6}
        >
          <div className="relative">
            {/* Header with gradient background */}
            <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-4">
              <div className="flex items-start gap-3">
                <Avatar className="h-12 w-12 border-2 border-background">
                  <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${displayName}`} />
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-sm truncate">{displayName}</h4>
                    {customerData?.customer_type && (
                      <Badge variant="outline" className="text-xs capitalize">
                        {customerData.customer_type}
                      </Badge>
                    )}
                  </div>
                  
                  {displayEmail && (
                    <a 
                      href={`mailto:${displayEmail}`}
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors mt-1"
                    >
                      <Mail className="h-3 w-3" />
                      {displayEmail}
                    </a>
                  )}
                  
                  {displayPhone && (
                    <a 
                      href={`tel:${displayPhone}`}
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors mt-1"
                    >
                      <Phone className="h-3 w-3" />
                      {displayPhone}
                    </a>
                  )}
                  
                  {customerData?.address && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                      <MapPin className="h-3 w-3" />
                      <span className="truncate">{customerData.address}</span>
                    </div>
                  )}
                  
                  {customerData?.created_at && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                      <Calendar className="h-3 w-3" />
                      Customer since {format(new Date(customerData.created_at), 'MMM yyyy')}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Stats Section */}
            {showStats && (
              <div className="p-4 pt-3 border-t bg-card/50">
                {isLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-24" />
                    <div className="grid grid-cols-2 gap-3">
                      <Skeleton className="h-12" />
                      <Skeleton className="h-12" />
                      <Skeleton className="h-12" />
                      <Skeleton className="h-12" />
                    </div>
                  </div>
                ) : customerStats ? (
                  <div className="space-y-3">
                    <h5 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Customer History
                    </h5>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-lg border bg-background/50 p-2">
                        <div className="flex items-center gap-1.5">
                          <Activity className="h-3 w-3 text-blue-500" />
                          <span className="text-xs text-muted-foreground">Active</span>
                        </div>
                        <p className="text-sm font-semibold mt-1">{customerStats.activeTickets}</p>
                      </div>
                      
                      <div className="rounded-lg border bg-background/50 p-2">
                        <div className="flex items-center gap-1.5">
                          <CheckCircle className="h-3 w-3 text-green-500" />
                          <span className="text-xs text-muted-foreground">Completed</span>
                        </div>
                        <p className="text-sm font-semibold mt-1">{customerStats.completedTickets}</p>
                      </div>
                      
                      <div className="rounded-lg border bg-background/50 p-2">
                        <div className="flex items-center gap-1.5">
                          <Smartphone className="h-3 w-3 text-purple-500" />
                          <span className="text-xs text-muted-foreground">Devices</span>
                        </div>
                        <p className="text-sm font-semibold mt-1">{customerStats.totalDevices}</p>
                      </div>
                      
                      <div className="rounded-lg border bg-background/50 p-2">
                        <div className="flex items-center gap-1.5">
                          <Package className="h-3 w-3 text-orange-500" />
                          <span className="text-xs text-muted-foreground">Total Spent</span>
                        </div>
                        <p className="text-sm font-semibold mt-1">{formatCurrency(customerStats.totalSpent)}</p>
                      </div>
                    </div>
                    
                    {customerStats.lastVisit && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-1">
                        <Clock className="h-3 w-3" />
                        Last visit: {format(new Date(customerStats.lastVisit), 'MMM d, yyyy')}
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            )}

          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}