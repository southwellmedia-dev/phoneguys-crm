'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { StatusBadge } from '@/components/premium/ui/badges/status-badge';
import { CheckboxPremium } from '@/components/premium/ui/forms/checkbox-premium';
import { cn } from '@/lib/utils';
import { 
  Wrench,
  DollarSign,
  Clock,
  Zap,
  Shield,
  Smartphone,
  Battery,
  Wifi,
  Camera,
  Volume2,
  TrendingUp
} from 'lucide-react';

export interface Service {
  id: string;
  name: string;
  category: string;
  base_price: number;
  estimated_duration_minutes: number;
  description?: string;
}

export interface ServiceSelectorCardProps {
  /** Available services */
  services: Service[];
  /** Selected service IDs */
  selectedServices: string[];
  /** Whether in edit mode */
  isEditing?: boolean;
  /** Whether the form is locked */
  isLocked?: boolean;
  /** Callback for service selection change */
  onServiceToggle?: (serviceId: string) => void;
  /** Custom className */
  className?: string;
}

// Category icons mapping
const categoryIcons: Record<string, React.ElementType> = {
  'screen_repair': Smartphone,
  'battery': Battery,
  'connectivity': Wifi,
  'camera': Camera,
  'audio': Volume2,
  'performance': Zap,
  'protection': Shield,
  'other': Wrench
};

// Category colors
const categoryColors: Record<string, string> = {
  'screen_repair': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  'battery': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  'connectivity': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  'camera': 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
  'audio': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  'performance': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  'protection': 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  'other': 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'
};

export const ServiceSelectorCard = React.forwardRef<HTMLDivElement, ServiceSelectorCardProps>(
  ({ 
    services,
    selectedServices,
    isEditing = false,
    isLocked = false,
    onServiceToggle,
    className
  }, ref) => {
    // Group services by category
    const groupedServices = React.useMemo(() => {
      const groups: Record<string, Service[]> = {};
      services.forEach(service => {
        const category = service.category || 'other';
        if (!groups[category]) {
          groups[category] = [];
        }
        groups[category].push(service);
      });
      return groups;
    }, [services]);

    // Calculate total cost and duration
    const totals = React.useMemo(() => {
      const selected = services.filter(s => selectedServices.includes(s.id));
      const cost = selected.reduce((sum, s) => sum + s.base_price, 0);
      const duration = selected.reduce((sum, s) => sum + s.estimated_duration_minutes, 0);
      return { cost, duration };
    }, [services, selectedServices]);

    const formatDuration = (minutes: number) => {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      if (hours > 0) {
        return `${hours}h ${mins > 0 ? `${mins}m` : ''}`;
      }
      return `${mins}m`;
    };

    const formatCategoryName = (category: string) => {
      return category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    };

    return (
      <Card ref={ref} className={cn("rounded-lg border bg-card", className)}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Wrench className="h-4 w-4 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">Required Services</CardTitle>
                <CardDescription className="text-xs">
                  {isEditing ? "Select all services needed for this repair" : "Services identified for this repair"}
                </CardDescription>
              </div>
            </div>
            
            {isEditing && (
              <StatusBadge 
                type="general" 
                status="active" 
                variant="soft"
                className="text-xs"
              >
                Editable
              </StatusBadge>
            )}
          </div>
        </CardHeader>

        <CardContent className="relative space-y-4">
          {/* Service Categories */}
          {Object.entries(groupedServices).map(([category, categoryServices]) => {
            const CategoryIcon = categoryIcons[category] || Wrench;
            const hasSelected = categoryServices.some(s => selectedServices.includes(s.id));
            
            return (
              <div key={category} className="space-y-2">
                {/* Category Header */}
                <div className="flex items-center gap-2 mb-2">
                  <div className={cn(
                    "px-2 py-1 rounded-lg flex items-center gap-1.5",
                    categoryColors[category]
                  )}>
                    <CategoryIcon className="h-3.5 w-3.5" />
                    <span className="text-xs font-medium">
                      {formatCategoryName(category)}
                    </span>
                  </div>
                  {hasSelected && (
                    <StatusBadge
                      type="general"
                      status="info"
                      variant="soft"
                      className="text-xs"
                    >
                      {categoryServices.filter(s => selectedServices.includes(s.id)).length} selected
                    </StatusBadge>
                  )}
                </div>

                {/* Services in Category */}
                <div className="space-y-2 pl-2">
                  {categoryServices.map(service => {
                    const isSelected = selectedServices.includes(service.id);
                    
                    return (
                      <div
                        key={service.id}
                        className={cn(
                          "flex items-center justify-between p-3 rounded-lg border transition-all",
                          isSelected && "bg-primary/5 border-primary/20",
                          !isSelected && "hover:bg-muted/50",
                          (isEditing && !isLocked) && "cursor-pointer"
                        )}
                        onClick={() => {
                          if (isEditing && !isLocked && onServiceToggle) {
                            onServiceToggle(service.id);
                          }
                        }}
                      >
                        <div className="flex items-center gap-3">
                          {isEditing && !isLocked && (
                            <CheckboxPremium
                              checked={isSelected}
                              onChange={() => onServiceToggle?.(service.id)}
                              onClick={(e) => e.stopPropagation()}
                              variant="primary"
                              size="sm"
                            />
                          )}
                          
                          <div>
                            <p className={cn(
                              "font-medium text-sm",
                              isSelected && "text-primary"
                            )}>
                              {service.name}
                            </p>
                            {service.description && (
                              <p className="text-xs text-muted-foreground">
                                {service.description}
                              </p>
                            )}
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {service.estimated_duration_minutes} min
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <p className={cn(
                            "font-semibold text-sm",
                            isSelected && "text-primary"
                          )}>
                            ${service.base_price.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* No services selected */}
          {selectedServices.length === 0 && !isEditing && (
            <div className="text-center py-8 text-muted-foreground">
              <Wrench className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p>No services selected yet</p>
            </div>
          )}

          {/* Total Summary */}
          {selectedServices.length > 0 && (
            <div className="pt-4 border-t">
              <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    <span className="font-medium">Summary</span>
                  </div>
                  <StatusBadge
                    type="general"
                    status="success"
                    variant="soft"
                    className="text-xs"
                  >
                    {selectedServices.length} service{selectedServices.length !== 1 ? 's' : ''}
                  </StatusBadge>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Estimated Time</p>
                    <p className="text-base font-semibold flex items-center gap-1">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      {formatDuration(totals.duration)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Total Cost</p>
                    <p className="text-lg font-bold text-primary flex items-center gap-1">
                      <DollarSign className="h-5 w-5" />
                      {totals.cost.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }
);

ServiceSelectorCard.displayName = 'ServiceSelectorCard';