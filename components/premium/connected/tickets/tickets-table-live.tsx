'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { TablePremium, TablePremiumBody, TablePremiumCell, TablePremiumHead, TablePremiumHeader, TablePremiumRow } from '@/components/premium/ui/data-display/table-premium';
import { StatusBadge } from '@/components/premium/ui/badges/status-badge';
import { ButtonPremium } from '@/components/premium/ui/buttons/button-premium';
import { SkeletonPremium } from '@/components/premium/ui/feedback/skeleton-premium';
import { Pills } from '@/components/premium/ui/pills/pill';
import { cn } from '@/lib/utils';
import { format, formatDistanceToNow } from 'date-fns';
import { Eye, Clock, MoreHorizontal, Play, Pause, CheckCircle, Package, User, MessageSquare, Timer, Shield } from 'lucide-react';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { useTimer } from '@/lib/contexts/timer-context';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { UserTooltip } from '@/components/ui/user-tooltip';
import { CustomerTooltip } from '@/components/ui/customer-tooltip';

interface Ticket {
  id: string;
  ticket_number: string;
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  device_brand: string;
  device_model: string;
  repair_issues: string[];
  status: 'new' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled';
  priority?: string;
  created_at: string;
  updated_at: string;
  timer_total_minutes: number;
  estimated_minutes: number;
  assigned_to: string | null;
  assigned_user?: {
    id: string;
    full_name: string | null;
    email: string;
  };
  comment_count?: number;
}

export interface TicketsTableLiveProps {
  /** Initial tickets data for SSR */
  initialData?: Ticket[];
  /** Filter by status */
  statusFilter?: 'all' | 'new' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled';
  /** Search query */
  searchQuery?: string;
  /** Show only tickets assigned to current user */
  showMyTickets?: boolean;
  /** Current user ID for filtering */
  currentUserId?: string | null;
  /** Filter by priority */
  priorityFilter?: string;
  /** Filter by assignee */
  assigneeFilter?: string;
  /** Filter by device brand */
  deviceBrandFilter?: string;
  /** Number of items to show */
  limit?: number;
  /** Custom className */
  className?: string;
  /** Callback when ticket status is updated */
  onStatusUpdate?: (id: string, status: string) => void;
}

async function fetchTickets(): Promise<Ticket[]> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('repair_tickets')
    .select(`
      *,
      customers!inner (
        id,
        name,
        phone
      ),
      time_entries (
        duration_minutes
      ),
      ticket_services (
        id,
        service_id
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching tickets:', error);
    return [];
  }

  // Fetch users separately for assigned_to mapping
  const assignedUserIds = [...new Set(data?.filter(t => t.assigned_to).map(t => t.assigned_to) || [])];
  
  let usersMap = new Map();
  if (assignedUserIds.length > 0) {
    const { data: users } = await supabase
      .from('users')
      .select('id, full_name, email')
      .in('id', assignedUserIds);
    
    if (users) {
      users.forEach(user => {
        usersMap.set(user.id, user);
      });
    }
  }

  // Fetch services for estimated duration
  const serviceIds = [...new Set(
    data?.flatMap(t => t.ticket_services?.map((ts: any) => ts.service_id) || []) || []
  )].filter(Boolean);
  
  let servicesMap = new Map();
  if (serviceIds.length > 0) {
    const { data: services } = await supabase
      .from('services')
      .select('id, estimated_duration_minutes')
      .in('id', serviceIds);
    
    if (services) {
      services.forEach(service => {
        servicesMap.set(service.id, service.estimated_duration_minutes || 0);
      });
    }
  }

  // Fetch comment counts for all tickets
  const ticketIds = (data || []).map(t => t.id);
  const { data: commentCounts } = await supabase
    .from('comments')
    .select('entity_id, id')
    .eq('entity_type', 'ticket')
    .in('entity_id', ticketIds)
    .is('deleted_at', null);

  // Count comments per ticket
  const commentCountMap = new Map<string, number>();
  (commentCounts || []).forEach(comment => {
    const count = commentCountMap.get(comment.entity_id) || 0;
    commentCountMap.set(comment.entity_id, count + 1);
  });

  const mappedData = (data || []).map(ticket => {
    // Calculate total tracked time from time_entries
    const totalMinutes = ticket.time_entries?.reduce((sum: number, entry: any) => 
      sum + (entry.duration_minutes || 0), 0) || ticket.total_time_minutes || 0;
    
    // Calculate estimated time from ticket_services using the services map
    const estimatedMinutes = ticket.ticket_services?.reduce((sum: number, ts: any) => {
      const duration = servicesMap.get(ts.service_id) || 0;
      return sum + duration;
    }, 0) || 0;
    
    return {
      id: ticket.id,
      ticket_number: ticket.ticket_number,
      customer_id: ticket.customer_id,
      customer_name: ticket.customers?.name || 'Unknown Customer',
      customer_phone: ticket.customers?.phone || '',
      device_brand: ticket.device_brand || '',
      device_model: ticket.device_model || '',
      repair_issues: ticket.repair_issues || [],
      status: ticket.status,
      priority: ticket.priority,
      created_at: ticket.created_at,
      updated_at: ticket.updated_at,
      timer_total_minutes: totalMinutes,
      estimated_minutes: estimatedMinutes,
      assigned_to: ticket.assigned_to,
      assigned_user: ticket.assigned_to ? usersMap.get(ticket.assigned_to) : undefined,
      comment_count: commentCountMap.get(ticket.id) || 0,
    };
  });

  return mappedData;
}

async function updateTicketStatus(id: string, status: string) {
  const supabase = createClient();
  
  const { error } = await supabase
    .from('repair_tickets')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    throw error;
  }
}

// Helper function to map database status to StatusBadge status prop
function mapTicketStatus(status: string) {
  switch (status?.toLowerCase()) {
    case 'new':
      return 'new';
    case 'in_progress':
      return 'inProgress';
    case 'on_hold':
      return 'onHold';
    case 'completed':
      return 'completed';
    case 'cancelled':
      return 'cancelled';
    default:
      return 'pending';
  }
}


export const TicketsTableLive: React.FC<TicketsTableLiveProps> = ({
  initialData = [],
  statusFilter = 'all',
  searchQuery = '',
  showMyTickets = false,
  currentUserId = null,
  priorityFilter = 'all',
  assigneeFilter = 'all',
  deviceBrandFilter = 'all',
  limit,
  className,
  onStatusUpdate,
}) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isMounted, setIsMounted] = React.useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = React.useState(false);
  const { activeTimer } = useTimer();

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  const { data: tickets = initialData, isLoading, isFetching, isSuccess, error, refetch } = useQuery({
    queryKey: ['tickets-table'],
    queryFn: fetchTickets,
    enabled: isMounted,
    staleTime: 30 * 1000, // 30 seconds
    refetchOnWindowFocus: false,
    placeholderData: initialData,
    initialData: initialData.length > 0 ? initialData : undefined
  });


  // Track when we've successfully loaded data at least once
  React.useEffect(() => {
    if (isSuccess && !hasLoadedOnce) {
      setHasLoadedOnce(true);
    }
  }, [isSuccess, hasLoadedOnce]);

  // Set up real-time subscription
  React.useEffect(() => {
    if (!isMounted) return;

    const supabase = createClient();
    const channel = supabase.channel('tickets-table');

    channel
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'repair_tickets'
      }, async (payload) => {
        // Refetch to get full data with relations
        const newData = await fetchTickets();
        queryClient.setQueryData(['tickets-table'], newData);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isMounted, queryClient]);

  // Filter tickets
  const filteredTickets = React.useMemo(() => {
    let filtered = [...tickets];

    // Apply My Tickets filter
    if (showMyTickets && currentUserId) {
      filtered = filtered.filter(ticket => ticket.assigned_to === currentUserId);
    }

    // Apply status filter - supports comma-separated values
    if (statusFilter && statusFilter !== 'all') {
      // Check if it's a comma-separated list
      if (statusFilter.includes(',')) {
        const statuses = statusFilter.split(',').map(s => s.trim());
        filtered = filtered.filter(ticket => statuses.includes(ticket.status));
      } else {
        filtered = filtered.filter(ticket => ticket.status === statusFilter);
      }
    }

    // Apply priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(ticket => ticket.priority?.toLowerCase() === priorityFilter);
    }

    // Apply assignee filter
    if (assigneeFilter !== 'all') {
      if (assigneeFilter === 'unassigned') {
        filtered = filtered.filter(ticket => !ticket.assigned_to);
      } else if (assigneeFilter === 'assigned') {
        filtered = filtered.filter(ticket => ticket.assigned_to);
      }
    }

    // Apply device brand filter
    if (deviceBrandFilter !== 'all') {
      filtered = filtered.filter(ticket => 
        ticket.device_brand?.toLowerCase() === deviceBrandFilter.toLowerCase()
      );
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(ticket =>
        ticket.ticket_number.toLowerCase().includes(query) ||
        ticket.customer_name.toLowerCase().includes(query) ||
        ticket.customer_phone?.toLowerCase().includes(query) ||
        ticket.device_brand?.toLowerCase().includes(query) ||
        ticket.device_model?.toLowerCase().includes(query)
      );
    }

    // Apply limit if specified
    if (limit && limit > 0) {
      filtered = filtered.slice(0, limit);
    }

    return filtered;
  }, [tickets, statusFilter, searchQuery, showMyTickets, currentUserId, priorityFilter, assigneeFilter, deviceBrandFilter, limit]);

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    try {
      await updateTicketStatus(id, newStatus);
      toast.success(`Ticket status updated to ${newStatus}`);
      
      // Update cache
      const newData = tickets.map(ticket => 
        ticket.id === id ? { ...ticket, status: newStatus as any } : ticket
      );
      queryClient.setQueryData(['tickets-table'], newData);
      
      onStatusUpdate?.(id, newStatus);
    } catch (error) {
      toast.error('Failed to update ticket status');
      console.error(error);
    }
  };

  // Format time helper
  const formatTime = (minutes: number) => {
    if (minutes === 0) return '-';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  // Format tracked vs estimated time with color coding
  const formatTrackedVsEstimated = (trackedMinutes: number, estimatedMinutes: number) => {
    const tracked = formatTime(trackedMinutes);
    
    // If no estimated time or invalid, just show tracked time
    if (!estimatedMinutes || estimatedMinutes === 0 || isNaN(estimatedMinutes)) {
      return { display: tracked === '-' ? '-' : tracked, color: '' };
    }
    
    const estimated = formatTime(estimatedMinutes);
    
    // Calculate percentage of time used
    const percentage = (trackedMinutes / estimatedMinutes) * 100;
    
    // Determine color based on percentage
    let color = '';
    if (percentage <= 75) {
      color = 'text-green-600 dark:text-green-400'; // Good - under 75%
    } else if (percentage <= 100) {
      color = 'text-amber-600 dark:text-amber-400'; // Getting close - 75-100%
    } else {
      color = 'text-red-600 dark:text-red-400'; // Over - more than 100%
    }
    
    return { 
      display: `${tracked} / ${estimated}`,
      color
    };
  };

  // Show skeleton until we have a definitive answer (following hydration strategy)
  const showSkeleton = !hasLoadedOnce || isLoading || isFetching;

  if (error && !showSkeleton) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Failed to load tickets
      </div>
    );
  }

  return (
    <TablePremium className={className}>
      <TablePremiumHeader>
        <TablePremiumRow>
          <TablePremiumHead>Ticket #</TablePremiumHead>
          <TablePremiumHead>Customer</TablePremiumHead>
          <TablePremiumHead>Device</TablePremiumHead>
          <TablePremiumHead>Status</TablePremiumHead>
          <TablePremiumHead>Assigned</TablePremiumHead>
          <TablePremiumHead>Time</TablePremiumHead>
          <TablePremiumHead className="w-10"></TablePremiumHead>
          <TablePremiumHead className="text-right">Actions</TablePremiumHead>
        </TablePremiumRow>
      </TablePremiumHeader>
      <TablePremiumBody>
        {showSkeleton ? (
          // Show skeleton rows
          Array.from({ length: 5 }).map((_, i) => (
            <TablePremiumRow key={`skeleton-${i}`}>
              <TablePremiumCell>
                <SkeletonPremium className="h-4 w-20" />
              </TablePremiumCell>
              <TablePremiumCell>
                <SkeletonPremium className="h-4 w-32" />
              </TablePremiumCell>
              <TablePremiumCell>
                <SkeletonPremium className="h-4 w-28" />
              </TablePremiumCell>
              <TablePremiumCell>
                <SkeletonPremium className="h-6 w-20 rounded-full" />
              </TablePremiumCell>
              <TablePremiumCell>
                <SkeletonPremium className="h-4 w-24" />
              </TablePremiumCell>
              <TablePremiumCell>
                <SkeletonPremium className="h-4 w-12" />
              </TablePremiumCell>
              <TablePremiumCell className="w-10">
                <SkeletonPremium className="h-8 w-8 rounded-full" />
              </TablePremiumCell>
              <TablePremiumCell>
                <div className="flex justify-end gap-1">
                  <SkeletonPremium className="h-8 w-8 rounded" />
                  <SkeletonPremium className="h-8 w-8 rounded" />
                  <SkeletonPremium className="h-8 w-8 rounded" />
                </div>
              </TablePremiumCell>
            </TablePremiumRow>
          ))
        ) : filteredTickets.length === 0 ? (
          <TablePremiumRow>
            <TablePremiumCell colSpan={8} className="text-center py-8 text-muted-foreground">
              No tickets found
            </TablePremiumCell>
          </TablePremiumRow>
        ) : (
          filteredTickets.map((ticket) => (
            
              <TablePremiumRow 
                key={ticket.id}
                className={cn(
                  "cursor-pointer hover:bg-muted/50",
                  activeTimer && activeTimer.ticketId === ticket.id && 
                    "bg-green-50 dark:bg-green-950/20 border-l-4 border-l-green-500"
                )}
                onClick={() => router.push(`/orders/${ticket.id}`)}
              >
                <TablePremiumCell className="font-medium text-sm">
                  {ticket.ticket_number}
                </TablePremiumCell>
                <TablePremiumCell>
                  <CustomerTooltip
                    customerId={ticket.customer_id}
                    customerName={ticket.customer_name}
                    customerPhone={ticket.customer_phone}
                    showStats={true}
                    showProfileLink={true}
                  >
                    <div className="inline-flex items-center gap-1.5 px-2 py-1 -mx-2 -my-1 rounded-md cursor-pointer transition-all duration-200 group hover:bg-primary/10 hover:text-primary hover:ring-2 hover:ring-primary/20 hover:ring-offset-1 hover:ring-offset-background">
                      <User className="h-3 w-3 text-muted-foreground group-hover:text-primary/70 transition-colors" />
                      <span className="text-sm font-medium">
                        {ticket.customer_name}
                      </span>
                    </div>
                  </CustomerTooltip>
                </TablePremiumCell>
                <TablePremiumCell>
                  <div className="text-sm">
                    {ticket.device_brand && ticket.device_model ? (
                      `${ticket.device_brand} ${ticket.device_model}`
                    ) : (
                      <span className="text-muted-foreground">Not specified</span>
                    )}
                  </div>
                </TablePremiumCell>
                <TablePremiumCell>
                  <StatusBadge
                    status={mapTicketStatus(ticket.status)}
                    variant="soft"
                    size="xs"
                  />
                </TablePremiumCell>
                <TablePremiumCell>
                  {ticket.assigned_user ? (
                    <UserTooltip
                      userId={ticket.assigned_to}
                      userName={ticket.assigned_user.full_name}
                      userEmail={ticket.assigned_user.email}
                      showStats={true}
                      showProfileLink={false}
                    >
                      <div className="inline-flex items-center gap-1.5 px-2 py-1 -mx-2 -my-1 rounded-md cursor-pointer transition-all duration-200 group hover:bg-primary/10 hover:text-primary hover:ring-2 hover:ring-primary/20 hover:ring-offset-1 hover:ring-offset-background">
                        <Shield className="h-3 w-3 text-muted-foreground group-hover:text-primary/70 transition-colors" />
                        <span className="text-sm font-medium">
                          {ticket.assigned_user.full_name || ticket.assigned_user.email.split('@')[0]}
                        </span>
                      </div>
                    </UserTooltip>
                  ) : (
                    <span className="text-sm text-muted-foreground">Unassigned</span>
                  )}
                </TablePremiumCell>
                <TablePremiumCell>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    {(() => {
                      const timeData = formatTrackedVsEstimated(ticket.timer_total_minutes, ticket.estimated_minutes);
                      const parts = timeData.display.split(' / ');
                      
                      if (parts.length === 1) {
                        // No estimated time, just show tracked time
                        return <span className="text-sm font-medium">{timeData.display}</span>;
                      }
                      
                      // Show tracked time normally, estimated time with color
                      return (
                        <span className="text-sm font-medium">
                          <span>{parts[0]}</span>
                          <span className="text-muted-foreground"> / </span>
                          <span className={timeData.color}>{parts[1]}</span>
                        </span>
                      );
                    })()}
                  </div>
                </TablePremiumCell>
                <TablePremiumCell className="w-10">
                  {activeTimer && activeTimer.ticketId === ticket.id && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center justify-center animate-pulse">
                            <div className="p-1.5 rounded-full bg-green-100 dark:bg-green-900/30">
                              <Timer className="h-4 w-4 text-green-600 dark:text-green-400" />
                            </div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Timer is running</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </TablePremiumCell>
                <TablePremiumCell className="text-right" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-1">
                    <Link
                      href={`/orders/${ticket.id}`}
                      className="p-1 rounded hover:bg-muted transition-colors"
                      title="View ticket"
                    >
                      <Eye className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                    </Link>

                    <Link
                      href={`/orders/${ticket.id}#comments`}
                      className="relative p-1 rounded hover:bg-muted transition-colors"
                      title={`${ticket.comment_count || 0} comments`}
                    >
                      <MessageSquare className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                      {ticket.comment_count ? (
                        <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                          {ticket.comment_count > 9 ? '9+' : ticket.comment_count}
                        </span>
                      ) : null}
                    </Link>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          className="p-1 rounded hover:bg-muted transition-colors"
                          title="More actions"
                        >
                          <MoreHorizontal className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {ticket.status === 'new' && (
                          <DropdownMenuItem
                            onClick={() => handleStatusUpdate(ticket.id, 'in_progress')}
                            className="text-blue-600"
                          >
                            <Play className="mr-2 h-4 w-4" />
                            Start Progress
                          </DropdownMenuItem>
                        )}
                        {ticket.status === 'in_progress' && (
                          <>
                            <DropdownMenuItem
                              onClick={() => handleStatusUpdate(ticket.id, 'on_hold')}
                              className="text-orange-600"
                            >
                              <Pause className="mr-2 h-4 w-4" />
                              Put On Hold
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleStatusUpdate(ticket.id, 'completed')}
                              className="text-green-600"
                            >
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Mark Complete
                            </DropdownMenuItem>
                          </>
                        )}
                        {ticket.status === 'on_hold' && (
                          <DropdownMenuItem
                            onClick={() => handleStatusUpdate(ticket.id, 'in_progress')}
                            className="text-blue-600"
                          >
                            <Play className="mr-2 h-4 w-4" />
                            Resume Progress
                          </DropdownMenuItem>
                        )}
                        {ticket.status === 'completed' && (
                          <DropdownMenuItem
                            onClick={() => handleStatusUpdate(ticket.id, 'in_progress')}
                            className="text-orange-600"
                          >
                            <Package className="mr-2 h-4 w-4" />
                            Reopen Ticket
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TablePremiumCell>
              </TablePremiumRow>
            
          ))
        )}
      </TablePremiumBody>
    </TablePremium>
  );
};