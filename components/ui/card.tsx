import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const cardVariants = cva(
  "rounded-xl transition-all duration-300",
  {
    variants: {
      variant: {
        default: "border bg-card text-card-foreground shadow-elevation-1 hover:shadow-elevation-2",
        solid: "text-white shadow-elevation-2 hover:shadow-elevation-3 hover:-translate-y-0.5",
        gradient: "border bg-gradient-subtle shadow-elevation-1 hover:shadow-elevation-2",
        outlined: "border-2 bg-transparent shadow-sm hover:shadow-md",
        glass: "border backdrop-blur-[var(--glass-blur)] shadow-glass",
        elevated: "border bg-card text-card-foreground shadow-strong hover:shadow-elevation-3 hover:-translate-y-1",
      },
      color: {
        default: "",
        cyan: "bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--primary)/0.85)] border-transparent",
        red: "bg-gradient-to-br from-[hsl(var(--accent))] to-[hsl(var(--accent)/0.85)] border-transparent", 
        green: "bg-gradient-to-br from-green-500 to-green-600 dark:from-green-600 dark:to-green-700 border-transparent",
        amber: "bg-gradient-to-br from-amber-500 to-amber-600 dark:from-amber-600 dark:to-amber-700 border-transparent",
        navy: "bg-gradient-to-br from-slate-800 to-slate-900 dark:from-slate-900 dark:to-black border-transparent",
        purple: "bg-gradient-to-br from-purple-500 to-purple-600 dark:from-purple-600 dark:to-purple-700 border-transparent",
      }
    },
    defaultVariants: {
      variant: "default",
      color: "default",
    },
  }
);

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, color, ...props }, ref) => {
    // Apply color only if variant is "solid"
    const appliedColor = variant === "solid" ? color : "default";
    
    return (
      <div
        ref={ref}
        className={cn(
          cardVariants({ variant, color: appliedColor }),
          variant === "glass" && "bg-[var(--glass-bg)] border-[var(--glass-border)]",
          className
        )}
        {...props}
      />
    );
  }
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-lg font-bold leading-none tracking-tight", className)}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
};
