import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { UserProfileService } from '@/lib/services/user-profile.service';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const profileService = new UserProfileService();
    
    // Get role-based dashboard data
    const dashboardData = await profileService.getRoleDashboardData(user.id);

    // Log dashboard access
    const { data: currentUser } = await supabase
      .from('users')
      .select('full_name, role')
      .eq('id', user.id)
      .single();

    console.log(`Dashboard accessed by ${currentUser?.full_name} (${currentUser?.role})`);

    return NextResponse.json({
      data: dashboardData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching role dashboard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}