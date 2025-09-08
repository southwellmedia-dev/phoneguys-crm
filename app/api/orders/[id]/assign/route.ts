import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';

interface Params {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const { assigned_to } = await request.json();

    // Check authentication
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use service role client for database update
    const serviceClient = createServiceClient();
    
    // Update the ticket assignment
    const { data, error } = await serviceClient
      .from('repair_tickets')
      .update({ 
        assigned_to: assigned_to || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating assignment:', error);
      return NextResponse.json(
        { error: 'Failed to update assignment' },
        { status: 500 }
      );
    }

    // The real-time subscription will handle updating all connected clients
    return NextResponse.json({ 
      success: true, 
      data,
      message: assigned_to ? 'Ticket assigned successfully' : 'Ticket unassigned'
    });
  } catch (error) {
    console.error('Error in assign route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}