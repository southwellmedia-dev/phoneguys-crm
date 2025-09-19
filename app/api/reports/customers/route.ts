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

    // Get all customers and their tickets
    const { data: customers, error: customersError } = await supabase
      .from('customers')
      .select(`
        *,
        repair_tickets (
          id,
          actual_cost,
          estimated_cost,
          created_at,
          repair_issues,
          status
        )
      `);

    if (customersError) throw customersError;

    // Analyze customer data
    let totalCustomers = 0;
    let newCustomers = 0;
    let returningCustomers = 0;
    const customerLifetimeValues: Record<string, number> = {};
    const customerOrders: Record<string, number> = {};
    const issueFrequency: Record<string, number> = {};

    customers?.forEach(customer => {
      const customerTickets = customer.repair_tickets || [];
      const ticketsInRange = customerTickets.filter((t: any) => {
        const ticketDate = new Date(t.created_at);
        return ticketDate >= fromDate && ticketDate <= toDate;
      });

      if (ticketsInRange.length > 0) {
        totalCustomers++;
        
        // Check if new customer (first ticket in range)
        const firstTicket = customerTickets.sort((a: any, b: any) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        )[0];
        
        if (new Date(firstTicket.created_at) >= fromDate) {
          newCustomers++;
        } else if (ticketsInRange.length > 0) {
          returningCustomers++;
        }

        // Calculate lifetime value
        const totalSpent = customerTickets.reduce((sum: number, ticket: any) => 
          sum + Number(ticket.actual_cost || ticket.estimated_cost || 0), 0
        );
        customerLifetimeValues[customer.id] = totalSpent;
        customerOrders[customer.id] = customerTickets.length;

        // Track issues
        ticketsInRange.forEach((ticket: any) => {
          ticket.repair_issues?.forEach((issue: string) => {
            issueFrequency[issue] = (issueFrequency[issue] || 0) + 1;
          });
        });
      }
    });

    // Calculate retention rate
    const retentionRate = totalCustomers > 0
      ? Math.round((returningCustomers / totalCustomers) * 100)
      : 0;

    // Calculate average lifetime value
    const lifetimeValues = Object.values(customerLifetimeValues);
    const avgLifetimeValue = lifetimeValues.length > 0
      ? Math.round(lifetimeValues.reduce((a, b) => a + b, 0) / lifetimeValues.length)
      : 0;

    // Calculate average orders per customer
    const orderCounts = Object.values(customerOrders);
    const avgOrdersPerCustomer = orderCounts.length > 0
      ? Math.round(orderCounts.reduce((a, b) => a + b, 0) / orderCounts.length * 10) / 10
      : 0;

    // Get customer growth trend (monthly)
    const growthTrend: Record<string, { new: number; returning: number; total: number }> = {};
    
    for (let d = new Date(fromDate); d <= toDate; d.setMonth(d.getMonth() + 1)) {
      const monthKey = d.toLocaleDateString('en-US', { month: 'short' });
      growthTrend[monthKey] = { new: 0, returning: 0, total: 0 };
    }

    // Customer segments
    const segments = {
      new: newCustomers,
      regular: 0,
      vip: 0,
      dormant: 0
    };

    customers?.forEach(customer => {
      const orders = customer.repair_tickets?.length || 0;
      const lastOrder = customer.repair_tickets?.sort((a: any, b: any) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )[0];
      
      const daysSinceLastOrder = lastOrder 
        ? Math.floor((Date.now() - new Date(lastOrder.created_at).getTime()) / (1000 * 60 * 60 * 24))
        : 999;

      if (orders >= 5) {
        segments.vip++;
      } else if (orders >= 2 && daysSinceLastOrder < 60) {
        segments.regular++;
      } else if (daysSinceLastOrder > 90) {
        segments.dormant++;
      }
    });

    const totalSegments = Object.values(segments).reduce((a, b) => a + b, 0) || 1;
    const customerSegments = Object.entries(segments).map(([segment, count]) => ({
      segment: segment.charAt(0).toUpperCase() + segment.slice(1),
      count,
      percentage: Math.round((count / totalSegments) * 100)
    }));

    // Top customers
    const topCustomers = customers
      ?.map(customer => {
        const tickets = customer.repair_tickets || [];
        const totalSpent = tickets.reduce((sum: number, ticket: any) => 
          sum + Number(ticket.actual_cost || ticket.estimated_cost || 0), 0
        );
        const lastTicket = tickets.sort((a: any, b: any) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0];
        
        return {
          name: customer.name,
          totalSpent: Math.round(totalSpent),
          orders: tickets.length,
          lastOrder: lastTicket ? new Date(lastTicket.created_at) : null,
          status: tickets.length >= 5 ? 'VIP' : tickets.length >= 2 ? 'Regular' : 'New'
        };
      })
      .filter(c => c.totalSpent > 0)
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 5)
      .map(customer => ({
        ...customer,
        lastOrder: customer.lastOrder 
          ? `${Math.floor((Date.now() - customer.lastOrder.getTime()) / (1000 * 60 * 60 * 24))} days ago`
          : 'Never'
      }));

    // Format issue frequency
    const issueFrequencyArray = Object.entries(issueFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([issue, count]) => ({
        issue: issue.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        customers: count
      }));

    // Mock growth trend for now (would need historical data)
    const customerGrowth = [
      { month: 'This Month', new: newCustomers, returning: returningCustomers, total: totalCustomers }
    ];

    return NextResponse.json({
      summary: {
        totalCustomers: customers?.length || 0,
        newCustomers,
        returningCustomers,
        retentionRate,
        avgLifetimeValue,
        avgOrdersPerCustomer
      },
      customerGrowth,
      customerSegments,
      topCustomers,
      issueFrequency: issueFrequencyArray
    });

  } catch (error) {
    console.error('Error fetching customer data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customer data' },
      { status: 500 }
    );
  }
}