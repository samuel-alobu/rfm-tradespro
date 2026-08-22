import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { auth } from '@/lib/auth';
import { connectToDatabase } from '@/db/connection';
import { User } from '@/db/models';
import { sendAccountDeletionCodeEmail } from '@/lib/email';

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

      const emailResult = await sendAccountDeletionCodeEmail(
        user.email,
        user.firstName,
        deletionCode
      );

      if (!emailResult.success) {
        console.error('Failed to send deletion email:', emailResult.error);
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
