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
    
    // Get weekly comparison data using repository method
    const comparisonData = await ticketRepo.getWeeklyComparison();
    
    // Transform data for backward compatibility and add totals
    const trendData = comparisonData.map(day => ({
      ...day,
      tickets: day.created // For backward compatibility
    }));
    
    // Calculate totals
    const totalCreated = comparisonData.reduce((sum, day) => sum + day.created, 0);
    const totalCompleted = comparisonData.reduce((sum, day) => sum + day.completed, 0);
    const totalAppointments = comparisonData.reduce((sum, day) => sum + (day.appointments || 0), 0);

    return NextResponse.json({
      trend: trendData,
      comparison: comparisonData,
      total: totalCreated,
      totalCreated,
      totalCompleted,
      totalAppointments,
      startDate: comparisonData[0]?.date,
      endDate: comparisonData[comparisonData.length - 1]?.date
    });

  } catch (error) {
    console.error('Error fetching trend data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trend data' },
      { status: 500 }
    );
  }
}