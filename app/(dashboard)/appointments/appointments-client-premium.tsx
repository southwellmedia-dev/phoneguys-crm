"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageContainer } from "@/components/layout/page-container";
import { AppointmentsTableLive, AppointmentStatsLive } from "@/components/premium/connected/appointments";
import { ButtonPremium } from "@/components/premium/ui/buttons/button-premium";
import { TabNav } from "@/components/premium/ui/navigation/tab-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  Search,
  Users,
  UserCheck,
  Filter,
  X,
  CheckCheck,
} from "lucide-react";
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
  const [searchQuery, setSearchQuery] = useState("");
  const [showMyAppointments, setShowMyAppointments] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Simplified filter states - removed urgency
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [timeRangeFilter, setTimeRangeFilter] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);

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

  // Filter management functions
  const clearAllFilters = () => {
    setSelectedTab("upcoming");
    setSearchQuery("");
    setShowMyAppointments(false);
    setSourceFilter("all");
    setTimeRangeFilter("all");
    toast.success("Filters cleared");
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (selectedTab !== "upcoming") count++;
    if (searchQuery) count++;
    if (showMyAppointments) count++;
    if (sourceFilter !== "all") count++;
    if (timeRangeFilter !== "all") count++;
    return count;
  };

  const hasActiveFilters = getActiveFilterCount() > 0;

  const headerActions = [
    {
      label: isRefreshing ? "Refreshing..." : "Refresh",
      icon: <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />,
      variant: "outline" as const,
      onClick: handleRefresh,
      disabled: isRefreshing,
    },
    {
      label: showFilters ? "Hide Filters" : "Show Filters",
      icon: <Filter className="h-4 w-4" />,
      variant: (showFilters || hasActiveFilters) ? "gradient" : "outline" as const,
      onClick: () => setShowFilters(!showFilters),
      badge: hasActiveFilters ? getActiveFilterCount() : undefined,
    },
    {
      label: "New Appointment",
      href: "/appointments/new",
      icon: <Plus className="h-4 w-4" />,
      variant: "default" as const,
    },
  ];

  // Simplified tab configurations - only 4 tabs as requested
  const tabs = [
    { id: 'upcoming', label: 'Upcoming', icon: <Calendar className="h-4 w-4" />, description: 'Future appointments' },
    { id: 'converted', label: 'Converted', icon: <CheckCheck className="h-4 w-4" />, description: 'Converted to tickets' },
    { id: 'cancelled', label: 'Cancelled', icon: <X className="h-4 w-4" />, description: 'Cancelled appointments' },
    { id: 'all', label: 'All', description: 'All appointments' },
  ];

  // Map selected tab to date filter for the table
  const getDateFilter = () => {
    // Only upcoming tab uses date filtering
    if (selectedTab === 'upcoming') return 'upcoming';
    return 'all';
  };

  // Map selected tab to status filter for the table
  const getStatusFilterForTable = () => {
    switch (selectedTab) {
      case 'upcoming':
        // Show scheduled and confirmed appointments that are upcoming
        return 'scheduled,confirmed';
      case 'converted':
        return 'converted';
      case 'cancelled':
        return 'cancelled';
      case 'all':
      default:
        return 'all';
    }
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
              {/* Header with title - simplified like dashboard */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Calendar className="h-4 w-4 text-primary" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 h-2 w-2 bg-green-500 rounded-full border-2 border-card" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-semibold">
                      Appointment Schedule
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      Real-time appointment management
                      {showMyAppointments && " • Showing your appointments"}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Tabs and Search */}
              <div className="flex items-center justify-between gap-4">
                <TabNav
                  tabs={tabs}
                  activeTab={selectedTab}
                  onTabChange={setSelectedTab}
                  variant="underline"
                  size="sm"
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

              {/* Simplified Advanced Filters - less clutter */}
              {showFilters && (
                <div className="border-t bg-muted/30 -mx-6 px-6 py-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium">Filters</h4>
                    {hasActiveFilters && (
                      <ButtonPremium
                        variant="ghost"
                        size="sm"
                        onClick={clearAllFilters}
                        className="text-muted-foreground hover:text-destructive h-7"
                      >
                        <X className="h-3 w-3 mr-1" />
                        Clear
                      </ButtonPremium>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Source Filter */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">Source</label>
                      <Select value={sourceFilter} onValueChange={setSourceFilter}>
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue placeholder="All sources" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Sources</SelectItem>
                          <SelectItem value="website">Website</SelectItem>
                          <SelectItem value="phone">Phone Call</SelectItem>
                          <SelectItem value="walk-in">Walk-in</SelectItem>
                          <SelectItem value="referral">Referral</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Time Range Filter */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">Time Slot</label>
                      <Select value={timeRangeFilter} onValueChange={setTimeRangeFilter}>
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue placeholder="All times" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Times</SelectItem>
                          <SelectItem value="morning">Morning (9-12)</SelectItem>
                          <SelectItem value="afternoon">Afternoon (12-5)</SelectItem>
                          <SelectItem value="evening">Evening (5-8)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Active Filter Tags */}
                  {hasActiveFilters && (
                    <div className="flex flex-wrap gap-2">
                      <span className="text-xs text-muted-foreground">Active filters:</span>
                      {selectedTab !== "upcoming" && (
                        <Badge variant="secondary" className="text-xs">
                          View: {tabs.find(t => t.id === selectedTab)?.label}
                          <X
                            className="h-3 w-3 ml-1 cursor-pointer hover:text-destructive"
                            onClick={() => setSelectedTab("upcoming")}
                          />
                        </Badge>
                      )}
                      {searchQuery && (
                        <Badge variant="secondary" className="text-xs">
                          Search: "{searchQuery}"
                          <X
                            className="h-3 w-3 ml-1 cursor-pointer hover:text-destructive"
                            onClick={() => setSearchQuery("")}
                          />
                        </Badge>
                      )}
                      {showMyAppointments && (
                        <Badge variant="secondary" className="text-xs">
                          My Appointments Only
                          <X
                            className="h-3 w-3 ml-1 cursor-pointer hover:text-destructive"
                            onClick={() => setShowMyAppointments(false)}
                          />
                        </Badge>
                      )}
                      {sourceFilter !== "all" && (
                        <Badge variant="secondary" className="text-xs">
                          Source: {sourceFilter}
                          <X
                            className="h-3 w-3 ml-1 cursor-pointer hover:text-destructive"
                            onClick={() => setSourceFilter("all")}
                          />
                        </Badge>
                      )}
                      {timeRangeFilter !== "all" && (
                        <Badge variant="secondary" className="text-xs">
                          Time: {timeRangeFilter}
                          <X
                            className="h-3 w-3 ml-1 cursor-pointer hover:text-destructive"
                            onClick={() => setTimeRangeFilter("all")}
                          />
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              )}
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
              sourceFilter={sourceFilter}
              timeRangeFilter={timeRangeFilter}
              onStatusUpdate={handleStatusUpdate}
              onConvert={handleConvertToTicket}
            />
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}