'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Check, ChevronDown, X, Search, Loader2, AlertCircle } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
  icon?: React.ReactNode;
  description?: string;
}

export interface SelectPremiumProps {
  /** Options to display */
  options: SelectOption[];
  /** Currently selected value(s) */
  value?: string | string[];
  /** Callback when selection changes */
  onChange?: (value: string | string[]) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Visual style variant */
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'ghost';
  /** Size of the select */
  size?: 'sm' | 'md' | 'lg';
  /** Allow multiple selection */
  multiple?: boolean;
  /** Allow searching through options */
  searchable?: boolean;
  /** Search placeholder */
  searchPlaceholder?: string;
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
  /** Label for the select */
  label?: string;
  /** Helper text below the select */
  helperText?: string;
  /** Whether the field is required */
  required?: boolean;
  /** Custom empty message */
  emptyMessage?: string;
  /** Icon to display on the left */
  leftIcon?: React.ReactNode;
  /** Container className */
  containerClassName?: string;
  /** Trigger button className */
  className?: string;
}

const SelectPremium = React.forwardRef<HTMLButtonElement, SelectPremiumProps>(
  ({
    options = [],
    value,
    onChange,
    placeholder = 'Select an option',
    variant = 'default',
    size = 'md',
    multiple = false,
    searchable = true,
    searchPlaceholder = 'Search...',
    clearable = false,
    loading = false,
    disabled = false,
    error = false,
    success = false,
    warning = false,
    label,
    helperText,
    required = false,
    emptyMessage = 'No options found',
    leftIcon,
    containerClassName,
    className,
  }, ref) => {
    const [open, setOpen] = React.useState(false);
    const [searchQuery, setSearchQuery] = React.useState('');

    // Normalize value to array for consistent handling
    const selectedValues = React.useMemo(() => {
      if (!value) return [];
      return Array.isArray(value) ? value : [value];
    }, [value]);

    // Get display text for selected values
    const getDisplayText = () => {
      if (selectedValues.length === 0) return placeholder;
      
      if (multiple) {
        if (selectedValues.length === 1) {
          const option = options.find(o => o.value === selectedValues[0]);
          return option?.label || selectedValues[0];
        }
        return `${selectedValues.length} selected`;
      }
      
      const option = options.find(o => o.value === selectedValues[0]);
      return option?.label || selectedValues[0];
    };

    // Filter options based on search
    const filteredOptions = React.useMemo(() => {
      if (!searchQuery) return options;
      
      const query = searchQuery.toLowerCase();
      return options.filter(option => 
        option.label.toLowerCase().includes(query) ||
        option.value.toLowerCase().includes(query) ||
        option.description?.toLowerCase().includes(query)
      );
    }, [options, searchQuery]);

    // Handle selection
    const handleSelect = (optionValue: string) => {
      if (multiple) {
        const newValues = selectedValues.includes(optionValue)
          ? selectedValues.filter(v => v !== optionValue)
          : [...selectedValues, optionValue];
        onChange?.(newValues);
      } else {
        onChange?.(optionValue);
        setOpen(false);
      }
      setSearchQuery('');
    };

    // Handle clear
    const handleClear = (e: React.MouseEvent) => {
      e.stopPropagation();
      onChange?.(multiple ? [] : '');
    };

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
                selectedValues.length > 0 
                  ? 'text-gray-900 dark:text-gray-100' 
                  : 'text-gray-400 dark:text-gray-600',
                
                // Padding adjustments for icons
                leftIcon && (size === 'sm' ? 'pl-8' : size === 'md' ? 'pl-10' : 'pl-12'),
                
                className
              )}
            >
              <div className="flex items-center gap-2 flex-1 truncate">
                {leftIcon && (
                  <span className={iconColorClasses}>
                    {leftIcon}
                  </span>
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
                {hasSuccess && !loading && !hasError && (
                  <Check className={cn(iconSizeClasses[size], 'text-green-500')} />
                )}
                {hasWarning && !loading && !hasError && !hasSuccess && (
                  <AlertCircle className={cn(iconSizeClasses[size], 'text-yellow-500')} />
                )}
                {clearable && selectedValues.length > 0 && !disabled && (
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
                <ChevronDown className={cn(
                  iconSizeClasses[size],
                  'transition-transform duration-200',
                  open && 'rotate-180',
                  iconColorClasses
                )} />
              </div>
            </button>
          </PopoverTrigger>
          
          <PopoverContent 
            className="w-full p-0" 
            align="start"
            style={{ width: 'var(--radix-popover-trigger-width)' }}
          >
            <div className="flex flex-col max-h-[300px]">
              {searchable && (
                <div className="flex items-center border-b px-3">
                  <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                  <input
                    placeholder={searchPlaceholder}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
                  />
                </div>
              )}
              <div className="overflow-auto p-1">
                {filteredOptions.length === 0 ? (
                  <div className="py-6 text-center text-sm text-muted-foreground">
                    {emptyMessage}
                  </div>
                ) : (
                  filteredOptions.map((option) => {
                    const isSelected = selectedValues.includes(option.value);
                    
                    return (
                      <div
                        key={option.value}
                        onClick={() => {
                          if (!option.disabled) {
                            handleSelect(option.value);
                          }
                        }}
                        className={cn(
                          'flex items-center gap-2 px-2 py-1.5 cursor-pointer rounded-sm',
                          'hover:bg-cyan-50 hover:text-cyan-900 dark:hover:bg-cyan-950/20 dark:hover:text-cyan-100',
                          isSelected && 'bg-cyan-100 text-cyan-900 dark:bg-cyan-950/30 dark:text-cyan-100',
                          option.disabled && 'opacity-50 cursor-not-allowed pointer-events-none'
                        )}
                      >
                        {multiple && (
                          <div className={cn(
                            'h-4 w-4 rounded-sm border',
                            isSelected 
                              ? 'bg-cyan-500 border-cyan-500' 
                              : 'border-gray-300 dark:border-gray-700'
                          )}>
                            {isSelected && (
                              <Check className="h-3 w-3 text-white" />
                            )}
                          </div>
                        )}
                        
                        {option.icon && (
                          <span className="text-current opacity-70">
                            {option.icon}
                          </span>
                        )}
                        
                        <div className="flex-1">
                          <div className="font-medium">{option.label}</div>
                          {option.description && (
                            <div className="text-xs opacity-60">
                              {option.description}
                            </div>
                          )}
                        </div>
                        
                        {!multiple && isSelected && (
                          <Check className={cn(iconSizeClasses.sm, 'text-cyan-500')} />
                        )}
                      </div>
                    );
                  })
                )}
              </div>
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

SelectPremium.displayName = 'SelectPremium';

export { SelectPremium, type SelectOption };