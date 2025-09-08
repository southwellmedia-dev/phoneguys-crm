/**
 * Button Group Component
 * 
 * @description Group multiple buttons together with proper styling
 * @category Buttons
 * 
 * @example
 * ```tsx
 * <ButtonGroup>
 *   <ButtonPremium variant="outline">Left</ButtonPremium>
 *   <ButtonPremium variant="outline">Center</ButtonPremium>
 *   <ButtonPremium variant="outline">Right</ButtonPremium>
 * </ButtonGroup>
 * ```
 */

import * as React from "react";
import { cn } from "@/lib/utils";

interface ButtonGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: "horizontal" | "vertical";
  attached?: boolean;
}

export const ButtonGroup = React.forwardRef<HTMLDivElement, ButtonGroupProps>(
  ({ className, orientation = "horizontal", attached = true, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "inline-flex",
          orientation === "horizontal" ? "flex-row" : "flex-col",
          attached && orientation === "horizontal" && "[&>*:not(:first-child)]:-ml-px [&>*:first-child]:rounded-r-none [&>*:last-child]:rounded-l-none [&>*:not(:first-child):not(:last-child)]:rounded-none",
          attached && orientation === "vertical" && "[&>*:not(:first-child)]:-mt-px [&>*:first-child]:rounded-b-none [&>*:last-child]:rounded-t-none [&>*:not(:first-child):not(:last-child)]:rounded-none",
          !attached && "gap-2",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

ButtonGroup.displayName = "ButtonGroup";