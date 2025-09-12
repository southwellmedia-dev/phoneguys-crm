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
  Tool,
  PlayCircle,
  Zap,
  ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, formatDistanceToNow } from 'date-fns';

interface TicketStatCardsProps {
  actualMinutes: number;
  estimatedMinutes: number;
  serviceCount: number;
  services: any[];
  totalCost: number;
  createdAt: string;
  status: string;
  onStartTimer?: () => void;
  onCompleteTicket?: () => void;
  className?: string;
}

export function TicketStatCards({
  actualMinutes,
  estimatedMinutes,
  serviceCount,
  services = [],
  totalCost,
  createdAt,
  status,
  onStartTimer,
  onCompleteTicket,
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
    <div className={cn("grid gap-6", className)}>
      {/* Action Card - Full Width Like Sidebar */}
      <div className="lg:grid lg:grid-cols-3 lg:gap-6">
        
        {/* Next Action Card - Left Side (Sidebar Width) */}
        <div 
          className={cn(
            "rounded-lg p-6 transition-all duration-200 border-0 text-white",
            status === 'new' ? "bg-orange-500 hover:bg-orange-600" :
            status === 'in_progress' ? "bg-green-600 hover:bg-green-700" :
            status === 'completed' ? "bg-green-500" :
            "bg-gray-500"
          )}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                {status === 'new' ? (
                  <PlayCircle className="w-4 h-4 text-white/80" />
                ) : status === 'in_progress' ? (
                  <Zap className="w-4 h-4 text-white/80" />
                ) : status === 'completed' ? (
                  <CheckCircle2 className="w-4 h-4 text-white/80" />
                ) : (
                  <Calendar className="w-4 h-4 text-white/80" />
                )}
                <p className="text-sm font-medium text-white/80">
                  Next Action
                </p>
              </div>
              
              <div className="flex items-baseline gap-2 mb-3">
                <p className="text-xl font-bold text-white">
                  {status === 'new' ? 'Start Work' :
                   status === 'in_progress' ? 'Complete Ticket' :
                   status === 'completed' ? 'Completed' :
                   'Update Status'}
                </p>
              </div>

              <p className="text-sm text-white/80 mb-4">
                {status === 'new' ? 'Begin work by starting timer' :
                 status === 'in_progress' ? 'Finish and notify customer' :
                 status === 'completed' ? 'All work completed' :
                 'Update ticket status'}
              </p>

              {/* Action Button */}
              {status === 'new' && onStartTimer && (
                <button
                  onClick={onStartTimer}
                  className="bg-white/20 hover:bg-white/30 text-white px-4 py-2.5 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 text-sm border border-white/30 hover:border-white/40"
                >
                  <Timer className="w-4 h-4" />
                  Start Timer
                </button>
              )}

              {status === 'in_progress' && onCompleteTicket && (
                <button
                  onClick={onCompleteTicket}
                  className="bg-white/20 hover:bg-white/30 text-white px-4 py-2.5 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 text-sm border border-white/30 hover:border-white/40"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Complete Ticket
                </button>
              )}

              {status === 'completed' && (
                <div className="bg-white/20 text-white px-4 py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 text-sm border border-white/30">
                  <CheckCircle2 className="w-4 h-4" />
                  Task Completed
                </div>
              )}

              {!['new', 'in_progress', 'completed'].includes(status) && (
                <div className="bg-white/20 text-white px-4 py-2.5 rounded-lg font-medium text-center text-sm border border-white/30">
                  No actions available
                </div>
              )}
            </div>

            {/* Status Icon */}
            <div className="ml-4">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm border border-white/30">
                {status === 'new' ? (
                  <PlayCircle className="w-8 h-8 text-white" />
                ) : status === 'in_progress' ? (
                  <Zap className="w-8 h-8 text-white" />
                ) : status === 'completed' ? (
                  <CheckCircle2 className="w-8 h-8 text-white" />
                ) : (
                  <Calendar className="w-8 h-8 text-white" />
                )}
              </div>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-white/20">
            <p className="text-xs text-white/60">
              {ticketAge || 'Just created'}
            </p>
          </div>
        </div>

        {/* Right Side - Stats Cards Grid */}
        <div className="lg:col-span-2 grid gap-4 grid-cols-1 sm:grid-cols-3">
          
          {/* Time Progress Card - With circular progress */}
          <DetailMetricCard
            title="Time Tracked"
            value={formatMinutes(actualMinutes)}
            subtitle={estimatedMinutes > 0 ? `/ ${formatMinutes(estimatedMinutes)}` : undefined}
            description={timeStatus.label}
            icon={Clock}
            variant={timeStatus.variant}
            size="lg"
            className="h-full flex flex-col"
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
            description={estimatedMinutes > 0 ? `${formatMinutes(estimatedMinutes)} est.` : 'Add services'}
            icon={Wrench}
            variant={serviceCount > 0 ? "inverted-primary" : "default"}
            size="lg"
            className="h-full flex flex-col"
            extra={
              serviceCount > 0 ? (
                <MiniPieChart
                  data={serviceBreakdown.map((service, idx) => ({
                    value: service.price || 1,
                    color: serviceColors[idx % serviceColors.length],
                    label: service.name
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
            className="h-full flex flex-col"
            trend={totalCost > 500 ? 'up' : undefined}
            trendValue={totalCost > 500 ? 'High value' : undefined}
            extra={
              showCostChart ? (
                <div className="w-24">
                  <MiniBarChart 
                    data={serviceChartData}
                    height={60}
                    variant="default"
                    showLabels={false}
                    showValues={false}
                    animate
                  />
                </div>
              ) : totalCost > 0 ? (
                <div className="flex items-center justify-center w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/20">
                  <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
              ) : (
                <div className="flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800">
                  <DollarSign className="w-8 h-8 text-gray-400" />
                </div>
              )
            }
          />

        </div>
      </div>
    </div>
  );
}