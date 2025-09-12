'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface PieSegment {
  value: number;
  color: string;
  label?: string;
}

interface MiniPieChartProps {
  data: PieSegment[];
  size?: number;
  strokeWidth?: number;
  className?: string;
  showLabels?: boolean;
  animate?: boolean;
}

export function MiniPieChart({
  data,
  size = 80,
  strokeWidth = 0,
  className,
  showLabels = false,
  animate = true
}: MiniPieChartProps) {
  // Calculate total and percentages
  const total = data.reduce((sum, segment) => sum + segment.value, 0);
  if (total === 0) return null;

  // Calculate angles for each segment
  let currentAngle = -90; // Start at top
  const segments = data.map((segment, index) => {
    const percentage = (segment.value / total) * 100;
    const angle = (percentage / 100) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    currentAngle = endAngle;

    // Calculate path for this segment
    const startAngleRad = (startAngle * Math.PI) / 180;
    const endAngleRad = (endAngle * Math.PI) / 180;
    
    const radius = size / 2 - strokeWidth;
    const centerX = size / 2;
    const centerY = size / 2;
    
    const x1 = centerX + radius * Math.cos(startAngleRad);
    const y1 = centerY + radius * Math.sin(startAngleRad);
    const x2 = centerX + radius * Math.cos(endAngleRad);
    const y2 = centerY + radius * Math.sin(endAngleRad);
    
    const largeArcFlag = angle > 180 ? 1 : 0;
    
    const pathData = [
      `M ${centerX} ${centerY}`,
      `L ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
      'Z'
    ].join(' ');

    return {
      ...segment,
      percentage,
      pathData,
      startAngle,
      endAngle,
      midAngle: (startAngle + endAngle) / 2
    };
  });

  return (
    <div className={cn('relative inline-block', className)}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {segments.map((segment, index) => (
          <g key={index}>
            <path
              d={segment.pathData}
              fill={segment.color}
              stroke={strokeWidth > 0 ? 'white' : 'none'}
              strokeWidth={strokeWidth}
              className={cn(
                'transition-all duration-300',
                animate && 'hover:opacity-80'
              )}
              style={{
                animation: animate ? `pieSliceIn ${0.5 + index * 0.1}s ease-out` : undefined
              }}
            >
              <title>{`${segment.label || `Segment ${index + 1}`}: ${segment.percentage.toFixed(1)}%`}</title>
            </path>
          </g>
        ))}
      </svg>

      {showLabels && (
        <div className="absolute top-full left-0 right-0 mt-2">
          <div className="flex flex-col gap-1">
            {segments.map((segment, index) => (
              <div key={index} className="flex items-center gap-1.5">
                <div 
                  className="w-2 h-2 rounded-full" 
                  style={{ backgroundColor: segment.color }}
                />
                <span className="text-[10px] text-gray-600 dark:text-gray-400">
                  {segment.label} ({segment.percentage.toFixed(0)}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes pieSliceIn {
          from {
            transform: scale(0.8);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}