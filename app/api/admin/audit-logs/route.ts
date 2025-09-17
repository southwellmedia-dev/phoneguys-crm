import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { SecureAPI } from '@/lib/utils/api-helpers';

/**
 * GET /api/admin/audit-logs
 * Fetch audit logs with filtering and pagination
 * Admin only endpoint with full security and audit logging
 */
export const GET = SecureAPI.admin(async (request: NextRequest) => {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    
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

    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = Math.min(parseInt(searchParams.get('pageSize') || '50', 10), 200);
    const userId = searchParams.get('userId') || undefined;
    const activityType = searchParams.get('activityType') || undefined;
    const entityType = searchParams.get('entityType') || undefined;
    const dateRange = searchParams.get('dateRange') || undefined;
    const search = searchParams.get('search') || undefined;
    const isExport = searchParams.get('export') === 'true';

    // Build base query
    let query = supabase
      .from('user_activity_logs')
      .select(`
        id,
        user_id,
        activity_type,
        entity_type,
        entity_id,
        details,
        created_at,
        user:users!user_activity_logs_user_id_fkey(
          full_name,
          email,
          role
        )
      `, { count: 'exact' });

    // Apply filters
    if (userId) {
      query = query.eq('user_id', userId);
    }

    if (activityType) {
      query = query.eq('activity_type', activityType);
    }

    if (entityType) {
      query = query.eq('entity_type', entityType);
    }

    if (search) {
      query = query.or(`activity_type.ilike.%${search}%,entity_type.ilike.%${search}%,details->>name.ilike.%${search}%`);
    }

    // Apply date range filter
    if (dateRange) {
      const now = new Date();
      let startDate: Date;

      switch (dateRange) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'yesterday':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
          query = query.lt('created_at', new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString());
          break;
        case '7days':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30days':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(0); // Beginning of time
      }

      query = query.gte('created_at', startDate.toISOString());
    }

    // Apply ordering
    query = query.order('created_at', { ascending: false });

    // Handle export vs pagination
    if (isExport) {
      // For exports, get all results (up to a reasonable limit)
      const { data, error } = await query.limit(10000);
      
      if (error) {
        console.error('Error fetching audit logs for export:', error);
        return NextResponse.json({ error: 'Failed to export audit logs' }, { status: 500 });
      }

      // Convert to CSV
      const csv = convertToCSV(data || []);
      
      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="audit-logs-${new Date().toISOString().split('T')[0]}.csv"`
        }
      });
    } else {
      // For normal requests, apply pagination
      const offset = (page - 1) * pageSize;
      query = query.range(offset, offset + pageSize - 1);

      const { data, error, count } = await query;

      if (error) {
        console.error('Error fetching audit logs:', error);
        return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        data: data || [],
        total: count || 0,
        page,
        pageSize,
        totalPages: Math.ceil((count || 0) / pageSize)
      });
    }

  } catch (error) {
    console.error('Error in audit logs API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

/**
 * Convert audit logs to CSV format
 */
function convertToCSV(logs: any[]): string {
  if (logs.length === 0) return 'No data';

  const headers = [
    'Timestamp',
    'User Name',
    'User Email',
    'User Role',
    'Activity Type',
    'Entity Type',
    'Entity ID',
    'Risk Level',
    'IP Address',
    'Details'
  ];

  const rows = logs.map(log => [
    log.created_at,
    log.user?.full_name || 'System',
    log.user?.email || '',
    log.user?.role || '',
    log.activity_type,
    log.entity_type || '',
    log.entity_id || '',
    log.details?.risk_level || '',
    log.details?.ip_address || '',
    JSON.stringify(log.details).replace(/"/g, '""') // Escape quotes for CSV
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => 
      row.map(field => 
        typeof field === 'string' && field.includes(',') 
          ? `"${field}"` 
          : field
      ).join(',')
    )
  ].join('\n');

  return csvContent;
}