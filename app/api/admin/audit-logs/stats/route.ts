import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { SecureAPI } from '@/lib/utils/api-helpers';

/**
 * GET /api/admin/audit-logs/stats
 * Fetch audit log statistics for the admin dashboard
 * Admin only endpoint
 */
export const GET = SecureAPI.admin(async (request: NextRequest) => {
  try {
    const supabase = await createClient();
    
    // Check admin authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (!user || authError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify admin role
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userError || userData?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Calculate date ranges
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Run all statistics queries in parallel
    const [
      totalActivitiesResult,
      securityEventsResult,
      activeUsersResult,
      failedLoginsResult,
      criticalEventsResult
    ] = await Promise.all([
      // Total activities in last 30 days
      supabase
        .from('user_activity_logs')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', thirtyDaysAgo.toISOString()),

      // Security events in last 30 days
      supabase
        .from('user_activity_logs')
        .select('id', { count: 'exact', head: true })
        .like('activity_type', 'security_%')
        .gte('created_at', thirtyDaysAgo.toISOString()),

      // Active users (users with activity in last 30 days)
      supabase
        .from('user_activity_logs')
        .select('user_id', { count: 'exact' })
        .gte('created_at', thirtyDaysAgo.toISOString())
        .not('user_id', 'is', null),

      // Failed logins in last 24 hours
      supabase
        .from('user_activity_logs')
        .select('id', { count: 'exact', head: true })
        .eq('activity_type', 'security_login_failure')
        .gte('created_at', twentyFourHoursAgo.toISOString()),

      // Critical security events
      supabase
        .from('user_activity_logs')
        .select('id', { count: 'exact', head: true })
        .like('activity_type', 'security_%')
        .eq('details->>risk_level', 'critical')
        .gte('created_at', thirtyDaysAgo.toISOString())
    ]);

    // Count unique active users
    let uniqueActiveUsers = 0;
    if (activeUsersResult.data) {
      const uniqueUserIds = new Set(activeUsersResult.data.map(log => log.user_id));
      uniqueActiveUsers = uniqueUserIds.size;
    }

    // Get top activity types
    const { data: topActivities } = await supabase
      .from('user_activity_logs')
      .select('activity_type')
      .gte('created_at', thirtyDaysAgo.toISOString())
      .limit(1000);

    const activityCounts: Record<string, number> = {};
    topActivities?.forEach(log => {
      activityCounts[log.activity_type] = (activityCounts[log.activity_type] || 0) + 1;
    });

    const topActivityTypes = Object.entries(activityCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([type, count]) => ({ type, count }));

    // Get recent security alerts (high/critical risk events)
    const { data: recentAlerts } = await supabase
      .from('user_activity_logs')
      .select(`
        id,
        activity_type,
        details,
        created_at,
        user:users!user_activity_logs_user_id_fkey(name, email)
      `)
      .like('activity_type', 'security_%')
      .in('details->>risk_level', ['high', 'critical'])
      .gte('created_at', twentyFourHoursAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(10);

    const stats = {
      totalActivities: totalActivitiesResult.count || 0,
      securityEvents: securityEventsResult.count || 0,
      activeUsers: uniqueActiveUsers,
      failedLogins: failedLoginsResult.count || 0,
      criticalEvents: criticalEventsResult.count || 0,
      topActivityTypes,
      recentAlerts: recentAlerts || [],
      
      // Add some trending data
      trends: {
        activitiesGrowth: await calculateGrowthRate(supabase, 'user_activity_logs', 30),
        securityEventsGrowth: await calculateSecurityGrowthRate(supabase, 30),
        activeUsersGrowth: await calculateActiveUsersGrowthRate(supabase, 30)
      }
    };

    return NextResponse.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Error fetching audit stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

/**
 * Calculate growth rate for activities
 */
async function calculateGrowthRate(supabase: any, table: string, days: number): Promise<number> {
  try {
    const now = new Date();
    const periodAgo = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    const twoPeriodAgo = new Date(now.getTime() - 2 * days * 24 * 60 * 60 * 1000);

    const [currentPeriod, previousPeriod] = await Promise.all([
      supabase
        .from(table)
        .select('id', { count: 'exact', head: true })
        .gte('created_at', periodAgo.toISOString()),
      
      supabase
        .from(table)
        .select('id', { count: 'exact', head: true })
        .gte('created_at', twoPeriodAgo.toISOString())
        .lt('created_at', periodAgo.toISOString())
    ]);

    const current = currentPeriod.count || 0;
    const previous = previousPeriod.count || 0;

    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  } catch {
    return 0;
  }
}

/**
 * Calculate growth rate for security events
 */
async function calculateSecurityGrowthRate(supabase: any, days: number): Promise<number> {
  try {
    const now = new Date();
    const periodAgo = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    const twoPeriodAgo = new Date(now.getTime() - 2 * days * 24 * 60 * 60 * 1000);

    const [currentPeriod, previousPeriod] = await Promise.all([
      supabase
        .from('user_activity_logs')
        .select('id', { count: 'exact', head: true })
        .like('activity_type', 'security_%')
        .gte('created_at', periodAgo.toISOString()),
      
      supabase
        .from('user_activity_logs')
        .select('id', { count: 'exact', head: true })
        .like('activity_type', 'security_%')
        .gte('created_at', twoPeriodAgo.toISOString())
        .lt('created_at', periodAgo.toISOString())
    ]);

    const current = currentPeriod.count || 0;
    const previous = previousPeriod.count || 0;

    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  } catch {
    return 0;
  }
}

/**
 * Calculate growth rate for active users
 */
async function calculateActiveUsersGrowthRate(supabase: any, days: number): Promise<number> {
  try {
    const now = new Date();
    const periodAgo = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    const twoPeriodAgo = new Date(now.getTime() - 2 * days * 24 * 60 * 60 * 1000);

    const [currentPeriod, previousPeriod] = await Promise.all([
      supabase
        .from('user_activity_logs')
        .select('user_id')
        .gte('created_at', periodAgo.toISOString())
        .not('user_id', 'is', null),
      
      supabase
        .from('user_activity_logs')
        .select('user_id')
        .gte('created_at', twoPeriodAgo.toISOString())
        .lt('created_at', periodAgo.toISOString())
        .not('user_id', 'is', null)
    ]);

    const currentUsers = new Set(currentPeriod.data?.map(log => log.user_id)).size;
    const previousUsers = new Set(previousPeriod.data?.map(log => log.user_id)).size;

    if (previousUsers === 0) return currentUsers > 0 ? 100 : 0;
    return Math.round(((currentUsers - previousUsers) / previousUsers) * 100);
  } catch {
    return 0;
  }
}