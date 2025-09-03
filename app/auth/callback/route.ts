import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const type = requestUrl.searchParams.get('type');
  const next = requestUrl.searchParams.get('next') ?? '/';
  
  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      // Check if this is a recovery flow by examining the session
      const { data: { session } } = await supabase.auth.getSession();
      
      // If we have a session and it's from a recovery flow
      if (session?.user?.recovery_sent_at || type === 'recovery') {
        return NextResponse.redirect(new URL('/auth/update-password', requestUrl.origin));
      }
      
      // Otherwise redirect to the intended page
      return NextResponse.redirect(new URL(next, requestUrl.origin));
    }
  }

  // Handle password recovery flow from email link
  if (type === 'recovery') {
    return NextResponse.redirect(new URL('/auth/update-password', requestUrl.origin));
  }

  // Default redirect
  return NextResponse.redirect(new URL('/', requestUrl.origin));
}