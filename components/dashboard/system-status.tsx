'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  CheckCircle, 
  AlertCircle, 
  XCircle, 
  Loader2,
  Wifi,
  Database,
  Mail,
  MessageSquare,
  Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';

interface ServiceStatus {
  name: string;
  status: 'operational' | 'degraded' | 'down' | 'unknown';
  message: string;
  responseTime?: number;
  lastChecked: string;
}

interface SystemStatusProps {
  className?: string;
}

export function SystemStatus({ className }: SystemStatusProps) {
  const { data: health, isLoading, error } = useQuery({
    queryKey: ['system-health'],
    queryFn: async () => {
      const response = await fetch('/api/health');
      if (!response.ok) throw new Error('Failed to fetch health status');
      return response.json();
    },
    staleTime: 30 * 1000, // Consider data stale after 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
    retry: 1 // Only retry once if it fails
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'operational':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'degraded':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case 'down':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Loader2 className="h-4 w-4 text-gray-400 animate-spin" />;
    }
  };

  const getServiceIcon = (serviceName: string) => {
    switch (serviceName) {
      case 'Database':
        return <Database className="h-4 w-4" />;
      case 'API':
        return <Wifi className="h-4 w-4" />;
      case 'Email Service':
        return <Mail className="h-4 w-4" />;
      case 'SMS Service':
        return <MessageSquare className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational':
        return 'text-green-600';
      case 'degraded':
        return 'text-yellow-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-gray-400';
    }
  };

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case 'operational':
        return 'from-green-500/10';
      case 'degraded':
        return 'from-yellow-500/10';
      case 'down':
        return 'from-red-500/10';
      default:
        return 'from-gray-500/10';
    }
  };

  const getOverallStatusText = () => {
    if (isLoading) return 'Checking Systems...';
    if (error) return 'Unable to Check Status';
    if (!health) return 'Unknown Status';
    
    switch (health.status) {
      case 'operational':
        return 'All Systems Operational';
      case 'degraded':
        return 'Degraded Performance';
      case 'partial_outage':
        return 'Partial Outage';
      default:
        return 'Unknown Status';
    }
  };

  const getOverallStatusColor = () => {
    if (isLoading || error || !health) return 'text-gray-600 bg-gray-100 dark:bg-gray-900/30';
    
    switch (health.status) {
      case 'operational':
        return 'text-green-600 bg-green-100 dark:bg-green-900/30';
      case 'degraded':
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30';
      case 'partial_outage':
        return 'text-red-600 bg-red-100 dark:bg-red-900/30';
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-900/30';
    }
  };

  const getPulseColor = () => {
    if (isLoading || error || !health) return 'bg-gray-500';
    
    switch (health.status) {
      case 'operational':
        return 'bg-green-500';
      case 'degraded':
        return 'bg-yellow-500';
      case 'partial_outage':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <Card className={cn("relative overflow-hidden", className)}>
      <div className="absolute inset-0 bg-gradient-mesh opacity-30" />
      <CardHeader className="relative pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="relative inline-flex h-3 w-3">
              <span className={cn(
                "absolute inline-flex h-full w-full rounded-full opacity-75",
                getPulseColor(),
                health?.status === 'operational' && 'animate-ping'
              )} />
              <span className={cn(
                "relative inline-flex h-3 w-3 rounded-full",
                getPulseColor()
              )} />
            </div>
            <CardTitle className="text-lg">System Status</CardTitle>
          </div>
          <span className={cn(
            "text-xs font-medium px-2 py-1 rounded-full",
            getOverallStatusColor()
          )}>
            {getOverallStatusText()}
          </span>
        </div>
      </CardHeader>
      <CardContent className="relative">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="text-center py-8 text-sm text-muted-foreground">
            Failed to load system status
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {health?.services?.map((service: ServiceStatus) => (
              <div
                key={service.name}
                className={cn(
                  "flex items-center space-x-3 p-3 rounded-lg bg-gradient-to-r to-transparent",
                  getStatusBgColor(service.status)
                )}
              >
                <div className={cn(
                  "p-2 rounded-lg",
                  service.status === 'operational' && "bg-green-500/20",
                  service.status === 'degraded' && "bg-yellow-500/20",
                  service.status === 'down' && "bg-red-500/20",
                  service.status === 'unknown' && "bg-gray-500/20"
                )}>
                  <div className={getStatusColor(service.status)}>
                    {getServiceIcon(service.name)}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{service.name}</p>
                    {getStatusIcon(service.status)}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {service.message}
                    {service.responseTime && service.responseTime > 0 ? 
                      ` (${service.responseTime}ms)` : ''
                    }
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Last checked timestamp */}
        {health?.timestamp && (
          <div className="mt-3 pt-3 border-t text-center">
            <p className="text-xs text-muted-foreground">
              Last checked: {new Date(health.timestamp).toLocaleTimeString()}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}