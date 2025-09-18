import { NextRequest, NextResponse } from 'next/server';
import { TwilioService } from '@/lib/services/sms/twilio.service';

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber } = await request.json();
    
    if (!phoneNumber) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }

    // Get SMS service instance (server-side only)
    const smsService = TwilioService.getInstance();
    
    if (!smsService.isInitialized()) {
      return NextResponse.json({
        success: false,
        error: 'SMS service is not configured. Please check your Twilio credentials.'
      }, { status: 503 });
    }
    
    // Test SMS
    const result = await smsService.sendSMS({
      to: phoneNumber,
      body: 'Test message from The Phone Guys CRM - SMS integration is working!'
    });
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error testing SMS:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to test SMS' 
      },
      { status: 500 }
    );
  }
}