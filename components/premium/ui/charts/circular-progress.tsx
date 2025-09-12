'use client';

import { cn } from '@/lib/utils';

interface CircularProgressProps {
  value: number; // 0-100
  size?: 'sm' | 'md' | 'lg' | 'xl';
  strokeWidth?: number;
  showValue?: boolean;
  label?: string;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error';
  className?: string;
  animate?: boolean;
}

const sizeMap = {
  sm: { size: 40, fontSize: 'text-xs', strokeWidth: 3 },
  md: { size: 60, fontSize: 'text-sm', strokeWidth: 4 },
  lg: { size: 80, fontSize: 'text-base', strokeWidth: 5 },
  xl: { size: 100, fontSize: 'text-lg', strokeWidth: 6 }
};

const variantMap = {
  default: 'stroke-gray-600',
  primary: 'stroke-cyan-500',
  success: 'stroke-green-500',
  warning: 'stroke-orange-500',
  error: 'stroke-red-500'
};

export function CircularProgress({
  value,
  size = 'md',
  strokeWidth: customStrokeWidth,
  showValue = true,
  label,
  variant = 'primary',
  className,
  animate = true
}: CircularProgressProps) {
  const { size: svgSize, fontSize, strokeWidth: defaultStrokeWidth } = sizeMap[size];
  const stroke = customStrokeWidth || defaultStrokeWidth;
  const radius = (svgSize - stroke) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg
        width={svgSize}
        height={svgSize}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={svgSize / 2}
          cy={svgSize / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={stroke}
          fill="none"
          className="text-gray-200 dark:text-gray-700"
        />
        {/* Progress circle */}
        <circle
          cx={svgSize / 2}
          cy={svgSize / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={cn(
            variantMap[variant],
            animate && 'transition-all duration-500 ease-out'
          )}
        />
      </svg>
      {showValue && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn('font-semibold', fontSize)}>
            {Math.round(value)}%
          </span>
          {label && (
            <span className={cn('text-gray-500 dark:text-gray-400', 
              size === 'sm' ? 'text-[10px]' : 'text-xs'
            )}>
              {label}
            </span>
          )}
        </div>
      )}
    </div>
  );
}