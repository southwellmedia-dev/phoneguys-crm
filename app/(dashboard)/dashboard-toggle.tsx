"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { NewDashboard } from "./new-dashboard";
import { DashboardClient } from "./dashboard-client";
import { RepairTicketRepository } from "@/lib/repositories/repair-ticket.repository";
import { CustomerRepository } from "@/lib/repositories/customer.repository";
import { RepairStatus } from "@/components/orders/status-badge";
import { Sparkles, RotateCcw } from "lucide-react";

interface DashboardToggleProps {
  initialMetrics?: any;
}

export function DashboardToggle({ initialMetrics }: DashboardToggleProps) {
  const [useNewDashboard, setUseNewDashboard] = useState(true);

  return (
    <div>
      {/* Toggle Control */}
      <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
        <Badge variant="soft" color={useNewDashboard ? "cyan" : "gray"}>
          {useNewDashboard ? "Premium Dashboard" : "Legacy Dashboard"}
        </Badge>
        <Button
          variant={useNewDashboard ? "gradient" : "outline"}
          size="sm"
          onClick={() => setUseNewDashboard(!useNewDashboard)}
          className="shadow-lg"
        >
          {useNewDashboard ? (
            <>
              <RotateCcw className="h-4 w-4 mr-2" />
              View Old
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Try New!
            </>
          )}
        </Button>
      </div>

      {/* Dashboard Content */}
      {useNewDashboard ? (
        <NewDashboard />
      ) : (
        initialMetrics && <DashboardClient metrics={initialMetrics} />
      )}
    </div>
  );
}