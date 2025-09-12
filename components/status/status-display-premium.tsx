'use client';

import { Button } from '@/components/ui/button';
import { ButtonPremium } from '@/components/premium/ui/buttons';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CardPremium } from '@/components/premium/ui/cards';
import { MetricCard } from '@/components/premium/ui/cards';
import { StatusBadge } from '@/components/premium/ui/badges';
import { Pill } from '@/components/premium/ui/pills';
import { TimelinePremium, TimelineEvent } from '@/components/premium/timeline';
import { formatPillText } from '@/components/premium/utils/pill-utils';
import { 
  ArrowLeft, 
  CheckCircle,
  AlertCircle,
  Phone,
  User,
  Smartphone,
  Calendar,
  Clock,
  DollarSign,
  CreditCard,
  Receipt,
  Package
} from 'lucide-react';

interface StatusDisplayPremiumProps {
  type: 'ticket' | 'appointment';
  data: any;
  timeline?: any[];
  onBack: () => void;
  storePhone?: string;
}

// Map database status values to StatusBadge status props (following premium design pattern)
function mapStatusForBadge(status: string, isTicket: boolean = false): string {
  const dbStatus = status.toLowerCase().replace(/[\s_-]+/g, '_');
  
  if (isTicket) {
    // Ticket status mapping
    switch (dbStatus) {
      case 'new': return 'new';
      case 'in_progress': return 'inProgress';
      case 'on_hold': return 'onHold';
      case 'completed': return 'completed';
      case 'cancelled': return 'cancelled';
      default: return 'pending';
    }
  } else {
    // Appointment status mapping
    switch (dbStatus) {
      case 'scheduled': return 'scheduled';
      case 'confirmed': return 'confirmed';
      case 'arrived': return 'arrived';
      case 'no_show': return 'no_show';
      case 'converted': return 'converted';
      case 'cancelled': return 'cancelled';
      default: return 'scheduled';
    }
  }
}

export function StatusDisplayPremium({ 
  type, 
  data, 
  timeline = [], 
  onBack, 
  storePhone = '(469) 608-1050' 
}: StatusDisplayPremiumProps) {
  const isTicket = type === 'ticket';

  // Format timeline events for the premium component
  const formattedTimeline: TimelineEvent[] = timeline.map((event, index) => ({
    id: `event-${index}`,
    timestamp: event.timestamp,
    type: event.type as any,
    title: event.type === 'comment' && event.is_customer 
      ? 'Comment' 
      : event.type === 'status_change' 
      ? 'Status Update'
      : 'Update',
    description: event.description,
    status: event.status,
    is_customer: event.is_customer,
    user: event.user || (event.is_customer ? 'Customer' : 'Staff')
  }));

  // Calculate balance for tickets
  const calculateBalance = () => {
    if (!isTicket) return null;
    
    const total = data.actual_cost || data.estimated_cost || 0;
    const paid = data.deposit_amount || 0;
    return total - paid;
  };

  const balance = calculateBalance();

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <ButtonPremium
        onClick={onBack}
        variant="ghost"
        leftIcon={<ArrowLeft className="h-4 w-4" />}
        className="mb-4"
      >
        Check Another Status
      </ButtonPremium>

      {/* Status Alerts */}
      {!isTicket && data.status && data.status.toLowerCase() === 'scheduled' && (
        <Alert className="border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50">
          <AlertCircle className="h-5 w-5 text-amber-600" />
          <AlertDescription>
            <div className="ml-2">
              <p className="font-semibold text-amber-900 mb-1">Appointment Not Yet Confirmed</p>
              <p className="text-amber-800">
                Please call us at{' '}
                <a href={`tel:${storePhone.replace(/\D/g, '')}`} className="font-semibold underline">
                  {storePhone}
                </a>{' '}
                to confirm your appointment time.
              </p>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {!isTicket && data.status && data.status.toLowerCase() === 'confirmed' && (
        <Alert className="border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <AlertDescription>
            <div className="ml-2">
              <p className="font-semibold text-green-900 mb-1">Appointment Confirmed!</p>
              <p className="text-green-800">
                Your appointment is confirmed for {data.scheduled_date} at {data.scheduled_time}.
              </p>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Main Status Card */}
      <CardPremium 
        className="overflow-hidden"
        variant="elevated"
      >
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-cyan-600 to-cyan-700 px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="text-white">
              <h2 className="text-2xl font-bold mb-1">
                {isTicket ? 'Repair Ticket' : 'Appointment'} Status
              </h2>
              <p className="text-cyan-100 font-medium">
                Reference: {isTicket ? data.ticket_number : data.appointment_number}
              </p>
            </div>
            {data.status && (
              <StatusBadge 
                status={mapStatusForBadge(data.status, isTicket)} 
                size="lg"
                variant="soft"
                pulse={isTicket && data.status === 'in_progress'}
                className="shadow-sm"
              />
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Key Information Grid */}
          <div className="grid md:grid-cols-3 gap-6 pb-6 border-b">
            {/* Customer */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <User className="h-4 w-4 text-gray-400" />
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</span>
              </div>
              <p className="text-base font-semibold text-gray-900">{data.customer_name || 'N/A'}</p>
              {data.assigned_technician && (
                <p className="text-sm text-gray-600 mt-1">Technician: {data.assigned_technician}</p>
              )}
            </div>

            {/* Device */}
            {data.device && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Smartphone className="h-4 w-4 text-gray-400" />
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Device</span>
                </div>
                <p className="text-base font-semibold text-gray-900">
                  {data.device.brand} {data.device.model}
                </p>
                {data.device.color && (
                  <p className="text-sm text-gray-600 mt-1">{data.device.color}</p>
                )}
              </div>
            )}

            {/* Schedule for Appointments */}
            {!isTicket && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Scheduled</span>
                </div>
                <p className="text-base font-semibold text-gray-900">{data.scheduled_date}</p>
                <p className="text-sm text-gray-600 mt-1">at {data.scheduled_time}</p>
              </div>
            )}

            {/* Dates for Tickets */}
            {isTicket && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Timeline</span>
                </div>
                <p className="text-sm text-gray-600">Created: {data.created_at}</p>
                {data.estimated_completion && (
                  <p className="text-sm text-green-600 font-medium mt-1">Est: {data.estimated_completion}</p>
                )}
              </div>
            )}
          </div>

          {/* Repair Issues for Tickets */}
          {isTicket && (data.repair_issues || data.issues) && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-gray-400" />
                <h3 className="text-sm font-semibold text-gray-900">Repair Details</h3>
                {data.priority && (
                  <StatusBadge 
                    status={data.priority} 
                    variant="soft"
                    size="sm"
                  />
                )}
              </div>
              
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Issues to Address</p>
                <div className="flex flex-wrap gap-2">
                  {(data.repair_issues || data.issues).map((issue: string, index: number) => (
                    <Pill
                      key={index}
                      label={issue ? formatPillText(issue) : 'Unknown Issue'}
                      variant="cyan"
                      size="sm"
                    />
                  ))}
                </div>
              </div>

              {data.description && (
                <div className="pt-3">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Additional Notes</p>
                  <p className="text-sm text-gray-700">{data.description}</p>
                </div>
              )}
            </div>
          )}

          {/* Appointment Service Details */}
          {!isTicket && (data.issues || data.description) && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-gray-400" />
                <h3 className="text-sm font-semibold text-gray-900">Service Request</h3>
              </div>
              {data.issues && data.issues.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Reported Issues</p>
                  <div className="flex flex-wrap gap-2">
                    {data.issues.map((issue: string, index: number) => (
                      <Pill
                        key={index}
                        label={issue ? formatPillText(issue) : 'Unknown Issue'}
                        variant="blue"
                        size="sm"
                      />
                    ))}
                  </div>
                </div>
              )}
              {data.description && (
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Additional Details</p>
                  <p className="text-sm text-gray-700">{data.description}</p>
                </div>
              )}
            </div>
          )}

          {/* Cost Information - Professional Cards */}
          {isTicket && (data.estimated_cost !== null || data.actual_cost !== null || data.deposit_amount !== null) && (
            <div className="grid md:grid-cols-3 gap-4">
              {(data.estimated_cost !== null || data.actual_cost !== null) && (
                <MetricCard
                  title={data.actual_cost && data.actual_cost > 0 ? "Repair Cost" : "Estimated Repair Cost*"}
                  value={`$${((data.actual_cost && data.actual_cost > 0 ? data.actual_cost : data.estimated_cost) || 0).toFixed(2)}`}
                  icon={<DollarSign className="h-5 w-5" />}
                  variant="default"
                  trend={(!data.actual_cost || data.actual_cost === 0) ? "*Subject to change after diagnosis" : undefined}
                />
              )}
              
              {data.deposit_amount !== null && (
                <MetricCard
                  title="Deposit Paid"
                  value={`$${(data.deposit_amount || 0).toFixed(2)}`}
                  icon={<CreditCard className="h-5 w-5" />}
                  variant="success"
                />
              )}
              
              {balance !== null && balance > 0 && (
                <MetricCard
                  title={data.actual_cost && data.actual_cost > 0 ? "Balance Due" : "Estimated Balance Due*"}
                  value={`$${balance.toFixed(2)}`}
                  icon={<Receipt className="h-5 w-5" />}
                  variant={balance > 100 ? "warning" : "default"}
                  trend="Payment required at pickup"
                />
              )}
            </div>
          )}

          {/* Appointment Cost (if applicable) */}
          {!isTicket && data.estimated_cost !== null && (
            <MetricCard
              title="Estimated Cost"
              value={`$${(data.estimated_cost || 0).toFixed(2)}`}
              icon={<DollarSign className="h-5 w-5" />}
              variant="default"
              className="max-w-xs"
            />
          )}

        </div>
      </CardPremium>

      {/* Timeline Section */}
      {formattedTimeline && formattedTimeline.length > 0 && (
        <CardPremium variant="elevated">
          <div className="p-6">
            <div className="flex items-center mb-6">
              <Clock className="h-5 w-5 text-gray-500 mr-2" />
              <h3 className="text-lg font-semibold">Activity Timeline</h3>
            </div>
            <TimelinePremium events={formattedTimeline} />
          </div>
        </CardPremium>
      )}

      {/* Contact Card */}
      <CardPremium 
        variant="gradient"
        className="bg-gradient-to-r from-cyan-50 to-blue-50"
      >
        <div className="p-6">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-cyan-100 rounded-full flex items-center justify-center">
                <Phone className="h-6 w-6 text-cyan-600" />
              </div>
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900">Need Help?</p>
              <p className="text-gray-600">
                Call us at{' '}
                <a 
                  href={`tel:${storePhone.replace(/\D/g, '')}`} 
                  className="text-cyan-600 hover:text-cyan-700 font-semibold transition-colors"
                >
                  {storePhone}
                </a>{' '}
                for any questions about your {isTicket ? 'repair' : 'appointment'}.
              </p>
            </div>
          </div>
        </div>
      </CardPremium>
    </div>
  );
}