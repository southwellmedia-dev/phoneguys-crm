'use client';

import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ButtonPremium } from '../buttons/button-premium';
import { cva, type VariantProps } from 'class-variance-authority';

const modalVariants = cva(
  'fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6',
  {
    variants: {
      position: {
        center: 'items-center',
        top: 'items-start pt-20',
        bottom: 'items-end pb-20',
      },
    },
    defaultVariants: {
      position: 'center',
    },
  }
);

const modalContentVariants = cva(
  'relative bg-white dark:bg-gray-900 rounded-lg shadow-2xl w-full max-h-[90vh] overflow-hidden border',
  {
    variants: {
      size: {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-xl',
        '2xl': 'max-w-2xl',
        '3xl': 'max-w-3xl',
        '4xl': 'max-w-4xl',
        full: 'max-w-[95vw]',
      },
      variant: {
        default: 'border-gray-200 dark:border-gray-800',
        primary: 'border-cyan-200 dark:border-cyan-900',
        danger: 'border-red-200 dark:border-red-900',
        success: 'border-emerald-200 dark:border-emerald-900',
        warning: 'border-amber-200 dark:border-amber-900',
      },
    },
    defaultVariants: {
      size: 'md',
      variant: 'default',
    },
  }
);

export interface ModalPremiumProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Root>,
    VariantProps<typeof modalVariants>,
    VariantProps<typeof modalContentVariants> {
  title?: string;
  description?: string;
  showCloseButton?: boolean;
  footer?: React.ReactNode;
  overlayClassName?: string;
  contentClassName?: string;
  headerClassName?: string;
  bodyClassName?: string;
  footerClassName?: string;
  onClose?: () => void;
}

const ModalPremium = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  ModalPremiumProps
>(
  (
    {
      children,
      title,
      description,
      showCloseButton = true,
      footer,
      position,
      size,
      variant,
      overlayClassName,
      contentClassName,
      headerClassName,
      bodyClassName,
      footerClassName,
      onClose,
      ...props
    },
    ref
  ) => {
    return (
      <DialogPrimitive.Root {...props}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay
            className={cn(
              'fixed inset-0 z-50 bg-black/50 backdrop-blur-sm animate-in fade-in-0',
              overlayClassName
            )}
          />
          <div className={cn(modalVariants({ position }))}>
            <DialogPrimitive.Content
              ref={ref}
              className={cn(
                modalContentVariants({ size, variant }),
                'animate-in fade-in-0 zoom-in-95',
                contentClassName
              )}
              onEscapeKeyDown={onClose}
              onPointerDownOutside={onClose}
            >
              {(title || description || showCloseButton) && (
                <div
                  className={cn(
                    'px-6 py-4 border-b',
                    variant === 'primary' && 'border-cyan-200 dark:border-cyan-900 bg-cyan-50/50 dark:bg-cyan-950/20',
                    variant === 'danger' && 'border-red-200 dark:border-red-900 bg-red-50/50 dark:bg-red-950/20',
                    variant === 'success' && 'border-emerald-200 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/20',
                    variant === 'warning' && 'border-amber-200 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/20',
                    variant === 'default' && 'border-gray-200 dark:border-gray-800',
                    headerClassName
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      {title && (
                        <DialogPrimitive.Title className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                          {title}
                        </DialogPrimitive.Title>
                      )}
                      {description && (
                        <DialogPrimitive.Description className="text-sm text-gray-600 dark:text-gray-400">
                          {description}
                        </DialogPrimitive.Description>
                      )}
                    </div>
                    {showCloseButton && (
                      <DialogPrimitive.Close asChild>
                        <button
                          onClick={onClose}
                          className="rounded-lg p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800 transition-colors"
                        >
                          <X className="h-4 w-4" />
                          <span className="sr-only">Close</span>
                        </button>
                      </DialogPrimitive.Close>
                    )}
                  </div>
                </div>
              )}
              <div
                className={cn(
                  'px-6 py-4 overflow-y-auto max-h-[calc(90vh-8rem)]',
                  bodyClassName
                )}
              >
                {children}
              </div>
              {footer && (
                <div
                  className={cn(
                    'px-6 py-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50',
                    footerClassName
                  )}
                >
                  {footer}
                </div>
              )}
            </DialogPrimitive.Content>
          </div>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    );
  }
);

ModalPremium.displayName = 'ModalPremium';

// Convenience components for common modal patterns
export const ModalTrigger = DialogPrimitive.Trigger;
export const ModalClose = DialogPrimitive.Close;

// Confirmation Modal Component
export interface ConfirmModalProps extends Omit<ModalPremiumProps, 'children' | 'footer'> {
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: 'default' | 'gradient' | 'glass' | 'glow' | 'soft' | 'success' | 'warning' | 'error' | 'info';
  onConfirm?: () => void;
  onCancel?: () => void;
  isLoading?: boolean;
}

export function ConfirmModal({
  title = 'Confirm Action',
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmVariant = 'default',
  onConfirm,
  onCancel,
  isLoading = false,
  variant = 'default',
  ...props
}: ConfirmModalProps) {
  return (
    <ModalPremium
      title={title}
      variant={variant}
      size="sm"
      footer={
        <div className="flex gap-3 justify-end">
          <ModalClose asChild>
            <ButtonPremium
              variant="soft"
              onClick={onCancel}
              disabled={isLoading}
            >
              {cancelLabel}
            </ButtonPremium>
          </ModalClose>
          <ModalClose asChild>
            <ButtonPremium
              variant={confirmVariant}
              onClick={onConfirm}
              loading={isLoading}
            >
              {confirmLabel}
            </ButtonPremium>
          </ModalClose>
        </div>
      }
      {...props}
    >
      <p className="text-gray-700 dark:text-gray-300">{message}</p>
    </ModalPremium>
  );
}

export { ModalPremium };