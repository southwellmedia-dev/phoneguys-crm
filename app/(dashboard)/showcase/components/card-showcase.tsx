"use client";

import { MetricCard } from "@/components/premium/ui/cards/metric-card";
import { ActionCard } from "@/components/premium/ui/cards/action-card";
import { StatCard } from "@/components/premium/ui/cards/stat-card";
import { GlassCard } from "@/components/premium/ui/cards/glass-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  Package,
  Plus,
  FileText,
  Settings,
  BarChart
} from "lucide-react";

export function CardShowcase() {
  const sparklineData = [45, 52, 48, 65, 72, 89, 92];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Metric Cards</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <MetricCard
            title="Total Revenue"
            value="$12,345"
            subtitle="This month"
            icon={<DollarSign />}
            change={15.3}
            trend="up"
            variant="default"
            sparklineData={sparklineData}
          />
          <MetricCard
            title="Active Users"
            value="1,234"
            subtitle="Currently online"
            icon={<Users />}
            change={-5.2}
            trend="down"
            variant="primary"
            sparklineData={sparklineData}
          />
          <MetricCard
            title="New Orders"
            value="89"
            subtitle="Today"
            icon={<Package />}
            change={23}
            trend="up"
            variant="inverted-primary"
            sparklineData={sparklineData}
          />
          <MetricCard
            title="Growth Rate"
            value="24%"
            subtitle="Year over year"
            icon={<TrendingUp />}
            change={8}
            trend="up"
            variant="accent-success"
            sparklineData={sparklineData}
          />
          <MetricCard
            title="Conversion"
            value="3.2%"
            subtitle="This week"
            icon={<BarChart />}
            change={0.5}
            trend="up"
            variant="inverted-dark"
            sparklineData={sparklineData}
          />
          <MetricCard
            title="Churn Rate"
            value="1.8%"
            subtitle="Monthly average"
            icon={<TrendingUp />}
            change={-0.3}
            trend="down"
            variant="ghost"
            sparklineData={sparklineData}
          />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Action Cards</h3>
        <div className="grid gap-4 md:grid-cols-3">
          <ActionCard
            title="Create New Order"
            description="Start a new repair ticket"
            icon={<Plus />}
            variant="default"
            badge="Quick"
            stats={{ label: "Today", value: 12 }}
          />
          <ActionCard
            title="View Reports"
            description="Analytics dashboard"
            icon={<FileText />}
            variant="primary"
            stats={{ label: "Updated", value: "2 min ago" }}
          />
          <ActionCard
            title="Settings"
            description="Configure system"
            icon={<Settings />}
            variant="inverted-primary"
            badge="Admin"
          />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Stat Cards</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Total Sales"
            value="$45,231"
            icon={<DollarSign />}
            trend={12}
            trendLabel="vs last month"
            variant="default"
          />
          <StatCard
            label="New Customers"
            value="234"
            icon={<Users />}
            trend={-5}
            trendLabel="this week"
            variant="primary"
          />
          <StatCard
            label="Active Orders"
            value="89"
            icon={<Package />}
            trend={23}
            trendLabel="in progress"
            variant="success"
          />
          <StatCard
            label="Avg Response"
            value="1.2h"
            icon={<TrendingUp />}
            trendLabel="response time"
            variant="warning"
          />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Glass Cards</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <GlassCard 
            title="Glass Effect" 
            description="Glassmorphism with blur"
            blur="md"
          >
            <p className="text-sm text-muted-foreground">
              This card has a glass effect with medium blur and subtle transparency.
            </p>
          </GlassCard>
          <GlassCard 
            title="High Blur" 
            description="Maximum glass effect"
            blur="lg"
            opacity={20}
          >
            <p className="text-sm text-muted-foreground">
              Higher blur and lower opacity for a stronger glass effect.
            </p>
          </GlassCard>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Card Variants</CardTitle>
          <CardDescription>
            Different card styles for various use cases
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Default</h4>
              <p className="text-sm text-muted-foreground">
                Standard bordered card
              </p>
            </div>
            <div className="p-4 border border-primary rounded-lg">
              <h4 className="font-medium mb-2">Primary Border</h4>
              <p className="text-sm text-muted-foreground">
                Emphasized with primary color
              </p>
            </div>
            <div className="p-4 bg-primary text-white rounded-lg">
              <h4 className="font-medium mb-2">Inverted Primary</h4>
              <p className="text-sm opacity-90">
                Solid background for CTAs
              </p>
            </div>
            <div className="p-4 border border-primary/40 bg-primary/[0.02] rounded-lg">
              <h4 className="font-medium mb-2">Accent Primary</h4>
              <p className="text-sm text-muted-foreground">
                Subtle tinted background
              </p>
            </div>
            <div className="p-4 bg-transparent border-0 rounded-lg">
              <h4 className="font-medium mb-2">Ghost</h4>
              <p className="text-sm text-muted-foreground">
                No background or border
              </p>
            </div>
            <div className="p-4 bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900 rounded-lg">
              <h4 className="font-medium mb-2">Inverted Dark</h4>
              <p className="text-sm opacity-90">
                High contrast variant
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}