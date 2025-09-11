// Simple function to send email to Inbucket SMTP
export async function sendToInbucket(
  to: string,
  subject: string,
  html: string,
  text?: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    // Use require instead of import for nodemailer
    const nodemailer = require('nodemailer');
    
    const transporter = nodemailer.createTransporter({
      host: '127.0.0.1',
      port: 54325,
      secure: false,
      ignoreTLS: true,
      tls: {
        rejectUnauthorized: false
      }
    });
    
    const info = await transporter.sendMail({
      from: '"The Phone Guys" <noreply@phoneguys.com>',
      to,
      subject,
      text: text || subject,
      html
    });
    
    console.log('✅ Email sent to Inbucket:', info.messageId);
    
    return {
      success: true,
      messageId: info.messageId
    };
  } catch (error) {
    console.error('❌ Failed to send to Inbucket:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}