import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { RateLimitedAPI } from '@/lib/utils/api-helpers';
import crypto from 'crypto';

// Verify API key
async function verifyApiKey(apiKey: string, origin: string | null) {
  const supabase = await createClient();
  
  // Hash the provided API key
  const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');
  
  // Check if the API key exists and is active
  const { data: apiKeyData, error } = await supabase
    .from('api_keys')
    .select(`
      *,
      allowed_domains (
        domain,
        is_active
      )
    `)
    .eq('key_hash', keyHash)
    .eq('is_active', true)
    .single();

  if (error || !apiKeyData) {
    return { valid: false, error: 'Invalid API key' };
  }

  // Check if the key has expired
  if (apiKeyData.expires_at && new Date(apiKeyData.expires_at) < new Date()) {
    return { valid: false, error: 'API key has expired' };
  }

  // Check domain whitelist if domains are configured
  if (apiKeyData.allowed_domains && apiKeyData.allowed_domains.length > 0) {
    if (!origin) {
      return { valid: false, error: 'Origin header required' };
    }

    // Extract domain from origin
    const originDomain = new URL(origin).hostname;
    
    const isAllowed = apiKeyData.allowed_domains.some((d: any) => 
      d.is_active && (
        d.domain === originDomain || 
        d.domain === '*' ||
        originDomain.endsWith(`.${d.domain}`)
      )
    );

    if (!isAllowed) {
      return { valid: false, error: 'Domain not whitelisted' };
    }
  }

  // Update last used timestamp
  await supabase
    .from('api_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', apiKeyData.id);

  return { valid: true, apiKeyData };
}

// Log API request
async function logApiRequest(
  apiKeyId: string | null,
  endpoint: string,
  method: string,
  origin: string | null,
  ip: string | null,
  userAgent: string | null,
  requestBody: any,
  responseStatus: number,
  responseBody: any,
  errorMessage: string | null
) {
  const supabase = await createClient();
  
  await supabase.from('api_request_logs').insert({
    api_key_id: apiKeyId,
    endpoint,
    method,
    origin,
    ip_address: ip,
    user_agent: userAgent,
    request_body: requestBody,
    response_status: responseStatus,
    response_body: responseBody,
    error_message: errorMessage
  });
}

// CORS headers
function getCorsHeaders(origin: string | null) {
  return {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
    'Access-Control-Max-Age': '86400',
  };
}

// Handle OPTIONS request for CORS preflight
export const OPTIONS = RateLimitedAPI.public(async (request: NextRequest) => {
  const origin = request.headers.get('origin');
  return new NextResponse(null, {
    status: 200,
    headers: getCorsHeaders(origin)
  });
});

// Handle POST request for form submission
export const POST = RateLimitedAPI.public(async (request: NextRequest) => {
  const origin = request.headers.get('origin');
  const apiKey = request.headers.get('x-api-key');
  const userAgent = request.headers.get('user-agent');
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip');
  
  let requestBody = {};
  let apiKeyId: string | null = null;

  try {
    requestBody = await request.json();

    // Verify API key if provided (or required)
    if (apiKey) {
      const { valid, error, apiKeyData } = await verifyApiKey(apiKey, origin);
      
      if (!valid) {
        const errorResponse = { error };
        await logApiRequest(
          null,
          '/api/public/appointment',
          'POST',
          origin,
          ip,
          userAgent,
          requestBody,
          401,
          errorResponse,
          error
        );

        return NextResponse.json(errorResponse, {
          status: 401,
          headers: getCorsHeaders(origin)
        });
      }

      apiKeyId = apiKeyData.id;
    } else {
      // Check if API key is required (you can make this configurable)
      const supabase = await createClient();
      const { data: settings } = await supabase
        .from('store_settings')
        .select('require_api_key')
        .single();

      if (settings?.require_api_key) {
        const errorResponse = { error: 'API key required' };
        await logApiRequest(
          null,
          '/api/public/appointment',
          'POST',
          origin,
          ip,
          userAgent,
          requestBody,
          401,
          errorResponse,
          'API key required'
        );

        return NextResponse.json(errorResponse, {
          status: 401,
          headers: getCorsHeaders(origin)
        });
      }
    }

    // Validate required fields
    const { 
      customerName, 
      customerEmail, 
      customerPhone, 
      deviceId,
      deviceName,
      deviceColor,
      services,
      preferredDate,
      preferredTime,
      description 
    } = requestBody as any;

    if (!customerName || !customerEmail || !customerPhone) {
      const errorResponse = { error: 'Missing required customer information' };
      await logApiRequest(
        apiKeyId,
        '/api/public/appointment',
        'POST',
        origin,
        ip,
        userAgent,
        requestBody,
        400,
        errorResponse,
        'Missing required fields'
      );

      return NextResponse.json(errorResponse, {
        status: 400,
        headers: getCorsHeaders(origin)
      });
    }

    // Create form submission record
    const supabase = await createClient();
    
    const { data: submission, error: submissionError } = await supabase
      .from('form_submissions')
      .insert({
        form_type: 'appointment',
        submission_data: requestBody,
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone,
        device_info: {
          id: deviceId,
          name: deviceName,
          color: deviceColor
        },
        issues: services || [],
        preferred_date: preferredDate,
        preferred_time: preferredTime,
        status: 'pending',
        source_url: origin,
        ip_address: ip,
        user_agent: userAgent
      })
      .select()
      .single();

    if (submissionError) {
      const errorResponse = { error: 'Failed to submit form' };
      await logApiRequest(
        apiKeyId,
        '/api/public/appointment',
        'POST',
        origin,
        ip,
        userAgent,
        requestBody,
        500,
        errorResponse,
        submissionError.message
      );

      return NextResponse.json(errorResponse, {
        status: 500,
        headers: getCorsHeaders(origin)
      });
    }

    // Check if auto-create appointment is enabled
    const { data: settings } = await supabase
      .from('store_settings')
      .select('auto_create_appointments')
      .single();

    let appointmentNumber = null;
    
    if (settings?.auto_create_appointments) {
      // Check if customer exists
      let customerId = null;
      const { data: existingCustomer } = await supabase
        .from('customers')
        .select('id')
        .eq('email', customerEmail)
        .single();

      if (!existingCustomer) {
        // Create new customer
        const { data: newCustomer } = await supabase
          .from('customers')
          .insert({
            name: customerName,
            email: customerEmail,
            phone: customerPhone
          })
          .select('id')
          .single();
        
        customerId = newCustomer?.id;
      } else {
        customerId = existingCustomer.id;
      }

      // Generate appointment number
      const appointmentDate = new Date();
      const dateStr = appointmentDate.toISOString().split('T')[0].replace(/-/g, '');
      const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      appointmentNumber = `APT-${dateStr}-${randomNum}`;

      // Create appointment
      if (customerId) {
        const { data: appointment } = await supabase
          .from('appointments')
          .insert({
            appointment_number: appointmentNumber,
            customer_id: customerId,
            device_id: deviceId || null,
            scheduled_date: preferredDate,
            scheduled_time: preferredTime,
            issues: services || [],
            description: description || null,
            source: 'website',
            status: 'scheduled'
          })
          .select('id')
          .single();

        // Update form submission with appointment ID
        if (appointment) {
          await supabase
            .from('form_submissions')
            .update({ 
              appointment_id: appointment.id,
              status: 'processed',
              processed_at: new Date().toISOString()
            })
            .eq('id', submission.id);

          // Log activity for new appointment request
          // Use admin user UUID for system-generated activities
          const SYSTEM_USER_ID = '11111111-1111-1111-1111-111111111111';
          
          await supabase
            .from('user_activity_logs')
            .insert({
              user_id: SYSTEM_USER_ID, // System-generated activity
              activity_type: 'appointment_created',
              entity_type: 'appointment',
              entity_id: appointment.id,
              details: {
                appointment_number: appointmentNumber,
                customer_name: customerName,
                appointment_date: `${preferredDate} ${preferredTime}`,
                status: 'scheduled',
                source: 'website',
                services: services || []
              }
            });
        }
      }
    }

    // Success response
    const successResponse = {
      success: true,
      message: 'Your appointment request has been submitted successfully!',
      submissionId: submission.id,
      appointmentNumber,
      estimatedResponse: '24 hours'
    };

    await logApiRequest(
      apiKeyId,
      '/api/public/appointment',
      'POST',
      origin,
      ip,
      userAgent,
      requestBody,
      200,
      successResponse,
      null
    );

    return NextResponse.json(successResponse, {
      status: 200,
      headers: getCorsHeaders(origin)
    });

  } catch (error) {
    console.error('Error in public appointment API:', error);
    
    const errorResponse = { error: 'Internal server error' };
    await logApiRequest(
      apiKeyId,
      '/api/public/appointment',
      'POST',
      origin,
      ip,
      userAgent,
      requestBody,
      500,
      errorResponse,
      error instanceof Error ? error.message : 'Unknown error'
    );

    return NextResponse.json(errorResponse, {
      status: 500,
      headers: getCorsHeaders(origin)
    });
  }
});