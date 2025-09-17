'use client';

import React, { useState } from 'react';
import { CardPremium } from '@/components/premium/ui/cards/card-premium';
import { TabNav } from '@/components/premium/ui/navigation/tab-nav';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { 
  Wrench, 
  User, 
  Camera,
  DollarSign,
  Clock,
  Package2,
  AlertCircle,
  Plus,
  Edit,
  Trash2,
  ChevronRight,
  Calendar,
  Mail,
  Award,
  Target,
  TrendingUp,
  Image as ImageIcon,
  Upload,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDuration } from '@/lib/utils';
import Image from 'next/image';
import { TicketPhotosSidebar } from '@/components/orders/ticket-photos-sidebar';

interface Service {
  id: string;
  name: string;
  category: string;
  price: number;
  duration: number;
}

interface Technician {
  id: string;
  name: string;
  email: string;
  role: string;
  stats?: {
    totalTickets?: number;
    completedToday?: number;
    avgDuration?: number;
    satisfactionRate?: number;
  };
}

interface TicketDetailsTabsPremiumProps {
  services: any[];
  totalCost: number;
  estimatedMinutes: number;
  assignedTo?: string | null;
  technicians: Technician[];
  ticketId: string;
  isAdmin?: boolean;
  isLocked?: boolean;
  onAssignmentChange?: (techId: string | null) => void;
  onServiceAdd?: () => void;
  onServiceRemove?: (serviceId: string) => void;
  className?: string;
}

export function TicketDetailsTabsPremium({
  services = [],
  totalCost = 0,
  estimatedMinutes = 0,
  assignedTo,
  technicians = [],
  ticketId,
  isAdmin = false,
  isLocked = false,
  onAssignmentChange,
  onServiceAdd,
  onServiceRemove,
  className
}: TicketDetailsTabsPremiumProps) {
  
  const [activeTab, setActiveTab] = useState('services');
  
  // Find assigned technician
  const assignedTech = technicians.find(t => t.id === assignedTo);
  
  // Get technician initials
  const getInitials = (name?: string) => {
    if (!name) return 'T';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };
  
  // Calculate service stats
  const serviceStats = {
    totalServices: services.length,
    totalCost: services.reduce((sum, ts) => {
      const service = ts.service || ts.services;
      const price = service?.base_price || ts.price || 0;
      return sum + price;
    }, 0),
    totalDuration: services.reduce((sum, ts) => {
      const service = ts.service || ts.services;
      return sum + (service?.estimated_duration_minutes || ts.duration_minutes || 0);
    }, 0)
  };

  // Prepare tabs for TabNav
  const tabs = [
    {
      id: 'services',
      label: 'Services',
      icon: <Wrench className="h-3 w-3" />,
      count: services.length || undefined
    },
    {
      id: 'assignment',
      label: 'Assignment',
      icon: <User className="h-3 w-3" />,
      count: assignedTo ? 1 : undefined
    },
    {
      id: 'photos',
      label: 'Photos',
      icon: <Camera className="h-3 w-3" />
    }
  ];
  
  return (
    <CardPremium
      title="Ticket Details"
      icon={<Package2 />}
      variant="bordered"
      padding="none"
      className={className}
      action={
        <div className="flex items-center gap-2">
          {services.length > 0 && (
            <Badge variant="outline" className="text-xs">
              ${totalCost.toFixed(2)}
            </Badge>
          )}
          {assignedTo && (
            <Badge variant="secondary" className="text-xs">
              Assigned
            </Badge>
          )}
        </div>
      }
    >
      {/* Premium Tab Navigation */}
      <div className="px-6 pb-4">
        <TabNav
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          variant="underline"
          size="sm"
          className="w-full"
        />
      </div>

      {/* Tab Content */}
      <div className="px-6 pb-6">
        {/* Services Tab */}
        {activeTab === 'services' && (
          <div className="space-y-4">
            {/* Service Summary Stats */}
            <div className="grid grid-cols-3 gap-4 pb-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total Services</p>
                <p className="text-xl font-semibold">{serviceStats.totalServices}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total Cost</p>
                <p className="text-xl font-semibold text-green-600 dark:text-green-400">
                  ${serviceStats.totalCost.toFixed(2)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Est. Duration</p>
                <p className="text-xl font-semibold">{formatDuration(serviceStats.totalDuration)}</p>
              </div>
            </div>
            
            <Separator />
            
            {/* Services List */}
            <div className="space-y-2">
              {services.length > 0 ? (
                services.map((ticketService: any, index: number) => {
                  const service = ticketService.service || ticketService.services;
                  const serviceName = service?.name || ticketService.name || 'Unknown Service';
                  const servicePrice = service?.base_price || ticketService.price || 0;
                  const serviceDuration = service?.estimated_duration_minutes || ticketService.duration_minutes || 0;
                  const serviceCategory = service?.category?.replace(/_/g, ' ') || 'General';
                  
                  return (
                    <div
                      key={ticketService.id || index}
                      className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                          <Wrench className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{serviceName}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {serviceCategory}
                            </Badge>
                            {serviceDuration > 0 && (
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatDuration(serviceDuration)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-semibold text-green-600 dark:text-green-400">
                          ${servicePrice.toFixed(2)}
                        </span>
                        {isAdmin && !isLocked && onServiceRemove && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onServiceRemove(ticketService.id)}
                            className="h-8 w-8 p-0"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8">
                  <Package2 className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">No services added yet</p>
                  {isAdmin && !isLocked && onServiceAdd && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onServiceAdd}
                      className="mt-4"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Service
                    </Button>
                  )}
                </div>
              )}
            </div>
            
            {/* Add Service Button */}
            {services.length > 0 && isAdmin && !isLocked && onServiceAdd && (
              <>
                <Separator />
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onServiceAdd}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Service
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
        
        {/* Assignment Tab */}
        {activeTab === 'assignment' && (
          <div className="space-y-4">
            {/* Current Assignment */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Assigned Technician</Label>
              
              {assignedTo ? (
                <div className="flex items-start justify-between p-4 rounded-lg border bg-card">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={`/placeholder.svg?height=40&width=40`} />
                      <AvatarFallback>{getInitials(assignedTech?.name)}</AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                      <p className="font-medium text-sm">{assignedTech?.name || 'Unknown'}</p>
                      <p className="text-xs text-muted-foreground">{assignedTech?.email}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">
                          {assignedTech?.role || 'Technician'}
                        </Badge>
                        {assignedTech?.stats?.completedToday && (
                          <span className="text-xs text-muted-foreground">
                            {assignedTech.stats.completedToday} completed today
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {isAdmin && !isLocked && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onAssignmentChange?.(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 rounded-lg border border-dashed">
                  <User className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">Not assigned to anyone</p>
                </div>
              )}
            </div>
            
            {/* Reassign Section */}
            {isAdmin && !isLocked && (
              <>
                <Separator />
                <div className="space-y-3">
                  <Label htmlFor="technician" className="text-sm font-medium">
                    {assignedTo ? 'Reassign to' : 'Assign to'}
                  </Label>
                  <Select
                    value={assignedTo || "unassigned"}
                    onValueChange={(value) => {
                      onAssignmentChange?.(value === "unassigned" ? null : value);
                    }}
                  >
                    <SelectTrigger id="technician">
                      <SelectValue placeholder="Select technician" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">
                        <span className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          Unassigned
                        </span>
                      </SelectItem>
                      {technicians.map((tech) => (
                        <SelectItem key={tech.id} value={tech.id}>
                          <span className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="text-xs">
                                {getInitials(tech.name)}
                              </AvatarFallback>
                            </Avatar>
                            {tech.name}
                            {tech.stats?.completedToday && (
                              <Badge variant="outline" className="ml-2 text-xs">
                                {tech.stats.completedToday} today
                              </Badge>
                            )}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Technician Performance Stats */}
                {assignedTech?.stats && (
                  <>
                    <Separator />
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium">Performance Metrics</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 rounded-lg bg-muted/50">
                          <div className="flex items-center gap-2">
                            <Target className="h-4 w-4 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">Total Tickets</span>
                          </div>
                          <p className="text-lg font-semibold mt-1">
                            {assignedTech.stats.totalTickets || 0}
                          </p>
                        </div>
                        <div className="p-3 rounded-lg bg-muted/50">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">Avg Duration</span>
                          </div>
                          <p className="text-lg font-semibold mt-1">
                            {formatDuration(assignedTech.stats.avgDuration || 0)}
                          </p>
                        </div>
                        <div className="p-3 rounded-lg bg-muted/50">
                          <div className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">Completed Today</span>
                          </div>
                          <p className="text-lg font-semibold mt-1">
                            {assignedTech.stats.completedToday || 0}
                          </p>
                        </div>
                        <div className="p-3 rounded-lg bg-muted/50">
                          <div className="flex items-center gap-2">
                            <Award className="h-4 w-4 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">Satisfaction</span>
                          </div>
                          <p className="text-lg font-semibold mt-1">
                            {assignedTech.stats.satisfactionRate || 0}%
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        )}
        
        {/* Photos Tab */}
        {activeTab === 'photos' && (
          <div className="-mx-6 -mb-6">
            <TicketPhotosSidebar ticketId={ticketId} embedded />
          </div>
        )}
      </div>
    </CardPremium>
  );
}