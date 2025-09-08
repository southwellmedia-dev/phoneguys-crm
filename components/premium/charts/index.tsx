"use client";

import { 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend,
  RadialBarChart,
  RadialBar
} from 'recharts';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

// Premium color palette for charts
export const CHART_COLORS = {
  cyan: '#00BCD4',
  purple: '#7B3FF2',
  green: '#10B981',
  amber: '#F59E0B',
  red: '#EF4444',
  blue: '#3B82F6',
  pink: '#EC4899',
  navy: '#1E293B',
  gradient: {
    cyan: ['#00BCD4', '#0891B2'],
    purple: ['#7B3FF2', '#6D28D9'],
    green: ['#10B981', '#059669'],
    amber: ['#F59E0B', '#D97706'],
  }
};

// Custom tooltip with premium styling
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background/95 backdrop-blur-sm border rounded-lg shadow-lg p-3">
        <p className="text-sm font-semibold mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-xs" style={{ color: entry.color }}>
            {entry.name}: <span className="font-medium">{entry.value}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

interface TicketTrendChartProps {
  data: Array<{
    day: string;
    completed: number;
    pending: number;
    new: number;
  }>;
  className?: string;
  height?: number;
}

export function TicketTrendChart({ data, className, height = 200 }: TicketTrendChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
          <defs>
            <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={CHART_COLORS.green} stopOpacity={0.3}/>
              <stop offset="95%" stopColor={CHART_COLORS.green} stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorPending" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={CHART_COLORS.amber} stopOpacity={0.3}/>
              <stop offset="95%" stopColor={CHART_COLORS.amber} stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorNew" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={CHART_COLORS.cyan} stopOpacity={0.3}/>
              <stop offset="95%" stopColor={CHART_COLORS.cyan} stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorInProgress" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={CHART_COLORS.purple} stopOpacity={0.3}/>
              <stop offset="95%" stopColor={CHART_COLORS.purple} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb20" />
          <XAxis 
            dataKey="day" 
            tick={{ fontSize: 10 }} 
            stroke="#94a3b8"
            axisLine={{ stroke: '#e5e7eb20' }}
          />
          <YAxis 
            tick={{ fontSize: 10 }} 
            stroke="#94a3b8"
            axisLine={{ stroke: '#e5e7eb20' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area 
            type="monotone" 
            dataKey="completed" 
            stroke={CHART_COLORS.green} 
            strokeWidth={2}
            fillOpacity={1} 
            fill="url(#colorCompleted)" 
            stackId="1"
          />
          <Area 
            type="monotone" 
            dataKey="in_progress" 
            stroke={CHART_COLORS.purple} 
            strokeWidth={2}
            fillOpacity={1} 
            fill="url(#colorInProgress)" 
            stackId="1"
          />
          <Area 
            type="monotone" 
            dataKey="pending" 
            stroke={CHART_COLORS.amber} 
            strokeWidth={2}
            fillOpacity={1} 
            fill="url(#colorPending)" 
            stackId="1"
          />
          <Area 
            type="monotone" 
            dataKey="new" 
            stroke={CHART_COLORS.cyan} 
            strokeWidth={2}
            fillOpacity={1} 
            fill="url(#colorNew)" 
            stackId="1"
          />
        </AreaChart>
      </ResponsiveContainer>
  );
}

interface ServiceDistributionChartProps {
  data: Array<{
    name: string;
    value: number;
    color?: string;
  }>;
  className?: string;
  height?: number;
}

export function ServiceDistributionChart({ data, className, height = 200 }: ServiceDistributionChartProps) {
  const chartData = data.map((item, index) => ({
    ...item,
    color: item.color || Object.values(CHART_COLORS)[index % 8]
  }));

  return (
    <Card variant="gradient" className={cn("p-4", className)}>
      <h3 className="text-sm font-semibold mb-3">Service Distribution</h3>
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={2}
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      <div className="grid grid-cols-2 gap-2 mt-3">
        {chartData.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <div 
              className="h-2 w-2 rounded-full" 
              style={{ backgroundColor: item.color }}
            />
            <span className="text-xs">{item.name}</span>
            <span className="text-xs font-medium ml-auto">{item.value}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

interface TechnicianPerformanceChartProps {
  data: Array<{
    name: string;
    completed: number;
    avgTime: number;
  }>;
  className?: string;
  height?: number;
}

export function TechnicianPerformanceChart({ data, className, height = 200 }: TechnicianPerformanceChartProps) {
  return (
    <Card variant="elevated" className={cn("p-4", className)}>
      <h3 className="text-sm font-semibold mb-3">Technician Performance</h3>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb20" />
          <XAxis 
            dataKey="name" 
            tick={{ fontSize: 10 }} 
            stroke="#94a3b8"
            axisLine={{ stroke: '#e5e7eb20' }}
          />
          <YAxis 
            tick={{ fontSize: 10 }} 
            stroke="#94a3b8"
            axisLine={{ stroke: '#e5e7eb20' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar 
            dataKey="completed" 
            fill={CHART_COLORS.cyan}
            radius={[8, 8, 0, 0]}
            barSize={30}
          />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}

interface HourlyActivityChartProps {
  data: Array<{
    hour: string;
    tickets: number;
    appointments: number;
  }>;
  className?: string;
  height?: number;
}

export function HourlyActivityChart({ data, className, height = 200 }: HourlyActivityChartProps) {
  return (
    <Card variant="outlined" className={cn("p-4", className)}>
      <h3 className="text-sm font-semibold mb-3">Today's Activity</h3>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb20" />
          <XAxis 
            dataKey="hour" 
            tick={{ fontSize: 10 }} 
            stroke="#94a3b8"
            axisLine={{ stroke: '#e5e7eb20' }}
          />
          <YAxis 
            tick={{ fontSize: 10 }} 
            stroke="#94a3b8"
            axisLine={{ stroke: '#e5e7eb20' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line 
            type="monotone" 
            dataKey="tickets" 
            stroke={CHART_COLORS.purple}
            strokeWidth={3}
            dot={{ fill: CHART_COLORS.purple, r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line 
            type="monotone" 
            dataKey="appointments" 
            stroke={CHART_COLORS.cyan}
            strokeWidth={3}
            dot={{ fill: CHART_COLORS.cyan, r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
      <div className="flex items-center justify-center gap-6 mt-3">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: CHART_COLORS.purple }} />
          <span className="text-xs">Tickets</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: CHART_COLORS.cyan }} />
          <span className="text-xs">Appointments</span>
        </div>
      </div>
    </Card>
  );
}

interface RepairTimeDistributionProps {
  data: Array<{
    range: string;
    count: number;
    fill: string;
  }>;
  className?: string;
  height?: number;
}

export function RepairTimeDistribution({ data, className, height = 200 }: RepairTimeDistributionProps) {
  return (
    <Card variant="glass" className={cn("p-4", className)}>
      <h3 className="text-sm font-semibold mb-3">Repair Time Distribution</h3>
      <ResponsiveContainer width="100%" height={height}>
        <RadialBarChart cx="50%" cy="50%" innerRadius="30%" outerRadius="100%" data={data}>
          <RadialBar
            dataKey="count"
            cornerRadius={10}
            fill={CHART_COLORS.purple}
            label={{ position: 'insideStart', fill: '#fff', fontSize: 10 }}
          />
          <Tooltip content={<CustomTooltip />} />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="grid grid-cols-2 gap-2 mt-3">
        {data.map((item, index) => (
          <div key={index} className="flex items-center justify-between">
            <span className="text-xs">{item.range}</span>
            <span className="text-xs font-medium">{item.count} tickets</span>
          </div>
        ))}
      </div>
    </Card>
  );
}