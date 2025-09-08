/**
 * StatusBadgeLive - Real-time status badge component
 * 
 * @description Connected version of StatusBadge that updates automatically
 * @category Connected/Badges
 * 
 * @example
 * ```tsx
 * <StatusBadgeLive
 *   resourceType="ticket"
 *   resourceId="123"
 *   fallbackStatus="pending"
 * />
 * ```
 */

'use client';

import * as React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { StatusBadge, type StatusBadgeProps } from '@/components/premium/ui/badges/status-badge';
import { SkeletonPremium } from '@/components/premium/ui/feedback/skeleton-premium';
import { useState, useEffect } from 'react';

export interface StatusBadgeLiveProps extends Omit<StatusBadgeProps, 'status'> {
  /** Type of resource (ticket, appointment, etc.) */
  resourceType: 'ticket' | 'appointment' | 'customer';
  /** ID of the resource */
  resourceId: string;
  /** Fallback status while loading */
  fallbackStatus?: StatusBadgeProps['status'];
  /** Show skeleton instead of fallback status */
  showSkeleton?: boolean;
  /** Custom status field path (e.g., 'repair_status' instead of 'status') */
  statusField?: string;
}

/**
 * Maps database status values to StatusBadge status props
 */
function mapDatabaseStatus(
  resourceType: string, 
  dbStatus: string
): StatusBadgeProps['status'] {
  switch (resourceType) {
    case 'ticket':
      switch (dbStatus) {
        case 'new': return 'new';
        case 'in_progress': return 'inProgress';
        case 'on_hold': return 'onHold';
        case 'completed': return 'completed';
        case 'cancelled': return 'cancelled';
        default: return 'inactive';
      }
    
    case 'appointment':
      switch (dbStatus) {
        case 'scheduled': return 'scheduled';
        case 'confirmed': return 'confirmed';
        case 'arrived': return 'arrived';
        case 'no_show': return 'no_show';
        case 'converted': return 'converted';
        case 'cancelled': return 'cancelled';
        default: return 'inactive';
      }
    
    case 'customer':
    default:
      switch (dbStatus) {
        case 'active': return 'active';
        case 'inactive': return 'inactive';
        default: return 'inactive';
      }
  }
}

export const StatusBadgeLive = React.forwardRef<HTMLSpanElement, StatusBadgeLiveProps>(
  ({ 
    resourceType,
    resourceId,
    fallbackStatus = 'inactive',
    showSkeleton = false,
    statusField = 'status',
    ...props 
  }, ref) => {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
      setIsMounted(true);
    }, []);

    const { data, isLoading, error } = useQuery({
      queryKey: [resourceType, resourceId, 'status'],
      queryFn: async () => {
        let endpoint = '';
        switch (resourceType) {
          case 'ticket':
            endpoint = `/api/orders/${resourceId}/status`;
            break;
          case 'appointment':
            endpoint = `/api/appointments/${resourceId}/status`;
            break;
          case 'customer':
            endpoint = `/api/customers/${resourceId}/status`;
            break;
          default:
            throw new Error(`Unsupported resource type: ${resourceType}`);
        }

        const response = await fetch(endpoint);
        if (!response.ok) {
          throw new Error(`Failed to fetch ${resourceType} status`);
        }
        
        const result = await response.json();
        return result[statusField] || result.status;
      },
      enabled: isMounted && !!resourceId,
      staleTime: 30 * 1000, // 30 seconds - status updates should be quick
      refetchOnWindowFocus: false,
      retry: 1, // Don't retry too much for status checks
    });

    // Show skeleton during initial load
    if (!isMounted || (isLoading && showSkeleton)) {
      return (
        <SkeletonPremium 
          variant="default"
          className="h-5 w-16 rounded-full" 
        />
      );
    }

    // Use fallback status on error or while loading
    const displayStatus = error || isLoading 
      ? fallbackStatus 
      : mapDatabaseStatus(resourceType, data);

    return (
      <StatusBadge
        ref={ref}
        {...props}
        status={displayStatus}
      />
    );
  }
);

StatusBadgeLive.displayName = 'StatusBadgeLive';

// Convenience components for specific resource types
export const TicketStatusLive = (props: Omit<StatusBadgeLiveProps, 'resourceType'>) => (
  <StatusBadgeLive resourceType="ticket" {...props} />
);

export const AppointmentStatusLive = (props: Omit<StatusBadgeLiveProps, 'resourceType'>) => (
  <StatusBadgeLive resourceType="appointment" {...props} />
);

export const CustomerStatusLive = (props: Omit<StatusBadgeLiveProps, 'resourceType'>) => (
  <StatusBadgeLive resourceType="customer" {...props} />
);