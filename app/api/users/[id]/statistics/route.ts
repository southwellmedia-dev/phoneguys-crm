import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { UserStatisticsService } from '@/lib/services/user-statistics.service';
import { getCurrentUserInfo } from '@/lib/utils/user-mapping';

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    
    // Get current user info with ID mapping
    const currentUserInfo = await getCurrentUserInfo(supabase);
    if (!currentUserInfo) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permissions
    const canViewStats = 
      currentUserInfo.appUserId === id || 
      currentUserInfo.role === 'admin' || 
      currentUserInfo.role === 'manager';

    if (!canViewStats) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const statisticsService = new UserStatisticsService();
    
    // Get query parameters for time range
    const searchParams = request.nextUrl.searchParams;
    const timeRange = searchParams.get('range') || '7'; // Default to 7 days
    
    const [statistics, timeline, performanceMetrics] = await Promise.all([
      statisticsService.getUserProfile(id),
      statisticsService.getUserActivityTimeline(id, parseInt(timeRange)),
      // Additional metrics can be fetched here
    ]);

    return NextResponse.json({
      data: {
        statistics: statistics?.statistics,
        performanceMetrics: statistics?.performanceMetrics,
        workload: statistics?.workload,
        timeline
      }
    });
  } catch (error) {
    console.error('Error fetching user statistics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user statistics' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    
    // Get current user info with ID mapping
    const currentUserInfo = await getCurrentUserInfo(supabase);
    if (!currentUserInfo) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins can refresh statistics
    if (currentUserInfo.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const statisticsService = new UserStatisticsService();
    
    // Refresh statistics for the user
    await statisticsService.updateUserStatistics(id);

    return NextResponse.json({ 
      success: true,
      message: 'Statistics updated successfully'
    });
  } catch (error) {
    console.error('Error updating user statistics:', error);
    return NextResponse.json(
      { error: 'Failed to update user statistics' },
      { status: 500 }
    );
  }
}