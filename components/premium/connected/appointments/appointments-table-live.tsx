'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { TablePremium, TablePremiumBody, TablePremiumCell, TablePremiumHead, TablePremiumHeader, TablePremiumRow } from '@/components/premium/ui/data-display/table-premium';
import { StatusBadge } from '@/components/premium/ui/badges/status-badge';
import { ButtonPremium } from '@/components/premium/ui/buttons/button-premium';
import { SkeletonPremium } from '@/components/premium/ui/feedback/skeleton-premium';
import { cn } from '@/lib/utils';
import { format, isToday, isTomorrow, isPast, isFuture } from 'date-fns';
import { Eye, FileText, MoreHorizontal, CheckCheck, User, X, Edit, UserCheck, Shield } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { UserTooltip } from '@/components/ui/user-tooltip';
import { CustomerTooltip } from '@/components/ui/customer-tooltip';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

interface Appointment {
  id: string;
  appointment_number: string;
  customer_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  device: string;
  scheduled_date: string;
  scheduled_time: string;
  duration_minutes: number;
  status: 'scheduled' | 'confirmed' | 'arrived' | 'no_show' | 'cancelled' | 'converted';
  issues: string[];
  urgency: string | null;
  source: string | null;
  created_at: string;
  converted_to_ticket_id: string | null;
  assigned_to?: string | null;
  assigned_user?: {
    id: string;
    full_name: string | null;
    email: string;
  };
}

export interface AppointmentsTableLiveProps {
  /** Initial appointments data for SSR */
  initialData?: Appointment[];
  /** Filter by status - can be comma-separated for multiple statuses */
  statusFilter?: string;
  /** Filter by date */
  dateFilter?: 'all' | 'today' | 'upcoming' | 'past';
  /** Search query */
  searchQuery?: string;
  /** Show only appointments assigned to current user */
  showMyAppointments?: boolean;
  /** Current user ID for filtering */
  currentUserId?: string | null;
  /** Filter by source */
  sourceFilter?: string;
  /** Filter by time range */
  timeRangeFilter?: string;
  /** Number of items to show */
  limit?: number;
  /** Custom className */
  className?: string;
  /** Callback when appointment status is updated */
  onStatusUpdate?: (id: string, status: string) => void;
  /** Callback when appointment is converted */
  onConvert?: (id: string) => void;
}

async function fetchAppointments(): Promise<Appointment[]> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('appointments')
    .select(`
      *,
      customers!appointments_customer_id_fkey (
        id,
        name,
        email,
        phone
      ),
      devices!appointments_device_id_fkey (
        id,
        model_name,
        manufacturers (
          name
        )
      ),
      assigned_user:users!appointments_assigned_to_fkey (
        id,
        full_name,
        email
      )
    `)
    .order('scheduled_date', { ascending: true })
    .order('scheduled_time', { ascending: true });

  if (error) {
    console.error('Error fetching appointments:', error);
    return [];
  }

  return (data || []).map(apt => ({
    id: apt.id,
    appointment_number: apt.appointment_number,
    customer_id: apt.customers?.id || '',
    customer_name: apt.customers?.name || 'Walk-in',
    customer_email: apt.customers?.email || '',
    customer_phone: apt.customers?.phone || '',
    device: apt.devices ? `${apt.devices.manufacturers?.name || ''} ${apt.devices.model_name}` : 'Not specified',
    scheduled_date: apt.scheduled_date,
    scheduled_time: apt.scheduled_time,
    duration_minutes: apt.duration_minutes,
    status: apt.status,
    issues: apt.issues || [],
    urgency: apt.urgency,
    source: apt.source,
    created_at: apt.created_at,
    converted_to_ticket_id: apt.converted_to_ticket_id,
    assigned_to: apt.assigned_to,
    assigned_user: apt.assigned_user || undefined,
  }));
}

async function updateAppointmentStatus(id: string, status: string) {
  const supabase = createClient();
  
  const { error } = await supabase
    .from('appointments')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    throw error;
  }
}

export const AppointmentsTableLive: React.FC<AppointmentsTableLiveProps> = ({
  initialData = [],
  statusFilter = 'all',
  dateFilter = 'all',
  searchQuery = '',
  showMyAppointments = false,
  currentUserId = null,
  urgencyFilter = 'all',
  sourceFilter = 'all',
  timeRangeFilter = 'all',
  limit,
  className,
  onStatusUpdate,
  onConvert,
}) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isMounted, setIsMounted] = React.useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  const { data: appointments = initialData, isLoading, isFetching, isSuccess, error } = useQuery({
    queryKey: ['appointments-table'],
    queryFn: fetchAppointments,
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
    const channel = supabase.channel('appointments-table');

    channel
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'appointments'
      }, async (payload) => {
        // Refetch to get full data with relations
        const newData = await fetchAppointments();
        queryClient.setQueryData(['appointments-table'], newData);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isMounted, queryClient]);

  // Filter appointments
  const filteredAppointments = React.useMemo(() => {
    let filtered = [...appointments];

    // Apply My Appointments filter
    if (showMyAppointments && currentUserId) {
      filtered = filtered.filter(apt => apt.assigned_to === currentUserId);
    }

    // Apply status filter - supports comma-separated values
    if (statusFilter && statusFilter !== 'all') {
      const statuses = statusFilter.split(',').map(s => s.trim());
      filtered = filtered.filter(apt => statuses.includes(apt.status));
    }

    // Apply date filter
    switch (dateFilter) {
      case 'today':
        filtered = filtered.filter(apt => {
          const [year, month, day] = apt.scheduled_date.split('-');
          const aptDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
          return isToday(aptDate) && apt.status !== 'converted';
        });
        break;
      case 'upcoming':
        filtered = filtered.filter(apt => {
          const [year, month, day] = apt.scheduled_date.split('-');
          const aptDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
          return (isFuture(aptDate) || isToday(aptDate)) && apt.status !== 'converted';
        });
        break;
      case 'past':
        filtered = filtered.filter(apt => {
          const [year, month, day] = apt.scheduled_date.split('-');
          const aptDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
          return isPast(aptDate) && !isToday(aptDate) && apt.status !== 'converted';
        });
        break;
    }

    // Apply source filter
    if (sourceFilter !== 'all') {
      filtered = filtered.filter(apt => apt.source?.toLowerCase() === sourceFilter.toLowerCase());
    }

    // Apply time range filter
    if (timeRangeFilter !== 'all') {
      filtered = filtered.filter(apt => {
        const [hours] = apt.scheduled_time.split(':').map(Number);
        switch (timeRangeFilter) {
          case 'morning':
            return hours >= 9 && hours < 12;
          case 'afternoon':
            return hours >= 12 && hours < 17;
          case 'evening':
            return hours >= 17 && hours < 21;
          default:
            return true;
        }
      });
    }

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(apt =>
        apt.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        apt.appointment_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        apt.customer_phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        apt.customer_email?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply limit if specified
    if (limit && limit > 0) {
      filtered = filtered.slice(0, limit);
    }

    return filtered;
  }, [appointments, statusFilter, dateFilter, searchQuery, showMyAppointments, currentUserId, sourceFilter, timeRangeFilter, limit]);

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    try {
      await updateAppointmentStatus(id, newStatus);
      toast.success(`Appointment status updated to ${newStatus}`);
      
      // Update cache
      const newData = appointments.map(apt => 
        apt.id === id ? { ...apt, status: newStatus as any } : apt
      );
      queryClient.setQueryData(['appointments-table'], newData);
      
      onStatusUpdate?.(id, newStatus);
    } catch (error) {
      toast.error('Failed to update appointment status');
      console.error(error);
    }
  };

  const handleConvert = (id: string) => {
    if (onConvert) {
      onConvert(id);
    } else {
      router.push(`/appointments/${id}`);
    }
  };

  // Show skeleton until we have a definitive answer (following hydration strategy)
  const showSkeleton = !hasLoadedOnce || isLoading || isFetching;

  if (error && !showSkeleton) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Failed to load appointments
      </div>
    );
  }

  return (
    <TablePremium className={className}>
      <TablePremiumHeader>
        <TablePremiumRow>
          <TablePremiumHead>Appointment #</TablePremiumHead>
          <TablePremiumHead>Date & Time</TablePremiumHead>
          <TablePremiumHead>Customer</TablePremiumHead>
          <TablePremiumHead>Device</TablePremiumHead>
          <TablePremiumHead>Status</TablePremiumHead>
          <TablePremiumHead>Assigned</TablePremiumHead>
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
                <SkeletonPremium className="h-4 w-24" />
              </TablePremiumCell>
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
              <TablePremiumCell className="w-10">
                <SkeletonPremium className="h-8 w-8 rounded-full" />
              </TablePremiumCell>
              <TablePremiumCell>
                <div className="flex justify-end gap-1">
                  <SkeletonPremium className="h-8 w-8 rounded" />
                  <SkeletonPremium className="h-8 w-8 rounded" />
                </div>
              </TablePremiumCell>
            </TablePremiumRow>
          ))
        ) : filteredAppointments.length === 0 ? (
          <TablePremiumRow>
            <TablePremiumCell colSpan={8} className="text-center py-8 text-muted-foreground">
              No appointments found
            </TablePremiumCell>
          </TablePremiumRow>
        ) : (
          filteredAppointments.map((apt) => {
            const [year, month, day] = apt.scheduled_date.split('-');
            const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
            const dateStr = isToday(date) ? 'Today' :
              isTomorrow(date) ? 'Tomorrow' :
              format(date, 'MMM d, yyyy');

            return (
              <TablePremiumRow 
                key={apt.id}
                className={cn(
                  "cursor-pointer hover:bg-muted/50",
                  apt.status === 'arrived' && 
                    "bg-green-50 dark:bg-green-950/20 border-l-4 border-l-green-500"
                )}
                onClick={() => router.push(`/appointments/${apt.id}`)}
              >
                <TablePremiumCell className="font-medium text-sm">
                  {apt.appointment_number}
                </TablePremiumCell>
                <TablePremiumCell>
                  <div className="font-medium text-sm">{dateStr}</div>
                </TablePremiumCell>
                <TablePremiumCell>
                  <CustomerTooltip
                    customerId={apt.customer_id}
                    customerName={apt.customer_name}
                    customerEmail={apt.customer_email}
                    customerPhone={apt.customer_phone}
                    showStats={true}
                    showProfileLink={false}
                  >
                    <div className="inline-flex items-center gap-1.5 px-2 py-1 -mx-2 -my-1 rounded-md cursor-pointer transition-all duration-200 group hover:bg-primary/10 hover:text-primary hover:ring-2 hover:ring-primary/20 hover:ring-offset-1 hover:ring-offset-background">
                      <User className="h-3 w-3 text-muted-foreground group-hover:text-primary/70 transition-colors" />
                      <span className="text-sm font-medium">
                        {apt.customer_name}
                      </span>
                    </div>
                  </CustomerTooltip>
                </TablePremiumCell>
                <TablePremiumCell>
                  <div>
                    <div className="text-sm">{apt.device}</div>
                    {apt.issues.length > 0 && (
                      <div className="text-sm text-muted-foreground">
                        {apt.issues.map(issue => issue.replace('_', ' ')).join(', ')}
                      </div>
                    )}
                  </div>
                </TablePremiumCell>
                <TablePremiumCell>
                  <StatusBadge
                    status={apt.status}
                    variant="soft"
                    size="xs"
                  />
                </TablePremiumCell>
                <TablePremiumCell>
                  {apt.assigned_user ? (
                    <UserTooltip
                      userId={apt.assigned_to}
                      userName={apt.assigned_user.full_name}
                      userEmail={apt.assigned_user.email}
                      showStats={true}
                      showProfileLink={false}
                    >
                      <div className="inline-flex items-center gap-1.5 px-2 py-1 -mx-2 -my-1 rounded-md cursor-pointer transition-all duration-200 group hover:bg-primary/10 hover:text-primary hover:ring-2 hover:ring-primary/20 hover:ring-offset-1 hover:ring-offset-background">
                        <Shield className="h-3 w-3 text-muted-foreground group-hover:text-primary/70 transition-colors" />
                        <span className="text-sm font-medium">
                          {apt.assigned_user.full_name || apt.assigned_user.email.split('@')[0]}
                        </span>
                      </div>
                    </UserTooltip>
                  ) : (
                    <span className="text-sm text-muted-foreground">Unassigned</span>
                  )}
                </TablePremiumCell>
                <TablePremiumCell className="w-10">
                  {apt.status === 'arrived' && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center justify-center animate-pulse">
                            <div className="p-1.5 rounded-full bg-green-100 dark:bg-green-900/30">
                              <UserCheck className="h-4 w-4 text-green-600 dark:text-green-400" />
                            </div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Customer has arrived</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </TablePremiumCell>
                <TablePremiumCell className="text-right" onClick={(e) => e.stopPropagation()}>
                  {apt.status === 'converted' ? (
                    <Link
                      href={`/orders/${apt.converted_to_ticket_id}`}
                      className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
                      title="View ticket"
                    >
                      <FileText className="h-4 w-4" />
                      <span>View Ticket</span>
                    </Link>
                  ) : (
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/appointments/${apt.id}`}
                        className="p-1 rounded hover:bg-muted transition-colors"
                        title="View appointment"
                      >
                        <Eye className="h-4 w-4 text-muted-foreground hover:text-foreground" />
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
                          {apt.status === 'scheduled' && (
                            <DropdownMenuItem
                              onClick={() => handleStatusUpdate(apt.id, 'confirmed')}
                              className="text-green-600"
                            >
                              <CheckCheck className="mr-2 h-4 w-4" />
                              Confirm Appointment
                            </DropdownMenuItem>
                          )}
                          {apt.status === 'confirmed' && (
                            <DropdownMenuItem
                              onClick={() => handleStatusUpdate(apt.id, 'arrived')}
                              className="text-blue-600"
                            >
                              <User className="mr-2 h-4 w-4" />
                              Mark as Arrived
                            </DropdownMenuItem>
                          )}
                          {(apt.status === 'scheduled' || apt.status === 'confirmed' || apt.status === 'arrived') && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleConvert(apt.id)}
                                className="text-purple-600 font-medium"
                              >
                                <FileText className="mr-2 h-4 w-4" />
                                Convert to Ticket
                              </DropdownMenuItem>
                            </>
                          )}
                          {(apt.status === 'scheduled' || apt.status === 'confirmed') && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleStatusUpdate(apt.id, 'cancelled')}
                                className="text-red-600"
                              >
                                <X className="mr-2 h-4 w-4" />
                                Cancel Appointment
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  )}
                </TablePremiumCell>
              </TablePremiumRow>
            );
          })
        )}
      </TablePremiumBody>
    </TablePremium>
  );
};