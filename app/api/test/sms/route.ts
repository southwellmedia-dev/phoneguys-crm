import { NextRequest, NextResponse } from 'next/server';
import { TwilioService } from '@/lib/services/sms/twilio.service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, message } = body;
    
    const twilioService = TwilioService.getInstance();
    
    // Default to Virtual Phone for testing
    const recipient = to || '+18777804236';
    const testMessage = message || `Test SMS from Phone Guys CRM at ${new Date().toLocaleTimeString()}`;
    
    console.log('📱 Direct SMS Test:', {
      to: recipient,
      message: testMessage,
      fromNumber: process.env.TWILIO_PHONE_NUMBER
    });
    
    const result = await twilioService.sendSMS({
      to: recipient,
      body: testMessage,
      from: '+18445110454' // Explicitly set the from number
    });
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `SMS sent successfully`,
        details: {
          to: recipient,
          from: '+18445110454',
          messageId: result.messageId,
          result: result
        }
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error,
        details: result
      }, { status: 500 });
    }
  } catch (error) {
    console.error('SMS test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Test failed'
    }, { status: 500 });
  }
}

export async function GET() {
  // Check SMS configuration
  const config = {
    twilioAccountSid: process.env.TWILIO_ACCOUNT_SID ? 
      process.env.TWILIO_ACCOUNT_SID.substring(0, 10) + '...' : 'NOT SET',
    twilioAuthToken: !!process.env.TWILIO_AUTH_TOKEN ? 'SET' : 'NOT SET',
    twilioPhoneNumber: process.env.TWILIO_PHONE_NUMBER || 'NOT SET',
    virtualPhoneNumber: '+18777804236'
  };
  
  return NextResponse.json({
    success: true,
    config,
    testInstructions: {
      method: 'POST',
      body: {
        to: '+18777804236 (optional, defaults to Virtual Phone)',
        message: 'Your test message (optional)'
      }
    }
  });
}