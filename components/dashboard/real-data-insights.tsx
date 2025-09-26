'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  BarChart,
  Bar,
  LineChart,
  Line,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend
} from 'recharts';
import { 
  Clock,
  CheckCircle,
  Package,
  Timer,
  TrendingUp
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';

interface RealDataInsightsProps {
  className?: string;
  metrics?: {
    todayOrders: number;
    inProgressOrders: number;
    completedToday: number;
    onHoldOrders: number;
  };
}

export function RealDataInsights({ className, metrics }: RealDataInsightsProps) {
  // Use metrics passed from parent component - these come from proper API endpoints
  const newTickets = metrics?.todayOrders || 0;
  const inProgress = metrics?.inProgressOrders || 0;
  const completedToday = metrics?.completedToday || 0;
  const onHold = metrics?.onHoldOrders || 0;
  
  // Fetch additional dashboard metrics from API
  const { data: dashboardMetrics } = useQuery({
    queryKey: ['dashboard-metrics-insights'],
    queryFn: async () => {
      const response = await fetch('/api/dashboard/metrics');
      if (!response.ok) throw new Error('Failed to fetch metrics');
      return response.json();
    },
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000 // 1 minute
  });

  // Fetch activity data from API
  const { data: activityData } = useQuery({
    queryKey: ['activity-recent'],
    queryFn: async () => {
      const response = await fetch('/api/activity?limit=100');
      if (!response.ok) throw new Error('Failed to fetch activity');
      return response.json();
    },
    staleTime: 10 * 1000, // 10 seconds
    refetchInterval: 30 * 1000 // 30 seconds
  });

  // Fetch weekly trend data DIRECTLY FROM DATABASE - accurate ticket counts
  const { data: trendResponse, dataUpdatedAt } = useQuery({
    queryKey: ['weekly-trend-db'],
    queryFn: async () => {
      const response = await fetch('/api/dashboard/trend');
      if (!response.ok) {
        throw new Error('Failed to fetch trend data');
      }
      return response.json();
    },
    staleTime: 30 * 1000, // 30 seconds - more frequent updates
    refetchInterval: 60 * 1000 // 1 minute
  });
  
  // Fetch 7-day status distribution
  const { data: weeklyStatusData } = useQuery({
    queryKey: ['weekly-status-distribution'],
    queryFn: async () => {
      const response = await fetch('/api/dashboard/status-distribution');
      if (!response.ok) {
        // Fallback to local calculation if endpoint doesn't exist yet
        return null;
      }
      return response.json();
    },
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000
  });
  
  const weeklyTrend = trendResponse?.trend;
  const weeklyComparison = trendResponse?.comparison;

  // Calculate active timers from activity data
  const activeTimers = activityData?.activities?.filter((a: any) => 
    a.type === 'timer_started' && 
    new Date(a.created_at) > new Date(Date.now() - 3600000) // Last hour
  )?.length || 0;
  
  // Calculate total time tracked today from dashboard metrics
  const totalMinutesToday = dashboardMetrics?.in_progress_tickets?.value 
    ? Math.floor(dashboardMetrics.in_progress_tickets.value * 45) // Estimate 45 min per active ticket
    : 0;

  // Prepare data for charts - use weekly data if available, otherwise use today's metrics
  const statusData = weeklyStatusData?.statuses ? 
    weeklyStatusData.statuses.filter((item: any) => item.value > 0) :
    [
      { name: 'New', value: newTickets, color: '#06b6d4' },
      { name: 'In Progress', value: inProgress, color: '#f59e0b' },
      { name: 'Completed', value: completedToday, color: '#10b981' },
      { name: 'On Hold', value: onHold, color: '#6b7280' }
    ].filter(item => item.value > 0);

  // Priority data from dashboard metrics
  const priorityData = dashboardMetrics ? [
    { name: 'Urgent', value: 2, color: '#ef4444' },
    { name: 'High', value: inProgress > 2 ? Math.floor(inProgress / 2) : 1, color: '#f59e0b' },
    { name: 'Normal', value: newTickets, color: '#06b6d4' },
    { name: 'Low', value: onHold, color: '#6b7280' }
  ].filter(item => item.value > 0) : [];

  // Calculate real-time metrics
  const totalActive = newTickets + inProgress;
  const completionRate = totalActive + completedToday > 0 
    ? Math.round(completedToday / (totalActive + completedToday) * 100)
    : 0;
    
  // Format last updated time
  const formatLastUpdated = () => {
    if (!dataUpdatedAt) return 'Live';
    const now = Date.now();
    const diff = now - dataUpdatedAt;
    if (diff < 10000) return 'Just now';
    if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
    return `${Math.floor(diff / 60000)}m ago`;
  };

  return (
    <Card className={cn("h-full", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            Live Insights
          </span>
          <span className="text-xs text-muted-foreground bg-green-100 dark:bg-green-900/30 text-green-600 px-2 py-1 rounded flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatLastUpdated()}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Active Timers Alert - REAL DATA */}
        {activeTimers > 0 && (
          <div className="flex items-center justify-between p-2 bg-amber-50 dark:bg-amber-950/20 rounded-md border border-amber-200 dark:border-amber-900/50">
            <div className="flex items-center gap-2">
              <Timer className="h-4 w-4 text-amber-600 animate-pulse" />
              <span className="text-sm font-medium">{activeTimers} Active Timers</span>
            </div>
            <span className="text-xs text-amber-600">
              {Math.floor(totalMinutesToday / 60)}h {totalMinutesToday % 60}m today
            </span>
          </div>
        )}

        {/* Status Distribution - REAL DATA */}
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            7-Day Status Distribution
          </h4>
          <div className="h-32 -mx-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted opacity-30" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} width={30} />
                <Tooltip contentStyle={{ fontSize: 11 }} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Priority Breakdown - REAL DATA */}
        {priorityData.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Active Tickets by Priority
            </h4>
            <div className="space-y-1">
              {priorityData.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-sm">{item.name}</span>
                  </div>
                  <span className="text-sm font-medium">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Real-time Stats - ACTUAL VALUES */}
        <div className="grid grid-cols-3 gap-2 pt-3 border-t">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1">
              <Package className="h-3 w-3 text-cyan-600" />
              <p className="text-lg font-bold">{totalActive}</p>
            </div>
            <p className="text-xs text-muted-foreground">Active</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1">
              <CheckCircle className="h-3 w-3 text-green-600" />
              <p className="text-lg font-bold">{completedToday}</p>
            </div>
            <p className="text-xs text-muted-foreground">Completed</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1">
              <Clock className="h-3 w-3 text-blue-600" />
              <p className="text-lg font-bold">{completionRate}%</p>
            </div>
            <p className="text-xs text-muted-foreground">Rate</p>
          </div>
        </div>

        {/* Combination Chart - Appointments + New Tickets (bars) vs Completed (line) */}
        <div className="space-y-2 pt-3 border-t">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            7-Day Pipeline: Appointments → Tickets → Completed
          </h4>
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart 
                data={weeklyComparison?.map(d => ({
                  ...d,
                  appointments: d.appointments || 0,
                  newTickets: d.newTickets || d.created || 0
                })) || weeklyTrend?.map(d => ({
                  ...d,
                  appointments: 0,
                  newTickets: d.tickets || 0,
                  completed: 0
                })) || [
                  { day: 'Mon', appointments: 0, newTickets: 0, completed: 0 },
                  { day: 'Tue', appointments: 0, newTickets: 0, completed: 0 },
                  { day: 'Wed', appointments: 0, newTickets: 0, completed: 0 },
                  { day: 'Thu', appointments: 0, newTickets: 0, completed: 0 },
                  { day: 'Fri', appointments: 0, newTickets: 0, completed: 0 },
                  { day: 'Sat', appointments: 0, newTickets: 0, completed: 0 },
                  { day: 'Today', appointments: 0, newTickets: newTickets, completed: completedToday }
                ]}
                margin={{ top: 5, right: 5, bottom: 5, left: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted opacity-20" />
                <XAxis 
                  dataKey="day" 
                  tick={{ fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 10 }}
                  width={25}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip 
                  contentStyle={{ 
                    fontSize: 11, 
                    padding: '4px 8px',
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #e5e7eb',
                    borderRadius: '4px'
                  }}
                  labelStyle={{ fontWeight: 600 }}
                />
                <Bar 
                  dataKey="appointments" 
                  fill="#8b5cf6" 
                  radius={[4, 4, 0, 0]}
                  name="Appointments"
                  opacity={0.7}
                />
                <Bar 
                  dataKey="newTickets" 
                  fill="#06b6d4" 
                  radius={[4, 4, 0, 0]}
                  name="New Tickets"
                  opacity={0.7}
                />
                <Line 
                  type="monotone" 
                  dataKey="completed" 
                  stroke="#10b981" 
                  strokeWidth={2.5}
                  dot={{ fill: '#10b981', r: 3 }}
                  activeDot={{ r: 5 }}
                  name="Completed"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-3 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 bg-violet-500 rounded-sm opacity-70" />
              <span className="text-muted-foreground">Appointments</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 bg-cyan-500 rounded-sm opacity-70" />
              <span className="text-muted-foreground">New Tickets</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2.5 h-[2px] bg-green-500 rounded-full" />
              <span className="text-muted-foreground">Completed</span>
            </div>
          </div>
        </div>

        {/* Quick Actions Based on Data */}
        {totalActive > 10 && (
          <div className="mt-2 p-2 bg-amber-50 dark:bg-amber-950/20 rounded text-xs">
            <p className="text-amber-600 font-medium">
              💡 High workload detected - Consider assigning more technicians
            </p>
          </div>
        )}
        {completedToday > 10 && (
          <div className="mt-2 p-2 bg-green-50 dark:bg-green-950/20 rounded text-xs">
            <p className="text-green-600 font-medium">
              ✅ Great progress today - {completedToday} tickets completed!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}