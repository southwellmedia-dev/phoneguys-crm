'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Check, Minus } from 'lucide-react';

export interface CheckboxPremiumProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'type'> {
  /** Visual style variant */
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'ghost';
  /** Size of the checkbox */
  size?: 'sm' | 'md' | 'lg';
  /** Label for the checkbox */
  label?: React.ReactNode;
  /** Description text below the label */
  description?: string;
  /** Error state with optional message */
  error?: boolean | string;
  /** Indeterminate state (for parent checkboxes) */
  indeterminate?: boolean;
  /** Position of the label */
  labelPosition?: 'left' | 'right';
  /** Custom icon for checked state */
  checkedIcon?: React.ReactNode;
  /** Container className */
  containerClassName?: string;
}

const CheckboxPremium = React.forwardRef<HTMLInputElement, CheckboxPremiumProps>(
  ({
    className,
    containerClassName,
    variant = 'default',
    size = 'md',
    label,
    description,
    error = false,
    indeterminate = false,
    labelPosition = 'right',
    checkedIcon,
    checked,
    disabled = false,
    onChange,
    ...props
  }, ref) => {
    const inputRef = React.useRef<HTMLInputElement>(null);
    
    // Merge refs
    React.useImperativeHandle(ref, () => inputRef.current as HTMLInputElement);
    
    // Handle indeterminate state
    React.useEffect(() => {
      if (inputRef.current) {
        inputRef.current.indeterminate = indeterminate;
      }
    }, [indeterminate]);

    const hasError = !!error;
    const errorMessage = typeof error === 'string' ? error : '';

    // Size classes
    const sizeClasses = {
      sm: 'h-4 w-4',
      md: 'h-5 w-5',
      lg: 'h-6 w-6'
    };

    const iconSizeClasses = {
      sm: 'h-3 w-3',
      md: 'h-3.5 w-3.5',
      lg: 'h-4 w-4'
    };

    const labelSizeClasses = {
      sm: 'text-sm',
      md: 'text-base',
      lg: 'text-lg'
    };

    // Variant classes for the checkbox box
    const getVariantClasses = () => {
      const base = cn(
        'rounded border-2 transition-all duration-200',
        'flex items-center justify-center',
        sizeClasses[size]
      );

      if (checked || indeterminate) {
        switch (variant) {
          case 'primary':
            return cn(base, 'bg-cyan-500 border-cyan-500 text-white');
          case 'success':
            return cn(base, 'bg-green-500 border-green-500 text-white');
          case 'warning':
            return cn(base, 'bg-yellow-500 border-yellow-500 text-white');
          case 'error':
            return cn(base, 'bg-red-500 border-red-500 text-white');
          case 'ghost':
            return cn(base, 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300');
          default:
            return cn(base, 'bg-cyan-500 border-cyan-500 text-white');
        }
      }

      // Unchecked state
      switch (variant) {
        case 'primary':
          return cn(
            base,
            'border-cyan-300 dark:border-cyan-700',
            'hover:border-cyan-400 dark:hover:border-cyan-600',
            hasError && 'border-red-500 dark:border-red-400'
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
            hasError && 'border-red-500 dark:border-red-400'
          );
      }
    };

    const checkboxElement = (
      <div className={cn('relative inline-flex', sizeClasses[size])}>
        <input
          ref={inputRef}
          type="checkbox"
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
          onClick={() => {
            if (!disabled && inputRef.current) {
              inputRef.current.click();
            }
          }}
        >
          {indeterminate ? (
            <Minus className={cn(iconSizeClasses[size], 'stroke-[3]')} />
          ) : checked ? (
            checkedIcon || <Check className={cn(iconSizeClasses[size], 'stroke-[3]')} />
          ) : null}
        </div>
      </div>
    );

    if (!label && !description && !errorMessage) {
      return checkboxElement;
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
          {checkboxElement}
          
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

CheckboxPremium.displayName = 'CheckboxPremium';

// Checkbox Group Component
export interface CheckboxGroupProps {
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
  /** Selected values */
  value?: string[];
  /** Callback when selection changes */
  onChange?: (value: string[]) => void;
  /** Visual style variant */
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'ghost';
  /** Size of checkboxes */
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

export const CheckboxGroup = React.forwardRef<HTMLDivElement, CheckboxGroupProps>(
  ({
    label,
    description,
    options,
    value = [],
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

    const handleChange = (optionValue: string, checked: boolean) => {
      if (!onChange) return;
      
      if (checked) {
        onChange([...value, optionValue]);
      } else {
        onChange(value.filter(v => v !== optionValue));
      }
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
            <CheckboxPremium
              key={option.value}
              checked={value.includes(option.value)}
              onChange={(e) => handleChange(option.value, e.target.checked)}
              disabled={option.disabled}
              label={option.label}
              description={option.description}
              variant={variant}
              size={size}
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

CheckboxGroup.displayName = 'CheckboxGroup';

export { CheckboxPremium };