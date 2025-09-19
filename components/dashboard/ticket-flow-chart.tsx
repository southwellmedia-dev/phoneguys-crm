'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line
} from 'recharts';
import { TrendingUp, Activity, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';

interface TicketFlowChartProps {
  className?: string;
  metrics?: {
    todayOrders: number;
    inProgressOrders: number;
    completedToday: number;
    onHoldOrders: number;
  };
}

// Fetch time tracking data from the API
async function fetchTimeTrackingData() {
  try {
    const response = await fetch('/api/dashboard/time-tracking');
    if (response.ok) {
      const data = await response.json();
      return data.timeData || [];
    }
  } catch (error) {
    console.error('Failed to fetch time tracking data:', error);
  }
  
  // Return mock data as fallback - showing tracked vs estimated time by technician/ticket
  return [
    { name: 'Screen Repair', estimated: 60, tracked: 45 },
    { name: 'Battery Replace', estimated: 30, tracked: 35 },
    { name: 'Water Damage', estimated: 120, tracked: 140 },
    { name: 'Software Fix', estimated: 45, tracked: 40 },
    { name: 'Camera Repair', estimated: 90, tracked: 85 },
    { name: 'Charging Port', estimated: 50, tracked: 55 },
  ];
};

export function TicketFlowChart({ className, metrics }: TicketFlowChartProps) {
  
  // Fetch time tracking data
  const { data: timeData = [] } = useQuery({
    queryKey: ['time-tracking'],
    queryFn: fetchTimeTrackingData,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 2 * 60 * 1000 // 2 minutes
  });
  
  // Prepare pie chart data - using muted, eye-friendly colors
  const pieData = [
    { name: 'New', value: metrics?.todayOrders || 0, color: '#06b6d4' }, // Cyan-500
    { name: 'In Progress', value: metrics?.inProgressOrders || 0, color: '#f59e0b' }, // Amber-500  
    { name: 'Completed', value: metrics?.completedToday || 0, color: '#10b981' }, // Emerald-500
    { name: 'On Hold', value: metrics?.onHoldOrders || 0, color: '#9ca3af' }, // Gray-400
  ].filter(item => item.value > 0); // Only show segments with data

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-lg shadow-lg p-3">
          <p className="text-sm font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-xs" style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className={cn("h-full", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Activity className="h-4 w-4 text-muted-foreground" />
            Ticket Analytics
          </CardTitle>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
            Live
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status Distribution - Donut Chart */}
        <div>
          <h4 className="text-sm font-medium mb-3">Status Distribution</h4>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend 
                verticalAlign="bottom" 
                height={36}
                formatter={(value, entry: any) => (
                  <span style={{ color: entry.color, fontSize: '12px' }}>
                    {value}: {entry.payload.value}
                  </span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Time Tracking - Estimated vs Tracked */}
        <div>
          <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
            <Clock className="h-3 w-3 text-muted-foreground" />
            Time Tracking
          </h4>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={timeData} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                type="number"
                className="text-xs"
                tick={{ fill: 'currentColor', fontSize: 10 }}
                label={{ value: 'Minutes', position: 'insideBottom', offset: -5, style: { fontSize: 10, fill: 'currentColor' } }}
              />
              <YAxis 
                dataKey="name"
                type="category"
                className="text-xs"
                tick={{ fill: 'currentColor', fontSize: 9 }}
                width={80}
              />
              <Tooltip 
                content={({ active, payload, label }: any) => {
                  if (active && payload && payload.length) {
                    const estimated = payload.find((p: any) => p.dataKey === 'estimated')?.value || 0;
                    const tracked = payload.find((p: any) => p.dataKey === 'tracked')?.value || 0;
                    const diff = tracked - estimated;
                    return (
                      <div className="bg-background border rounded-lg shadow-lg p-2">
                        <p className="text-xs font-medium mb-1">{label}</p>
                        <p className="text-xs text-muted-foreground">Estimated: {estimated} min</p>
                        <p className="text-xs text-muted-foreground">Tracked: {tracked} min</p>
                        <p className="text-xs font-medium mt-1" style={{ color: diff > 0 ? '#ef4444' : '#10b981' }}>
                          {diff > 0 ? '+' : ''}{diff} min
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend 
                wrapperStyle={{ fontSize: '10px' }}
                iconType="rect"
              />
              <Bar
                dataKey="estimated"
                fill="#9ca3af"
                name="Estimated"
                radius={[0, 2, 2, 0]}
              />
              <Bar
                dataKey="tracked"
                fill="#06b6d4"
                name="Tracked"
                radius={[0, 2, 2, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div>
            <p className="text-xs text-muted-foreground">Time Efficiency</p>
            <p className="text-lg font-semibold">92%</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Avg. Variance</p>
            <p className="text-lg font-semibold">+5 min</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}