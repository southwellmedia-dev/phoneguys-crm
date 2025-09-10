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
    
    // Build query
    let query = supabase
      .from('appointments')
      .select(`
        *,
        customer:customers!appointments_customer_id_fkey(
          id,
          name,
          email,
          phone
        ),
        device:devices!appointments_device_id_fkey(
          id,
          name,
          brand
        ),
        service:services!appointments_service_id_fkey(
          id,
          name,
          category
        )
      `)
      .eq('source', 'website')
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
      customer_name: submission.customer?.name || submission.customer_name,
      customer_email: submission.customer?.email || submission.customer_email,
      customer_phone: submission.customer?.phone || submission.customer_phone,
      device_info: {
        name: submission.device?.name || submission.device_model,
        brand: submission.device?.brand,
        color: submission.device_color,
        storageSize: submission.storage_size
      },
      issues: submission.issues || [],
      preferred_date: submission.appointment_date,
      preferred_time: submission.appointment_time,
      status: submission.status === 'confirmed' ? 'processed' : 
              submission.status === 'cancelled' ? 'rejected' : 'pending',
      appointment_id: submission.id,
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
        updateData = { status: 'confirmed' };
        break;
      case 'reject':
        updateData = { status: 'cancelled' };
        break;
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
    
    const { data, error } = await supabase
      .from('appointments')
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