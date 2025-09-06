import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { ProfileClient } from './profile-client';
import { redirect } from 'next/navigation';
import { UserRepository } from '@/lib/repositories/user.repository';

async function getProfileData(userId: string) {
  const supabase = await createClient();
  const userRepo = new UserRepository(true);
  
  try {
    // Get user with statistics
    const user = await userRepo.getUserWithStatistics(userId);
    
    if (!user) {
      return null;
    }

    // Get recent activity
    const recentActivity = await userRepo.getUserActivityLogs(userId, 10);
    
    // Calculate performance metrics
    const performanceMetrics = {
      completionRate: user.user_statistics?.tickets_completed && user.user_statistics?.tickets_assigned
        ? Math.round((user.user_statistics.tickets_completed / user.user_statistics.tickets_assigned) * 100)
        : 0,
      avgTimeToComplete: user.user_statistics?.avg_completion_time_hours || 0,
      conversionRate: user.user_statistics?.conversion_rate || 0,
    };

    // Calculate workload
    const workload = {
      currentTickets: user.user_statistics?.tickets_in_progress || 0,
      pendingTickets: user.user_statistics?.tickets_on_hold || 0,
      upcomingAppointments: 0, // Would need to fetch from appointments
    };

    return {
      user,
      statistics: user.user_statistics,
      recentActivity,
      performanceMetrics,
      workload,
    };
  } catch (error) {
    console.error('Error fetching profile data:', error);
    return null;
  }
}

export default async function ProfilePage() {
  // Get current user's ID
  const cookieStore = await cookies();
  const supabase = await createClient();
  
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (!user || error) {
    redirect('/auth/login');
  }

  // Get the app user ID from users table
  const { data: appUser } = await supabase
    .from('users')
    .select('id')
    .eq('email', user.email)
    .single();

  const userId = appUser?.id || user.id;
  
  // Fetch profile data server-side
  const profileData = await getProfileData(userId);
  
  if (!profileData) {
    // Handle case where profile data cannot be loaded
    redirect('/');
  }

  return <ProfileClient initialData={profileData} userId={userId} isOwnProfile={true} />;
}