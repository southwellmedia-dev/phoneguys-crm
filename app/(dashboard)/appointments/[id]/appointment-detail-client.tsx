"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAppointment, useUpdateAppointment } from "@/lib/hooks/use-appointments";
import { useQueryClient } from "@tanstack/react-query";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  Smartphone,
  AlertCircle,
  CheckCircle,
  XCircle,
  ArrowRight,
  Edit,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { 
  convertAppointmentToTicket, 
  confirmAppointment, 
  markAppointmentArrived, 
  cancelAppointment 
} from "./actions";
import { useShowSkeleton } from "@/lib/hooks/use-navigation-loading";
import { SkeletonAppointmentDetail } from "@/components/ui/skeleton-appointment-detail";

interface AppointmentDetailClientProps {
  appointment: any;
  appointmentId: string;
}

const statusConfig = {
  scheduled: { label: 'Scheduled', className: 'bg-blue-100 text-blue-800', icon: Clock },
  confirmed: { label: 'Confirmed', className: 'bg-green-100 text-green-800', icon: CheckCircle },
  arrived: { label: 'Arrived', className: 'bg-purple-100 text-purple-800', icon: User },
  no_show: { label: 'No Show', className: 'bg-red-100 text-red-800', icon: XCircle },
  cancelled: { label: 'Cancelled', className: 'bg-gray-100 text-gray-800', icon: XCircle },
  converted: { label: 'Converted to Ticket', className: 'bg-cyan-100 text-cyan-800', icon: ArrowRight },
};

export function AppointmentDetailClient({ appointment: initialAppointment, appointmentId }: AppointmentDetailClientProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: appointment = initialAppointment, isLoading, isFetching } = useAppointment(appointmentId);
  const updateAppointment = useUpdateAppointment();
  const [isConverting, setIsConverting] = useState(false);
  const [showConvertDialog, setShowConvertDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  
  // Determine if we should show skeleton
  const showSkeleton = useShowSkeleton(isLoading, isFetching, !!appointment);

  const status = statusConfig[appointment.status as keyof typeof statusConfig];
  const StatusIcon = status.icon;

  const handleConvertToTicket = async () => {
    setIsConverting(true);
    try {
      const result = await convertAppointmentToTicket(appointmentId);
      
      if (result.success) {
        toast.success(`Successfully converted to ticket ${result.ticketNumber}`);
        router.push(`/orders/${result.ticket.id}`);
      } else {
        toast.error(result.error || "Failed to convert appointment");
      }
    } catch (error) {
      toast.error("Failed to convert appointment");
      console.error(error);
    } finally {
      setIsConverting(false);
      setShowConvertDialog(false);
    }
  };

  const handleConfirm = async () => {
    try {
      const result = await confirmAppointment(appointmentId);
      if (result.success) {
        toast.success("Appointment confirmed");
        // Real-time will handle the cache update
      } else {
        toast.error(result.error || "Failed to confirm appointment");
      }
    } catch (error) {
      toast.error("Failed to confirm appointment");
    }
  };

  const handleMarkArrived = async () => {
    try {
      const result = await markAppointmentArrived(appointmentId);
      if (result.success) {
        toast.success("Customer marked as arrived");
        // Real-time will handle the cache update
      } else {
        toast.error(result.error || "Failed to update status");
      }
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const handleCancel = async () => {
    try {
      const result = await cancelAppointment(appointmentId, "Cancelled by staff");
      if (result.success) {
        toast.success("Appointment cancelled");
        // Real-time will handle the cache update
      } else {
        toast.error(result.error || "Failed to cancel appointment");
      }
    } catch (error) {
      toast.error("Failed to cancel appointment");
    } finally {
      setShowCancelDialog(false);
    }
  };

  const headerActions = [
    {
      label: "Back",
      icon: <ArrowLeft className="h-4 w-4" />,
      variant: "outline" as const,
      onClick: () => router.push('/appointments'),
    },
  ];

  // Add action buttons based on status
  if (appointment.status === 'scheduled') {
    headerActions.push({
      label: "Confirm",
      icon: <CheckCircle className="h-4 w-4" />,
      variant: "outline" as const,
      onClick: handleConfirm,
    });
  }

  if (appointment.status === 'confirmed' || appointment.status === 'scheduled') {
    headerActions.push({
      label: "Check In",
      icon: <User className="h-4 w-4" />,
      variant: "outline" as const,
      onClick: handleMarkArrived,
    });
    
    headerActions.push({
      label: "Convert to Ticket",
      icon: <ArrowRight className="h-4 w-4" />,
      variant: "default" as const,
      onClick: () => setShowConvertDialog(true),
    });
  }

  if (appointment.status !== 'cancelled' && appointment.status !== 'converted') {
    headerActions.push({
      label: "Cancel",
      icon: <XCircle className="h-4 w-4" />,
      variant: "destructive" as const,
      onClick: () => setShowCancelDialog(true),
    });
  }

  if (appointment.status === 'converted' && appointment.converted_to_ticket_id) {
    headerActions.push({
      label: "View Ticket",
      icon: <ArrowRight className="h-4 w-4" />,
      variant: "default" as const,
      onClick: () => router.push(`/orders/${appointment.converted_to_ticket_id}`),
    });
  }

  // Show skeleton during navigation or loading
  if (showSkeleton) {
    return <SkeletonAppointmentDetail />;
  }

  return (
    <>
      <PageContainer
        title={appointment.appointment_number}
        description={
          <div className="flex items-center gap-2">
            <span>Appointment Details</span>
            <Badge className={status.className}>
              <StatusIcon className="mr-1 h-3 w-3" />
              {status.label}
            </Badge>
          </div>
        }
        actions={headerActions}
      >
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Customer Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Name</p>
                    <p className="font-medium">{appointment.customers?.name || 'Walk-in Customer'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">
                      {appointment.customers?.email || 'Not provided'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="font-medium">
                      {appointment.customers?.phone || 'Not provided'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Address</p>
                    <p className="font-medium">
                      {appointment.customers?.address || 'Not provided'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Device Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5" />
                  Device Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Device</p>
                    <p className="font-medium">
                      {appointment.devices 
                        ? `${appointment.devices.manufacturer?.name || ''} ${appointment.devices.model_name}`
                        : 'Not specified'}
                    </p>
                  </div>
                  {appointment.customer_devices && (
                    <>
                      <div>
                        <p className="text-sm text-muted-foreground">Serial Number</p>
                        <p className="font-medium">
                          {appointment.customer_devices.serial_number || 'Not provided'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">IMEI</p>
                        <p className="font-medium">
                          {appointment.customer_devices.imei || 'Not provided'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Color</p>
                        <p className="font-medium">
                          {appointment.customer_devices.color || 'Not specified'}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Issues & Description */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Issues & Description
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {appointment.issues && appointment.issues.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Reported Issues</p>
                    <div className="flex flex-wrap gap-2">
                      {appointment.issues.map((issue: string) => (
                        <Badge key={issue} variant="secondary">
                          {issue.replace('_', ' ')}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {appointment.description && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Description</p>
                    <p className="text-sm">{appointment.description}</p>
                  </div>
                )}
                
                {appointment.notes && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Notes</p>
                    <p className="text-sm">{appointment.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Appointment Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Appointment Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-medium">
                    {format(new Date(appointment.scheduled_date), 'EEEE, MMMM d, yyyy')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Time</p>
                  <p className="font-medium">
                    {appointment.scheduled_time} ({appointment.duration_minutes} minutes)
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Source</p>
                  <p className="font-medium capitalize">{appointment.source || 'Unknown'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Urgency</p>
                  <p className="font-medium capitalize">{appointment.urgency || 'Scheduled'}</p>
                </div>
                {appointment.estimated_cost && (
                  <div>
                    <p className="text-sm text-muted-foreground">Estimated Cost</p>
                    <p className="font-medium">${appointment.estimated_cost}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {appointment.customers?.phone && (
                  <Button variant="outline" className="w-full justify-start">
                    <Phone className="mr-2 h-4 w-4" />
                    Call Customer
                  </Button>
                )}
                {appointment.customers?.email && (
                  <Button variant="outline" className="w-full justify-start">
                    <Mail className="mr-2 h-4 w-4" />
                    Email Customer
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => router.push(`/appointments/${appointmentId}/edit`)}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Appointment
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </PageContainer>

      {/* Convert to Ticket Dialog */}
      <AlertDialog open={showConvertDialog} onOpenChange={setShowConvertDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Convert to Repair Ticket?</AlertDialogTitle>
            <AlertDialogDescription>
              This will create a new repair ticket from this appointment. The appointment will be marked as converted and cannot be reverted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConvertToTicket} disabled={isConverting}>
              {isConverting ? "Converting..." : "Convert to Ticket"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel Appointment Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Appointment?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this appointment? The customer will be notified of the cancellation.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Appointment</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancel} className="bg-destructive text-destructive-foreground">
              Cancel Appointment
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}