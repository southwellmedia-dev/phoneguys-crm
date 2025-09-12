'use client';

import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';
import { ReactNode } from 'react';
import { colors } from '@/components/premium/themes/colors';

interface DetailMetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  description?: string;
  icon?: LucideIcon;
  variant?: 'default' | 'inverted-primary' | 'inverted-success' | 'inverted-dark' | 'inverted-accent' | 'inverted-warning' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  extra?: ReactNode; // For charts, progress indicators, etc.
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string | number;
  className?: string;
  onClick?: () => void;
}

// Use our design system colors with inline styles for exact brand colors
const variantStyles = {
  default: 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100',
  'inverted-primary': 'border-0 text-white', // Will use style prop for brand cyan
  'inverted-success': 'border-0 text-white', // Will use style prop for semantic success
  'inverted-dark': 'border-0 text-white', // Will use style prop for brand navy
  'inverted-accent': 'border-0 text-white', // Will use style prop for brand red
  'inverted-warning': 'border-0 text-white', // Will use style prop for semantic warning
  ghost: 'bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100'
};

// Map variants to our design system colors
const variantColors = {
  'inverted-primary': colors.brand.cyan,
  'inverted-success': colors.semantic.success.base,
  'inverted-dark': colors.brand.navy,
  'inverted-accent': colors.brand.red,
  'inverted-warning': colors.semantic.warning.base,
};

const sizeStyles = {
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6'
};

const valueSizeStyles = {
  sm: 'text-xl font-bold',
  md: 'text-2xl font-bold',
  lg: 'text-3xl font-bold'
};

export function DetailMetricCard({
  title,
  value,
  subtitle,
  description,
  icon: Icon,
  variant = 'default',
  size = 'md',
  extra,
  trend,
  trendValue,
  className,
  onClick
}: DetailMetricCardProps) {
  const isInverted = variant.startsWith('inverted');
  const textColorClass = isInverted ? 'text-white' : '';
  const mutedTextClass = isInverted 
    ? 'text-white/80' 
    : 'text-gray-500 dark:text-gray-400';

  // Get background color for inverted variants
  const backgroundColor = variant in variantColors ? variantColors[variant as keyof typeof variantColors] : undefined;

  return (
    <div
      className={cn(
        'rounded-lg transition-all duration-200',
        variantStyles[variant],
        sizeStyles[size],
        onClick && 'cursor-pointer hover:shadow-lg hover:scale-[1.02]',
        className
      )}
      style={backgroundColor ? { backgroundColor } : undefined}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            {Icon && (
              <Icon className={cn('w-4 h-4', mutedTextClass)} />
            )}
            <p className={cn('text-sm font-medium', mutedTextClass)}>
              {title}
            </p>
          </div>
          
          <div className="flex items-baseline gap-2">
            <p className={cn(valueSizeStyles[size], textColorClass)}>
              {value}
            </p>
            {subtitle && (
              <span className={cn('text-sm', mutedTextClass)}>
                {subtitle}
              </span>
            )}
          </div>

          {description && (
            <p className={cn('text-sm mt-1', mutedTextClass)}>
              {description}
            </p>
          )}

          {trend && trendValue && (
            <div className="flex items-center gap-1 mt-2">
              <span className={cn(
                'text-xs font-medium',
                trend === 'up' && 'text-green-400',
                trend === 'down' && 'text-red-400',
                trend === 'neutral' && mutedTextClass
              )}>
                {trend === 'up' && '↑'}
                {trend === 'down' && '↓'}
                {trend === 'neutral' && '→'}
                {' '}{trendValue}
              </span>
            </div>
          )}
        </div>

        {extra && (
          <div className="ml-4">
            {extra}
          </div>
        )}
      </div>
    </div>
  );
}