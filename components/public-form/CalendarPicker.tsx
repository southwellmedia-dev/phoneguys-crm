"use client";

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  isToday,
  isBefore,
  parseISO
} from 'date-fns';

interface CalendarPickerProps {
  selectedDate?: string;
  availableDates: string[];
  onDateSelect: (date: string) => void;
  currentMonth: Date;
  onMonthChange: (date: Date) => void;
}

export function CalendarPicker({
  selectedDate,
  availableDates,
  onDateSelect,
  currentMonth,
  onMonthChange
}: CalendarPickerProps) {
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const handlePreviousMonth = () => {
    onMonthChange(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    onMonthChange(addMonths(currentMonth, 1));
  };

  const renderDays = () => {
    const days = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    dayNames.forEach(day => {
      days.push(
        <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
          {day}
        </div>
      );
    });

    return days;
  };

  const renderCells = () => {
    const rows = [];
    let days = [];
    let day = startDate;

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const formattedDate = format(day, 'yyyy-MM-dd');
        const dayNumber = format(day, 'd');
        const isCurrentMonth = isSameMonth(day, monthStart);
        const isSelected = selectedDate === formattedDate;
        const isAvailable = availableDates.includes(formattedDate);
        const isPast = isBefore(day, today);
        const isTodayDate = isSameDay(day, today);
        
        const cloneDay = day;

        days.push(
          <div
            key={day.toString()}
            className={cn(
              "relative p-2 text-center cursor-pointer transition-colors",
              !isCurrentMonth && "text-gray-400",
              isPast && "opacity-50 cursor-not-allowed",
              !isPast && !isAvailable && "text-gray-300 cursor-not-allowed"
            )}
            onClick={() => {
              if (!isPast && isAvailable && isCurrentMonth) {
                onDateSelect(formattedDate);
              }
            }}
          >
            <div
              className={cn(
                "w-8 h-8 mx-auto flex items-center justify-center rounded-full transition-colors",
                isSelected && "bg-primary text-white",
                !isSelected && isAvailable && !isPast && "hover:bg-gray-100",
                isTodayDate && !isSelected && "ring-2 ring-primary ring-offset-2"
              )}
            >
              <span className="text-sm">{dayNumber}</span>
            </div>
            {isAvailable && !isPast && (
              <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2">
                <div className="w-1 h-1 bg-green-500 rounded-full"></div>
              </div>
            )}
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div className="grid grid-cols-7" key={day.toString()}>
          {days}
        </div>
      );
      days = [];
    }

    return rows;
  };

  return (
    <div className="w-full">
      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-4">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handlePreviousMonth}
          disabled={isBefore(subMonths(currentMonth, 1), today)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <h3 className="font-semibold text-lg">
          {format(currentMonth, 'MMMM yyyy')}
        </h3>
        
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleNextMonth}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Calendar Grid */}
      <div>
        <div className="grid grid-cols-7">
          {renderDays()}
        </div>
        <div>
          {renderCells()}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-4 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-primary rounded-full"></div>
          <span>Selected</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <span>Available</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
          <span>Unavailable</span>
        </div>
      </div>
    </div>
  );
}