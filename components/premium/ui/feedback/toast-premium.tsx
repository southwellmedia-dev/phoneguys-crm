/**
 * Premium Toast Component
 * 
 * @description Fintech-style toast notifications with positioning
 * @category Feedback
 * 
 * @example
 * ```tsx
 * <ToastContainer position="top-right">
 *   <ToastPremium
 *     variant="success"
 *     title="Success"
 *     description="Your changes have been saved."
 *     duration={5000}
 *     onClose={() => setToast(null)}
 *   />
 * </ToastContainer>
 * ```
 */

import * as React from "react";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { X, CheckCircle, AlertCircle, Info, AlertTriangle, XCircle } from "lucide-react";

const toastVariants = cva(
  "group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-lg border p-4 pr-8 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full",
  {
    variants: {
      variant: {
        // Inverted variants as default for better visibility and welcoming feel
        default: "bg-gray-800 text-white border-0 dark:bg-gray-100 dark:text-gray-900",
        primary: "bg-primary text-white border-0",
        success: "bg-green-600 text-white border-0",
        warning: "bg-yellow-600 text-white border-0",
        error: "bg-red-600 text-white border-0",
        info: "bg-blue-600 text-white border-0",
        
        // Light variants for subtle notifications
        "light-primary": "border-primary bg-primary/[0.08] text-foreground",
        "light-success": "border-green-500 bg-green-500/[0.08] text-foreground",
        "light-warning": "border-yellow-500 bg-yellow-500/[0.08] text-foreground",
        "light-error": "border-red-500 bg-red-500/[0.08] text-foreground",
        "light-info": "border-blue-500 bg-blue-500/[0.08] text-foreground",
        
        // Soft variants (minimal)
        "soft-success": "border-green-500/40 bg-green-500/[0.02] text-foreground",
        "soft-warning": "border-yellow-500/40 bg-yellow-500/[0.02] text-foreground",
        "soft-error": "border-red-500/40 bg-red-500/[0.02] text-foreground",
        "soft-info": "border-blue-500/40 bg-blue-500/[0.02] text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

const iconMap = {
  default: Info,
  primary: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  error: XCircle,
  info: Info,
  "light-primary": Info,
  "light-success": CheckCircle,
  "light-warning": AlertTriangle,
  "light-error": XCircle,
  "light-info": Info,
  "soft-success": CheckCircle,
  "soft-warning": AlertTriangle,
  "soft-error": XCircle,
  "soft-info": Info,
};

const iconColorMap = {
  default: "text-white dark:text-gray-900",
  primary: "text-white",
  success: "text-white",
  warning: "text-white",
  error: "text-white",
  info: "text-white",
  "light-primary": "text-primary",
  "light-success": "text-green-600 dark:text-green-400",
  "light-warning": "text-yellow-600 dark:text-yellow-400",
  "light-error": "text-red-600 dark:text-red-400",
  "light-info": "text-blue-600 dark:text-blue-400",
  "soft-success": "text-green-600 dark:text-green-400",
  "soft-warning": "text-yellow-600 dark:text-yellow-400",
  "soft-error": "text-red-600 dark:text-red-400",
  "soft-info": "text-blue-600 dark:text-blue-400",
};

interface ToastPremiumProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof toastVariants> {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  duration?: number;
  showProgress?: boolean;
  onClose?: () => void;
}

export const ToastPremium = React.forwardRef<HTMLDivElement, ToastPremiumProps>(
  ({ 
    className,
    variant = "default",
    title,
    description,
    icon,
    action,
    duration,
    showProgress = false,
    onClose,
    children,
    ...props 
  }, ref) => {
    const [progress, setProgress] = React.useState(100);
    const IconComponent = icon ? null : (variant && iconMap[variant] ? iconMap[variant] : null);

    // Auto-dismiss timer with progress bar
    React.useEffect(() => {
      if (!duration || !onClose) return;

      const interval = setInterval(() => {
        setProgress((prev) => {
          const newProgress = prev - (100 / (duration / 100));
          if (newProgress <= 0) {
            onClose();
            return 0;
          }
          return newProgress;
        });
      }, 100);

      return () => clearInterval(interval);
    }, [duration, onClose]);

    return (
      <div
        ref={ref}
        className={cn(toastVariants({ variant }), "relative", className)}
        {...props}
      >
        {/* Progress bar */}
        {showProgress && duration && (
          <div className="absolute bottom-0 left-0 h-1 bg-current opacity-20 transition-all duration-100 ease-out"
            style={{ width: `${progress}%` }}
          />
        )}

        <div className="flex gap-3 flex-1">
          {(icon || IconComponent) && (
            <div className="shrink-0 mt-0.5">
              {icon ? (
                React.isValidElement(icon) ? 
                  React.cloneElement(icon as React.ReactElement<any>, {
                    className: cn(
                      "h-4 w-4 transition-colors",
                      variant && iconColorMap[variant]
                    )
                  }) : icon
              ) : IconComponent ? (
                <IconComponent 
                  className={cn(
                    "h-4 w-4 transition-colors",
                    variant && iconColorMap[variant]
                  )} 
                />
              ) : null}
            </div>
          )}
          
          <div className="flex-1 space-y-1">
            {title && (
              <div className="text-sm font-semibold leading-none tracking-tight">
                {title}
              </div>
            )}
            {description && (
              <div className={cn(
                "text-sm leading-relaxed",
                // White text with opacity for colored backgrounds
                ["default", "primary", "success", "warning", "error", "info"].includes(variant || "default")
                  ? "text-white/90 dark:text-gray-900/90"
                  : variant?.startsWith("light-")
                  ? "text-muted-foreground"
                  : "text-muted-foreground"
              )}>
                {description}
              </div>
            )}
            {children}
          </div>

          {action && (
            <div className="shrink-0">
              {action}
            </div>
          )}
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className={cn(
              "absolute right-2 top-2 rounded-md p-1 transition-opacity hover:opacity-75 focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100",
              // White close button for colored backgrounds
              ["default", "primary", "success", "warning", "error", "info"].includes(variant || "default")
                ? "text-white/70 hover:text-white focus:ring-white/20" 
                : "text-muted-foreground hover:text-foreground focus:ring-ring",
              "opacity-70"
            )}
            aria-label="Close toast"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    );
  }
);

ToastPremium.displayName = "ToastPremium";

// Toast Container for positioning
interface ToastContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  position?: "top-left" | "top-center" | "top-right" | "bottom-left" | "bottom-center" | "bottom-right";
}

export const ToastContainer = React.forwardRef<HTMLDivElement, ToastContainerProps>(
  ({ className, position = "bottom-right", children, ...props }, ref) => {
    const positionClasses = {
      "top-left": "top-4 left-4",
      "top-center": "top-4 left-1/2 transform -translate-x-1/2",
      "top-right": "top-4 right-4",
      "bottom-left": "bottom-4 left-4",
      "bottom-center": "bottom-4 left-1/2 transform -translate-x-1/2",
      "bottom-right": "bottom-4 right-4",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "fixed z-50 flex max-h-screen w-full flex-col-reverse p-4 sm:max-w-[420px]",
          positionClasses[position],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

ToastContainer.displayName = "ToastContainer";

// Hook for managing toasts
interface Toast extends Omit<ToastPremiumProps, 'onClose'> {
  id: string;
}

interface UseToastReturn {
  toasts: Toast[];
  toast: (toast: Omit<Toast, 'id'>) => string;
  dismiss: (id: string) => void;
  dismissAll: () => void;
}

export function useToast(): UseToastReturn {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const toast = React.useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { ...toast, id }]);
    return id;
  }, []);

  const dismiss = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const dismissAll = React.useCallback(() => {
    setToasts([]);
  }, []);

  return {
    toasts,
    toast,
    dismiss,
    dismissAll,
  };
}