import { NextRequest, NextResponse } from 'next/server';
import { SendGridService } from '@/lib/services/email/sendgrid.service';
import { TwilioService } from '@/lib/services/sms/twilio.service';
import { appointmentConfirmationTemplate } from '@/lib/email-templates/appointment-confirmation';
import { repairStatusUpdateTemplate } from '@/lib/email-templates/repair-status-update';
import { SMS_TEMPLATES, processSMSTemplate } from '@/lib/templates/sms-templates';
import { RateLimitedAPI } from '@/lib/utils/api-helpers';

/**
 * GET /api/test/email
 * Test email sending functionality
 */
export const GET = RateLimitedAPI.test(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const to = searchParams.get('to');
    const type = searchParams.get('type') || 'test'; // test, appointment, status

    if (!to) {
      return NextResponse.json(
        { error: 'Missing "to" parameter. Use ?to=email@example.com' },
        { status: 400 }
      );
    }

    const emailService = SendGridService.getInstance();
    let result;

    switch (type) {
      case 'appointment': {
        // Send appointment confirmation template
        const template = appointmentConfirmationTemplate({
          customerName: 'Test Customer',
          appointmentNumber: 'APT-2025-0001',
          appointmentDate: 'Friday, January 10, 2025',
          appointmentTime: '2:00 PM',
          deviceBrand: 'Apple',
          deviceModel: 'iPhone 15 Pro',
          issues: ['Screen Replacement', 'Battery Replacement'],
          estimatedCost: 299.99,
          notes: 'Customer mentioned device was dropped in water',
          confirmationUrl: 'http://localhost:3000/appointments/APT-2025-0001'
        });

        result = await emailService.sendEmail({
          to,
          subject: template.subject,
          html: template.html,
          text: template.text
        });
        break;
      }

      case 'status': {
        // Send repair status update template
        const template = repairStatusUpdateTemplate({
          customerName: 'Test Customer',
          ticketNumber: 'TKT-2025-0001',
          deviceBrand: 'Samsung',
          deviceModel: 'Galaxy S24',
          previousStatus: 'new',
          newStatus: 'in_progress',
          statusMessage: 'Our expert technician has begun working on your device.',
          technician: 'John Smith',
          estimatedCompletion: 'January 12, 2025',
          notes: 'Screen replacement in progress. Device in good condition otherwise.',
          trackingUrl: 'http://localhost:3000/track/TKT-2025-0001'
        });

        result = await emailService.sendEmail({
          to,
          subject: template.subject,
          html: template.html,
          text: template.text
        });
        break;
      }

      case 'completed': {
        // Send repair completed template
        const template = repairStatusUpdateTemplate({
          customerName: 'Test Customer',
          ticketNumber: 'TKT-2025-0002',
          deviceBrand: 'Apple',
          deviceModel: 'MacBook Pro',
          previousStatus: 'in_progress',
          newStatus: 'completed',
          actualCost: 449.99,
          notes: 'All repairs completed successfully. Device has been tested and is working perfectly.',
          trackingUrl: 'http://localhost:3000/track/TKT-2025-0002'
        });

        result = await emailService.sendEmail({
          to,
          subject: template.subject,
          html: template.html,
          text: template.text
        });
        break;
      }

      default: {
        // Send simple test email
        result = await emailService.testEmailConfiguration(to);
        break;
      }
    }

    if (result.success) {
      const isLocal = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('127.0.0.1');
      
      return NextResponse.json({
        success: true,
        message: `Test email sent successfully to ${to}`,
        messageId: result.messageId,
        type,
        inbucketUrl: isLocal ? 'http://127.0.0.1:54324' : null,
        note: isLocal 
          ? 'Email captured by Inbucket. Open the URL above to view it.' 
          : 'Email sent via SendGrid'
      });
    } else {
      return NextResponse.json(
        { 
          success: false,
          error: result.error || 'Failed to send email'
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error in test email endpoint:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
});

/**
 * POST /api/test/email
 * Test email or SMS with custom content
 */
export const POST = RateLimitedAPI.test(async (request: NextRequest) => {
  try {
    const body = await request.json();
    const { type, to, subject, html, text, message, templateType } = body;

    // Handle SMS testing
    if (type === 'sms') {
      if (!to) {
        return NextResponse.json(
          { error: 'Missing required field: to (phone number)' },
          { status: 400 }
        );
      }

      const smsService = TwilioService.getInstance();
      
      // Check if SMS is configured
      if (!smsService.isInitialized()) {
        return NextResponse.json({
          success: false,
          error: 'SMS service not configured',
          details: 'Twilio credentials are missing. Please set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER in your environment variables.'
        }, { status: 500 });
      }

      let smsMessage = message;

      // Use template if specified
      if (templateType && SMS_TEMPLATES[templateType as keyof typeof SMS_TEMPLATES]) {
        const processed = processSMSTemplate(templateType as keyof typeof SMS_TEMPLATES, {
          customerName: 'Test Customer',
          ticketNumber: 'TK-TEST-001',
          appointmentNumber: 'APT-TEST-001',
          appointmentDate: 'Jan 15',
          appointmentTime: '2:00 PM',
          deviceBrand: 'iPhone',
          deviceModel: '15 Pro',
          status: 'completed',
          businessName: 'Phone Guys',
          businessPhone: process.env.BUSINESS_PHONE || '(844) 511-0454',
          estimatedDate: 'tomorrow',
          totalCost: '149.99',
          holdReason: 'waiting for parts'
        });
        smsMessage = processed.message;
      } else if (!smsMessage) {
        smsMessage = 'Test SMS from Phone Guys CRM - SMS service is working correctly!';
      }

      const result = await smsService.sendSMS({
        to,
        body: smsMessage
      });

      if (result.success) {
        return NextResponse.json({
          success: true,
          message: `SMS sent successfully to ${result.to}`,
          messageId: result.messageId,
          characterCount: smsMessage.length,
          messageContent: smsMessage
        });
      } else {
        return NextResponse.json(
          { 
            success: false,
            error: result.error || 'Failed to send SMS',
            to: result.to
          },
          { status: 500 }
        );
      }
    }

    // Handle email testing (existing code)
    if (!to || !subject || (!html && !text)) {
      return NextResponse.json(
        { error: 'Missing required fields: to, subject, and either html or text' },
        { status: 400 }
      );
    }

    const emailService = SendGridService.getInstance();
    const result = await emailService.sendEmail({
      to,
      subject,
      html,
      text
    });

    if (result.success) {
      const isLocal = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('127.0.0.1');
      
      return NextResponse.json({
        success: true,
        message: `Email sent successfully to ${to}`,
        messageId: result.messageId,
        inbucketUrl: isLocal ? 'http://127.0.0.1:54324' : null,
        note: isLocal 
          ? 'Email captured by Inbucket. Open the URL above to view it.' 
          : 'Email sent via SendGrid'
      });
    } else {
      return NextResponse.json(
        { 
          success: false,
          error: result.error || 'Failed to send email'
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error in test notification endpoint:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
});