'use client';

import * as React from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';

const tooltipContentVariants = cva(
  'z-50 overflow-hidden rounded-md px-2 py-1 text-xs animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
  {
    variants: {
      variant: {
        default: 'bg-gray-900 text-white dark:bg-gray-800',
        primary: 'bg-primary text-primary-foreground',
        success: 'bg-green-600 text-white',
        warning: 'bg-amber-600 text-white',
        danger: 'bg-red-600 text-white',
        info: 'bg-blue-600 text-white',
        light: 'bg-card border border-border text-foreground',
      },
      arrow: {
        true: '',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      arrow: true,
    },
  }
);

const TooltipProvider = TooltipPrimitive.Provider;

const Tooltip = TooltipPrimitive.Root;

const TooltipTrigger = TooltipPrimitive.Trigger;

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content> &
    VariantProps<typeof tooltipContentVariants>
>(({ className, variant, arrow, sideOffset = 4, ...props }, ref) => (
  <TooltipPrimitive.Portal>
    <TooltipPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(tooltipContentVariants({ variant }), className)}
      {...props}
    >
      {props.children}
      {arrow && (
        <TooltipPrimitive.Arrow
          className={cn(
            'fill-current',
            variant === 'default' && 'text-gray-900 dark:text-gray-50',
            variant === 'primary' && 'text-cyan-600 dark:text-cyan-500',
            variant === 'success' && 'text-emerald-600 dark:text-emerald-500',
            variant === 'warning' && 'text-amber-600 dark:text-amber-500',
            variant === 'danger' && 'text-red-600 dark:text-red-500',
            variant === 'info' && 'text-blue-600 dark:text-blue-500',
            variant === 'light' && 'text-white dark:text-gray-800'
          )}
        />
      )}
    </TooltipPrimitive.Content>
  </TooltipPrimitive.Portal>
));
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

// Simple Tooltip Component for quick use
export interface SimpleTooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  variant?: VariantProps<typeof tooltipContentVariants>['variant'];
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
  delayDuration?: number;
  className?: string;
  contentClassName?: string;
  arrow?: boolean;
}

export function SimpleTooltip({
  content,
  children,
  variant = 'default',
  side = 'top',
  align = 'center',
  delayDuration = 200,
  className,
  contentClassName,
  arrow = true,
}: SimpleTooltipProps) {
  return (
    <TooltipProvider delayDuration={delayDuration}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={cn('inline-flex', className)}>{children}</span>
        </TooltipTrigger>
        <TooltipContent
          variant={variant}
          side={side}
          align={align}
          arrow={arrow}
          className={contentClassName}
        >
          {content}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Rich Tooltip with title and description
export interface RichTooltipProps extends SimpleTooltipProps {
  title?: string;
  description?: string;
}

export function RichTooltip({
  title,
  description,
  content,
  children,
  variant = 'light',
  side = 'top',
  align = 'center',
  delayDuration = 200,
  className,
  contentClassName,
  arrow = true,
}: RichTooltipProps) {
  return (
    <TooltipProvider delayDuration={delayDuration}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={cn('inline-flex', className)}>{children}</span>
        </TooltipTrigger>
        <TooltipContent
          variant={variant}
          side={side}
          align={align}
          arrow={arrow}
          className={cn('max-w-xs p-2', contentClassName)}
        >
          {content || (
            <div className="space-y-1">
              {title && (
                <div className="font-semibold text-xs">{title}</div>
              )}
              {description && (
                <div className="text-xs opacity-90">{description}</div>
              )}
            </div>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Keyboard Shortcut Tooltip
export interface KeyboardTooltipProps extends Omit<SimpleTooltipProps, 'content'> {
  keys: string[];
  description?: string;
}

export function KeyboardTooltip({
  keys,
  description,
  children,
  ...props
}: KeyboardTooltipProps) {
  return (
    <SimpleTooltip
      content={
        <div className="flex items-center gap-2">
          {description && <span>{description}</span>}
          <div className="flex gap-1">
            {keys.map((key, index) => (
              <React.Fragment key={index}>
                <kbd className="px-1.5 py-0.5 text-xs font-semibold bg-black/20 dark:bg-white/20 rounded">
                  {key}
                </kbd>
                {index < keys.length - 1 && <span>+</span>}
              </React.Fragment>
            ))}
          </div>
        </div>
      }
      {...props}
    >
      {children}
    </SimpleTooltip>
  );
}

export {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
  TooltipPrimitive,
};