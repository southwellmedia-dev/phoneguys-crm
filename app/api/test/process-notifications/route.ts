import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { SendGridService } from '@/lib/services/email/sendgrid.service';

export async function POST(request: NextRequest) {
  try {
    // Create a service role client to bypass RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    // Get pending notifications
    const { data: notifications, error: fetchError } = await supabase
      .from('notifications')
      .select('*')
      .eq('status', 'pending')
      .limit(10);
    
    if (fetchError) {
      return NextResponse.json({ error: 'Failed to fetch notifications', details: fetchError });
    }
    
    if (!notifications || notifications.length === 0) {
      return NextResponse.json({ message: 'No pending notifications' });
    }
    
    const emailService = SendGridService.getInstance();
    const results = [];
    
    for (const notification of notifications) {
      try {
        // Send email using our EmailService (handles both local and production)
        const result = await emailService.sendEmail({
          to: notification.recipient_email,
          subject: notification.subject,
          html: notification.content,
          text: notification.content // Plain text version
        });
        
        if (!result.success) {
          console.error('Failed to send email:', result.error);
          results.push({ id: notification.id, success: false, error: result.error });
          continue;
        }
        
        // Mark notification as sent
        await supabase
          .from('notifications')
          .update({ 
            status: 'sent', 
            sent_at: new Date().toISOString() 
          })
          .eq('id', notification.id);
        
        results.push({ 
          id: notification.id, 
          success: true, 
          email: notification.recipient_email,
          messageId: result.messageId 
        });
        
      } catch (error) {
        console.error('Error processing notification:', error);
        results.push({ id: notification.id, success: false, error: String(error) });
      }
    }
    
    return NextResponse.json({ 
      message: `Processed ${results.length} notifications`,
      results 
    });
    
  } catch (error) {
    return NextResponse.json({ 
      error: 'Failed to process notifications', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}