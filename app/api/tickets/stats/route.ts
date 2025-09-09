import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { RepairTicketRepository } from '@/lib/repositories/repair-ticket.repository';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Initialize repository with service role for full access
    const ticketRepo = new RepairTicketRepository(true);

    // Fetch all tickets
    const allTickets = await ticketRepo.findAllWithCustomers();

    // Get today's date for filtering
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Calculate statistics
    const stats = {
      total: allTickets.length,
      new: allTickets.filter(t => t.status === 'new').length,
      in_progress: allTickets.filter(t => t.status === 'in_progress').length,
      on_hold: allTickets.filter(t => 
        t.status === 'waiting_for_parts' || t.status === 'on_hold'
      ).length,
      completed: allTickets.filter(t => t.status === 'completed').length,
      today: allTickets.filter(t => {
        const createdDate = new Date(t.created_at);
        return createdDate >= today;
      }).length,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching ticket stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ticket statistics' },
      { status: 500 }
    );
  }
}