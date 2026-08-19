import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { auth } from '@/lib/auth';
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

// POST - Handle delete account flow
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const userId = new mongoose.Types.ObjectId(session.user.id);
    const body = await request.json();
    const { action, password, code, reason } = body;

    const user = await User.findById(userId).select('+password');
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Step 1: Verify password and send deletion code
    if (action === 'request') {
      if (!password) {
        return NextResponse.json({ error: 'Password required' }, { status: 400 });
      }

      // Verify password
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        return NextResponse.json({ error: 'Incorrect password' }, { status: 401 });
      }

      // Generate and save deletion code (expires in 10 minutes)
      const deletionCode = generateCode();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      user.deleteAccountCode = deletionCode;
      user.deleteAccountExpires = expiresAt;
      await user.save();

      // Send email with deletion code
      try {
        await resend.emails.send({
          from: `${APP_NAME} Security <${FROM_EMAIL}>`,
          to: user.email,
          subject: `Account Deletion Request - ${APP_NAME}`,
          html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Account Deletion Request</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0a0e14;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0e14; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 480px; background-color: #0f1419; border-radius: 12px; border: 1px solid #1e2733;">
          
          <!-- Header -->
          <tr>
            <td style="padding: 32px 32px 24px; text-align: center; border-bottom: 1px solid #1e2733;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #ef4444;">${APP_NAME}</h1>
              <p style="margin: 8px 0 0; font-size: 14px; color: #6b7a90;">Account Deletion Request</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 32px;">
              <h2 style="margin: 0 0 16px; font-size: 20px; font-weight: 600; color: #ffffff;">Confirm Account Deletion</h2>
              
              <p style="margin: 0 0 24px; font-size: 14px; line-height: 1.6; color: #9ca3af;">
                We received a request to permanently delete your ${APP_NAME} account. If you made this request, use the verification code below to confirm:
              </p>
              
              <!-- Code Box -->
              <div style="background-color: #0a0e14; border: 2px solid #ef4444; border-radius: 8px; padding: 24px; text-align: center; margin-bottom: 24px;">
                <span style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #ef4444; font-family: 'Courier New', monospace;">${deletionCode}</span>
              </div>
              
              <p style="margin: 0 0 8px; font-size: 13px; color: #6b7a90;">
                This code expires in <strong style="color: #ffffff;">10 minutes</strong>.
              </p>
              
              <p style="margin: 0; font-size: 13px; color: #6b7a90;">
                If you did not request this deletion, please ignore this email and secure your account by changing your password immediately.
              </p>
            </td>
          </tr>

          <!-- Warning Notice -->
          <tr>
            <td style="padding: 0 32px 32px;">
              <div style="background-color: #ef4444/10; border: 1px solid #ef4444/30; border-radius: 8px; padding: 16px;">
                <p style="margin: 0; font-size: 12px; color: #ef4444; line-height: 1.5;">
                  <strong>Warning:</strong> Account deletion is permanent. Your profile, settings, and preferences will be removed. However, transaction records will be retained for regulatory compliance.
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
        console.error('Failed to send deletion email:', emailError);
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

    // Step 2: Verify code and soft delete account
    if (action === 'confirm') {
      if (!code) {
        return NextResponse.json({ error: 'Verification code required' }, { status: 400 });
      }

      if (!user.deleteAccountCode || !user.deleteAccountExpires) {
        return NextResponse.json({ error: 'No deletion request found. Please start over.' }, { status: 400 });
      }

      // Check if code expired
      if (new Date() > user.deleteAccountExpires) {
        user.deleteAccountCode = undefined;
        user.deleteAccountExpires = undefined;
        await user.save();
        return NextResponse.json({ error: 'Verification code has expired. Please start over.' }, { status: 400 });
      }

      // Check if code matches
      if (user.deleteAccountCode !== code) {
        return NextResponse.json({ error: 'Invalid verification code' }, { status: 400 });
      }

      // Soft delete the account
      user.status = 'deleted';
      user.deletedAt = new Date();
      user.deletedReason = reason || 'User requested deletion';
      user.deleteAccountCode = undefined;
      user.deleteAccountExpires = undefined;
      await user.save();

      return NextResponse.json({
        success: true,
        message: 'Account deleted successfully',
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Delete account error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
