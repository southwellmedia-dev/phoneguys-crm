/**
 * CardPremium Component
 * 
 * @description Premium card component with enhanced styling and features
 * @category Cards
 * 
 * @example
 * ```tsx
 * <CardPremium
 *   title="Card Title"
 *   description="Card description"
 *   icon={<User />}
 *   action={<Button>Action</Button>}
 *   variant="gradient"
 * >
 *   Card content
 * </CardPremium>
 * ```
 */

import * as React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

interface CardPremiumProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Card title */
  title?: string;
  /** Card description */
  description?: string;
  /** Icon to display in header */
  icon?: React.ReactNode;
  /** Action component for header */
  action?: React.ReactNode;
  /** Visual variant */
  variant?: "default" | "gradient" | "glass" | "bordered";
  /** Padding size */
  padding?: "none" | "sm" | "md" | "lg";
  /** Show hover effect */
  hoverable?: boolean;
  /** Footer content */
  footer?: React.ReactNode;
}

export const CardPremium = React.forwardRef<HTMLDivElement, CardPremiumProps>(
  ({ 
    className,
    title,
    description,
    icon,
    action,
    variant = "default",
    padding = "md",
    hoverable = false,
    footer,
    children,
    ...props 
  }, ref) => {
    const variantStyles = {
      default: "bg-card border border-border",
      gradient: "bg-gradient-to-br from-primary/5 via-transparent to-transparent border border-primary/20",
      glass: "bg-background/60 backdrop-blur-xl border border-white/10",
      bordered: "bg-card border-2 border-primary/20"
    };

    const paddingStyles = {
      none: "",
      sm: "p-4",
      md: "p-6",
      lg: "p-8"
    };
    
    return (
      <Card
        ref={ref}
        className={cn(
          "relative overflow-hidden transition-all duration-200",
          variantStyles[variant],
          hoverable && "hover:shadow-lg hover:border-primary/30",
          className
        )}
        {...props}
      >
        {(title || description || icon || action) && (
          <CardHeader className={cn(
            "flex flex-row items-start justify-between space-y-0",
            padding === "none" ? "p-0" : ""
          )}>
            <div className="flex items-start gap-3">
              {icon && (
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                  {React.isValidElement(icon) && React.cloneElement(icon as React.ReactElement<any>, {
                    className: cn("h-4 w-4 text-primary", (icon as any).props?.className)
                  })}
                </div>
              )}
              <div className="space-y-1">
                {title && (
                  <CardTitle className="text-base font-semibold leading-none tracking-tight">
                    {title}
                  </CardTitle>
                )}
                {description && (
                  <CardDescription className="text-sm text-muted-foreground">
                    {description}
                  </CardDescription>
                )}
              </div>
            </div>
            {action && (
              <div className="flex-shrink-0">
                {action}
              </div>
            )}
          </CardHeader>
        )}
        
        {children && (
          <CardContent className={cn(
            padding === "none" ? "p-0" : "",
            padding === "sm" ? "px-4 pb-4 pt-2" : "",
            padding === "md" ? "px-6 pb-6 pt-2" : "",
            padding === "lg" ? "px-8 pb-8 pt-2" : "",
            !title && !description && !icon && !action && "pt-6"
          )}>
            {children}
          </CardContent>
        )}
        
        {footer && (
          <CardFooter className={cn(
            "border-t bg-muted/50",
            padding === "none" ? "p-0" : "px-6 py-4"
          )}>
            {footer}
          </CardFooter>
        )}
        
        {/* Gradient overlay for gradient variant */}
        {variant === "gradient" && (
          <div className="pointer-events-none absolute -top-10 -right-10 h-40 w-40 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-2xl" />
        )}
      </Card>
    );
  }
);

CardPremium.displayName = "CardPremium";