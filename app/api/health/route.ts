import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';

interface ServiceStatus {
  name: string;
  status: 'operational' | 'degraded' | 'down' | 'unknown';
  message: string;
  responseTime?: number;
  lastChecked: string;
}

export async function GET(request: NextRequest) {
  const services: ServiceStatus[] = [];
  
  try {
    // 1. Check Database (Supabase)
    const dbStart = Date.now();
    let dbStatus: ServiceStatus = {
      name: 'Database',
      status: 'unknown',
      message: 'Checking...',
      lastChecked: new Date().toISOString()
    };
    
    try {
      const serviceClient = createServiceClient();
      // Simple query to check database connectivity
      const { data, error } = await serviceClient
        .from('users')
        .select('count')
        .limit(1)
        .single();
      
      const responseTime = Date.now() - dbStart;
      
      if (error) {
        dbStatus = {
          name: 'Database',
          status: 'down',
          message: `Error: ${error.message}`,
          responseTime,
          lastChecked: new Date().toISOString()
        };
      } else {
        dbStatus = {
          name: 'Database',
          status: responseTime > 2000 ? 'degraded' : 'operational',
          message: responseTime > 2000 ? 'Slow response' : 'Connected',
          responseTime,
          lastChecked: new Date().toISOString()
        };
      }
    } catch (dbError) {
      dbStatus = {
        name: 'Database',
        status: 'down',
        message: 'Connection failed',
        responseTime: Date.now() - dbStart,
        lastChecked: new Date().toISOString()
      };
    }
    services.push(dbStatus);

    // 2. Check API/Hosting (Vercel) - This endpoint itself
    const apiStatus: ServiceStatus = {
      name: 'API',
      status: 'operational', // If we're responding, API is working
      message: 'Operational',
      responseTime: 0,
      lastChecked: new Date().toISOString()
    };
    services.push(apiStatus);

    // 3. Check Email Service (SendGrid)
    const emailStart = Date.now();
    let emailStatus: ServiceStatus = {
      name: 'Email Service',
      status: 'unknown',
      message: 'Checking...',
      lastChecked: new Date().toISOString()
    };
    
    try {
      // Check if SendGrid API key exists
      const sendgridKey = process.env.SENDGRID_API_KEY;
      
      if (!sendgridKey) {
        emailStatus = {
          name: 'Email Service',
          status: 'down',
          message: 'Not configured',
          lastChecked: new Date().toISOString()
        };
      } else {
        // Make a simple API call to SendGrid to check connectivity
        const response = await fetch('https://api.sendgrid.com/v3/scopes', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${sendgridKey}`,
            'Content-Type': 'application/json'
          },
          signal: AbortSignal.timeout(5000) // 5 second timeout
        });
        
        const responseTime = Date.now() - emailStart;
        
        if (response.ok) {
          emailStatus = {
            name: 'Email Service',
            status: responseTime > 3000 ? 'degraded' : 'operational',
            message: responseTime > 3000 ? 'Slow response' : 'Active',
            responseTime,
            lastChecked: new Date().toISOString()
          };
        } else if (response.status === 401) {
          emailStatus = {
            name: 'Email Service',
            status: 'down',
            message: 'Authentication failed',
            responseTime,
            lastChecked: new Date().toISOString()
          };
        } else {
          emailStatus = {
            name: 'Email Service',
            status: 'degraded',
            message: `HTTP ${response.status}`,
            responseTime,
            lastChecked: new Date().toISOString()
          };
        }
      }
    } catch (emailError) {
      emailStatus = {
        name: 'Email Service',
        status: 'down',
        message: 'Connection failed',
        responseTime: Date.now() - emailStart,
        lastChecked: new Date().toISOString()
      };
    }
    services.push(emailStatus);

    // 4. Check SMS Service (Twilio)
    const smsStart = Date.now();
    let smsStatus: ServiceStatus = {
      name: 'SMS Service',
      status: 'unknown',
      message: 'Checking...',
      lastChecked: new Date().toISOString()
    };
    
    try {
      const twilioSid = process.env.TWILIO_ACCOUNT_SID;
      const twilioToken = process.env.TWILIO_AUTH_TOKEN;
      
      if (!twilioSid || !twilioToken) {
        smsStatus = {
          name: 'SMS Service',
          status: 'down',
          message: 'Not configured',
          lastChecked: new Date().toISOString()
        };
      } else {
        // Check Twilio account status
        const auth = Buffer.from(`${twilioSid}:${twilioToken}`).toString('base64');
        const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid}.json`, {
          method: 'GET',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json'
          },
          signal: AbortSignal.timeout(5000) // 5 second timeout
        });
        
        const responseTime = Date.now() - smsStart;
        
        if (response.ok) {
          const data = await response.json();
          
          // Check if account is active and not suspended
          if (data.status === 'active') {
            smsStatus = {
              name: 'SMS Service',
              status: responseTime > 3000 ? 'degraded' : 'operational',
              message: responseTime > 3000 ? 'Slow response' : 'Active',
              responseTime,
              lastChecked: new Date().toISOString()
            };
          } else if (data.status === 'suspended') {
            // This is likely your case - pending verification
            smsStatus = {
              name: 'SMS Service',
              status: 'down',
              message: 'Account suspended - pending verification',
              responseTime,
              lastChecked: new Date().toISOString()
            };
          } else {
            smsStatus = {
              name: 'SMS Service',
              status: 'degraded',
              message: `Account ${data.status}`,
              responseTime,
              lastChecked: new Date().toISOString()
            };
          }
        } else if (response.status === 401) {
          smsStatus = {
            name: 'SMS Service',
            status: 'down',
            message: 'Authentication failed',
            responseTime,
            lastChecked: new Date().toISOString()
          };
        } else {
          smsStatus = {
            name: 'SMS Service',
            status: 'down',
            message: `HTTP ${response.status}`,
            responseTime,
            lastChecked: new Date().toISOString()
          };
        }
      }
    } catch (smsError) {
      smsStatus = {
        name: 'SMS Service',
        status: 'down',
        message: 'Connection failed',
        responseTime: Date.now() - smsStart,
        lastChecked: new Date().toISOString()
      };
    }
    services.push(smsStatus);

    // Calculate overall status
    const hasDown = services.some(s => s.status === 'down');
    const hasDegraded = services.some(s => s.status === 'degraded');
    
    const overallStatus = hasDown ? 'partial_outage' : hasDegraded ? 'degraded' : 'operational';
    
    return NextResponse.json({
      status: overallStatus,
      services,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json(
      {
        status: 'error',
        services: [],
        error: 'Failed to perform health check',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}