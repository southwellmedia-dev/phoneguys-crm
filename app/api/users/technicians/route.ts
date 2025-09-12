import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Fetch all users (not just technicians)
    const { data: technicians, error } = await supabase
      .from('users')
      .select('id, full_name, email, role')
      .order('full_name');
    
    if (error) {
      console.error('Error fetching technicians:', error);
      return NextResponse.json(
        { error: 'Failed to fetch technicians' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ 
      data: technicians || [] 
    });
  } catch (error) {
    console.error('Error in technicians API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}