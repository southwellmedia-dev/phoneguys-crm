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
      const response = await fetch('/api/reports/dashboard');
      if (!response.ok) throw new Error('Failed to fetch dashboard stats');
      const data = await response.json();
      return data.stats as DashboardStats;
    },
    refetchInterval: 30000,
    staleTime: 10000,
  });
}

export function useRecentTickets() {
  return useQuery({
    queryKey: ['recent-tickets'],
    queryFn: async () => {
      const response = await fetch('/api/reports/dashboard');
      if (!response.ok) throw new Error('Failed to fetch recent tickets');
      const data = await response.json();
      return data.recentTickets as RecentTicket[];
    },
    refetchInterval: 10000, // More frequent updates for recent tickets
    staleTime: 5000,
  });
}

export function useTodaysAppointments() {
  return useQuery({
    queryKey: ['todays-appointments'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const response = await fetch(`/api/appointments?date=${today}`);
      if (!response.ok) throw new Error('Failed to fetch today\'s appointments');
      return response.json();
    },
    refetchInterval: 60000, // Refetch every minute
    staleTime: 30000,
  });
}