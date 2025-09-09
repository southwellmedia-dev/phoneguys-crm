'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { Calendar, Clock, CheckCircle, MessageSquare, Mail, Phone } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ButtonPremium } from '@/components/premium/ui/buttons/button-premium';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CardPremium } from '@/components/premium/ui/cards/card-premium';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointmentId: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  scheduledDate: string;
  scheduledTime: string;
  services?: string[];
  onConfirm: (data: {
    notes?: string;
    notificationMethod?: 'email' | 'sms' | 'phone' | 'none';
  }) => Promise<void>;
}

/**
 * Modal for confirming appointments with notification options
 */
export function ConfirmationModal({
  isOpen,
  onClose,
  appointmentId,
  customerName,
  customerEmail,
  customerPhone,
  scheduledDate,
  scheduledTime,
  services = [],
  onConfirm
}: ConfirmationModalProps) {
  const [notes, setNotes] = useState('');
  const [notificationMethod, setNotificationMethod] = useState<'email' | 'sms' | 'phone' | 'none'>('email');
  const [isConfirming, setIsConfirming] = useState(false);

  const handleConfirm = async () => {
    setIsConfirming(true);
    try {
      await onConfirm({
        notes: notes.trim() || undefined,
        notificationMethod
      });
      
      toast.success(`Appointment confirmed for ${scheduledDate ? format(new Date(scheduledDate), 'MMM d, yyyy') : 'the appointment'}`);
      
      onClose();
      setNotes('');
    } catch (error) {
      toast.error("Failed to confirm appointment. Please try again.");
    } finally {
      setIsConfirming(false);
    }
  };

  const notificationOptions = [
    { value: 'email', label: 'Email', icon: Mail, disabled: !customerEmail },
    { value: 'sms', label: 'SMS', icon: Phone, disabled: !customerPhone },
    { value: 'phone', label: 'Phone Call', icon: Phone, disabled: !customerPhone },
    { value: 'none', label: 'No Notification', icon: null, disabled: false }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Confirm Appointment
          </DialogTitle>
          <DialogDescription>
            Review and confirm the appointment details below
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Customer Info */}
          <CardPremium variant="outline" className="p-4">
            <h3 className="font-medium mb-2">Customer Information</h3>
            <div className="space-y-1 text-sm">
              <p className="font-medium">{customerName}</p>
              {customerEmail && (
                <p className="text-muted-foreground">{customerEmail}</p>
              )}
              {customerPhone && (
                <p className="text-muted-foreground">{customerPhone}</p>
              )}
            </div>
          </CardPremium>

          {/* Appointment Details */}
          <CardPremium variant="outline" className="p-4">
            <h3 className="font-medium mb-3">Appointment Details</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>{scheduledDate ? format(new Date(scheduledDate), 'EEEE, MMMM d, yyyy') : 'Date not set'}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>{scheduledTime}</span>
              </div>
              {services.length > 0 && (
                <div className="mt-2 pt-2 border-t">
                  <p className="text-sm font-medium mb-1">Services:</p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {services.map((service, index) => (
                      <li key={index}>• {service}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardPremium>

          {/* Notification Method */}
          <div className="space-y-2">
            <Label>Confirmation Method</Label>
            <div className="grid grid-cols-2 gap-2">
              {notificationOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => !option.disabled && setNotificationMethod(option.value as any)}
                  disabled={option.disabled}
                  className={cn(
                    "flex items-center gap-2 p-2 rounded-lg border transition-colors",
                    notificationMethod === option.value
                      ? "border-cyan-500 bg-cyan-50 text-cyan-700"
                      : "border-gray-200 hover:border-gray-300",
                    option.disabled && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {option.icon && <option.icon className="h-4 w-4" />}
                  <span className="text-sm">{option.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Confirmation Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">
              <MessageSquare className="inline h-4 w-4 mr-1" />
              Confirmation Notes (Optional)
            </Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any special instructions or notes for this appointment..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isConfirming}
          >
            Cancel
          </Button>
          <ButtonPremium
            variant="gradient-success"
            onClick={handleConfirm}
            disabled={isConfirming}
          >
            {isConfirming ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Confirming...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Confirm Appointment
              </>
            )}
          </ButtonPremium>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}