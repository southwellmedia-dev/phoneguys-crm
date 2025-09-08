"use client";

import { StatusBadge } from "@/components/premium/ui/badges/status-badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  CheckCircle, 
  Clock, 
  AlertCircle,
  XCircle,
  Info,
  Pause,
  PlayCircle
} from "lucide-react";

export function BadgeShowcase() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>General Status Badges</CardTitle>
          <CardDescription>
            Common status indicators with pill design
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <StatusBadge status="active" variant="soft" />
            <StatusBadge status="success" variant="soft" />
            <StatusBadge status="warning" variant="soft" />
            <StatusBadge status="error" variant="soft" />
            <StatusBadge status="info" variant="soft" />
            <StatusBadge status="pending" variant="soft" />
            <StatusBadge status="inactive" variant="soft" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Repair Ticket Statuses</CardTitle>
          <CardDescription>
            Status badges for repair ticket workflow
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <StatusBadge status="new" variant="soft" />
            <StatusBadge status="inProgress" variant="soft" />
            <StatusBadge status="onHold" variant="soft" />
            <StatusBadge status="completed" variant="soft" />
            <StatusBadge status="cancelled" variant="soft" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Appointment Statuses</CardTitle>
          <CardDescription>
            Status badges for appointment management
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <StatusBadge status="scheduled" variant="soft" />
            <StatusBadge status="confirmed" variant="soft" />
            <StatusBadge status="arrived" variant="soft" />
            <StatusBadge status="no_show" variant="soft" />
            <StatusBadge status="converted" variant="soft" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Badge Variants</CardTitle>
          <CardDescription>
            Different visual styles for badges
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-2">Soft Variant (Default)</p>
            <div className="flex flex-wrap gap-2">
              <StatusBadge status="active" variant="soft" />
              <StatusBadge status="warning" variant="soft" />
              <StatusBadge status="error" variant="soft" />
            </div>
          </div>

          <div>
            <p className="text-sm text-muted-foreground mb-2">Solid Variant</p>
            <div className="flex flex-wrap gap-2">
              <StatusBadge status="active" variant="solid" />
              <StatusBadge status="warning" variant="solid" />
              <StatusBadge status="error" variant="solid" />
            </div>
          </div>

          <div>
            <p className="text-sm text-muted-foreground mb-2">Default Variant (Bordered)</p>
            <div className="flex flex-wrap gap-2">
              <StatusBadge status="active" variant="default" />
              <StatusBadge status="warning" variant="default" />
              <StatusBadge status="error" variant="default" />
            </div>
          </div>

          <div>
            <p className="text-sm text-muted-foreground mb-2">Gradient Variant</p>
            <div className="flex flex-wrap gap-2">
              <StatusBadge status="active" variant="gradient" />
              <StatusBadge status="warning" variant="gradient" />
              <StatusBadge status="error" variant="gradient" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Badge Features</CardTitle>
          <CardDescription>
            Additional badge features and options
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-2">With Pulse Animation</p>
            <div className="flex flex-wrap gap-2">
              <StatusBadge status="active" variant="soft" pulse />
              <StatusBadge status="warning" variant="soft" pulse />
              <StatusBadge status="error" variant="soft" pulse />
            </div>
          </div>

          <div>
            <p className="text-sm text-muted-foreground mb-2">With Icons</p>
            <div className="flex flex-wrap gap-2">
              <StatusBadge status="active" variant="soft" icon={<CheckCircle />} />
              <StatusBadge status="pending" variant="soft" icon={<Clock />} />
              <StatusBadge status="error" variant="soft" icon={<XCircle />} />
            </div>
          </div>

          <div>
            <p className="text-sm text-muted-foreground mb-2">Custom Labels</p>
            <div className="flex flex-wrap gap-2">
              <StatusBadge status="active" variant="soft" label="Online Now" />
              <StatusBadge status="warning" variant="soft" label="Requires Attention" />
              <StatusBadge status="info" variant="soft" label="New Feature" />
            </div>
          </div>

          <div>
            <p className="text-sm text-muted-foreground mb-2">Size Variations</p>
            <div className="flex items-center gap-2">
              <StatusBadge status="active" variant="soft" size="xs" />
              <StatusBadge status="active" variant="soft" size="sm" />
              <StatusBadge status="active" variant="soft" size="md" />
              <StatusBadge status="active" variant="soft" size="lg" />
            </div>
          </div>

          <div>
            <p className="text-sm text-muted-foreground mb-2">Combined Features</p>
            <div className="flex flex-wrap gap-2">
              <StatusBadge 
                status="active" 
                variant="gradient" 
                icon={<PlayCircle />} 
                pulse 
                size="lg"
              />
              <StatusBadge 
                status="warning" 
                variant="solid" 
                icon={<AlertCircle />} 
                label="Action Required"
                size="lg"
              />
              <StatusBadge 
                status="pending" 
                variant="soft" 
                icon={<Pause />} 
                pulse
                label="Processing..."
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}