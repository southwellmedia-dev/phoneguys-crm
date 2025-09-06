import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin or the ticket is assigned to them
    const { data: ticket, error: fetchError } = await supabase
      .from('repair_tickets')
      .select('id, ticket_number, timer_is_running, timer_started_at, assigned_to')
      .eq('id', params.id)
      .single();

    if (fetchError || !ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    // Check if timer is actually running
    if (!ticket.timer_is_running) {
      return NextResponse.json({ 
        success: true, 
        message: 'Timer is not running for this ticket' 
      });
    }

    // Check user permissions (admin or assigned user)
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('auth_user_id', user.id)
      .single();

    const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin';
    const isAssigned = ticket.assigned_to === user.id;

    if (!isAdmin && !isAssigned) {
      return NextResponse.json({ 
        error: 'You do not have permission to clear this timer' 
      }, { status: 403 });
    }

    // Clear the timer
    const { error: updateError } = await supabase
      .from('repair_tickets')
      .update({
        timer_is_running: false,
        timer_started_at: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id);

    if (updateError) {
      console.error('Error clearing timer:', updateError);
      return NextResponse.json({ error: 'Failed to clear timer' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Timer cleared for ticket ${ticket.ticket_number}`,
      ticket: {
        id: ticket.id,
        ticket_number: ticket.ticket_number,
        timer_is_running: false,
        timer_started_at: null
      }
    });

  } catch (error) {
    console.error('Error clearing timer:', error);
    return NextResponse.json(
      { error: 'Failed to clear timer' },
      { status: 500 }
    );
  }
}