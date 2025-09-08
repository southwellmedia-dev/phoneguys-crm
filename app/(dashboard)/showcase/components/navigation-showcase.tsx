"use client";

import { useState } from "react";
import { TabNav } from "@/components/premium/ui/navigation/tab-nav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Home, 
  Users, 
  Settings, 
  FileText,
  BarChart,
  Package,
  Calendar,
  Bell
} from "lucide-react";

export function NavigationShowcase() {
  const [underlineTab, setUnderlineTab] = useState("home");
  const [enclosedTab, setEnclosedTab] = useState("users");
  const [iconTab, setIconTab] = useState("dashboard");
  const [countTab, setCountTab] = useState("notifications");
  const [contrastTab, setContrastTab] = useState("orders");

  const basicTabs = [
    { id: "home", label: "Home" },
    { id: "users", label: "Users" },
    { id: "settings", label: "Settings" },
    { id: "reports", label: "Reports" },
  ];

  const iconTabs = [
    { id: "dashboard", label: "Dashboard", icon: <Home className="h-4 w-4" /> },
    { id: "orders", label: "Orders", icon: <Package className="h-4 w-4" /> },
    { id: "customers", label: "Customers", icon: <Users className="h-4 w-4" /> },
    { id: "analytics", label: "Analytics", icon: <BarChart className="h-4 w-4" /> },
  ];

  const countTabs = [
    { id: "notifications", label: "Notifications", icon: <Bell className="h-4 w-4" />, count: 5 },
    { id: "appointments", label: "Appointments", icon: <Calendar className="h-4 w-4" />, count: 12 },
    { id: "tickets", label: "Tickets", icon: <FileText className="h-4 w-4" />, count: 23 },
    { id: "settings", label: "Settings", icon: <Settings className="h-4 w-4" /> },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Tab Navigation - Underline Variant</CardTitle>
          <CardDescription>
            Clean underline style for primary navigation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <TabNav
            tabs={basicTabs}
            activeTab={underlineTab}
            onTabChange={setUnderlineTab}
            variant="underline"
          />
          <div className="p-4 border rounded-lg">
            <p className="text-sm text-muted-foreground">
              Selected tab: <span className="font-medium">{underlineTab}</span>
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tab Navigation - Enclosed Variant</CardTitle>
          <CardDescription>
            Enclosed tabs with background for secondary navigation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <TabNav
            tabs={basicTabs}
            activeTab={enclosedTab}
            onTabChange={setEnclosedTab}
            variant="enclosed"
          />
          <div className="p-4 border rounded-lg">
            <p className="text-sm text-muted-foreground">
              Selected tab: <span className="font-medium">{enclosedTab}</span>
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tabs with Icons</CardTitle>
          <CardDescription>
            Navigation tabs with icon support
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <TabNav
            tabs={iconTabs}
            activeTab={iconTab}
            onTabChange={setIconTab}
            variant="underline"
          />
          <div className="p-4 border rounded-lg">
            <p className="text-sm text-muted-foreground">
              Selected tab: <span className="font-medium">{iconTab}</span>
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tabs with Counts</CardTitle>
          <CardDescription>
            Navigation tabs with count badges
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <TabNav
            tabs={countTabs}
            activeTab={countTab}
            onTabChange={setCountTab}
            variant="enclosed"
          />
          <div className="p-4 border rounded-lg">
            <p className="text-sm text-muted-foreground">
              Selected tab: <span className="font-medium">{countTab}</span>
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contrast Variant - Light Blue Background</CardTitle>
          <CardDescription>
            High contrast tabs designed for colored backgrounds
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Light blue background demo */}
          <div className="p-6 bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-950/30 dark:to-blue-950/30 rounded-lg border">
            <TabNav
              tabs={iconTabs}
              activeTab={contrastTab}
              onTabChange={setContrastTab}
              variant="contrast"
            />
          </div>
          <div className="p-4 border rounded-lg">
            <p className="text-sm text-muted-foreground">
              Selected tab: <span className="font-medium">{contrastTab}</span>
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Responsive Behavior</CardTitle>
          <CardDescription>
            Tab navigation adapts to different screen sizes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm mb-2 font-medium">Mobile View</p>
              <div className="max-w-sm">
                <TabNav
                  tabs={iconTabs.slice(0, 3)}
                  activeTab="dashboard"
                  onTabChange={() => {}}
                  variant="underline"
                />
              </div>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm mb-2 font-medium">Tablet View</p>
              <div className="max-w-md">
                <TabNav
                  tabs={iconTabs}
                  activeTab="dashboard"
                  onTabChange={() => {}}
                  variant="underline"
                />
              </div>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm mb-2 font-medium">Desktop View</p>
              <TabNav
                tabs={countTabs}
                activeTab="notifications"
                onTabChange={() => {}}
                variant="enclosed"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Navigation Features</CardTitle>
          <CardDescription>
            Key features of the tab navigation component
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="text-sm font-semibold mb-2">Current Features</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>✓ Multiple variants: underline, enclosed, contrast</li>
                <li>✓ Icon support with proper spacing</li>
                <li>✓ Count badges for notifications</li>
                <li>✓ Smooth transitions and hover effects</li>
                <li>✓ Contrast variant for colored backgrounds</li>
                <li>✓ Keyboard navigation support</li>
                <li>✓ Responsive design</li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-2">Planned Components</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Breadcrumb navigation</li>
                <li>• Stepper component</li>
                <li>• Pagination controls</li>
                <li>• Side navigation drawer</li>
                <li>• Command palette</li>
                <li>• Search with filters</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}