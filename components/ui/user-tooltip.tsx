'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/components/ui/tooltip';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  User, 
  Mail, 
  Calendar, 
  Wrench, 
  Clock, 
  CheckCircle,
  ArrowUpRight,
  Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { format } from 'date-fns';

interface UserStats {
  totalTickets: number;
  completedTickets: number;
  activeTickets: number;
  avgCompletionTime: number;
  totalTimeTracked: number;
}

interface UserData {
  id: string;
  email: string;
  full_name?: string;
  role?: string;
  created_at?: string;
}

interface UserTooltipProps {
  userId?: string;
  userName?: string;
  userEmail?: string;
  children: React.ReactNode;
  className?: string;
  showStats?: boolean;
  showProfileLink?: boolean;
}

async function fetchUserStats(userId: string): Promise<UserStats> {
  const supabase = createClient();
  
  // Fetch ticket statistics
  const { data: tickets, error } = await supabase
    .from('repair_tickets')
    .select('status, total_time_minutes, created_at, updated_at')
    .eq('assigned_to', userId);

  if (error || !tickets) {
    return {
      totalTickets: 0,
      completedTickets: 0,
      activeTickets: 0,
      avgCompletionTime: 0,
      totalTimeTracked: 0
    };
  }

  const completed = tickets.filter(t => t.status === 'completed');
  const active = tickets.filter(t => ['new', 'in_progress', 'on_hold'].includes(t.status));
  
  // Calculate average completion time in days
  const completionTimes = completed.map(t => {
    const created = new Date(t.created_at);
    const updated = new Date(t.updated_at);
    return Math.floor((updated.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
  });
  
  const avgCompletionTime = completionTimes.length > 0 
    ? Math.round(completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length)
    : 0;
    
  const totalTimeTracked = tickets.reduce((total, t) => total + (t.total_time_minutes || 0), 0);

  return {
    totalTickets: tickets.length,
    completedTickets: completed.length,
    activeTickets: active.length,
    avgCompletionTime,
    totalTimeTracked
  };
}

async function fetchUserData(userId: string): Promise<UserData | null> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('users')
    .select('id, email, full_name, role, created_at')
    .eq('id', userId)
    .single();
    
  if (error || !data) return null;
  return data;
}

export function UserTooltip({
  userId,
  userName,
  userEmail,
  children,
  className,
  showStats = true,
  showProfileLink = true
}: UserTooltipProps) {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen || !userId) return;
    
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [data, stats] = await Promise.all([
          fetchUserData(userId),
          showStats ? fetchUserStats(userId) : Promise.resolve(null)
        ]);
        setUserData(data);
        setUserStats(stats);
      } catch (error) {
        console.error('Failed to load user data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [isOpen, userId, showStats]);

  // If no userId, just render children without tooltip
  if (!userId) {
    return <>{children}</>;
  }

  const displayName = userData?.full_name || userName || 'Unknown User';
  const displayEmail = userData?.email || userEmail || '';
  const initials = displayName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const formatTime = (minutes: number) => {
    if (minutes === 0) return '0m';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip open={isOpen} onOpenChange={setIsOpen}>
        <TooltipTrigger asChild className={className}>
          {children}
        </TooltipTrigger>
        <TooltipContent 
          side="top" 
          align="center" 
          className="w-80 p-0 overflow-hidden border-primary/20 shadow-xl animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95"
          sideOffset={6}
        >
          <div className="relative">
            {/* Header with gradient background */}
            <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-4">
              <div className="flex items-start gap-3">
                <Avatar className="h-12 w-12 border-2 border-background">
                  <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${displayName}`} />
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-sm truncate">{displayName}</h4>
                    {userData?.role && (
                      <Badge variant="outline" className="text-xs capitalize">
                        {userData.role}
                      </Badge>
                    )}
                  </div>
                  
                  {displayEmail && (
                    <a 
                      href={`mailto:${displayEmail}`}
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors mt-1"
                    >
                      <Mail className="h-3 w-3" />
                      {displayEmail}
                    </a>
                  )}
                  
                  {userData?.created_at && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                      <Calendar className="h-3 w-3" />
                      Joined {format(new Date(userData.created_at), 'MMM yyyy')}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Stats Section */}
            {showStats && (
              <div className="p-4 pt-3 border-t bg-card/50">
                {isLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-24" />
                    <div className="grid grid-cols-2 gap-3">
                      <Skeleton className="h-12" />
                      <Skeleton className="h-12" />
                      <Skeleton className="h-12" />
                      <Skeleton className="h-12" />
                    </div>
                  </div>
                ) : userStats ? (
                  <div className="space-y-3">
                    <h5 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Performance Stats
                    </h5>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-lg border bg-background/50 p-2">
                        <div className="flex items-center gap-1.5">
                          <Activity className="h-3 w-3 text-blue-500" />
                          <span className="text-xs text-muted-foreground">Active</span>
                        </div>
                        <p className="text-sm font-semibold mt-1">{userStats.activeTickets}</p>
                      </div>
                      
                      <div className="rounded-lg border bg-background/50 p-2">
                        <div className="flex items-center gap-1.5">
                          <CheckCircle className="h-3 w-3 text-green-500" />
                          <span className="text-xs text-muted-foreground">Completed</span>
                        </div>
                        <p className="text-sm font-semibold mt-1">{userStats.completedTickets}</p>
                      </div>
                      
                      <div className="rounded-lg border bg-background/50 p-2">
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3 w-3 text-orange-500" />
                          <span className="text-xs text-muted-foreground">Avg Time</span>
                        </div>
                        <p className="text-sm font-semibold mt-1">{userStats.avgCompletionTime}d</p>
                      </div>
                      
                      <div className="rounded-lg border bg-background/50 p-2">
                        <div className="flex items-center gap-1.5">
                          <Wrench className="h-3 w-3 text-purple-500" />
                          <span className="text-xs text-muted-foreground">Tracked</span>
                        </div>
                        <p className="text-sm font-semibold mt-1">{formatTime(userStats.totalTimeTracked)}</p>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            )}

          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}