'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  ComposedChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

interface OperationalReportProps {
  dateRange: {
    from: Date;
    to: Date;
  };
}

export function OperationalReport({ dateRange }: OperationalReportProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['operational-report', dateRange],
    queryFn: async () => {
      const params = new URLSearchParams({
        from: dateRange.from.toISOString(),
        to: dateRange.to.toISOString(),
      });
      const response = await fetch(`/api/reports/operational?${params}`);
      if (!response.ok) throw new Error('Failed to fetch operational data');
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-[400px]" />
        <Skeleton className="h-[300px]" />
      </div>
    );
  }

  // Mock data for development
  const mockData = {
    ticketTrend: [
      { date: 'Mon', created: 8, completed: 6, inProgress: 5 },
      { date: 'Tue', created: 12, completed: 10, inProgress: 7 },
      { date: 'Wed', created: 15, completed: 12, inProgress: 10 },
      { date: 'Thu', created: 10, completed: 14, inProgress: 6 },
      { date: 'Fri', created: 18, completed: 15, inProgress: 9 },
      { date: 'Sat', created: 14, completed: 13, inProgress: 8 },
      { date: 'Sun', created: 6, completed: 8, inProgress: 4 },
    ],
    statusDistribution: [
      { status: 'New', count: 15, percentage: 21 },
      { status: 'In Progress', count: 25, percentage: 36 },
      { status: 'Completed', count: 28, percentage: 40 },
      { status: 'On Hold', count: 2, percentage: 3 },
    ],
    repairTimeAnalysis: {
      average: 2.5,
      median: 2.2,
      min: 0.5,
      max: 8.5,
      byPriority: [
        { priority: 'Urgent', avgTime: 1.5 },
        { priority: 'High', avgTime: 2.0 },
        { priority: 'Medium', avgTime: 2.8 },
        { priority: 'Low', avgTime: 3.5 },
      ],
    },
    serviceTypeBreakdown: [
      { service: 'Screen Repair', count: 35, avgTime: 1.8 },
      { service: 'Battery', count: 28, avgTime: 1.2 },
      { service: 'Water Damage', count: 18, avgTime: 4.5 },
      { service: 'Charging Port', count: 15, avgTime: 2.0 },
      { service: 'Other', count: 12, avgTime: 3.0 },
    ],
    efficiency: {
      completionRate: 85,
      onTimeRate: 78,
      firstTimeFixRate: 92,
      avgTicketsPerDay: 12,
    },
  };

  const operationalData = data || mockData;
  const STATUS_COLORS = {
    'New': '#3b82f6',
    'In Progress': '#f59e0b',
    'Completed': '#10b981',
    'On Hold': '#6b7280',
  };

  return (
    <div className="space-y-6">
      {/* Efficiency Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{operationalData.efficiency.completionRate}%</div>
            <Progress value={operationalData.efficiency.completionRate} className="mt-2" />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">On-Time Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{operationalData.efficiency.onTimeRate}%</div>
            <Progress value={operationalData.efficiency.onTimeRate} className="mt-2" />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">First-Time Fix</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{operationalData.efficiency.firstTimeFixRate}%</div>
            <Progress value={operationalData.efficiency.firstTimeFixRate} className="mt-2" />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Daily Average</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{operationalData.efficiency.avgTicketsPerDay}</div>
            <p className="text-xs text-muted-foreground mt-1">tickets/day</p>
          </CardContent>
        </Card>
      </div>

      {/* Ticket Flow Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Ticket Flow Analysis</CardTitle>
          <CardDescription>Created vs Completed tickets over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={operationalData.ticketTrend}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip />
                <Legend />
                <Bar dataKey="created" fill="#3b82f6" name="Created" />
                <Line 
                  type="monotone" 
                  dataKey="completed" 
                  stroke="#10b981" 
                  strokeWidth={2.5}
                  name="Completed"
                />
                <Area
                  type="monotone"
                  dataKey="inProgress"
                  fill="#f59e0b"
                  fillOpacity={0.3}
                  stroke="#f59e0b"
                  name="In Progress"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Current Status Distribution</CardTitle>
            <CardDescription>Tickets by current status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {operationalData.statusDistribution.map((item: any) => (
              <div key={item.status} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: STATUS_COLORS[item.status as keyof typeof STATUS_COLORS] }}
                    />
                    <span className="text-sm font-medium">{item.status}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">{item.count} tickets</span>
                    <Badge variant="outline">{item.percentage}%</Badge>
                  </div>
                </div>
                <Progress 
                  value={item.percentage} 
                  className="h-2"
                  style={{ 
                    '--progress-background': STATUS_COLORS[item.status as keyof typeof STATUS_COLORS] 
                  } as any}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Repair Time Analysis */}
        <Card>
          <CardHeader>
            <CardTitle>Repair Time Analysis</CardTitle>
            <CardDescription>Average repair times by priority</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Average</p>
                  <p className="text-2xl font-bold">{operationalData.repairTimeAnalysis.average}h</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Median</p>
                  <p className="text-2xl font-bold">{operationalData.repairTimeAnalysis.median}h</p>
                </div>
              </div>
              
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={operationalData.repairTimeAnalysis.byPriority}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="priority" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip formatter={(value: any) => `${value}h`} />
                    <Bar dataKey="avgTime" fill="#0088FE" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Service Type Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Service Type Performance</CardTitle>
          <CardDescription>Volume and average completion time by service type</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={operationalData.serviceTypeBreakdown}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="service" className="text-xs" />
                <YAxis yAxisId="left" className="text-xs" />
                <YAxis yAxisId="right" orientation="right" className="text-xs" />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="count" fill="#8884d8" name="Count" />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="avgTime"
                  stroke="#ff7300"
                  strokeWidth={2}
                  name="Avg Time (h)"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}