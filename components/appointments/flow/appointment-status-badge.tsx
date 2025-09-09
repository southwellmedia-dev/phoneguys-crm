'use client';

import { StatusBadge } from '@/components/premium/ui/badges/status-badge';

export type AppointmentStatus = 'scheduled' | 'confirmed' | 'arrived' | 'no_show' | 'cancelled' | 'converted';

interface AppointmentStatusBadgeProps {
  status: AppointmentStatus;
  showIcon?: boolean;
  className?: string;
}

/**
 * Color-coded status badge for appointments
 * Uses the premium StatusBadge component with appointment-specific styling
 */
export function AppointmentStatusBadge({ 
  status, 
  showIcon = true,
  className 
}: AppointmentStatusBadgeProps) {
  const statusConfig: Record<AppointmentStatus, {
    variant: 'info' | 'success' | 'primary' | 'warning' | 'inactive' | 'default';
    label: string;
    icon?: string;
  }> = {
    scheduled: {
      variant: 'info',
      label: 'Scheduled',
      icon: '📅'
    },
    confirmed: {
      variant: 'success',
      label: 'Confirmed',
      icon: '✅'
    },
    arrived: {
      variant: 'primary', // cyan brand color
      label: 'Arrived',
      icon: '👋'
    },
    converted: {
      variant: 'success',
      label: 'Converted',
      icon: '🎯'
    },
    cancelled: {
      variant: 'inactive',
      label: 'Cancelled',
      icon: '❌'
    },
    no_show: {
      variant: 'warning',
      label: 'No Show',
      icon: '⚠️'
    }
  };

  const config = statusConfig[status];

  return (
    <StatusBadge
      status={config.label}
      variant={config.variant}
      className={className}
    >
      {showIcon && config.icon && (
        <span className="mr-1">{config.icon}</span>
      )}
      {config.label}
    </StatusBadge>
  );
}