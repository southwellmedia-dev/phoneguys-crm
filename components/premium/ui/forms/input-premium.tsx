'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Loader2, Search, Eye, EyeOff, X, Check, AlertCircle, Info } from 'lucide-react';

export interface InputPremiumProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /** Visual style variant */
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'ghost';
  /** Size of the input */
  size?: 'sm' | 'md' | 'lg';
  /** Icon to display on the left */
  leftIcon?: React.ReactNode;
  /** Icon to display on the right */
  rightIcon?: React.ReactNode;
  /** Loading state */
  loading?: boolean;
  /** Error state with optional message */
  error?: boolean | string;
  /** Success state with optional message */
  success?: boolean | string;
  /** Warning state with optional message */
  warning?: boolean | string;
  /** Info message */
  info?: string;
  /** Allow clearing the input */
  clearable?: boolean;
  /** Callback when clear is clicked */
  onClear?: () => void;
  /** For password inputs, allow toggling visibility */
  showPasswordToggle?: boolean;
  /** Label for the input */
  label?: string;
  /** Helper text below the input */
  helperText?: string;
  /** Whether the field is required */
  required?: boolean;
  /** Container className */
  containerClassName?: string;
}

const InputPremium = React.forwardRef<HTMLInputElement, InputPremiumProps>(
  ({
    className,
    containerClassName,
    variant = 'default',
    size = 'md',
    leftIcon,
    rightIcon,
    loading = false,
    error = false,
    success = false,
    warning = false,
    info,
    clearable = false,
    onClear,
    showPasswordToggle = false,
    type = 'text',
    label,
    helperText,
    required = false,
    disabled = false,
    value,
    onChange,
    ...props
  }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false);
    const [isFocused, setIsFocused] = React.useState(false);
    
    const hasValue = value !== undefined && value !== null && value !== '';
    const isPassword = type === 'password';
    const inputType = isPassword && showPassword ? 'text' : type;

    // Determine state for styling
    const hasError = !!error;
    const hasSuccess = !!success && !hasError;
    const hasWarning = !!warning && !hasError && !hasSuccess;
    
    // Get the appropriate state message
    const stateMessage = typeof error === 'string' ? error :
                        typeof success === 'string' ? success :
                        typeof warning === 'string' ? warning :
                        info || helperText;

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

    // Variant classes - matching button and card styling
    const variantClasses = {
      default: cn(
        'border-gray-200 dark:border-gray-800',
        'focus:border-cyan-500 dark:focus:border-cyan-400',
        'hover:border-gray-300 dark:hover:border-gray-700',
        hasError && 'border-red-500 dark:border-red-400 focus:border-red-500 dark:focus:border-red-400',
        hasSuccess && 'border-green-500 dark:border-green-400 focus:border-green-500 dark:focus:border-green-400',
        hasWarning && 'border-yellow-500 dark:border-yellow-400 focus:border-yellow-500 dark:focus:border-yellow-400'
      ),
      primary: cn(
        'border-cyan-200 dark:border-cyan-800',
        'focus:border-cyan-500 dark:focus:border-cyan-400',
        'hover:border-cyan-300 dark:hover:border-cyan-700',
        hasError && 'border-red-500 dark:border-red-400',
        hasSuccess && 'border-green-500 dark:border-green-400',
        hasWarning && 'border-yellow-500 dark:border-yellow-400'
      ),
      success: 'border-green-200 dark:border-green-800 focus:border-green-500 dark:focus:border-green-400',
      warning: 'border-yellow-200 dark:border-yellow-800 focus:border-yellow-500 dark:focus:border-yellow-400',
      error: 'border-red-200 dark:border-red-800 focus:border-red-500 dark:focus:border-red-400',
      ghost: cn(
        'border-transparent',
        'hover:bg-gray-50 dark:hover:bg-gray-900',
        'focus:bg-white dark:focus:bg-gray-950 focus:border-gray-200 dark:focus:border-gray-800'
      )
    };

    // Icon color classes based on state
    const iconColorClasses = hasError ? 'text-red-500' :
                            hasSuccess ? 'text-green-500' :
                            hasWarning ? 'text-yellow-500' :
                            'text-gray-400 dark:text-gray-600';

    const handleClear = () => {
      if (onClear) {
        onClear();
      } else if (onChange) {
        // Create a synthetic event
        const syntheticEvent = {
          target: { value: '' },
          currentTarget: { value: '' }
        } as React.ChangeEvent<HTMLInputElement>;
        onChange(syntheticEvent);
      }
    };

    // Build right icons array
    const rightIcons = [];
    
    if (loading) {
      rightIcons.push(
        <Loader2 key="loader" className={cn(iconSizeClasses[size], 'animate-spin', iconColorClasses)} />
      );
    } else {
      if (hasError) {
        rightIcons.push(
          <AlertCircle key="error" className={cn(iconSizeClasses[size], 'text-red-500')} />
        );
      } else if (hasSuccess) {
        rightIcons.push(
          <Check key="success" className={cn(iconSizeClasses[size], 'text-green-500')} />
        );
      } else if (hasWarning) {
        rightIcons.push(
          <AlertCircle key="warning" className={cn(iconSizeClasses[size], 'text-yellow-500')} />
        );
      }
    }
    
    if (clearable && hasValue && !disabled) {
      rightIcons.push(
        <button
          key="clear"
          type="button"
          onClick={handleClear}
          className={cn(
            'ml-1 rounded-sm hover:opacity-70 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-0',
            iconColorClasses
          )}
        >
          <X className={iconSizeClasses[size]} />
        </button>
      );
    }
    
    if (isPassword && showPasswordToggle) {
      rightIcons.push(
        <button
          key="password"
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className={cn(
            'ml-1 rounded-sm hover:opacity-70 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-0',
            iconColorClasses
          )}
        >
          {showPassword ? (
            <EyeOff className={iconSizeClasses[size]} />
          ) : (
            <Eye className={iconSizeClasses[size]} />
          )}
        </button>
      );
    }
    
    if (rightIcon && !loading && !hasError && !hasSuccess && !hasWarning) {
      rightIcons.push(
        <span key="custom-right" className={iconColorClasses}>
          {rightIcon}
        </span>
      );
    }

    const inputElement = (
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
        
        <div className="relative">
          {leftIcon && (
            <div className={cn(
              'absolute left-0 top-0 flex h-full items-center pl-3',
              iconColorClasses
            )}>
              {leftIcon}
            </div>
          )}
          
          <input
            ref={ref}
            type={inputType}
            disabled={disabled || loading}
            value={value}
            onChange={onChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className={cn(
              // Base styles
              'w-full rounded-md border bg-white dark:bg-gray-950',
              'transition-all duration-200',
              'placeholder:text-gray-400 dark:placeholder:text-gray-600',
              'disabled:cursor-not-allowed disabled:opacity-50',
              'focus:outline-none focus:ring-2 focus:ring-cyan-500/20',
              
              // Size
              sizeClasses[size],
              
              // Variant
              variantClasses[variant],
              
              // Padding adjustments for icons
              leftIcon && (size === 'sm' ? 'pl-8' : size === 'md' ? 'pl-10' : 'pl-12'),
              rightIcons.length > 0 && (
                size === 'sm' ? 'pr-8' : 
                size === 'md' ? (rightIcons.length > 1 ? 'pr-16' : 'pr-10') : 
                (rightIcons.length > 1 ? 'pr-20' : 'pr-12')
              ),
              
              className
            )}
            {...props}
          />
          
          {rightIcons.length > 0 && (
            <div className={cn(
              'absolute right-0 top-0 flex h-full items-center pr-3 gap-1'
            )}>
              {rightIcons}
            </div>
          )}
        </div>
        
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

    return inputElement;
  }
);

InputPremium.displayName = 'InputPremium';

export { InputPremium };