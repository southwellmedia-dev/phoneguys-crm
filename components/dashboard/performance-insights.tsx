'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Area,
  AreaChart
} from 'recharts';
import { 
  TrendingUp, 
  AlertTriangle, 
  Users,
  Clock,
  DollarSign,
  CheckCircle,
  XCircle,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';

interface PerformanceInsightsProps {
  className?: string;
  metrics?: {
    todayOrders: number;
    inProgressOrders: number;
    completedToday: number;
    onHoldOrders: number;
  };
}

// Mock data generators - replace with real API calls
const generateTechnicianPerformance = () => [
  { name: 'John D.', completed: 8, inProgress: 3, efficiency: 95 },
  { name: 'Sarah M.', completed: 7, inProgress: 2, efficiency: 88 },
  { name: 'Mike R.', completed: 5, inProgress: 4, efficiency: 76 },
  { name: 'Lisa K.', completed: 6, inProgress: 2, efficiency: 92 },
];

const generateRevenueProgress = () => {
  const now = new Date().getHours();
  const data = [];
  for (let i = 9; i <= Math.min(now, 18); i++) {
    data.push({
      hour: `${i}:00`,
      actual: Math.random() * 200 + 50,
      target: 150
    });
  }
  return data;
};

const generateRepairTypeEfficiency = () => [
  { type: 'Screen', avgTime: 45, target: 60, count: 12 },
  { type: 'Battery', avgTime: 35, target: 30, count: 8 },
  { type: 'Camera', avgTime: 70, target: 60, count: 5 },
  { type: 'Charging', avgTime: 40, target: 45, count: 7 },
  { type: 'Software', avgTime: 25, target: 30, count: 15 },
];

export function PerformanceInsights({ className, metrics }: PerformanceInsightsProps) {
  const techData = React.useMemo(() => generateTechnicianPerformance(), []);
  const revenueData = React.useMemo(() => generateRevenueProgress(), []);
  const repairData = React.useMemo(() => generateRepairTypeEfficiency(), []);

  // Calculate key insights
  const urgentTickets = Math.round((metrics?.todayOrders || 0) * 0.2);
  const riskTickets = Math.round((metrics?.inProgressOrders || 0) * 0.15);
  const totalActive = (metrics?.todayOrders || 0) + (metrics?.inProgressOrders || 0);

  return (
    <Card className={cn("h-full", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-muted-foreground" />
            Performance Insights
          </span>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
            Real-time
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Priority Alerts - Most important info first */}
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Requires Attention
          </h4>
          <div className="space-y-2">
            {urgentTickets > 0 && (
              <div className="flex items-center justify-between p-2 bg-red-50 dark:bg-red-950/20 rounded-md border border-red-200 dark:border-red-900/50">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <span className="text-sm font-medium">{urgentTickets} Urgent Tickets</span>
                </div>
                <span className="text-xs text-red-600">Action needed</span>
              </div>
            )}
            {riskTickets > 0 && (
              <div className="flex items-center justify-between p-2 bg-amber-50 dark:bg-amber-950/20 rounded-md border border-amber-200 dark:border-amber-900/50">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-amber-600" />
                  <span className="text-sm font-medium">{riskTickets} At Risk</span>
                </div>
                <span className="text-xs text-amber-600">SLA warning</span>
              </div>
            )}
            {metrics?.onHoldOrders > 3 && (
              <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-950/20 rounded-md border border-gray-200 dark:border-gray-800">
                <div className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-gray-600" />
                  <span className="text-sm font-medium">{metrics.onHoldOrders} On Hold</span>
                </div>
                <span className="text-xs text-gray-600">Check parts</span>
              </div>
            )}
          </div>
        </div>

        {/* Technician Performance */}
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Technician Workload
          </h4>
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={techData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted opacity-30" />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={50} />
                <Tooltip 
                  contentStyle={{ fontSize: 12 }}
                  formatter={(value: any, name: string) => [value, name]}
                />
                <Bar dataKey="completed" fill="#10b981" name="Completed" radius={[0, 2, 2, 0]} />
                <Bar dataKey="inProgress" fill="#f59e0b" name="Active" radius={[0, 2, 2, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue Tracking */}
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Revenue vs Target
          </h4>
          <div className="h-24">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted opacity-30" />
                <XAxis dataKey="hour" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 9 }} />
                <Tooltip contentStyle={{ fontSize: 11 }} />
                <Area 
                  type="monotone" 
                  dataKey="actual" 
                  stroke="#10b981" 
                  fill="url(#colorRevenue)"
                  strokeWidth={2}
                  name="Revenue"
                />
                <Line 
                  type="monotone" 
                  dataKey="target" 
                  stroke="#ef4444" 
                  strokeDasharray="5 5"
                  dot={false}
                  name="Target"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Metrics */}
        <div className="grid grid-cols-3 gap-2 pt-3 border-t">
          <div className="text-center">
            <p className="text-lg font-bold text-green-600">{metrics?.completedToday || 0}</p>
            <p className="text-xs text-muted-foreground">Completed</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-amber-600">{totalActive}</p>
            <p className="text-xs text-muted-foreground">Active</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-cyan-600">
              {totalActive > 0 ? Math.round((metrics?.completedToday || 0) / (totalActive + (metrics?.completedToday || 0)) * 100) : 0}%
            </p>
            <p className="text-xs text-muted-foreground">Complete</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}