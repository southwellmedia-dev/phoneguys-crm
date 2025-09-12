'use client';

import { cn } from '@/lib/utils';
import { colors } from '@/components/premium/themes/colors';

interface BarData {
  label: string;
  value: number;
  color?: string;
}

interface MiniBarChartProps {
  data: BarData[];
  height?: number;
  showLabels?: boolean;
  showValues?: boolean;
  variant?: 'default' | 'stacked' | 'grouped';
  className?: string;
  animate?: boolean;
}

export function MiniBarChart({
  data,
  height = 60,
  showLabels = false,
  showValues = false,
  variant = 'default',
  className,
  animate = true
}: MiniBarChartProps) {
  const maxValue = Math.max(...data.map(d => d.value));
  const total = data.reduce((sum, d) => sum + d.value, 0);

  if (variant === 'stacked') {
    return (
      <div className={cn('w-full', className)}>
        <div 
          className="relative w-full rounded-md overflow-hidden bg-gray-100 dark:bg-gray-800"
          style={{ height }}
        >
          <div className="flex h-full">
            {data.map((item, index) => {
              const percentage = (item.value / total) * 100;
              return (
                <div
                  key={index}
                  className={cn(
                    'relative flex items-center justify-center',
                    animate && 'transition-all duration-500 ease-out',
                    item.color || 'bg-cyan-500'
                  )}
                  style={{ 
                    width: `${percentage}%`,
                    backgroundColor: item.color 
                  }}
                  title={`${item.label}: ${item.value}`}
                >
                  {showValues && percentage > 10 && (
                    <span className="text-white text-xs font-medium">
                      {item.value}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        {showLabels && (
          <div className="flex justify-between mt-2">
            {data.map((item, index) => (
              <div key={index} className="flex items-center gap-1">
                <div 
                  className="w-2 h-2 rounded-full" 
                  style={{ backgroundColor: item.color || '#0094CA' }}
                />
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={cn('w-full', className)}>
      <div className="relative flex items-end gap-1" style={{ height }}>
        {data.map((item, index) => {
          const barHeight = maxValue > 0 ? (item.value / maxValue) * height : 0;
          return (
            <div
              key={index}
              className="flex-1 flex flex-col items-center justify-end relative"
              style={{ height: '100%' }}
            >
              <div
                className={cn(
                  'w-full rounded-t-sm absolute bottom-0',
                  animate && 'transition-all duration-500 ease-out'
                )}
                style={{ 
                  height: `${barHeight}px`,
                  backgroundColor: item.color || colors.brand.cyan,
                  minHeight: '4px'
                }}
                title={`${item.label}: $${item.value}`}
              />
              {showValues && (
                <span 
                  className="text-[10px] text-gray-600 dark:text-gray-400 absolute"
                  style={{ 
                    bottom: `${barHeight + 4}px`,
                    fontSize: '10px',
                    fontWeight: '500'
                  }}
                >
                  ${item.value}
                </span>
              )}
            </div>
          );
        })}
      </div>
      {showLabels && (
        <div className="flex justify-around mt-2">
          {data.map((item, index) => (
            <span 
              key={index} 
              className="text-xs text-gray-600 dark:text-gray-400 text-center"
            >
              {item.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}