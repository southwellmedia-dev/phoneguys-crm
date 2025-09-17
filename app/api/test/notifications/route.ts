import { NextRequest, NextResponse } from 'next/server';
import { sendGridService } from '@/lib/services/email/sendgrid.service';
import { twilioService } from '@/lib/services/sms/twilio.service';
import { emailService } from '@/lib/services/email/email.service';
import { NotificationService } from '@/lib/services/notification.service';
import { createClient } from '@/lib/supabase/server';

// Create notification service instance
const notificationService = new NotificationService();

/**
 * Test SendGrid and Twilio integration
 * POST /api/test/notifications
 * 
 * Body:
 * {
 *   "type": "sendgrid" | "twilio" | "email" | "sms" | "notification" | "all",
 *   "to": "email@example.com" or "+1234567890",
 *   "testData": { ... }
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { type, to, testData } = body;

    const results: any = {};

    // Test SendGrid directly
    if (type === 'sendgrid' || type === 'all') {
      console.log('Testing SendGrid...');
      const sendGridResult = await sendGridService.sendEmail({
        to: to || user.email || 'test@phoneguys.com',
        subject: 'Test Email from SendGrid',
        html: `
          <h2>SendGrid Test Email</h2>
          <p>This is a test email sent directly through SendGrid.</p>
          <p>Timestamp: ${new Date().toISOString()}</p>
          <p>Test Data: ${JSON.stringify(testData || {}, null, 2)}</p>
        `,
        text: 'This is a test email sent directly through SendGrid.',
      });
      results.sendgrid = sendGridResult;
    }

    // Test Twilio directly
    if (type === 'twilio' || type === 'all') {
      console.log('Testing Twilio...');
      const twilioResult = await twilioService.sendSMS({
        to: to || '+15555551234',
        message: `Test SMS from Twilio: ${new Date().toISOString()}`,
      });
      results.twilio = twilioResult;
    }

    // Test email service (queued)
    if (type === 'email' || type === 'all') {
      console.log('Testing email service...');
      const emailResult = await emailService.sendEmail({
        to: to || user.email || 'test@phoneguys.com',
        subject: 'Test Email from Email Service',
        template: 'test',
        data: testData || { timestamp: new Date().toISOString() },
      });
      results.email = emailResult;
    }

    // Test SMS service (queued)
    if (type === 'sms' || type === 'all') {
      console.log('Testing SMS service...');
      const smsResult = await emailService.sendSMS({
        to: to || '+15555551234',
        template: 'test',
        data: testData || { timestamp: new Date().toISOString() },
      });
      results.sms = smsResult;
    }

    // Test notification service
    if (type === 'notification' || type === 'all') {
      console.log('Testing notification service...');
      
      // Get user from database
      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('email', user.email)
        .single();

      if (userData) {
        const notificationResult = await notificationService.sendNotification({
          userId: userData.id,
          type: 'test',
          title: 'Test Notification',
          message: 'This is a test notification',
          data: testData || { timestamp: new Date().toISOString() },
        });
        results.notification = notificationResult;
      }
    }

    return NextResponse.json({
      success: true,
      results,
      message: 'Test notifications sent',
    });

  } catch (error) {
    console.error('Notification test error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to send test notifications'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/test/notifications
 * Check notification service status
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const status = {
      sendgrid: {
        configured: !!process.env.SENDGRID_API_KEY,
        apiKey: process.env.SENDGRID_API_KEY ? '***' + process.env.SENDGRID_API_KEY.slice(-4) : 'Not configured',
        fromEmail: process.env.SENDGRID_FROM_EMAIL || 'Not configured',
      },
      twilio: {
        configured: !!process.env.TWILIO_ACCOUNT_SID && !!process.env.TWILIO_AUTH_TOKEN,
        accountSid: process.env.TWILIO_ACCOUNT_SID ? '***' + process.env.TWILIO_ACCOUNT_SID.slice(-4) : 'Not configured',
        fromNumber: process.env.TWILIO_FROM_NUMBER || 'Not configured',
      },
      database: {
        emailQueueEnabled: true,
        smsQueueEnabled: true,
        notificationsEnabled: true,
      }
    };

    return NextResponse.json({
      success: true,
      status,
      message: 'Notification services status',
    });

  } catch (error) {
    console.error('Status check error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to check status'
      },
      { status: 500 }
    );
  }
}