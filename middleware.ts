import { updateSession } from "@/lib/supabase/middleware";
import { type NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  // Handle CORS for embed and public API routes
  if (request.nextUrl.pathname.startsWith('/embed/') || 
      request.nextUrl.pathname.startsWith('/api/public/')) {
    
    // For OPTIONS requests, return early with CORS headers
    if (request.method === 'OPTIONS') {
      return new Response(null, { 
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, x-api-key, X-Requested-With',
          'Access-Control-Allow-Credentials': 'true',
          'Access-Control-Max-Age': '86400'
        }
      });
    }
    
    // For other requests, continue with session update but add CORS headers
    const response = await updateSession(request);
    
    // Add CORS headers
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, x-api-key, X-Requested-With');
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    
    // Allow embedding in iframes for embed routes
    if (request.nextUrl.pathname.startsWith('/embed/')) {
      response.headers.set('X-Frame-Options', 'ALLOWALL');
      response.headers.set('Content-Security-Policy', 'frame-ancestors *;');
    }
    
    return response;
  }
  
  // For all other routes, just update session normally
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images - .svg, .png, .jpg, .jpeg, .gif, .webp
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
