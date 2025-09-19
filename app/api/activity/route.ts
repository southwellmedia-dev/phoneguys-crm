import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';

export interface ActivityLogItem {
  id: string;
  user_id: string;
  user_name?: string;
  user_avatar?: string;
  activity_type: string;
  entity_type?: string;
  entity_id?: string;
  details?: Record<string, any>;
  created_at: string;
  // Formatted fields for display
  title?: string;
  description?: string;
  icon?: string;
  color?: string;
}

// Map activity types to user-friendly titles and icons
const getActivityDisplay = (activity: any): { title: string; description: string; icon: string; color: string; hideActivity?: boolean } => {
  const { activity_type, entity_type, details, entity_id } = activity;
  
  switch (activity_type) {
    // Ticket events
    case 'ticket_created':
      return {
        title: `New ticket created`,
        description: details?.ticket_number ? `Ticket #${details.ticket_number}` : 'New repair ticket',
        icon: 'package',
        color: 'blue'
      };
      
    case 'ticket_status_changed':
      const status = details?.new_status || details?.to_status;
      const oldStatus = details?.old_status || details?.from_status;
      
      // Skip if we don't have actual status information
      if (!status) {
        return { hideActivity: true, title: '', description: '', icon: '', color: '' };
      }
      
      // Skip the duplicate entries that don't have ticket numbers (entity_type: 'ticket')
      // We only want the ones with entity_type: 'repair_ticket' that have ticket numbers
      if (entity_type === 'ticket' && !details?.ticket_number) {
        return { hideActivity: true, title: '', description: '', icon: '', color: '' };
      }
      
      return {
        title: `Ticket status changed`,
        description: `${oldStatus ? `${oldStatus} → ` : ''}${status}${details?.ticket_number ? ` (#${details.ticket_number})` : ''}`,
        icon: 'refresh',
        color: status === 'completed' ? 'green' : status === 'in_progress' ? 'yellow' : status === 'on_hold' ? 'orange' : 'blue'
      };
      
    case 'ticket_status_update':
      // This is just an API call log, skip it
      return { hideActivity: true, title: '', description: '', icon: '', color: '' };
      
    case 'ticket_assigned':
      // Check if this is from an appointment conversion
      const isFromConversion = details?.from_appointment || details?.appointment_number;
      return {
        title: `Ticket assigned`,
        description: details?.ticket_number ? 
          `Ticket #${details.ticket_number}${details?.assigned_to_name ? ` assigned to ${details.assigned_to_name}` : ' assigned'}${isFromConversion && details?.appointment_number ? ` (from ${details.appointment_number})` : ''}` : 
          'Technician assigned',
        icon: 'user-check',
        color: isFromConversion ? 'green' : 'purple'
      };
      
    case 'ticket_completed':
      return {
        title: `Ticket completed`,
        description: details?.ticket_number ? `Ticket #${details.ticket_number} completed` : 'Repair completed',
        icon: 'check-circle',
        color: 'green'
      };
      
    // Timer events
    case 'timer_start':
      return {
        title: `Timer started`,
        description: details?.ticket_number ? `Working on ticket #${details.ticket_number}` : 
                     entity_id ? `Working on ticket` : 'Work started',
        icon: 'play',
        color: 'blue'
      };
      
    case 'timer_stop':
    case 'timer_admin_stop':
      const duration = details?.duration;
      const formattedDuration = duration ? 
        (duration >= 60 ? `${Math.floor(duration / 60)}h ${duration % 60}m` : `${duration}m`) : 
        'Time';
      return {
        title: activity_type === 'timer_admin_stop' ? `Timer stopped by admin` : `Timer stopped`,
        description: `${formattedDuration} recorded${details?.ticket_number ? ` on #${details.ticket_number}` : ''}`,
        icon: 'pause',
        color: 'orange'
      };
      
    // Note events
    case 'note_created':
      // Hide internal notes from activity feed
      if (details?.note_type === 'internal') {
        return { hideActivity: true, title: '', description: '', icon: '', color: '' };
      }
      return {
        title: `Note added`,
        description: details?.ticket_number ? `Note added to ticket #${details.ticket_number}` : 'Note added to ticket',
        icon: 'message-circle',
        color: 'blue'
      };
      
    // Customer events
    case 'customer_created':
      return {
        title: `New customer`,
        description: details?.customer_name || 'Customer registered',
        icon: 'user-plus',
        color: 'green'
      };
      
    case 'customer_updated':
      return {
        title: `Customer updated`,
        description: details?.customer_name || 'Customer information updated',
        icon: 'user',
        color: 'blue'
      };
      
    // Appointment events
    case 'appointment_created':
      // Highlight if it's a new appointment request (scheduled status)
      const isNewRequest = details?.status === 'scheduled' || details?.source === 'website';
      return {
        title: isNewRequest ? `New Appointment Request` : `Appointment scheduled`,
        description: details?.appointment_number ? 
          `${details.appointment_number} - ${details?.appointment_date ? new Date(details.appointment_date).toLocaleDateString() : ''}${details?.customer_name ? ` - ${details.customer_name}` : ''}` : 
          (details?.appointment_date ? `Scheduled for ${new Date(details.appointment_date).toLocaleDateString()}${details?.customer_name ? ` - ${details.customer_name}` : ''}` : 'New appointment'),
        icon: 'calendar',
        color: isNewRequest ? 'yellow' : 'purple'
      };
    
    case 'appointment_confirmed':
      return {
        title: `Appointment Confirmed`,
        description: `${details?.appointment_number || 'Appointment'} - ${details?.customer_name || 'Customer'} confirmed for ${details?.appointment_date ? new Date(details.appointment_date).toLocaleDateString() : 'scheduled date'}`,
        icon: 'check-circle',
        color: 'green'
      };
    
    case 'appointment_checked_in':
      return {
        title: `Customer Checked In`,
        description: `${details?.appointment_number || 'Appointment'} - ${details?.customer_name || 'Customer'} has arrived`,
        icon: 'user-check',
        color: 'blue'
      };
    
    case 'appointment_status_changed':
      return {
        title: `Appointment Status Updated`,
        description: `${details?.appointment_number || 'Appointment'} - ${details?.old_status ? `${details.old_status} → ` : ''}${details?.new_status || 'status changed'}`,
        icon: 'refresh',
        color: details?.new_status === 'cancelled' || details?.new_status === 'no_show' ? 'red' : 
               details?.new_status === 'confirmed' || details?.new_status === 'completed' ? 'green' :
               details?.new_status === 'checked_in' || details?.new_status === 'in_progress' ? 'blue' : 'gray'
      };
      
    case 'appointment_converted':
      return {
        title: `Appointment converted to ticket`,
        description: `${details?.appointment_number || 'Appointment'} → Ticket #${details?.ticket_number || 'New'}${details?.customer_name ? ` for ${details.customer_name}` : ''}`,
        icon: 'arrow-right',
        color: 'green'
      };
    
    case 'appointment_cancelled':
      return {
        title: `Appointment Cancelled`,
        description: `${details?.appointment_number || 'Appointment'} - ${details?.customer_name || 'Customer'}${details?.reason ? ` - Reason: ${details.reason}` : ''}`,
        icon: 'alert-triangle',
        color: 'red'
      };
    
    case 'appointment_no_show':
      return {
        title: `Appointment No Show`,
        description: `${details?.appointment_number || 'Appointment'} - ${details?.customer_name || 'Customer'} did not arrive`,
        icon: 'alert-triangle',
        color: 'orange'
      };
      
    // Security events
    case 'security_login_success':
      return {
        title: `User logged in`,
        description: 'Successful login',
        icon: 'lock',
        color: 'green'
      };
      
    case 'security_login_failure':
      return {
        title: `Login failed`,
        description: 'Failed login attempt',
        icon: 'alert-triangle',
        color: 'red'
      };
      
    // Default
    default:
      return {
        title: activity_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        description: entity_type || 'System activity',
        icon: 'activity',
        color: 'gray'
      };
  }
};

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const entityType = searchParams.get('entity_type');
    const activityType = searchParams.get('activity_type');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    // Use service client for full access to activity logs
    const serviceClient = createServiceClient();

    // Build query for activity logs
    let query = serviceClient
      .from('user_activity_logs')
      .select(`
        *,
        user:users!user_activity_logs_user_id_fkey (
          id,
          full_name,
          email,
          avatar_url
        )
      `)
      .order('created_at', { ascending: false })
      .limit(limit)
      .range(offset, offset + limit - 1);

    // Apply filters
    if (entityType) {
      query = query.eq('entity_type', entityType);
    }

    if (activityType) {
      query = query.eq('activity_type', activityType);
    }

    // Filter out admin and server events for regular users
    query = query.not('activity_type', 'like', 'admin_%')
                 .not('activity_type', 'like', 'server_%')
                 .not('activity_type', 'like', 'system_%');

    // Date range filter
    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    const { data: activities, error } = await query;

    if (error) {
      console.error('Error fetching activity logs:', error);
      throw error;
    }

    // Get ticket numbers for timer activities
    const timerActivities = (activities || []).filter(a => 
      (a.activity_type === 'timer_start' || a.activity_type === 'timer_stop' || a.activity_type === 'timer_admin_stop') &&
      a.entity_id && a.entity_type === 'ticket'
    );
    
    let ticketNumbers: Record<string, string> = {};
    if (timerActivities.length > 0) {
      const ticketIds = [...new Set(timerActivities.map(a => a.entity_id).filter(Boolean))];
      const { data: tickets } = await serviceClient
        .from('repair_tickets')
        .select('id, ticket_number')
        .in('id', ticketIds);
      
      if (tickets) {
        ticketNumbers = tickets.reduce((acc, t) => {
          acc[t.id] = t.ticket_number;
          return acc;
        }, {} as Record<string, string>);
      }
    }

    // Format activities for display and filter out phantom activities
    const formattedActivities: ActivityLogItem[] = (activities || [])
      .map(activity => {
        // Add ticket number to details for timer activities
        if ((activity.activity_type === 'timer_start' || activity.activity_type === 'timer_stop' || activity.activity_type === 'timer_admin_stop') 
            && activity.entity_id && ticketNumbers[activity.entity_id]) {
          activity.details = {
            ...activity.details,
            ticket_number: ticketNumbers[activity.entity_id]
          };
        }
        
        const display = getActivityDisplay(activity);
        
        // Skip activities that should be hidden
        if (display.hideActivity) {
          return null;
        }
        
        // Handle system-generated activities (admin user used for system events)
        const isSystemUser = activity.user_id === '11111111-1111-1111-1111-111111111111' && 
                            (activity.activity_type === 'appointment_created' && activity.details?.source === 'website');
        const userName = isSystemUser 
          ? 'Website Form' 
          : (activity.user?.full_name || activity.user?.email || 'Unknown');
        
        return {
          id: activity.id,
          user_id: activity.user_id,
          user_name: userName,
          user_avatar: activity.user?.avatar_url,
          activity_type: activity.activity_type,
          entity_type: activity.entity_type,
          entity_id: activity.entity_id,
          details: activity.details,
          created_at: activity.created_at,
          title: display.title,
          description: display.description,
          icon: display.icon,
          color: display.color
        };
      })
      .filter(activity => activity !== null) as ActivityLogItem[];

    // Get activity type counts for filtering
    const { data: typeCounts } = await serviceClient
      .from('user_activity_logs')
      .select('activity_type')
      .not('activity_type', 'like', 'admin_%')
      .not('activity_type', 'like', 'server_%')
      .not('activity_type', 'like', 'system_%')
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()); // Last 7 days

    const activityTypeCounts = typeCounts?.reduce((acc: Record<string, number>, item) => {
      acc[item.activity_type] = (acc[item.activity_type] || 0) + 1;
      return acc;
    }, {}) || {};

    return NextResponse.json({
      data: formattedActivities,
      total: formattedActivities.length,
      filters: {
        limit,
        offset,
        entityType,
        activityType,
        startDate,
        endDate
      },
      activityTypes: Object.keys(activityTypeCounts).sort(),
      typeCounts: activityTypeCounts
    });
    
  } catch (error) {
    console.error('Error fetching activity feed:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activity feed' },
      { status: 500 }
    );
  }
}