'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ButtonPremium } from '@/components/premium/ui/buttons/button-premium';
import { SelectPremium } from '@/components/premium/ui/forms/select-premium';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Calendar,
  Clock,
  CheckCircle,
  TrendingUp,
  UserPlus,
  Edit2,
  Save,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface AssigneeData {
  id: string | null;
  name: string;
  email?: string;
  role?: string;
  avatar?: string;
  stats?: {
    totalAppointments?: number;
    completedToday?: number;
    avgDuration?: number;
    satisfactionRate?: number;
  };
}

export interface AssigneeCardProps {
  assignee: AssigneeData | null;
  technicians: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
  }>;
  isEditing?: boolean;
  isLocked?: boolean;
  onAssigneeChange?: (technicianId: string | null) => Promise<void>;
  className?: string;
}

export function AssigneeCard({
  assignee,
  technicians,
  isEditing = false,
  isLocked = false,
  onAssigneeChange,
  className
}: AssigneeCardProps) {
  const [isChanging, setIsChanging] = useState(false);
  const [selectedTechnicianId, setSelectedTechnicianId] = useState<string | null>(assignee?.id || null);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!onAssigneeChange) return;
    
    setIsSaving(true);
    try {
      await onAssigneeChange(selectedTechnicianId);
      setIsChanging(false);
      toast.success('Assignee updated successfully');
    } catch (error) {
      toast.error('Failed to update assignee');
      console.error('Error updating assignee:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setSelectedTechnicianId(assignee?.id || null);
    setIsChanging(false);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleBadgeColor = (role?: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300';
      case 'manager':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300';
      case 'technician':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  return (
    <Card className={cn(
      "relative overflow-hidden transition-all duration-200",
      "bg-gradient-to-br from-card via-card to-primary/5",
      "border-primary/20 shadow-sm hover:shadow-md",
      className
    )}>
      {/* Decorative gradient accent */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-2xl" />
      
      <CardHeader className="relative">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <User className="h-4 w-4 text-primary" />
            Assigned To
          </CardTitle>
          {!isLocked && !isChanging && (
            <ButtonPremium
              variant="ghost"
              size="sm"
              onClick={() => setIsChanging(true)}
              className="h-8 px-2"
            >
              <Edit2 className="h-3.5 w-3.5" />
            </ButtonPremium>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="relative space-y-4">
        {isChanging ? (
          <>
            <SelectPremium
              options={[
                { value: '', label: 'Unassigned', description: 'No technician assigned' },
                ...technicians.map(tech => ({
                  value: tech.id,
                  label: tech.name,
                  description: tech.email
                }))
              ]}
              value={selectedTechnicianId || ''}
              onChange={(value) => setSelectedTechnicianId(value || null)}
              placeholder="Select technician"
              size="sm"
              variant="default"
              className="w-full"
            />
            
            <div className="flex gap-2">
              <ButtonPremium
                onClick={handleSave}
                size="sm"
                variant="gradient"
                className="flex-1"
                disabled={isSaving}
              >
                {isSaving ? (
                  <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Save className="h-3.5 w-3.5" />
                )}
                <span className="ml-1">Save</span>
              </ButtonPremium>
              <ButtonPremium
                onClick={handleCancel}
                size="sm"
                variant="outline"
                disabled={isSaving}
              >
                <X className="h-3.5 w-3.5" />
              </ButtonPremium>
            </div>
          </>
        ) : assignee ? (
          <>
            {/* Assignee Info */}
            <div className="flex items-start gap-3">
              <Avatar className="h-12 w-12 border-2 border-primary/20">
                <AvatarImage src={assignee.avatar} />
                <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-white font-medium">
                  {getInitials(assignee.name)}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-foreground truncate">
                    {assignee.name}
                  </p>
                  {assignee.role && (
                    <Badge className={cn("text-xs capitalize", getRoleBadgeColor(assignee.role))}>
                      {assignee.role}
                    </Badge>
                  )}
                </div>
                {assignee.email && (
                  <p className="text-xs text-muted-foreground truncate">
                    {assignee.email}
                  </p>
                )}
              </div>
            </div>

            {/* Stats Grid */}
            {assignee.stats && (
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/50">
                {assignee.stats.totalAppointments !== undefined && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Total</span>
                    </div>
                    <p className="text-lg font-semibold text-foreground">
                      {assignee.stats.totalAppointments}
                    </p>
                  </div>
                )}
                
                {assignee.stats.completedToday !== undefined && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Today</span>
                    </div>
                    <p className="text-lg font-semibold text-foreground">
                      {assignee.stats.completedToday}
                    </p>
                  </div>
                )}
                
                {assignee.stats.avgDuration !== undefined && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Avg Time</span>
                    </div>
                    <p className="text-lg font-semibold text-foreground">
                      {assignee.stats.avgDuration}m
                    </p>
                  </div>
                )}
                
                {assignee.stats.satisfactionRate !== undefined && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Rating</span>
                    </div>
                    <p className="text-lg font-semibold text-foreground">
                      {assignee.stats.satisfactionRate}%
                    </p>
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-4">
            <div className="mx-auto h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center mb-3">
              <UserPlus className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">No technician assigned</p>
            {!isLocked && (
              <ButtonPremium
                onClick={() => setIsChanging(true)}
                size="sm"
                variant="outline"
                className="mt-3"
              >
                <UserPlus className="h-3.5 w-3.5 mr-1" />
                Assign Technician
              </ButtonPremium>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}