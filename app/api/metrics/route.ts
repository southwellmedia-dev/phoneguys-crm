import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { RepairTicketRepository } from '@/lib/repositories/repair-ticket.repository';
import { CustomerRepository } from '@/lib/repositories/customer.repository';
import { AppointmentRepository } from '@/lib/repositories/appointment.repository';
import { type MetricData } from '@/lib/hooks/connected/use-metric-data';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const metric = searchParams.get('metric');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const status = searchParams.get('status');

    if (!metric) {
      return NextResponse.json({ error: 'Metric type is required' }, { status: 400 });
    }

    // Initialize repositories with service role for full access
    const ticketRepo = new RepairTicketRepository(true);
    const customerRepo = new CustomerRepository(true);
    const appointmentRepo = new AppointmentRepository(true);

    let result: MetricData;

    switch (metric) {
      case 'total_tickets': {
        const tickets = await ticketRepo.findAllWithCustomers();
        const previousCount = Math.floor(tickets.length * 0.9); // Mock previous value
        result = {
          value: tickets.length,
          change: tickets.length > 0 ? Math.round(((tickets.length - previousCount) / previousCount) * 100) : 0,
          trend: tickets.length > previousCount ? 'up' : tickets.length < previousCount ? 'down' : 'neutral',
          sparkline: generateSparklineFromCount(tickets.length),
          subtitle: 'All time'
        };
        break;
      }

      case 'new_tickets': {
        const allTickets = await ticketRepo.findAllWithCustomers();
        const newTickets = allTickets.filter(t => t.status === 'new');
        const previousCount = Math.max(0, newTickets.length - 2); // Mock previous value
        result = {
          value: newTickets.length,
          change: previousCount > 0 ? Math.round(((newTickets.length - previousCount) / previousCount) * 100) : 0,
          trend: newTickets.length > previousCount ? 'up' : newTickets.length < previousCount ? 'down' : 'neutral',
          sparkline: generateSparklineFromCount(newTickets.length),
          subtitle: 'Awaiting assignment'
        };
        break;
      }

      case 'completed_tickets': {
        const allTickets = await ticketRepo.findAllWithCustomers();
        const completedTickets = allTickets.filter(t => t.status === 'completed');
        const previousCount = Math.max(0, completedTickets.length - 3); // Mock previous value
        result = {
          value: completedTickets.length,
          change: previousCount > 0 ? Math.round(((completedTickets.length - previousCount) / previousCount) * 100) : 0,
          trend: completedTickets.length > previousCount ? 'up' : completedTickets.length < previousCount ? 'down' : 'neutral',
          sparkline: generateSparklineFromCount(completedTickets.length),
          subtitle: 'Successfully finished'
        };
        break;
      }

      case 'in_progress_tickets': {
        const allTickets = await ticketRepo.findAllWithCustomers();
        const inProgressTickets = allTickets.filter(t => t.status === 'in_progress');
        const previousCount = Math.max(0, inProgressTickets.length - 1); // Mock previous value
        result = {
          value: inProgressTickets.length,
          change: previousCount > 0 ? Math.round(((inProgressTickets.length - previousCount) / previousCount) * 100) : 0,
          trend: inProgressTickets.length > previousCount ? 'up' : inProgressTickets.length < previousCount ? 'down' : 'neutral',
          sparkline: generateSparklineFromCount(inProgressTickets.length),
          subtitle: 'Being worked on'
        };
        break;
      }

      case 'total_customers': {
        const customers = await customerRepo.findAll();
        const previousCount = Math.floor(customers.length * 0.95); // Mock previous value
        result = {
          value: customers.length,
          change: previousCount > 0 ? Math.round(((customers.length - previousCount) / previousCount) * 100) : 0,
          trend: customers.length > previousCount ? 'up' : customers.length < previousCount ? 'down' : 'neutral',
          sparkline: generateSparklineFromCount(customers.length),
          subtitle: 'Registered customers'
        };
        break;
      }

      case 'total_appointments': {
        const appointments = await appointmentRepo.findAllWithDetails();
        
        // Filter for today's appointments if this is for "Today's Appointments"
        const today = new Date();
        const todaysAppointments = appointments.filter((apt: any) => {
          const aptDate = new Date(apt.scheduled_date);
          return aptDate.toDateString() === today.toDateString();
        });
        
        const count = todaysAppointments.length;
        const previousCount = Math.max(0, count - 1); // Mock previous value
        result = {
          value: count,
          change: previousCount > 0 ? Math.round(((count - previousCount) / previousCount) * 100) : 0,
          trend: count > previousCount ? 'up' : count < previousCount ? 'down' : 'neutral',
          sparkline: generateSparklineFromCount(count),
          subtitle: 'Scheduled for today'
        };
        break;
      }

      case 'pending_appointments': {
        const appointments = await appointmentRepo.findAllWithDetails();
        const pendingAppointments = appointments.filter((apt: any) => 
          apt.status === 'scheduled' || apt.status === 'confirmed'
        );
        const previousCount = Math.max(0, pendingAppointments.length - 1); // Mock previous value
        result = {
          value: pendingAppointments.length,
          change: previousCount > 0 ? Math.round(((pendingAppointments.length - previousCount) / previousCount) * 100) : 0,
          trend: pendingAppointments.length > previousCount ? 'up' : pendingAppointments.length < previousCount ? 'down' : 'neutral',
          sparkline: generateSparklineFromCount(pendingAppointments.length),
          subtitle: 'Awaiting service'
        };
        break;
      }

      case 'revenue_today': {
        const allTickets = await ticketRepo.findAllWithCustomers();
        const today = new Date();
        const todaysRevenue = allTickets
          .filter(t => {
            const completedDate = new Date(t.updated_at);
            return t.status === 'completed' && 
                   completedDate.toDateString() === today.toDateString() &&
                   t.actual_cost;
          })
          .reduce((acc, ticket) => acc + (ticket.actual_cost || 0), 0);
        
        const previousRevenue = todaysRevenue * 0.85; // Mock previous value
        result = {
          value: `$${todaysRevenue.toFixed(0)}`,
          change: previousRevenue > 0 ? Math.round(((todaysRevenue - previousRevenue) / previousRevenue) * 100) : 0,
          trend: todaysRevenue > previousRevenue ? 'up' : todaysRevenue < previousRevenue ? 'down' : 'neutral',
          sparkline: generateSparklineFromCount(todaysRevenue / 10), // Scale down for sparkline
          subtitle: 'Today\'s completed repairs'
        };
        break;
      }

      case 'revenue_month': {
        const allTickets = await ticketRepo.findAllWithCustomers();
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
        
        const previousRevenue = monthlyRevenue * 0.9; // Mock previous value
        result = {
          value: `$${monthlyRevenue.toFixed(0)}`,
          change: previousRevenue > 0 ? Math.round(((monthlyRevenue - previousRevenue) / previousRevenue) * 100) : 0,
          trend: monthlyRevenue > previousRevenue ? 'up' : monthlyRevenue < previousRevenue ? 'down' : 'neutral',
          sparkline: generateSparklineFromCount(monthlyRevenue / 100), // Scale down for sparkline
          subtitle: 'This month\'s revenue'
        };
        break;
      }

      default:
        return NextResponse.json({ error: 'Invalid metric type' }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching metric:', error);
    return NextResponse.json(
      { error: 'Failed to fetch metric data' },
      { status: 500 }
    );
  }
}

// Helper function to generate sparkline data from a count
function generateSparklineFromCount(count: number, points: number = 7): number[] {
  const sparkline = [];
  const baseValue = Math.max(1, count * 0.7); // Start at 70% of current value
  
  for (let i = 0; i < points - 1; i++) {
    const variation = Math.random() * 0.3 - 0.15; // ±15% variation
    const value = Math.max(0, Math.round(baseValue * (1 + variation * (i / points))));
    sparkline.push(value);
  }
  
  // Last point is always the current value
  sparkline.push(count);
  return sparkline;
}