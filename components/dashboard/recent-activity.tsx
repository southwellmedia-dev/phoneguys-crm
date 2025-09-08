"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TabNav } from "@/components/premium/ui/navigation/tab-nav";
import {
  TablePremium,
  TablePremiumBody,
  TablePremiumCell,
  TablePremiumHead,
  TablePremiumHeader,
  TablePremiumRow,
  TablePremiumEmpty
} from "@/components/premium/ui/data-display/table-premium";
import { StatusBadge } from "@/components/premium/ui/badges/status-badge";
import { Activity, Package, Users, Calendar, ArrowRight, Clock, Phone, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface RecentActivityProps {
  orders?: any[];
  appointments?: any[];
  customers?: any[];
}

export function RecentActivity({ 
  orders = [], 
  appointments = [],
  customers = []
}: RecentActivityProps) {
  const router = useRouter();
  
  // Load saved preferences from localStorage
  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('recentActivity.activeTab') || "orders";
    }
    return "orders";
  });
  
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc' | null;
  }>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`recentActivity.sortConfig.${activeTab}`);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error('Failed to parse saved sort config:', e);
        }
      }
    }
    return { key: '', direction: null };
  });

  // Save activeTab to localStorage when it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('recentActivity.activeTab', activeTab);
    }
  }, [activeTab]);

  // Save sortConfig to localStorage when it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(
        `recentActivity.sortConfig.${activeTab}`,
        JSON.stringify(sortConfig)
      );
    }
  }, [sortConfig, activeTab]);

  const handleSort = (key: string) => {
    setSortConfig(prev => {
      const newConfig = {
        key,
        direction: 
          prev.key === key 
            ? prev.direction === 'asc' 
              ? 'desc' as const
              : prev.direction === 'desc' 
                ? null 
                : 'asc' as const
            : 'asc' as const
      };
      return newConfig;
    });
  };

  const getSortIcon = (key: string) => {
    if (sortConfig.key !== key || !sortConfig.direction) {
      return <ArrowUpDown className="h-3 w-3 ml-1 opacity-30" />;
    }
    return sortConfig.direction === 'asc' 
      ? <ArrowUp className="h-3 w-3 ml-1" />
      : <ArrowDown className="h-3 w-3 ml-1" />;
  };

  // Utility function to clear all saved preferences (can be called from dev tools if needed)
  const clearSavedPreferences = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('recentActivity.activeTab');
      ['orders', 'appointments', 'customers'].forEach(tab => {
        localStorage.removeItem(`recentActivity.sortConfig.${tab}`);
      });
      setSortConfig({ key: '', direction: null });
    }
  };

  // Sort data based on current sort configuration
  const sortedOrders = useMemo(() => {
    if (!sortConfig.key || !sortConfig.direction) return orders;
    
    return [...orders].sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];
      
      // Handle nested properties
      if (sortConfig.key === 'customer') {
        aVal = a.customers?.full_name || a.customer_name || '';
        bVal = b.customers?.full_name || b.customer_name || '';
      }
      
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [orders, sortConfig]);

  const sortedAppointments = useMemo(() => {
    if (!sortConfig.key || !sortConfig.direction) return appointments;
    
    return [...appointments].sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];
      
      // Handle date sorting
      if (sortConfig.key === 'date') {
        aVal = new Date(a.appointment_date).getTime();
        bVal = new Date(b.appointment_date).getTime();
      }
      
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [appointments, sortConfig]);

  const sortedCustomers = useMemo(() => {
    if (!sortConfig.key || !sortConfig.direction) return customers;
    
    return [...customers].sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];
      
      // Handle name sorting
      if (sortConfig.key === 'name') {
        aVal = a.full_name || a.name || '';
        bVal = b.full_name || b.name || '';
      }
      
      // Handle repair count sorting
      if (sortConfig.key === 'repairs') {
        aVal = a.repair_tickets?.length || 0;
        bVal = b.repair_tickets?.length || 0;
      }
      
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [customers, sortConfig]);

  const tabs = [
    { 
      id: "orders", 
      label: "Tickets", 
      count: orders.length,
      icon: <Package className="h-3.5 w-3.5" />
    },
    { 
      id: "appointments", 
      label: "Appointments", 
      count: appointments.length,
      icon: <Calendar className="h-3.5 w-3.5" />
    },
    { 
      id: "customers", 
      label: "Customers", 
      count: customers.length,
      icon: <Users className="h-3.5 w-3.5" />
    }
  ];

  const getTicketStatus = (status: string) => {
    // Map database status to badge status
    switch (status) {
      case "new": return "new";
      case "in_progress": return "inProgress";
      case "completed": return "completed";
      case "on_hold": return "onHold";
      case "cancelled": return "cancelled";
      default: return "inactive";
    }
  };

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Activity className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
              <p className="text-sm text-muted-foreground mt-0.5">
                Live updates across your system
              </p>
            </div>
          </div>
          <Link 
            href={`/${activeTab}`}
            className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
          >
            View all
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <TabNav
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={(tab) => {
            setActiveTab(tab);
            // Load saved sort config for the new tab
            if (typeof window !== 'undefined') {
              const saved = localStorage.getItem(`recentActivity.sortConfig.${tab}`);
              if (saved) {
                try {
                  setSortConfig(JSON.parse(saved));
                } catch (e) {
                  setSortConfig({ key: '', direction: null });
                }
              } else {
                setSortConfig({ key: '', direction: null });
              }
            }
          }}
          variant="underline"
          size="sm"
        />

        {activeTab === "orders" && (
          <TablePremium>
            <TablePremiumHeader>
              <TablePremiumRow>
                <TablePremiumHead 
                  onClick={() => handleSort('ticket_number')}
                  className="cursor-pointer hover:bg-muted/50 select-none"
                >
                  <div className="flex items-center">
                    Order # {getSortIcon('ticket_number')}
                  </div>
                </TablePremiumHead>
                <TablePremiumHead 
                  onClick={() => handleSort('customer')}
                  className="cursor-pointer hover:bg-muted/50 select-none"
                >
                  <div className="flex items-center">
                    Customer {getSortIcon('customer')}
                  </div>
                </TablePremiumHead>
                <TablePremiumHead>Device</TablePremiumHead>
                <TablePremiumHead 
                  onClick={() => handleSort('status')}
                  className="cursor-pointer hover:bg-muted/50 select-none"
                >
                  <div className="flex items-center">
                    Status {getSortIcon('status')}
                  </div>
                </TablePremiumHead>
                <TablePremiumHead align="right">Actions</TablePremiumHead>
              </TablePremiumRow>
            </TablePremiumHeader>
            <TablePremiumBody>
              {sortedOrders.length > 0 ? (
                sortedOrders.slice(0, 10).map((order) => (
                  <TablePremiumRow 
                    key={order.id} 
                    clickable
                    onClick={() => router.push(`/orders/${order.id}`)}
                    className="cursor-pointer"
                  >
                    <TablePremiumCell className="font-medium">
                      #{order.ticket_number || order.id?.slice(-6) || "000000"}
                    </TablePremiumCell>
                    <TablePremiumCell>
                      {order.customers?.full_name || order.customer_name || "Unknown Customer"}
                    </TablePremiumCell>
                    <TablePremiumCell muted>
                      {order.devices?.brand && order.devices?.model 
                        ? `${order.devices.brand} ${order.devices.model}`
                        : order.device_model || "No device"}
                    </TablePremiumCell>
                    <TablePremiumCell>
                      <StatusBadge 
                        status={getTicketStatus(order.status)} 
                        size="xs"
                        variant="soft"
                      />
                    </TablePremiumCell>
                    <TablePremiumCell align="right">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/orders/${order.id}`}
                          className="p-1 rounded hover:bg-muted transition-colors"
                          title="View order"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <svg className="h-4 w-4 text-muted-foreground hover:text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </Link>
                        <Link
                          href={`/orders/${order.id}/edit`}
                          className="p-1 rounded hover:bg-muted transition-colors"
                          title="Edit order"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <svg className="h-4 w-4 text-muted-foreground hover:text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </Link>
                      </div>
                    </TablePremiumCell>
                  </TablePremiumRow>
                ))
              ) : (
                <TablePremiumRow>
                  <TablePremiumCell colSpan={5}>
                    <TablePremiumEmpty 
                      message="No recent orders"
                      description="Orders will appear here as they're created"
                      icon={<Package className="h-8 w-8" />}
                    />
                  </TablePremiumCell>
                </TablePremiumRow>
              )}
            </TablePremiumBody>
          </TablePremium>
        )}

        {activeTab === "appointments" && (
          <TablePremium>
            <TablePremiumHeader>
              <TablePremiumRow>
                <TablePremiumHead 
                  onClick={() => handleSort('date')}
                  className="cursor-pointer hover:bg-muted/50 select-none"
                >
                  <div className="flex items-center">
                    Date & Time {getSortIcon('date')}
                  </div>
                </TablePremiumHead>
                <TablePremiumHead 
                  onClick={() => handleSort('customer_name')}
                  className="cursor-pointer hover:bg-muted/50 select-none"
                >
                  <div className="flex items-center">
                    Customer {getSortIcon('customer_name')}
                  </div>
                </TablePremiumHead>
                <TablePremiumHead>Services</TablePremiumHead>
                <TablePremiumHead 
                  onClick={() => handleSort('status')}
                  className="cursor-pointer hover:bg-muted/50 select-none"
                >
                  <div className="flex items-center">
                    Status {getSortIcon('status')}
                  </div>
                </TablePremiumHead>
              </TablePremiumRow>
            </TablePremiumHeader>
            <TablePremiumBody>
              {sortedAppointments.length > 0 ? (
                sortedAppointments.slice(0, 10).map((apt) => (
                  <TablePremiumRow 
                    key={apt.id} 
                    clickable
                    onClick={() => router.push(`/appointments/${apt.id}`)}
                    className="cursor-pointer"
                  >
                    <TablePremiumCell className="font-medium">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm">
                          {new Date(apt.appointment_date).toLocaleDateString([], { 
                            month: 'short', 
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(apt.appointment_date).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </span>
                      </div>
                    </TablePremiumCell>
                    <TablePremiumCell>
                      {apt.customer_name || "Unknown"}
                    </TablePremiumCell>
                    <TablePremiumCell>
                      <div className="flex flex-wrap gap-1">
                        {apt.services && apt.services.length > 0 ? (
                          apt.services.map((service: any, idx: number) => (
                            <span 
                              key={idx}
                              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary"
                            >
                              {service.name || service}
                            </span>
                          ))
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                            General Repair
                          </span>
                        )}
                      </div>
                    </TablePremiumCell>
                    <TablePremiumCell>
                      <StatusBadge 
                        status={apt.status} 
                        size="xs"
                        variant="soft"
                      />
                    </TablePremiumCell>
                  </TablePremiumRow>
                ))
              ) : (
                <TablePremiumRow>
                  <TablePremiumCell colSpan={4}>
                    <TablePremiumEmpty 
                      message="No recent appointments"
                      description="Upcoming appointments will show here"
                      icon={<Calendar className="h-8 w-8" />}
                    />
                  </TablePremiumCell>
                </TablePremiumRow>
              )}
            </TablePremiumBody>
          </TablePremium>
        )}

        {activeTab === "customers" && (
          <TablePremium>
            <TablePremiumHeader>
              <TablePremiumRow>
                <TablePremiumHead 
                  onClick={() => handleSort('name')}
                  className="cursor-pointer hover:bg-muted/50 select-none"
                >
                  <div className="flex items-center">
                    Name {getSortIcon('name')}
                  </div>
                </TablePremiumHead>
                <TablePremiumHead>Phone</TablePremiumHead>
                <TablePremiumHead 
                  onClick={() => handleSort('repairs')}
                  className="cursor-pointer hover:bg-muted/50 select-none"
                >
                  <div className="flex items-center">
                    Orders {getSortIcon('repairs')}
                  </div>
                </TablePremiumHead>
                <TablePremiumHead 
                  onClick={() => handleSort('created_at')}
                  className="cursor-pointer hover:bg-muted/50 select-none"
                >
                  <div className="flex items-center">
                    Joined {getSortIcon('created_at')}
                  </div>
                </TablePremiumHead>
              </TablePremiumRow>
            </TablePremiumHeader>
            <TablePremiumBody>
              {sortedCustomers.length > 0 ? (
                sortedCustomers.slice(0, 10).map((customer) => (
                  <TablePremiumRow 
                    key={customer.id} 
                    clickable
                    onClick={() => router.push(`/customers/${customer.id}`)}
                    className="cursor-pointer"
                  >
                    <TablePremiumCell className="font-medium">
                      {customer.full_name || customer.name || "Unknown"}
                    </TablePremiumCell>
                    <TablePremiumCell>
                      <div className="flex items-center gap-2">
                        <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                        {customer.phone || "No phone"}
                      </div>
                    </TablePremiumCell>
                    <TablePremiumCell highlight="primary">
                      {customer.repair_tickets?.length || 0}
                    </TablePremiumCell>
                    <TablePremiumCell muted>
                      {customer.created_at ? new Date(customer.created_at).toLocaleDateString() : "N/A"}
                    </TablePremiumCell>
                  </TablePremiumRow>
                ))
              ) : (
                <TablePremiumRow>
                  <TablePremiumCell colSpan={4}>
                    <TablePremiumEmpty 
                      message="No recent customers"
                      description="New customers will appear here"
                      icon={<Users className="h-8 w-8" />}
                    />
                  </TablePremiumCell>
                </TablePremiumRow>
              )}
            </TablePremiumBody>
          </TablePremium>
        )}
      </CardContent>
    </Card>
  );
}