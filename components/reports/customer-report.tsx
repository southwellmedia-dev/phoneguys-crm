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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Users, UserPlus, UserCheck, TrendingUp } from 'lucide-react';

interface CustomerReportProps {
  dateRange: {
    from: Date;
    to: Date;
  };
}

export function CustomerReport({ dateRange }: CustomerReportProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['customer-report', dateRange],
    queryFn: async () => {
      const params = new URLSearchParams({
        from: dateRange.from.toISOString(),
        to: dateRange.to.toISOString(),
      });
      const response = await fetch(`/api/reports/customers?${params}`);
      if (!response.ok) throw new Error('Failed to fetch customer data');
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
    summary: {
      totalCustomers: 245,
      newCustomers: 32,
      returningCustomers: 89,
      retentionRate: 72,
      avgLifetimeValue: 425,
      avgOrdersPerCustomer: 2.3,
    },
    customerGrowth: [
      { month: 'Jan', new: 25, returning: 45, total: 70 },
      { month: 'Feb', new: 30, returning: 52, total: 82 },
      { month: 'Mar', new: 35, returning: 58, total: 93 },
      { month: 'Apr', new: 28, returning: 65, total: 93 },
      { month: 'May', new: 32, returning: 72, total: 104 },
      { month: 'Jun', new: 38, returning: 78, total: 116 },
    ],
    customerSegments: [
      { segment: 'New', count: 32, percentage: 13 },
      { segment: 'Regular', count: 89, percentage: 36 },
      { segment: 'VIP', count: 45, percentage: 18 },
      { segment: 'Dormant', count: 79, percentage: 33 },
    ],
    topCustomers: [
      { name: 'John Smith', totalSpent: 1250, orders: 8, lastOrder: '2 days ago', status: 'VIP' },
      { name: 'Jane Doe', totalSpent: 980, orders: 6, lastOrder: '1 week ago', status: 'Regular' },
      { name: 'Mike Johnson', totalSpent: 850, orders: 5, lastOrder: '3 days ago', status: 'Regular' },
      { name: 'Sarah Williams', totalSpent: 750, orders: 4, lastOrder: '2 weeks ago', status: 'Regular' },
      { name: 'Robert Brown', totalSpent: 650, orders: 4, lastOrder: '5 days ago', status: 'New' },
    ],
    issueFrequency: [
      { issue: 'Screen Damage', customers: 120 },
      { issue: 'Battery Issues', customers: 85 },
      { issue: 'Water Damage', customers: 65 },
      { issue: 'Charging Port', customers: 55 },
      { issue: 'Software Issues', customers: 45 },
    ],
  };

  const customerData = data || mockData;
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total Customers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customerData.summary.totalCustomers}</div>
            <p className="text-xs text-muted-foreground mt-1">
              All-time registered customers
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              New This Period
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customerData.summary.newCustomers}</div>
            <p className="text-xs text-muted-foreground mt-1">
              First-time customers
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <UserCheck className="h-4 w-4" />
              Retention Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customerData.summary.retentionRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              Returning customers
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Avg. Lifetime Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${customerData.summary.avgLifetimeValue}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {customerData.summary.avgOrdersPerCustomer} orders average
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Customer Growth Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Growth Trend</CardTitle>
          <CardDescription>New vs returning customers over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={customerData.customerGrowth}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="new"
                  stroke="#0088FE"
                  strokeWidth={2}
                  name="New Customers"
                />
                <Line
                  type="monotone"
                  dataKey="returning"
                  stroke="#00C49F"
                  strokeWidth={2}
                  name="Returning Customers"
                />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="#FFBB28"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="Total Active"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Customer Segments */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Segments</CardTitle>
            <CardDescription>Distribution by engagement level</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={customerData.customerSegments}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.segment}: ${entry.percentage}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {customerData.customerSegments.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Common Issues */}
        <Card>
          <CardHeader>
            <CardTitle>Most Common Issues</CardTitle>
            <CardDescription>Issues customers come in for</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={customerData.issueFrequency} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" className="text-xs" />
                  <YAxis dataKey="issue" type="category" className="text-xs" width={100} />
                  <Tooltip />
                  <Bar dataKey="customers" fill="#8884d8" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Customers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Top Customers</CardTitle>
          <CardDescription>Most valuable customers by lifetime spending</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Total Spent</TableHead>
                <TableHead className="text-right">Orders</TableHead>
                <TableHead>Last Order</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customerData.topCustomers.map((customer: any, index: number) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{customer.name}</TableCell>
                  <TableCell>
                    <Badge variant={customer.status === 'VIP' ? 'default' : 'secondary'}>
                      {customer.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">${customer.totalSpent}</TableCell>
                  <TableCell className="text-right">{customer.orders}</TableCell>
                  <TableCell className="text-muted-foreground">{customer.lastOrder}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}