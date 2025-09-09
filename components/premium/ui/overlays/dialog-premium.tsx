'use client';

import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X, AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';

const dialogOverlayVariants = cva(
  'fixed inset-0 z-50 bg-black/40 animate-in fade-in-0',
  {
    variants: {
      blur: {
        none: '',
        sm: 'backdrop-blur-sm',
      },
    },
    defaultVariants: {
      blur: 'none',
    },
  }
);

const dialogContentVariants = cva(
  'fixed z-50 w-full rounded-lg border bg-card shadow-lg animate-in fade-in-0 zoom-in-95',
  {
    variants: {
      position: {
        center: 'left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%]',
        top: 'left-[50%] top-[20%] translate-x-[-50%]',
        bottom: 'left-[50%] bottom-[10%] translate-x-[-50%]',
      },
      size: {
        xs: 'max-w-xs',
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-xl',
        '2xl': 'max-w-2xl',
        full: 'max-w-[95vw]',
      },
      variant: {
        default: 'border-border',
        primary: 'border-primary',
        success: 'border-green-500',
        warning: 'border-amber-500',
        danger: 'border-red-500',
        info: 'border-blue-500',
      },
    },
    defaultVariants: {
      position: 'center',
      size: 'md',
      variant: 'default',
    },
  }
);

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay> &
    VariantProps<typeof dialogOverlayVariants>
>(({ className, blur, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(dialogOverlayVariants({ blur }), className)}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> &
    VariantProps<typeof dialogContentVariants> & {
      showCloseButton?: boolean;
      overlayProps?: React.ComponentPropsWithoutRef<typeof DialogOverlay>;
    }
>(
  (
    {
      className,
      children,
      position,
      size,
      variant,
      showCloseButton = true,
      overlayProps,
      ...props
    },
    ref
  ) => (
    <DialogPrimitive.Portal>
      <DialogOverlay {...overlayProps} />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(dialogContentVariants({ position, size, variant }), className)}
        {...props}
      >
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close className="absolute right-3 top-3 rounded-md p-1 opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring disabled:pointer-events-none">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  )
);
DialogContent.displayName = DialogPrimitive.Content.displayName;

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'flex flex-col space-y-1.5 p-4',
      className
    )}
    {...props}
  />
);
DialogHeader.displayName = 'DialogHeader';

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 p-4 pt-0',
      className
    )}
    {...props}
  />
);
DialogFooter.displayName = 'DialogFooter';

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      'text-base font-semibold text-foreground',
      className
    )}
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn('text-sm text-muted-foreground', className)}
    {...props}
  />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

// Alert Dialog Variant
export interface AlertDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  type?: 'info' | 'success' | 'warning' | 'error';
  title: string;
  description?: string;
  children?: React.ReactNode;
  actions?: React.ReactNode;
}

const alertIcons = {
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  error: AlertCircle,
};

const alertColors = {
  info: 'text-blue-600 dark:text-blue-400',
  success: 'text-emerald-600 dark:text-emerald-400',
  warning: 'text-amber-600 dark:text-amber-400',
  error: 'text-red-600 dark:text-red-400',
};

export function AlertDialog({
  open,
  onOpenChange,
  type = 'info',
  title,
  description,
  children,
  actions,
}: AlertDialogProps) {
  const Icon = alertIcons[type];
  const iconColor = alertColors[type];
  
  const variantMap = {
    info: 'info' as const,
    success: 'success' as const,
    warning: 'warning' as const,
    error: 'danger' as const,
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogContent
        variant={variantMap[type]}
        size="sm"
        showCloseButton={false}
      >
        <div className="p-4">
          <div className="flex gap-3">
            <div className="flex-shrink-0">
              <Icon className={cn('h-5 w-5', iconColor)} />
            </div>
            <div className="flex-1 space-y-1">
              <DialogHeader className="p-0">
                <DialogTitle>{title}</DialogTitle>
                {description && <DialogDescription>{description}</DialogDescription>}
              </DialogHeader>
              {children && <div className="text-sm text-muted-foreground pt-2">{children}</div>}
            </div>
          </div>
          {actions && <DialogFooter className="pt-4 p-0">{actions}</DialogFooter>}
        </div>
      </DialogContent>
    </DialogPrimitive.Root>
  );
}

// Sheet/Drawer Variant (slides from side)
export const SheetContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
    side?: 'left' | 'right' | 'top' | 'bottom';
    size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
    showCloseButton?: boolean;
  }
>(({ className, children, side = 'right', size = 'md', showCloseButton = true, ...props }, ref) => {
  const sizeClasses = {
    sm: side === 'left' || side === 'right' ? 'w-80' : 'h-80',
    md: side === 'left' || side === 'right' ? 'w-96' : 'h-96',
    lg: side === 'left' || side === 'right' ? 'w-[480px]' : 'h-[480px]',
    xl: side === 'left' || side === 'right' ? 'w-[640px]' : 'h-[640px]',
    full: side === 'left' || side === 'right' ? 'w-full' : 'h-full',
  };

  const positionClasses = {
    left: 'left-0 top-0 h-full slide-in-from-left',
    right: 'right-0 top-0 h-full slide-in-from-right',
    top: 'top-0 left-0 w-full slide-in-from-top',
    bottom: 'bottom-0 left-0 w-full slide-in-from-bottom',
  };

  return (
    <DialogPrimitive.Portal>
      <DialogOverlay />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          'fixed z-50 bg-card border shadow-lg transition ease-in-out',
          'data-[state=open]:animate-in data-[state=closed]:animate-out',
          'data-[state=closed]:duration-300 data-[state=open]:duration-500',
          positionClasses[side],
          sizeClasses[size],
          side === 'left' && 'border-r border-border',
          side === 'right' && 'border-l border-border',
          side === 'top' && 'border-b border-border',
          side === 'bottom' && 'border-t border-border',
          className
        )}
        {...props}
      >
        <div className="h-full overflow-y-auto p-4">
          {children}
        </div>
        {showCloseButton && (
          <DialogPrimitive.Close className="absolute right-3 top-3 rounded-md p-1 opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring disabled:pointer-events-none">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
});
SheetContent.displayName = 'SheetContent';

// Custom Dialog Body for content padding
export const DialogBody = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn('px-4 py-3', className)}
    {...props}
  />
);
DialogBody.displayName = 'DialogBody';

export {
  DialogPrimitive,
  DialogOverlay,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};

// Main exports
export const DialogPremium = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;
export const DialogPortal = DialogPrimitive.Portal;