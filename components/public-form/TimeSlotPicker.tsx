"use client";

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Clock, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TimeSlot {
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  staffName?: string;
}

interface TimeSlotPickerProps {
  slots: TimeSlot[];
  selectedTime?: string;
  onTimeSelect: (time: string) => void;
}

export function TimeSlotPicker({ slots, selectedTime, onTimeSelect }: TimeSlotPickerProps) {
  // Group slots by time period
  const groupSlotsByPeriod = (slots: TimeSlot[]) => {
    const morning: TimeSlot[] = [];
    const afternoon: TimeSlot[] = [];
    const evening: TimeSlot[] = [];

    slots.forEach(slot => {
      const hour = parseInt(slot.startTime.split(':')[0]);
      
      if (hour < 12) {
        morning.push(slot);
      } else if (hour < 17) {
        afternoon.push(slot);
      } else {
        evening.push(slot);
      }
    });

    return { morning, afternoon, evening };
  };

  const { morning, afternoon, evening } = groupSlotsByPeriod(slots);

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const renderTimeSlot = (slot: TimeSlot) => {
    const isSelected = selectedTime === slot.startTime;
    
    return (
      <Button
        key={slot.startTime}
        type="button"
        variant={isSelected ? "default" : "outline"}
        size="sm"
        onClick={() => onTimeSelect(slot.startTime)}
        disabled={!slot.isAvailable}
        className={cn(
          "relative",
          !slot.isAvailable && "opacity-50 cursor-not-allowed"
        )}
      >
        <span>{formatTime(slot.startTime)}</span>
        {slot.staffName && slot.isAvailable && (
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full"></span>
        )}
      </Button>
    );
  };

  const renderPeriodSection = (title: string, slots: TimeSlot[], icon: React.ReactNode) => {
    if (slots.length === 0) return null;

    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
          {icon}
          <span>{title}</span>
          <span className="text-xs text-gray-400">
            ({slots.filter(s => s.isAvailable).length} available)
          </span>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
          {slots.map(renderTimeSlot)}
        </div>
      </div>
    );
  };

  return (
    <Card className="p-4">
      <div className="space-y-6">
        {/* Morning Slots */}
        {renderPeriodSection(
          'Morning',
          morning,
          <Clock className="h-4 w-4" />
        )}

        {/* Afternoon Slots */}
        {renderPeriodSection(
          'Afternoon',
          afternoon,
          <Clock className="h-4 w-4" />
        )}

        {/* Evening Slots */}
        {renderPeriodSection(
          'Evening',
          evening,
          <Clock className="h-4 w-4" />
        )}

        {/* No slots available */}
        {slots.length === 0 && (
          <div className="text-center py-8">
            <Clock className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No time slots available for this date</p>
            <p className="text-sm text-gray-400 mt-1">Please select another date</p>
          </div>
        )}

        {/* Selected time display */}
        {selectedTime && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-900">
                  Selected Time: {formatTime(selectedTime)}
                </span>
              </div>
              {slots.find(s => s.startTime === selectedTime)?.staffName && (
                <div className="flex items-center gap-1 text-xs text-green-700">
                  <User className="h-3 w-3" />
                  <span>{slots.find(s => s.startTime === selectedTime)?.staffName}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}