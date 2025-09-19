'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
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
  Treemap,
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Smartphone, Tablet, Watch, Headphones } from 'lucide-react';

interface DeviceReportProps {
  dateRange: {
    from: Date;
    to: Date;
  };
}

export function DeviceReport({ dateRange }: DeviceReportProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['device-report', dateRange],
    queryFn: async () => {
      const params = new URLSearchParams({
        from: dateRange.from.toISOString(),
        to: dateRange.to.toISOString(),
      });
      const response = await fetch(`/api/reports/devices?${params}`);
      if (!response.ok) throw new Error('Failed to fetch device data');
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
    topBrands: [
      { brand: 'Apple', count: 145, percentage: 42 },
      { brand: 'Samsung', count: 98, percentage: 28 },
      { brand: 'Google', count: 45, percentage: 13 },
      { brand: 'OnePlus', count: 32, percentage: 9 },
      { brand: 'Others', count: 28, percentage: 8 },
    ],
    topModels: [
      { model: 'iPhone 14 Pro', brand: 'Apple', count: 45 },
      { model: 'iPhone 13', brand: 'Apple', count: 38 },
      { model: 'Galaxy S23', brand: 'Samsung', count: 32 },
      { model: 'iPhone 12', brand: 'Apple', count: 28 },
      { model: 'Pixel 7', brand: 'Google', count: 22 },
      { model: 'Galaxy S22', brand: 'Samsung', count: 20 },
      { model: 'iPhone 15 Pro', brand: 'Apple', count: 18 },
      { model: 'OnePlus 11', brand: 'OnePlus', count: 15 },
    ],
    issuesByBrand: [
      { brand: 'Apple', screen: 65, battery: 45, water: 25, charging: 20, other: 15 },
      { brand: 'Samsung', screen: 42, battery: 35, water: 18, charging: 15, other: 12 },
      { brand: 'Google', screen: 18, battery: 15, water: 8, charging: 10, other: 8 },
      { brand: 'OnePlus', screen: 12, battery: 10, water: 5, charging: 8, other: 5 },
    ],
    repairSuccessRate: [
      { brand: 'Apple', successRate: 94, avgTime: 2.1 },
      { brand: 'Samsung', successRate: 92, avgTime: 2.3 },
      { brand: 'Google', successRate: 91, avgTime: 2.5 },
      { brand: 'OnePlus', successRate: 89, avgTime: 2.8 },
      { brand: 'Others', successRate: 87, avgTime: 3.2 },
    ],
    deviceTypes: [
      { type: 'Smartphones', count: 285, icon: 'phone' },
      { type: 'Tablets', count: 45, icon: 'tablet' },
      { type: 'Smartwatches', count: 12, icon: 'watch' },
      { type: 'Earbuds', count: 6, icon: 'headphones' },
    ],
  };

  const deviceData = data || mockData;
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  const getDeviceIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'smartphones':
        return <Smartphone className="h-4 w-4" />;
      case 'tablets':
        return <Tablet className="h-4 w-4" />;
      case 'smartwatches':
        return <Watch className="h-4 w-4" />;
      case 'earbuds':
        return <Headphones className="h-4 w-4" />;
      default:
        return <Smartphone className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Device Type Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {deviceData.deviceTypes.map((type: any) => (
          <Card key={type.type}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                {getDeviceIcon(type.type)}
                {type.type}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{type.count}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {((type.count / deviceData.deviceTypes.reduce((a: number, b: any) => a + b.count, 0)) * 100).toFixed(1)}% of total
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Top Brands Distribution */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Brand Distribution</CardTitle>
            <CardDescription>Most serviced device brands</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={deviceData.topBrands}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.brand}: ${entry.percentage}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {deviceData.topBrands.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Repair Success Rate */}
        <Card>
          <CardHeader>
            <CardTitle>Repair Success Rate by Brand</CardTitle>
            <CardDescription>Success rate and average repair time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {deviceData.repairSuccessRate.map((item: any) => (
                <div key={item.brand} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{item.brand}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{item.successRate}%</Badge>
                      <span className="text-xs text-muted-foreground">{item.avgTime}h avg</span>
                    </div>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ width: `${item.successRate}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Models Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Most Serviced Models</CardTitle>
          <CardDescription>Top device models by repair volume</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deviceData.topModels}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="model" 
                  className="text-xs" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis className="text-xs" />
                <Tooltip />
                <Bar dataKey="count" fill="#0088FE" radius={[4, 4, 0, 0]}>
                  {deviceData.topModels.map((entry: any, index: number) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.brand === 'Apple' ? '#0088FE' : 
                            entry.brand === 'Samsung' ? '#00C49F' :
                            entry.brand === 'Google' ? '#FFBB28' : '#FF8042'} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Issues by Brand */}
      <Card>
        <CardHeader>
          <CardTitle>Common Issues by Brand</CardTitle>
          <CardDescription>Distribution of repair types across different brands</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deviceData.issuesByBrand}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="brand" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip />
                <Legend />
                <Bar dataKey="screen" stackId="a" fill="#0088FE" name="Screen" />
                <Bar dataKey="battery" stackId="a" fill="#00C49F" name="Battery" />
                <Bar dataKey="water" stackId="a" fill="#FFBB28" name="Water Damage" />
                <Bar dataKey="charging" stackId="a" fill="#FF8042" name="Charging Port" />
                <Bar dataKey="other" stackId="a" fill="#8884D8" name="Other" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}