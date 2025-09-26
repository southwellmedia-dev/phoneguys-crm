'use client';

import { Check, Clock, UserCheck, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AppointmentStatus } from './appointment-status-badge';

interface AppointmentStatusFlowProps {
  currentStatus: AppointmentStatus;
  className?: string;
  isConverted?: boolean;
}

interface FlowStep {
  key: AppointmentStatus;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
}

/**
 * Visual progress indicator showing the appointment flow
 * Displays the progression from scheduled → confirmed → arrived → converted
 */
export function AppointmentStatusFlow({ 
  currentStatus, 
  className,
  isConverted = false
}: AppointmentStatusFlowProps) {
  // Define the main flow steps (excluding cancelled/no_show as they're edge cases)
  const flowSteps: FlowStep[] = [
    {
      key: 'scheduled',
      label: 'Scheduled',
      icon: Clock,
      description: 'Appointment created'
    },
    {
      key: 'confirmed',
      label: 'Confirmed',
      icon: Check,
      description: 'Date & time confirmed'
    },
    {
      key: 'arrived',
      label: 'Arrived',
      icon: UserCheck,
      description: 'Customer checked in'
    },
    {
      key: 'converted',
      label: 'Converted',
      icon: FileText,
      description: 'Ticket created'
    }
  ];

  // Determine the current step index
  const statusOrder: AppointmentStatus[] = ['scheduled', 'confirmed', 'arrived', 'converted'];
  const currentStepIndex = statusOrder.indexOf(currentStatus);
  
  // Handle edge cases (cancelled, no_show)
  const isEdgeCase = currentStatus === 'cancelled' || currentStatus === 'no_show';

  return (
    <div className={cn("w-full", className)}>
      <div className="relative">
        {/* Progress line */}
        <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200">
          <div 
            className={cn(
              "h-full transition-all duration-500",
              isConverted ? "bg-green-500" : "bg-cyan-500"
            )}
            style={{
              width: isEdgeCase ? '0%' : `${(currentStepIndex / (flowSteps.length - 1)) * 100}%`
            }}
          />
        </div>

        {/* Steps */}
        <div className="relative flex justify-between">
          {flowSteps.map((step, index) => {
            const stepIndex = statusOrder.indexOf(step.key);
            const isCompleted = !isEdgeCase && stepIndex <= currentStepIndex;
            const isCurrent = !isEdgeCase && step.key === currentStatus;
            const Icon = step.icon;

            return (
              <div 
                key={step.key}
                className="flex flex-col items-center"
              >
                {/* Step circle */}
                <div 
                  className={cn(
                    "relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300",
                    // Special green color for converted step when appointment is converted
                    step.key === 'converted' && isConverted
                      ? "border-green-500 bg-green-500 text-white"
                      : isCompleted 
                      ? "border-cyan-500 bg-cyan-500 text-white" 
                      : "border-gray-300 bg-white text-gray-400",
                    isCurrent && "ring-4 ring-cyan-100 scale-110",
                    step.key === 'converted' && isConverted && "ring-4 ring-green-100"
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>

                {/* Step label */}
                <div className="mt-2 text-center">
                  <p 
                    className={cn(
                      "text-sm font-medium",
                      isCompleted ? "text-gray-900" : "text-gray-500"
                    )}
                  >
                    {step.label}
                  </p>
                  {step.description && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      {step.description}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Edge case indicator */}
        {isEdgeCase && (
          <div className="mt-4 p-3 rounded-lg bg-gray-100 border border-gray-200">
            <p className="text-sm text-center text-gray-600">
              {currentStatus === 'cancelled' 
                ? '❌ This appointment was cancelled'
                : '⚠️ Customer did not show up for this appointment'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}