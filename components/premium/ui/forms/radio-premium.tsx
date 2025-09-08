'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface RadioPremiumProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'type'> {
  /** Visual style variant */
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'ghost';
  /** Size of the radio button */
  size?: 'sm' | 'md' | 'lg';
  /** Label for the radio button */
  label?: React.ReactNode;
  /** Description text below the label */
  description?: string;
  /** Error state */
  error?: boolean;
  /** Position of the label */
  labelPosition?: 'left' | 'right';
  /** Container className */
  containerClassName?: string;
}

const RadioPremium = React.forwardRef<HTMLInputElement, RadioPremiumProps>(
  ({
    className,
    containerClassName,
    variant = 'default',
    size = 'md',
    label,
    description,
    error = false,
    labelPosition = 'right',
    checked,
    disabled = false,
    onChange,
    ...props
  }, ref) => {
    // Size classes
    const sizeClasses = {
      sm: 'h-4 w-4',
      md: 'h-5 w-5',
      lg: 'h-6 w-6'
    };

    const dotSizeClasses = {
      sm: 'h-1.5 w-1.5',
      md: 'h-2 w-2',
      lg: 'h-2.5 w-2.5'
    };

    const labelSizeClasses = {
      sm: 'text-sm',
      md: 'text-base',
      lg: 'text-lg'
    };

    // Variant classes for the radio button circle
    const getVariantClasses = () => {
      const base = cn(
        'rounded-full border-2 transition-all duration-200',
        'flex items-center justify-center',
        sizeClasses[size]
      );

      if (checked) {
        switch (variant) {
          case 'primary':
            return cn(base, 'border-cyan-500 dark:border-cyan-400');
          case 'success':
            return cn(base, 'border-green-500 dark:border-green-400');
          case 'warning':
            return cn(base, 'border-yellow-500 dark:border-yellow-400');
          case 'error':
            return cn(base, 'border-red-500 dark:border-red-400');
          case 'ghost':
            return cn(base, 'border-gray-400 dark:border-gray-600 bg-gray-50 dark:bg-gray-900');
          default:
            return cn(base, 'border-cyan-500 dark:border-cyan-400');
        }
      }

      // Unchecked state
      switch (variant) {
        case 'primary':
          return cn(
            base,
            'border-cyan-300 dark:border-cyan-700',
            'hover:border-cyan-400 dark:hover:border-cyan-600',
            error && 'border-red-500 dark:border-red-400'
          );
        case 'success':
          return cn(base, 'border-green-300 dark:border-green-700', 'hover:border-green-400 dark:hover:border-green-600');
        case 'warning':
          return cn(base, 'border-yellow-300 dark:border-yellow-700', 'hover:border-yellow-400 dark:hover:border-yellow-600');
        case 'error':
          return cn(base, 'border-red-300 dark:border-red-700', 'hover:border-red-400 dark:hover:border-red-600');
        case 'ghost':
          return cn(
            base,
            'border-gray-300 dark:border-gray-700',
            'hover:bg-gray-50 dark:hover:bg-gray-900',
            'hover:border-gray-400 dark:hover:border-gray-600'
          );
        default:
          return cn(
            base,
            'border-gray-300 dark:border-gray-700',
            'hover:border-gray-400 dark:hover:border-gray-600',
            error && 'border-red-500 dark:border-red-400'
          );
      }
    };

    // Get dot color based on variant
    const getDotColor = () => {
      if (!checked) return '';
      
      switch (variant) {
        case 'primary':
          return 'bg-cyan-500 dark:bg-cyan-400';
        case 'success':
          return 'bg-green-500 dark:bg-green-400';
        case 'warning':
          return 'bg-yellow-500 dark:bg-yellow-400';
        case 'error':
          return 'bg-red-500 dark:bg-red-400';
        case 'ghost':
          return 'bg-gray-600 dark:bg-gray-400';
        default:
          return 'bg-cyan-500 dark:bg-cyan-400';
      }
    };

    const radioElement = (
      <div className={cn('relative inline-flex', sizeClasses[size])}>
        <input
          ref={ref}
          type="radio"
          checked={checked}
          disabled={disabled}
          onChange={onChange}
          className="sr-only peer"
          {...props}
        />
        <div
          className={cn(
            getVariantClasses(),
            'cursor-pointer',
            'peer-focus-visible:ring-2 peer-focus-visible:ring-cyan-500/20 peer-focus-visible:ring-offset-2',
            'peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
            className
          )}
        >
          {checked && (
            <div className={cn(
              'rounded-full transition-all duration-200',
              dotSizeClasses[size],
              getDotColor()
            )} />
          )}
        </div>
      </div>
    );

    if (!label && !description) {
      return radioElement;
    }

    return (
      <div className={cn('relative', containerClassName)}>
        <label
          className={cn(
            'flex gap-3 cursor-pointer',
            labelPosition === 'left' && 'flex-row-reverse justify-end',
            disabled && 'cursor-not-allowed opacity-50'
          )}
        >
          {radioElement}
          
          {(label || description) && (
            <div className="flex flex-col">
              {label && (
                <span className={cn(
                  'leading-tight',
                  labelSizeClasses[size],
                  'text-gray-700 dark:text-gray-300',
                  error && 'text-red-500 dark:text-red-400'
                )}>
                  {label}
                </span>
              )}
              {description && (
                <span className={cn(
                  'text-sm text-gray-500 dark:text-gray-400 mt-0.5',
                  error && 'text-red-400 dark:text-red-500'
                )}>
                  {description}
                </span>
              )}
            </div>
          )}
        </label>
      </div>
    );
  }
);

RadioPremium.displayName = 'RadioPremium';

// Radio Group Component
export interface RadioGroupProps {
  /** Group label */
  label?: string;
  /** Group description */
  description?: string;
  /** Options for the group */
  options: Array<{
    value: string;
    label: React.ReactNode;
    description?: string;
    disabled?: boolean;
  }>;
  /** Selected value */
  value?: string;
  /** Callback when selection changes */
  onChange?: (value: string) => void;
  /** Visual style variant */
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'ghost';
  /** Size of radio buttons */
  size?: 'sm' | 'md' | 'lg';
  /** Orientation of the group */
  orientation?: 'horizontal' | 'vertical';
  /** Error state with optional message */
  error?: boolean | string;
  /** Whether the field is required */
  required?: boolean;
  /** Container className */
  className?: string;
  /** Name attribute for the radio group */
  name?: string;
}

export const RadioGroup = React.forwardRef<HTMLDivElement, RadioGroupProps>(
  ({
    label,
    description,
    options,
    value,
    onChange,
    variant = 'default',
    size = 'md',
    orientation = 'vertical',
    error = false,
    required = false,
    className,
    name,
    ...props
  }, ref) => {
    const hasError = !!error;
    const errorMessage = typeof error === 'string' ? error : '';
    
    // Generate a unique name if not provided
    const groupName = name || React.useId();

    const handleChange = (optionValue: string) => {
      onChange?.(optionValue);
    };

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
          {options.map((option) => (
            <RadioPremium
              key={option.value}
              name={groupName}
              value={option.value}
              checked={value === option.value}
              onChange={() => handleChange(option.value)}
              disabled={option.disabled}
              label={option.label}
              description={option.description}
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

RadioGroup.displayName = 'RadioGroup';

export { RadioPremium };