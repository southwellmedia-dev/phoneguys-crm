import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const nodemailer = await import('nodemailer');
    
    // Create transporter for Inbucket SMTP
    const transporter = nodemailer.createTransporter({
      host: '127.0.0.1',
      port: 54325,
      secure: false,
      tls: {
        rejectUnauthorized: false
      }
    });
    
    // Test the connection
    await transporter.verify();
    console.log('SMTP connection verified');
    
    // Send a test email
    const info = await transporter.sendMail({
      from: '"The Phone Guys" <noreply@phoneguys.com>',
      to: 'test@example.com',
      subject: 'Direct SMTP Test',
      text: 'This is a direct SMTP test to Inbucket',
      html: '<b>This is a direct SMTP test to Inbucket</b>'
    });
    
    console.log('Message sent:', info.messageId);
    
    return NextResponse.json({ 
      success: true,
      messageId: info.messageId,
      accepted: info.accepted,
      response: info.response
    });
    
  } catch (error) {
    console.error('SMTP test failed:', error);
    return NextResponse.json({ 
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}