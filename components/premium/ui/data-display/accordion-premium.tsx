'use client';

import * as React from 'react';
import * as AccordionPrimitive from '@radix-ui/react-accordion';
import { ChevronDown, Plus, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';

const accordionVariants = cva('', {
  variants: {
    variant: {
      default: '',
      bordered: 'border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden',
      separated: 'space-y-2',
      ghost: '',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

const accordionItemVariants = cva(
  'border-b border-gray-200 dark:border-gray-800',
  {
    variants: {
      variant: {
        default: 'last:border-b-0',
        bordered: 'last:border-b-0',
        separated: 'border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden',
        ghost: 'border-0',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

const accordionTriggerVariants = cva(
  'flex flex-1 items-center justify-between font-medium transition-all hover:underline',
  {
    variants: {
      variant: {
        default: 'px-0',
        bordered: 'px-4',
        separated: 'px-4',
        ghost: 'px-0 hover:no-underline',
      },
      size: {
        sm: 'text-sm py-2',
        md: 'text-sm py-3',
        lg: 'text-base py-4',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

const accordionContentVariants = cva(
  'overflow-hidden transition-all data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down',
  {
    variants: {
      variant: {
        default: 'pb-3',
        bordered: 'px-4 pb-3',
        separated: 'px-4 pb-3',
        ghost: 'pb-3',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface AccordionPremiumProps
  extends React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Root>,
    VariantProps<typeof accordionVariants> {
  className?: string;
}

const AccordionPremium = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Root>,
  AccordionPremiumProps
>(({ className, variant, ...props }, ref) => (
  <AccordionPrimitive.Root
    ref={ref}
    className={cn(accordionVariants({ variant }), className)}
    {...props}
  />
));
AccordionPremium.displayName = 'AccordionPremium';

export interface AccordionItemProps
  extends React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item> {
  variant?: VariantProps<typeof accordionItemVariants>['variant'];
}

const AccordionItem = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Item>,
  AccordionItemProps
>(({ className, variant = 'default', ...props }, ref) => (
  <AccordionPrimitive.Item
    ref={ref}
    className={cn(accordionItemVariants({ variant }), className)}
    {...props}
  />
));
AccordionItem.displayName = 'AccordionItem';

export interface AccordionTriggerProps
  extends React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger>,
    VariantProps<typeof accordionTriggerVariants> {
  icon?: 'chevron' | 'plus-minus' | React.ReactNode;
  iconPosition?: 'left' | 'right';
}

const AccordionTrigger = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Trigger>,
  AccordionTriggerProps
>(
  (
    {
      className,
      children,
      variant,
      size,
      icon = 'chevron',
      iconPosition = 'right',
      ...props
    },
    ref
  ) => {
    const iconElement = React.useMemo(() => {
      if (React.isValidElement(icon)) {
        return icon;
      }

      if (icon === 'plus-minus') {
        return (
          <>
            <Plus className="h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]:hidden" />
            <Minus className="h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=closed]:hidden" />
          </>
        );
      }

      return (
        <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180" />
      );
    }, [icon]);

    return (
      <AccordionPrimitive.Header className="flex">
        <AccordionPrimitive.Trigger
          ref={ref}
          className={cn(
            accordionTriggerVariants({ variant, size }),
            'group',
            className
          )}
          {...props}
        >
          {iconPosition === 'left' && <div className="mr-2">{iconElement}</div>}
          {children}
          {iconPosition === 'right' && <div className="ml-2">{iconElement}</div>}
        </AccordionPrimitive.Trigger>
      </AccordionPrimitive.Header>
    );
  }
);
AccordionTrigger.displayName = AccordionPrimitive.Trigger.displayName;

export interface AccordionContentProps
  extends React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content> {
  variant?: VariantProps<typeof accordionContentVariants>['variant'];
}

const AccordionContent = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Content>,
  AccordionContentProps
>(({ className, children, variant = 'default', ...props }, ref) => (
  <AccordionPrimitive.Content
    ref={ref}
    className={cn(accordionContentVariants({ variant }), className)}
    {...props}
  >
    <div className="text-sm text-muted-foreground">{children}</div>
  </AccordionPrimitive.Content>
));
AccordionContent.displayName = AccordionPrimitive.Content.displayName;

// Collapsible component (single accordion item)
export interface CollapsibleProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  variant?: VariantProps<typeof accordionItemVariants>['variant'];
  size?: VariantProps<typeof accordionTriggerVariants>['size'];
  icon?: AccordionTriggerProps['icon'];
  iconPosition?: AccordionTriggerProps['iconPosition'];
  className?: string;
  triggerClassName?: string;
  contentClassName?: string;
}

export function Collapsible({
  trigger,
  children,
  defaultOpen = false,
  open,
  onOpenChange,
  variant = 'default',
  size = 'md',
  icon = 'chevron',
  iconPosition = 'right',
  className,
  triggerClassName,
  contentClassName,
}: CollapsibleProps) {
  const value = open !== undefined ? (open ? 'item' : '') : undefined;
  const defaultValue = defaultOpen ? 'item' : undefined;

  return (
    <AccordionPremium
      type="single"
      collapsible
      value={value}
      defaultValue={defaultValue}
      onValueChange={(val) => onOpenChange?.(val === 'item')}
      variant={variant}
      className={className}
    >
      <AccordionItem value="item" variant={variant}>
        <AccordionTrigger
          variant={variant}
          size={size}
          icon={icon}
          iconPosition={iconPosition}
          className={triggerClassName}
        >
          {trigger}
        </AccordionTrigger>
        <AccordionContent variant={variant} className={contentClassName}>
          {children}
        </AccordionContent>
      </AccordionItem>
    </AccordionPremium>
  );
}

// FAQ Accordion component
export interface FAQItem {
  question: string;
  answer: string;
}

export interface FAQAccordionProps {
  items: FAQItem[];
  variant?: VariantProps<typeof accordionVariants>['variant'];
  itemVariant?: VariantProps<typeof accordionItemVariants>['variant'];
  className?: string;
}

export function FAQAccordion({
  items,
  variant = 'separated',
  itemVariant = 'separated',
  className,
}: FAQAccordionProps) {
  return (
    <AccordionPremium
      type="single"
      collapsible
      variant={variant}
      className={className}
    >
      {items.map((item, index) => (
        <AccordionItem key={index} value={`item-${index}`} variant={itemVariant}>
          <AccordionTrigger variant={itemVariant} icon="plus-minus">
            {item.question}
          </AccordionTrigger>
          <AccordionContent variant={itemVariant}>
            {item.answer}
          </AccordionContent>
        </AccordionItem>
      ))}
    </AccordionPremium>
  );
}

export {
  AccordionPremium,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
};