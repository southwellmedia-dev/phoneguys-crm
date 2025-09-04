import { Metadata } from "next";
import { Shield, Users, Smartphone, Wrench, Activity, TrendingUp } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Admin Dashboard",
  description: "Admin management dashboard",
};

export default function AdminDashboard() {
  const adminSections = [
    {
      title: "User Management",
      description: "Manage staff accounts, roles, and permissions",
      icon: Users,
      href: "/admin/users",
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-50 dark:bg-blue-950/20",
    },
    {
      title: "Device Database",
      description: "Manage device catalog and specifications",
      icon: Smartphone,
      href: "/admin/devices",
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-50 dark:bg-green-950/20",
    },
    {
      title: "Service Catalog",
      description: "Configure services, pricing, and categories",
      icon: Wrench,
      href: "/admin/services",
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-50 dark:bg-purple-950/20",
    },
  ];

  const quickStats = [
    { label: "Total Users", value: "12", trend: "+2 this month" },
    { label: "Active Devices", value: "847", trend: "+54 this week" },
    { label: "Services Offered", value: "15", trend: "3 new added" },
    { label: "System Health", value: "98%", trend: "All systems operational" },
  ];

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            Admin Dashboard
          </h2>
          <p className="text-muted-foreground mt-2">
            System administration and configuration
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {quickStats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <TrendingUp className="h-3 w-3" />
                {stat.trend}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Admin Sections */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {adminSections.map((section) => (
          <Link key={section.href} href={section.href}>
            <Card className="hover:shadow-lg transition-all cursor-pointer border-2 hover:border-primary/50">
              <CardHeader>
                <div className={`w-12 h-12 rounded-lg ${section.bgColor} flex items-center justify-center mb-4`}>
                  <section.icon className={`h-6 w-6 ${section.color}`} />
                </div>
                <CardTitle>{section.title}</CardTitle>
                <CardDescription>{section.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">
                  Click to manage →
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Admin Activity</CardTitle>
          <CardDescription>Latest system changes and updates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">New device added: iPhone 16 Pro</p>
                <p className="text-xs text-muted-foreground">2 hours ago</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">User role updated: John Doe → Manager</p>
                <p className="text-xs text-muted-foreground">5 hours ago</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">Service price updated: Screen Replacement</p>
                <p className="text-xs text-muted-foreground">1 day ago</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}