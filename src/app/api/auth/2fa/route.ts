import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/db/connection';
import { User } from '@/db/models';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@rfmtradepro.com';
const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'RFM TradePro';

// Generate 6-digit code
function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// POST - Check 2FA status and send code OR verify code
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const body = await request.json();
    const { action, email, password, code } = body;

    // Check if 2FA is required for this email (just checks status, no credentials needed)
    if (action === 'check') {
      if (!email) {
        return NextResponse.json({ error: 'Email required' }, { status: 400 });
      }

      const user = await User.findOne({ email: email.toLowerCase() });
      
      if (!user) {
        // Don't reveal if user exists
        return NextResponse.json({ requires2FA: false });
      }

      return NextResponse.json({ 
        requires2FA: user.twoFactorEnabled || false,
      });
    }

    // Validate credentials and send 2FA code
    if (action === 'send') {
      if (!email || !password) {
        return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
      }

      const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
      
      if (!user) {
        return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
      }

      // Check if account is locked
      if (user.isLocked()) {
        return NextResponse.json({ error: 'Account is temporarily locked. Please try again later.' }, { status: 423 });
      }

      // Check if account is suspended or banned
      if (user.status === 'suspended') {
        return NextResponse.json({ error: 'Your account has been suspended. Please contact support.' }, { status: 403 });
      }

      if (user.status === 'banned') {
        return NextResponse.json({ error: 'Your account has been banned.' }, { status: 403 });
      }

      if (user.status === 'deleted') {
        return NextResponse.json({ error: 'This account has been deleted.' }, { status: 403 });
      }

      // Verify password FIRST before sending any code
      const isPasswordValid = await user.comparePassword(password);

      if (!isPasswordValid) {
        // Increment login attempts
        user.loginAttempts += 1;
        
        // Lock account after 5 failed attempts for 15 minutes
        if (user.loginAttempts >= 5) {
          user.lockUntil = new Date(Date.now() + 15 * 60 * 1000);
        }
        
        await user.save();
        return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
      }

      // Credentials valid - reset login attempts
      user.loginAttempts = 0;
      user.lockUntil = undefined;

      if (!user.twoFactorEnabled) {
        await user.save();
        return NextResponse.json({ error: '2FA not enabled for this account' }, { status: 400 });
      }

      // Generate and save code (expires in 10 minutes)
      const verificationCode = generateCode();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      user.twoFactorCode = verificationCode;
      user.twoFactorExpires = expiresAt;
      await user.save();

      // Send email with verification code
      try {
        await resend.emails.send({
          from: `${APP_NAME} Security <${FROM_EMAIL}>`,
          to: user.email,
          subject: `Your ${APP_NAME} Verification Code`,
          html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verification Code</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0a0e14;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0e14; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 480px; background-color: #0f1419; border-radius: 12px; border: 1px solid #1e2733;">
          
          <!-- Header -->
          <tr>
            <td style="padding: 32px 32px 24px; text-align: center; border-bottom: 1px solid #1e2733;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #22c55e;">${APP_NAME}</h1>
              <p style="margin: 8px 0 0; font-size: 14px; color: #6b7a90;">Secure Authentication</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 32px;">
              <h2 style="margin: 0 0 16px; font-size: 20px; font-weight: 600; color: #ffffff;">Verification Code</h2>
              
              <p style="margin: 0 0 24px; font-size: 14px; line-height: 1.6; color: #9ca3af;">
                A sign-in attempt was detected for your account. Use the verification code below to complete your login:
              </p>
              
              <!-- Code Box -->
              <div style="background-color: #0a0e14; border: 2px solid #22c55e; border-radius: 8px; padding: 24px; text-align: center; margin-bottom: 24px;">
                <span style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #22c55e; font-family: 'Courier New', monospace;">${verificationCode}</span>
              </div>
              
              <p style="margin: 0 0 8px; font-size: 13px; color: #6b7a90;">
                This code expires in <strong style="color: #ffffff;">10 minutes</strong>.
              </p>
              
              <p style="margin: 0; font-size: 13px; color: #6b7a90;">
                If you did not attempt to sign in, please secure your account immediately by changing your password.
              </p>
            </td>
          </tr>

          <!-- Security Notice -->
          <tr>
            <td style="padding: 0 32px 32px;">
              <div style="background-color: #1e2733; border-radius: 8px; padding: 16px;">
                <p style="margin: 0; font-size: 12px; color: #9ca3af; line-height: 1.5;">
                  <strong style="color: #ffffff;">Security Tip:</strong> ${APP_NAME} will never ask for your verification code via phone, SMS, or social media. Only enter this code on the official ${APP_NAME} website.
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; border-top: 1px solid #1e2733; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #6b7a90;">
                This is an automated security message from ${APP_NAME}.<br>
                Please do not reply to this email.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
          `,
        });
      } catch (emailError) {
        console.error('Failed to send 2FA email:', emailError);
        return NextResponse.json({ error: 'Failed to send verification code' }, { status: 500 });
      }

      // Mask email for display
      const [localPart, domain] = user.email.split('@');
      const maskedLocal = localPart.length > 2 
        ? localPart[0] + '*'.repeat(localPart.length - 2) + localPart[localPart.length - 1]
        : localPart[0] + '*';
      const maskedEmail = `${maskedLocal}@${domain}`;

      return NextResponse.json({
        success: true,
        message: 'Verification code sent',
        maskedEmail,
      });
    }

    // Verify 2FA code
    if (action === 'verify') {
      if (!email || !code) {
        return NextResponse.json({ error: 'Email and code required' }, { status: 400 });
      }

      const user = await User.findOne({ email: email.toLowerCase() });
      
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      if (!user.twoFactorCode || !user.twoFactorExpires) {
        return NextResponse.json({ error: 'No verification code found. Please request a new one.' }, { status: 400 });
      }

      // Check if code expired
      if (new Date() > user.twoFactorExpires) {
        user.twoFactorCode = undefined;
        user.twoFactorExpires = undefined;
        await user.save();
        return NextResponse.json({ error: 'Verification code has expired. Please request a new one.' }, { status: 400 });
      }

      // Check if code matches
      if (user.twoFactorCode !== code) {
        return NextResponse.json({ error: 'Invalid verification code' }, { status: 400 });
      }

      // Clear the code after successful verification
      user.twoFactorCode = undefined;
      user.twoFactorExpires = undefined;
      await user.save();

      return NextResponse.json({
        success: true,
        verified: true,
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('2FA error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
