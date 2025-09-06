"use client";

import { useState } from 'react';
import { useUserStatistics } from '@/lib/hooks/use-user-profile';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
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
  Legend,
  ResponsiveContainer
} from 'recharts';

interface UserPerformanceChartProps {
  userId: string;
}

export function UserPerformanceChart({ userId }: UserPerformanceChartProps) {
  const [timeRange, setTimeRange] = useState('7');
  const { data: stats, isLoading } = useUserStatistics(userId, parseInt(timeRange));

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-[400px] w-full" />
        <Skeleton className="h-[300px] w-full" />
      </div>
    );
  }

  // Mock data for charts - in production, this would come from the API
  const performanceData = [
    { name: 'Mon', tickets: 4, appointments: 2, notes: 8 },
    { name: 'Tue', tickets: 3, appointments: 1, notes: 6 },
    { name: 'Wed', tickets: 5, appointments: 3, notes: 10 },
    { name: 'Thu', tickets: 2, appointments: 2, notes: 5 },
    { name: 'Fri', tickets: 6, appointments: 4, notes: 12 },
    { name: 'Sat', tickets: 1, appointments: 0, notes: 2 },
    { name: 'Sun', tickets: 0, appointments: 0, notes: 0 },
  ];

  const ticketStatusData = [
    { name: 'Completed', value: stats?.statistics?.tickets_completed || 0, color: '#10b981' },
    { name: 'In Progress', value: stats?.statistics?.tickets_in_progress || 0, color: '#3b82f6' },
    { name: 'On Hold', value: stats?.statistics?.tickets_on_hold || 0, color: '#f59e0b' },
    { name: 'Cancelled', value: stats?.statistics?.tickets_cancelled || 0, color: '#ef4444' },
  ];

  const productivityData = [
    { 
      metric: 'Tickets', 
      current: stats?.statistics?.tickets_completed || 0,
      target: 50,
      percentage: ((stats?.statistics?.tickets_completed || 0) / 50) * 100
    },
    { 
      metric: 'Appointments', 
      current: stats?.statistics?.appointments_converted || 0,
      target: 20,
      percentage: ((stats?.statistics?.appointments_converted || 0) / 20) * 100
    },
    { 
      metric: 'Time Logged', 
      current: Math.round((stats?.statistics?.total_time_logged_minutes || 0) / 60),
      target: 160,
      percentage: ((stats?.statistics?.total_time_logged_minutes || 0) / 60 / 160) * 100
    },
  ];

  return (
    <div className="space-y-4">
      {/* Time Range Selector */}
      <div className="flex justify-end">
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select time range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="14">Last 14 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Daily Activity Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Activity</CardTitle>
          <CardDescription>Tickets, appointments, and notes over time</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="tickets" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
              <Area type="monotone" dataKey="appointments" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
              <Area type="monotone" dataKey="notes" stackId="1" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.6} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Ticket Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Ticket Status Distribution</CardTitle>
            <CardDescription>Breakdown of all assigned tickets</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={ticketStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {ticketStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Productivity vs Target */}
        <Card>
          <CardHeader>
            <CardTitle>Productivity vs Target</CardTitle>
            <CardDescription>Performance against monthly targets</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={productivityData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 100]} />
                <YAxis dataKey="metric" type="category" />
                <Tooltip />
                <Bar dataKey="percentage" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Completion Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Completion Trend</CardTitle>
          <CardDescription>Average completion time over the period</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="tickets" stroke="#3b82f6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}