'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Calendar, Clock, X, ChevronLeft, ChevronRight, Loader2, AlertCircle } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, isValid, parse, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';

export interface DatePickerPremiumProps {
  /** Currently selected date */
  value?: Date | null;
  /** Callback when date changes */
  onChange?: (date: Date | null) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Date format for display */
  dateFormat?: string;
  /** Visual style variant */
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'ghost';
  /** Size of the date picker */
  size?: 'sm' | 'md' | 'lg';
  /** Include time picker */
  showTime?: boolean;
  /** Time format (12 or 24 hour) */
  timeFormat?: '12' | '24';
  /** Minimum selectable date */
  minDate?: Date;
  /** Maximum selectable date */
  maxDate?: Date;
  /** Disabled dates */
  disabledDates?: Date[];
  /** Allow clearing selection */
  clearable?: boolean;
  /** Loading state */
  loading?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Error state with optional message */
  error?: boolean | string;
  /** Success state with optional message */
  success?: boolean | string;
  /** Warning state with optional message */
  warning?: boolean | string;
  /** Label for the date picker */
  label?: string;
  /** Helper text below the date picker */
  helperText?: string;
  /** Whether the field is required */
  required?: boolean;
  /** Icon to display on the left */
  leftIcon?: React.ReactNode;
  /** Container className */
  containerClassName?: string;
  /** Trigger button className */
  className?: string;
}

const DatePickerPremium = React.forwardRef<HTMLButtonElement, DatePickerPremiumProps>(
  ({
    value,
    onChange,
    placeholder = 'Select date',
    dateFormat = 'MMM dd, yyyy',
    variant = 'default',
    size = 'md',
    showTime = false,
    timeFormat = '12',
    minDate,
    maxDate,
    disabledDates = [],
    clearable = false,
    loading = false,
    disabled = false,
    error = false,
    success = false,
    warning = false,
    label,
    helperText,
    required = false,
    leftIcon,
    containerClassName,
    className,
    ...props
  }, ref) => {
    const [open, setOpen] = React.useState(false);
    const [currentMonth, setCurrentMonth] = React.useState(value || new Date());
    const [selectedTime, setSelectedTime] = React.useState<{ hours: number; minutes: number }>({
      hours: value?.getHours() || 0,
      minutes: value?.getMinutes() || 0
    });

    // Update time when value changes
    React.useEffect(() => {
      if (value) {
        setSelectedTime({
          hours: value.getHours(),
          minutes: value.getMinutes()
        });
      }
    }, [value]);

    // Get display text
    const getDisplayText = () => {
      if (!value) return placeholder;
      
      let displayFormat = dateFormat;
      if (showTime) {
        displayFormat += timeFormat === '12' ? ' h:mm a' : ' HH:mm';
      }
      
      return format(value, displayFormat);
    };

    // Handle date selection
    const handleDateSelect = (date: Date) => {
      const newDate = new Date(date);
      if (showTime) {
        newDate.setHours(selectedTime.hours);
        newDate.setMinutes(selectedTime.minutes);
      }
      onChange?.(newDate);
      if (!showTime) {
        setOpen(false);
      }
    };

    // Handle time change
    const handleTimeChange = (type: 'hours' | 'minutes', value: number) => {
      const newTime = { ...selectedTime, [type]: value };
      setSelectedTime(newTime);
      
      if (value) {
        const newDate = new Date(value);
        newDate.setHours(newTime.hours);
        newDate.setMinutes(newTime.minutes);
        onChange?.(newDate);
      }
    };

    // Handle clear
    const handleClear = (e: React.MouseEvent) => {
      e.stopPropagation();
      onChange?.(null);
      setSelectedTime({ hours: 0, minutes: 0 });
    };

    // Check if date is disabled
    const isDateDisabled = (date: Date) => {
      if (minDate && date < minDate) return true;
      if (maxDate && date > maxDate) return true;
      return disabledDates.some(d => isSameDay(d, date));
    };

    // Get days for current month
    const getDaysInMonth = () => {
      const start = startOfMonth(currentMonth);
      const end = endOfMonth(currentMonth);
      return eachDayOfInterval({ start, end });
    };

    // Get day of week headers
    const dayHeaders = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

    // Determine state for styling
    const hasError = !!error;
    const hasSuccess = !!success && !hasError;
    const hasWarning = !!warning && !hasError && !hasSuccess;
    
    // Get the appropriate state message
    const stateMessage = typeof error === 'string' ? error :
                        typeof success === 'string' ? success :
                        typeof warning === 'string' ? warning :
                        helperText;

    // Size classes
    const sizeClasses = {
      sm: 'h-8 px-3 text-sm',
      md: 'h-10 px-4 text-base',
      lg: 'h-12 px-5 text-lg'
    };

    const iconSizeClasses = {
      sm: 'h-3.5 w-3.5',
      md: 'h-4 w-4',
      lg: 'h-5 w-5'
    };

    // Variant classes - matching input styling
    const variantClasses = {
      default: cn(
        'border-gray-200 dark:border-gray-800',
        'hover:border-gray-300 dark:hover:border-gray-700',
        open && 'border-cyan-500 dark:border-cyan-400',
        hasError && 'border-red-500 dark:border-red-400',
        hasSuccess && 'border-green-500 dark:border-green-400',
        hasWarning && 'border-yellow-500 dark:border-yellow-400'
      ),
      primary: cn(
        'border-cyan-200 dark:border-cyan-800',
        'hover:border-cyan-300 dark:hover:border-cyan-700',
        open && 'border-cyan-500 dark:border-cyan-400',
        hasError && 'border-red-500 dark:border-red-400',
        hasSuccess && 'border-green-500 dark:border-green-400',
        hasWarning && 'border-yellow-500 dark:border-yellow-400'
      ),
      success: 'border-green-200 dark:border-green-800 hover:border-green-300 dark:hover:border-green-700',
      warning: 'border-yellow-200 dark:border-yellow-800 hover:border-yellow-300 dark:hover:border-yellow-700',
      error: 'border-red-200 dark:border-red-800 hover:border-red-300 dark:hover:border-red-700',
      ghost: cn(
        'border-transparent',
        'hover:bg-gray-50 dark:hover:bg-gray-900',
        open && 'bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-800'
      )
    };

    // Icon color classes based on state
    const iconColorClasses = hasError ? 'text-red-500' :
                            hasSuccess ? 'text-green-500' :
                            hasWarning ? 'text-yellow-500' :
                            'text-gray-400 dark:text-gray-600';

    // Pad start of month to align with day of week
    const firstDayOfMonth = startOfMonth(currentMonth);
    const startPadding = firstDayOfMonth.getDay();
    const paddingDays = Array(startPadding).fill(null);

    return (
      <div className={cn('relative', containerClassName)}>
        {label && (
          <label className={cn(
            'block mb-1.5 text-sm font-medium',
            'text-gray-700 dark:text-gray-300',
            hasError && 'text-red-500 dark:text-red-400',
            hasSuccess && 'text-green-500 dark:text-green-400',
            hasWarning && 'text-yellow-500 dark:text-yellow-400'
          )}>
            {label}
            {required && <span className="ml-1 text-red-500">*</span>}
          </label>
        )}
        
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button
              ref={ref}
              type="button"
              disabled={disabled || loading}
              className={cn(
                // Base styles
                'w-full rounded-md border bg-white dark:bg-gray-950',
                'transition-all duration-200',
                'disabled:cursor-not-allowed disabled:opacity-50',
                'focus:outline-none focus:ring-2 focus:ring-cyan-500/20',
                'flex items-center justify-between',
                
                // Size
                sizeClasses[size],
                
                // Variant
                variantClasses[variant],
                
                // Text color
                value ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400 dark:text-gray-600',
                
                // Padding adjustments for icons
                leftIcon && (size === 'sm' ? 'pl-8' : size === 'md' ? 'pl-10' : 'pl-12'),
                
                className
              )}
              {...props}
            >
              <div className="flex items-center gap-2 flex-1 truncate">
                {leftIcon ? (
                  <span className={iconColorClasses}>
                    {leftIcon}
                  </span>
                ) : (
                  <Calendar className={cn(iconSizeClasses[size], iconColorClasses)} />
                )}
                <span className="truncate">{getDisplayText()}</span>
              </div>
              
              <div className="flex items-center gap-1 ml-2">
                {loading && (
                  <Loader2 className={cn(iconSizeClasses[size], 'animate-spin', iconColorClasses)} />
                )}
                {hasError && !loading && (
                  <AlertCircle className={cn(iconSizeClasses[size], 'text-red-500')} />
                )}
                {clearable && value && !disabled && (
                  <button
                    type="button"
                    onClick={handleClear}
                    className={cn(
                      'rounded-sm hover:opacity-70 focus:outline-none',
                      iconColorClasses
                    )}
                  >
                    <X className={iconSizeClasses[size]} />
                  </button>
                )}
              </div>
            </button>
          </PopoverTrigger>
          
          <PopoverContent className="w-auto p-0" align="start">
            <div className="p-3">
              {/* Month Navigation */}
              <div className="flex items-center justify-between mb-3">
                <button
                  type="button"
                  onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                
                <div className="font-medium">
                  {format(currentMonth, 'MMMM yyyy')}
                </div>
                
                <button
                  type="button"
                  onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
              
              {/* Day Headers */}
              <div className="grid grid-cols-7 gap-1 mb-1">
                {dayHeaders.map(day => (
                  <div key={day} className="text-xs font-medium text-center text-gray-500 dark:text-gray-400 py-1">
                    {day}
                  </div>
                ))}
              </div>
              
              {/* Days Grid */}
              <div className="grid grid-cols-7 gap-1">
                {paddingDays.map((_, index) => (
                  <div key={`padding-${index}`} className="h-8 w-8" />
                ))}
                {getDaysInMonth().map(day => {
                  const isSelected = value && isSameDay(day, value);
                  const isDisabled = isDateDisabled(day);
                  const isToday = isSameDay(day, new Date());
                  
                  return (
                    <button
                      key={day.toISOString()}
                      type="button"
                      disabled={isDisabled}
                      onClick={() => handleDateSelect(day)}
                      className={cn(
                        'h-8 w-8 rounded text-sm',
                        'hover:bg-gray-100 dark:hover:bg-gray-800',
                        'focus:outline-none focus:ring-2 focus:ring-cyan-500/20',
                        isSelected && 'bg-cyan-500 text-white hover:bg-cyan-600',
                        isToday && !isSelected && 'font-bold text-cyan-500',
                        isDisabled && 'opacity-50 cursor-not-allowed',
                        !isSelected && !isDisabled && 'text-gray-700 dark:text-gray-300'
                      )}
                    >
                      {day.getDate()}
                    </button>
                  );
                })}
              </div>
              
              {/* Time Picker */}
              {showTime && (
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-800">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <input
                      type="number"
                      min="0"
                      max={timeFormat === '12' ? '12' : '23'}
                      value={timeFormat === '12' && selectedTime.hours > 12 ? selectedTime.hours - 12 : selectedTime.hours}
                      onChange={(e) => {
                        let hours = parseInt(e.target.value) || 0;
                        if (timeFormat === '12' && selectedTime.hours >= 12) {
                          hours += 12;
                        }
                        handleTimeChange('hours', hours);
                      }}
                      className="w-12 px-2 py-1 text-sm border rounded"
                    />
                    <span>:</span>
                    <input
                      type="number"
                      min="0"
                      max="59"
                      value={selectedTime.minutes.toString().padStart(2, '0')}
                      onChange={(e) => handleTimeChange('minutes', parseInt(e.target.value) || 0)}
                      className="w-12 px-2 py-1 text-sm border rounded"
                    />
                    {timeFormat === '12' && (
                      <select
                        value={selectedTime.hours >= 12 ? 'PM' : 'AM'}
                        onChange={(e) => {
                          const isPM = e.target.value === 'PM';
                          let hours = selectedTime.hours % 12;
                          if (isPM) hours += 12;
                          handleTimeChange('hours', hours);
                        }}
                        className="px-2 py-1 text-sm border rounded"
                      >
                        <option>AM</option>
                        <option>PM</option>
                      </select>
                    )}
                  </div>
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>
        
        {stateMessage && (
          <p className={cn(
            'mt-1.5 text-sm',
            hasError && 'text-red-500 dark:text-red-400',
            hasSuccess && 'text-green-500 dark:text-green-400',
            hasWarning && 'text-yellow-500 dark:text-yellow-400',
            !hasError && !hasSuccess && !hasWarning && 'text-gray-500 dark:text-gray-400'
          )}>
            {stateMessage}
          </p>
        )}
      </div>
    );
  }
);

DatePickerPremium.displayName = 'DatePickerPremium';

export { DatePickerPremium };