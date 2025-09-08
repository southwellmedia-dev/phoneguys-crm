"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MetricCard } from "@/components/dashboard/metric-card";

// Premium Design System Components
import { 
  StatCard, 
  PhoneDetailCard, 
  ActivityTimeline, 
  RepairServiceWidget,
  PremiumTable,
  PremiumTabs,
  TabPanel,
  TimeEntries,
  TimerWidget,
  DeviceSelector,
  RepairServicesSummary,
  CustomerCard,
  PhotosCard,
  NotesWidget,
  QuickActions
} from "@/components/premium";

import { PageContainer } from "@/components/layout/page-container";
import { Wrench, Users, DollarSign, Clock, AlertCircle, CheckCircle, TrendingUp, Package, Palette, Activity, CreditCard, Target, Zap, Phone, Settings, Eye, Edit, Trash, Play, Pause, Mail, Calendar, Printer } from "lucide-react";
import { useState } from "react";

export default function DesignSystemPage() {
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("overview");
  
  const handleServiceSelect = (id: string) => {
    setSelectedServices(prev => 
      prev.includes(id) 
        ? prev.filter(s => s !== id)
        : [...prev, id]
    );
  };

  return (
    <PageContainer
      title="Design System"
      description="Premium component library with visual hierarchy and variations"
      actions={[
        {
          label: "View Docs",
          href: "/docs/design-ui",
          variant: "outline" as const,
        },
        {
          label: "Export Theme",
          onClick: () => console.log("Export theme"),
          icon: <Palette className="h-4 w-4" />,
        },
      ]}
    >
      <div className="space-y-12">

      {/* Visual Hierarchy Demo */}
      <section className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold mb-4">Visual Hierarchy with MetricCards</h2>
          <p className="text-muted-foreground mb-6">
            Different priority levels create clear information hierarchy
          </p>
        </div>

        {/* High Priority Metrics - Hero Zone */}
        <div className="grid gap-4 md:grid-cols-3">
          <MetricCard
            title="Today's Repairs"
            value="24"
            description="8 completed, 16 in progress"
            icon={Wrench}
            priority="high"
            color="cyan"
            trend={{ value: 15, isPositive: true }}
          />
          <MetricCard
            title="Revenue Today"
            value="$4,280"
            description="Target: $5,000"
            icon={DollarSign}
            priority="high"
            color="green"
            trend={{ value: 22, isPositive: true }}
          />
          <MetricCard
            title="Urgent Tickets"
            value="3"
            description="Require immediate attention"
            icon={AlertCircle}
            priority="high"
            color="red"
            trend={{ value: 50, isPositive: false }}
          />
        </div>

        {/* Medium Priority Metrics */}
        <div className="grid gap-4 md:grid-cols-4">
          <MetricCard
            title="Active Customers"
            value="142"
            icon={Users}
            priority="medium"
            trend={{ value: 5, isPositive: true }}
          />
          <MetricCard
            title="Avg Repair Time"
            value="2.5h"
            icon={Clock}
            priority="medium"
            trend={{ value: 10, isPositive: true }}
          />
          <MetricCard
            title="Completion Rate"
            value="94%"
            icon={CheckCircle}
            priority="medium"
            trend={{ value: 2, isPositive: true }}
          />
          <MetricCard
            title="Parts in Stock"
            value="287"
            icon={Package}
            priority="medium"
          />
        </div>

        {/* Creative Stat Cards */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4">Creative Stat Card Variations</h3>
          <div className="grid gap-4 md:grid-cols-5">
            <StatCard
              title="Week Total"
              value="156"
              variant="background-number"
              icon={Activity}
              color="cyan"
              change={12}
            />
            <StatCard
              title="Revenue"
              value="$12.5K"
              variant="gradient-border"
              icon={DollarSign}
              color="green"
              change={8}
            />
            <StatCard
              title="Avg Rating"
              value="4.8"
              variant="floating"
              icon={Target}
              color="amber"
            />
            <StatCard
              title="Efficiency"
              value="94%"
              variant="split"
              icon={Zap}
              color="purple"
              change={-2}
            />
            <StatCard
              title="Active Staff"
              value="8/10"
              variant="default"
              icon={Users}
              color="red"
            />
          </div>
        </div>
      </section>

      {/* Card Variants */}
      <section className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold mb-4">Card Variants</h2>
          <p className="text-muted-foreground mb-6">
            Mix and match card styles to create visual interest and hierarchy
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card variant="solid" color="cyan">
            <CardHeader>
              <CardTitle className="text-white">Solid Cyan Card</CardTitle>
              <CardDescription className="text-white/80">
                High priority information with inverted text
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-white/90">
                Perfect for highlighting critical metrics or CTAs that need immediate attention.
              </p>
            </CardContent>
          </Card>

          <Card variant="gradient">
            <CardHeader>
              <CardTitle>Gradient Card</CardTitle>
              <CardDescription>
                Subtle gradient background for secondary emphasis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Adds visual interest without overwhelming the content.
              </p>
            </CardContent>
          </Card>

          <Card variant="elevated">
            <CardHeader>
              <CardTitle>Elevated Card</CardTitle>
              <CardDescription>
                Strong shadow creates depth and prominence
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Appears to float above the page, great for interactive elements.
              </p>
            </CardContent>
          </Card>

          <Card variant="glass">
            <CardHeader>
              <CardTitle>Glass Card</CardTitle>
              <CardDescription>
                Frosted glass effect with backdrop blur
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Modern glassmorphism for overlays and special sections.
              </p>
            </CardContent>
          </Card>

          <Card variant="outlined">
            <CardHeader>
              <CardTitle>Outlined Card</CardTitle>
              <CardDescription>
                Minimal style for less important content
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Clean borders without fill, perfect for tertiary information.
              </p>
            </CardContent>
          </Card>

          <Card variant="solid" color="navy">
            <CardHeader>
              <CardTitle className="text-white">Solid Navy Card</CardTitle>
              <CardDescription className="text-white/80">
                Professional dark variant
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-white/90">
                Sophisticated color for premium features or admin sections.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Button Variants */}
      <section className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold mb-4">Button Variants</h2>
          <p className="text-muted-foreground mb-6">
            Enhanced buttons with hover effects and loading states
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <Button>Default</Button>
            <Button variant="gradient">Gradient</Button>
            <Button variant="solid" color="cyan">Solid Cyan</Button>
            <Button variant="solid" color="green">Solid Green</Button>
            <Button variant="glass">Glass Effect</Button>
            <Button variant="glow">Glow Effect</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="destructive">Destructive</Button>
          </div>

          <div className="flex flex-wrap gap-4">
            <Button size="sm">Small</Button>
            <Button size="default">Default</Button>
            <Button size="lg">Large</Button>
            <Button size="xl">Extra Large</Button>
            <Button size="icon">
              <Wrench className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex flex-wrap gap-4">
            <Button loading>Loading...</Button>
            <Button disabled>Disabled</Button>
            <Button variant="gradient" loading>Processing</Button>
          </div>
        </div>
      </section>

      {/* Badge Variants */}
      <section className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold mb-4">Badge Variants</h2>
          <p className="text-muted-foreground mb-6">
            Status indicators and labels with multiple styles
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium mb-3">Solid Badges</h3>
            <div className="flex flex-wrap gap-2">
              <Badge variant="solid" color="cyan">New</Badge>
              <Badge variant="solid" color="amber">In Progress</Badge>
              <Badge variant="solid" color="green">Completed</Badge>
              <Badge variant="solid" color="red">Urgent</Badge>
              <Badge variant="solid" color="blue">Info</Badge>
              <Badge variant="solid" color="purple">Premium</Badge>
              <Badge variant="solid" color="gray">Archived</Badge>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium mb-3">Soft Badges</h3>
            <div className="flex flex-wrap gap-2">
              <Badge variant="soft" color="cyan">New</Badge>
              <Badge variant="soft" color="amber">In Progress</Badge>
              <Badge variant="soft" color="green">Completed</Badge>
              <Badge variant="soft" color="red">Urgent</Badge>
              <Badge variant="soft" color="blue">Info</Badge>
              <Badge variant="soft" color="purple">Premium</Badge>
              <Badge variant="soft" color="gray">Archived</Badge>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium mb-3">Outline Badges</h3>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" color="cyan">New</Badge>
              <Badge variant="outline" color="amber">In Progress</Badge>
              <Badge variant="outline" color="green">Completed</Badge>
              <Badge variant="outline" color="red">Urgent</Badge>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium mb-3">With Dots</h3>
            <div className="flex flex-wrap gap-2">
              <Badge variant="soft" color="green" dot>Online</Badge>
              <Badge variant="soft" color="amber" dot>Away</Badge>
              <Badge variant="soft" color="red" dot>Busy</Badge>
              <Badge variant="soft" color="gray" dot>Offline</Badge>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium mb-3">Sizes</h3>
            <div className="flex flex-wrap gap-2 items-center">
              <Badge size="sm">Small</Badge>
              <Badge size="md">Medium</Badge>
              <Badge size="lg">Large</Badge>
            </div>
          </div>
        </div>
      </section>

      {/* Color Combinations */}
      <section className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold mb-4">Smart Color Combinations</h2>
          <p className="text-muted-foreground mb-6">
            Professional color usage that maintains hierarchy
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card variant="solid" color="cyan">
            <CardHeader>
              <CardTitle className="text-white">Primary Action Zone</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-white/90">Critical metrics and primary CTAs</p>
              <div className="flex gap-2">
                <Button variant="glass" size="sm">View Details</Button>
                <Button variant="outline" className="border-white/20 text-white hover:bg-white/10" size="sm">
                  Settings
                </Button>
              </div>
              <div className="flex gap-2">
                <Badge variant="soft" className="bg-white/20 text-white border-white/30">Active</Badge>
                <Badge variant="soft" className="bg-white/20 text-white border-white/30">Priority</Badge>
              </div>
            </CardContent>
          </Card>

          <Card variant="gradient">
            <CardHeader>
              <CardTitle>Secondary Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-muted-foreground">Supporting data and actions</p>
              <div className="flex gap-2">
                <Button size="sm">Action</Button>
                <Button variant="outline" size="sm">Alternative</Button>
              </div>
              <div className="flex gap-2">
                <Badge variant="soft" color="blue">Updated</Badge>
                <Badge variant="soft" color="green">Verified</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Business-Specific Components */}
      <section className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold mb-4">Phone Repair Components</h2>
          <p className="text-muted-foreground mb-6">
            Custom components designed specifically for phone repair management
          </p>
        </div>

        {/* Phone Detail Card */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Phone Detail Card</h3>
          <PhoneDetailCard
            device={{
              brand: "Apple",
              model: "iPhone 14 Pro Max",
              color: "Deep Purple",
              storage: "256GB",
              imei: "359836150000000",
              condition: "good"
            }}
            issues={["Cracked Screen", "Battery Drain", "Camera Focus Issue", "Speaker Distortion"]}
            warranty={{
              status: "active",
              expiresAt: "Dec 2024"
            }}
          />
        </div>

        {/* Repair Service Widget */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Repair Service Selection Widget</h3>
          <p className="text-sm text-muted-foreground">Interactive service selection with pricing and availability</p>
          
          <RepairServiceWidget
            services={[
              {
                id: "1",
                name: "Screen Replacement",
                price: 199,
                estimatedTime: "45 min",
                popularity: "high",
                warranty: "90 days",
                inStock: true,
                discount: 15
              },
              {
                id: "2",
                name: "Battery Replacement",
                price: 89,
                estimatedTime: "30 min",
                warranty: "6 months",
                inStock: true
              },
              {
                id: "3",
                name: "Camera Module Repair",
                price: 149,
                estimatedTime: "1 hour",
                warranty: "30 days",
                inStock: false
              },
              {
                id: "4",
                name: "Charging Port Fix",
                price: 79,
                estimatedTime: "20 min",
                warranty: "60 days",
                inStock: true
              },
              {
                id: "5",
                name: "Water Damage Treatment",
                price: 249,
                estimatedTime: "2-3 hours",
                popularity: "medium",
                warranty: "No warranty",
                inStock: true,
                discount: 10
              },
              {
                id: "6",
                name: "Software Troubleshooting",
                price: 49,
                estimatedTime: "15 min",
                warranty: "7 days",
                inStock: true
              }
            ]}
            selectedIds={selectedServices}
            onSelect={handleServiceSelect}
            variant="grid"
          />
        </div>

        {/* Activity Timeline */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Activity Timeline</h3>
          <p className="text-sm text-muted-foreground">Track repair progress and customer interactions</p>
          
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Default Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <ActivityTimeline
                  events={[
                    {
                      id: "1",
                      type: "status",
                      title: "Repair Started",
                      description: "Technician began working on screen replacement",
                      timestamp: "10:30 AM",
                      user: { name: "John Tech" },
                      highlight: true
                    },
                    {
                      id: "2",
                      type: "note",
                      title: "Customer Note Added",
                      description: "Customer requested extra protective case",
                      timestamp: "11:15 AM",
                      user: { name: "Sarah CS" }
                    },
                    {
                      id: "3",
                      type: "repair",
                      title: "Parts Installed",
                      description: "New display module installed successfully",
                      timestamp: "11:45 AM",
                      user: { name: "John Tech" }
                    },
                    {
                      id: "4",
                      type: "payment",
                      title: "Payment Received",
                      description: "$199 paid via credit card",
                      timestamp: "12:00 PM",
                      metadata: { method: "Visa", last4: "4242" }
                    },
                    {
                      id: "5",
                      type: "status",
                      title: "Ready for Pickup",
                      description: "Customer notified via SMS",
                      timestamp: "12:15 PM",
                      user: { name: "System" }
                    }
                  ]}
                  variant="default"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Detailed Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <ActivityTimeline
                  events={[
                    {
                      id: "1",
                      type: "call",
                      title: "Customer Called",
                      description: "Inquired about repair status",
                      timestamp: "2 hours ago",
                      user: { name: "Mike Support" },
                      metadata: { duration: "5 min", outcome: "Resolved" }
                    },
                    {
                      id: "2",
                      type: "message",
                      title: "SMS Sent",
                      description: "Repair completion notification",
                      timestamp: "1 hour ago",
                      user: { name: "System" },
                      metadata: { template: "completion-v2" }
                    },
                    {
                      id: "3",
                      type: "status",
                      title: "Picked Up",
                      description: "Device collected by customer",
                      timestamp: "30 min ago",
                      user: { name: "Front Desk" },
                      highlight: true,
                      metadata: { signature: "Yes", id: "John Doe" }
                    }
                  ]}
                  variant="detailed"
                />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Premium Tables */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Premium Table Components</h3>
          <p className="text-sm text-muted-foreground">Data tables with enhanced styling and interactions</p>
          
          <PremiumTable
            data={[
              {
                id: "1",
                customer: "John Doe",
                device: "iPhone 14 Pro",
                status: "in_progress",
                technician: "Mike Tech",
                created: "2024-01-10",
                total: 249.99
              },
              {
                id: "2", 
                customer: "Sarah Smith",
                device: "Samsung S23",
                status: "completed",
                technician: "Jane Repair",
                created: "2024-01-09",
                total: 189.00
              },
              {
                id: "3",
                customer: "Bob Johnson", 
                device: "iPad Air",
                status: "pending",
                technician: "Unassigned",
                created: "2024-01-11",
                total: 299.00
              }
            ]}
            columns={[
              {
                key: "customer",
                header: "Customer",
                sortable: true,
                render: (value: string) => <div className="font-medium">{value}</div>
              },
              {
                key: "device",
                header: "Device",
                sortable: true,
                render: (value: string) => (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{value}</span>
                  </div>
                )
              },
              {
                key: "status",
                header: "Status",
                sortable: true,
                render: (value: string) => {
                  const colors: Record<string, any> = {
                    pending: "amber",
                    in_progress: "blue", 
                    completed: "green"
                  };
                  return (
                    <Badge variant="soft" color={colors[value] || "gray"}>
                      {value.replace("_", " ")}
                    </Badge>
                  );
                }
              },
              {
                key: "technician",
                header: "Technician",
                render: (value: string) => (
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="h-3 w-3" />
                    </div>
                    <span className="text-sm">{value}</span>
                  </div>
                )
              },
              {
                key: "total",
                header: "Total",
                align: "right" as const,
                sortable: true,
                render: (value: number) => (
                  <span className="font-semibold">${value.toFixed(2)}</span>
                )
              }
            ]}
            variant="premium"
            hoverable
            actions={(row) => (
              <div className="flex gap-1">
                <Button size="sm" variant="ghost">
                  <Eye className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="ghost">
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
            )}
          />
        </div>

        {/* Premium Tabs */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Premium Tab Navigation</h3>
          <p className="text-sm text-muted-foreground">Enhanced tabs with multiple variants</p>
          
          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-medium mb-3">Glass Variant</h4>
              <PremiumTabs
                tabs={[
                  { id: "1", label: "Overview", icon: <Eye className="h-4 w-4" /> },
                  { id: "2", label: "Details", badge: "12" },
                  { id: "3", label: "Settings", icon: <Settings className="h-4 w-4" /> }
                ]}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                variant="glass"
              />
            </div>

            <div>
              <h4 className="text-sm font-medium mb-3">Solid Variant</h4>
              <PremiumTabs
                tabs={[
                  { id: "a", label: "Active" },
                  { id: "b", label: "Completed", badge: "24" },
                  { id: "c", label: "Archived" }
                ]}
                activeTab="a"
                onTabChange={() => {}}
                variant="solid"
              />
            </div>

            <div>
              <h4 className="text-sm font-medium mb-3">Gradient Variant</h4>
              <PremiumTabs
                tabs={[
                  { id: "x", label: "Dashboard", icon: <TrendingUp className="h-4 w-4" /> },
                  { id: "y", label: "Analytics", icon: <Activity className="h-4 w-4" /> },
                  { id: "z", label: "Reports", badge: "3" }
                ]}
                activeTab="x"
                onTabChange={() => {}}
                variant="gradient"
              />
            </div>
          </div>
        </div>

        {/* Time Entries */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Time Entry Components</h3>
          <p className="text-sm text-muted-foreground">Track technician time with billing calculations</p>
          
          <TimeEntries
            entries={[
              {
                id: "1",
                taskName: "Screen Replacement - iPhone 14",
                duration: "1h 30m",
                startTime: "09:00 AM",
                endTime: "10:30 AM",
                user: { name: "John Tech", role: "Senior Technician" },
                rate: 75,
                total: 112.50,
                status: "completed" as const,
                category: "Repair",
                notes: "Replaced cracked screen, tested all functions"
              },
              {
                id: "2",
                taskName: "Battery Diagnostic - Samsung S23",
                duration: "45m",
                startTime: "10:45 AM",
                user: { name: "Sarah Expert", role: "Technician" },
                rate: 60,
                total: 45.00,
                status: "active" as const,
                category: "Diagnostic"
              },
              {
                id: "3",
                taskName: "Water Damage Assessment",
                duration: "2h 15m",
                startTime: "11:30 AM",
                endTime: "01:45 PM",
                user: { name: "Mike Senior", role: "Lead Technician" },
                rate: 85,
                total: 191.25,
                status: "completed" as const,
                category: "Repair"
              }
            ]}
            variant="elevated"
            showTotals
            onEntryClick={(entry) => console.log("Entry clicked:", entry)}
            onAction={(action, entry) => console.log(action, entry)}
          />
        </div>

        {/* Timer Widget */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Timer Widgets</h3>
          <p className="text-sm text-muted-foreground">Premium time tracking components for employees</p>
          
          <div className="grid gap-6 md:grid-cols-2">
            <TimerWidget
              timer={{
                ticketId: "1",
                ticketNumber: "TK-001",
                customerName: "John Doe",
                elapsedSeconds: 4567,
                isRunning: true,
                startTime: "09:00 AM"
              }}
              variant="elevated"
              onStart={() => console.log("Start")}
              onPause={() => console.log("Pause")}
              onStop={() => console.log("Stop")}
            />
            
            <TimerWidget
              timer={{
                ticketId: "2",
                ticketNumber: "TK-002",
                customerName: "Sarah Smith",
                elapsedSeconds: 1800,
                isRunning: false
              }}
              variant="glass"
              onStart={() => console.log("Start")}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <TimerWidget
              timer={{
                ticketId: "3",
                ticketNumber: "TK-003",
                elapsedSeconds: 7890,
                isRunning: true
              }}
              variant="compact"
              onPause={() => console.log("Pause")}
              onStop={() => console.log("Stop")}
            />
            <TimerWidget
              variant="compact"
              disabled
              disabledReason="Timer locked by admin"
            />
            <TimerWidget
              variant="compact"
              onStart={() => console.log("Start new timer")}
            />
          </div>
        </div>

        {/* Device Selector */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Device Selector</h3>
          <p className="text-sm text-muted-foreground">Enhanced device selection with customer devices</p>
          
          <div className="grid gap-6 lg:grid-cols-2">
            <DeviceSelector
              devices={[
                {
                  id: "1",
                  model_name: "iPhone 14 Pro Max",
                  manufacturer: { name: "Apple" }
                },
                {
                  id: "2",
                  model_name: "Galaxy S23 Ultra",
                  manufacturer: { name: "Samsung" }
                },
                {
                  id: "3",
                  model_name: "Pixel 7 Pro",
                  manufacturer: { name: "Google" }
                }
              ]}
              customerDevices={[
                {
                  id: "cd1",
                  device_id: "1",
                  nickname: "John's iPhone",
                  serial_number: "SNFAKE123456",
                  color: "Deep Purple",
                  storage_size: "256GB",
                  condition: "excellent",
                  device: {
                    id: "1",
                    model_name: "iPhone 14 Pro Max",
                    manufacturer: { name: "Apple" }
                  }
                },
                {
                  id: "cd2",
                  device_id: "2",
                  nickname: "Work Phone",
                  serial_number: "SNFAKE789012",
                  color: "Phantom Black",
                  storage_size: "512GB",
                  condition: "good",
                  device: {
                    id: "2",
                    model_name: "Galaxy S23 Ultra",
                    manufacturer: { name: "Samsung" }
                  }
                }
              ]}
              selectedDeviceId="1"
              onDeviceChange={(id) => console.log("Device selected:", id)}
              onCustomerDeviceChange={(id) => console.log("Customer device selected:", id)}
              serialNumber="SNFAKE123456"
              onSerialNumberChange={(sn) => console.log("Serial:", sn)}
              color="Deep Purple"
              onColorChange={(color) => console.log("Color:", color)}
              condition="excellent"
              onConditionChange={(cond) => console.log("Condition:", cond)}
              variant="elevated"
              showTestControls
            />
            
            <DeviceSelector
              devices={[
                {
                  id: "1",
                  model_name: "iPhone 14 Pro Max",
                  manufacturer: { name: "Apple" }
                }
              ]}
              selectedDeviceId="1"
              onDeviceChange={(id) => console.log("Device selected:", id)}
              variant="compact"
            />
          </div>
        </div>

        {/* Widget Components */}
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold mb-4">Premium Widgets</h2>
          <p className="text-sm text-muted-foreground mb-6">Specialized widgets for repair order management</p>

          {/* Repair Services Summary */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Repair Services Summary</h3>
            <p className="text-sm text-muted-foreground">Service selection with pricing and status tracking</p>
            
            <div className="space-y-6">
              {/* Priority/Urgent Repairs - Cyan Solid */}
              <div>
                <h4 className="text-sm font-medium mb-3 text-muted-foreground">URGENT REPAIRS - Priority Variant (Cyan Solid)</h4>
                <div className="max-w-2xl">
                  <RepairServicesSummary
                    services={[
                      {
                        id: "1",
                        name: "Emergency Screen Replacement",
                        description: "Priority repair for business customer",
                        unit_price: 249.99,
                        quantity: 1,
                        estimated_minutes: 30,
                        status: "pending",
                        parts_required: ["Premium Display Assembly"],
                        warranty_days: 90
                      },
                      {
                        id: "2",
                        name: "Water Damage Recovery",
                        description: "Critical data recovery needed",
                        unit_price: 299.99,
                        quantity: 1,
                        estimated_minutes: 120,
                        status: "pending",
                        warranty_days: 30
                      },
                      {
                        id: "3",
                        name: "Priority Diagnostic",
                        unit_price: 49.99,
                        quantity: 1,
                        status: "in_progress"
                      }
                    ]}
                    variant="priority"
                    showServiceDetails
                    onServiceClick={(service) => console.log("Priority service:", service)}
                  />
                </div>
              </div>

              {/* Premium Service Package - Gradient */}
              <div>
                <h4 className="text-sm font-medium mb-3 text-muted-foreground">PREMIUM PACKAGE - Gradient Variant</h4>
                <div className="max-w-2xl">
                  <RepairServicesSummary
                    services={[
                      {
                        id: "1",
                        name: "Complete Device Restoration",
                        description: "Full service package with premium parts",
                        unit_price: 399.99,
                        quantity: 1,
                        estimated_minutes: 180,
                        status: "in_progress",
                        parts_required: ["Premium Display", "Battery", "Protective Glass"],
                        warranty_days: 365
                      },
                      {
                        id: "2",
                        name: "Data Transfer & Setup",
                        description: "Professional data migration service",
                        unit_price: 99.99,
                        quantity: 1,
                        estimated_minutes: 60,
                        status: "completed",
                        warranty_days: 30
                      },
                      {
                        id: "3",
                        name: "Premium Protection Plan",
                        description: "1-year extended warranty and support",
                        unit_price: 149.99,
                        quantity: 1,
                        status: "completed"
                      }
                    ]}
                    variant="gradient"
                    showServiceDetails
                    onServiceClick={(service) => console.log("Premium service:", service)}
                  />
                </div>
              </div>

              {/* Standard Services */}
              <div>
                <h4 className="text-sm font-medium mb-3 text-muted-foreground">STANDARD SERVICES - Elevated & Compact</h4>
                <div className="grid gap-4 lg:grid-cols-2">
                  <RepairServicesSummary
                    services={[
                      {
                        id: "1",
                        name: "Screen Replacement",
                        description: "Standard screen repair",
                        unit_price: 199.99,
                        quantity: 1,
                        estimated_minutes: 45,
                        status: "completed",
                        warranty_days: 90
                      },
                      {
                        id: "2",
                        name: "Battery Replacement",
                        unit_price: 89.99,
                        quantity: 1,
                        status: "in_progress"
                      }
                    ]}
                    variant="elevated"
                    showServiceDetails
                  />

                  <RepairServicesSummary
                    services={[
                      {
                        id: "1",
                        name: "Basic Diagnostic",
                        unit_price: 29.99,
                        quantity: 1,
                        status: "completed"
                      },
                      {
                        id: "2",
                        name: "Charging Port Repair",
                        unit_price: 79.99,
                        quantity: 1,
                        status: "pending"
                      }
                    ]}
                    variant="compact"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Customer Cards */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Customer Cards - Visual Hierarchy Variants</h3>
            <p className="text-sm text-muted-foreground">Different card styles create clear importance levels</p>
            
            {/* High Priority - Navy Solid for Order Details */}
            <div>
              <h4 className="text-sm font-medium mb-3 text-muted-foreground">HIGH PRIORITY - Navy Solid (Order Detail Page)</h4>
              <div className="max-w-lg">
                <CustomerCard
                  customer={{
                    id: "1",
                    first_name: "Marcus",
                    last_name: "Johnson",
                    email: "marcus.johnson@example.com",
                    phone: "+1 (555) 123-4567",
                    address: "123 Main St, Downtown Tech District",
                    created_at: "2024-01-01",
                    is_vip: true,
                    rating: 5,
                    total_orders: 28,
                    total_spent: 4856.78,
                    notes: "Premium business customer - priority support"
                  }}
                  variant="navy"
                  showActions
                  onCall={() => console.log("Call customer")}
                  onEmail={() => console.log("Email customer")}
                  onMessage={() => console.log("Message customer")}
                  onEdit={() => console.log("Edit customer")}
                />
              </div>
            </div>

            {/* VIP Customers - Cyan Solid */}
            <div>
              <h4 className="text-sm font-medium mb-3 text-muted-foreground">VIP CUSTOMERS - Cyan Solid</h4>
              <div className="grid gap-4 md:grid-cols-2 max-w-4xl">
                <CustomerCard
                  customer={{
                    id: "2",
                    first_name: "Isabella",
                    last_name: "Rodriguez",
                    email: "isabella@techstartup.com",
                    phone: "+1 (555) 987-6543",
                    created_at: "2024-01-01",
                    is_vip: true,
                    rating: 5,
                    total_orders: 15,
                    total_spent: 3247.89,
                    notes: "CEO - Tech Startup, bulk device repairs"
                  }}
                  variant="vip"
                />
                
                <CustomerCard
                  customer={{
                    id: "3",
                    first_name: "David",
                    last_name: "Chen",
                    email: "d.chen@enterprise.com",
                    phone: "+1 (555) 445-7890",
                    created_at: "2024-01-01",
                    is_vip: true,
                    rating: 5,
                    total_orders: 42,
                    total_spent: 8965.12
                  }}
                  variant="vip"
                />
              </div>
            </div>

            {/* Modern Glass Effect */}
            <div>
              <h4 className="text-sm font-medium mb-3 text-muted-foreground">PREMIUM MODERN - Glass Effect</h4>
              <div className="max-w-lg">
                <CustomerCard
                  customer={{
                    id: "4",
                    first_name: "Emma",
                    last_name: "Thompson",
                    email: "emma.thompson@design.co",
                    phone: "+1 (555) 234-5678",
                    created_at: "2024-01-01",
                    is_vip: true,
                    rating: 4,
                    total_orders: 8,
                    total_spent: 1567.43,
                    notes: "Creative director - handles team devices"
                  }}
                  variant="glass"
                  showActions
                  onCall={() => console.log("Call customer")}
                  onEmail={() => console.log("Email customer")}
                />
              </div>
            </div>

            {/* Standard Customers */}
            <div>
              <h4 className="text-sm font-medium mb-3 text-muted-foreground">STANDARD CUSTOMERS - Elevated & Compact</h4>
              <div className="grid gap-4 md:grid-cols-2">
                <CustomerCard
                  customer={{
                    id: "5",
                    first_name: "Sarah",
                    last_name: "Wilson",
                    email: "sarah.wilson@example.com",
                    phone: "+1 (555) 987-6543",
                    created_at: "2024-01-01",
                    rating: 4,
                    total_orders: 3,
                    total_spent: 567.89
                  }}
                  variant="elevated"
                  showActions
                  onCall={() => console.log("Call customer")}
                />
                
                <CustomerCard
                  customer={{
                    id: "6",
                    first_name: "Mike",
                    last_name: "Davis",
                    email: "mike.davis@example.com",
                    phone: "+1 (555) 345-6789",
                    created_at: "2024-01-01",
                    total_orders: 1,
                    total_spent: 199.99
                  }}
                  variant="compact"
                />
              </div>
            </div>
          </div>

          {/* Photos Cards */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Photos Card</h3>
            <p className="text-sm text-muted-foreground">Photo gallery with categories and upload</p>
            
            <div className="grid gap-6">
              <PhotosCard
                photos={[
                  {
                    id: "1",
                    url: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=300&h=300&fit=crop",
                    filename: "before-repair.jpg",
                    size: 1024000,
                    type: "image/jpeg",
                    uploaded_at: "2024-01-10T10:30:00Z",
                    uploaded_by: { name: "John Tech", id: "1" },
                    description: "Cracked screen before repair",
                    category: "before"
                  },
                  {
                    id: "2",
                    url: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=300&h=300&fit=crop",
                    filename: "during-repair.jpg",
                    size: 856000,
                    type: "image/jpeg",
                    uploaded_at: "2024-01-10T11:15:00Z",
                    uploaded_by: { name: "John Tech", id: "1" },
                    category: "progress"
                  },
                  {
                    id: "3",
                    url: "https://images.unsplash.com/photo-1555774698-0b77e0d5fac6?w=300&h=300&fit=crop",
                    filename: "after-repair.jpg",
                    size: 945000,
                    type: "image/jpeg",
                    uploaded_at: "2024-01-10T12:00:00Z",
                    uploaded_by: { name: "John Tech", id: "1" },
                    description: "Completed repair - screen replaced",
                    category: "after"
                  }
                ]}
                variant="default"
                layout="grid"
                showUpload
                showCategories
                onPhotoClick={(photo) => console.log("Photo clicked:", photo)}
                onPhotoUpload={(files) => console.log("Upload files:", files)}
              />

              <PhotosCard
                photos={[
                  {
                    id: "1",
                    url: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=300&h=300&fit=crop",
                    filename: "damaged-phone.jpg",
                    size: 1024000,
                    type: "image/jpeg",
                    uploaded_at: "2024-01-10T10:30:00Z",
                    uploaded_by: { name: "Sarah Tech", id: "2" },
                    category: "damage"
                  }
                ]}
                variant="compact"
              />
            </div>
          </div>

          {/* Notes Widget */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Notes & Comments Widget</h3>
            <p className="text-sm text-muted-foreground">Interactive note system with types and visibility</p>
            
            <div className="grid gap-6 lg:grid-cols-2">
              <NotesWidget
                notes={[
                  {
                    id: "1",
                    content: "Customer requested rush job - willing to pay extra for same-day service",
                    created_at: "2024-01-10T09:30:00Z",
                    author: { id: "1", name: "Sarah CS", role: "Customer Service" },
                    type: "note",
                    is_pinned: true
                  },
                  {
                    id: "2",
                    content: "⚠️ Device has water damage - recommend full diagnostic before proceeding",
                    created_at: "2024-01-10T10:15:00Z",
                    updated_at: "2024-01-10T10:20:00Z",
                    author: { id: "2", name: "Mike Tech", role: "Senior Technician" },
                    type: "warning",
                    is_internal: true
                  },
                  {
                    id: "3",
                    content: "Screen replacement completed successfully. All functions tested and working.",
                    created_at: "2024-01-10T14:30:00Z",
                    author: { id: "2", name: "Mike Tech", role: "Senior Technician" },
                    type: "milestone"
                  }
                ]}
                variant="elevated"
                showAddNote
                showInternalNotes
                currentUserId="1"
                onAddNote={(content, isInternal, type) => console.log("Add note:", { content, isInternal, type })}
                onEditNote={(noteId, content) => console.log("Edit note:", noteId, content)}
                onPinNote={(noteId) => console.log("Pin note:", noteId)}
              />

              <NotesWidget
                notes={[
                  {
                    id: "1",
                    content: "Customer will pick up after 5 PM",
                    created_at: "2024-01-10T11:00:00Z",
                    author: { id: "3", name: "Front Desk", role: "Reception" }
                  }
                ]}
                variant="compact"
                showAddNote={false}
              />
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Quick Actions - Visual Hierarchy</h3>
            <p className="text-sm text-muted-foreground">Different action layouts create clear interaction patterns</p>
            
            <div className="space-y-6">
              {/* Premium Glass - Modern floating actions */}
              <div>
                <h4 className="text-sm font-medium mb-3 text-muted-foreground">PREMIUM MODERN - Glass Effect</h4>
                <div className="max-w-lg">
                  <QuickActions
                    actions={[
                      {
                        id: "call",
                        label: "Call Customer",
                        icon: <Phone className="h-4 w-4" />,
                        description: "Priority customer contact",
                        color: "green",
                        onClick: () => console.log("Call customer")
                      },
                      {
                        id: "email",
                        label: "Send Email",
                        icon: <Mail className="h-4 w-4" />,
                        description: "Email notification",
                        color: "blue",
                        onClick: () => console.log("Send email")
                      },
                      {
                        id: "complete",
                        label: "Complete",
                        icon: <CheckCircle className="h-4 w-4" />,
                        description: "Mark as completed",
                        color: "green",
                        badge: "!",
                        onClick: () => console.log("Mark complete")
                      },
                      {
                        id: "settings",
                        label: "Settings",
                        icon: <Settings className="h-4 w-4" />,
                        description: "Configure options",
                        onClick: () => console.log("Open settings")
                      }
                    ]}
                    variant="glass"
                    title="Priority Actions"
                  />
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>
    </div>
    </PageContainer>
  );
}