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

    // Get all users (technicians)
    const { data: technicians, error: techError } = await supabase
      .from('users')
      .select('*')
      .in('role', ['admin', 'staff', 'manager']);

    if (techError) throw techError;

    // Get tickets assigned to technicians in date range
    const { data: tickets, error: ticketsError } = await supabase
      .from('repair_tickets')
      .select(`
        *,
        assigned_user:users!repair_tickets_assigned_to_fkey (
          id,
          full_name,
          email
        )
      `)
      .gte('created_at', fromDate.toISOString())
      .lte('created_at', toDate.toISOString());

    if (ticketsError) throw ticketsError;

    // Analyze performance metrics
    const technicianMetrics: Record<string, any> = {};
    const performanceTrend: Record<string, Record<string, number>> = {};
    const skillMatrix: Record<string, Record<string, number>> = {};

    technicians?.forEach(tech => {
      technicianMetrics[tech.id] = {
        id: tech.id,
        name: tech.full_name || tech.email?.split('@')[0] || 'Unknown',
        avatar: null,
        completedTickets: 0,
        totalTime: 0,
        revenue: 0,
        issues: {},
        weeklyCount: {}
      };
    });

    // Process tickets
    tickets?.forEach(ticket => {
      if (ticket.assigned_to && technicianMetrics[ticket.assigned_to]) {
        const tech = technicianMetrics[ticket.assigned_to];
        
        if (ticket.status === 'completed') {
          tech.completedTickets++;
        }

        if (ticket.total_time_minutes) {
          tech.totalTime += ticket.total_time_minutes / 60;
        }

        const cost = ticket.actual_cost || ticket.estimated_cost || 0;
        tech.revenue += Number(cost);

        // Track issues for skill matrix
        ticket.repair_issues?.forEach((issue: string) => {
          if (!tech.issues[issue]) {
            tech.issues[issue] = 0;
          }
          tech.issues[issue]++;
        });

        // Track weekly performance
        const weekNum = Math.floor((new Date(ticket.created_at).getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24 * 7));
        const weekKey = `Week ${weekNum + 1}`;
        if (!tech.weeklyCount[weekKey]) {
          tech.weeklyCount[weekKey] = 0;
        }
        tech.weeklyCount[weekKey]++;
      }
    });

    // Format technician metrics
    const technicianMetricsArray = Object.values(technicianMetrics)
      .map((tech: any) => ({
        id: tech.id,
        name: tech.name,
        avatar: tech.avatar,
        completedTickets: tech.completedTickets,
        avgRepairTime: tech.completedTickets > 0 
          ? Math.round(tech.totalTime / tech.completedTickets * 10) / 10
          : 0,
        efficiency: tech.totalTime > 0
          ? Math.round(tech.completedTickets / tech.totalTime * 10) / 10
          : 0,
        revenue: Math.round(tech.revenue),
        satisfaction: 4.5 + Math.random() * 0.5, // Mock satisfaction for now
      }))
      .sort((a, b) => b.completedTickets - a.completedTickets)
      .map((tech, index) => ({ ...tech, rank: index + 1 }));

    // Build performance trend
    const weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
    const trendData = weeks.map(week => {
      const weekData: any = { week };
      technicianMetricsArray.slice(0, 4).forEach((tech: any) => {
        const techData = Object.values(technicianMetrics).find((t: any) => t.id === tech.id) as any;
        weekData[tech.name.split(' ')[0].toLowerCase()] = techData.weeklyCount[week] || 0;
      });
      return weekData;
    });

    // Build skill matrix
    const commonIssues = ['Screen Repair', 'Battery', 'Water Damage', 'Software', 'Motherboard'];
    const skillData = commonIssues.map(skill => {
      const skillData: any = { skill };
      technicianMetricsArray.slice(0, 4).forEach((tech: any) => {
        const techData = Object.values(technicianMetrics).find((t: any) => t.id === tech.id) as any;
        const issueKey = skill.toLowerCase().replace(' ', '_');
        const count = techData.issues[issueKey] || 0;
        const maxCount = 20; // Normalize to percentage
        skillData[tech.name.split(' ')[0].toLowerCase()] = Math.min(95, 70 + (count / maxCount) * 25);
      });
      return skillData;
    });

    // Calculate team stats
    const totalTickets = tickets?.length || 0;
    const completedTickets = tickets?.filter(t => t.status === 'completed').length || 0;
    const totalTime = tickets?.reduce((sum, t) => sum + (t.total_time_minutes || 0), 0) / 60 || 0;
    const totalRevenue = tickets?.reduce((sum, t) => sum + Number(t.actual_cost || t.estimated_cost || 0), 0) || 0;

    const teamStats = {
      totalTickets,
      avgCompletionTime: completedTickets > 0 
        ? Math.round(totalTime / completedTickets * 10) / 10
        : 0,
      teamEfficiency: totalTime > 0
        ? Math.round(completedTickets / totalTime * 10) / 10
        : 0,
      totalRevenue: Math.round(totalRevenue),
      avgSatisfaction: 4.65 // Mock for now
    };

    // Build radar chart data
    const radarData = [
      { metric: 'Speed', value: Math.min(100, 60 + completedTickets * 2), fullMark: 100 },
      { metric: 'Quality', value: 92, fullMark: 100 },
      { metric: 'Volume', value: Math.min(100, 50 + totalTickets), fullMark: 100 },
      { metric: 'Customer Satisfaction', value: 88, fullMark: 100 },
      { metric: 'Revenue', value: Math.min(100, 50 + totalRevenue / 100), fullMark: 100 },
      { metric: 'Efficiency', value: Math.min(100, teamStats.teamEfficiency * 10), fullMark: 100 },
    ];

    return NextResponse.json({
      technicianMetrics: technicianMetricsArray.slice(0, 10),
      performanceTrend: trendData,
      skillMatrix: skillData,
      teamStats,
      radarData
    });

  } catch (error) {
    console.error('Error fetching performance data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch performance data' },
      { status: 500 }
    );
  }
}