'use client';

import React, { useMemo } from 'react';
import { 
  LineChart,
  Line,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';
import { TimeEntry } from '@/lib/types/database.types';
import { formatDuration } from '@/lib/utils';

interface TimeTrackingChartProps {
  entries: Array<TimeEntry & { user?: { full_name: string } }>;
}

export function TimeTrackingChart({ entries }: TimeTrackingChartProps) {
  // Prepare chart data from entries
  const chartData = useMemo(() => {
    if (!entries || entries.length === 0) return [];

    // Sort entries by start time
    const sortedEntries = [...entries].sort((a, b) => 
      new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
    );

    // Create data points for the chart
    let cumulativeMinutes = 0;
    return sortedEntries.map((entry, index) => {
      const duration = entry.duration_minutes || 0;
      cumulativeMinutes += duration;
      
      return {
        index: index + 1,
        sessionNumber: `S${index + 1}`,
        date: new Date(entry.start_time).toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        }),
        time: new Date(entry.start_time).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        }),
        duration: duration,
        cumulative: cumulativeMinutes,
        technician: entry.user?.full_name || 'Unknown User',
        description: entry.description || '',
        isActive: !entry.end_time,
        hours: parseFloat((duration / 60).toFixed(2)),
        cumulativeHours: parseFloat((cumulativeMinutes / 60).toFixed(2)),
      };
    });
  }, [entries]);

  // Custom tooltip for chart
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border rounded-lg shadow-lg p-3 space-y-1">
          <p className="font-semibold text-sm">{data.sessionNumber}</p>
          <p className="text-xs text-muted-foreground">{data.date} at {data.time}</p>
          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground">Duration:</span>
            <span className="text-xs font-medium" style={{ color: 'rgb(251, 146, 60)' }}>
              {formatDuration(data.duration)}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground">Total:</span>
            <span className="text-xs font-medium text-primary">
              {formatDuration(data.cumulative)}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">By {data.technician}</p>
        </div>
      );
    }
    return null;
  };

  // Don't show chart if less than 2 entries
  if (!entries || entries.length < 2) {
    return null;
  }

  return (
    <Card className="border border-gray-200 dark:border-gray-700">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-semibold">Time Tracking Overview</CardTitle>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-3 h-[2px] bg-primary"></div>
              <span>Cumulative</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-[2px] bg-orange-500" style={{backgroundImage: 'repeating-linear-gradient(90deg, rgb(251 146 60), rgb(251 146 60) 3px, transparent 3px, transparent 6px)'}}></div>
              <span>Session</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
            <XAxis 
              dataKey="sessionNumber" 
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis 
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              label={{ value: 'Hours', angle: -90, position: 'insideLeft', style: { fill: 'hsl(var(--muted-foreground))', fontSize: 10 } }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line 
              type="monotone" 
              dataKey="cumulativeHours" 
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={{ r: 3, fill: 'hsl(var(--primary))' }}
              activeDot={{ r: 5, fill: 'hsl(var(--primary))' }}
              name="Total Hours"
            />
            <Line 
              type="monotone" 
              dataKey="hours" 
              stroke="rgb(251 146 60)"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ r: 3, fill: 'rgb(251 146 60)' }}
              activeDot={{ r: 5, fill: 'rgb(251 146 60)' }}
              name="Session Hours"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}