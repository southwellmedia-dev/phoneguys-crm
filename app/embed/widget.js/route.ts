import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// CORS headers for widget embedding
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Allow any origin to embed the widget
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
  'Content-Type': 'application/javascript',
};

/**
 * GET /embed/widget.js
 * Serve the widget JavaScript file with proper CORS headers
 */
export async function GET(request: NextRequest) {
  try {
    // Read the widget.js file from public directory
    const widgetPath = path.join(process.cwd(), 'public', 'embed', 'widget.js');
    const widgetContent = fs.readFileSync(widgetPath, 'utf-8');
    
    // Get the base URL from environment or request
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                    `${request.nextUrl.protocol}//${request.nextUrl.host}`;
    
    // Replace the baseUrl placeholder in the widget code
    const updatedContent = widgetContent.replace(
      "baseUrl: 'https://crm.phoneguys.com'",
      `baseUrl: '${baseUrl}'`
    );
    
    return new NextResponse(updatedContent, {
      status: 200,
      headers: corsHeaders
    });
  } catch (error) {
    console.error('Error serving widget.js:', error);
    
    // Return a minimal error widget
    const errorWidget = `
      console.error('PhoneGuys Widget: Failed to load widget');
      window.PhoneGuysWidget = function() {
        console.error('PhoneGuys Widget: Not available');
      };
    `;
    
    return new NextResponse(errorWidget, {
      status: 500,
      headers: corsHeaders
    });
  }
}

/**
 * OPTIONS /embed/widget.js
 * Handle CORS preflight requests
 */
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders
  });
}