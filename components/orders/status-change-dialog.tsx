"use client";

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, Clock, Pause, XCircle, FileX } from 'lucide-react';

type TicketStatus = 'new' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled';

interface StatusChangeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: (newStatus: TicketStatus, reason?: string) => void;
  currentStatus: TicketStatus | string | undefined | null;
  ticketId: string;
  ticketNumber?: string;
  customerName?: string;
}

const statusConfig = {
  new: {
    label: 'New',
    icon: FileX,
    color: 'bg-blue-500',
    description: 'Ticket has been created but work has not started'
  },
  in_progress: {
    label: 'In Progress',
    icon: Clock,
    color: 'bg-yellow-500',
    description: 'Work is currently being performed on this ticket'
  },
  on_hold: {
    label: 'On Hold',
    icon: Pause,
    color: 'bg-orange-500',
    description: 'Work is temporarily paused (waiting for parts, customer response, etc.)'
  },
  completed: {
    label: 'Completed',
    icon: CheckCircle2,
    color: 'bg-green-500',
    description: 'All work has been completed successfully'
  },
  cancelled: {
    label: 'Cancelled',
    icon: XCircle,
    color: 'bg-red-500',
    description: 'Ticket has been cancelled (customer request, not repairable, etc.)'
  }
} as const;

// Define valid status transitions
const statusTransitions: Record<TicketStatus, TicketStatus[]> = {
  new: ['in_progress', 'cancelled'],
  in_progress: ['on_hold', 'completed', 'cancelled'],
  on_hold: ['in_progress', 'completed', 'cancelled'],
  completed: ['on_hold'], // Allow reopening completed tickets
  cancelled: [] // Cancelled tickets cannot be changed
};

export function StatusChangeDialog({
  isOpen,
  onClose,
  onConfirm,
  currentStatus,
  ticketId,
  ticketNumber,
  customerName
}: StatusChangeDialogProps) {
  const [selectedStatus, setSelectedStatus] = useState<TicketStatus | ''>('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      setSelectedStatus('');
      setReason('');
      setError(null);
    }
  }, [isOpen]);

  // Get available status options
  const availableStatuses = (currentStatus && currentStatus in statusTransitions) 
    ? statusTransitions[currentStatus as TicketStatus] 
    : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedStatus) {
      setError('Please select a new status.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/orders/${ticketId}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: selectedStatus,
          reason: reason.trim() || undefined
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to update status');
      }

      onConfirm?.(selectedStatus as TicketStatus, reason.trim() || undefined);
      onClose();
    } catch (error: any) {
      setError(error.message || 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (!isSubmitting) {
      setSelectedStatus('');
      setReason('');
      setError(null);
      onClose();
    }
  };

  const getCurrentStatusConfig = () => {
    // Default config for invalid/undefined status
    const defaultConfig = {
      label: 'Unknown',
      icon: AlertCircle,
      color: 'bg-gray-500',
      description: 'Unknown status'
    };
    
    if (!currentStatus || !(currentStatus in statusConfig)) {
      console.warn(`Invalid currentStatus: "${currentStatus}"`);
      return defaultConfig;
    }
    
    return statusConfig[currentStatus];
  };
  
  const getSelectedStatusConfig = () => selectedStatus ? statusConfig[selectedStatus as TicketStatus] : null;

  const requiresReason = selectedStatus === 'on_hold' || selectedStatus === 'cancelled';

  return (
    <Dialog open={isOpen} onOpenChange={() => !isSubmitting && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Change Status
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Ticket Summary */}
          <div className="bg-muted/30 rounded-lg p-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Order:</span>
              <span className="font-medium">
                {ticketNumber || (ticketId ? `#${ticketId.slice(-8)}` : 'Unknown')}
              </span>
            </div>
            {customerName && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Customer:</span>
                <span className="font-medium">{customerName}</span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Current Status:</span>
              <Badge variant="secondary" className="gap-1">
                {React.createElement(getCurrentStatusConfig().icon, { className: "h-3 w-3" })}
                {getCurrentStatusConfig().label}
              </Badge>
            </div>
          </div>

          {/* Status Selection */}
          <div className="space-y-2">
            <Label htmlFor="new-status">
              New Status <span className="text-destructive">*</span>
            </Label>
            {availableStatuses.length === 0 ? (
              <div className="p-3 bg-muted/50 border border-dashed rounded-lg text-center">
                <p className="text-sm text-muted-foreground">
                  No status changes available for {getCurrentStatusConfig().label.toLowerCase()} tickets.
                </p>
              </div>
            ) : (
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select new status..." />
                </SelectTrigger>
                <SelectContent>
                  {availableStatuses.map((status) => {
                    const config = statusConfig[status];
                    return (
                      <SelectItem key={status} value={status}>
                        <div className="flex items-center gap-2">
                          {React.createElement(config.icon, { className: "h-4 w-4" })}
                          <span>{config.label}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            )}
            
            {/* Status Description */}
            {getSelectedStatusConfig() && (
              <p className="text-xs text-muted-foreground">
                {getSelectedStatusConfig()!.description}
              </p>
            )}
          </div>

          {/* Reason Input */}
          <div className="space-y-2">
            <Label htmlFor="reason">
              Reason {requiresReason && <span className="text-destructive">*</span>}
              {!requiresReason && <span className="text-muted-foreground">(optional)</span>}
            </Label>
            <Textarea
              id="reason"
              placeholder={
                selectedStatus === 'on_hold' 
                  ? "Why is this ticket being put on hold? (e.g., waiting for parts, customer response)"
                  : selectedStatus === 'cancelled'
                  ? "Why is this ticket being cancelled? (e.g., customer request, not repairable)"
                  : "Optional notes about this status change..."
              }
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              disabled={isSubmitting}
              className={error && requiresReason && !reason.trim() ? 'border-destructive' : ''}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0" />
              <span className="text-sm text-destructive">{error}</span>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                isSubmitting || 
                !selectedStatus || 
                (requiresReason && !reason.trim()) ||
                availableStatuses.length === 0
              }
              className="w-full sm:w-auto"
            >
              {isSubmitting ? 'Updating Status...' : 'Update Status'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}