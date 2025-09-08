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
import { Eye, FileText, MoreHorizontal, CheckCheck, User, X, Edit } from 'lucide-react';
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
}

export interface AppointmentsTableLiveProps {
  /** Initial appointments data for SSR */
  initialData?: Appointment[];
  /** Filter by status */
  statusFilter?: 'all' | 'scheduled' | 'confirmed' | 'arrived' | 'no_show' | 'cancelled' | 'converted';
  /** Filter by date */
  dateFilter?: 'all' | 'today' | 'upcoming' | 'past';
  /** Search query */
  searchQuery?: string;
  /** Show only appointments assigned to current user */
  showMyAppointments?: boolean;
  /** Current user ID for filtering */
  currentUserId?: string | null;
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
  limit,
  className,
  onStatusUpdate,
  onConvert,
}) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isMounted, setIsMounted] = React.useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = React.useState(false);
  const [isFirstLoad, setIsFirstLoad] = React.useState(true);

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
      setIsFirstLoad(false);
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

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(apt => apt.status === statusFilter);
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
  }, [appointments, statusFilter, dateFilter, searchQuery, showMyAppointments, currentUserId, limit]);

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

  // Show skeleton during initial load or when fetching (but not when we have data)
  const showSkeleton = !hasLoadedOnce || (isLoading && appointments.length === 0) || (isFetching && isFirstLoad);

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
                <div className="space-y-1">
                  <SkeletonPremium className="h-4 w-20" />
                  <SkeletonPremium className="h-3 w-16" />
                </div>
              </TablePremiumCell>
              <TablePremiumCell>
                <div className="space-y-1">
                  <SkeletonPremium className="h-4 w-32" />
                  <SkeletonPremium className="h-3 w-24" />
                </div>
              </TablePremiumCell>
              <TablePremiumCell>
                <SkeletonPremium className="h-4 w-28" />
              </TablePremiumCell>
              <TablePremiumCell>
                <SkeletonPremium className="h-6 w-20 rounded-full" />
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
            <TablePremiumCell colSpan={6} className="text-center py-8 text-muted-foreground">
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
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => router.push(`/appointments/${apt.id}`)}
              >
                <TablePremiumCell className="font-medium">
                  {apt.appointment_number}
                </TablePremiumCell>
                <TablePremiumCell>
                  <div className="space-y-1">
                    <div className="font-medium">{dateStr}</div>
                    <div className="text-sm text-muted-foreground">
                      {apt.scheduled_time} ({apt.duration_minutes} min)
                    </div>
                  </div>
                </TablePremiumCell>
                <TablePremiumCell>
                  <div className="space-y-1">
                    <div className="font-medium">{apt.customer_name}</div>
                    {apt.customer_phone && (
                      <div className="text-sm text-muted-foreground">{apt.customer_phone}</div>
                    )}
                  </div>
                </TablePremiumCell>
                <TablePremiumCell>
                  <div>
                    <div>{apt.device}</div>
                    {apt.issues.length > 0 && (
                      <div className="text-sm text-muted-foreground">
                        {apt.issues.map(issue => issue.replace('_', ' ')).join(', ')}
                      </div>
                    )}
                  </div>
                </TablePremiumCell>
                <TablePremiumCell>
                  <StatusBadge
                    type="appointment"
                    status={apt.status}
                    variant="soft"
                  />
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