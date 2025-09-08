/**
 * Glass Card Component
 * 
 * @description Glassmorphism card with blur effects and transparency
 * @category Cards
 * 
 * @example
 * ```tsx
 * <GlassCard>
 *   <GlassCardHeader>
 *     <GlassCardTitle>Glass Effect</GlassCardTitle>
 *   </GlassCardHeader>
 *   <GlassCardContent>
 *     Beautiful glassmorphism design
 *   </GlassCardContent>
 * </GlassCard>
 * ```
 */

import * as React from "react";
import { cn } from "@/lib/utils";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  blur?: "none" | "sm" | "md" | "lg" | "xl";
  opacity?: number;
  border?: boolean;
}

const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, blur = "md", opacity = 10, border = true, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "relative overflow-hidden rounded-xl",
        blur === "sm" && "backdrop-blur-sm",
        blur === "md" && "backdrop-blur-md",
        blur === "lg" && "backdrop-blur-lg",
        blur === "xl" && "backdrop-blur-xl",
        border && "border border-white/20 dark:border-white/10",
        `bg-white/${opacity} dark:bg-black/${opacity}`,
        "shadow-glass",
        "transition-all duration-300",
        "hover:bg-white/20 dark:hover:bg-black/20",
        className
      )}
      {...props}
    />
  )
);
GlassCard.displayName = "GlassCard";

const GlassCardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex flex-col space-y-1.5 p-6",
      "border-b border-white/10 dark:border-white/5",
      className
    )}
    {...props}
  />
));
GlassCardHeader.displayName = "GlassCardHeader";

const GlassCardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-lg font-bold leading-none tracking-tight",
      className
    )}
    {...props}
  />
));
GlassCardTitle.displayName = "GlassCardTitle";

const GlassCardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
GlassCardDescription.displayName = "GlassCardDescription";

const GlassCardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
GlassCardContent.displayName = "GlassCardContent";

const GlassCardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex items-center p-6 pt-0",
      "border-t border-white/10 dark:border-white/5",
      className
    )}
    {...props}
  />
));
GlassCardFooter.displayName = "GlassCardFooter";

export {
  GlassCard,
  GlassCardHeader,
  GlassCardFooter,
  GlassCardTitle,
  GlassCardDescription,
  GlassCardContent,
};