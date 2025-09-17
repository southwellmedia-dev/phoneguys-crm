import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { RateLimitedAPI } from '@/lib/utils/api-helpers';

export const POST = RateLimitedAPI.auth(async (request: NextRequest) => {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    
    // For local development, we'll use a special redirect URL
    const redirectUrl = `${request.nextUrl.origin}/auth/update-password`;
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Password reset email sent to ${email}. Check your inbox!`,
      note: 'For local development, check the terminal/console for the reset link'
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to send reset email' },
      { status: 500 }
    );
  }
});