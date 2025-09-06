import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { UserProfileService } from '@/lib/services/user-profile.service';
import { UserStatisticsService } from '@/lib/services/user-statistics.service';
import { getCurrentUserInfo } from '@/lib/utils/user-mapping';

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    console.log('Fetching profile for user ID:', id);
    
    const supabase = await createClient();
    
    // Get current user info with ID mapping
    const currentUserInfo = await getCurrentUserInfo(supabase);
    if (!currentUserInfo) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Current user info:', currentUserInfo);

    // Check if user can view this profile
    // Users can view their own profile, managers and admins can view all
    const canViewProfile = 
      currentUserInfo.appUserId === id || 
      currentUserInfo.role === 'admin' || 
      currentUserInfo.role === 'manager';

    if (!canViewProfile) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // First, let's try to get the user directly from Supabase
    console.log('Trying direct Supabase query for user:', id);
    
    const { data: directUser, error: directError } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    
    console.log('Direct Supabase query result:', directUser ? 'Found' : 'Not found', 'Error:', directError);
    
    if (!directUser) {
      // Let's list all users to debug
      const { data: allUsers, error: listError } = await supabase
        .from('users')
        .select('id, email, full_name')
        .limit(10);
      
      console.log('All users in database:', allUsers);
      console.log('Current authenticated user ID:', user.id);
      
      return NextResponse.json({ 
        error: 'User not found',
        debug: {
          requestedId: id,
          currentUserId: user.id,
          usersInDb: allUsers?.map(u => ({ id: u.id, email: u.email }))
        }
      }, { status: 404 });
    }
    
    // If we found the user directly, let's try the service approach
    const profileService = new UserProfileService();
    const statisticsService = new UserStatisticsService();

    console.log('Fetching profile data for:', id);

    const [profile, fullProfile] = await Promise.all([
      profileService.getUserProfile(id),
      statisticsService.getUserProfile(id)
    ]);

    console.log('Profile result:', profile ? 'Found' : 'Not found');
    console.log('Full profile result:', fullProfile ? 'Found' : 'Not found');

    // Use direct user if service failed
    const finalProfile = profile || {
      ...directUser,
      statistics: null,
      recent_activity: []
    };

    return NextResponse.json({
      data: {
        user: profile,
        statistics: fullProfile?.statistics,
        performanceMetrics: fullProfile?.performanceMetrics,
        workload: fullProfile?.workload,
        recentActivity: fullProfile?.recentActivity
      }
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user profile' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    
    // Get current user info with ID mapping
    const currentUserInfo = await getCurrentUserInfo(supabase);
    if (!currentUserInfo) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins or the user themselves can update profiles
    const canUpdateProfile = currentUserInfo.appUserId === id || currentUserInfo.role === 'admin';

    if (!canUpdateProfile) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const data = await request.json();
    const profileService = new UserProfileService();

    // Update preferences if provided
    if (data.preferences) {
      await profileService.updateUserPreferences(id, data.preferences);
    }

    // Update avatar if provided
    if (data.avatar_url) {
      await profileService.updateAvatar(id, data.avatar_url);
    }

    // Update other user fields if admin
    if (currentUserInfo.role === 'admin' && data.updates) {
      const { error } = await supabase
        .from('users')
        .update(data.updates)
        .eq('id', id);

      if (error) {
        throw new Error(`Failed to update user: ${error.message}`);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json(
      { error: 'Failed to update user profile' },
      { status: 500 }
    );
  }
}