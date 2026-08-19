import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { connectToDatabase } from '@/db/connection';
import User from '@/db/models/User';
import { forgotPasswordSchema } from '@/lib/validations';
import { sendPasswordResetEmail } from '@/lib/email';

// ============================================
// POST /api/auth/forgot-password
// ============================================

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate input
    const result = forgotPasswordSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: 'Please provide a valid email address' },
        { status: 400 }
      );
    }

    const { email } = result.data;

    await connectToDatabase();

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json(
        { success: true, message: 'If an account exists, a password reset email has been sent.' },
        { status: 200 }
      );
    }

    // Check if user is banned
    if (user.status === 'banned') {
      return NextResponse.json(
        { success: true, message: 'If an account exists, a password reset email has been sent.' },
        { status: 200 }
      );
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Save token to user
    user.passwordResetToken = resetToken;
    user.passwordResetExpires = resetExpires;
    await user.save();

    // Send email
    const emailResult = await sendPasswordResetEmail(
      user.email,
      user.firstName,
      resetToken
    );

    if (!emailResult.success) {
      console.error('Failed to send password reset email:', emailResult.error);
      return NextResponse.json(
        { success: false, error: 'Failed to send password reset email. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, message: 'If an account exists, a password reset email has been sent.' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { success: false, error: 'An error occurred' },
      { status: 500 }
    );
  }
}
