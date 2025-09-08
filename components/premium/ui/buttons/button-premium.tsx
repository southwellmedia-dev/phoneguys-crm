/**
 * Premium Button Component
 * 
 * @description Enhanced button with multiple variants, loading states, and animations
 * @category Buttons
 * 
 * @example
 * ```tsx
 * // Gradient button with icon
 * <ButtonPremium variant="gradient" leftIcon={<Plus />}>
 *   Create Order
 * </ButtonPremium>
 * 
 * // Loading state
 * <ButtonPremium loading loadingText="Processing...">
 *   Submit
 * </ButtonPremium>
 * 
 * // Glow effect button
 * <ButtonPremium variant="glow" size="lg">
 *   Get Started
 * </ButtonPremium>
 * ```
 */

import * as React from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow hover:bg-primary/90 focus-visible:ring-primary",
        gradient: "bg-gradient-primary text-white shadow-md hover:shadow-lg hover:-translate-y-0.5 focus-visible:ring-primary",
        glass: "backdrop-blur-md bg-white/10 border border-white/20 text-foreground hover:bg-white/20 dark:hover:bg-white/10 focus-visible:ring-white/50",
        glow: "bg-primary text-primary-foreground shadow-glow hover:shadow-glow-lg focus-visible:ring-primary",
        soft: "bg-primary/10 text-primary hover:bg-primary/20 focus-visible:ring-primary/50",
        ghost: "hover:bg-accent hover:text-accent-foreground focus-visible:ring-accent",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground focus-visible:ring-accent",
        destructive: "bg-destructive text-destructive-foreground shadow hover:bg-destructive/90 focus-visible:ring-destructive",
        success: "bg-green-500 text-white shadow hover:bg-green-600 focus-visible:ring-green-500",
        warning: "bg-yellow-500 text-white shadow hover:bg-yellow-600 focus-visible:ring-yellow-500",
        info: "bg-blue-500 text-white shadow hover:bg-blue-600 focus-visible:ring-blue-500",
        // New premium variants
        "gradient-success": "bg-gradient-success text-white shadow-md hover:shadow-lg hover:-translate-y-0.5 focus-visible:ring-green-500",
        "gradient-warning": "bg-gradient-warning text-white shadow-md hover:shadow-lg hover:-translate-y-0.5 focus-visible:ring-yellow-500",
        "gradient-danger": "bg-gradient-danger text-white shadow-md hover:shadow-lg hover:-translate-y-0.5 focus-visible:ring-red-500",
        "gradient-info": "bg-gradient-info text-white shadow-md hover:shadow-lg hover:-translate-y-0.5 focus-visible:ring-blue-500",
        "soft-success": "bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50 focus-visible:ring-green-500",
        "soft-warning": "bg-yellow-100 text-yellow-700 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:hover:bg-yellow-900/50 focus-visible:ring-yellow-500",
        "soft-error": "bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50 focus-visible:ring-red-500",
        "soft-info": "bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50 focus-visible:ring-blue-500",
      },
      size: {
        xs: "h-7 px-2.5 text-xs rounded-md",
        sm: "h-8 px-3 text-sm rounded-md",
        md: "h-10 px-4 text-sm rounded-lg",
        lg: "h-12 px-6 text-base rounded-lg",
        xl: "h-14 px-8 text-lg rounded-xl",
      },
      fullWidth: {
        true: "w-full",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
      fullWidth: false,
    },
  }
);

export interface ButtonPremiumProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
  loadingText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  pulse?: boolean;
  glow?: boolean;
}

const ButtonPremium = React.forwardRef<HTMLButtonElement, ButtonPremiumProps>(
  ({ 
    className, 
    variant, 
    size, 
    fullWidth,
    loading = false,
    loadingText,
    leftIcon,
    rightIcon,
    pulse = false,
    glow = false,
    children, 
    disabled,
    ...props 
  }, ref) => {
    const isDisabled = disabled || loading;
    
    return (
      <button
        className={cn(
          buttonVariants({ variant, size, fullWidth }),
          pulse && "animate-pulse",
          glow && "shadow-glow animate-glow",
          className
        )}
        ref={ref}
        disabled={isDisabled}
        {...props}
      >
        {loading ? (
          <>
            <Loader2 className={cn(
              "animate-spin",
              size === "xs" && "h-3 w-3",
              size === "sm" && "h-3.5 w-3.5",
              size === "md" && "h-4 w-4",
              size === "lg" && "h-5 w-5",
              size === "xl" && "h-6 w-6",
            )} />
            {loadingText || children}
          </>
        ) : (
          <>
            {leftIcon && (
              <span className={cn(
                "inline-flex shrink-0",
                size === "xs" && "[&>svg]:h-3 [&>svg]:w-3",
                size === "sm" && "[&>svg]:h-3.5 [&>svg]:w-3.5",
                size === "md" && "[&>svg]:h-4 [&>svg]:w-4",
                size === "lg" && "[&>svg]:h-5 [&>svg]:w-5",
                size === "xl" && "[&>svg]:h-6 [&>svg]:w-6",
              )}>
                {leftIcon}
              </span>
            )}
            {children}
            {rightIcon && (
              <span className={cn(
                "inline-flex shrink-0",
                size === "xs" && "[&>svg]:h-3 [&>svg]:w-3",
                size === "sm" && "[&>svg]:h-3.5 [&>svg]:w-3.5",
                size === "md" && "[&>svg]:h-4 [&>svg]:w-4",
                size === "lg" && "[&>svg]:h-5 [&>svg]:w-5",
                size === "xl" && "[&>svg]:h-6 [&>svg]:w-6",
              )}>
                {rightIcon}
              </span>
            )}
          </>
        )}
      </button>
    );
  }
);

ButtonPremium.displayName = "ButtonPremium";

export { ButtonPremium, buttonVariants };