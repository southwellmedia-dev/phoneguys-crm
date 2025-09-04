import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { hasEnvVars } from "../utils";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  // If the env vars are not set, skip middleware check. You can remove this
  // once you setup the project.
  if (!hasEnvVars) {
    return supabaseResponse;
  }

  // With Fluid compute, don't put this client in a global environment
  // variable. Always create a new one on each request.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Do not run code between createServerClient and
  // supabase.auth.getClaims(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // IMPORTANT: If you remove getClaims() and you use server-side rendering
  // with the Supabase client, your users may be randomly logged out.
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;

  // Check if this is a recovery flow callback
  const code = request.nextUrl.searchParams.get('code');
  if (code && request.nextUrl.pathname === '/') {
    // Redirect to our callback handler
    const callbackUrl = new URL('/auth/callback', request.url);
    callbackUrl.searchParams.set('code', code);
    return NextResponse.redirect(callbackUrl);
  }

  // Check if this is an invite link with fragments (type=invite in hash)
  // For invite links that redirect to root with fragments, redirect to accept-invitation page
  if (request.nextUrl.pathname === '/' || request.nextUrl.pathname === '/auth/login') {
    const referer = request.headers.get('referer');
    // Check if coming from Supabase auth verify endpoint with invite type
    if (referer && referer.includes('supabase.co/auth/v1/verify') && referer.includes('type=invite')) {
      const inviteUrl = new URL('/auth/accept-invitation', request.url);
      // Preserve any query parameters
      request.nextUrl.searchParams.forEach((value, key) => {
        inviteUrl.searchParams.set(key, value);
      });
      return NextResponse.redirect(inviteUrl);
    }
  }

  // Skip authentication for public API endpoints
  const isPublicAPI = request.nextUrl.pathname.startsWith("/api/repairs");
  const isAPIRoute = request.nextUrl.pathname.startsWith("/api/");
  
  // For API routes without auth, return 401 instead of redirecting
  if (isAPIRoute && !user && !isPublicAPI) {
    return new NextResponse(
      JSON.stringify({ error: 'Authentication required' }),
      { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
  
  // Check if user is accessing auth pages while already authenticated
  const isAuthPage = request.nextUrl.pathname.startsWith("/auth");
  
  // Redirect authenticated users from auth pages to dashboard
  // But allow access to callback and accept-invitation pages
  if (user && isAuthPage && 
      request.nextUrl.pathname !== "/auth/callback" && 
      request.nextUrl.pathname !== "/auth/accept-invitation") {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }
  
  // For non-API routes, redirect to login if not authenticated
  // Dashboard routes require authentication
  const isDashboardRoute = request.nextUrl.pathname === "/" || 
                          request.nextUrl.pathname.startsWith("/orders") ||
                          request.nextUrl.pathname.startsWith("/customers") ||
                          request.nextUrl.pathname.startsWith("/reports") ||
                          request.nextUrl.pathname.startsWith("/settings");
                          
  if (
    isDashboardRoute &&
    !user &&
    !request.nextUrl.pathname.startsWith("/auth") &&
    !isAPIRoute
  ) {
    // no user, redirect to login page
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    return NextResponse.redirect(url);
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is.
  // If you're creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse;
}
