"use client";

import { useState, useEffect } from 'react';
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
import { Clock, AlertCircle } from 'lucide-react';
import { useTimer } from '@/lib/contexts/timer-context';
import { toast } from 'sonner';

interface StopTimerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: (notes: string) => void;
}

export function StopTimerDialog({ isOpen, onClose, onConfirm }: StopTimerDialogProps) {
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { activeTimer, stopTimer, isLoading } = useTimer();

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      setNotes('');
      setError(null);
    }
  }, [isOpen]);

  // Format elapsed time for display
  const formatElapsedTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!notes.trim()) {
      setError('Please describe what work was completed during this time.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const success = await stopTimer(notes.trim());
      
      if (success) {
        toast.success('Timer stopped and time recorded');
        onConfirm?.(notes.trim());
        onClose();
      } else {
        const errorMsg = 'Failed to stop timer. Please try again.';
        setError(errorMsg);
        toast.error(errorMsg);
      }
    } catch (error: any) {
      const errorMsg = error.message || 'An unexpected error occurred.';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (!isSubmitting) {
      setNotes('');
      setError(null);
      onClose();
    }
  };

  if (!activeTimer) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={() => !isSubmitting && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Stop Timer
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Timer Summary */}
          <div className="bg-muted/30 rounded-lg p-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Order:</span>
              <span className="font-medium">
                {activeTimer.ticketNumber || `#${activeTimer.ticketId.slice(-8)}`}
              </span>
            </div>
            {activeTimer.customerName && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Customer:</span>
                <span className="font-medium">{activeTimer.customerName}</span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Time worked:</span>
              <span className="font-bold font-mono text-primary text-lg">
                {formatElapsedTime(activeTimer.elapsedSeconds)}
              </span>
            </div>
          </div>

          {/* Notes Input */}
          <div className="space-y-2">
            <Label htmlFor="work-notes">
              Work Notes <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="work-notes"
              placeholder="Describe the work completed during this time session..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              disabled={isSubmitting}
              className={error ? 'border-destructive' : ''}
            />
            <p className="text-xs text-muted-foreground">
              Please provide details about what was accomplished during this work session.
            </p>
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
              disabled={isSubmitting || isLoading || !notes.trim()}
              className="w-full sm:w-auto"
            >
              {isSubmitting ? 'Stopping Timer...' : 'Stop Timer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}