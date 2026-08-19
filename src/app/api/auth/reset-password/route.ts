import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/db/connection';
import User from '@/db/models/User';
import { resetPasswordSchema } from '@/lib/validations';

// ============================================
// POST /api/auth/reset-password
// ============================================

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate input
    const result = resetPasswordSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: result.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { token, password } = result.data;

    await connectToDatabase();

    // Find user with valid token
    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: new Date() },
    }).select('+password');

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired reset token' },
        { status: 400 }
      );
    }

    // Update password
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    
    // Reset login attempts if any
    user.loginAttempts = 0;
    user.lockUntil = undefined;

    await user.save();

    return NextResponse.json(
      { success: true, message: 'Password reset successfully. You can now log in.' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { success: false, error: 'An error occurred' },
      { status: 500 }
    );
  }
}

// ============================================
// GET /api/auth/reset-password - Validate Token
// ============================================

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Token is required' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Check if token is valid
    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: new Date() },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired reset token' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: true, message: 'Token is valid' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Validate token error:', error);
    return NextResponse.json(
      { success: false, error: 'An error occurred' },
      { status: 500 }
    );
  }
}
