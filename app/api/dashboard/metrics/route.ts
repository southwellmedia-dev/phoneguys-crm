import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { RepairTicketRepository } from '@/lib/repositories/repair-ticket.repository';
import { CustomerRepository } from '@/lib/repositories/customer.repository';
import { AppointmentRepository } from '@/lib/repositories/appointment.repository';
import { type MetricData, type MetricType } from '@/lib/hooks/connected/use-metric-data';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    // Initialize repositories with service role for full access
    const ticketRepo = new RepairTicketRepository(true);
    const customerRepo = new CustomerRepository(true);
    const appointmentRepo = new AppointmentRepository(true);

    // Fetch all data in parallel
    const [allTickets, allCustomers, allAppointments] = await Promise.all([
      ticketRepo.findAllWithCustomers(),
      customerRepo.findAll(),
      appointmentRepo.findAllWithDetails()
    ]);

    // Helper function to generate sparkline data
    const generateSparkline = (count: number): number[] => {
      const points = 7;
      const sparkline = [];
      const baseValue = Math.max(1, count * 0.7);
      
      for (let i = 0; i < points - 1; i++) {
        const variation = Math.random() * 0.3 - 0.15;
        const value = Math.max(0, Math.round(baseValue * (1 + variation * (i / points))));
        sparkline.push(value);
      }
      
      sparkline.push(count);
      return sparkline;
    };

    // Calculate all metrics
    const newTickets = allTickets.filter(t => t.status === 'new');
    const completedTickets = allTickets.filter(t => t.status === 'completed');
    const inProgressTickets = allTickets.filter(t => t.status === 'in_progress');

    // Today's appointments
    const today = new Date();
    const todaysAppointments = allAppointments.filter((apt: any) => {
      const aptDate = new Date(apt.scheduled_date);
      return aptDate.toDateString() === today.toDateString();
    });

    // Pending appointments
    const pendingAppointments = allAppointments.filter((apt: any) => 
      apt.status === 'scheduled' || apt.status === 'confirmed'
    );

    // Revenue calculations
    const todaysRevenue = allTickets
      .filter(t => {
        const completedDate = new Date(t.updated_at);
        return t.status === 'completed' && 
               completedDate.toDateString() === today.toDateString() &&
               t.actual_cost;
      })
      .reduce((acc, ticket) => acc + (ticket.actual_cost || 0), 0);

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthlyRevenue = allTickets
      .filter(t => {
        const completedDate = new Date(t.updated_at);
        return t.status === 'completed' && 
               completedDate >= startOfMonth &&
               t.actual_cost;
      })
      .reduce((acc, ticket) => acc + (ticket.actual_cost || 0), 0);

    // Build metrics response
    const metrics: Record<MetricType, MetricData> = {
      total_tickets: {
        value: allTickets.length,
        change: Math.round(Math.random() * 20 + 5), // Mock change
        trend: 'up',
        sparkline: generateSparkline(allTickets.length),
        subtitle: 'All time'
      },
      new_tickets: {
        value: newTickets.length,
        change: Math.round(Math.random() * 15 + 2),
        trend: newTickets.length > 5 ? 'up' : 'neutral',
        sparkline: generateSparkline(newTickets.length),
        subtitle: 'Awaiting assignment'
      },
      completed_tickets: {
        value: completedTickets.length,
        change: Math.round(Math.random() * 25 + 8),
        trend: 'up',
        sparkline: generateSparkline(completedTickets.length),
        subtitle: 'Successfully finished'
      },
      in_progress_tickets: {
        value: inProgressTickets.length,
        change: Math.round(Math.random() * 10),
        trend: inProgressTickets.length > 3 ? 'down' : 'neutral',
        sparkline: generateSparkline(inProgressTickets.length),
        subtitle: 'Being worked on'
      },
      total_customers: {
        value: allCustomers.length,
        change: Math.round(Math.random() * 12 + 3),
        trend: 'up',
        sparkline: generateSparkline(allCustomers.length),
        subtitle: 'Registered customers'
      },
      total_appointments: {
        value: todaysAppointments.length,
        change: Math.round(Math.random() * 8),
        trend: todaysAppointments.length > 2 ? 'up' : 'neutral',
        sparkline: generateSparkline(todaysAppointments.length),
        subtitle: 'Scheduled for today'
      },
      pending_appointments: {
        value: pendingAppointments.length,
        change: Math.round(Math.random() * 6),
        trend: 'neutral',
        sparkline: generateSparkline(pendingAppointments.length),
        subtitle: 'Awaiting service'
      },
      revenue_today: {
        value: `$${todaysRevenue.toFixed(0)}`,
        change: Math.round(Math.random() * 30 + 10),
        trend: 'up',
        sparkline: generateSparkline(Math.max(1, todaysRevenue / 10)),
        subtitle: "Today's completed repairs"
      },
      revenue_month: {
        value: `$${monthlyRevenue.toFixed(0)}`,
        change: Math.round(Math.random() * 20 + 15),
        trend: 'up',
        sparkline: generateSparkline(Math.max(1, monthlyRevenue / 100)),
        subtitle: "This month's revenue"
      }
    };

    return NextResponse.json(metrics);
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard metrics' },
      { status: 500 }
    );
  }
}