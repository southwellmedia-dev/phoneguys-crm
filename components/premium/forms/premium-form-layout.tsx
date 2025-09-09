'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ButtonPremium } from '@/components/premium/ui/buttons/button-premium';
import { LucideIcon } from 'lucide-react';

interface PremiumFormLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function PremiumFormLayout({ children, className }: PremiumFormLayoutProps) {
  return (
    <div className={cn("space-y-6", className)}>
      {children}
    </div>
  );
}

interface PremiumFormSectionProps {
  title: string;
  description?: string;
  icon?: React.ReactElement<LucideIcon>;
  children: React.ReactNode;
  className?: string;
}

export function PremiumFormSection({ 
  title, 
  description, 
  icon, 
  children, 
  className 
}: PremiumFormSectionProps) {
  return (
    <Card className={cn(
      "border-border/50 shadow-sm hover:shadow-md transition-shadow",
      className
    )}>
      <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b border-border/50">
        <div className="flex items-center gap-2">
          {icon && React.cloneElement(icon, { className: "h-5 w-5 text-primary" })}
          <CardTitle className="text-lg">{title}</CardTitle>
        </div>
        {description && (
          <CardDescription>
            {description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="pt-6">
        {children}
      </CardContent>
    </Card>
  );
}

interface PremiumFormActionsProps {
  primaryLabel?: string;
  primaryIcon?: React.ReactElement;
  onPrimaryClick?: () => void;
  primaryDisabled?: boolean;
  primaryLoading?: boolean;
  secondaryLabel?: string;
  secondaryIcon?: React.ReactElement;
  onSecondaryClick?: () => void;
  secondaryDisabled?: boolean;
  variant?: 'inline' | 'sticky';
  className?: string;
}

export function PremiumFormActions({
  primaryLabel = "Save",
  primaryIcon,
  onPrimaryClick,
  primaryDisabled = false,
  primaryLoading = false,
  secondaryLabel = "Cancel",
  secondaryIcon,
  onSecondaryClick,
  secondaryDisabled = false,
  variant = 'inline',
  className
}: PremiumFormActionsProps) {
  const content = (
    <div className="flex items-center justify-end gap-3">
      {onSecondaryClick && (
        <ButtonPremium
          variant="outline"
          onClick={onSecondaryClick}
          disabled={secondaryDisabled}
        >
          {secondaryIcon}
          {secondaryLabel}
        </ButtonPremium>
      )}
      {onPrimaryClick && (
        <ButtonPremium
          variant="gradient"
          onClick={onPrimaryClick}
          disabled={primaryDisabled || primaryLoading}
          loading={primaryLoading}
        >
          {primaryIcon}
          {primaryLabel}
        </ButtonPremium>
      )}
    </div>
  );

  if (variant === 'sticky') {
    return (
      <div className={cn(
        "sticky bottom-0 z-10 bg-background/95 backdrop-blur-sm border-t border-border/50 p-4 -mx-6 mt-8",
        className
      )}>
        {content}
      </div>
    );
  }

  return (
    <div className={cn("mt-6", className)}>
      {content}
    </div>
  );
}

// Export a complete form template
export interface PremiumFormProps {
  children: React.ReactNode;
  onSubmit?: (e: React.FormEvent) => void;
  className?: string;
}

export function PremiumForm({ children, onSubmit, className }: PremiumFormProps) {
  return (
    <form 
      onSubmit={onSubmit}
      className={cn("space-y-6", className)}
    >
      {children}
    </form>
  );
}