"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageContainer } from "@/components/layout/page-container";
import { TicketsTableLive, TicketStatsLive } from "@/components/premium/connected/tickets";
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
  Package,
  Clock,
  Search,
  Users,
  UserCheck,
  Download,
  AlertCircle,
  CheckCircle2,
  PauseCircle,
  Filter,
  X,
} from "lucide-react";
import { useRealtime } from "@/lib/hooks/use-realtime";
import { getCurrentUserInfo } from "@/lib/utils/user-mapping";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

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
  created_at: string;
  updated_at: string;
  timer_total_minutes: number;
  assigned_to: string | null;
}

export function TicketsClientPremium({ tickets: initialTickets }: { tickets: Ticket[] }) {
  const router = useRouter();
  const [selectedTab, setSelectedTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showMyTickets, setShowMyTickets] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Additional filter states
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("all");
  const [deviceBrandFilter, setDeviceBrandFilter] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);

  // Set up real-time subscriptions
  useRealtime(['tickets']);

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
    // The TicketsTableLive component will handle its own data fetching
    setTimeout(() => setIsRefreshing(false), 1000);
    toast.success("Tickets refreshed");
  };

  const handleExport = () => {
    toast.info("Export functionality coming soon");
  };

  const handleStatusUpdate = async (ticketId: string, newStatus: string) => {
    toast.success(`Ticket status updated to ${newStatus}`);
  };

  // Filter management functions
  const clearAllFilters = () => {
    setSelectedTab("all");
    setSearchQuery("");
    setShowMyTickets(false);
    setPriorityFilter("all");
    setAssigneeFilter("all");
    setDeviceBrandFilter("all");
    toast.success("All filters cleared");
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (selectedTab !== "all") count++;
    if (searchQuery) count++;
    if (showMyTickets) count++;
    if (priorityFilter !== "all") count++;
    if (assigneeFilter !== "all") count++;
    if (deviceBrandFilter !== "all") count++;
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
      label: "Export",
      icon: <Download className="h-4 w-4" />,
      variant: "outline" as const,
      onClick: handleExport,
    },
    {
      label: "New Ticket",
      href: "/orders/new",
      icon: <Plus className="h-4 w-4" />,
      variant: "default" as const,
    },
  ];

  // Tab configurations
  const tabs = [
    { id: 'all', label: 'All Active', icon: <Package className="h-4 w-4" /> },
    { id: 'new', label: 'New', icon: <AlertCircle className="h-4 w-4" /> },
    { id: 'in_progress', label: 'In Progress', icon: <Clock className="h-4 w-4" /> },
    { id: 'on_hold', label: 'On Hold', icon: <PauseCircle className="h-4 w-4" /> },
    { id: 'completed', label: 'Completed', icon: <CheckCircle2 className="h-4 w-4" /> },
  ];

  // Map selected tab to status filter for the table
  const getStatusFilter = () => {
    if (selectedTab === 'all') return 'all';
    return selectedTab as any;
  };

  return (
    <PageContainer
      title="Tickets"
      description="Manage repair tickets and track their progress"
      actions={headerActions}
    >
      <div className="space-y-6">
        {/* Stats Cards - Using Premium Connected Components */}
        <div className="grid gap-4 md:grid-cols-6">
          <TicketStatsLive metric="total" />
          <TicketStatsLive metric="new" />
          <TicketStatsLive metric="in_progress" />
          <TicketStatsLive metric="on_hold" />
          <TicketStatsLive metric="completed" />
          <TicketStatsLive metric="today" />
        </div>

        {/* Tickets List Card with Premium Design */}
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
                      <Package className="h-4 w-4 text-primary" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 h-2 w-2 bg-green-500 rounded-full border-2 border-card" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-semibold">
                      Repair Tickets
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      Real-time ticket management
                      {showMyTickets && " • Showing your tickets"}
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
                  {/* My Tickets toggle */}
                  <ButtonPremium
                    variant={showMyTickets ? "gradient" : "outline"}
                    size="sm"
                    onClick={() => setShowMyTickets(!showMyTickets)}
                    className="h-9 gap-2"
                    disabled={!currentUserId}
                  >
                    {showMyTickets ? <UserCheck className="h-4 w-4" /> : <Users className="h-4 w-4" />}
                    {showMyTickets ? "My Tickets" : "All Tickets"}
                  </ButtonPremium>
                  
                  {/* Search bar */}
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search tickets..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8 w-[200px] h-9"
                    />
                  </div>
                </div>
              </div>

              {/* Advanced Filters */}
              {showFilters && (
                <div className="border-t bg-muted/30 -mx-6 px-6 py-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium">Advanced Filters</h4>
                    {hasActiveFilters && (
                      <ButtonPremium
                        variant="ghost"
                        size="sm"
                        onClick={clearAllFilters}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Clear All
                      </ButtonPremium>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Priority Filter */}
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground">Priority</label>
                      <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="All priorities" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Priorities</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="low">Low</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Assignee Filter */}
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground">Assignee</label>
                      <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="All assignees" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Assignees</SelectItem>
                          <SelectItem value="unassigned">Unassigned</SelectItem>
                          <SelectItem value="assigned">Assigned Only</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Device Brand Filter */}
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground">Device Brand</label>
                      <Select value={deviceBrandFilter} onValueChange={setDeviceBrandFilter}>
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="All brands" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Brands</SelectItem>
                          <SelectItem value="apple">Apple</SelectItem>
                          <SelectItem value="samsung">Samsung</SelectItem>
                          <SelectItem value="google">Google</SelectItem>
                          <SelectItem value="oneplus">OnePlus</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Active Filter Tags */}
                  {hasActiveFilters && (
                    <div className="flex flex-wrap gap-2">
                      <span className="text-xs text-muted-foreground">Active filters:</span>
                      {selectedTab !== "all" && (
                        <Badge variant="secondary" className="text-xs">
                          Status: {tabs.find(t => t.id === selectedTab)?.label}
                          <X
                            className="h-3 w-3 ml-1 cursor-pointer hover:text-destructive"
                            onClick={() => setSelectedTab("all")}
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
                      {showMyTickets && (
                        <Badge variant="secondary" className="text-xs">
                          My Tickets Only
                          <X
                            className="h-3 w-3 ml-1 cursor-pointer hover:text-destructive"
                            onClick={() => setShowMyTickets(false)}
                          />
                        </Badge>
                      )}
                      {priorityFilter !== "all" && (
                        <Badge variant="secondary" className="text-xs">
                          Priority: {priorityFilter}
                          <X
                            className="h-3 w-3 ml-1 cursor-pointer hover:text-destructive"
                            onClick={() => setPriorityFilter("all")}
                          />
                        </Badge>
                      )}
                      {assigneeFilter !== "all" && (
                        <Badge variant="secondary" className="text-xs">
                          Assignee: {assigneeFilter}
                          <X
                            className="h-3 w-3 ml-1 cursor-pointer hover:text-destructive"
                            onClick={() => setAssigneeFilter("all")}
                          />
                        </Badge>
                      )}
                      {deviceBrandFilter !== "all" && (
                        <Badge variant="secondary" className="text-xs">
                          Brand: {deviceBrandFilter}
                          <X
                            className="h-3 w-3 ml-1 cursor-pointer hover:text-destructive"
                            onClick={() => setDeviceBrandFilter("all")}
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
            <TicketsTableLive
              initialData={initialTickets}
              statusFilter={getStatusFilter()}
              searchQuery={searchQuery}
              showMyTickets={showMyTickets}
              currentUserId={currentUserId}
              priorityFilter={priorityFilter}
              assigneeFilter={assigneeFilter}
              deviceBrandFilter={deviceBrandFilter}
              onStatusUpdate={handleStatusUpdate}
            />
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}