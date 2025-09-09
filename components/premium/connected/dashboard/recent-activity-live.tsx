/**
 * RecentActivityLive - Real-time activity feed component
 * 
 * @description Connected version of recent activity with live updates and filtering
 * @category Connected/Dashboard
 * 
 * @example
 * ```tsx
 * <RecentActivityLive 
 *   title="Recent Activity"
 *   limit={10}
 *   showTabs
 * />
 * ```
 */

'use client';

import * as React from 'react';
import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TabNav } from '@/components/premium/ui/navigation/tab-nav';
import { TablePremiumLive, type TableColumn } from '../data-display/table-premium-live';
import { StatusBadgeLive } from '../badges/status-badge-live';
import { SkeletonTable } from '@/components/premium/ui/feedback/skeleton-premium';
import { Pills } from '../../ui/pills/pill';
import { useActivityFeed, type ActivityFilters } from '@/lib/hooks/connected/use-activity-feed';
import { useTickets } from '@/lib/hooks/use-tickets';
import { useQuery } from '@tanstack/react-query';
import { 
  Activity, 
  Package, 
  Users, 
  Calendar, 
  ArrowRight,
  Phone,
  Eye,
  Edit,
  Filter
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export interface RecentActivityLiveProps {
  /** Title for the activity card */
  title?: string;
  /** Subtitle/description */
  subtitle?: string;
  /** Maximum number of items to display */
  limit?: number;
  /** Show tab navigation for different activity types */
  showTabs?: boolean;
  /** Default active tab */
  defaultTab?: 'orders' | 'appointments' | 'customers' | 'all';
  /** Custom filters to apply */
  filters?: ActivityFilters;
  /** Custom className */
  className?: string;
  /** Show "View all" link */
  showViewAll?: boolean;
}

interface TabConfig {
  id: string;
  label: string;
  icon: React.ReactNode;
  count?: number;
  endpoint: string;
  queryKey: string[];
  basePath: string;
  columns: TableColumn[];
}

export const RecentActivityLive = React.forwardRef<HTMLDivElement, RecentActivityLiveProps>(
  ({
    title = "Recent Activity",
    subtitle = "Live updates across your system",
    limit = 10,
    showTabs = true,
    defaultTab = 'orders',
    filters,
    className,
    showViewAll = true
  }, ref) => {
    const router = useRouter();
    
    // Load saved preferences from localStorage
    const [activeTab, setActiveTab] = useState(() => {
      if (typeof window !== 'undefined' && showTabs) {
        return localStorage.getItem('recentActivity.activeTab') || defaultTab;
      }
      return defaultTab;
    });

    // Filter states
    const [hideCompletedTickets, setHideCompletedTickets] = useState(() => {
      if (typeof window !== 'undefined') {
        return localStorage.getItem('recentActivity.hideCompletedTickets') === 'true';
      }
      return false;
    });

    const [hideConvertedAppointments, setHideConvertedAppointments] = useState(() => {
      if (typeof window !== 'undefined') {
        return localStorage.getItem('recentActivity.hideConvertedAppointments') === 'true';
      }
      return false;
    });

    // Save activeTab to localStorage when it changes
    React.useEffect(() => {
      if (typeof window !== 'undefined' && showTabs) {
        localStorage.setItem('recentActivity.activeTab', activeTab);
      }
    }, [activeTab, showTabs]);

    // Save filter preferences
    React.useEffect(() => {
      if (typeof window !== 'undefined') {
        localStorage.setItem('recentActivity.hideCompletedTickets', hideCompletedTickets.toString());
      }
    }, [hideCompletedTickets]);

    React.useEffect(() => {
      if (typeof window !== 'undefined') {
        localStorage.setItem('recentActivity.hideConvertedAppointments', hideConvertedAppointments.toString());
      }
    }, [hideConvertedAppointments]);

    // Fetch data for tab counts
    const { data: ordersData } = useQuery({
      queryKey: ['orders', { limit: limit }],
      queryFn: async () => {
        const response = await fetch(`/api/orders?limit=${limit}`);
        if (!response.ok) throw new Error('Failed to fetch orders');
        const result = await response.json();
        return result.data || [];
      },
      staleTime: 2 * 60 * 1000,
    });

    const { data: appointmentsData } = useQuery({
      queryKey: ['appointments', { limit: limit }],
      queryFn: async () => {
        const response = await fetch(`/api/appointments?limit=${limit}`);
        if (!response.ok) throw new Error('Failed to fetch appointments');
        const result = await response.json();
        return result.data || [];
      },
      staleTime: 2 * 60 * 1000,
    });

    const { data: customersData } = useQuery({
      queryKey: ['customers', { limit: limit }],
      queryFn: async () => {
        const response = await fetch(`/api/customers?limit=${limit}`);
        if (!response.ok) throw new Error('Failed to fetch customers');
        const result = await response.json();
        return result.data || [];
      },
      staleTime: 2 * 60 * 1000,
    });

    // Apply filters to data
    const filteredOrdersData = useMemo(() => {
      if (!ordersData) return [];
      if (hideCompletedTickets) {
        return ordersData.filter((order: any) => order.status !== 'completed');
      }
      return ordersData;
    }, [ordersData, hideCompletedTickets]);

    const filteredAppointmentsData = useMemo(() => {
      if (!appointmentsData) return [];
      if (hideConvertedAppointments) {
        return appointmentsData.filter((apt: any) => apt.status !== 'converted');
      }
      return appointmentsData;
    }, [appointmentsData, hideConvertedAppointments]);

    // Define tab configurations
    const tabs: TabConfig[] = useMemo(() => [
      {
        id: 'orders',
        label: 'Tickets',
        icon: <Package className="h-3.5 w-3.5" />,
        count: filteredOrdersData?.length || 0,
        endpoint: '/api/orders',
        queryKey: ['orders-activity'],
        basePath: '/orders',
        columns: [
          {
            key: 'ticket_number',
            label: 'Order #',
            sortable: true,
            render: (value, row: any) => `#${value || row.id?.slice(-6) || "000000"}`
          },
          {
            key: 'customer_name',
            label: 'Customer',
            sortable: true,
            render: (value, row: any) => row.customers?.full_name || row.customer_name || "Unknown Customer"
          },
          {
            key: 'device_model',
            label: 'Device',
            render: (value, row: any) => {
              if (row.devices?.brand && row.devices?.model) {
                return `${row.devices.brand} ${row.devices.model}`;
              }
              return row.device_model || "No device";
            }
          },
          {
            key: 'status',
            label: 'Status',
            sortable: true,
            render: (value, row: any) => (
              <StatusBadgeLive 
                resourceType="ticket"
                resourceId={row.id}
                fallbackStatus={mapTicketStatus(value)}
                size="xs"
                variant="soft"
              />
            )
          },
          {
            key: 'actions',
            label: 'Actions',
            align: 'right' as const,
            render: (value, row: any) => (
              <div className="flex items-center justify-end gap-1">
                <Link
                  href={`/orders/${row.id}`}
                  className="p-1 rounded hover:bg-muted transition-colors"
                  title="View order"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Eye className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                </Link>
                <Link
                  href={`/orders/${row.id}/edit`}
                  className="p-1 rounded hover:bg-muted transition-colors"
                  title="Edit order"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Edit className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                </Link>
              </div>
            )
          }
        ]
      },
      {
        id: 'appointments',
        label: 'Appointments',
        icon: <Calendar className="h-3.5 w-3.5" />,
        count: filteredAppointmentsData?.length || 0,
        endpoint: '/api/appointments',
        queryKey: ['appointments-activity'],
        basePath: '/appointments',
        columns: [
          {
            key: 'appointment_date',
            label: 'Date & Time',
            sortable: true,
            render: (value) => (
              <div className="flex flex-col gap-0.5">
                <span className="text-sm">
                  {new Date(value).toLocaleDateString([], { 
                    month: 'short', 
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </span>
                <span className="text-xs text-muted-foreground">
                  {new Date(value).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </span>
              </div>
            )
          },
          {
            key: 'customer_name',
            label: 'Customer',
            sortable: true,
            render: (value) => value || "Unknown"
          },
          {
            key: 'services',
            label: 'Services',
            render: (value) => (
              <Pills 
                items={value && value.length > 0 
                  ? value.map((service: any) => ({ 
                      text: service.name || service, 
                      type: 'service' as const 
                    }))
                  : [{ text: 'General Repair', type: 'service' as const }]
                }
                maxVisible={2}
                type="service"
              />
            )
          },
          {
            key: 'status',
            label: 'Status',
            sortable: true,
            render: (value, row: any) => (
              <StatusBadgeLive 
                resourceType="appointment"
                resourceId={row.id}
                fallbackStatus={value}
                size="xs"
                variant="soft"
              />
            )
          }
        ]
      },
      {
        id: 'customers',
        label: 'Customers',
        icon: <Users className="h-3.5 w-3.5" />,
        count: customersData?.length || 0,
        endpoint: '/api/customers',
        queryKey: ['customers-activity'],
        basePath: '/customers',
        columns: [
          {
            key: 'full_name',
            label: 'Name',
            sortable: true,
            render: (value, row: any) => row.full_name || row.name || "Unknown"
          },
          {
            key: 'phone',
            label: 'Phone',
            render: (value) => (
              <div className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                {value || "No phone"}
              </div>
            )
          },
          {
            key: 'repair_tickets',
            label: 'Orders',
            render: (value) => value?.length || 0,
            className: "text-primary font-medium"
          },
          {
            key: 'created_at',
            label: 'Joined',
            sortable: true,
            render: (value) => value ? new Date(value).toLocaleDateString() : "N/A",
            className: "text-muted-foreground"
          }
        ]
      }
    ], [filteredOrdersData, filteredAppointmentsData, customersData]);

    // Helper function to map ticket status
    const mapTicketStatus = (status: string) => {
      switch (status) {
        case "new": return "new";
        case "in_progress": return "inProgress";
        case "completed": return "completed";
        case "on_hold": return "onHold";
        case "cancelled": return "cancelled";
        default: return "inactive";
      }
    };

    const activeTabConfig = tabs.find(tab => tab.id === activeTab) || tabs[0];

    return (
      <Card ref={ref} className={cn("border-border/50 shadow-sm", className)}>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Activity className="h-4 w-4 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold">{title}</CardTitle>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {subtitle}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {activeTab === 'orders' && (
                <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                  <Checkbox
                    checked={hideCompletedTickets}
                    onCheckedChange={(checked) => setHideCompletedTickets(!!checked)}
                    className="h-4 w-4"
                  />
                  Hide Completed
                </label>
              )}
              {activeTab === 'appointments' && (
                <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                  <Checkbox
                    checked={hideConvertedAppointments}
                    onCheckedChange={(checked) => setHideConvertedAppointments(!!checked)}
                    className="h-4 w-4"
                  />
                  Hide Converted
                </label>
              )}
              {showViewAll && (
                <Link 
                  href={`/${activeTab}`}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
                >
                  View all
                  <ArrowRight className="h-3 w-3" />
                </Link>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {showTabs && (
            <TabNav
              tabs={tabs.map(tab => ({
                id: tab.id,
                label: tab.label,
                count: tab.count,
                icon: tab.icon
              }))}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              variant="underline"
              size="sm"
            />
          )}

          <TablePremiumLive
            endpoint={activeTabConfig.endpoint}
            queryKey={[
              ...activeTabConfig.queryKey, 
              { 
                limit,
                ...(activeTab === 'orders' && hideCompletedTickets ? { excludeStatus: 'completed' } : {}),
                ...(activeTab === 'appointments' && hideConvertedAppointments ? { excludeStatus: 'converted' } : {})
              }
            ]}
            columns={activeTabConfig.columns}
            filters={{ 
              limit,
              ...(activeTab === 'orders' && hideCompletedTickets ? { excludeStatus: 'completed' } : {}),
              ...(activeTab === 'appointments' && hideConvertedAppointments ? { excludeStatus: 'converted' } : {})
            }}
            clickable
            basePath={activeTabConfig.basePath}
            emptyState={{
              message: `No recent ${activeTabConfig.label.toLowerCase()}`,
              description: `${activeTabConfig.label} will appear here as they're created`,
              icon: activeTabConfig.icon
            }}
          />
        </CardContent>
      </Card>
    );
  }
);

RecentActivityLive.displayName = 'RecentActivityLive';