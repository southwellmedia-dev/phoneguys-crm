"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageContainer } from "@/components/layout/page-container";
import { AppointmentsTableLive, AppointmentStatsLive } from "@/components/premium/connected/appointments";
import { ButtonPremium } from "@/components/premium/ui/buttons/button-premium";
import { TabNav } from "@/components/premium/ui/navigation/tab-nav";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  RefreshCw,
  Plus,
  Calendar,
  Clock,
  Filter,
  ArrowUpDown,
  Search,
  Users,
  UserCheck,
  Columns,
  ChevronDown,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRealtime } from "@/lib/hooks/use-realtime";
import { getCurrentUserInfo } from "@/lib/utils/user-mapping";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

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

export function AppointmentsClientPremium({ appointments: initialAppointments }: { appointments: Appointment[] }) {
  const router = useRouter();
  const [selectedTab, setSelectedTab] = useState("upcoming");
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState("");
  const [showMyAppointments, setShowMyAppointments] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [columnVisibility, setColumnVisibility] = useState({
    appointment_number: true,
    datetime: true,
    customer_name: true,
    device: true,
    status: true,
    actions: true,
  });

  // Set up real-time subscriptions
  useRealtime(['appointments']);

  // Get current user ID on mount
  useEffect(() => {
    async function fetchUserId() {
      try {
        const supabase = createClient();
        const userInfo = await getCurrentUserInfo(supabase);
        if (userInfo) {
          setCurrentUserId(userInfo.appUserId);
        }
      } catch (error) {
        console.error('Failed to get user info:', error);
      }
    }
    fetchUserId();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // The AppointmentsTableLive component will handle its own data fetching
    setTimeout(() => setIsRefreshing(false), 1000);
    toast.success("Appointments refreshed");
  };

  const handleConvertToTicket = async (appointmentId: string) => {
    toast.success("Converting appointment to ticket...");
    router.push(`/appointments/${appointmentId}`);
  };

  const handleStatusUpdate = async (appointmentId: string, newStatus: string) => {
    toast.success(`Appointment status updated to ${newStatus}`);
  };

  const headerActions = [
    {
      label: isRefreshing ? "Refreshing..." : "Refresh",
      icon: <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />,
      variant: "outline" as const,
      onClick: handleRefresh,
      disabled: isRefreshing,
    },
    {
      label: "New Appointment",
      href: "/appointments/new",
      icon: <Plus className="h-4 w-4" />,
      variant: "default" as const,
    },
  ];

  // Tab configurations
  const tabs = [
    { id: 'upcoming', label: 'Upcoming', icon: <Calendar className="h-4 w-4" /> },
    { id: 'today', label: 'Today', icon: <Clock className="h-4 w-4" /> },
    { id: 'past', label: 'Past' },
    { id: 'converted', label: 'Converted' },
    { id: 'cancelled', label: 'Cancelled' },
    { id: 'all', label: 'All Active' },
  ];

  // Map selected tab to date filter for the table
  const getDateFilter = () => {
    switch (selectedTab) {
      case 'today': return 'today';
      case 'upcoming': return 'upcoming';
      case 'past': return 'past';
      case 'converted': 
      case 'cancelled':
      case 'all':
      default: return 'all';
    }
  };

  // Map selected tab to status filter for the table
  const getStatusFilterForTable = () => {
    if (selectedTab === 'converted') return 'converted';
    if (selectedTab === 'cancelled') return 'cancelled';
    if (statusFilter !== 'all' && selectedTab !== 'converted' && selectedTab !== 'cancelled') {
      return statusFilter as any;
    }
    return 'all';
  };

  return (
    <PageContainer
      title="Appointments"
      description="Manage customer appointments and bookings"
      actions={headerActions}
    >
      <div className="space-y-6">
        {/* Stats Cards - Using Premium Connected Components */}
        <div className="grid gap-4 md:grid-cols-4">
          <AppointmentStatsLive metric="today" />
          <AppointmentStatsLive metric="pending" />
          <AppointmentStatsLive metric="confirmed" />
          <AppointmentStatsLive metric="converted" />
        </div>

        {/* Appointments List Card with Premium Design */}
        <Card className="relative overflow-hidden">
          {/* Gradient accent */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-2xl" />
          
          <CardHeader className="pb-4">
            <div className="flex flex-col space-y-4">
              {/* Header with title and filter controls */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 backdrop-blur-sm">
                      <Calendar className="h-5 w-5 text-primary" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-green-500 rounded-full border-2 border-card animate-pulse" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                      Appointment Schedule
                    </CardTitle>
                    <CardDescription className="flex items-center gap-1 mt-0.5">
                      <Clock className="h-3 w-3" />
                      Real-time appointment management
                      {showMyAppointments && " • Showing your appointments"}
                    </CardDescription>
                  </div>
                </div>
                
                {/* Filter Controls */}
                <div className="flex items-center space-x-2">
                  {/* Status Filter - only show for non-status tabs */}
                  {selectedTab !== 'converted' && selectedTab !== 'cancelled' && (
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-[160px] h-9">
                        <Filter className="h-4 w-4 mr-2" />
                        <SelectValue placeholder="Filter status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="scheduled">Scheduled</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="arrived">Arrived</SelectItem>
                        <SelectItem value="no_show">No Show</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                  
                  {/* Columns selector */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <ButtonPremium variant="outline" size="sm" className="h-9 px-3">
                        <Columns className="h-4 w-4 mr-2" />
                        Columns
                        <ChevronDown className="ml-2 h-4 w-4" />
                      </ButtonPremium>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuCheckboxItem
                        checked={columnVisibility.appointment_number}
                        onCheckedChange={(checked) => 
                          setColumnVisibility(prev => ({ ...prev, appointment_number: checked }))
                        }
                      >
                        Appointment #
                      </DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem
                        checked={columnVisibility.datetime}
                        onCheckedChange={(checked) => 
                          setColumnVisibility(prev => ({ ...prev, datetime: checked }))
                        }
                      >
                        Date & Time
                      </DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem
                        checked={columnVisibility.customer_name}
                        onCheckedChange={(checked) => 
                          setColumnVisibility(prev => ({ ...prev, customer_name: checked }))
                        }
                      >
                        Customer
                      </DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem
                        checked={columnVisibility.device}
                        onCheckedChange={(checked) => 
                          setColumnVisibility(prev => ({ ...prev, device: checked }))
                        }
                      >
                        Device
                      </DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem
                        checked={columnVisibility.status}
                        onCheckedChange={(checked) => 
                          setColumnVisibility(prev => ({ ...prev, status: checked }))
                        }
                      >
                        Status
                      </DropdownMenuCheckboxItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  
                  {/* Sort Order */}
                  <Select value={sortOrder} onValueChange={(value) => setSortOrder(value as 'asc' | 'desc')}>
                    <SelectTrigger className="w-[160px] h-9">
                      <ArrowUpDown className="h-4 w-4 mr-2" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="asc">Soonest First</SelectItem>
                      <SelectItem value="desc">Latest First</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Tabs and Search */}
              <div className="flex items-center justify-between gap-4">
                <TabNav
                  tabs={tabs}
                  activeTab={selectedTab}
                  onTabChange={setSelectedTab}
                  variant="underline"
                />
                
                <div className="flex items-center gap-2">
                  {/* My Appointments toggle */}
                  <ButtonPremium
                    variant={showMyAppointments ? "gradient" : "outline"}
                    size="sm"
                    onClick={() => setShowMyAppointments(!showMyAppointments)}
                    className="h-9 gap-2"
                    disabled={!currentUserId}
                  >
                    {showMyAppointments ? <UserCheck className="h-4 w-4" /> : <Users className="h-4 w-4" />}
                    {showMyAppointments ? "My Appointments" : "All Appointments"}
                  </ButtonPremium>
                  
                  {/* Search bar */}
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search appointments..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8 w-[200px] h-9"
                    />
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="pt-0">
            <AppointmentsTableLive
              initialData={initialAppointments}
              statusFilter={getStatusFilterForTable()}
              dateFilter={getDateFilter()}
              searchQuery={searchQuery}
              showMyAppointments={showMyAppointments}
              currentUserId={currentUserId}
              onStatusUpdate={handleStatusUpdate}
              onConvert={handleConvertToTicket}
            />
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}