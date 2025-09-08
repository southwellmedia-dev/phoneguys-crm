'use client';

import { useQuery } from '@tanstack/react-query';

interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  pendingOrders: number;
  averageRepairTime: number;
  revenueChange: number;
  ordersChange: number;
  pendingChange: number;
  repairTimeChange: number;
}

interface RecentTicket {
  id: string;
  ticket_number: string;
  device_info: string;
  customer_name: string;
  status: string;
  created_at: string;
  timer_running: boolean;
  total_time_minutes: number;
}

interface DashboardData {
  stats: DashboardStats;
  recentTickets: RecentTicket[];
  todaysAppointments: any[];
}

export function useDashboard(initialData?: any) {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const response = await fetch('/api/reports/dashboard');
      if (!response.ok) throw new Error('Failed to fetch dashboard data');
      return response.json() as Promise<DashboardData>;
    },
    initialData,
    enabled: !initialData, // Only fetch if no initial data
    refetchInterval: initialData ? 30000 : undefined, // Only refetch if using real-time data
    refetchOnWindowFocus: false,
    staleTime: 10000, // Consider data stale after 10 seconds
  });
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      try {
        // Get real data directly from Supabase
        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();
        
        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        
        // Get total orders
        const { count: totalOrders } = await supabase
          .from('repair_tickets')
          .select('*', { count: 'exact', head: true });
        
        // Get pending orders
        const { count: pendingOrders } = await supabase
          .from('repair_tickets')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending');
        
        // Get completed today
        const { count: completedToday } = await supabase
          .from('repair_tickets')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'completed')
          .gte('updated_at', today);
        
        // Get average repair time (in minutes)
        const { data: timeData } = await supabase
          .from('repair_tickets')
          .select('total_time_minutes')
          .eq('status', 'completed')
          .not('total_time_minutes', 'is', null);
        
        const avgTime = timeData?.length 
          ? Math.round(timeData.reduce((acc, t) => acc + (t.total_time_minutes || 0), 0) / timeData.length)
          : 0;
        
        // Get yesterday's data for comparison
        const { count: yesterdayOrders } = await supabase
          .from('repair_tickets')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', yesterday)
          .lt('created_at', today);
        
        const ordersChange = yesterdayOrders 
          ? Math.round(((totalOrders || 0) - yesterdayOrders) / yesterdayOrders * 100)
          : 0;
        
        return {
          totalRevenue: 0, // Not tracking revenue yet
          totalOrders: totalOrders || 0,
          pendingOrders: pendingOrders || 0,
          averageRepairTime: avgTime,
          revenueChange: 0,
          ordersChange,
          pendingChange: 0,
          repairTimeChange: 0,
          completedToday: completedToday || 0,
          averageOrderValue: 0,
          customerSatisfaction: 0,
          averageValueChange: 0,
          satisfactionChange: 0
        };
      } catch (error) {
        // Return default stats on error
        return {
          totalRevenue: 0,
          totalOrders: 0,
          pendingOrders: 0,
          averageRepairTime: 0,
          revenueChange: 0,
          ordersChange: 0,
          pendingChange: 0,
          repairTimeChange: 0,
          completedToday: 0,
          averageOrderValue: 0,
          customerSatisfaction: 0,
          averageValueChange: 0,
          satisfactionChange: 0
        } as DashboardStats;
      }
    },
    refetchInterval: 30000,
    staleTime: 10000,
  });
}

export function useRecentTickets() {
  return useQuery({
    queryKey: ['recent-tickets'],
    queryFn: async () => {
      try {
        // Get real ticket data directly from Supabase
        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();
        
        const { data, error } = await supabase
          .from('repair_tickets')
          .select(`
            id,
            ticket_number,
            device_brand,
            device_model,
            repair_issues,
            description,
            status,
            created_at,
            is_timer_running,
            total_time_minutes,
            customers:customers!customer_id (
              id,
              name
            )
          `)
          .order('created_at', { ascending: false })
          .limit(20);
        
        if (error) {
          console.error('Error fetching recent tickets:', error);
          return [];
        }
        
        // Transform to match expected format
        return (data || []).map(ticket => ({
          id: ticket.id,
          ticket_number: ticket.ticket_number,
          device_info: `${ticket.device_brand || 'Unknown'} ${ticket.device_model || 'Device'}`,
          repair_issues: ticket.repair_issues || [],
          description: ticket.description || '',
          customer_name: ticket.customers?.name || 'Unknown Customer',
          status: ticket.status,
          created_at: ticket.created_at,
          timer_running: ticket.is_timer_running || false,
          total_time_minutes: ticket.total_time_minutes || 0
        })) as RecentTicket[];
      } catch (error) {
        console.error('Error in useRecentTickets:', error);
        return [] as RecentTicket[];
      }
    },
    refetchInterval: 10000, // More frequent updates for recent tickets
    staleTime: 5000,
  });
}

export function useTodaysAppointments() {
  return useQuery({
    queryKey: ['todays-appointments'],
    queryFn: async () => {
      try {
        // Import and use the repository directly for internal access
        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();
        
        const today = new Date().toISOString().split('T')[0];
        
        const { data, error } = await supabase
          .from('appointments')
          .select(`
            *,
            customers:customer_id (
              id,
              name,
              email,
              phone
            )
          `)
          .eq('scheduled_date', today)
          .order('scheduled_time', { ascending: true });
        
        if (error) {
          console.error('Error fetching appointments:', error);
          return [];
        }
        
        // Transform data to ensure consistent structure
        return (data || []).map(appointment => ({
          ...appointment,
          customer_name: appointment.customers?.name || 'Unknown Customer',
          customer_phone: appointment.customers?.phone || null,
          customer_email: appointment.customers?.email || null
        }));
      } catch (error) {
        console.error('Error in useTodaysAppointments:', error);
        return [];
      }
    },
    refetchInterval: 60000, // Refetch every minute
    staleTime: 30000,
  });
}