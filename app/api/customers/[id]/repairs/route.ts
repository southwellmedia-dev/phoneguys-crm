import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { RepairTicketRepository } from '@/lib/repositories/repair-ticket.repository';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Initialize repository
    const ticketRepo = new RepairTicketRepository();

    // Fetch repairs for this customer
    const repairs = await ticketRepo.findByCustomer(id);

    return NextResponse.json(repairs);
  } catch (error) {
    console.error('Error fetching customer repairs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customer repairs' },
      { status: 500 }
    );
  }
}