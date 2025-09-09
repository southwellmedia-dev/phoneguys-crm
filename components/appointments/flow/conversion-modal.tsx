'use client';

import { useState } from 'react';
import { FileText, DollarSign, Clock, AlertCircle, CheckCircle } from 'lucide-react';
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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { CardPremium } from '@/components/premium/ui/cards/card-premium';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { format, addDays } from 'date-fns';

interface ConversionModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointmentId: string;
  customerName: string;
  deviceInfo: string;
  selectedServices: Array<{
    id: string;
    name: string;
    base_price: number;
    estimated_duration_minutes?: number;
  }>;
  estimatedCost: number;
  notes?: {
    customerNotes?: string;
    technicianNotes?: string;
    additionalIssues?: string;
  };
  onConvert: (data: {
    depositAmount: number;
    estimatedCompletion: string;
    priority: string;
    finalNotes?: string;
  }) => Promise<void>;
}

/**
 * Modal for converting an appointment to a repair ticket
 */
export function ConversionModal({
  isOpen,
  onClose,
  appointmentId,
  customerName,
  deviceInfo,
  selectedServices,
  estimatedCost,
  notes,
  onConvert
}: ConversionModalProps) {
  const [depositAmount, setDepositAmount] = useState(0);
  const [estimatedCompletion, setEstimatedCompletion] = useState(
    format(addDays(new Date(), 2), 'yyyy-MM-dd')
  );
  const [priority, setPriority] = useState('medium');
  const [finalNotes, setFinalNotes] = useState('');
  const [isConverting, setIsConverting] = useState(false);

  // Calculate total estimated time
  const totalEstimatedMinutes = selectedServices.reduce(
    (sum, service) => sum + (service.estimated_duration_minutes || 30),
    0
  );
  const estimatedHours = Math.ceil(totalEstimatedMinutes / 60);

  const handleConvert = async () => {
    if (selectedServices.length === 0) {
      toast.error('Please select at least one service before converting');
      return;
    }

    setIsConverting(true);
    try {
      await onConvert({
        depositAmount,
        estimatedCompletion,
        priority,
        finalNotes: finalNotes.trim() || undefined
      });
      
      toast.success('Appointment converted to repair ticket successfully');
      onClose();
      
      // Reset form
      setDepositAmount(0);
      setFinalNotes('');
    } catch (error) {
      toast.error('Failed to convert appointment. Please try again.');
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-purple-500" />
            Convert to Repair Ticket
          </DialogTitle>
          <DialogDescription>
            Review the appointment details and create a repair ticket
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
          {/* Summary Card */}
          <CardPremium variant="outline" className="bg-gradient-to-r from-purple-50 to-pink-50">
            <div className="p-4 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-lg">{customerName}</h3>
                  <p className="text-sm text-muted-foreground">{deviceInfo}</p>
                </div>
                <Badge variant="secondary">
                  {selectedServices.length} Service{selectedServices.length !== 1 ? 's' : ''}
                </Badge>
              </div>
              
              <Separator />
              
              {/* Services List */}
              <div className="space-y-2">
                <p className="text-sm font-medium">Selected Services:</p>
                {selectedServices.length > 0 ? (
                  <ul className="space-y-1">
                    {selectedServices.map((service) => (
                      <li key={service.id} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">• {service.name}</span>
                        <span className="font-medium">${service.base_price.toFixed(2)}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-yellow-600 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    No services selected
                  </p>
                )}
                
                <div className="pt-2 border-t flex justify-between items-center">
                  <span className="text-sm font-semibold">Total Estimated Cost:</span>
                  <span className="text-lg font-bold text-green-600">
                    ${estimatedCost.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Time Estimate */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                Estimated time: {estimatedHours} hour{estimatedHours !== 1 ? 's' : ''}
              </div>
            </div>
          </CardPremium>

          {/* Existing Notes Summary */}
          {(notes?.customerNotes || notes?.technicianNotes || notes?.additionalIssues) && (
            <CardPremium variant="outline">
              <div className="p-4 space-y-2">
                <p className="text-sm font-medium mb-2">Appointment Notes:</p>
                {notes.customerNotes && (
                  <div className="text-sm">
                    <span className="font-medium">Customer Notes:</span>
                    <p className="text-muted-foreground">{notes.customerNotes}</p>
                  </div>
                )}
                {notes.technicianNotes && (
                  <div className="text-sm">
                    <span className="font-medium">Technician Notes:</span>
                    <p className="text-muted-foreground">{notes.technicianNotes}</p>
                  </div>
                )}
                {notes.additionalIssues && (
                  <div className="text-sm">
                    <span className="font-medium">Additional Issues:</span>
                    <p className="text-muted-foreground">{notes.additionalIssues}</p>
                  </div>
                )}
              </div>
            </CardPremium>
          )}

          {/* Ticket Details */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="deposit">
                <DollarSign className="inline h-4 w-4 mr-1" />
                Deposit Amount
              </Label>
              <Input
                id="deposit"
                type="number"
                min="0"
                step="0.01"
                value={depositAmount}
                onChange={(e) => setDepositAmount(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
              />
              <p className="text-xs text-muted-foreground">
                Amount collected from customer
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="completion">
                <Clock className="inline h-4 w-4 mr-1" />
                Estimated Completion
              </Label>
              <Input
                id="completion"
                type="date"
                value={estimatedCompletion}
                onChange={(e) => setEstimatedCompletion(e.target.value)}
                min={format(new Date(), 'yyyy-MM-dd')}
              />
            </div>
          </div>

          {/* Priority Selection */}
          <div className="space-y-2">
            <Label>Priority Level</Label>
            <div className="grid grid-cols-4 gap-2">
              {['low', 'medium', 'high', 'urgent'].map((level) => (
                <button
                  key={level}
                  onClick={() => setPriority(level)}
                  className={`p-2 rounded-lg border text-sm capitalize transition-colors ${
                    priority === level
                      ? level === 'urgent'
                        ? 'border-red-500 bg-red-50 text-red-700'
                        : level === 'high'
                        ? 'border-orange-500 bg-orange-50 text-orange-700'
                        : level === 'medium'
                        ? 'border-yellow-500 bg-yellow-50 text-yellow-700'
                        : 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          {/* Final Notes */}
          <div className="space-y-2">
            <Label htmlFor="final-notes">
              Additional Notes for Ticket (Optional)
            </Label>
            <Textarea
              id="final-notes"
              value={finalNotes}
              onChange={(e) => setFinalNotes(e.target.value)}
              placeholder="Any additional information for the repair ticket..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isConverting}
          >
            Cancel
          </Button>
          <ButtonPremium
            variant="gradient"
            onClick={handleConvert}
            disabled={isConverting || selectedServices.length === 0}
            className="bg-gradient-to-r from-purple-500 to-purple-600"
          >
            {isConverting ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Converting...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Create Repair Ticket
              </>
            )}
          </ButtonPremium>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}