import { NextRequest, NextResponse } from 'next/server';
import { getSMSService } from '@/lib/services/sms.service';

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
    const smsService = getSMSService();
    
    // Test SMS
    const result = await smsService.testSMS(phoneNumber);
    
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