import { Resend } from 'resend';

// ============================================
// RFM TradePro - Email Service Configuration
// ============================================

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.EMAIL_FROM || 'RFM TradePro <noreply@rfmtradepro.com>';
const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'RFM TradePro';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// Brand colors
const BRAND_GREEN = '#22c55e';
const BRAND_GREEN_DARK = '#16a34a';
const BRAND_BG_DARK = '#0a0e14';

// ============================================
// Email Templates
// ============================================

interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

/**
 * Base email template with professional RFM TradePro branding
 */
function baseEmailTemplate(content: string, preheader?: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${APP_NAME}</title>
  ${preheader ? `<span style="display:none;font-size:1px;color:#fff;max-height:0;overflow:hidden;mso-hide:all;">${preheader}</span>` : ''}
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
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #1a1a1a;
      margin: 0;
      padding: 0;
      background-color: #f0f2f5;
      width: 100% !important;
      min-width: 100%;
    }
    
    .email-wrapper {
      width: 100%;
      background-color: #f0f2f5;
      padding: 40px 0;
    }
    
    .email-container {
      max-width: 600px;
      margin: 0 auto;
    }
    
    .header {
      background: linear-gradient(135deg, ${BRAND_BG_DARK} 0%, #151c24 100%);
      border-radius: 16px 16px 0 0;
      padding: 40px 40px 30px;
      text-align: center;
    }
    
    .logo-container {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
    }
    
    .logo-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 52px;
      height: 52px;
      background: linear-gradient(135deg, ${BRAND_GREEN} 0%, ${BRAND_GREEN_DARK} 100%);
      border-radius: 14px;
      box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3);
    }
    
    .logo-text {
      font-size: 26px;
      font-weight: 700;
      color: #ffffff;
      letter-spacing: -0.5px;
    }
    
    .tagline {
      color: #6b7a90;
      font-size: 14px;
      margin-top: 8px;
    }
    
    .main-content {
      background-color: #ffffff;
      padding: 40px;
    }
    
    h1 {
      font-size: 26px;
      font-weight: 700;
      color: #1a1a1a;
      margin: 0 0 8px 0;
      text-align: center;
      line-height: 1.3;
    }
    
    .subtitle {
      font-size: 16px;
      color: #6b7a90;
      margin: 0 0 30px 0;
      text-align: center;
    }
    
    p {
      font-size: 16px;
      color: #4a4a4a;
      margin: 0 0 16px 0;
      line-height: 1.7;
    }
    
    .greeting {
      font-size: 16px;
      color: #1a1a1a;
      margin-bottom: 20px;
    }
    
    .button-container {
      text-align: center;
      margin: 32px 0;
    }
    
    .button {
      display: inline-block;
      padding: 16px 40px;
      background: linear-gradient(135deg, ${BRAND_GREEN} 0%, ${BRAND_GREEN_DARK} 100%);
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 10px;
      font-weight: 600;
      font-size: 16px;
      text-align: center;
      box-shadow: 0 4px 14px rgba(34, 197, 94, 0.35);
    }
    
    .link-box {
      background-color: #f8fafc;
      border-radius: 8px;
      padding: 16px;
      margin: 16px 0;
      word-break: break-all;
    }
    
    .link-box p {
      font-size: 12px;
      color: #6b7a90;
      margin: 0 0 8px 0;
    }
    
    .link-box a {
      font-size: 13px;
      color: ${BRAND_GREEN};
      text-decoration: none;
      word-break: break-all;
    }
    
    .info-box {
      background: linear-gradient(135deg, #eff6ff 0%, #e0f2fe 100%);
      border-left: 4px solid #3b82f6;
      padding: 16px 20px;
      border-radius: 0 8px 8px 0;
      margin: 24px 0;
    }
    
    .info-box p {
      color: #1e40af;
      margin: 0;
      font-size: 14px;
      line-height: 1.6;
    }
    
    .warning-box {
      background: linear-gradient(135deg, #fefce8 0%, #fef3c7 100%);
      border-left: 4px solid #f59e0b;
      padding: 16px 20px;
      border-radius: 0 8px 8px 0;
      margin: 24px 0;
    }
    
    .warning-box p {
      color: #92400e;
      margin: 0;
      font-size: 14px;
      line-height: 1.6;
    }
    
    .success-box {
      background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
      border-left: 4px solid ${BRAND_GREEN};
      padding: 16px 20px;
      border-radius: 0 8px 8px 0;
      margin: 24px 0;
    }
    
    .success-box p {
      color: #065f46;
      margin: 0;
      font-size: 14px;
      line-height: 1.6;
    }
    
    .transaction-box {
      background: linear-gradient(135deg, #f8fafc 0%, #f0f2f5 100%);
      border-radius: 12px;
      padding: 24px;
      margin: 24px 0;
    }
    
    .features-list {
      margin: 24px 0;
      padding: 0 0 0 20px;
      list-style: disc;
    }
    
    .features-list li {
      padding: 8px 0;
      color: #4a4a4a;
      font-size: 15px;
    }
    
    .footer {
      background-color: #f8fafc;
      border-radius: 0 0 16px 16px;
      padding: 30px 40px;
      text-align: center;
      border-top: 1px solid #e2e8f0;
    }
    
    .footer-links {
      margin-bottom: 20px;
    }
    
    .footer-links a {
      color: ${BRAND_GREEN};
      text-decoration: none;
      font-size: 14px;
      margin: 0 12px;
    }
    
    .footer-text {
      font-size: 13px;
      color: #9ca3af;
      margin: 0;
    }
    
    .footer-address {
      font-size: 12px;
      color: #9ca3af;
      margin-top: 16px;
      line-height: 1.6;
    }
    
    .divider {
      height: 1px;
      background: linear-gradient(90deg, transparent, #e2e8f0, transparent);
      margin: 24px 0;
    }
    
    @media only screen and (max-width: 600px) {
      .email-wrapper { padding: 20px 10px !important; }
      .header { padding: 30px 24px 24px !important; border-radius: 12px 12px 0 0 !important; }
      .main-content { padding: 24px !important; }
      .footer { padding: 24px !important; border-radius: 0 0 12px 12px !important; }
      h1 { font-size: 22px !important; }
      .button { padding: 14px 32px !important; font-size: 15px !important; }
      .logo-text { font-size: 22px !important; }
    }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="email-container">
      <div class="header">
        <div class="logo-container">
          <div class="logo-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 17L9 11L13 15L21 7" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M17 7H21V11" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <span class="logo-text">${APP_NAME}</span>
        </div>
        <p class="tagline">Professional Trading Platform</p>
      </div>
      
      <div class="main-content">
        ${content}
      </div>
      
      <div class="footer">
        <div class="footer-links">
          <a href="${APP_URL}">Website</a>
          <a href="${APP_URL}/dashboard">Dashboard</a>
          <a href="${APP_URL}/contact">Support</a>
        </div>
        <p class="footer-text">${new Date().getFullYear()} ${APP_NAME}. All rights reserved.</p>
        <p class="footer-address">
          This email was sent to you because you have an account with ${APP_NAME}.<br>
          If you didn't request this email, please ignore it or contact support.
        </p>
      </div>
    </div>
  </div>
</body>
</html>
`;
}

// ============================================
// Email Functions
// ============================================

/**
 * Send email verification
 */
export async function sendVerificationEmail(
  email: string,
  name: string,
  token: string
): Promise<{ success: boolean; error?: string }> {
  const verificationUrl = `${APP_URL}/verify-email?token=${token}`;

  const template: EmailTemplate = {
    subject: `Verify Your Email - ${APP_NAME}`,
    html: baseEmailTemplate(`
      <h1>Verify Your Email Address</h1>
      <p class="subtitle">One quick step to activate your account</p>
      
      <p class="greeting">Hi ${name},</p>
      
      <p>Thank you for creating an account with ${APP_NAME}. To get started with trading, please verify your email address by clicking the button below.</p>
      
      <div class="button-container">
        <a href="${verificationUrl}" class="button">Verify Email Address</a>
      </div>
      
      <div class="link-box">
        <p>Or copy and paste this link into your browser:</p>
        <a href="${verificationUrl}">${verificationUrl}</a>
      </div>
      
      <div class="warning-box">
        <p><strong>This link expires in 24 hours.</strong> If you didn't create an account with ${APP_NAME}, you can safely ignore this email.</p>
      </div>
      
      <div class="divider"></div>
      
      <p style="font-size: 14px; color: #6b7a90;">Need help? Contact our support team at <a href="mailto:support@rfmtradepro.com" style="color: ${BRAND_GREEN};">support@rfmtradepro.com</a></p>
    `, `Verify your email to start trading on ${APP_NAME}`),
    text: `
Hi ${name},

Thank you for creating an account with ${APP_NAME}.

Please verify your email address by clicking the link below:
${verificationUrl}

This link expires in 24 hours.

If you didn't create an account with ${APP_NAME}, you can safely ignore this email.

Need help? Contact our support team at support@rfmtradepro.com

Best regards,
The ${APP_NAME} Team
    `.trim(),
  };

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });

    if (error) {
      console.error('Error sending verification email:', error);
      return { success: false, error: error.message };
    }

    console.log(`Verification email sent to ${email}`);
    return { success: true };
  } catch (error) {
    console.error('Error sending verification email:', error);
    return { success: false, error: 'Failed to send verification email' };
  }
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  email: string,
  name: string,
  token: string
): Promise<{ success: boolean; error?: string }> {
  const resetUrl = `${APP_URL}/reset-password?token=${token}`;

  const template: EmailTemplate = {
    subject: `Reset Your Password - ${APP_NAME}`,
    html: baseEmailTemplate(`
      <h1>Reset Your Password</h1>
      <p class="subtitle">We received a request to reset your password</p>
      
      <p class="greeting">Hi ${name},</p>
      
      <p>We received a request to reset the password for your ${APP_NAME} account. Click the button below to create a new password.</p>
      
      <div class="button-container">
        <a href="${resetUrl}" class="button">Reset Password</a>
      </div>
      
      <div class="link-box">
        <p>Or copy and paste this link into your browser:</p>
        <a href="${resetUrl}">${resetUrl}</a>
      </div>
      
      <div class="warning-box">
        <p><strong>This link expires in 1 hour.</strong> If you didn't request a password reset, please ignore this email or contact support if you're concerned about your account security.</p>
      </div>
      
      <div class="info-box">
        <p><strong>Security tip:</strong> ${APP_NAME} will never ask for your password via email. Always access your account through our official website.</p>
      </div>
      
      <div class="divider"></div>
      
      <p style="font-size: 14px; color: #6b7a90;">Need help? Contact our support team at <a href="mailto:support@rfmtradepro.com" style="color: ${BRAND_GREEN};">support@rfmtradepro.com</a></p>
    `, `Reset your ${APP_NAME} password`),
    text: `
Hi ${name},

We received a request to reset the password for your ${APP_NAME} account.

Click the link below to create a new password:
${resetUrl}

This link expires in 1 hour.

If you didn't request a password reset, please ignore this email or contact support if you're concerned about your account security.

Security tip: ${APP_NAME} will never ask for your password via email. Always access your account through our official website.

Need help? Contact our support team at support@rfmtradepro.com

Best regards,
The ${APP_NAME} Team
    `.trim(),
  };

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });

    if (error) {
      console.error('Error sending password reset email:', error);
      return { success: false, error: error.message };
    }

    console.log(`Password reset email sent to ${email}`);
    return { success: true };
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return { success: false, error: 'Failed to send password reset email' };
  }
}

/**
 * Send welcome email after verification
 */
export async function sendWelcomeEmail(
  email: string,
  name: string
): Promise<{ success: boolean; error?: string }> {
  const template: EmailTemplate = {
    subject: `Welcome to ${APP_NAME}`,
    html: baseEmailTemplate(`
      <h1>Welcome to ${APP_NAME}</h1>
      <p class="subtitle">Your account is now active</p>
      
      <p class="greeting">Hi ${name},</p>
      
      <p>Congratulations! Your email has been verified and your account is now fully activated. You're all set to begin your trading journey with us.</p>
      
      <div class="success-box">
        <p><strong>Account Status:</strong> Verified and Active</p>
      </div>
      
      <p><strong>Here's what you can do next:</strong></p>
      
      <ul class="features-list">
        <li>Make your first deposit to fund your account</li>
        <li>Explore live markets and discover trading opportunities</li>
        <li>Follow expert traders with our Copy Trading feature</li>
        <li>Invest in tokenized real estate properties</li>
        <li>Stake your crypto assets for passive income</li>
      </ul>
      
      <div class="button-container">
        <a href="${APP_URL}/dashboard" class="button">Go to Dashboard</a>
      </div>
      
      <div class="divider"></div>
      
      <div class="info-box">
        <p><strong>Need assistance?</strong> Our support team is available 24/7 to help you get started. Don't hesitate to reach out if you have any questions.</p>
      </div>
      
      <p style="font-size: 14px; color: #6b7a90;">Contact us anytime at <a href="mailto:support@rfmtradepro.com" style="color: ${BRAND_GREEN};">support@rfmtradepro.com</a></p>
    `, `Your ${APP_NAME} account is now active - start trading today`),
    text: `
Hi ${name},

Welcome to ${APP_NAME}!

Congratulations! Your email has been verified and your account is now fully activated. You're all set to begin your trading journey with us.

Here's what you can do next:
- Make your first deposit to fund your account
- Explore live markets and discover trading opportunities
- Follow expert traders with our Copy Trading feature
- Invest in tokenized real estate properties
- Stake your crypto assets for passive income

Visit your dashboard: ${APP_URL}/dashboard

Need assistance? Our support team is available 24/7 to help you get started.

Contact us anytime at support@rfmtradepro.com

Best regards,
The ${APP_NAME} Team
    `.trim(),
  };

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });

    if (error) {
      console.error('Error sending welcome email:', error);
      return { success: false, error: error.message };
    }

    console.log(`Welcome email sent to ${email}`);
    return { success: true };
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return { success: false, error: 'Failed to send welcome email' };
  }
}

/**
 * Send transaction notification email
 */
export async function sendTransactionEmail(
  email: string,
  name: string,
  type: 'deposit' | 'withdrawal',
  status: 'pending' | 'approved' | 'rejected',
  amount: number,
  reference: string
): Promise<{ success: boolean; error?: string }> {
  const statusConfig = {
    pending: {
      title: `${type === 'deposit' ? 'Deposit' : 'Withdrawal'} Request Received`,
      message: `Your ${type} request of $${amount.toLocaleString()} is being processed.`,
      color: '#f59e0b',
    },
    approved: {
      title: `${type === 'deposit' ? 'Deposit' : 'Withdrawal'} Approved`,
      message: `Your ${type} of $${amount.toLocaleString()} has been approved and processed successfully.`,
      color: BRAND_GREEN,
    },
    rejected: {
      title: `${type === 'deposit' ? 'Deposit' : 'Withdrawal'} Rejected`,
      message: `Your ${type} request of $${amount.toLocaleString()} has been rejected. Please contact support for more information.`,
      color: '#ef4444',
    },
  };

  const config = statusConfig[status];

  const template: EmailTemplate = {
    subject: `${config.title} - ${APP_NAME}`,
    html: baseEmailTemplate(`
      <h1>${config.title}</h1>
      <p class="subtitle">Transaction Update</p>
      
      <p class="greeting">Hi ${name},</p>
      
      <p>${config.message}</p>
      
      <div class="transaction-box">
        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
              <span style="color: #6b7a90; font-size: 14px;">Amount</span>
            </td>
            <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; text-align: right;">
              <span style="color: #1a1a1a; font-weight: 600; font-size: 16px;">$${amount.toLocaleString()}</span>
            </td>
          </tr>
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
              <span style="color: #6b7a90; font-size: 14px;">Type</span>
            </td>
            <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; text-align: right;">
              <span style="color: #1a1a1a; font-weight: 600;">${type.charAt(0).toUpperCase() + type.slice(1)}</span>
            </td>
          </tr>
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
              <span style="color: #6b7a90; font-size: 14px;">Reference</span>
            </td>
            <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; text-align: right;">
              <span style="color: #1a1a1a; font-family: monospace; font-size: 13px;">${reference}</span>
            </td>
          </tr>
          <tr>
            <td style="padding: 12px 0;">
              <span style="color: #6b7a90; font-size: 14px;">Status</span>
            </td>
            <td style="padding: 12px 0; text-align: right;">
              <span style="color: ${config.color}; font-weight: 700; font-size: 14px; text-transform: uppercase;">${status}</span>
            </td>
          </tr>
        </table>
      </div>
      
      <div class="button-container">
        <a href="${APP_URL}/dashboard" class="button">View Dashboard</a>
      </div>
      
      <div class="divider"></div>
      
      <p style="font-size: 14px; color: #6b7a90;">Questions about this transaction? Contact our support team at <a href="mailto:support@rfmtradepro.com" style="color: ${BRAND_GREEN};">support@rfmtradepro.com</a></p>
    `, `${config.title} - Reference: ${reference}`),
    text: `
Hi ${name},

${config.title}

${config.message}

Transaction Details:
- Amount: $${amount.toLocaleString()}
- Type: ${type.charAt(0).toUpperCase() + type.slice(1)}
- Reference: ${reference}
- Status: ${status.toUpperCase()}

View your dashboard: ${APP_URL}/dashboard

Questions about this transaction? Contact our support team at support@rfmtradepro.com

Best regards,
The ${APP_NAME} Team
    `.trim(),
  };

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });

    if (error) {
      console.error('Error sending transaction email:', error);
      return { success: false, error: error.message };
    }

    console.log(`Transaction email sent to ${email} (${type} - ${status})`);
    return { success: true };
  } catch (error) {
    console.error('Error sending transaction email:', error);
    return { success: false, error: 'Failed to send transaction email' };
  }
}

/**
 * Send account status notification (approved/suspended/etc)
 */
export async function sendAccountStatusEmail(
  email: string,
  name: string,
  status: 'active' | 'suspended' | 'banned',
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  const statusConfig = {
    active: {
      title: 'Account Activated',
      message: 'Great news! Your account has been activated and you now have full access to all trading features.',
    },
    suspended: {
      title: 'Account Suspended',
      message: 'Your account has been temporarily suspended. Please contact our support team for more information.',
    },
    banned: {
      title: 'Account Terminated',
      message: 'Your account has been terminated due to a violation of our terms of service.',
    },
  };

  const config = statusConfig[status];

  const template: EmailTemplate = {
    subject: `${config.title} - ${APP_NAME}`,
    html: baseEmailTemplate(`
      <h1>${config.title}</h1>
      <p class="subtitle">Account Update</p>
      
      <p class="greeting">Hi ${name},</p>
      
      <p>${config.message}</p>
      
      ${reason ? `
      <div class="info-box">
        <p><strong>Reason:</strong> ${reason}</p>
      </div>
      ` : ''}
      
      ${status === 'active' ? `
      <div class="button-container">
        <a href="${APP_URL}/dashboard" class="button">Go to Dashboard</a>
      </div>
      ` : `
      <div class="button-container">
        <a href="${APP_URL}/contact" class="button">Contact Support</a>
      </div>
      `}
      
      <div class="divider"></div>
      
      <p style="font-size: 14px; color: #6b7a90;">If you have any questions, please contact our support team at <a href="mailto:support@rfmtradepro.com" style="color: ${BRAND_GREEN};">support@rfmtradepro.com</a></p>
    `, `${config.title} - ${APP_NAME}`),
    text: `
Hi ${name},

${config.title}

${config.message}

${reason ? `Reason: ${reason}` : ''}

${status === 'active' ? `Visit your dashboard: ${APP_URL}/dashboard` : `Contact support: ${APP_URL}/contact`}

If you have any questions, please contact our support team at support@rfmtradepro.com

Best regards,
The ${APP_NAME} Team
    `.trim(),
  };

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });

    if (error) {
      console.error('Error sending account status email:', error);
      return { success: false, error: error.message };
    }

    console.log(`Account status email sent to ${email} (${status})`);
    return { success: true };
  } catch (error) {
    console.error('Error sending account status email:', error);
    return { success: false, error: 'Failed to send account status email' };
  }
}

/**
 * Send login alert email
 */
export async function sendLoginAlertEmail(
  email: string,
  name: string,
  ipAddress: string,
  userAgent: string,
  location?: string
): Promise<{ success: boolean; error?: string }> {
  const loginTime = new Date().toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  });

  const template: EmailTemplate = {
    subject: `New Login Detected - ${APP_NAME}`,
    html: baseEmailTemplate(`
      <h1>New Login Detected</h1>
      <p class="subtitle">Security Alert</p>
      
      <p class="greeting">Hi ${name},</p>
      
      <p>We detected a new login to your ${APP_NAME} account. If this was you, you can safely ignore this email.</p>
      
      <div class="transaction-box">
        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
              <span style="color: #6b7a90; font-size: 14px;">Time</span>
            </td>
            <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; text-align: right;">
              <span style="color: #1a1a1a; font-size: 14px;">${loginTime}</span>
            </td>
          </tr>
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
              <span style="color: #6b7a90; font-size: 14px;">IP Address</span>
            </td>
            <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; text-align: right;">
              <span style="color: #1a1a1a; font-family: monospace; font-size: 13px;">${ipAddress}</span>
            </td>
          </tr>
          ${location ? `
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
              <span style="color: #6b7a90; font-size: 14px;">Location</span>
            </td>
            <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; text-align: right;">
              <span style="color: #1a1a1a; font-size: 14px;">${location}</span>
            </td>
          </tr>
          ` : ''}
          <tr>
            <td style="padding: 12px 0;">
              <span style="color: #6b7a90; font-size: 14px;">Device</span>
            </td>
            <td style="padding: 12px 0; text-align: right;">
              <span style="color: #1a1a1a; font-size: 13px;">${userAgent.substring(0, 50)}...</span>
            </td>
          </tr>
        </table>
      </div>
      
      <div class="warning-box">
        <p><strong>Wasn't you?</strong> If you didn't log in, please immediately reset your password and contact our support team.</p>
      </div>
      
      <div class="button-container">
        <a href="${APP_URL}/forgot-password" class="button">Reset Password</a>
      </div>
      
      <div class="divider"></div>
      
      <p style="font-size: 14px; color: #6b7a90;">Contact our support team at <a href="mailto:support@rfmtradepro.com" style="color: ${BRAND_GREEN};">support@rfmtradepro.com</a></p>
    `, `New login to your ${APP_NAME} account detected`),
    text: `
Hi ${name},

New Login Detected

We detected a new login to your ${APP_NAME} account. If this was you, you can safely ignore this email.

Login Details:
- Time: ${loginTime}
- IP Address: ${ipAddress}
${location ? `- Location: ${location}` : ''}
- Device: ${userAgent.substring(0, 50)}...

Wasn't you? If you didn't log in, please immediately reset your password and contact our support team.

Reset your password: ${APP_URL}/forgot-password

Contact our support team at support@rfmtradepro.com

Best regards,
The ${APP_NAME} Team
    `.trim(),
  };

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });

    if (error) {
      console.error('Error sending login alert email:', error);
      return { success: false, error: error.message };
    }

    console.log(`Login alert email sent to ${email}`);
    return { success: true };
  } catch (error) {
    console.error('Error sending login alert email:', error);
    return { success: false, error: 'Failed to send login alert email' };
  }
}

/**
 * Send deposit alert to admin
 */
export async function sendDepositAlertEmail(
  adminEmail: string,
  depositData: {
    userName: string;
    userEmail: string;
    amount: number;
    token: string;
    network: string;
    txHash?: string;
    walletAddress: string;
    reference: string;
    status: string;
    createdAt: Date;
  }
): Promise<{ success: boolean; error?: string }> {
  const { userName, userEmail, amount, token, network, txHash, walletAddress, reference, status, createdAt } = depositData;
  
  const depositTime = createdAt.toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  });

  const template: EmailTemplate = {
    subject: `💰 New Deposit: $${amount.toLocaleString()} ${token} - ${APP_NAME}`,
    html: baseEmailTemplate(`
      <h1>💰 New Deposit Received</h1>
      <p class="subtitle">Admin Notification</p>
      
      <div class="success-box">
        <p><strong>A new deposit has been received on the platform.</strong></p>
      </div>
      
      <div style="background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); border-radius: 12px; padding: 24px; margin: 24px 0; text-align: center;">
        <p style="font-size: 14px; color: #065f46; margin: 0 0 8px 0;">Deposit Amount</p>
        <p style="font-size: 36px; font-weight: 700; color: #065f46; margin: 0;">$${amount.toLocaleString()}</p>
        <p style="font-size: 16px; color: #065f46; margin: 8px 0 0 0;">${token}</p>
      </div>
      
      <div class="transaction-box">
        <h3 style="font-size: 16px; font-weight: 600; color: #1a1a1a; margin: 0 0 16px 0;">User Information</h3>
        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
              <span style="color: #6b7a90; font-size: 14px;">Name</span>
            </td>
            <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; text-align: right;">
              <span style="color: #1a1a1a; font-size: 14px; font-weight: 500;">${userName}</span>
            </td>
          </tr>
          <tr>
            <td style="padding: 12px 0;">
              <span style="color: #6b7a90; font-size: 14px;">Email</span>
            </td>
            <td style="padding: 12px 0; text-align: right;">
              <a href="mailto:${userEmail}" style="color: ${BRAND_GREEN}; font-size: 14px; text-decoration: none;">${userEmail}</a>
            </td>
          </tr>
        </table>
      </div>
      
      <div class="transaction-box">
        <h3 style="font-size: 16px; font-weight: 600; color: #1a1a1a; margin: 0 0 16px 0;">Transaction Details</h3>
        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
              <span style="color: #6b7a90; font-size: 14px;">Reference</span>
            </td>
            <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; text-align: right;">
              <span style="color: #1a1a1a; font-family: monospace; font-size: 13px;">${reference}</span>
            </td>
          </tr>
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
              <span style="color: #6b7a90; font-size: 14px;">Token</span>
            </td>
            <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; text-align: right;">
              <span style="color: #1a1a1a; font-size: 14px;">${token}</span>
            </td>
          </tr>
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
              <span style="color: #6b7a90; font-size: 14px;">Network</span>
            </td>
            <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; text-align: right;">
              <span style="color: #1a1a1a; font-size: 14px;">${network}</span>
            </td>
          </tr>
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
              <span style="color: #6b7a90; font-size: 14px;">Wallet</span>
            </td>
            <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; text-align: right;">
              <span style="color: #1a1a1a; font-family: monospace; font-size: 11px;">${walletAddress}</span>
            </td>
          </tr>
          ${txHash ? `
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
              <span style="color: #6b7a90; font-size: 14px;">TX Hash</span>
            </td>
            <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; text-align: right;">
              <span style="color: #1a1a1a; font-family: monospace; font-size: 11px;">${txHash}</span>
            </td>
          </tr>
          ` : ''}
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
              <span style="color: #6b7a90; font-size: 14px;">Time</span>
            </td>
            <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; text-align: right;">
              <span style="color: #1a1a1a; font-size: 14px;">${depositTime}</span>
            </td>
          </tr>
          <tr>
            <td style="padding: 12px 0;">
              <span style="color: #6b7a90; font-size: 14px;">Status</span>
            </td>
            <td style="padding: 12px 0; text-align: right;">
              <span style="color: ${status === 'completed' ? '#22c55e' : '#f59e0b'}; font-weight: 700; font-size: 14px; text-transform: uppercase;">${status}</span>
            </td>
          </tr>
        </table>
      </div>
      
      <div class="button-container">
        <a href="${APP_URL}/admin/deposits" class="button">View in Admin Panel</a>
      </div>
    `, `New $${amount.toLocaleString()} ${token} deposit from ${userName}`),
    text: `
New Deposit Received - Admin Notification

A new deposit has been received on the platform.

Amount: $${amount.toLocaleString()} ${token}

User Information:
- Name: ${userName}
- Email: ${userEmail}

Transaction Details:
- Reference: ${reference}
- Token: ${token}
- Network: ${network}
- Wallet: ${walletAddress}
${txHash ? `- TX Hash: ${txHash}` : ''}
- Time: ${depositTime}
- Status: ${status.toUpperCase()}

View in Admin Panel: ${APP_URL}/admin/deposits

Best regards,
${APP_NAME} System
    `.trim(),
  };

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: adminEmail,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });

    if (error) {
      console.error('Error sending deposit alert email:', error);
      return { success: false, error: error.message };
    }

    console.log(`Deposit alert email sent to ${adminEmail}`);
    return { success: true };
  } catch (error) {
    console.error('Error sending deposit alert email:', error);
    return { success: false, error: 'Failed to send deposit alert email' };
  }
}

/**
 * Send withdrawal alert to admin
 */
export async function sendWithdrawalAlertEmail(
  adminEmail: string,
  withdrawalData: {
    userName: string;
    userEmail: string;
    amount: number;
    token: string;
    network?: string;
    walletAddress?: string;
    bankName?: string;
    accountNumber?: string;
    reference: string;
    status: string;
    fee: number;
    netAmount: number;
    createdAt: Date;
  }
): Promise<{ success: boolean; error?: string }> {
  const { 
    userName, userEmail, amount, token, network, walletAddress, 
    bankName, accountNumber, reference, status, fee, netAmount, createdAt 
  } = withdrawalData;
  
  const withdrawalTime = createdAt.toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  });

  const isCrypto = !!walletAddress;
  const destinationInfo = isCrypto 
    ? `${token} (${network}) - ${walletAddress?.slice(0, 10)}...${walletAddress?.slice(-8)}`
    : `${bankName} - ****${accountNumber?.slice(-4)}`;

  const template: EmailTemplate = {
    subject: `💸 Withdrawal Request: $${amount.toLocaleString()} ${token} - ${APP_NAME}`,
    html: baseEmailTemplate(`
      <h1>💸 New Withdrawal Request</h1>
      <p class="subtitle">Admin Notification - Action Required</p>
      
      <div class="warning-box">
        <p><strong>A new withdrawal request requires your attention.</strong></p>
      </div>
      
      <div style="background: linear-gradient(135deg, #fef2f2 0%, #fecaca 100%); border-radius: 12px; padding: 24px; margin: 24px 0; text-align: center;">
        <p style="font-size: 14px; color: #991b1b; margin: 0 0 8px 0;">Withdrawal Amount</p>
        <p style="font-size: 36px; font-weight: 700; color: #991b1b; margin: 0;">-$${amount.toLocaleString()}</p>
        <p style="font-size: 16px; color: #991b1b; margin: 8px 0 0 0;">${token}</p>
      </div>
      
      <div class="transaction-box">
        <h3 style="font-size: 16px; font-weight: 600; color: #1a1a1a; margin: 0 0 16px 0;">User Information</h3>
        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
              <span style="color: #6b7a90; font-size: 14px;">Name</span>
            </td>
            <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; text-align: right;">
              <span style="color: #1a1a1a; font-size: 14px; font-weight: 500;">${userName}</span>
            </td>
          </tr>
          <tr>
            <td style="padding: 12px 0;">
              <span style="color: #6b7a90; font-size: 14px;">Email</span>
            </td>
            <td style="padding: 12px 0; text-align: right;">
              <a href="mailto:${userEmail}" style="color: ${BRAND_GREEN}; font-size: 14px; text-decoration: none;">${userEmail}</a>
            </td>
          </tr>
        </table>
      </div>
      
      <div class="transaction-box">
        <h3 style="font-size: 16px; font-weight: 600; color: #1a1a1a; margin: 0 0 16px 0;">Withdrawal Details</h3>
        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
              <span style="color: #6b7a90; font-size: 14px;">Reference</span>
            </td>
            <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; text-align: right;">
              <span style="color: #1a1a1a; font-family: monospace; font-size: 13px;">${reference}</span>
            </td>
          </tr>
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
              <span style="color: #6b7a90; font-size: 14px;">Method</span>
            </td>
            <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; text-align: right;">
              <span style="color: #1a1a1a; font-size: 14px;">${isCrypto ? 'Crypto' : 'Bank Transfer'}</span>
            </td>
          </tr>
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
              <span style="color: #6b7a90; font-size: 14px;">Destination</span>
            </td>
            <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; text-align: right;">
              <span style="color: #1a1a1a; font-size: 13px;">${destinationInfo}</span>
            </td>
          </tr>
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
              <span style="color: #6b7a90; font-size: 14px;">Fee</span>
            </td>
            <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; text-align: right;">
              <span style="color: #1a1a1a; font-size: 14px;">$${fee.toLocaleString()}</span>
            </td>
          </tr>
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
              <span style="color: #6b7a90; font-size: 14px;">Net Amount</span>
            </td>
            <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; text-align: right;">
              <span style="color: #1a1a1a; font-size: 14px; font-weight: 600;">$${netAmount.toLocaleString()}</span>
            </td>
          </tr>
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
              <span style="color: #6b7a90; font-size: 14px;">Time</span>
            </td>
            <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; text-align: right;">
              <span style="color: #1a1a1a; font-size: 14px;">${withdrawalTime}</span>
            </td>
          </tr>
          <tr>
            <td style="padding: 12px 0;">
              <span style="color: #6b7a90; font-size: 14px;">Status</span>
            </td>
            <td style="padding: 12px 0; text-align: right;">
              <span style="color: #f59e0b; font-weight: 700; font-size: 14px; text-transform: uppercase;">${status}</span>
            </td>
          </tr>
        </table>
      </div>
      
      <div class="button-container">
        <a href="${APP_URL}/admin/withdrawals" class="button">Review in Admin Panel</a>
      </div>
    `, `New $${amount.toLocaleString()} ${token} withdrawal request from ${userName}`),
    text: `
New Withdrawal Request - Admin Notification

A new withdrawal request requires your attention.

Amount: $${amount.toLocaleString()} ${token}

User Information:
- Name: ${userName}
- Email: ${userEmail}

Withdrawal Details:
- Reference: ${reference}
- Method: ${isCrypto ? 'Crypto' : 'Bank Transfer'}
- Destination: ${destinationInfo}
- Fee: $${fee.toLocaleString()}
- Net Amount: $${netAmount.toLocaleString()}
- Time: ${withdrawalTime}
- Status: ${status.toUpperCase()}

Review in Admin Panel: ${APP_URL}/admin/withdrawals

Best regards,
${APP_NAME} System
    `.trim(),
  };

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: adminEmail,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });

    if (error) {
      console.error('Error sending withdrawal alert email:', error);
      return { success: false, error: error.message };
    }

    console.log(`Withdrawal alert email sent to ${adminEmail}`);
    return { success: true };
  } catch (error) {
    console.error('Error sending withdrawal alert email:', error);
    return { success: false, error: 'Failed to send withdrawal alert email' };
  }
}
