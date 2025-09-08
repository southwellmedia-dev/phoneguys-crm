import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold transition-all duration-200",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80",
        outline: "border text-foreground hover:bg-accent hover:text-accent-foreground",
        solid: "border-transparent shadow-sm",
        soft: "border",
        dot: "pl-1.5",
        ghost: "hover:bg-accent hover:text-accent-foreground",
      },
      color: {
        default: "",
        cyan: "",
        red: "",
        green: "",
        amber: "",
        blue: "",
        purple: "",
        gray: "",
      },
      size: {
        sm: "px-2 py-0.5 text-[10px]",
        md: "px-2.5 py-0.5 text-xs",
        lg: "px-3 py-1 text-sm",
      }
    },
    compoundVariants: [
      // Solid variants with colors
      {
        variant: "solid",
        color: "cyan",
        className: "bg-[hsl(var(--primary))] text-white hover:bg-[hsl(var(--primary)/0.9)]",
      },
      {
        variant: "solid",
        color: "red",
        className: "bg-red-500 text-white hover:bg-red-600",
      },
      {
        variant: "solid",
        color: "green",
        className: "bg-green-500 text-white hover:bg-green-600",
      },
      {
        variant: "solid",
        color: "amber",
        className: "bg-amber-500 text-white hover:bg-amber-600",
      },
      {
        variant: "solid",
        color: "blue",
        className: "bg-blue-500 text-white hover:bg-blue-600",
      },
      {
        variant: "solid",
        color: "purple",
        className: "bg-purple-500 text-white hover:bg-purple-600",
      },
      {
        variant: "solid",
        color: "gray",
        className: "bg-gray-500 text-white hover:bg-gray-600",
      },
      // Soft variants with colors
      {
        variant: "soft",
        color: "cyan",
        className: "bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))] border-[hsl(var(--primary)/0.2)] hover:bg-[hsl(var(--primary)/0.15)]",
      },
      {
        variant: "soft",
        color: "red",
        className: "bg-red-50 text-red-700 border-red-200 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800",
      },
      {
        variant: "soft",
        color: "green",
        className: "bg-green-50 text-green-700 border-green-200 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800",
      },
      {
        variant: "soft",
        color: "amber",
        className: "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800",
      },
      {
        variant: "soft",
        color: "blue",
        className: "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800",
      },
      {
        variant: "soft",
        color: "purple",
        className: "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800",
      },
      {
        variant: "soft",
        color: "gray",
        className: "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800",
      },
      // Outline variants with colors
      {
        variant: "outline",
        color: "cyan",
        className: "border-[hsl(var(--primary))] text-[hsl(var(--primary))] hover:bg-[hsl(var(--primary)/0.1)]",
      },
      {
        variant: "outline",
        color: "red",
        className: "border-red-500 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20",
      },
      {
        variant: "outline",
        color: "green",
        className: "border-green-500 text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20",
      },
      {
        variant: "outline",
        color: "amber",
        className: "border-amber-500 text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20",
      },
    ],
    defaultVariants: {
      variant: "default",
      color: "default",
      size: "md",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
}

function Badge({ className, variant, color, size, dot, children, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, color, size }), className)} {...props}>
      {dot && (
        <span className={cn(
          "mr-1.5 h-2 w-2 rounded-full",
          color === "green" ? "bg-green-500" :
          color === "red" ? "bg-red-500" :
          color === "amber" ? "bg-amber-500" :
          color === "blue" ? "bg-blue-500" :
          color === "cyan" ? "bg-[hsl(var(--primary))]" :
          "bg-current"
        )} />
      )}
      {children}
    </div>
  );
}

export { Badge, badgeVariants };
