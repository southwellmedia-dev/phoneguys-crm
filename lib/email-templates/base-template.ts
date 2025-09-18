export interface EmailTemplateData {
  title: string;
  preheader?: string;
  content: string;
  ctaButton?: {
    text: string;
    url: string;
  };
  footer?: string;
  unsubscribeUrl?: string;
}

export function baseEmailTemplate(data: EmailTemplateData): string {
  const {
    title,
    preheader = '',
    content,
    ctaButton,
    footer,
    unsubscribeUrl
  } = data;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    /* Reset styles */
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    
    /* Remove default styling */
    body { margin: 0 !important; padding: 0 !important; width: 100% !important; min-width: 100% !important; }
    
    /* Mobile styles */
    @media screen and (max-width: 600px) {
      .mobile-padding { padding: 20px !important; }
      .mobile-center { text-align: center !important; }
      .container { width: 100% !important; max-width: 100% !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  
  <!-- Preheader Text -->
  <div style="display: none; font-size: 1px; color: #fefefe; line-height: 1px; font-family: Arial, sans-serif; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">
    ${preheader}
  </div>
  
  <!-- Email Container -->
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f4f4f4;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        
        <!-- Email Content -->
        <table class="container" border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #0094CA 0%, #00B4D8 100%); border-radius: 8px 8px 0 0; padding: 30px; text-align: center;">
              <img src="https://egotypldqzdzjclikmeg.supabase.co/storage/v1/object/public/device-images/phoneguys-logo.png" 
                   alt="The Phone Guys" 
                   style="max-width: 200px; height: auto; margin-bottom: 10px;" />
              <p style="margin: 5px 0 0 0; color: #ffffff; font-size: 14px; opacity: 0.9;">
                Professional Mobile Device Repair
              </p>
            </td>
          </tr>
          
          <!-- Main Content -->
          <tr>
            <td class="mobile-padding" style="padding: 40px 30px;">
              ${content}
              
              ${ctaButton ? `
                <!-- CTA Button -->
                <table border="0" cellspacing="0" cellpadding="0" style="margin: 30px auto;">
                  <tr>
                    <td align="center" style="border-radius: 4px; background-color: #0094CA;">
                      <a href="${ctaButton.url}" target="_blank" style="display: inline-block; padding: 14px 30px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 16px; color: #ffffff; text-decoration: none; border-radius: 4px;">
                        ${ctaButton.text}
                      </a>
                    </td>
                  </tr>
                </table>
              ` : ''}
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; border-radius: 0 0 8px 8px; padding: 30px; text-align: center;">
              ${footer ? `
                <p style="margin: 0 0 15px 0; color: #666666; font-size: 14px; line-height: 21px;">
                  ${footer}
                </p>
              ` : ''}
              
              <p style="margin: 0 0 10px 0; color: #999999; font-size: 12px;">
                The Phone Guys<br>
                123 Main Street, Your City, State 12345<br>
                Phone: (555) 123-4567 | Email: support@phoneguys.com
              </p>
              
              <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
                <p style="margin: 0; color: #999999; font-size: 11px;">
                  This email was sent to you because you have an account or inquiry with The Phone Guys.
                  ${unsubscribeUrl ? `
                    <br>
                    <a href="${unsubscribeUrl}" style="color: #0094CA; text-decoration: none;">Unsubscribe</a> from these emails.
                  ` : ''}
                </p>
              </div>
            </td>
          </tr>
          
        </table>
        
      </td>
    </tr>
  </table>
  
</body>
</html>
  `.trim();
}

/**
 * Generate plain text version from HTML content
 */
export function htmlToPlainText(html: string): string {
  return html
    .replace(/<style[^>]*>.*?<\/style>/gi, '')
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}