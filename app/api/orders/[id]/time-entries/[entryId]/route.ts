import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth/helpers';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; entryId: string } }
) {
  try {
    // Check authentication
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;

    // Create Supabase client (await it as it's async)
    const supabase = await createClient();
    
    // Check if user is admin
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userError || userData?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only administrators can delete time entries' },
        { status: 403 }
      );
    }

    // Delete the time entry
    const { error } = await supabase
      .from('time_entries')
      .delete()
      .eq('id', params.entryId)
      .eq('ticket_id', params.id);

    if (error) {
      console.error('Error deleting time entry:', error);
      return NextResponse.json(
        { error: 'Failed to delete time entry' },
        { status: 500 }
      );
    }

    // Update the ticket's total time
    const { data: entries } = await supabase
      .from('time_entries')
      .select('duration_minutes')
      .eq('ticket_id', params.id);

    const totalMinutes = entries?.reduce((sum, entry) => sum + (entry.duration_minutes || 0), 0) || 0;

    await supabase
      .from('repair_tickets')
      .update({ total_time_minutes: totalMinutes })
      .eq('id', params.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/orders/[id]/time-entries/[entryId]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}