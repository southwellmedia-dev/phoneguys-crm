import { NextRequest, NextResponse } from 'next/server';
import { sendToInbucket } from '@/lib/services/send-to-inbucket';

export async function POST(request: NextRequest) {
  try {
    const result = await sendToInbucket(
      'test@example.com',
      'Test Email from Phone Guys CRM',
      '<h1>Test Email</h1><p>This is a test email sent directly to Inbucket.</p>',
      'This is a test email sent directly to Inbucket.'
    );
    
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ 
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}