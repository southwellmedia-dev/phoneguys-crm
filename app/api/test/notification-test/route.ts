import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    // Create a public client with anon key
    const publicClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    const notificationData = {
      ticket_id: null,
      notification_type: 'new_ticket',
      recipient_email: 'test@example.com',
      subject: 'Test Notification',
      content: 'This is a test notification',
      status: 'pending',
      scheduled_for: new Date().toISOString()
    };
    
    console.log('Attempting to insert notification:', notificationData);
    
    const { data, error } = await publicClient
      .from('notifications')
      .insert(notificationData)
      .select()
      .single();
    
    if (error) {
      console.error('Notification insert error:', error);
      return NextResponse.json({ 
        success: false,
        error: 'Failed to create notification',
        details: error,
        attempted_data: notificationData
      });
    }
    
    console.log('Notification created:', data);
    
    return NextResponse.json({ 
      success: true,
      notification: data
    });
    
  } catch (error) {
    return NextResponse.json({ 
      error: 'Test failed', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}