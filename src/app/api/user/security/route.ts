import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { auth } from '@/lib/auth';
import { connectToDatabase } from '@/db/connection';
import { User } from '@/db/models';

// GET - Fetch security settings
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const userId = new mongoose.Types.ObjectId(session.user.id);
    const user = await User.findById(userId).select('twoFactorEnabled email').lean();

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      twoFactorEnabled: user.twoFactorEnabled || false,
      email: user.email,
    });
  } catch (error) {
    console.error('Error fetching security settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH - Update security settings
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const userId = new mongoose.Types.ObjectId(session.user.id);
    const body = await request.json();
    const { action, currentPassword, newPassword, enable2FA } = body;

    const user = await User.findById(userId).select('+password');
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Handle password change
    if (action === 'change_password') {
      if (!currentPassword || !newPassword) {
        return NextResponse.json({ error: 'Current and new password required' }, { status: 400 });
      }

      if (newPassword.length < 8) {
        return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
      }

      // Verify current password
      const isCurrentPasswordValid = await user.comparePassword(currentPassword);
      if (!isCurrentPasswordValid) {
        return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
      }

      // Hash and update new password
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      await User.findByIdAndUpdate(userId, { password: hashedPassword });

      // Add notification
      await User.findByIdAndUpdate(userId, {
        $push: {
          notifications: {
            $each: [{
              type: 'security',
              title: 'Password Changed',
              message: 'Your password has been successfully changed. If you did not make this change, please contact support immediately.',
              read: false,
              createdAt: new Date(),
            }],
            $position: 0,
          },
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Password changed successfully',
      });
    }

    // Handle 2FA toggle
    if (action === 'toggle_2fa') {
      const newStatus = enable2FA === true;
      
      await User.findByIdAndUpdate(userId, { 
        twoFactorEnabled: newStatus,
        twoFactorCode: null,
        twoFactorExpires: null,
      });

      // Add notification
      await User.findByIdAndUpdate(userId, {
        $push: {
          notifications: {
            $each: [{
              type: 'security',
              title: newStatus ? '2FA Enabled' : '2FA Disabled',
              message: newStatus 
                ? 'Two-factor authentication has been enabled. You will receive a verification code via email when logging in.'
                : 'Two-factor authentication has been disabled.',
              read: false,
              createdAt: new Date(),
            }],
            $position: 0,
          },
        },
      });

      return NextResponse.json({
        success: true,
        message: newStatus ? '2FA enabled successfully' : '2FA disabled successfully',
        twoFactorEnabled: newStatus,
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error updating security settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
