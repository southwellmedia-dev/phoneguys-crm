"use client";

import { PhoneDetailCard, PhoneDetailCardProps } from "@/components/premium/repair/phone-detail-card";
import { useTicket } from "@/lib/hooks/use-tickets";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";

interface ConnectedPhoneDetailCardProps extends Omit<PhoneDetailCardProps, 'device' | 'issues' | 'warranty'> {
  ticketId: string;
  className?: string;
}

// Transform ticket data to device format
const transformTicketToDevice = (ticket: any) => {
  if (!ticket) return null;

  return {
    brand: ticket.device?.manufacturer?.name || ticket.device_brand || "Unknown",
    model: ticket.device?.model_name || ticket.device_model || "Unknown Model", 
    color: ticket.device?.color || ticket.device_color,
    storage: ticket.device?.storage || ticket.device_storage,
    imei: ticket.device?.imei || ticket.imei,
    condition: ticket.device?.condition || "fair",
    image: ticket.device?.image_url
  };
};

// Extract repair issues from ticket
const extractRepairIssues = (ticket: any): string[] => {
  if (!ticket) return [];
  
  // Check multiple possible sources for repair issues
  if (Array.isArray(ticket.repair_issues)) {
    return ticket.repair_issues;
  }
  
  if (typeof ticket.repair_issues === 'string') {
    // If it's a string, try to split by common delimiters
    return ticket.repair_issues.split(/[,;|]/).map((issue: string) => issue.trim()).filter(Boolean);
  }
  
  if (ticket.issue_description) {
    return [ticket.issue_description];
  }
  
  if (ticket.problem_description) {
    return [ticket.problem_description];
  }
  
  return [];
};

// Extract warranty information
const extractWarrantyInfo = (ticket: any) => {
  if (!ticket) return undefined;
  
  // Check device warranty
  if (ticket.device?.warranty_status) {
    return {
      status: ticket.device.warranty_status,
      expiresAt: ticket.device.warranty_expires_at 
        ? new Date(ticket.device.warranty_expires_at).toLocaleDateString()
        : undefined
    };
  }
  
  // Check ticket-level warranty
  if (ticket.warranty_status) {
    return {
      status: ticket.warranty_status,
      expiresAt: ticket.warranty_expires_at 
        ? new Date(ticket.warranty_expires_at).toLocaleDateString()
        : undefined
    };
  }
  
  // Default to no warranty if not specified
  return {
    status: "none" as const
  };
};

// Loading skeleton component
function PhoneDetailSkeleton({ className }: { className?: string }) {
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <Skeleton className="h-16 w-16 rounded-xl" />
            <div>
              <Skeleton className="h-7 w-48 mb-2" />
              <div className="flex gap-2">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-5 w-12" />
              </div>
            </div>
          </div>
          <Skeleton className="h-6 w-24" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <div>
          <Skeleton className="h-4 w-32 mb-2" />
          <div className="grid grid-cols-2 gap-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
          </div>
        </div>
        <div className="flex gap-2 pt-2">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-32" />
        </div>
      </CardContent>
    </Card>
  );
}

// Error state component
function PhoneDetailError({ className, error }: { className?: string; error: string }) {
  return (
    <Card className={className}>
      <CardContent className="flex items-center justify-center p-8 text-center">
        <div className="space-y-2">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto" />
          <CardTitle className="text-lg">Failed to Load Device</CardTitle>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export function ConnectedPhoneDetailCard({ 
  ticketId, 
  className 
}: ConnectedPhoneDetailCardProps) {
  const { data: ticket, isLoading, error } = useTicket(ticketId);
  
  if (isLoading) {
    return <PhoneDetailSkeleton className={className} />;
  }
  
  if (error) {
    return (
      <PhoneDetailError 
        className={className} 
        error="Unable to load ticket data. Please try again."
      />
    );
  }
  
  if (!ticket) {
    return (
      <PhoneDetailError 
        className={className} 
        error="Ticket not found."
      />
    );
  }
  
  const device = transformTicketToDevice(ticket);
  const issues = extractRepairIssues(ticket);
  const warranty = extractWarrantyInfo(ticket);
  
  if (!device) {
    return (
      <PhoneDetailError 
        className={className} 
        error="Device information not available."
      />
    );
  }
  
  return (
    <PhoneDetailCard
      device={device}
      issues={issues}
      warranty={warranty}
      className={className}
    />
  );
}