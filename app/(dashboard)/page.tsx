"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, ArrowRight } from "lucide-react";
import { DashboardClient } from "./dashboard-client";

// Temporary component to let users choose between old and new dashboard
export default function DashboardPage() {
  const router = useRouter();

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-4">Choose Your Dashboard Experience</h1>
          <p className="text-muted-foreground">
            We've created a new premium dashboard with real-time connected components
          </p>
        </div>

        {/* Options */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* New Premium Dashboard */}
          <div className="relative overflow-hidden rounded-xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-background p-6 hover:border-primary/40 transition-colors">
            <div className="absolute top-4 right-4">
              <Badge variant="solid" color="cyan" size="sm">
                <Sparkles className="h-3 w-3 mr-1" />
                NEW
              </Badge>
            </div>
            
            <div className="mb-6">
              <h2 className="text-xl font-bold mb-2">Premium Dashboard</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Modern layout with integrated header, real-time connected components, and premium design system
              </p>
              
              <ul className="text-sm space-y-1">
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                  Real-time data with business rule styling
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                  Role-based dashboard variants
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                  Integrated header with actions
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                  Premium visual hierarchy
                </li>
              </ul>
            </div>
            
            <Button 
              className="w-full" 
              variant="gradient"
              onClick={() => router.push('/premium-dashboard')}
            >
              Try Premium Dashboard
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>

          {/* Legacy Dashboard */}
          <div className="rounded-xl border bg-background p-6">
            <div className="mb-6">
              <h2 className="text-xl font-bold mb-2">Legacy Dashboard</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Current dashboard with existing header system and static components
              </p>
              
              <ul className="text-sm space-y-1">
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                  Familiar interface
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                  Existing header system
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                  Manual refresh required
                </li>
              </ul>
            </div>
            
            <Button 
              className="w-full" 
              variant="outline"
              onClick={() => window.location.href = '/legacy-dashboard'}
            >
              Use Legacy Dashboard
            </Button>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            The premium dashboard will eventually replace the legacy version
          </p>
        </div>
      </div>
    </div>
  );
}