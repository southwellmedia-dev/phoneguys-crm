import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { appointmentConfirmationTemplate } from '@/lib/email-templates/appointment-confirmation';

export async function GET(request: NextRequest) {
  try {
    // Get the latest pending notification or appointment
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    // First try to get the latest appointment for a better preview
    const { data: appointment } = await supabase
      .from('appointments')
      .select(`
        *,
        customers!inner(name, email, phone),
        devices!inner(brand, model)
      `)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    let htmlContent = '';
    let emailSubject = '';
    let recipientEmail = '';
    
    if (appointment) {
      // Generate the beautiful HTML template
      const template = appointmentConfirmationTemplate({
        customerName: appointment.customers.name,
        appointmentNumber: appointment.appointment_number,
        appointmentDate: new Date(appointment.scheduled_date + 'T00:00:00').toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        appointmentTime: (() => {
          const [hours, minutes] = appointment.scheduled_time.split(':');
          const hour = parseInt(hours);
          const ampm = hour >= 12 ? 'PM' : 'AM';
          const displayHour = hour % 12 || 12;
          return `${displayHour}:${minutes} ${ampm}`;
        })(),
        deviceBrand: appointment.devices.brand,
        deviceModel: appointment.devices.model,
        issues: appointment.issues || ['General Diagnosis'],
        estimatedCost: appointment.estimated_cost ? parseFloat(appointment.estimated_cost) : undefined,
        notes: appointment.notes,
        confirmationUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/appointments/${appointment.appointment_number}`
      });
      
      htmlContent = template.html;
      emailSubject = template.subject;
      recipientEmail = appointment.customers.email;
    } else {
      // Fallback to notification content
      const { data: notification } = await supabase
        .from('notifications')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (notification) {
        htmlContent = notification.content;
        emailSubject = notification.subject;
        recipientEmail = notification.recipient_email;
      } else {
        return NextResponse.json({ message: 'No appointments or notifications found' });
      }
    }
    
    // Return the email preview with both the metadata and the actual HTML
    return new NextResponse(
      `<!DOCTYPE html>
      <html>
      <head>
        <title>Email Preview</title>
        <style>
          body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
          .container { max-width: 1200px; margin: 0 auto; }
          .meta { background: white; padding: 20px; margin-bottom: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .meta h2 { margin-top: 0; color: #333; }
          .meta p { margin: 8px 0; color: #666; }
          .meta strong { color: #333; }
          .preview-label { background: #0094CA; color: white; padding: 10px 20px; border-radius: 8px 8px 0 0; margin: 0; }
          .email-container { background: white; border-radius: 0 0 8px 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
          .email-frame { width: 100%; height: 800px; border: none; }
          .warning { margin-top: 20px; padding: 15px; background: #fff3cd; border-left: 4px solid #ffc107; border-radius: 4px; }
          .warning strong { color: #856404; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="meta">
            <h2>📧 Email Preview</h2>
            <p><strong>To:</strong> ${recipientEmail}</p>
            <p><strong>Subject:</strong> ${emailSubject}</p>
            <p><strong>From:</strong> ${process.env.EMAIL_FROM_NAME} &lt;${process.env.EMAIL_FROM}&gt;</p>
            <p><strong>Reply-To:</strong> ${process.env.EMAIL_REPLY_TO}</p>
          </div>
          
          <h3 class="preview-label">Email Preview (as customer will see it):</h3>
          <div class="email-container">
            <iframe class="email-frame" srcdoc="${htmlContent.replace(/"/g, '&quot;')}" />
          </div>
        <div style="margin-top: 20px; padding: 15px; background: #fff3cd; border-radius: 5px;">
          <strong>⚠️ Note:</strong> This email is not being sent because SendGrid requires a verified sender domain.
          To send emails, you need to:
          <ol>
            <li>Log into SendGrid</li>
            <li>Go to Settings → Sender Authentication</li>
            <li>Verify a domain or single sender</li>
            <li>Update EMAIL_FROM in .env to use the verified address</li>
          </ol>
        </div>
      </body>
      </html>`,
      {
        headers: { 'Content-Type': 'text/html' }
      }
    );
    
  } catch (error) {
    return NextResponse.json({ 
      error: 'Failed to preview email', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}