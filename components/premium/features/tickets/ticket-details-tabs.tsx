'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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

interface TicketDetailsTabsProps {
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

export function TicketDetailsTabs({
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
}: TicketDetailsTabsProps) {
  
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
  
  // Calculate service totals
  const serviceStats = {
    total: services.length,
    totalPrice: services.reduce((sum, ts) => {
      const service = ts.service || ts.services;
      return sum + (service?.base_price || ts.price || 0);
    }, 0),
    totalDuration: services.reduce((sum, ts) => {
      const service = ts.service || ts.services;
      return sum + (service?.estimated_duration_minutes || ts.duration_minutes || 0);
    }, 0)
  };
  
  return (
    <Card className={cn("overflow-hidden border border-gray-200 dark:border-gray-700", className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package2 className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-semibold">Ticket Details</CardTitle>
          </div>
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
        </div>
      </CardHeader>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 rounded-none border-t border-b">
          <TabsTrigger value="services" className="text-xs">
            <Wrench className="h-3 w-3 mr-1" />
            Services
            {services.length > 0 && (
              <Badge variant="secondary" className="ml-1.5 text-xs px-1 py-0">
                {services.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="assignment" className="text-xs">
            <User className="h-3 w-3 mr-1" />
            Assignment
            {assignedTo && (
              <div className="ml-1.5 h-2 w-2 bg-green-500 rounded-full" />
            )}
          </TabsTrigger>
          <TabsTrigger value="photos" className="text-xs">
            <Camera className="h-3 w-3 mr-1" />
            Photos
          </TabsTrigger>
        </TabsList>
        
        {/* Services Tab */}
        <TabsContent value="services" className="mt-0">
          <CardContent className="p-4">
            {services.length > 0 ? (
              <div className="space-y-3">
                {/* Service List */}
                <div className="space-y-2">
                  {services.map((ticketService: any) => {
                    const service = ticketService.service || ticketService.services;
                    const price = service?.base_price || ticketService.price || 0;
                    const duration = service?.estimated_duration_minutes || ticketService.duration_minutes || 0;
                    
                    return (
                      <div 
                        key={ticketService.id} 
                        className="group flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Package2 className="h-4 w-4 text-muted-foreground" />
                            <p className="text-sm font-medium">{service?.name || 'Unknown Service'}</p>
                          </div>
                          <div className="flex items-center gap-3 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {service?.category?.replace(/_/g, ' ') || 'General'}
                            </Badge>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDuration(duration)}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="text-sm font-semibold">
                              ${price.toFixed(2)}
                            </p>
                          </div>
                          {onServiceRemove && !isLocked && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => onServiceRemove(ticketService.id)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7 p-0 text-red-600 hover:text-red-700"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {/* Totals */}
                <div className="pt-3 border-t space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">${serviceStats.totalPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Est. Duration</span>
                    <span className="font-medium">{formatDuration(serviceStats.totalDuration)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Total</span>
                    <span className="text-lg font-bold text-primary">
                      ${(totalCost || serviceStats.totalPrice).toFixed(2)}
                    </span>
                  </div>
                </div>
                
                {/* Add Service Button */}
                {onServiceAdd && !isLocked && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onServiceAdd}
                    className="w-full"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Service
                  </Button>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <Wrench className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground mb-3">No services added</p>
                {onServiceAdd && !isLocked && (
                  <Button
                    size="sm"
                    onClick={onServiceAdd}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Service
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </TabsContent>
        
        {/* Assignment Tab */}
        <TabsContent value="assignment" className="mt-0">
          <CardContent className="p-4">
            {isAdmin ? (
              <div className="space-y-4">
                {/* Assignment Selector */}
                <div className="space-y-2">
                  <Label htmlFor="technician" className="text-sm">Assigned Technician</Label>
                  <Select
                    value={assignedTo || 'unassigned'}
                    onValueChange={(value) => onAssignmentChange?.(value === 'unassigned' ? null : value)}
                    disabled={isLocked}
                  >
                    <SelectTrigger id="technician">
                      <SelectValue placeholder="Select technician" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-amber-600" />
                          <span>Unassigned</span>
                        </div>
                      </SelectItem>
                      {technicians.map((tech) => (
                        <SelectItem key={tech.id} value={tech.id}>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-5 w-5">
                              <AvatarImage src={`https://avatar.vercel.sh/${tech.email}.png`} />
                              <AvatarFallback className="text-xs">
                                {getInitials(tech.name)}
                              </AvatarFallback>
                            </Avatar>
                            <span>{tech.name}</span>
                            <Badge variant="outline" className="text-xs ml-auto">
                              {tech.role}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Assigned Tech Details */}
                {assignedTech ? (
                  <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={`https://avatar.vercel.sh/${assignedTech.email}.png`} />
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                          {getInitials(assignedTech.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium">{assignedTech.name}</p>
                        <p className="text-xs text-muted-foreground">{assignedTech.role}</p>
                      </div>
                    </div>
                    
                    {assignedTech.email && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-3 w-3 text-muted-foreground" />
                        <a href={`mailto:${assignedTech.email}`} className="text-primary hover:underline">
                          {assignedTech.email}
                        </a>
                      </div>
                    )}
                    
                    {/* Tech Stats */}
                    {assignedTech.stats && (
                      <div className="grid grid-cols-2 gap-2 pt-2">
                        {assignedTech.stats.totalTickets !== undefined && (
                          <div className="p-2 bg-background rounded">
                            <div className="flex items-center gap-1">
                              <Target className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">Total</span>
                            </div>
                            <p className="text-sm font-semibold">{assignedTech.stats.totalTickets}</p>
                          </div>
                        )}
                        {assignedTech.stats.completedToday !== undefined && (
                          <div className="p-2 bg-background rounded">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">Today</span>
                            </div>
                            <p className="text-sm font-semibold">{assignedTech.stats.completedToday}</p>
                          </div>
                        )}
                        {assignedTech.stats.avgDuration !== undefined && (
                          <div className="p-2 bg-background rounded">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">Avg Time</span>
                            </div>
                            <p className="text-sm font-semibold">{assignedTech.stats.avgDuration}m</p>
                          </div>
                        )}
                        {assignedTech.stats.satisfactionRate !== undefined && (
                          <div className="p-2 bg-background rounded">
                            <div className="flex items-center gap-1">
                              <Award className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">Rating</span>
                            </div>
                            <p className="text-sm font-semibold">{assignedTech.stats.satisfactionRate}%</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-amber-600" />
                      <span className="text-sm font-medium text-amber-900 dark:text-amber-100">
                        No technician assigned
                      </span>
                    </div>
                    <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                      Assign a technician to start work on this ticket
                    </p>
                  </div>
                )}
              </div>
            ) : (
              // Non-admin view
              <div className="space-y-4">
                {assignedTech ? (
                  <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={`https://avatar.vercel.sh/${assignedTech.email}.png`} />
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                          {getInitials(assignedTech.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{assignedTech.name}</p>
                        <p className="text-xs text-muted-foreground">{assignedTech.role}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <User className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Not yet assigned</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </TabsContent>
        
        {/* Photos Tab */}
        <TabsContent value="photos" className="mt-0">
          <CardContent className="p-0">
            <TicketPhotosSidebar ticketId={ticketId} embedded />
          </CardContent>
        </TabsContent>
      </Tabs>
    </Card>
  );
}