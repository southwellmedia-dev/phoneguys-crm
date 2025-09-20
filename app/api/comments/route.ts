import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { CommentRepository } from '@/lib/repositories/comment.repository';
import { CommentService } from '@/lib/services/comment.service';
import { InternalNotificationService } from '@/lib/services/internal-notification.service';
import { UserRepository } from '@/lib/repositories/user.repository';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get('entityType');
    const entityId = searchParams.get('entityId');
    
    if (!entityType || !entityId) {
      return NextResponse.json(
        { error: 'entityType and entityId are required' },
        { status: 400 }
      );
    }

    // Use regular client with auth context
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const repo = new CommentRepository(supabase);
    
    // Parse all query options
    const options: any = {
      include_reactions: searchParams.get('include_reactions') !== 'false',
      include_replies: searchParams.get('include_replies') === 'true',
      sort_order: searchParams.get('sort_order') || 'desc',
      parent_comment_id: searchParams.get('parent_comment_id') === 'null' ? null : searchParams.get('parent_comment_id'),
      visibility: searchParams.getAll('visibility').length > 0 ? searchParams.getAll('visibility') : undefined
    };
    
    const comments = await repo.getComments(
      entityType as any,
      entityId,
      options
    );
    
    return NextResponse.json({ data: comments });
  } catch (error) {
    console.error('Error fetching comments:', error);
    console.error('Request params:', { entityType, entityId });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch comments' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const { entityType, entityId, content, visibility, parentCommentId, attachments } = data;

    if (!entityType || !entityId || !content) {
      return NextResponse.json(
        { error: 'entityType, entityId, and content are required' },
        { status: 400 }
      );
    }

    // Get the app user ID from the users table
    const userRepo = new UserRepository(false);
    const userData = await userRepo.findByEmail(user.email || '');
    const appUserId = userData?.id || user.id;

    console.log('User IDs:', {
      authId: user.id,
      appUserId: appUserId,
      email: user.email
    });

    // Fetch entity details for activity logging
    let entityDetails: any = {};
    try {
      if (entityType === 'ticket') {
        const { data: ticket } = await supabase
          .from('repair_tickets')
          .select('ticket_number, customers!inner(full_name, name)')
          .eq('id', entityId)
          .single();
        
        if (ticket) {
          entityDetails.ticketNumber = ticket.ticket_number;
          entityDetails.customerName = ticket.customers?.full_name || ticket.customers?.name;
        }
      } else if (entityType === 'appointment') {
        const { data: appointment } = await supabase
          .from('appointments')
          .select('appointment_number, customers!inner(full_name, name)')
          .eq('id', entityId)
          .single();
        
        if (appointment) {
          entityDetails.appointmentNumber = appointment.appointment_number;
          entityDetails.customerName = appointment.customers?.full_name || appointment.customers?.name;
        }
      } else if (entityType === 'customer') {
        const { data: customer } = await supabase
          .from('customers')
          .select('full_name, name')
          .eq('id', entityId)
          .single();
        
        if (customer) {
          entityDetails.customerName = customer.full_name || customer.name;
        }
      }
    } catch (detailError) {
      // Don't fail if we can't get entity details
      console.error('Failed to fetch entity details:', detailError);
    }

    // Create service with notification support
    // Note: We use service role (true) for notifications because users need to create
    // notifications for OTHER users when mentioning them, which RLS doesn't allow
    const service = new CommentService(
      new CommentRepository(supabase),
      new InternalNotificationService(true), // Use service role for notifications
      userRepo // Reuse the same repository instance
    );

    const result = await service.postComment(
      entityType,
      entityId,
      content,
      {
        userId: appUserId, // Use app user ID for comment ownership
        authUserId: user.id, // Pass auth ID for RLS checks
        visibility,
        parentCommentId,
        attachments,
        entityDetails // Pass entity details for activity logging
      }
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({ data: result.comment });
  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json(
      { error: 'Failed to create comment' },
      { status: 500 }
    );
  }
}