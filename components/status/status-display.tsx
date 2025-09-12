'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  DollarSign, 
  Package, 
  Phone,
  CheckCircle,
  Circle,
  AlertCircle,
  User,
  Smartphone
} from 'lucide-react';

interface TimelineEvent {
  timestamp: string;
  type: 'status_change' | 'comment' | 'update';
  description: string;
  status?: string | null;
  is_customer?: boolean;
}

interface StatusDisplayProps {
  type: 'ticket' | 'appointment';
  data: any;
  timeline?: TimelineEvent[];
  onBack: () => void;
  storePhone?: string;
}

export function StatusDisplay({ type, data, timeline = [], onBack, storePhone = '(469) 608-1050' }: StatusDisplayProps) {
  const getStatusColor = (status: string): string => {
    const statusColors: { [key: string]: string } = {
      'New': 'bg-blue-100 text-blue-800',
      'In Progress': 'bg-yellow-100 text-yellow-800',
      'Waiting for Parts': 'bg-orange-100 text-orange-800',
      'Ready for Pickup': 'bg-green-100 text-green-800',
      'Completed': 'bg-green-100 text-green-800',
      'Cancelled': 'bg-red-100 text-red-800',
      'On Hold': 'bg-gray-100 text-gray-800',
      'Scheduled': 'bg-amber-100 text-amber-800 border-2 border-amber-400',
      'Confirmed': 'bg-green-100 text-green-800 border-2 border-green-400',
      'Arrived': 'bg-purple-100 text-purple-800',
      'No Show': 'bg-red-100 text-red-800',
      'Converted to Repair': 'bg-green-100 text-green-800'
    };

    return statusColors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status: string) => {
    if (status === 'Completed' || status === 'Ready for Pickup') {
      return <CheckCircle className="h-5 w-5 text-green-600" />;
    } else if (status === 'Cancelled' || status === 'No Show') {
      return <AlertCircle className="h-5 w-5 text-red-600" />;
    } else {
      return <Circle className="h-5 w-5 text-gray-400" />;
    }
  };

  const getPriorityColor = (priority: string): string => {
    const priorityColors: { [key: string]: string } = {
      'urgent': 'bg-red-100 text-red-800',
      'high': 'bg-orange-100 text-orange-800',
      'normal': 'bg-blue-100 text-blue-800',
      'low': 'bg-gray-100 text-gray-800'
    };

    return priorityColors[priority] || 'bg-gray-100 text-gray-800';
  };

  const isTicket = type === 'ticket';

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button
        onClick={onBack}
        variant="outline"
        className="mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Check Another Status
      </Button>

      {/* Show warning for unconfirmed appointments */}
      {!isTicket && data.status === 'Scheduled' && (
        <Alert className="mb-4 border-amber-200 bg-amber-50">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            <strong>Appointment Not Yet Confirmed</strong>
            <p className="mt-1">
              This appointment is scheduled but not yet confirmed. Please call us at{' '}
              <a href={`tel:${storePhone.replace(/\D/g, '')}`} className="font-medium underline">
                {storePhone}
              </a>{' '}
              to confirm your appointment time.
            </p>
          </AlertDescription>
        </Alert>
      )}

      {/* Show success message for confirmed appointments */}
      {!isTicket && data.status === 'Confirmed' && (
        <Alert className="mb-4 border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <strong>Appointment Confirmed!</strong>
            <p className="mt-1">
              Your appointment is confirmed for {data.scheduled_date} at {data.scheduled_time}. 
              We'll see you then! If you need to reschedule, please call us at{' '}
              <a href={`tel:${storePhone.replace(/\D/g, '')}`} className="font-medium underline">
                {storePhone}
              </a>.
            </p>
          </AlertDescription>
        </Alert>
      )}

      {/* Main Status Card */}
      <Card className="shadow-lg">
        <CardHeader className="bg-gradient-to-r from-cyan-500 to-cyan-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">
                {isTicket ? 'Repair Ticket' : 'Appointment'} Status
              </CardTitle>
              <p className="text-cyan-100 mt-1">
                Reference: {isTicket ? data.ticket_number : data.appointment_number}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              {getStatusIcon(data.status)}
              <Badge className={`${getStatusColor(data.status)} text-sm px-3 py-1`}>
                {data.status}
              </Badge>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-6 space-y-6">
          {/* Customer & Device Info */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Customer Info */}
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900 flex items-center">
                <User className="mr-2 h-4 w-4 text-gray-500" />
                Customer Information
              </h3>
              <div className="space-y-2 text-sm">
                <p>
                  <span className="text-gray-500">Name:</span>{' '}
                  <span className="font-medium">{data.customer_name || 'N/A'}</span>
                </p>
                {data.assigned_technician && (
                  <p>
                    <span className="text-gray-500">Technician:</span>{' '}
                    <span className="font-medium">{data.assigned_technician}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Device Info */}
            {data.device && (
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900 flex items-center">
                  <Smartphone className="mr-2 h-4 w-4 text-gray-500" />
                  Device Information
                </h3>
                <div className="space-y-2 text-sm">
                  <p>
                    <span className="text-gray-500">Device:</span>{' '}
                    <span className="font-medium">
                      {data.device.brand} {data.device.model}
                    </span>
                  </p>
                  {data.device.color && (
                    <p>
                      <span className="text-gray-500">Color:</span>{' '}
                      <span className="font-medium">{data.device.color}</span>
                    </p>
                  )}
                  {data.device.storage_capacity && (
                    <p>
                      <span className="text-gray-500">Storage:</span>{' '}
                      <span className="font-medium">{data.device.storage_capacity}</span>
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Ticket-specific Information */}
          {isTicket && (
            <>
              {/* Services & Issues */}
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900 flex items-center">
                  <Package className="mr-2 h-4 w-4 text-gray-500" />
                  Repair Details
                </h3>
                
                {data.priority && (
                  <div>
                    <Badge className={getPriorityColor(data.priority)}>
                      {data.priority.charAt(0).toUpperCase() + data.priority.slice(1)} Priority
                    </Badge>
                  </div>
                )}

                {(data.repair_issues || data.issues) && (data.repair_issues || data.issues).length > 0 && (
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Issues:</p>
                    <div className="flex flex-wrap gap-2">
                      {(data.repair_issues || data.issues).map((issue: string, index: number) => (
                        <Badge key={index} variant="outline">
                          {issue}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {data.services && data.services.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Services:</p>
                    <div className="flex flex-wrap gap-2">
                      {data.services.map((service: string, index: number) => (
                        <Badge key={index} variant="secondary">
                          {service}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Cost Information */}
              {(data.estimated_cost !== null || data.actual_cost !== null || data.deposit_amount !== null || 
                data.total_cost !== null || data.amount_paid !== null) && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <h3 className="font-semibold text-gray-900 flex items-center">
                      <DollarSign className="mr-2 h-4 w-4 text-gray-500" />
                      Cost Information
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      {(data.estimated_cost !== null || data.total_cost !== null) && (
                        <p>
                          <span className="text-gray-500">Estimated Cost:</span>{' '}
                          <span className="font-medium text-lg">
                            ${((data.estimated_cost || data.total_cost) || 0).toFixed(2)}
                          </span>
                        </p>
                      )}
                      {data.actual_cost !== null && (
                        <p>
                          <span className="text-gray-500">Actual Cost:</span>{' '}
                          <span className="font-medium text-lg">
                            ${(data.actual_cost || 0).toFixed(2)}
                          </span>
                        </p>
                      )}
                      {(data.deposit_amount !== null || data.amount_paid !== null) && (
                        <p>
                          <span className="text-gray-500">Deposit Paid:</span>{' '}
                          <span className="font-medium text-lg text-green-600">
                            ${((data.deposit_amount || data.amount_paid) || 0).toFixed(2)}
                          </span>
                        </p>
                      )}
                      {data.actual_cost !== null && (data.deposit_amount !== null || data.amount_paid !== null) && (
                        <p className="md:col-span-2">
                          <span className="text-gray-500">Balance Due:</span>{' '}
                          <span className="font-medium text-lg">
                            ${((data.actual_cost || 0) - ((data.deposit_amount || data.amount_paid) || 0)).toFixed(2)}
                          </span>
                        </p>
                      )}
                    </div>
                  </div>
                </>
              )}
            </>
          )}

          {/* Appointment-specific Information */}
          {!isTicket && (
            <>
              <div className="grid md:grid-cols-2 gap-6">
                {/* Schedule Info */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-900 flex items-center">
                    <Calendar className="mr-2 h-4 w-4 text-gray-500" />
                    Schedule Information
                  </h3>
                  <div className="space-y-2 text-sm">
                    <p>
                      <span className="text-gray-500">Date:</span>{' '}
                      <span className="font-medium">{data.scheduled_date}</span>
                    </p>
                    <p>
                      <span className="text-gray-500">Time:</span>{' '}
                      <span className="font-medium">{data.scheduled_time}</span>
                    </p>
                    {data.duration_minutes && (
                      <p>
                        <span className="text-gray-500">Duration:</span>{' '}
                        <span className="font-medium">{data.duration_minutes} minutes</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Appointment Details */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-900 flex items-center">
                    <Package className="mr-2 h-4 w-4 text-gray-500" />
                    Appointment Details
                  </h3>
                  <div className="space-y-2 text-sm">
                    {data.urgency && (
                      <div>
                        <span className="text-gray-500 text-sm">Urgency:</span>{' '}
                        <Badge variant="outline">
                          {data.urgency.charAt(0).toUpperCase() + data.urgency.slice(1)}
                        </Badge>
                      </div>
                    )}
                    {data.estimated_cost !== null && (
                      <p>
                        <span className="text-gray-500">Estimated Cost:</span>{' '}
                        <span className="font-medium">${data.estimated_cost.toFixed(2)}</span>
                      </p>
                    )}
                    {data.converted_to_ticket && (
                      <p>
                        <span className="text-gray-500">Repair Ticket:</span>{' '}
                        <span className="font-medium text-cyan-600">
                          {data.converted_to_ticket}
                        </span>
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Issues/Description */}
              {(data.issues || data.description) && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    {data.issues && data.issues.length > 0 && (
                      <div>
                        <p className="text-sm text-gray-500 mb-2">Reported Issues:</p>
                        <div className="flex flex-wrap gap-2">
                          {data.issues.map((issue: string, index: number) => (
                            <Badge key={index} variant="outline">
                              {issue}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {data.description && (
                      <div>
                        <p className="text-sm text-gray-500 mb-2">Description:</p>
                        <p className="text-sm">{data.description}</p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </>
          )}

          <Separator />

          {/* Dates */}
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <p>
              <span className="text-gray-500">Created:</span>{' '}
              <span className="font-medium">{data.created_at}</span>
            </p>
            <p>
              <span className="text-gray-500">Last Updated:</span>{' '}
              <span className="font-medium">{data.updated_at}</span>
            </p>
            {data.estimated_completion && (
              <p className="md:col-span-2">
                <span className="text-gray-500">Estimated Completion:</span>{' '}
                <span className="font-medium text-green-600">
                  {data.estimated_completion}
                </span>
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Timeline */}
      {timeline && timeline.length > 0 && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="mr-2 h-5 w-5 text-gray-500" />
              Activity Timeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {timeline.map((event, index) => (
                <div key={index} className="flex space-x-3">
                  <div className="flex-shrink-0">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      event.is_customer 
                        ? 'bg-green-500' 
                        : event.type === 'status_change' 
                        ? 'bg-cyan-500' 
                        : event.type === 'comment'
                        ? 'bg-blue-500'
                        : 'bg-gray-400'
                    }`} />
                  </div>
                  <div className={`flex-1 space-y-1 ${
                    event.is_customer ? 'bg-green-50 p-3 rounded-lg' : ''
                  }`}>
                    <p className={`text-sm ${
                      event.is_customer ? 'text-green-900 font-medium' : 'text-gray-900'
                    }`}>
                      {event.description}
                    </p>
                    <p className="text-xs text-gray-500">
                      {event.timestamp}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Contact Information */}
      <Card className="shadow-md bg-cyan-50">
        <CardContent className="pt-6">
          <div className="flex items-center space-x-3">
            <Phone className="h-5 w-5 text-cyan-600" />
            <div>
              <p className="font-medium text-gray-900">Need Help?</p>
              <p className="text-sm text-gray-600">
                Call us at{' '}
                <a href={`tel:${storePhone.replace(/\D/g, '')}`} className="text-cyan-600 hover:text-cyan-700 font-medium">
                  {storePhone}
                </a>{' '}
                for any questions about your {isTicket ? 'repair' : 'appointment'}.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}