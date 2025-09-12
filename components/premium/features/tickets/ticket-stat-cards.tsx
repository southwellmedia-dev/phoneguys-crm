'use client';

import React from 'react';
import { DetailMetricCard } from '@/components/premium/ui/cards/detail-metric-card';
import { CircularProgress } from '@/components/premium/ui/charts/circular-progress';
import { MiniBarChart } from '@/components/premium/ui/charts/mini-bar-chart';
import { Pill, Pills } from '@/components/premium/ui/pills';
import { 
  Clock, 
  Wrench, 
  DollarSign, 
  Calendar,
  AlertCircle,
  Timer,
  TrendingUp,
  CheckCircle2,
  Package,
  Tool
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, formatDistanceToNow } from 'date-fns';

interface TicketStatCardsProps {
  actualMinutes: number;
  estimatedMinutes: number;
  serviceCount: number;
  services: any[];
  totalCost: number;
  priority: string;
  createdAt: string;
  status: string;
  className?: string;
}

export function TicketStatCards({
  actualMinutes,
  estimatedMinutes,
  serviceCount,
  services = [],
  totalCost,
  priority,
  createdAt,
  status,
  className
}: TicketStatCardsProps) {
  
  // Calculate time progress percentage
  const timeProgress = estimatedMinutes > 0 
    ? Math.min((actualMinutes / estimatedMinutes) * 100, 150) // Cap at 150% for visual
    : 0;
  
  // Format time display
  const formatMinutes = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };
  
  // Calculate service breakdown for chart
  const serviceBreakdown = services.map((ts: any) => {
    // Handle both ticket_services and direct services structure
    const service = ts.service || ts.services || ts;
    const serviceName = service?.name || service?.service_name || ts.name || 'Unknown Service';
    const servicePrice = service?.base_price || service?.price || ts.price || 0;
    
    return {
      name: serviceName,
      price: servicePrice,
      category: service?.category?.replace(/_/g, ' ') || 'General'
    };
  });

  // Prepare data for service breakdown chart - show actual services
  const serviceChartData = serviceBreakdown
    .filter(s => s.price > 0) // Only show services with a price
    .slice(0, 3)
    .map((service, idx) => ({
      label: service.name.split(' ')[0], // First word of service name
      value: Number(service.price) || 0, // Ensure it's a number
      color: ['#10b981', '#06b6d4', '#0891b2'][idx] // Green to cyan gradient
    }));
  
  // If we have multiple services with prices, show them; otherwise don't show chart
  const showCostChart = serviceChartData.length > 1 && totalCost > 0;
  
  // Calculate ticket age
  const ticketAge = createdAt ? formatDistanceToNow(new Date(createdAt), { addSuffix: true }) : '';
  
  // Determine time status
  const getTimeStatus = () => {
    if (timeProgress === 0) return { label: 'Not started', variant: 'ghost' as const };
    if (timeProgress <= 50) return { label: 'On track', variant: 'inverted-primary' as const };
    if (timeProgress <= 80) return { label: 'Good progress', variant: 'inverted-primary' as const };
    if (timeProgress <= 100) return { label: 'Near estimate', variant: 'inverted-dark' as const };
    return { label: 'Over estimate', variant: 'inverted-accent' as const };
  };

  const timeStatus = getTimeStatus();
  
  return (
    <div className={cn("grid gap-4 grid-cols-2 lg:grid-cols-4", className)}>
      
      {/* Time Progress Card - With circular progress */}
      <DetailMetricCard
        title="Time Tracked"
        value={formatMinutes(actualMinutes)}
        subtitle={estimatedMinutes > 0 ? `of ${formatMinutes(estimatedMinutes)}` : undefined}
        description={timeStatus.label}
        icon={Clock}
        variant={timeStatus.variant}
        size="lg"
        extra={
          estimatedMinutes > 0 ? (
            <CircularProgress 
              value={timeProgress}
              size="lg"
              variant={timeProgress > 100 ? "error" : timeProgress > 80 ? "warning" : "success"}
              showValue
              animate
            />
          ) : (
            <div className="flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800">
              <Timer className="w-8 h-8 text-gray-400" />
            </div>
          )
        }
      />
      
      {/* Services Card - With pills display */}
      <DetailMetricCard
        title="Services"
        value={serviceCount.toString()}
        subtitle={serviceCount === 1 ? 'service' : 'services'}
        description={estimatedMinutes > 0 ? `~${formatMinutes(estimatedMinutes)} total` : 'Add services'}
        icon={Wrench}
        variant={serviceCount > 0 ? "inverted-dark" : "ghost"}
        size="lg"
        extra={
          serviceCount > 0 ? (
            <div className="flex flex-col gap-1 max-w-[120px]">
              {serviceBreakdown.slice(0, 2).map((service, idx) => (
                <Pill 
                  key={idx} 
                  text={service.name.split(' ').slice(0, 2).join(' ')}
                  variant="soft"
                  size="xs"
                />
              ))}
              {serviceBreakdown.length > 2 && (
                <span className="text-xs text-white/60">
                  +{serviceBreakdown.length - 2} more
                </span>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800">
              <Package className="w-8 h-8 text-gray-400" />
            </div>
          )
        }
      />
      
      {/* Total Cost Card - With service breakdown chart if multiple services */}
      <DetailMetricCard
        title="Total Cost"
        value={`$${totalCost.toFixed(2)}`}
        subtitle={status === 'completed' ? 'Ready to invoice' : undefined}
        description={serviceCount > 0 ? `${serviceCount} service${serviceCount !== 1 ? 's' : ''}` : 'No charges yet'}
        icon={DollarSign}
        variant={totalCost > 0 ? "inverted-success" : "ghost"}
        size="lg"
        trend={totalCost > 500 ? 'up' : undefined}
        trendValue={totalCost > 500 ? 'High value' : undefined}
        extra={
          showCostChart ? (
            <div className="w-20">
              <MiniBarChart 
                data={serviceChartData}
                height={50}
                variant="default"
                showLabels={false}
                animate
              />
              <div className="flex justify-around mt-1">
                {serviceChartData.map((service, idx) => (
                  <span key={idx} className="text-[9px] text-white/60">
                    ${service.value.toFixed(0)}
                  </span>
                ))}
              </div>
            </div>
          ) : totalCost > 0 ? (
            <div className="flex items-center justify-center w-20 h-20 rounded-full bg-green-500/20">
              <CheckCircle2 className="w-10 h-10 text-white" />
            </div>
          ) : (
            <div className="flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800">
              <DollarSign className="w-8 h-8 text-gray-400" />
            </div>
          )
        }
      />
      
      {/* Priority & Created Card */}
      <DetailMetricCard
        title="Priority"
        value={priority?.charAt(0).toUpperCase() + priority?.slice(1) || 'Normal'}
        subtitle={ticketAge || 'Just created'}
        description={createdAt ? format(new Date(createdAt), 'MMM d, h:mm a') : undefined}
        icon={priority === "urgent" || priority === "high" ? AlertCircle : Calendar}
        variant={
          priority === "urgent" ? "inverted-accent" : 
          priority === "high" ? "inverted-primary" : 
          "default"
        }
        size="lg"
        extra={
          priority === "urgent" || priority === "high" ? (
            <div className="flex items-center justify-center w-20 h-20">
              <AlertCircle className={cn(
                "w-12 h-12",
                priority === "urgent" ? "text-white animate-pulse" : "text-white/80"
              )} />
            </div>
          ) : (
            <div className="flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800">
              <Calendar className="w-8 h-8 text-gray-400" />
            </div>
          )
        }
      />
      
    </div>
  );
}