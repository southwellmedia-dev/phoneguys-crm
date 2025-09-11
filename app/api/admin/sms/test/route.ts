import { NextRequest, NextResponse } from 'next/server';
import { requirePermission, handleApiError, successResponse } from '@/lib/auth/helpers';
import { Permission } from '@/lib/services/authorization.service';
import { getSMSService } from '@/lib/services/sms.service';
import { z } from 'zod';

const testSMSSchema = z.object({
  phoneNumber: z.string().min(10, 'Valid phone number required')
});

export async function POST(request: NextRequest) {
  try {
    // Require admin permission
    const authResult = await requirePermission(request, Permission.ADMIN_ACCESS);
    if (authResult instanceof NextResponse) return authResult;

    const body = await request.json();
    
    // Validate input
    const validation = testSMSSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { phoneNumber } = validation.data;
    
    // Get SMS service
    const smsService = getSMSService();
    
    if (!smsService.isReady()) {
      return NextResponse.json(
        { error: 'SMS service is not configured. Please check your Twilio credentials.' },
        { status: 503 }
      );
    }

    // Test SMS configuration
    const result = await smsService.testConfiguration(phoneNumber);
    
    if (result.success) {
      return successResponse(
        { 
          success: true, 
          message: 'Test SMS sent successfully',
          phoneNumber 
        },
        'Test SMS sent successfully'
      );
    } else {
      return NextResponse.json(
        { 
          error: 'Failed to send test SMS', 
          details: result.error,
          phoneNumber 
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('SMS test error:', error);
    return handleApiError(error);
  }
}

export async function GET() {
  try {
    // Get SMS service status
    const smsService = getSMSService();
    const isReady = smsService.isReady();
    
    let accountInfo = {};
    if (isReady) {
      try {
        const balance = await smsService.getAccountBalance();
        const usage = await smsService.getSMSUsage();
        accountInfo = { balance, usage };
      } catch (error) {
        console.warn('Failed to get account info:', error);
      }
    }
    
    return successResponse({
      configured: isReady,
      status: isReady ? 'ready' : 'not_configured',
      ...accountInfo
    });
  } catch (error) {
    return handleApiError(error);
  }
}