"use client";

import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CalendarPicker } from '../CalendarPicker';
import { TimeSlotPicker } from '../TimeSlotPicker';
import { Calendar, Clock, Loader2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface ScheduleStepProps {
  selectedDate?: string;
  selectedTime?: string;
  apiBaseUrl: string;
  onUpdate: (date: string, time: string) => void;
}

interface TimeSlot {
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  staffName?: string;
}

export function ScheduleStep({ selectedDate, selectedTime, apiBaseUrl, onUpdate }: ScheduleStepProps) {
  const [availableDates, setAvailableDates] = useState<any[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loadingDates, setLoadingDates] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Fetch next available dates on mount
  useEffect(() => {
    fetchAvailableDates();
  }, []);

  // Fetch time slots when date changes
  useEffect(() => {
    if (selectedDate) {
      fetchTimeSlots(selectedDate);
    }
  }, [selectedDate]);

  const fetchAvailableDates = async () => {
    setLoadingDates(true);
    try {
      const response = await fetch(`${apiBaseUrl}/availability?nextAvailable=true&limit=30`);
      const data = await response.json();
      
      if (data.success) {
        setAvailableDates(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch available dates:', error);
    } finally {
      setLoadingDates(false);
    }
  };

  const fetchTimeSlots = async (date: string) => {
    setLoadingSlots(true);
    try {
      const response = await fetch(`${apiBaseUrl}/availability?date=${date}`);
      const data = await response.json();
      
      if (data.success && data.data) {
        setTimeSlots(data.data.slots || []);
      }
    } catch (error) {
      console.error('Failed to fetch time slots:', error);
      setTimeSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleDateSelect = (date: string) => {
    onUpdate(date, ''); // Clear time when date changes
  };

  const handleTimeSelect = (time: string) => {
    if (selectedDate) {
      onUpdate(selectedDate, time);
    }
  };

  // Quick date selection buttons
  const quickDates = availableDates.slice(0, 3).map(day => ({
    date: day.date,
    label: format(parseISO(day.date), 'EEE, MMM d'),
    slots: day.availableSlots
  }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Schedule Your Appointment</h2>
        <p className="text-gray-600">Choose a convenient date and time for your visit</p>
      </div>

      {loadingDates ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Quick Date Selection */}
          {quickDates.length > 0 && (
            <div className="space-y-2">
              <Label>Quick Selection</Label>
              <div className="grid grid-cols-3 gap-3">
                {quickDates.map(({ date, label, slots }) => (
                  <Button
                    key={date}
                    type="button"
                    variant={selectedDate === date ? "default" : "outline"}
                    onClick={() => handleDateSelect(date)}
                    className="flex flex-col items-center p-3 h-auto"
                  >
                    <span className="font-medium">{label}</span>
                    <span className="text-xs mt-1 opacity-70">
                      {slots} slot{slots !== 1 ? 's' : ''} available
                    </span>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Calendar Selection */}
          <div className="space-y-2">
            <Label>Or Choose From Calendar</Label>
            <Card>
              <CardContent className="p-4">
                <CalendarPicker
                  selectedDate={selectedDate}
                  availableDates={availableDates.map(d => d.date)}
                  onDateSelect={handleDateSelect}
                  currentMonth={currentMonth}
                  onMonthChange={setCurrentMonth}
                />
              </CardContent>
            </Card>
          </div>

          {/* Time Slot Selection */}
          {selectedDate && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <Label>Available Times for {format(parseISO(selectedDate), 'EEEE, MMMM d')}</Label>
              </div>
              
              {loadingSlots ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : timeSlots.length > 0 ? (
                <TimeSlotPicker
                  slots={timeSlots}
                  selectedTime={selectedTime}
                  onTimeSelect={handleTimeSelect}
                />
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <p className="text-gray-500">No available time slots for this date.</p>
                    <p className="text-sm text-gray-400 mt-2">Please select another date.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Selected Summary */}
          {selectedDate && selectedTime && (
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Calendar className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-green-900">
                      Appointment Scheduled
                    </p>
                    <p className="text-sm text-green-700">
                      {format(parseISO(selectedDate), 'EEEE, MMMM d, yyyy')} at {selectedTime}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}