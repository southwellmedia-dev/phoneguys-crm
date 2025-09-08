'use client';

import * as React from 'react';
import { ButtonPremium } from '@/components/premium/ui/buttons/button-premium';
import { cn } from '@/lib/utils';
import { 
  ArrowRight,
  CheckCircle,
  XCircle,
  User,
  FileText,
  Clock,
  X
} from 'lucide-react';

export interface ActionToolbarProps {
  /** Current appointment status */
  status: 'scheduled' | 'confirmed' | 'arrived' | 'no_show' | 'cancelled' | 'converted';
  /** Whether the appointment is locked */
  isLocked?: boolean;
  /** Callback for confirm action */
  onConfirm?: () => void;
  /** Callback for mark arrived action */
  onMarkArrived?: () => void;
  /** Callback for cancel action */
  onCancel?: () => void;
  /** Callback for convert to ticket action */
  onConvertToTicket?: () => void;
  /** Loading states for actions */
  loading?: {
    confirm?: boolean;
    arrived?: boolean;
    cancel?: boolean;
    convert?: boolean;
  };
  /** Custom className */
  className?: string;
  /** Sticky positioning */
  sticky?: boolean;
}

export const ActionToolbar = React.forwardRef<HTMLDivElement, ActionToolbarProps>(
  ({ 
    status,
    isLocked = false,
    onConfirm,
    onMarkArrived,
    onCancel,
    onConvertToTicket,
    loading = {},
    className,
    sticky = true
  }, ref) => {
    // Determine available actions based on status
    const canConfirm = status === 'scheduled' && !isLocked;
    const canMarkArrived = status === 'confirmed' && !isLocked;
    const canCancel = (status === 'scheduled' || status === 'confirmed') && !isLocked;
    const canConvert = (status === 'scheduled' || status === 'confirmed' || status === 'arrived') && !isLocked;
    const isConverted = status === 'converted';

    // Don't show toolbar if no actions available
    if (!canConfirm && !canMarkArrived && !canCancel && !canConvert && !isConverted) {
      return null;
    }

    return (
      <div 
        ref={ref}
        className={cn(
          "bg-background/95 backdrop-blur-sm border-t",
          sticky && "sticky bottom-0 z-40",
          className
        )}
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Status indicator */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {isConverted ? (
                <>
                  <FileText className="h-4 w-4 text-cyan-600" />
                  <span>This appointment has been converted to a ticket</span>
                </>
              ) : status === 'cancelled' ? (
                <>
                  <XCircle className="h-4 w-4 text-red-600" />
                  <span>This appointment has been cancelled</span>
                </>
              ) : status === 'no_show' ? (
                <>
                  <X className="h-4 w-4 text-orange-600" />
                  <span>Customer did not show up</span>
                </>
              ) : (
                <>
                  <Clock className="h-4 w-4" />
                  <span>Select an action to proceed</span>
                </>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2">
              {canCancel && (
                <ButtonPremium
                  variant="outline"
                  size="sm"
                  onClick={onCancel}
                  loading={loading.cancel}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <XCircle className="h-4 w-4 mr-1.5" />
                  Cancel Appointment
                </ButtonPremium>
              )}

              {canConfirm && (
                <ButtonPremium
                  variant="soft"
                  size="sm"
                  onClick={onConfirm}
                  loading={loading.confirm}
                  className="text-green-600"
                >
                  <CheckCircle className="h-4 w-4 mr-1.5" />
                  Confirm Appointment
                </ButtonPremium>
              )}

              {canMarkArrived && (
                <ButtonPremium
                  variant="soft"
                  size="sm"
                  onClick={onMarkArrived}
                  loading={loading.arrived}
                  className="text-blue-600"
                >
                  <User className="h-4 w-4 mr-1.5" />
                  Mark as Arrived
                </ButtonPremium>
              )}

              {canConvert && (
                <ButtonPremium
                  variant="gradient"
                  size="sm"
                  onClick={onConvertToTicket}
                  loading={loading.convert}
                >
                  <ArrowRight className="h-4 w-4 mr-1.5" />
                  Convert to Ticket
                </ButtonPremium>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
);

ActionToolbar.displayName = 'ActionToolbar';