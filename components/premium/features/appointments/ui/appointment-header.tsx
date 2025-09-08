'use client';

import * as React from 'react';
import { StatusBadge } from '@/components/premium/ui/badges/status-badge';
import { ButtonPremium } from '@/components/premium/ui/buttons/button-premium';
import { cn } from '@/lib/utils';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  User,
  Edit,
  Save,
  X,
  FileText,
  CheckCircle,
  XCircle
} from 'lucide-react';
import Link from 'next/link';

export interface AppointmentHeaderProps {
  /** Appointment number */
  appointmentNumber: string;
  /** Appointment status */
  status: 'scheduled' | 'confirmed' | 'arrived' | 'no_show' | 'cancelled' | 'converted';
  /** Scheduled date */
  scheduledDate: string;
  /** Scheduled time */
  scheduledTime: string;
  /** Whether in edit mode */
  isEditing?: boolean;
  /** Whether the appointment is locked (converted/cancelled) */
  isLocked?: boolean;
  /** Callback for edit toggle */
  onEditToggle?: () => void;
  /** Callback for save */
  onSave?: () => void;
  /** Callback for cancel edit */
  onCancelEdit?: () => void;
  /** Whether save is in progress */
  isSaving?: boolean;
  /** Custom className */
  className?: string;
}

export const AppointmentHeader = React.forwardRef<HTMLDivElement, AppointmentHeaderProps>(
  ({ 
    appointmentNumber,
    status,
    scheduledDate,
    scheduledTime,
    isEditing = false,
    isLocked = false,
    onEditToggle,
    onSave,
    onCancelEdit,
    isSaving = false,
    className
  }, ref) => {
    // Format date for display
    const formattedDate = React.useMemo(() => {
      if (!scheduledDate) return '';
      const date = new Date(scheduledDate + 'T00:00:00');
      return date.toLocaleDateString('en-US', { 
        weekday: 'short',
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      });
    }, [scheduledDate]);

    return (
      <div 
        ref={ref}
        className={cn(
          "rounded-lg border bg-card",
          className
        )}
      >
        <div className="p-4">
          {/* Top row with breadcrumb and actions */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Link 
                href="/appointments" 
                className="flex items-center gap-1 hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Appointments
              </Link>
              <span>/</span>
              <span className="text-foreground font-medium">{appointmentNumber}</span>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2">
              {isEditing ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={onCancelEdit}
                    disabled={isSaving}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={onSave}
                    disabled={isSaving}
                    className="text-sm font-medium text-primary hover:text-primary/90 transition-colors flex items-center gap-1"
                  >
                    {isSaving ? (
                      <>
                        <div className="h-3 w-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-3.5 w-3.5" />
                        Save
                      </>
                    )}
                  </button>
                </div>
              ) : (
                !isLocked && (
                  <button
                    onClick={onEditToggle}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
                  >
                    <Edit className="h-3.5 w-3.5" />
                    Edit
                  </button>
                )
              )}
            </div>
          </div>

          {/* Main header content */}
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-lg font-semibold mb-1">
                Appointment {appointmentNumber}
              </h1>
              
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>{formattedDate}</span>
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>{scheduledTime}</span>
                </div>
              </div>
            </div>

            {/* Status badge */}
            <div className="flex flex-col items-end gap-2">
              <StatusBadge
                type="appointment"
                status={status}
                variant="soft"
              />
              
              {status === 'converted' && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <FileText className="h-3 w-3" />
                  Converted to ticket
                </div>
              )}
              
              {isLocked && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <XCircle className="h-3 w-3" />
                  Locked for editing
                </div>
              )}
            </div>
          </div>

          {/* Edit mode indicator */}
          {isEditing && (
            <div className="mt-3 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-md border border-yellow-200 dark:border-yellow-800">
              <div className="flex items-center gap-2 text-xs text-yellow-800 dark:text-yellow-200">
                <Edit className="h-3.5 w-3.5" />
                <span className="font-medium">Edit Mode Active</span>
                <span className="text-yellow-600 dark:text-yellow-400">• Make your changes and click Save when done</span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
);

AppointmentHeader.displayName = 'AppointmentHeader';