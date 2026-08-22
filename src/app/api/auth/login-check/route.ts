import crypto from 'node:crypto';
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/db/connection';
import User from '@/db/models/User';
import { sendVerificationEmail } from '@/lib/email';
import { loginSchema } from '@/lib/validations';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = loginSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const { email, password } = result.data;

    await connectToDatabase();

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    if (user.isLocked()) {
      return NextResponse.json(
        { error: 'Account is temporarily locked. Please try again later.' },
        { status: 423 }
      );
    }

    if (user.status === 'suspended') {
      return NextResponse.json(
        { error: 'Your account has been suspended. Please contact support.' },
        { status: 403 }
      );
    }

    if (user.status === 'banned') {
      return NextResponse.json({ error: 'Your account has been banned.' }, { status: 403 });
    }

    if (user.status === 'deleted') {
      return NextResponse.json({ error: 'This account has been deleted.' }, { status: 403 });
    }

    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      user.loginAttempts += 1;

      if (user.loginAttempts >= 5) {
        user.lockUntil = new Date(Date.now() + 15 * 60 * 1000);
      }

      await user.save();
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    user.loginAttempts = 0;
    user.lockUntil = undefined;

    if (!user.emailVerified) {
      const emailVerificationToken = crypto.randomBytes(32).toString('hex');
      const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

      user.emailVerificationToken = emailVerificationToken;
      user.emailVerificationExpires = emailVerificationExpires;
      await user.save();

      const emailResult = await sendVerificationEmail(
        user.email,
        user.firstName,
        emailVerificationToken
      );

      if (!emailResult.success) {
        console.error('Failed to send login verification email:', emailResult.error);
        return NextResponse.json(
          { error: 'Failed to send verification email' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        emailVerified: false,
        verificationEmailSent: true,
        message: 'Please verify your email. We sent a new verification link.',
      });
    }

    await user.save();

    return NextResponse.json({
      emailVerified: true,
      requires2FA: user.twoFactorEnabled || false,
    });
  } catch (error) {
    console.error('Login check error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
