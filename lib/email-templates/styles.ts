/**
 * Shared email template styles for The Phone Guys
 */

export const emailStyles = {
  // Colors based on brand
  colors: {
    primary: '#0094CA',      // Cyan
    secondary: '#fb2c36',    // Red
    dark: '#1a1a1a',
    text: '#333333',
    textLight: '#666666',
    background: '#f8f9fa',
    white: '#ffffff',
    success: '#28a745',
    warning: '#ffc107',
    danger: '#dc3545',
    info: '#17a2b8',
  },

  // Typography
  fonts: {
    primary: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },

  // Common styles
  container: `
    width: 100%;
    margin: 0 auto;
    padding: 0;
    background-color: #f8f9fa;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  `,

  wrapper: `
    max-width: 600px;
    margin: 0 auto;
    padding: 40px 20px;
  `,

  card: `
    background-color: #ffffff;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    overflow: hidden;
  `,

  header: `
    background: linear-gradient(135deg, #0094CA 0%, #0077a3 100%);
    color: #ffffff;
    padding: 40px 30px;
    text-align: center;
  `,

  logo: `
    width: 180px;
    height: auto;
    margin-bottom: 20px;
  `,

  content: `
    padding: 40px 30px;
    color: #333333;
    line-height: 1.6;
  `,

  footer: `
    background-color: #f8f9fa;
    padding: 30px;
    text-align: center;
    color: #666666;
    font-size: 14px;
    line-height: 1.6;
  `,

  button: {
    primary: `
      display: inline-block;
      padding: 14px 30px;
      background: linear-gradient(135deg, #0094CA 0%, #0077a3 100%);
      color: #ffffff;
      text-decoration: none;
      border-radius: 6px;
      font-size: 16px;
      font-weight: 600;
      text-align: center;
      transition: all 0.3s ease;
    `,
    secondary: `
      display: inline-block;
      padding: 14px 30px;
      background: #ffffff;
      color: #0094CA;
      text-decoration: none;
      border: 2px solid #0094CA;
      border-radius: 6px;
      font-size: 16px;
      font-weight: 600;
      text-align: center;
    `,
    danger: `
      display: inline-block;
      padding: 14px 30px;
      background: linear-gradient(135deg, #fb2c36 0%, #dc2430 100%);
      color: #ffffff;
      text-decoration: none;
      border-radius: 6px;
      font-size: 16px;
      font-weight: 600;
      text-align: center;
    `,
  },

  alert: {
    info: `
      background-color: #d1ecf1;
      border-left: 4px solid #17a2b8;
      padding: 20px;
      margin: 20px 0;
      border-radius: 4px;
      color: #0c5460;
    `,
    success: `
      background-color: #d4edda;
      border-left: 4px solid #28a745;
      padding: 20px;
      margin: 20px 0;
      border-radius: 4px;
      color: #155724;
    `,
    warning: `
      background-color: #fff3cd;
      border-left: 4px solid #ffc107;
      padding: 20px;
      margin: 20px 0;
      border-radius: 4px;
      color: #856404;
    `,
    danger: `
      background-color: #f8d7da;
      border-left: 4px solid #dc3545;
      padding: 20px;
      margin: 20px 0;
      border-radius: 4px;
      color: #721c24;
    `,
  },

  heading: {
    h1: `
      margin: 0 0 20px 0;
      font-size: 32px;
      font-weight: 700;
      color: #ffffff;
    `,
    h2: `
      margin: 0 0 20px 0;
      font-size: 24px;
      font-weight: 600;
      color: #333333;
    `,
    h3: `
      margin: 0 0 15px 0;
      font-size: 18px;
      font-weight: 600;
      color: #333333;
    `,
  },

  text: {
    paragraph: `
      margin: 0 0 20px 0;
      font-size: 16px;
      line-height: 1.6;
      color: #333333;
    `,
    muted: `
      color: #666666;
      font-size: 14px;
    `,
    small: `
      font-size: 12px;
      color: #999999;
    `,
  },

  table: {
    container: `
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    `,
    header: `
      background-color: #f8f9fa;
      border-bottom: 2px solid #dee2e6;
    `,
    cell: `
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #dee2e6;
      font-size: 14px;
    `,
  },

  divider: `
    height: 1px;
    background-color: #dee2e6;
    margin: 30px 0;
    border: none;
  `,

  socialIcons: `
    margin: 20px 0;
  `,

  socialIcon: `
    display: inline-block;
    width: 32px;
    height: 32px;
    margin: 0 10px;
  `,
};

export const generateBaseTemplate = (content: {
  preheader?: string;
  headerTitle?: string;
  headerSubtitle?: string;
  body: string;
  ctaButton?: {
    text: string;
    url: string;
    style?: 'primary' | 'secondary' | 'danger';
  };
  footerText?: string;
}) => {
  return `
<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <title>The Phone Guys</title>
  
  <!--[if mso]>
  <style>
    * { font-family: Arial, sans-serif !important; }
  </style>
  <![endif]-->
  
  <style>
    @media only screen and (max-width: 600px) {
      .wrapper { padding: 20px 10px !important; }
      .content { padding: 30px 20px !important; }
      .header { padding: 30px 20px !important; }
      .button { width: 100% !important; text-align: center !important; }
      h1 { font-size: 26px !important; }
      h2 { font-size: 20px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; word-spacing: normal; background-color: #f8f9fa;">
  ${content.preheader ? `
  <div style="display: none; max-height: 0; overflow: hidden; mso-hide: all;">
    ${content.preheader}
    &nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
    &nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
  </div>
  ` : ''}
  
  <div style="${emailStyles.container}">
    <div style="${emailStyles.wrapper}" class="wrapper">
      <div style="${emailStyles.card}">
        <!-- Header -->
        <div style="${emailStyles.header}" class="header">
          <h1 style="${emailStyles.heading.h1}">
            ${content.headerTitle || 'The Phone Guys'}
          </h1>
          ${content.headerSubtitle ? `
          <p style="margin: 0; font-size: 16px; opacity: 0.95;">
            ${content.headerSubtitle}
          </p>
          ` : ''}
        </div>
        
        <!-- Content -->
        <div style="${emailStyles.content}" class="content">
          ${content.body}
          
          ${content.ctaButton ? `
          <div style="text-align: center; margin: 40px 0;">
            <a href="${content.ctaButton.url}" 
               style="${emailStyles.button[content.ctaButton.style || 'primary']}" 
               class="button">
              ${content.ctaButton.text}
            </a>
          </div>
          ` : ''}
        </div>
        
        <!-- Footer -->
        <div style="${emailStyles.footer}">
          ${content.footerText ? `
          <p style="margin: 0 0 15px 0;">
            ${content.footerText}
          </p>
          ` : ''}
          
          <hr style="${emailStyles.divider}" />
          
          <p style="margin: 15px 0 10px 0;">
            <strong>The Phone Guys</strong><br>
            Your Trusted Device Repair Experts
          </p>
          
          <p style="${emailStyles.text.small}">
            123 Main Street, Your City, State 12345<br>
            Phone: (555) 123-4567 | Email: support@phoneguysrepair.com
          </p>
          
          <p style="${emailStyles.text.small}; margin-top: 20px;">
            © ${new Date().getFullYear()} The Phone Guys. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
};