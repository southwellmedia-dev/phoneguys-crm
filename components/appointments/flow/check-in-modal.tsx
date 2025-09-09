'use client';

import { useState } from 'react';
import { UserCheck, MessageSquare, ArrowRight } from 'lucide-react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';

interface CheckInModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointmentId: string;
  customerName: string;
  customerPhone?: string;
  scheduledTime: string;
  onCheckIn: (data: {
    notes?: string;
    verified: boolean;
    proceedToAssistant: boolean;
  }) => Promise<void>;
}

/**
 * Modal for checking in customers when they arrive
 */
export function CheckInModal({
  isOpen,
  onClose,
  appointmentId,
  customerName,
  customerPhone,
  scheduledTime,
  onCheckIn
}: CheckInModalProps) {
  const [notes, setNotes] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [proceedToAssistant, setProceedToAssistant] = useState(true);
  const [isCheckingIn, setIsCheckingIn] = useState(false);

  const handleCheckIn = async () => {
    if (!isVerified) {
      toast.error("Please verify the customer's identity before checking in.");
      return;
    }

    setIsCheckingIn(true);
    try {
      await onCheckIn({
        notes: notes.trim() || undefined,
        verified: isVerified,
        proceedToAssistant
      });
      
      toast.success(`${customerName} has been checked in successfully.`);
      
      onClose();
      // Reset form
      setNotes('');
      setIsVerified(false);
      setProceedToAssistant(true);
    } catch (error) {
      toast.error("Failed to check in customer. Please try again.");
    } finally {
      setIsCheckingIn(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-cyan-500" />
            Customer Check-In
          </DialogTitle>
          <DialogDescription>
            Verify and check in the customer for their appointment
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Customer Info */}
          <CardPremium variant="outline" className="p-4 bg-gray-50">
            <div className="space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-lg">{customerName}</h3>
                  {customerPhone && (
                    <p className="text-sm text-muted-foreground">{customerPhone}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Scheduled for</p>
                  <p className="text-sm font-medium">{scheduledTime}</p>
                </div>
              </div>
            </div>
          </CardPremium>

          {/* Verification */}
          <CardPremium variant="outline" className="p-4">
            <div className="flex items-start space-x-2">
              <Checkbox
                id="verify"
                checked={isVerified}
                onCheckedChange={(checked) => setIsVerified(checked as boolean)}
                className="mt-1"
              />
              <div className="space-y-1">
                <Label htmlFor="verify" className="font-medium cursor-pointer">
                  Customer Identity Verified
                </Label>
                <p className="text-sm text-muted-foreground">
                  I have verified this is the correct customer for this appointment
                </p>
              </div>
            </div>
          </CardPremium>

          {/* Check-in Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">
              <MessageSquare className="inline h-4 w-4 mr-1" />
              Check-In Notes (Optional)
            </Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any notes about the customer's arrival or initial requests..."
              rows={3}
            />
          </div>

          {/* Proceed to Assistant Option */}
          <CardPremium variant="outline" className="p-4 bg-cyan-50 border-cyan-200">
            <div className="flex items-start space-x-2">
              <Checkbox
                id="assistant"
                checked={proceedToAssistant}
                onCheckedChange={(checked) => setProceedToAssistant(checked as boolean)}
                className="mt-1"
              />
              <div className="space-y-1">
                <Label htmlFor="assistant" className="font-medium cursor-pointer">
                  Open Appointment Assistant
                </Label>
                <p className="text-sm text-muted-foreground">
                  Automatically open the appointment assistant after check-in
                </p>
              </div>
            </div>
          </CardPremium>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isCheckingIn}
          >
            Cancel
          </Button>
          <ButtonPremium
            variant={proceedToAssistant ? "gradient" : "gradient-success"}
            onClick={handleCheckIn}
            disabled={isCheckingIn || !isVerified}
          >
            {isCheckingIn ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Checking In...
              </>
            ) : (
              <>
                {proceedToAssistant ? (
                  <>
                    Check In & Open Assistant
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                ) : (
                  <>
                    <UserCheck className="h-4 w-4 mr-2" />
                    Check In Customer
                  </>
                )}
              </>
            )}
          </ButtonPremium>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}