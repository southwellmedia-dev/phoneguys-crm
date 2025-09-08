'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { AlertCircle, Info, HelpCircle } from 'lucide-react';

export interface FormFieldWrapperProps {
  /** Field label */
  label?: string;
  /** Field description shown below label */
  description?: string;
  /** Helper text shown below the field */
  helperText?: string;
  /** Error message */
  error?: boolean | string;
  /** Success message */
  success?: boolean | string;
  /** Warning message */
  warning?: boolean | string;
  /** Info message */
  info?: string;
  /** Whether the field is required */
  required?: boolean;
  /** Tooltip text for help icon */
  tooltip?: string;
  /** Layout orientation */
  orientation?: 'vertical' | 'horizontal';
  /** Label width for horizontal layout */
  labelWidth?: string;
  /** Hide label (for accessibility, label still rendered but visually hidden) */
  hideLabel?: boolean;
  /** Additional label className */
  labelClassName?: string;
  /** Additional container className */
  className?: string;
  /** The form field component(s) */
  children: React.ReactNode;
}

const FormFieldWrapper = React.forwardRef<HTMLDivElement, FormFieldWrapperProps>(
  ({
    label,
    description,
    helperText,
    error = false,
    success = false,
    warning = false,
    info,
    required = false,
    tooltip,
    orientation = 'vertical',
    labelWidth = '150px',
    hideLabel = false,
    labelClassName,
    className,
    children,
    ...props
  }, ref) => {
    // Determine state for styling
    const hasError = !!error;
    const hasSuccess = !!success && !hasError;
    const hasWarning = !!warning && !hasError && !hasSuccess;
    
    // Get the appropriate state message
    const stateMessage = typeof error === 'string' ? error :
                        typeof success === 'string' ? success :
                        typeof warning === 'string' ? warning :
                        info || helperText;

    // Get message icon
    const getMessageIcon = () => {
      if (hasError) return <AlertCircle className="h-3.5 w-3.5" />;
      if (hasWarning) return <AlertCircle className="h-3.5 w-3.5" />;
      if (info && !hasError && !hasSuccess && !hasWarning) return <Info className="h-3.5 w-3.5" />;
      return null;
    };

    const labelElement = label && (
      <label className={cn(
        'block font-medium',
        orientation === 'vertical' ? 'mb-1.5 text-sm' : 'text-base',
        'text-gray-700 dark:text-gray-300',
        hasError && 'text-red-500 dark:text-red-400',
        hasSuccess && 'text-green-500 dark:text-green-400',
        hasWarning && 'text-yellow-500 dark:text-yellow-400',
        hideLabel && 'sr-only',
        labelClassName
      )}
      style={orientation === 'horizontal' ? { minWidth: labelWidth, width: labelWidth } : undefined}
    >
      <span className="flex items-center gap-1.5">
        <span>
          {label}
          {required && <span className="ml-0.5 text-red-500">*</span>}
        </span>
        {tooltip && (
          <span 
            className="inline-flex"
            title={tooltip}
          >
            <HelpCircle className="h-3.5 w-3.5 text-gray-400 hover:text-gray-500 dark:text-gray-600 dark:hover:text-gray-500 cursor-help" />
          </span>
        )}
      </span>
      {description && orientation === 'vertical' && (
        <span className="mt-0.5 text-xs font-normal text-gray-500 dark:text-gray-400">
          {description}
        </span>
      )}
    </label>
    );

    return (
      <div
        ref={ref}
        className={cn(
          'space-y-1.5',
          className
        )}
        {...props}
      >
        {orientation === 'vertical' ? (
          <>
            {labelElement}
            {children}
            {stateMessage && (
              <div className={cn(
                'flex items-start gap-1.5 text-sm',
                hasError && 'text-red-500 dark:text-red-400',
                hasSuccess && 'text-green-500 dark:text-green-400',
                hasWarning && 'text-yellow-500 dark:text-yellow-400',
                !hasError && !hasSuccess && !hasWarning && 'text-gray-500 dark:text-gray-400'
              )}>
                {getMessageIcon()}
                <span>{stateMessage}</span>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="flex items-start gap-4">
              {labelElement}
              <div className="flex-1 space-y-1.5">
                {description && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 -mt-1 mb-2">
                    {description}
                  </p>
                )}
                {children}
                {stateMessage && (
                  <div className={cn(
                    'flex items-start gap-1.5 text-sm',
                    hasError && 'text-red-500 dark:text-red-400',
                    hasSuccess && 'text-green-500 dark:text-green-400',
                    hasWarning && 'text-yellow-500 dark:text-yellow-400',
                    !hasError && !hasSuccess && !hasWarning && 'text-gray-500 dark:text-gray-400'
                  )}>
                    {getMessageIcon()}
                    <span>{stateMessage}</span>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    );
  }
);

FormFieldWrapper.displayName = 'FormFieldWrapper';

// Form Section Component for grouping related fields
export interface FormSectionProps {
  /** Section title */
  title?: string;
  /** Section description */
  description?: string;
  /** Whether to show a separator line above the section */
  separator?: boolean;
  /** Collapse behavior */
  collapsible?: boolean;
  /** Default collapsed state */
  defaultCollapsed?: boolean;
  /** Additional className */
  className?: string;
  /** The form fields */
  children: React.ReactNode;
}

const FormSection = React.forwardRef<HTMLDivElement, FormSectionProps>(
  ({
    title,
    description,
    separator = true,
    collapsible = false,
    defaultCollapsed = false,
    className,
    children,
    ...props
  }, ref) => {
    const [isCollapsed, setIsCollapsed] = React.useState(defaultCollapsed);

    return (
      <div
        ref={ref}
        className={cn(
          'space-y-4',
          separator && 'pt-6 first:pt-0',
          className
        )}
        {...props}
      >
        {separator && <div className="border-t border-gray-200 dark:border-gray-800 -mt-2 first:hidden" />}
        
        {(title || description) && (
          <div 
            className={cn(
              'space-y-1',
              collapsible && 'cursor-pointer select-none'
            )}
            onClick={collapsible ? () => setIsCollapsed(!isCollapsed) : undefined}
          >
            {title && (
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 flex items-center justify-between">
                {title}
                {collapsible && (
                  <svg
                    className={cn(
                      'h-4 w-4 text-gray-400 transition-transform duration-200',
                      isCollapsed && '-rotate-90'
                    )}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                )}
              </h3>
            )}
            {description && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {description}
              </p>
            )}
          </div>
        )}
        
        {(!collapsible || !isCollapsed) && (
          <div className="space-y-4">
            {children}
          </div>
        )}
      </div>
    );
  }
);

FormSection.displayName = 'FormSection';

// Form Grid Component for layout
export interface FormGridProps {
  /** Number of columns */
  columns?: 1 | 2 | 3 | 4;
  /** Gap between items */
  gap?: 'sm' | 'md' | 'lg';
  /** Responsive behavior */
  responsive?: boolean;
  /** Additional className */
  className?: string;
  /** The form fields */
  children: React.ReactNode;
}

const FormGrid = React.forwardRef<HTMLDivElement, FormGridProps>(
  ({
    columns = 2,
    gap = 'md',
    responsive = true,
    className,
    children,
    ...props
  }, ref) => {
    const gapClasses = {
      sm: 'gap-2',
      md: 'gap-4',
      lg: 'gap-6'
    };

    const gridClasses = {
      1: 'grid-cols-1',
      2: responsive ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-2',
      3: responsive ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-3',
      4: responsive ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4' : 'grid-cols-4'
    };

    return (
      <div
        ref={ref}
        className={cn(
          'grid',
          gridClasses[columns],
          gapClasses[gap],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

FormGrid.displayName = 'FormGrid';

export { FormFieldWrapper, FormSection, FormGrid };