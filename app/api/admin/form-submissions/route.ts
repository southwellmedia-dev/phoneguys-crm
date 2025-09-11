import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Verify user is authenticated and is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check if user is admin
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();
    
    if (userError || userData?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    // Get search params
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const limit = searchParams.get('limit') || '50';
    const offset = searchParams.get('offset') || '0';
    
    // Build query - querying form_submissions table, not appointments
    let query = supabase
      .from('form_submissions')
      .select(`
        *,
        appointments!form_submissions_appointment_id_fkey(
          id,
          appointment_number,
          status,
          scheduled_date,
          scheduled_time,
          customers(
            id,
            name,
            email,
            phone
          ),
          devices(
            id,
            manufacturer_name,
            model_name
          )
        )
      `)
      .eq('form_type', 'appointment')
      .order('created_at', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);
    
    if (status) {
      query = query.eq('status', status);
    }
    
    const { data: submissions, error } = await query;
    
    if (error) {
      console.error('Error fetching form submissions:', error);
      return NextResponse.json({ error: 'Failed to fetch submissions' }, { status: 500 });
    }
    
    // Transform the data for the frontend
    const transformedData = submissions?.map(submission => ({
      id: submission.id,
      customer_name: submission.customer_name || submission.appointments?.customers?.name,
      customer_email: submission.customer_email || submission.appointments?.customers?.email,
      customer_phone: submission.customer_phone || submission.appointments?.customers?.phone,
      device_info: submission.device_info || {
        name: submission.appointments?.devices?.model_name,
        manufacturer: submission.appointments?.devices?.manufacturer_name
      },
      issues: submission.issues || [],
      preferred_date: submission.preferred_date,
      preferred_time: submission.preferred_time,
      status: submission.status,
      appointment_id: submission.appointment_id,
      appointment_number: submission.appointments?.appointment_number,
      source_url: submission.source_url,
      created_at: submission.created_at
    }));
    
    return NextResponse.json({ 
      data: transformedData,
      total: transformedData?.length || 0
    });
    
  } catch (error) {
    console.error('Error in form submissions API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Verify user is authenticated and is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check if user is admin
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();
    
    if (userError || userData?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    const body = await request.json();
    const { id, action } = body;
    
    if (!id || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    let updateData: any = {};
    
    switch(action) {
      case 'approve':
        updateData = { status: 'processed', processed_at: new Date().toISOString() };
        break;
      case 'reject':
        updateData = { status: 'rejected', processed_at: new Date().toISOString() };
        break;
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
    
    const { data, error } = await supabase
      .from('form_submissions')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating submission:', error);
      return NextResponse.json({ error: 'Failed to update submission' }, { status: 500 });
    }
    
    return NextResponse.json({ data });
    
  } catch (error) {
    console.error('Error in form submissions API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}