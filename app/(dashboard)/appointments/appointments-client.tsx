"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { PageContainer } from "@/components/layout/page-container";
import { DataTable } from "@/components/tables/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format, isToday, isTomorrow, isPast, isFuture } from "date-fns";
import { ColumnDef } from "@tanstack/react-table";
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
  const [appointments] = useState(initialAppointments);
  const [selectedTab, setSelectedTab] = useState("today");

  // Filter appointments based on selected tab
  const filteredAppointments = useMemo(() => {
    const now = new Date();
    const today = new Date().toISOString().split('T')[0];
    
    switch (selectedTab) {
      case "today":
        return appointments.filter(apt => apt.scheduled_date === today);
      case "upcoming":
        return appointments.filter(apt => {
          const aptDate = new Date(apt.scheduled_date);
          return isFuture(aptDate) || apt.scheduled_date === today;
        });
      case "past":
        return appointments.filter(apt => {
          const aptDate = new Date(apt.scheduled_date);
          return isPast(aptDate) && apt.scheduled_date !== today;
        });
      case "cancelled":
        return appointments.filter(apt => apt.status === 'cancelled' || apt.status === 'no_show');
      default:
        return appointments;
    }
  }, [appointments, selectedTab]);

  const columns: ColumnDef<Appointment>[] = [
    {
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
        const date = new Date(row.original.scheduled_date);
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

  const handleConvertToTicket = async (appointmentId: string) => {
    // This would call a server action to convert the appointment
    toast.success("Converting appointment to ticket...");
    router.push(`/appointments/${appointmentId}`);
  };

  const handleStatusUpdate = async (appointmentId: string, newStatus: string) => {
    toast.success(`Updating appointment status to ${newStatus}...`);
    // Call server action here
    router.refresh();
  };

  const handleRefresh = () => {
    router.refresh();
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

  // Calculate stats
  const todayCount = appointments.filter(apt => 
    apt.scheduled_date === new Date().toISOString().split('T')[0]
  ).length;
  
  const confirmedCount = appointments.filter(apt => 
    apt.status === 'confirmed'
  ).length;
  
  const pendingCount = appointments.filter(apt => 
    apt.status === 'scheduled'
  ).length;

  return (
    <PageContainer
      title="Appointments"
      description="Manage customer appointments and bookings"
      actions={headerActions}
    >
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Appointments</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{todayCount}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Confirmation</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingCount}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Confirmed</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{confirmedCount}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {appointments.length > 0 
                  ? `${Math.round((appointments.filter(a => a.status === 'converted').length / appointments.length) * 100)}%`
                  : '0%'
                }
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs and Table */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList>
            <TabsTrigger value="today">Today</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="past">Past</TabsTrigger>
            <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>
          
          <TabsContent value={selectedTab} className="mt-4">
            <DataTable
              columns={columns}
              data={filteredAppointments}
              searchKey="customer_name"
            />
          </TabsContent>
        </Tabs>
      </div>
    </PageContainer>
  );
}