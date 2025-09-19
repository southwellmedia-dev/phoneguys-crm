'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface RevenueReportProps {
  dateRange: {
    from: Date;
    to: Date;
  };
}

export function RevenueReport({ dateRange }: RevenueReportProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['revenue-report', dateRange],
    queryFn: async () => {
      const params = new URLSearchParams({
        from: dateRange.from.toISOString(),
        to: dateRange.to.toISOString(),
      });
      const response = await fetch(`/api/reports/revenue?${params}`);
      if (!response.ok) throw new Error('Failed to fetch revenue data');
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-[400px]" />
        <Skeleton className="h-[300px]" />
        <Skeleton className="h-[200px]" />
      </div>
    );
  }

  // Mock data for development
  const mockData = {
    dailyRevenue: [
      { date: 'Mon', revenue: 1200, orders: 5 },
      { date: 'Tue', revenue: 1800, orders: 8 },
      { date: 'Wed', revenue: 2400, orders: 12 },
      { date: 'Thu', revenue: 2100, orders: 10 },
      { date: 'Fri', revenue: 3200, orders: 15 },
      { date: 'Sat', revenue: 2800, orders: 13 },
      { date: 'Sun', revenue: 1500, orders: 7 },
    ],
    revenueByType: [
      { type: 'Screen Repair', value: 4500, percentage: 35 },
      { type: 'Battery Replacement', value: 3200, percentage: 25 },
      { type: 'Water Damage', value: 2800, percentage: 22 },
      { type: 'Other', value: 2300, percentage: 18 },
    ],
    topCustomers: [
      { name: 'John Smith', revenue: 850, orders: 4 },
      { name: 'Jane Doe', revenue: 720, orders: 3 },
      { name: 'Mike Johnson', revenue: 650, orders: 3 },
      { name: 'Sarah Williams', revenue: 580, orders: 2 },
      { name: 'Robert Brown', revenue: 450, orders: 2 },
    ],
    summary: {
      totalRevenue: 15000,
      totalOrders: 70,
      averageOrderValue: 214.29,
      laborRevenue: 9000,
      partsRevenue: 6000,
      growthRate: 12.5,
    },
  };

  const revenueData = data || mockData;
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${revenueData.summary.totalRevenue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              +{revenueData.summary.growthRate}% from last period
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{revenueData.summary.totalOrders}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Avg. ${revenueData.summary.averageOrderValue.toFixed(2)} per order
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Labor Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${revenueData.summary.laborRevenue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {((revenueData.summary.laborRevenue / revenueData.summary.totalRevenue) * 100).toFixed(1)}% of total
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Parts Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${revenueData.summary.partsRevenue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {((revenueData.summary.partsRevenue / revenueData.summary.totalRevenue) * 100).toFixed(1)}% of total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Trend</CardTitle>
          <CardDescription>Daily revenue and order volume</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueData.dailyRevenue}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" className="text-xs" />
                <YAxis yAxisId="left" className="text-xs" />
                <YAxis yAxisId="right" orientation="right" className="text-xs" />
                <Tooltip />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="revenue"
                  stroke="#0088FE"
                  strokeWidth={2}
                  name="Revenue ($)"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="orders"
                  stroke="#00C49F"
                  strokeWidth={2}
                  name="Orders"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Revenue by Service Type */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue by Service Type</CardTitle>
            <CardDescription>Breakdown of revenue sources</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={revenueData.revenueByType}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.type}: ${entry.percentage}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {revenueData.revenueByType.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => `$${value}`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Customers */}
        <Card>
          <CardHeader>
            <CardTitle>Top Customers</CardTitle>
            <CardDescription>Highest revenue generating customers</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">Orders</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {revenueData.topCustomers.map((customer: any, index: number) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{customer.name}</TableCell>
                    <TableCell className="text-right">${customer.revenue}</TableCell>
                    <TableCell className="text-right">{customer.orders}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}