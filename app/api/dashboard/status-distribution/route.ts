import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use service client for full access
    const serviceClient = createServiceClient();
    
    // Get date 7 days ago
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);
    
    // Fetch all tickets from the last 7 days
    const { data: tickets, error } = await serviceClient
      .from('repair_tickets')
      .select('status, created_at, updated_at')
      .gte('created_at', sevenDaysAgo.toISOString());
    
    if (error) {
      console.error('Error fetching ticket statuses:', error);
      throw error;
    }
    
    // Count tickets by status
    const statusCounts = (tickets || []).reduce((acc: Record<string, number>, ticket) => {
      const status = ticket.status;
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});
    
    // Map to chart data format with proper colors
    const statusColorMap: Record<string, string> = {
      'new': '#06b6d4',        // cyan
      'in_progress': '#f59e0b', // amber
      'completed': '#10b981',   // green
      'on_hold': '#6b7280',     // gray
      'cancelled': '#ef4444',   // red
      'pending': '#8b5cf6',     // purple
      'awaiting_parts': '#ec4899', // pink
    };
    
    const statusDisplayNames: Record<string, string> = {
      'new': 'New',
      'in_progress': 'In Progress',
      'completed': 'Completed', 
      'on_hold': 'On Hold',
      'cancelled': 'Cancelled',
      'pending': 'Pending',
      'awaiting_parts': 'Awaiting Parts'
    };
    
    const statuses = Object.entries(statusCounts).map(([status, count]) => ({
      name: statusDisplayNames[status] || status,
      value: count,
      color: statusColorMap[status] || '#9ca3af'
    })).sort((a, b) => b.value - a.value); // Sort by count descending
    
    // Calculate some summary stats
    const total = statuses.reduce((sum, s) => sum + s.value, 0);
    const completedCount = statusCounts.completed || 0;
    const completionRate = total > 0 ? Math.round((completedCount / total) * 100) : 0;
    
    return NextResponse.json({
      statuses,
      total,
      completedCount,
      completionRate,
      period: '7 days',
      startDate: sevenDaysAgo.toISOString(),
      endDate: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching status distribution:', error);
    return NextResponse.json(
      { error: 'Failed to fetch status distribution' },
      { status: 500 }
    );
  }
}