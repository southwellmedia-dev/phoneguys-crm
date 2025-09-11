'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export interface SwitchPremiumProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'type' | 'onChange'> {
  /** Visual style variant */
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'ghost';
  /** Size of the switch */
  size?: 'sm' | 'md' | 'lg';
  /** Label for the switch */
  label?: React.ReactNode;
  /** Description text below the label */
  description?: string;
  /** Error state with optional message */
  error?: boolean | string;
  /** Loading state */
  loading?: boolean;
  /** Position of the label */
  labelPosition?: 'left' | 'right';
  /** Show on/off labels inside the switch */
  showLabels?: boolean;
  /** Custom on label */
  onLabel?: string;
  /** Custom off label */
  offLabel?: string;
  /** Container className */
  containerClassName?: string;
  /** Callback when checked state changes */
  onCheckedChange?: (checked: boolean) => void;
}

const SwitchPremium = React.forwardRef<HTMLInputElement, SwitchPremiumProps>(
  ({
    className,
    containerClassName,
    variant = 'default',
    size = 'md',
    label,
    description,
    error = false,
    loading = false,
    labelPosition = 'right',
    showLabels = false,
    onLabel = 'ON',
    offLabel = 'OFF',
    checked = false,
    disabled = false,
    onCheckedChange,
    ...props
  }, ref) => {
    const hasError = !!error;
    const errorMessage = typeof error === 'string' ? error : '';

    // Handle change event
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onCheckedChange?.(e.target.checked);
    };

    // Size classes
    const switchSizeClasses = {
      sm: 'h-5 w-9',
      md: 'h-6 w-11',
      lg: 'h-7 w-14'
    };

    const thumbSizeClasses = {
      sm: 'h-3.5 w-3.5',
      md: 'h-4 w-4',
      lg: 'h-5 w-5'
    };

    const thumbTranslateClasses = {
      sm: checked ? 'translate-x-4' : 'translate-x-0.5',
      md: checked ? 'translate-x-5' : 'translate-x-0.5',
      lg: checked ? 'translate-x-7' : 'translate-x-0.5'
    };

    const labelSizeClasses = {
      sm: 'text-sm',
      md: 'text-base',
      lg: 'text-lg'
    };

    const labelTextSizeClasses = {
      sm: 'text-[9px]',
      md: 'text-[10px]',
      lg: 'text-xs'
    };

    // Get background color based on variant and state
    const getBackgroundColor = () => {
      if (!checked) {
        return 'bg-gray-200 dark:bg-gray-800';
      }

      switch (variant) {
        case 'primary':
          return 'bg-cyan-500 dark:bg-cyan-600';
        case 'success':
          return 'bg-green-500 dark:bg-green-600';
        case 'warning':
          return 'bg-yellow-500 dark:bg-yellow-600';
        case 'error':
          return 'bg-red-500 dark:bg-red-600';
        case 'ghost':
          return 'bg-gray-400 dark:bg-gray-600';
        default:
          return 'bg-cyan-500 dark:bg-cyan-600';
      }
    };

    // Get border color for error state
    const getBorderColor = () => {
      if (!hasError) return 'border-transparent';
      return 'border-red-500 dark:border-red-400';
    };

    const switchElement = (
      <div className={cn('relative inline-flex items-center', switchSizeClasses[size])}>
        <input
          ref={ref}
          type="checkbox"
          checked={checked}
          disabled={disabled || loading}
          onChange={handleChange}
          className="sr-only peer"
          {...props}
        />
        
        {/* Switch Track */}
        <div
          className={cn(
            'relative rounded-full border-2 transition-all duration-200',
            'cursor-pointer',
            switchSizeClasses[size],
            getBackgroundColor(),
            getBorderColor(),
            'peer-focus-visible:ring-2 peer-focus-visible:ring-cyan-500/20 peer-focus-visible:ring-offset-2',
            'peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
            className
          )}
        >
          {/* On/Off Labels */}
          {showLabels && (
            <>
              <span className={cn(
                'absolute left-1 top-1/2 -translate-y-1/2 font-medium text-white/70 transition-opacity duration-200',
                labelTextSizeClasses[size],
                checked ? 'opacity-100' : 'opacity-0'
              )}>
                {onLabel}
              </span>
              <span className={cn(
                'absolute right-1 top-1/2 -translate-y-1/2 font-medium text-gray-600 dark:text-gray-400 transition-opacity duration-200',
                labelTextSizeClasses[size],
                checked ? 'opacity-0' : 'opacity-100'
              )}>
                {offLabel}
              </span>
            </>
          )}
          
          {/* Switch Thumb */}
          <div
            className={cn(
              'absolute top-1/2 -translate-y-1/2 rounded-full bg-white dark:bg-gray-100',
              'shadow-sm transition-all duration-200',
              'flex items-center justify-center',
              thumbSizeClasses[size],
              thumbTranslateClasses[size]
            )}
          >
            {loading && (
              <Loader2 className={cn(
                'animate-spin text-gray-500',
                size === 'sm' ? 'h-2.5 w-2.5' : size === 'md' ? 'h-3 w-3' : 'h-3.5 w-3.5'
              )} />
            )}
          </div>
        </div>
      </div>
    );

    if (!label && !description && !errorMessage) {
      return switchElement;
    }

    return (
      <div className={cn('relative', containerClassName)}>
        <label
          className={cn(
            'flex gap-3 cursor-pointer',
            labelPosition === 'left' && 'flex-row-reverse justify-end',
            (disabled || loading) && 'cursor-not-allowed opacity-50'
          )}
        >
          {switchElement}
          
          {(label || description) && (
            <div className="flex flex-col">
              {label && (
                <span className={cn(
                  'leading-tight',
                  labelSizeClasses[size],
                  'text-gray-700 dark:text-gray-300',
                  hasError && 'text-red-500 dark:text-red-400'
                )}>
                  {label}
                </span>
              )}
              {description && (
                <span className={cn(
                  'text-sm text-gray-500 dark:text-gray-400 mt-0.5',
                  hasError && 'text-red-400 dark:text-red-500'
                )}>
                  {description}
                </span>
              )}
            </div>
          )}
        </label>
        
        {errorMessage && (
          <p className="mt-1.5 text-sm text-red-500 dark:text-red-400">
            {errorMessage}
          </p>
        )}
      </div>
    );
  }
);

SwitchPremium.displayName = 'SwitchPremium';

// Switch Group Component for multiple related switches
export interface SwitchGroupProps {
  /** Group label */
  label?: string;
  /** Group description */
  description?: string;
  /** Switches for the group */
  switches: Array<{
    id: string;
    label: React.ReactNode;
    description?: string;
    disabled?: boolean;
    checked?: boolean;
  }>;
  /** Callback when any switch changes */
  onChange?: (id: string, checked: boolean) => void;
  /** Visual style variant */
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'ghost';
  /** Size of switches */
  size?: 'sm' | 'md' | 'lg';
  /** Orientation of the group */
  orientation?: 'horizontal' | 'vertical';
  /** Error state with optional message */
  error?: boolean | string;
  /** Whether the field is required */
  required?: boolean;
  /** Container className */
  className?: string;
}

export const SwitchGroup = React.forwardRef<HTMLDivElement, SwitchGroupProps>(
  ({
    label,
    description,
    switches,
    onChange,
    variant = 'default',
    size = 'md',
    orientation = 'vertical',
    error = false,
    required = false,
    className,
    ...props
  }, ref) => {
    const hasError = !!error;
    const errorMessage = typeof error === 'string' ? error : '';

    return (
      <div ref={ref} className={cn('space-y-2', className)} {...props}>
        {label && (
          <label className={cn(
            'block text-sm font-medium',
            'text-gray-700 dark:text-gray-300',
            hasError && 'text-red-500 dark:text-red-400'
          )}>
            {label}
            {required && <span className="ml-1 text-red-500">*</span>}
          </label>
        )}
        
        {description && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {description}
          </p>
        )}
        
        <div className={cn(
          'flex',
          orientation === 'horizontal' ? 'flex-row flex-wrap gap-4' : 'flex-col gap-2'
        )}>
          {switches.map((switchItem) => (
            <SwitchPremium
              key={switchItem.id}
              checked={switchItem.checked}
              onChange={(e) => onChange?.(switchItem.id, e.target.checked)}
              disabled={switchItem.disabled}
              label={switchItem.label}
              description={switchItem.description}
              variant={variant}
              size={size}
              error={hasError}
            />
          ))}
        </div>
        
        {errorMessage && (
          <p className="mt-1.5 text-sm text-red-500 dark:text-red-400">
            {errorMessage}
          </p>
        )}
      </div>
    );
  }
);

SwitchGroup.displayName = 'SwitchGroup';

export { SwitchPremium };