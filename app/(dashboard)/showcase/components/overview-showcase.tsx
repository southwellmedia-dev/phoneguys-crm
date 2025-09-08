"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Clock, AlertCircle } from "lucide-react";

export function OverviewShowcase() {
  const stats = {
    completed: 18,
    inProgress: 0,
    pending: 36,
    total: 54,
    percentage: 33,
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-green-500/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completed}</div>
            <p className="text-xs text-muted-foreground">Ready to use</p>
          </CardContent>
        </Card>

        <Card className="border-yellow-500/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">In Progress</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inProgress}</div>
            <p className="text-xs text-muted-foreground">Currently building</p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Pending</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">To be developed</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Component Library Progress</CardTitle>
          <CardDescription>
            {stats.percentage}% Complete ({stats.completed} of {stats.total} components)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span>Overall Progress</span>
                <span className="font-medium">{stats.percentage}%</span>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-500"
                  style={{ width: `${stats.percentage}%` }}
                />
              </div>
            </div>

            <div className="grid gap-2 pt-4">
              <CategoryProgress category="Theme System" completed={3} total={3} />
              <CategoryProgress category="Buttons" completed={2} total={2} />
              <CategoryProgress category="Cards" completed={4} total={4} />
              <CategoryProgress category="Badges" completed={1} total={1} />
              <CategoryProgress category="Tables" completed={1} total={5} />
              <CategoryProgress category="Navigation" completed={2} total={4} />
              <CategoryProgress category="Feedback" completed={5} total={5} />
              <CategoryProgress category="Forms" completed={0} total={6} />
              <CategoryProgress category="Overlays" completed={0} total={4} />
              <CategoryProgress category="Utility" completed={0} total={4} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Design Philosophy</CardTitle>
          <CardDescription>
            Fintech-inspired flat design with strategic color usage
          </CardDescription>
        </CardHeader>
        <CardContent className="prose prose-sm dark:prose-invert max-w-none">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="text-sm font-semibold mb-2">Core Principles</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>Visual hierarchy through selective color use</li>
                <li>Clean borders over heavy shadows</li>
                <li>Consistent pill-style badges</li>
                <li>Professional, modern aesthetic</li>
                <li>Strategic use of brand colors</li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-2">Color Usage</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li><span className="text-primary">Primary (Cyan #0094CA)</span> - Main actions</li>
                <li><span className="text-red-500">Accent (Red #fb2c36)</span> - Alerts</li>
                <li><span className="text-green-500">Success</span> - Positive states</li>
                <li><span className="text-yellow-500">Warning</span> - Pending states</li>
                <li><span className="text-gray-500">Neutral</span> - Default states</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function CategoryProgress({ 
  category, 
  completed, 
  total 
}: { 
  category: string; 
  completed: number; 
  total: number;
}) {
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  
  return (
    <div className="flex items-center justify-between py-1">
      <div className="flex items-center gap-2">
        <span className="text-sm">{category}</span>
        <span className="text-xs text-muted-foreground">
          ({completed}/{total})
        </span>
      </div>
      <div className="flex items-center gap-2">
        <div className="h-1.5 w-24 bg-muted rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-500 ${
              percentage === 100 ? 'bg-green-500' : 
              percentage > 0 ? 'bg-primary' : 
              'bg-muted'
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className="text-xs font-medium w-10 text-right">
          {percentage}%
        </span>
      </div>
    </div>
  );
}