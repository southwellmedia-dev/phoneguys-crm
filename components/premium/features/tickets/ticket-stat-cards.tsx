'use client';

import React from 'react';
import { DetailMetricCard } from '@/components/premium/ui/cards/detail-metric-card';
import { CircularProgress } from '@/components/premium/ui/charts/circular-progress';
import { MiniBarChart } from '@/components/premium/ui/charts/mini-bar-chart';
import { MiniPieChart } from '@/components/premium/ui/charts/mini-pie-chart';
import { colors } from '@/components/premium/themes/colors';
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
  
  // Define consistent colors for services
  const serviceColors = [
    colors.brand.cyan,      // #0094CA
    '#60A5FA',             // blue-400
    '#A78BFA',             // violet-400
    '#F59E0B',             // amber-500
    '#10B981'              // emerald-500
  ];

  // Calculate service breakdown for chart
  const serviceBreakdown = services.map((ticketService: any, index: number) => {
    // Handle nested service objects (ticket_services join table)
    // The structure matches ticket-details-tabs: ticket_services -> service (singular)
    const service = ticketService.service || ticketService.services;
    
    // Get the service name - same pattern as ticket-details-tabs component
    const serviceName = service?.name || ticketService.name || 'Unknown Service';
    
    // Get the price - priority: base_price from service, then fallback to ticket_service price
    const servicePrice = service?.base_price || ticketService.unit_price || ticketService.price || 0;
    
    return {
      name: serviceName,
      price: servicePrice,
      category: service?.category?.replace(/_/g, ' ') || 'General'
    };
  });

  // Prepare data for service breakdown chart - use same colors for both pie and bar
  const serviceChartData = serviceBreakdown
    .filter(s => s.price > 0) // Only show services with a price
    .slice(0, 5) // Show up to 5 services
    .map((service, idx) => ({
      label: service.name === 'Unknown Service' ? 'Service' : (service.name.split(' ')[0] || 'Service'), // First word of service name with fallback
      value: Number(service.price) || 0, // Ensure it's a number
      color: serviceColors[idx % serviceColors.length] // Use consistent colors
    }));
  
  // Show cost chart if we have services with prices
  const showCostChart = serviceChartData.length > 0 && totalCost > 0;
  
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
      
      {/* Services Card - With pie chart display */}
      <DetailMetricCard
        title="Services"
        value={serviceCount.toString()}
        subtitle={serviceCount === 1 ? 'service' : 'services'}
        description={estimatedMinutes > 0 ? `~${formatMinutes(estimatedMinutes)} total` : 'Add services'}
        icon={Wrench}
        variant={serviceCount > 0 ? "inverted-primary" : "default"}
        size="lg"
        extra={
          serviceCount > 0 ? (
            <MiniPieChart
              data={serviceBreakdown.map((service, idx) => ({
                value: service.price || 1, // Use price as value, default to 1 if no price
                color: serviceColors[idx % serviceColors.length],
                label: service.name // Full service name for tooltip
              }))}
              size={80}
              strokeWidth={2}
              animate
            />
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
        variant={totalCost > 0 ? "inverted-success" : "default"}
        size="lg"
        trend={totalCost > 500 ? 'up' : undefined}
        trendValue={totalCost > 500 ? 'High value' : undefined}
        extra={
          showCostChart ? (
            <div className="w-28 mt-2">
              <MiniBarChart 
                data={serviceChartData}
                height={65}
                variant="default"
                showLabels={false}
                showValues={false}
                animate
              />
            </div>
          ) : totalCost > 0 ? (
            <div className="flex items-center justify-center w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/20">
              <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-400" />
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
          priority === "high" ? "inverted-warning" : 
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