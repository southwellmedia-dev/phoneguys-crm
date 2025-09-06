'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface DeletePreview {
  customer: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  relatedData: {
    repairTickets: {
      count: number;
      activeCount: number;
      items: Array<{ id: string; ticket_number: string; status: string }>;
    };
    appointments: {
      count: number;
      upcomingCount: number;
      items: Array<{ id: string; appointment_date: string; status: string }>;
    };
    devices: {
      count: number;
      items: Array<{ id: string; device_type: string; model: string }>;
    };
    timeEntries: {
      count: number;
    };
    notifications: {
      count: number;
    };
  };
  totalRelatedRecords: number;
}

interface DeleteCustomerDialogProps {
  customerId: string;
  customerName: string;
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

export function DeleteCustomerDialog({
  customerId,
  customerName,
  trigger,
  onSuccess
}: DeleteCustomerDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [preview, setPreview] = useState<DeletePreview | null>(null);
  const [confirmationText, setConfirmationText] = useState('');

  const fetchPreview = async () => {
    setLoadingPreview(true);
    try {
      const response = await fetch(`/api/customers/${customerId}/cascade-delete`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch deletion preview');
      }
      const data = await response.json();
      setPreview(data.data);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load deletion preview');
      setOpen(false);
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleDelete = async () => {
    if (confirmationText !== 'DELETE') {
      toast.error('Please type DELETE to confirm');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/customers/${customerId}/cascade-delete`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete customer');
      }

      const result = await response.json();
      toast.success(result.message || 'Customer deleted successfully');
      setOpen(false);
      
      // Navigate to customers list or call success callback
      if (onSuccess) {
        onSuccess();
      } else {
        router.push('/customers');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete customer');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog 
      open={open} 
      onOpenChange={(newOpen) => {
        setOpen(newOpen);
        if (newOpen) {
          fetchPreview();
          setConfirmationText('');
        } else {
          setPreview(null);
        }
      }}
    >
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="destructive" size="sm">
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Customer
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-destructive flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Permanently Delete Customer
          </DialogTitle>
          <DialogDescription>
            This action cannot be undone. All data associated with this customer will be permanently deleted.
          </DialogDescription>
        </DialogHeader>

        {loadingPreview ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : preview ? (
          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Warning:</strong> You are about to permanently delete <strong>{preview.customer.name}</strong> 
                {preview.totalRelatedRecords > 0 && (
                  <> and <strong>{preview.totalRelatedRecords} related records</strong></>
                )}.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <h4 className="text-sm font-medium">Customer Information</h4>
              <div className="rounded-lg border p-3 space-y-1 text-sm">
                <div><strong>Name:</strong> {preview.customer.name}</div>
                <div><strong>Email:</strong> {preview.customer.email}</div>
                <div><strong>Phone:</strong> {preview.customer.phone}</div>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <h4 className="text-sm font-medium">Related Data to be Deleted</h4>
              <ScrollArea className="h-[200px] rounded-lg border p-4">
                <div className="space-y-3">
                  {/* Repair Tickets */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        Repair Tickets ({preview.relatedData.repairTickets.count})
                      </span>
                      {preview.relatedData.repairTickets.activeCount > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          {preview.relatedData.repairTickets.activeCount} Active
                        </Badge>
                      )}
                    </div>
                    {preview.relatedData.repairTickets.items.length > 0 && (
                      <div className="ml-4 space-y-1">
                        {preview.relatedData.repairTickets.items.map(ticket => (
                          <div key={ticket.id} className="text-xs text-muted-foreground">
                            {ticket.ticket_number} - <Badge variant="outline" className="text-xs">{ticket.status}</Badge>
                          </div>
                        ))}
                        {preview.relatedData.repairTickets.count > 5 && (
                          <div className="text-xs text-muted-foreground">
                            ...and {preview.relatedData.repairTickets.count - 5} more
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Appointments */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        Appointments ({preview.relatedData.appointments.count})
                      </span>
                      {preview.relatedData.appointments.upcomingCount > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          {preview.relatedData.appointments.upcomingCount} Upcoming
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Devices */}
                  {preview.relatedData.devices.count > 0 && (
                    <div className="space-y-2">
                      <span className="text-sm font-medium">
                        Devices ({preview.relatedData.devices.count})
                      </span>
                      {preview.relatedData.devices.items.length > 0 && (
                        <div className="ml-4 space-y-1">
                          {preview.relatedData.devices.items.map(device => (
                            <div key={device.id} className="text-xs text-muted-foreground">
                              {device.device_type} - {device.model}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Time Entries */}
                  {preview.relatedData.timeEntries.count > 0 && (
                    <div className="text-sm">
                      <span className="font-medium">Time Entries:</span> {preview.relatedData.timeEntries.count}
                    </div>
                  )}

                  {/* Notifications */}
                  {preview.relatedData.notifications.count > 0 && (
                    <div className="text-sm">
                      <span className="font-medium">Notifications:</span> {preview.relatedData.notifications.count}
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>

            <Separator />

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                To confirm deletion, type <strong>DELETE</strong> below:
              </p>
              <input
                type="text"
                value={confirmationText}
                onChange={(e) => setConfirmationText(e.target.value)}
                placeholder="Type DELETE to confirm"
                className="w-full px-3 py-2 border rounded-md text-sm"
                disabled={loading}
              />
            </div>
          </div>
        ) : null}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={loading || loadingPreview || confirmationText !== 'DELETE'}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Permanently
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}