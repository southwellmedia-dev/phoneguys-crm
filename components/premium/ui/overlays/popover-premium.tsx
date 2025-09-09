'use client';

import * as React from 'react';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';
import { X } from 'lucide-react';

const popoverContentVariants = cva(
  'z-50 rounded-lg border bg-card shadow-md outline-none animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
  {
    variants: {
      variant: {
        default: 'border-border',
        primary: 'border-primary',
        success: 'border-green-500',
        warning: 'border-amber-500',
        danger: 'border-red-500',
        info: 'border-blue-500',
      },
      size: {
        sm: 'w-48 p-2',
        md: 'w-64 p-3',
        lg: 'w-80 p-4',
        xl: 'w-96 p-4',
        auto: 'p-4',
      },
      arrow: {
        true: '',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
      arrow: true,
    },
  }
);

const Popover = PopoverPrimitive.Root;

const PopoverTrigger = PopoverPrimitive.Trigger;

const PopoverAnchor = PopoverPrimitive.Anchor;

const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content> &
    VariantProps<typeof popoverContentVariants> & {
      showCloseButton?: boolean;
    }
>(
  (
    {
      className,
      variant,
      size,
      arrow,
      showCloseButton = false,
      align = 'center',
      sideOffset = 4,
      children,
      ...props
    },
    ref
  ) => (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        ref={ref}
        align={align}
        sideOffset={sideOffset}
        className={cn(popoverContentVariants({ variant, size }), className)}
        {...props}
      >
        {showCloseButton && (
          <PopoverPrimitive.Close className="absolute right-2 top-2 rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-gray-100 dark:ring-offset-gray-950 dark:focus:ring-gray-800 dark:data-[state=open]:bg-gray-800">
            <X className="h-3 w-3" />
            <span className="sr-only">Close</span>
          </PopoverPrimitive.Close>
        )}
        {children}
        {arrow && (
          <PopoverPrimitive.Arrow
            className={cn(
              'fill-current',
              variant === 'default' && 'text-white dark:text-gray-900',
              variant === 'primary' && 'text-cyan-50 dark:text-cyan-950',
              variant === 'success' && 'text-emerald-50 dark:text-emerald-950',
              variant === 'warning' && 'text-amber-50 dark:text-amber-950',
              variant === 'danger' && 'text-red-50 dark:text-red-950',
              variant === 'info' && 'text-blue-50 dark:text-blue-950'
            )}
          />
        )}
      </PopoverPrimitive.Content>
    </PopoverPrimitive.Portal>
  )
);
PopoverContent.displayName = PopoverPrimitive.Content.displayName;

// Menu Popover Component
export interface MenuPopoverProps {
  trigger: React.ReactNode;
  items: Array<{
    label: string;
    icon?: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    danger?: boolean;
    separator?: boolean;
  }>;
  variant?: VariantProps<typeof popoverContentVariants>['variant'];
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
  className?: string;
}

export function MenuPopover({
  trigger,
  items,
  variant = 'default',
  side = 'bottom',
  align = 'start',
  className,
}: MenuPopoverProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent
        variant={variant}
        size="auto"
        side={side}
        align={align}
        arrow={false}
        className={cn('w-56 p-1', className)}
      >
        <div className="flex flex-col">
          {items.map((item, index) => {
            if (item.separator) {
              return (
                <div
                  key={index}
                  className="my-1 h-px bg-gray-200 dark:bg-gray-800"
                />
              );
            }

            return (
              <button
                key={index}
                onClick={() => {
                  item.onClick?.();
                  setOpen(false);
                }}
                disabled={item.disabled}
                className={cn(
                  'flex items-center gap-2 rounded-md px-2 py-1 text-sm transition-colors',
                  'hover:bg-gray-100 dark:hover:bg-gray-800',
                  'focus:bg-gray-100 dark:focus:bg-gray-800 focus:outline-none',
                  item.disabled && 'opacity-50 cursor-not-allowed',
                  item.danger && 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50'
                )}
              >
                {item.icon && (
                  <span className="flex-shrink-0 w-4 h-4">{item.icon}</span>
                )}
                <span className="flex-1 text-left">{item.label}</span>
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Info Popover Component
export interface InfoPopoverProps {
  trigger: React.ReactNode;
  title?: string;
  description?: string;
  content?: React.ReactNode;
  variant?: VariantProps<typeof popoverContentVariants>['variant'];
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
  className?: string;
}

export function InfoPopover({
  trigger,
  title,
  description,
  content,
  variant = 'default',
  side = 'top',
  align = 'center',
  className,
}: InfoPopoverProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent
        variant={variant}
        size="lg"
        side={side}
        align={align}
        className={className}
      >
        {content || (
          <div className="space-y-2">
            {title && (
              <h4 className="font-semibold text-sm">
                {title}
              </h4>
            )}
            {description && (
              <p className="text-sm text-muted-foreground">
                {description}
              </p>
            )}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

export { Popover, PopoverTrigger, PopoverContent, PopoverAnchor };