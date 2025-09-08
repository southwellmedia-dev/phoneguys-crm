'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Loader2, AlertCircle, Check, Info } from 'lucide-react';

export interface TextareaPremiumProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'> {
  /** Visual style variant */
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'ghost';
  /** Size of the textarea */
  size?: 'sm' | 'md' | 'lg';
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
  /** Label for the textarea */
  label?: string;
  /** Helper text below the textarea */
  helperText?: string;
  /** Whether the field is required */
  required?: boolean;
  /** Show character count */
  showCount?: boolean;
  /** Auto-resize to content */
  autoResize?: boolean;
  /** Minimum rows (only with autoResize) */
  minRows?: number;
  /** Maximum rows (only with autoResize) */
  maxRows?: number;
  /** Container className */
  containerClassName?: string;
}

const TextareaPremium = React.forwardRef<HTMLTextAreaElement, TextareaPremiumProps>(
  ({
    className,
    containerClassName,
    variant = 'default',
    size = 'md',
    loading = false,
    error = false,
    success = false,
    warning = false,
    info,
    label,
    helperText,
    required = false,
    disabled = false,
    value,
    onChange,
    maxLength,
    showCount = false,
    autoResize = false,
    minRows = 3,
    maxRows = 10,
    rows = 4,
    ...props
  }, ref) => {
    const textareaRef = React.useRef<HTMLTextAreaElement>(null);
    const [charCount, setCharCount] = React.useState(0);
    
    // Merge refs
    React.useImperativeHandle(ref, () => textareaRef.current as HTMLTextAreaElement);

    // Update character count
    React.useEffect(() => {
      const length = typeof value === 'string' ? value.length : 0;
      setCharCount(length);
    }, [value]);

    // Auto-resize functionality
    React.useEffect(() => {
      if (autoResize && textareaRef.current) {
        const textarea = textareaRef.current;
        textarea.style.height = 'auto';
        
        const lineHeight = parseInt(window.getComputedStyle(textarea).lineHeight);
        const minHeight = minRows * lineHeight;
        const maxHeight = maxRows * lineHeight;
        
        const scrollHeight = textarea.scrollHeight;
        
        if (scrollHeight > maxHeight) {
          textarea.style.height = `${maxHeight}px`;
          textarea.style.overflowY = 'auto';
        } else if (scrollHeight < minHeight) {
          textarea.style.height = `${minHeight}px`;
          textarea.style.overflowY = 'hidden';
        } else {
          textarea.style.height = `${scrollHeight}px`;
          textarea.style.overflowY = 'hidden';
        }
      }
    }, [value, autoResize, minRows, maxRows]);

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
      sm: 'px-3 py-2 text-sm',
      md: 'px-4 py-3 text-base',
      lg: 'px-5 py-4 text-lg'
    };

    // Variant classes - matching input styling
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
        
        <div className="relative">
          <textarea
            ref={textareaRef}
            disabled={disabled || loading}
            value={value}
            onChange={onChange}
            rows={autoResize ? undefined : rows}
            maxLength={maxLength}
            className={cn(
              // Base styles
              'w-full rounded-md border bg-white dark:bg-gray-950',
              'transition-all duration-200',
              'placeholder:text-gray-400 dark:placeholder:text-gray-600',
              'disabled:cursor-not-allowed disabled:opacity-50',
              'focus:outline-none focus:ring-2 focus:ring-cyan-500/20',
              'resize-none', // We control resize behavior
              
              // Size
              sizeClasses[size],
              
              // Variant
              variantClasses[variant],
              
              className
            )}
            {...props}
          />
          
          {loading && (
            <div className="absolute top-3 right-3">
              <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
            </div>
          )}
          
          {!loading && hasError && (
            <div className="absolute top-3 right-3">
              <AlertCircle className="h-4 w-4 text-red-500" />
            </div>
          )}
          
          {!loading && !hasError && hasSuccess && (
            <div className="absolute top-3 right-3">
              <Check className="h-4 w-4 text-green-500" />
            </div>
          )}
          
          {!loading && !hasError && !hasSuccess && hasWarning && (
            <div className="absolute top-3 right-3">
              <AlertCircle className="h-4 w-4 text-yellow-500" />
            </div>
          )}
        </div>
        
        <div className="mt-1.5 flex items-center justify-between">
          {stateMessage && (
            <p className={cn(
              'text-sm',
              hasError && 'text-red-500 dark:text-red-400',
              hasSuccess && 'text-green-500 dark:text-green-400',
              hasWarning && 'text-yellow-500 dark:text-yellow-400',
              !hasError && !hasSuccess && !hasWarning && 'text-gray-500 dark:text-gray-400'
            )}>
              {stateMessage}
            </p>
          )}
          
          {showCount && maxLength && (
            <span className={cn(
              'text-xs',
              charCount >= maxLength ? 'text-red-500' : 'text-gray-500 dark:text-gray-400',
              stateMessage && 'ml-auto'
            )}>
              {charCount}/{maxLength}
            </span>
          )}
        </div>
      </div>
    );
  }
);

TextareaPremium.displayName = 'TextareaPremium';

export { TextareaPremium };