'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Trophy, TrendingUp, Clock, Star } from 'lucide-react';

interface PerformanceReportProps {
  dateRange: {
    from: Date;
    to: Date;
  };
}

export function PerformanceReport({ dateRange }: PerformanceReportProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['performance-report', dateRange],
    queryFn: async () => {
      const params = new URLSearchParams({
        from: dateRange.from.toISOString(),
        to: dateRange.to.toISOString(),
      });
      const response = await fetch(`/api/reports/performance?${params}`);
      if (!response.ok) throw new Error('Failed to fetch performance data');
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
    technicianMetrics: [
      {
        id: '1',
        name: 'Alex Johnson',
        avatar: '/avatars/alex.jpg',
        completedTickets: 45,
        avgRepairTime: 1.8,
        efficiency: 8.2,
        revenue: 5600,
        satisfaction: 4.8,
        rank: 1,
      },
      {
        id: '2',
        name: 'Sarah Martinez',
        avatar: '/avatars/sarah.jpg',
        completedTickets: 42,
        avgRepairTime: 2.1,
        efficiency: 7.5,
        revenue: 5200,
        satisfaction: 4.7,
        rank: 2,
      },
      {
        id: '3',
        name: 'Mike Chen',
        avatar: '/avatars/mike.jpg',
        completedTickets: 38,
        avgRepairTime: 2.3,
        efficiency: 6.8,
        revenue: 4800,
        satisfaction: 4.6,
        rank: 3,
      },
      {
        id: '4',
        name: 'Emily Davis',
        avatar: '/avatars/emily.jpg',
        completedTickets: 35,
        avgRepairTime: 2.5,
        efficiency: 6.2,
        revenue: 4200,
        satisfaction: 4.5,
        rank: 4,
      },
    ],
    performanceTrend: [
      { week: 'Week 1', alex: 10, sarah: 9, mike: 8, emily: 7 },
      { week: 'Week 2', alex: 12, sarah: 11, mike: 9, emily: 8 },
      { week: 'Week 3', alex: 11, sarah: 10, mike: 10, emily: 9 },
      { week: 'Week 4', alex: 12, sarah: 12, mike: 11, emily: 11 },
    ],
    skillMatrix: [
      { skill: 'Screen Repair', alex: 95, sarah: 90, mike: 85, emily: 88 },
      { skill: 'Battery', alex: 88, sarah: 92, mike: 90, emily: 85 },
      { skill: 'Water Damage', alex: 82, sarah: 85, mike: 88, emily: 90 },
      { skill: 'Software', alex: 78, sarah: 80, mike: 85, emily: 82 },
      { skill: 'Motherboard', alex: 85, sarah: 82, mike: 80, emily: 78 },
    ],
    teamStats: {
      totalTickets: 160,
      avgCompletionTime: 2.2,
      teamEfficiency: 7.2,
      totalRevenue: 19800,
      avgSatisfaction: 4.65,
    },
    radarData: [
      { metric: 'Speed', value: 85, fullMark: 100 },
      { metric: 'Quality', value: 92, fullMark: 100 },
      { metric: 'Volume', value: 78, fullMark: 100 },
      { metric: 'Customer Satisfaction', value: 88, fullMark: 100 },
      { metric: 'Revenue', value: 82, fullMark: 100 },
      { metric: 'Efficiency', value: 80, fullMark: 100 },
    ],
  };

  const performanceData = data || mockData;
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  return (
    <div className="space-y-6">
      {/* Team Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{performanceData.teamStats.totalTickets}</div>
            <p className="text-xs text-muted-foreground mt-1">Team total</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg Completion</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{performanceData.teamStats.avgCompletionTime}h</div>
            <p className="text-xs text-muted-foreground mt-1">Team average</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Team Efficiency</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{performanceData.teamStats.teamEfficiency}</div>
            <p className="text-xs text-muted-foreground mt-1">Tickets/hour</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${performanceData.teamStats.totalRevenue}</div>
            <p className="text-xs text-muted-foreground mt-1">Team generated</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Satisfaction</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-1">
              {performanceData.teamStats.avgSatisfaction}
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">Team average</p>
          </CardContent>
        </Card>
      </div>

      {/* Technician Leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Technician Leaderboard
          </CardTitle>
          <CardDescription>Performance rankings for the selected period</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">Rank</TableHead>
                <TableHead>Technician</TableHead>
                <TableHead className="text-center">Completed</TableHead>
                <TableHead className="text-center">Avg Time</TableHead>
                <TableHead className="text-center">Efficiency</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead className="text-center">Rating</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {performanceData.technicianMetrics.map((tech: any) => (
                <TableRow key={tech.id}>
                  <TableCell>
                    <div className="flex items-center justify-center">
                      {tech.rank === 1 && <Trophy className="h-4 w-4 text-yellow-500" />}
                      {tech.rank === 2 && <Trophy className="h-4 w-4 text-gray-400" />}
                      {tech.rank === 3 && <Trophy className="h-4 w-4 text-amber-600" />}
                      {tech.rank > 3 && <span className="text-muted-foreground">{tech.rank}</span>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={tech.avatar} />
                        <AvatarFallback>{tech.name.split(' ').map((n: string) => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{tech.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">{tech.completedTickets}</TableCell>
                  <TableCell className="text-center">{tech.avgRepairTime}h</TableCell>
                  <TableCell className="text-center">
                    <Badge variant={tech.efficiency > 7 ? 'default' : 'secondary'}>
                      {tech.efficiency}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">${tech.revenue}</TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      {tech.satisfaction}
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Performance Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Weekly Performance Trend</CardTitle>
            <CardDescription>Tickets completed per week by technician</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={performanceData.performanceTrend}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="week" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="alex" stroke="#0088FE" strokeWidth={2} name="Alex" />
                  <Line type="monotone" dataKey="sarah" stroke="#00C49F" strokeWidth={2} name="Sarah" />
                  <Line type="monotone" dataKey="mike" stroke="#FFBB28" strokeWidth={2} name="Mike" />
                  <Line type="monotone" dataKey="emily" stroke="#FF8042" strokeWidth={2} name="Emily" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Team Performance Radar */}
        <Card>
          <CardHeader>
            <CardTitle>Team Performance Overview</CardTitle>
            <CardDescription>Multi-dimensional performance metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={performanceData.radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="metric" className="text-xs" />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} />
                  <Radar
                    name="Team Performance"
                    dataKey="value"
                    stroke="#0088FE"
                    fill="#0088FE"
                    fillOpacity={0.6}
                  />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Skill Matrix */}
      <Card>
        <CardHeader>
          <CardTitle>Technician Skill Matrix</CardTitle>
          <CardDescription>Proficiency levels across different repair types</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={performanceData.skillMatrix}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="skill" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip />
                <Legend />
                <Bar dataKey="alex" fill="#0088FE" name="Alex" />
                <Bar dataKey="sarah" fill="#00C49F" name="Sarah" />
                <Bar dataKey="mike" fill="#FFBB28" name="Mike" />
                <Bar dataKey="emily" fill="#FF8042" name="Emily" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}