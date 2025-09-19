import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    
    if (!from || !to) {
      return NextResponse.json({ error: 'Date range required' }, { status: 400 });
    }

    const fromDate = new Date(from);
    const toDate = new Date(to);

    // Get all tickets in date range
    const { data: tickets, error: ticketsError } = await supabase
      .from('repair_tickets')
      .select('*')
      .gte('created_at', fromDate.toISOString())
      .lte('created_at', toDate.toISOString());

    if (ticketsError) throw ticketsError;

    // Get ticket trend (daily breakdown)
    const ticketTrend: Record<string, any> = {};
    const statusCounts: Record<string, number> = {
      'new': 0,
      'in_progress': 0,
      'completed': 0,
      'on_hold': 0,
      'cancelled': 0
    };

    tickets?.forEach(ticket => {
      const date = new Date(ticket.created_at).toLocaleDateString('en-US', { weekday: 'short' });
      
      if (!ticketTrend[date]) {
        ticketTrend[date] = { 
          date, 
          created: 0, 
          completed: 0, 
          inProgress: 0 
        };
      }
      
      ticketTrend[date].created++;
      
      if (ticket.status === 'completed') {
        ticketTrend[date].completed++;
      } else if (ticket.status === 'in_progress') {
        ticketTrend[date].inProgress++;
      }

      // Count current statuses
      if (statusCounts[ticket.status] !== undefined) {
        statusCounts[ticket.status]++;
      }
    });

    // Convert to array and sort
    const ticketTrendArray = Object.values(ticketTrend).sort((a: any, b: any) => {
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      return days.indexOf(a.date) - days.indexOf(b.date);
    });

    // Calculate status distribution
    const totalTickets = tickets?.length || 1;
    const statusDistribution = Object.entries(statusCounts).map(([status, count]) => ({
      status: status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      count,
      percentage: Math.round((count / totalTickets) * 100)
    })).filter(item => item.count > 0);

    // Calculate repair time analysis
    const repairTimes = tickets?.filter(t => t.total_time_minutes)
      .map(t => t.total_time_minutes / 60) || [];
    
    const avgRepairTime = repairTimes.length > 0
      ? repairTimes.reduce((a, b) => a + b, 0) / repairTimes.length
      : 0;

    const medianRepairTime = repairTimes.length > 0
      ? repairTimes.sort((a, b) => a - b)[Math.floor(repairTimes.length / 2)]
      : 0;

    // Repair time by priority
    const priorityTimes: Record<string, number[]> = {
      'urgent': [],
      'high': [],
      'medium': [],
      'low': []
    };

    tickets?.forEach(ticket => {
      if (ticket.total_time_minutes && priorityTimes[ticket.priority]) {
        priorityTimes[ticket.priority].push(ticket.total_time_minutes / 60);
      }
    });

    const byPriority = Object.entries(priorityTimes).map(([priority, times]) => ({
      priority: priority.charAt(0).toUpperCase() + priority.slice(1),
      avgTime: times.length > 0 
        ? Math.round(times.reduce((a, b) => a + b, 0) / times.length * 10) / 10
        : 0
    }));

    // Service type breakdown
    const serviceCount: Record<string, { count: number; totalTime: number }> = {};
    
    tickets?.forEach(ticket => {
      ticket.repair_issues?.forEach((issue: string) => {
        if (!serviceCount[issue]) {
          serviceCount[issue] = { count: 0, totalTime: 0 };
        }
        serviceCount[issue].count++;
        if (ticket.total_time_minutes) {
          serviceCount[issue].totalTime += ticket.total_time_minutes / 60;
        }
      });
    });

    const serviceTypeBreakdown = Object.entries(serviceCount)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 5)
      .map(([service, data]) => ({
        service: service.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        count: data.count,
        avgTime: data.count > 0 
          ? Math.round(data.totalTime / data.count * 10) / 10
          : 0
      }));

    // Calculate efficiency metrics
    const completedTickets = tickets?.filter(t => t.status === 'completed').length || 0;
    const completionRate = totalTickets > 0 
      ? Math.round((completedTickets / totalTickets) * 100)
      : 0;

    // Estimate on-time rate (tickets completed within estimated time)
    const onTimeTickets = tickets?.filter(t => 
      t.status === 'completed' && 
      t.estimated_completion && 
      new Date(t.updated_at) <= new Date(t.estimated_completion)
    ).length || 0;
    
    const onTimeRate = completedTickets > 0
      ? Math.round((onTimeTickets / completedTickets) * 100)
      : 0;

    // First-time fix rate (completed without being put on hold)
    const firstTimeFixTickets = tickets?.filter(t => 
      t.status === 'completed' && 
      !t.notes?.toLowerCase().includes('hold')
    ).length || 0;
    
    const firstTimeFixRate = completedTickets > 0
      ? Math.round((firstTimeFixTickets / completedTickets) * 100)
      : 0;

    const daysInRange = Math.ceil((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24)) || 1;
    const avgTicketsPerDay = Math.round(totalTickets / daysInRange * 10) / 10;

    return NextResponse.json({
      ticketTrend: ticketTrendArray,
      statusDistribution,
      repairTimeAnalysis: {
        average: Math.round(avgRepairTime * 10) / 10,
        median: Math.round(medianRepairTime * 10) / 10,
        min: repairTimes.length > 0 ? Math.round(Math.min(...repairTimes) * 10) / 10 : 0,
        max: repairTimes.length > 0 ? Math.round(Math.max(...repairTimes) * 10) / 10 : 0,
        byPriority
      },
      serviceTypeBreakdown,
      efficiency: {
        completionRate,
        onTimeRate,
        firstTimeFixRate,
        avgTicketsPerDay
      }
    });

  } catch (error) {
    console.error('Error fetching operational data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch operational data' },
      { status: 500 }
    );
  }
}