import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { RepairTicketRepository } from '@/lib/repositories/repair-ticket.repository';

export async function POST() {
  try {
    // Check if user is admin
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Clear all timer states in the database
    const ticketRepo = new RepairTicketRepository(true); // Use service role
    
    // Find all tickets with running timers
    const { data: tickets, error: fetchError } = await supabase
      .from('repair_tickets')
      .select('id, ticket_number')
      .eq('timer_is_running', true);

    if (fetchError) {
      console.error('Error fetching tickets with timers:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch tickets' }, { status: 500 });
    }

    if (!tickets || tickets.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'No active timers found',
        cleared: 0 
      });
    }

    // Clear each timer
    let clearedCount = 0;
    const errors: any[] = [];

    for (const ticket of tickets) {
      try {
        // Update the ticket to clear timer state
        const { error: updateError } = await supabase
          .from('repair_tickets')
          .update({
            timer_is_running: false,
            timer_started_at: null
          })
          .eq('id', ticket.id);

        if (updateError) {
          errors.push({ ticket: ticket.ticket_number, error: updateError.message });
        } else {
          clearedCount++;
          console.log(`Cleared timer for ticket ${ticket.ticket_number}`);
        }
      } catch (error) {
        errors.push({ ticket: ticket.ticket_number, error: String(error) });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Cleared ${clearedCount} timer(s)`,
      cleared: clearedCount,
      total: tickets.length,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('Error clearing timers:', error);
    return NextResponse.json(
      { error: 'Failed to clear timers' },
      { status: 500 }
    );
  }
}

// GET endpoint to check for active timers
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all tickets with running timers
    const { data: tickets, error } = await supabase
      .from('repair_tickets')
      .select('id, ticket_number, timer_started_at, assigned_to')
      .eq('timer_is_running', true);

    if (error) {
      console.error('Error fetching active timers:', error);
      return NextResponse.json({ error: 'Failed to fetch active timers' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      activeTimers: tickets || [],
      count: tickets?.length || 0
    });

  } catch (error) {
    console.error('Error checking timers:', error);
    return NextResponse.json(
      { error: 'Failed to check timers' },
      { status: 500 }
    );
  }
}