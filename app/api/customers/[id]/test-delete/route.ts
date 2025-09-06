import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const resolvedParams = await params;
    const customerId = resolvedParams.id;
    
    const supabase = await createClient();
    
    // Test: Just try to delete the customer directly
    console.log('Test delete for customer:', customerId);
    
    const { data, error } = await supabase
      .from('customers')
      .delete()
      .eq('id', customerId)
      .select();
    
    if (error) {
      console.error('Delete error:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      
      return NextResponse.json(
        { 
          error: 'Failed to delete customer',
          details: error.message,
          code: error.code,
          hint: error.hint
        },
        { status: 500 }
      );
    }
    
    console.log('Delete successful:', data);
    
    return NextResponse.json({ 
      success: true, 
      deleted: data 
    });
    
  } catch (error: any) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}