import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { RepairTicketRepository } from '@/lib/repositories/repair-ticket.repository';

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

    // Get tickets in date range
    const { data: tickets, error: ticketsError } = await supabase
      .from('repair_tickets')
      .select(`
        id,
        ticket_number,
        actual_cost,
        estimated_cost,
        status,
        created_at,
        repair_issues,
        customer_id,
        customers (
          id,
          name
        )
      `)
      .gte('created_at', fromDate.toISOString())
      .lte('created_at', toDate.toISOString())
      .order('created_at', { ascending: true });

    if (ticketsError) throw ticketsError;

    // Calculate daily revenue
    const dailyRevenue: Record<string, { revenue: number; orders: number }> = {};
    const revenueByType: Record<string, number> = {};
    const customerRevenue: Record<string, { name: string; revenue: number; orders: number }> = {};
    
    let totalRevenue = 0;
    let totalOrders = 0;
    let laborRevenue = 0;
    let partsRevenue = 0;

    tickets?.forEach(ticket => {
      const cost = ticket.actual_cost || ticket.estimated_cost || 0;
      const date = new Date(ticket.created_at).toLocaleDateString('en-US', { weekday: 'short' });
      
      // Daily aggregation
      if (!dailyRevenue[date]) {
        dailyRevenue[date] = { revenue: 0, orders: 0 };
      }
      dailyRevenue[date].revenue += Number(cost);
      dailyRevenue[date].orders += 1;

      // Service type aggregation
      ticket.repair_issues?.forEach((issue: string) => {
        if (!revenueByType[issue]) {
          revenueByType[issue] = 0;
        }
        revenueByType[issue] += Number(cost);
      });

      // Customer aggregation
      if (ticket.customers) {
        const customerId = ticket.customer_id;
        if (!customerRevenue[customerId]) {
          customerRevenue[customerId] = {
            name: ticket.customers.name,
            revenue: 0,
            orders: 0
          };
        }
        customerRevenue[customerId].revenue += Number(cost);
        customerRevenue[customerId].orders += 1;
      }

      // Totals
      totalRevenue += Number(cost);
      totalOrders += 1;
      
      // Estimate labor vs parts (60/40 split for now)
      laborRevenue += Number(cost) * 0.6;
      partsRevenue += Number(cost) * 0.4;
    });

    // Format daily revenue for chart
    const dailyRevenueArray = Object.entries(dailyRevenue).map(([date, data]) => ({
      date,
      revenue: Math.round(data.revenue),
      orders: data.orders
    }));

    // Format revenue by type
    const totalTypeRevenue = Object.values(revenueByType).reduce((a, b) => a + b, 0) || 1;
    const revenueByTypeArray = Object.entries(revenueByType)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([type, value]) => ({
        type: type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        value: Math.round(value),
        percentage: Math.round((value / totalTypeRevenue) * 100)
      }));

    // Get top customers
    const topCustomers = Object.entries(customerRevenue)
      .sort((a, b) => b[1].revenue - a[1].revenue)
      .slice(0, 5)
      .map(([_, customer]) => ({
        name: customer.name,
        revenue: Math.round(customer.revenue),
        orders: customer.orders
      }));

    // Calculate growth rate (compare to previous period)
    const periodLength = Math.ceil((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24));
    const previousFrom = new Date(fromDate);
    previousFrom.setDate(previousFrom.getDate() - periodLength);
    
    const { data: previousTickets } = await supabase
      .from('repair_tickets')
      .select('actual_cost, estimated_cost')
      .gte('created_at', previousFrom.toISOString())
      .lt('created_at', fromDate.toISOString());

    const previousRevenue = previousTickets?.reduce((sum, ticket) => 
      sum + Number(ticket.actual_cost || ticket.estimated_cost || 0), 0) || 0;
    
    const growthRate = previousRevenue > 0 
      ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 
      : 0;

    return NextResponse.json({
      dailyRevenue: dailyRevenueArray,
      revenueByType: revenueByTypeArray,
      topCustomers,
      summary: {
        totalRevenue: Math.round(totalRevenue),
        totalOrders,
        averageOrderValue: totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0,
        laborRevenue: Math.round(laborRevenue),
        partsRevenue: Math.round(partsRevenue),
        growthRate: Math.round(growthRate * 10) / 10,
      }
    });

  } catch (error) {
    console.error('Error fetching revenue data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch revenue data' },
      { status: 500 }
    );
  }
}