'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Timer, XCircle, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export function ClearTimersButton() {
  const [showDialog, setShowDialog] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [activeTimers, setActiveTimers] = useState<any[]>([]);
  const [isChecking, setIsChecking] = useState(false);

  const checkActiveTimers = async () => {
    setIsChecking(true);
    try {
      const response = await fetch('/api/admin/clear-timers', {
        method: 'GET',
      });
      
      const data = await response.json();
      
      if (data.success) {
        setActiveTimers(data.activeTimers || []);
        if (data.count > 0) {
          setShowDialog(true);
        } else {
          toast.info('No active timers found');
        }
      } else {
        toast.error('Failed to check timers');
      }
    } catch (error) {
      console.error('Error checking timers:', error);
      toast.error('Failed to check timers');
    } finally {
      setIsChecking(false);
    }
  };

  const handleClearTimers = async () => {
    setIsClearing(true);
    try {
      const response = await fetch('/api/admin/clear-timers', {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success(`Cleared ${data.cleared} timer(s)`);
        setShowDialog(false);
        setActiveTimers([]);
        
        // Refresh the page to update UI
        window.location.reload();
      } else {
        toast.error(data.error || 'Failed to clear timers');
      }
      
      if (data.errors && data.errors.length > 0) {
        console.error('Errors clearing some timers:', data.errors);
        toast.warning(`Some timers could not be cleared. Check console for details.`);
      }
    } catch (error) {
      console.error('Error clearing timers:', error);
      toast.error('Failed to clear timers');
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={checkActiveTimers}
        disabled={isChecking}
        className="gap-2"
      >
        <Timer className="h-4 w-4" />
        {isChecking ? 'Checking...' : 'Clear All Timers'}
      </Button>

      <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Clear All Active Timers
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                Found <strong>{activeTimers.length}</strong> active timer(s) that will be cleared:
              </p>
              
              {activeTimers.length > 0 && (
                <div className="max-h-32 overflow-y-auto rounded border p-2 text-sm">
                  {activeTimers.map((timer) => (
                    <div key={timer.id} className="flex justify-between py-1">
                      <span className="font-mono">{timer.ticket_number}</span>
                      <span className="text-muted-foreground text-xs">
                        Started: {new Date(timer.timer_started_at).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              
              <p className="text-sm text-destructive font-medium">
                ⚠️ This will stop all running timers without creating time entries. 
                This action cannot be undone.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isClearing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClearTimers}
              disabled={isClearing}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isClearing ? (
                <>
                  <XCircle className="mr-2 h-4 w-4 animate-spin" />
                  Clearing...
                </>
              ) : (
                <>
                  <XCircle className="mr-2 h-4 w-4" />
                  Clear All Timers
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}