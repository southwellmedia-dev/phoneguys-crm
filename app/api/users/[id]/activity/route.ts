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
    const canViewActivity = 
      currentUserInfo.appUserId === id || 
      currentUserInfo.role === 'admin' || 
      currentUserInfo.role === 'manager';

    if (!canViewActivity) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '50');
    const days = parseInt(searchParams.get('days') || '7');

    const statisticsService = new UserStatisticsService();
    const timeline = await statisticsService.getUserActivityTimeline(id, days);

    return NextResponse.json({
      data: {
        timeline,
        summary: {
          totalActivities: timeline.reduce((sum, day) => sum + day.activities.length, 0),
          daysActive: timeline.filter(day => day.activities.length > 0).length,
          mostActiveDay: timeline.reduce((max, day) => 
            day.activities.length > (max?.activities.length || 0) ? day : max, 
            timeline[0]
          )
        }
      }
    });
  } catch (error) {
    console.error('Error fetching user activity:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user activity' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const { activityType, entityType, entityId, details } = await request.json();

    if (!activityType) {
      return NextResponse.json(
        { error: 'Activity type is required' },
        { status: 400 }
      );
    }

    const statisticsService = new UserStatisticsService();
    
    // Log the activity
    await statisticsService.logActivity(
      id,
      activityType,
      entityType,
      entityId,
      details
    );

    return NextResponse.json({
      success: true,
      message: 'Activity logged successfully'
    });
  } catch (error) {
    console.error('Error logging user activity:', error);
    return NextResponse.json(
      { error: 'Failed to log user activity' },
      { status: 500 }
    );
  }
}