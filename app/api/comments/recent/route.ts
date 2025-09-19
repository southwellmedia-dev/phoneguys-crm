import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';

export interface RecentComment {
  id: string;
  entity_type: string;
  entity_id: string;
  entity_name?: string; // Ticket number, appointment ID, etc.
  content: string;
  content_preview?: string; // Truncated content for display
  user_id: string;
  user_name?: string;
  user_avatar?: string;
  visibility: 'public' | 'internal' | 'private';
  created_at: string;
  is_pinned?: boolean;
  is_resolved?: boolean;
  link?: string; // Link to the entity
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const entityType = searchParams.get('entity_type');
    const visibility = searchParams.get('visibility');

    // Use service client for full access
    const serviceClient = createServiceClient();

    // Fetch recent comments from both tables
    const [commentsResult, notesResult] = await Promise.all([
      // Fetch from comments table
      serviceClient
        .from('comments')
        .select(`
          *,
          user:users!comments_user_id_fkey (
            id,
            full_name,
            email,
            avatar_url
          )
        `)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(limit),
      
      // Fetch from ticket_notes table
      serviceClient
        .from('ticket_notes')
        .select(`
          *,
          user:users!ticket_notes_user_id_fkey (
            id,
            full_name,
            email
          ),
          ticket:repair_tickets!ticket_notes_ticket_id_fkey (
            id,
            ticket_number,
            status
          )
        `)
        .order('created_at', { ascending: false })
        .limit(limit)
    ]);

    if (commentsResult.error) {
      console.error('Error fetching comments:', commentsResult.error);
    }
    
    if (notesResult.error) {
      console.error('Error fetching ticket notes:', notesResult.error);
    }

    // Format comments
    const formattedComments: RecentComment[] = [];

    // Add comments from comments table
    if (commentsResult.data) {
      for (const comment of commentsResult.data) {
        // Skip system-generated comments
        if (comment.content.startsWith('Status changed from')) continue;
        if (comment.content.startsWith('Technician Note:')) continue;
        if (comment.content.startsWith('System Note:')) continue;
        if (comment.content.startsWith('Converted from appointment')) continue;
        if (comment.content.startsWith('Appointment Notes:')) continue;
        if (comment.content.startsWith('Updated Notes:')) continue;
        
        // Skip if filtering by visibility and doesn't match
        if (visibility && comment.visibility !== visibility) continue;
        if (entityType && comment.entity_type !== entityType) continue;

        // Get entity name based on type
        let entityName = '';
        let link = '';
        
        if (comment.entity_type === 'ticket' && comment.entity_id) {
          // Fetch ticket info
          const { data: ticket } = await serviceClient
            .from('repair_tickets')
            .select('ticket_number')
            .eq('id', comment.entity_id)
            .single();
          
          if (ticket) {
            entityName = `Ticket #${ticket.ticket_number}`;
            link = `/orders/${comment.entity_id}`;
          }
        } else if (comment.entity_type === 'appointment' && comment.entity_id) {
          // Fetch appointment info
          const { data: appointment } = await serviceClient
            .from('appointments')
            .select('appointment_number')
            .eq('id', comment.entity_id)
            .single();
          
          if (appointment) {
            entityName = `Appointment #${appointment.appointment_number}`;
            link = `/appointments/${comment.entity_id}`;
          }
        } else if (comment.entity_type === 'customer' && comment.entity_id) {
          link = `/customers/${comment.entity_id}`;
          entityName = 'Customer';
        }

        // Truncate content for preview
        const contentPreview = comment.content.length > 100 
          ? comment.content.substring(0, 100) + '...'
          : comment.content;

        formattedComments.push({
          id: comment.id,
          entity_type: comment.entity_type,
          entity_id: comment.entity_id,
          entity_name: entityName,
          content: comment.content,
          content_preview: contentPreview,
          user_id: comment.user_id,
          user_name: comment.user?.full_name || comment.user?.email || 'Unknown',
          user_avatar: comment.user?.avatar_url,
          visibility: comment.visibility || 'internal',
          created_at: comment.created_at,
          is_pinned: comment.is_pinned,
          is_resolved: comment.is_resolved,
          link
        });
      }
    }

    // Add comments from ticket_notes table
    if (notesResult.data) {
      for (const note of notesResult.data) {
        // Skip system-generated notes - we only want real user comments
        if (note.note_type === 'system') continue;
        
        // Skip automated status change notes
        if (note.content.startsWith('Status changed from')) continue;
        if (note.content.startsWith('Technician Note:')) continue;
        if (note.content.startsWith('System Note:')) continue;
        if (note.content.startsWith('Converted from appointment')) continue;
        if (note.content.startsWith('Appointment Notes:')) continue;
        if (note.content.startsWith('Updated Notes:')) continue;
        
        // Skip if filtering and doesn't match
        if (entityType && entityType !== 'ticket') continue;
        if (visibility === 'public' && note.note_type === 'internal') continue;

        const contentPreview = note.content.length > 100 
          ? note.content.substring(0, 100) + '...'
          : note.content;

        formattedComments.push({
          id: note.id,
          entity_type: 'ticket',
          entity_id: note.ticket_id,
          entity_name: note.ticket?.ticket_number ? `Ticket #${note.ticket.ticket_number}` : 'Ticket',
          content: note.content,
          content_preview: contentPreview,
          user_id: note.user_id,
          user_name: note.user?.full_name || note.user?.email || 'Unknown',
          visibility: note.note_type === 'internal' ? 'internal' : 'public',
          created_at: note.created_at,
          link: `/orders/${note.ticket_id}`
        });
      }
    }

    // Sort all comments by date and limit
    formattedComments.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    
    const finalComments = formattedComments.slice(0, limit);

    return NextResponse.json({
      data: finalComments,
      total: finalComments.length
    });
    
  } catch (error) {
    console.error('Error fetching recent comments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recent comments' },
      { status: 500 }
    );
  }
}