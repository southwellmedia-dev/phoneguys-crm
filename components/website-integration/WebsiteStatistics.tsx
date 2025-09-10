"use client";

import { useState } from 'react';
import { 
  CardPremium,
  MetricCard,
  ButtonPremium,
  StatusBadge
} from '@/components/premium';
import { 
  TrendingUp,
  TrendingDown,
  Users,
  Globe,
  Smartphone,
  Monitor,
  Calendar,
  Clock,
  ArrowRight
} from 'lucide-react';

interface DeviceStats {
  device: string;
  count: number;
  percentage: number;
}

interface TimeStats {
  hour: string;
  submissions: number;
}

export function WebsiteStatistics() {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month');

  // Mock data - would come from API
  const deviceStats: DeviceStats[] = [
    { device: 'iPhone 14 Pro', count: 45, percentage: 28.5 },
    { device: 'Samsung Galaxy S23', count: 38, percentage: 24.1 },
    { device: 'iPhone 13', count: 31, percentage: 19.6 },
    { device: 'Google Pixel 7', count: 24, percentage: 15.2 },
    { device: 'iPad Pro', count: 20, percentage: 12.6 },
  ];

  const sourceStats = [
    { source: 'Direct', visits: 1234, conversions: 842, rate: 68.2 },
    { source: 'Google', visits: 892, conversions: 523, rate: 58.6 },
    { source: 'Facebook', visits: 456, conversions: 312, rate: 68.4 },
    { source: 'Instagram', visits: 234, conversions: 189, rate: 80.7 },
  ];

  const peakHours: TimeStats[] = [
    { hour: '9 AM', submissions: 12 },
    { hour: '10 AM', submissions: 18 },
    { hour: '11 AM', submissions: 24 },
    { hour: '12 PM', submissions: 28 },
    { hour: '1 PM', submissions: 35 },
    { hour: '2 PM', submissions: 42 },
    { hour: '3 PM', submissions: 45 },
    { hour: '4 PM', submissions: 38 },
    { hour: '5 PM', submissions: 32 },
    { hour: '6 PM', submissions: 20 },
  ];

  const maxSubmissions = Math.max(...peakHours.map(h => h.submissions));

  return (
    <div className="grid gap-6">
      {/* Top Row - Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Form Views"
          value="3,842"
          change={15.3}
          trend="up"
          variant="default"
          sparklineData={[30, 35, 32, 38, 40, 42, 38]}
        />
        <MetricCard
          title="Form Starts"
          value="2,156"
          description="56.1% of views"
          variant="accent-cyan"
          sparklineData={[18, 20, 19, 22, 24, 23, 21]}
        />
        <MetricCard
          title="Completions"
          value="1,472"
          description="68.2% completion rate"
          variant="success"
          sparklineData={[12, 14, 13, 15, 16, 17, 15]}
        />
        <MetricCard
          title="Bounce Rate"
          value="43.9%"
          change={-5.2}
          trend="down"
          variant="accent-purple"
          sparklineData={[50, 48, 46, 45, 44, 43, 44]}
        />
      </div>

      {/* Second Row - Device & Source Stats */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Devices */}
        <CardPremium
          title="Top Devices"
          description="Most common devices from form submissions"
          variant="default"
          actions={
            <ButtonPremium variant="ghost" size="sm" icon={<ArrowRight className="h-4 w-4" />}>
              View All
            </ButtonPremium>
          }
        >
          <div className="space-y-4">
            {deviceStats.map((device, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <Smartphone className="h-4 w-4 text-gray-600" />
                  </div>
                  <div>
                    <div className="font-medium text-sm">{device.device}</div>
                    <div className="text-xs text-muted-foreground">{device.count} submissions</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-cyan-600 h-2 rounded-full" 
                      style={{ width: `${device.percentage}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium w-12 text-right">
                    {device.percentage}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardPremium>

        {/* Traffic Sources */}
        <CardPremium
          title="Traffic Sources"
          description="Where your form submissions come from"
          variant="default"
        >
          <div className="space-y-4">
            {sourceStats.map((source, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-sm">{source.source}</div>
                  <div className="text-xs text-muted-foreground">
                    {source.visits} visits • {source.conversions} conversions
                  </div>
                </div>
                <StatusBadge 
                  status={source.rate > 70 ? 'success' : source.rate > 60 ? 'warning' : 'error'} 
                  variant="soft"
                >
                  {source.rate}% rate
                </StatusBadge>
              </div>
            ))}
          </div>
        </CardPremium>
      </div>

      {/* Third Row - Peak Hours */}
      <CardPremium
        title="Peak Submission Hours"
        description="When users are most likely to submit forms"
        variant="default"
        actions={
          <div className="flex gap-2">
            <ButtonPremium
              variant={timeRange === 'week' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setTimeRange('week')}
            >
              Week
            </ButtonPremium>
            <ButtonPremium
              variant={timeRange === 'month' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setTimeRange('month')}
            >
              Month
            </ButtonPremium>
            <ButtonPremium
              variant={timeRange === 'year' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setTimeRange('year')}
            >
              Year
            </ButtonPremium>
          </div>
        }
      >
        <div className="space-y-3">
          {peakHours.map((hour, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <div className="w-12 text-xs text-muted-foreground text-right">
                {hour.hour}
              </div>
              <div className="flex-1 bg-gray-100 rounded-full h-6 relative">
                <div 
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-500 to-cyan-600 rounded-full flex items-center justify-end pr-2"
                  style={{ width: `${(hour.submissions / maxSubmissions) * 100}%` }}
                >
                  <span className="text-xs text-white font-medium">
                    {hour.submissions}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardPremium>

      {/* Fourth Row - Device Types */}
      <div className="grid gap-4 md:grid-cols-3">
        <CardPremium
          title="Mobile Traffic"
          variant="accent-cyan"
          className="text-center"
        >
          <div className="flex items-center justify-center gap-4">
            <div className="p-3 bg-cyan-100 rounded-full">
              <Smartphone className="h-8 w-8 text-cyan-600" />
            </div>
            <div>
              <div className="text-3xl font-bold">73%</div>
              <div className="text-sm text-muted-foreground">of all submissions</div>
            </div>
          </div>
        </CardPremium>

        <CardPremium
          title="Desktop Traffic"
          variant="accent-purple"
          className="text-center"
        >
          <div className="flex items-center justify-center gap-4">
            <div className="p-3 bg-purple-100 rounded-full">
              <Monitor className="h-8 w-8 text-purple-600" />
            </div>
            <div>
              <div className="text-3xl font-bold">27%</div>
              <div className="text-sm text-muted-foreground">of all submissions</div>
            </div>
          </div>
        </CardPremium>

        <CardPremium
          title="Avg Session Time"
          variant="success"
          className="text-center"
        >
          <div className="flex items-center justify-center gap-4">
            <div className="p-3 bg-green-100 rounded-full">
              <Clock className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <div className="text-3xl font-bold">3:42</div>
              <div className="text-sm text-muted-foreground">minutes per session</div>
            </div>
          </div>
        </CardPremium>
      </div>
    </div>
  );
}