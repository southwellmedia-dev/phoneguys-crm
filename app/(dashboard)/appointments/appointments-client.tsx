"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAppointments, useUpdateAppointment } from "@/lib/hooks/use-appointments";
import { useRealtime } from "@/lib/hooks/use-realtime";
import { PageContainer } from "@/components/layout/page-container";
import { DataTable } from "@/components/tables/data-table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  ArrowRight,
  Phone,
  Mail,
  User,
  Eye,
  FileText,
  MoreHorizontal,
  CheckCheck,
  X,
  Filter,
  ArrowUpDown,
  ChevronDown,
  Columns,
  Search,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { format, isToday, isTomorrow, isPast, isFuture, parseISO } from "date-fns";
import { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import { useShowSkeleton } from "@/lib/hooks/use-navigation-loading";
import { SkeletonAppointments } from "@/components/ui/skeleton-appointments";

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
}

const statusConfig = {
  scheduled: { label: 'Scheduled', className: 'bg-blue-100 text-blue-800' },
  confirmed: { label: 'Confirmed', className: 'bg-green-100 text-green-800' },
  arrived: { label: 'Arrived', className: 'bg-purple-100 text-purple-800' },
  no_show: { label: 'No Show', className: 'bg-red-100 text-red-800' },
  cancelled: { label: 'Cancelled', className: 'bg-gray-100 text-gray-800' },
  converted: { label: 'Converted', className: 'bg-cyan-100 text-cyan-800' },
};

export function AppointmentsClient({ appointments: initialAppointments }: { appointments: Appointment[] }) {
  const router = useRouter();
  const { data: appointments = initialAppointments, isLoading, isFetching, refetch } = useAppointments(undefined, initialAppointments);
  const updateAppointment = useUpdateAppointment();
  const [selectedTab, setSelectedTab] = useState("upcoming");
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState("");
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
  
  // Determine if we should show skeleton
  const showSkeleton = useShowSkeleton(isLoading, isFetching, !!appointments);

  // Filter and sort appointments
  const filteredAppointments = useMemo(() => {
    const now = new Date();
    
    // Start with all appointments
    let filtered = [...appointments];
    
    // Apply status filter (but not for converted/cancelled tabs which have their own status logic)
    if (statusFilter !== 'all' && selectedTab !== 'converted' && selectedTab !== 'cancelled') {
      filtered = filtered.filter(apt => apt.status === statusFilter);
    }
    
    // Apply tab filter
    switch (selectedTab) {
      case "today":
        filtered = filtered.filter(apt => {
          if (apt.status === 'converted') return false; // Exclude converted from today
          const [year, month, day] = apt.scheduled_date.split('-');
          const aptDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
          return isToday(aptDate);
        });
        break;
      case "upcoming":
        filtered = filtered.filter(apt => {
          if (apt.status === 'converted') return false; // Exclude converted from upcoming
          const [year, month, day] = apt.scheduled_date.split('-');
          const aptDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
          return isFuture(aptDate) || isToday(aptDate);
        });
        break;
      case "past":
        filtered = filtered.filter(apt => {
          if (apt.status === 'converted') return false; // Exclude converted from past
          const [year, month, day] = apt.scheduled_date.split('-');
          const aptDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
          return isPast(aptDate) && !isToday(aptDate);
        });
        break;
      case "cancelled":
        filtered = filtered.filter(apt => apt.status === 'cancelled' || apt.status === 'no_show');
        break;
      case "converted":
        filtered = filtered.filter(apt => apt.status === 'converted');
        break;
      case "all":
        filtered = filtered.filter(apt => apt.status !== 'converted'); // Exclude converted from all
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
    
    // Sort by date and time
    filtered.sort((a, b) => {
      const dateA = new Date(`${a.scheduled_date}T${a.scheduled_time}`);
      const dateB = new Date(`${b.scheduled_date}T${b.scheduled_time}`);
      
      if (sortOrder === 'asc') {
        return dateA.getTime() - dateB.getTime();
      } else {
        return dateB.getTime() - dateA.getTime();
      }
    });
    
    return filtered;
  }, [appointments, selectedTab, sortOrder, statusFilter, searchQuery]);

  const allColumns: ColumnDef<Appointment>[] = [
    {
      id: "appointment_number",
      accessorKey: "appointment_number",
      header: "Appointment #",
      cell: ({ row }) => (
        <div className="font-medium">{row.original.appointment_number}</div>
      ),
    },
    {
      id: "datetime",
      header: "Date & Time",
      cell: ({ row }) => {
        // Parse date string as local date, not UTC
        const [year, month, day] = row.original.scheduled_date.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        
        const dateStr = isToday(date) ? "Today" : 
                       isTomorrow(date) ? "Tomorrow" : 
                       format(date, "MMM d, yyyy");
        
        return (
          <div className="space-y-1">
            <div className="font-medium">{dateStr}</div>
            <div className="text-sm text-muted-foreground">
              {row.original.scheduled_time} ({row.original.duration_minutes} min)
            </div>
          </div>
        );
      },
    },
    {
      id: "customer_name",
      accessorKey: "customer_name",
      header: "Customer",
      cell: ({ row }) => (
        <div className="space-y-1">
          <div className="font-medium">{row.original.customer_name}</div>
          {row.original.customer_phone && (
            <div className="text-sm text-muted-foreground">{row.original.customer_phone}</div>
          )}
        </div>
      ),
    },
    {
      id: "device",
      accessorKey: "device",
      header: "Device",
      cell: ({ row }) => (
        <div>
          <div>{row.original.device}</div>
          {row.original.issues.length > 0 && (
            <div className="text-sm text-muted-foreground">
              {row.original.issues.map(issue => issue.replace('_', ' ')).join(', ')}
            </div>
          )}
        </div>
      ),
    },
    {
      id: "status",
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = statusConfig[row.original.status];
        return <Badge className={status.className}>{status.label}</Badge>;
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const apt = row.original;
        
        if (apt.status === 'converted') {
          return (
            <Button
              variant="outline"
              size="sm"
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
              onClick={() => router.push(`/orders/${apt.converted_to_ticket_id}`)}
            >
              <FileText className="mr-1.5 h-3.5 w-3.5" />
              View Ticket
            </Button>
          );
        }
        
        return (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
              onClick={() => router.push(`/appointments/${apt.id}`)}
            >
              <Eye className="mr-1.5 h-3.5 w-3.5" />
              View
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="px-2"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
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
                      onClick={() => handleConvertToTicket(apt.id)}
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
        );
      },
    },
  ];

  // Filter columns based on visibility
  const columns = allColumns.filter(column => {
    if (!column.id) return true; // Always show columns without id (like actions)
    return columnVisibility[column.id as keyof typeof columnVisibility] !== false;
  });

  const handleConvertToTicket = async (appointmentId: string) => {
    // This would call a server action to convert the appointment
    toast.success("Converting appointment to ticket...");
    router.push(`/appointments/${appointmentId}`);
  };

  const handleStatusUpdate = async (appointmentId: string, newStatus: string) => {
    toast.success(`Updating appointment status to ${newStatus}...`);
    updateAppointment.mutate({ id: appointmentId, status: newStatus as any });
  };

  const handleRefresh = async () => {
    await refetch();
  };

  const headerActions = [
    {
      label: "Refresh",
      icon: <RefreshCw className="h-4 w-4" />,
      variant: "outline" as const,
      onClick: handleRefresh,
    },
    {
      label: "New Appointment",
      href: "/appointments/new",
      icon: <Plus className="h-4 w-4" />,
      variant: "default" as const,
    },
  ];

  // Calculate stats (exclude converted from active stats)
  const activeAppointments = appointments.filter(apt => apt.status !== 'converted');
    
  const todayCount = activeAppointments.filter(apt => {
    const [year, month, day] = apt.scheduled_date.split('-');
    const aptDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    return isToday(aptDate);
  }).length;
  
  const confirmedCount = activeAppointments.filter(apt => 
    apt.status === 'confirmed'
  ).length;
  
  const pendingCount = activeAppointments.filter(apt => 
    apt.status === 'scheduled'
  ).length;
  
  const convertedCount = appointments.filter(apt => 
    apt.status === 'converted'
  ).length;

  // Show skeleton during navigation or loading
  if (showSkeleton) {
    return <SkeletonAppointments />;
  }

  return (
    <PageContainer
      title="Appointments"
      description="Manage customer appointments and bookings"
      actions={headerActions}
    >
      <div className="space-y-6">
        {/* Stats Cards - Modern Style */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="relative overflow-hidden group hover:-translate-y-0.5">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Today's Appointments
              </CardTitle>
              <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <Calendar className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-3xl font-bold tracking-tight">{todayCount}</div>
              <p className="text-sm text-muted-foreground">Scheduled for today</p>
            </CardContent>
          </Card>
          
          <Card className="relative overflow-hidden group hover:-translate-y-0.5">
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Pending
              </CardTitle>
              <div className="p-2 rounded-lg bg-yellow-500/10 group-hover:bg-yellow-500/20 transition-colors">
                <Clock className="h-4 w-4 text-yellow-600" />
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-3xl font-bold tracking-tight">{pendingCount}</div>
              <p className="text-sm text-muted-foreground">Awaiting confirmation</p>
            </CardContent>
          </Card>
          
          <Card className="relative overflow-hidden group hover:-translate-y-0.5">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Confirmed
              </CardTitle>
              <div className="p-2 rounded-lg bg-green-500/10 group-hover:bg-green-500/20 transition-colors">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-3xl font-bold tracking-tight">{confirmedCount}</div>
              <p className="text-sm text-muted-foreground">Ready for service</p>
            </CardContent>
          </Card>
          
          <Card className="relative overflow-hidden group hover:-translate-y-0.5">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Converted
              </CardTitle>
              <div className="p-2 rounded-lg bg-purple-500/10 group-hover:bg-purple-500/20 transition-colors">
                <ArrowRight className="h-4 w-4 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-baseline space-x-2">
                <div className="text-3xl font-bold tracking-tight">
                  {convertedCount}
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Converted to tickets
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Appointments List Card */}
        <Card className="relative overflow-hidden group">
          {/* Creative corner accent */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-2xl group-hover:from-primary/20 transition-colors duration-500" />
          
          <CardHeader className="pb-4">
            <div className="flex flex-col space-y-4">
              {/* Header with title and filter controls */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 backdrop-blur-sm">
                      <Calendar className="h-5 w-5 text-primary" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-green-500 rounded-full border-2 border-card" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                      Appointment Schedule
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {filteredAppointments.length} {selectedTab === "all" ? "active" : selectedTab} appointments
                    </p>
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
                      <Button variant="outline" size="sm" className="h-9 px-3">
                        <Columns className="h-4 w-4 mr-2" />
                        Columns
                        <ChevronDown className="ml-2 h-4 w-4" />
                      </Button>
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
                  
                  {/* Sort Order - styled like a select */}
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
              
              {/* Tabs and Search on same line */}
              <div className="flex items-center justify-between gap-4">
                <Tabs value={selectedTab} onValueChange={setSelectedTab} className="flex-1">
                  <TabsList className="bg-muted/50 w-fit">
                    <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                    <TabsTrigger value="today">Today</TabsTrigger>
                    <TabsTrigger value="past">Past</TabsTrigger>
                    <TabsTrigger value="converted">Converted</TabsTrigger>
                    <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
                    <TabsTrigger value="all">All Active</TabsTrigger>
                  </TabsList>
                </Tabs>
                
                {/* Search bar */}
                <div className="relative max-w-xs">
                  <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search appointments..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="pt-0">
            <DataTable
              columns={columns}
              data={filteredAppointments}
              showColumnToggle={false}
            />
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}