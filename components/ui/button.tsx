import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow hover:bg-primary/90 hover:shadow-md hover:-translate-y-0.5",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline:
          "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        gradient:
          "bg-gradient-brand text-white shadow-md hover:shadow-lg hover:-translate-y-0.5",
        solid:
          "text-white shadow-elevation-1 hover:shadow-elevation-2 hover:-translate-y-0.5",
        glass:
          "backdrop-blur-md bg-white/10 border border-white/20 text-foreground hover:bg-white/20",
        glow:
          "bg-primary text-primary-foreground shadow-glow hover:shadow-glow-lg",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        xl: "h-12 rounded-md px-10 text-base",
        icon: "h-9 w-9",
      },
      color: {
        default: "",
        cyan: "bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary)/0.9)]",
        red: "bg-red-500 hover:bg-red-600",
        green: "bg-green-500 hover:bg-green-600",
        amber: "bg-amber-500 hover:bg-amber-600",
        purple: "bg-purple-500 hover:bg-purple-600",
      }
    },
    compoundVariants: [
      {
        variant: "solid",
        color: "cyan",
        className: "bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary)/0.9)]",
      },
      {
        variant: "solid",
        color: "red",
        className: "bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700",
      },
      {
        variant: "solid",
        color: "green",
        className: "bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700",
      },
      {
        variant: "solid",
        color: "amber",
        className: "bg-gradient-to-br from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700",
      },
    ],
    defaultVariants: {
      variant: "default",
      size: "default",
      color: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, color, asChild = false, loading, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    
    // Don't add loading spinner when using asChild
    if (asChild && loading) {
      console.warn("Loading state is not supported when using asChild prop");
    }
    
    // Only show loading spinner for regular buttons (not asChild)
    const buttonContent = !asChild && loading ? (
      <>
        <svg
          className="mr-2 h-4 w-4 animate-spin"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        {children}
      </>
    ) : (
      children
    );
    
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, color, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {buttonContent}
      </Comp>
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
