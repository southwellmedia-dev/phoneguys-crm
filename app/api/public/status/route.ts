import { NextRequest, NextResponse } from 'next/server';
import { StatusLookupService } from '@/lib/services/status-lookup.service';

// CORS headers for public API
function getCorsHeaders(origin: string | null) {
  return {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };
}

// Handle OPTIONS request for CORS preflight
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  return new NextResponse(null, {
    status: 200,
    headers: getCorsHeaders(origin)
  });
}

// Handle POST request for status lookup
export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');
  const userAgent = request.headers.get('user-agent') || undefined;
  const ip = request.headers.get('x-forwarded-for') || 
             request.headers.get('x-real-ip') || 
             request.ip || 
             undefined;

  try {
    // Parse request body
    const body = await request.json();
    const { type, identifier, email } = body;

    // Basic validation
    if (!type || !identifier || !email) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields. Please provide type, identifier, and email.' 
        },
        { 
          status: 400,
          headers: getCorsHeaders(origin)
        }
      );
    }

    // Create service instance
    const service = new StatusLookupService();

    // Perform lookup
    const result = await service.lookupStatus({
      type,
      identifier: identifier.trim().toUpperCase(), // Normalize identifier
      email: email.trim().toLowerCase(), // Normalize email
      ipAddress: ip,
      userAgent
    });

    // Handle rate limiting
    if (result.rateLimitExceeded) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          rateLimitExceeded: true,
          attemptsRemaining: result.attemptsRemaining
        },
        { 
          status: 429, // Too Many Requests
          headers: getCorsHeaders(origin)
        }
      );
    }

    // Handle failed lookup
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Unable to find the requested information'
        },
        { 
          status: 404,
          headers: getCorsHeaders(origin)
        }
      );
    }

    // Success response
    return NextResponse.json(
      {
        success: true,
        type: result.type,
        data: result.data,
        timeline: result.timeline
      },
      { 
        status: 200,
        headers: getCorsHeaders(origin)
      }
    );

  } catch (error) {
    console.error('Error in public status API:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'An error occurred while processing your request. Please try again later.' 
      },
      { 
        status: 500,
        headers: getCorsHeaders(origin)
      }
    );
  }
}