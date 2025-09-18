import { NextRequest, NextResponse } from 'next/server';
import { TwilioService } from '@/lib/services/sms/twilio.service';

export async function GET(request: NextRequest) {
  try {
    // Get SMS service instance (server-side only)
    const smsService = TwilioService.getInstance();
    
    // Check if service is configured
    const isConfigured = smsService.isInitialized();
    
    return NextResponse.json({
      isConfigured,
      businessName: 'The Phone Guys',
      hasCredentials: !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER)
    });
  } catch (error) {
    console.error('Error checking SMS status:', error);
    return NextResponse.json(
      { 
        isConfigured: false,
        error: error instanceof Error ? error.message : 'Failed to check SMS status' 
      },
      { status: 500 }
    );
  }
}