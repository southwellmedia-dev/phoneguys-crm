import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { RepairTicketRepository } from '@/lib/repositories/repair-ticket.repository';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use repository pattern as per guidelines
    const ticketRepo = new RepairTicketRepository(true); // Use service role for API
    
    // Get weekly trend data using repository method
    const trendData = await ticketRepo.getWeeklyTrend();
    
    // Calculate total tickets for the week
    const total = trendData.reduce((sum, day) => sum + day.tickets, 0);

    return NextResponse.json({
      trend: trendData,
      total,
      startDate: trendData[0]?.date,
      endDate: trendData[trendData.length - 1]?.date
    });

  } catch (error) {
    console.error('Error fetching trend data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trend data' },
      { status: 500 }
    );
  }
}