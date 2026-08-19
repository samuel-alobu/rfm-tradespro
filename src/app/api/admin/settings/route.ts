import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectToDatabase } from '@/db/connection';
import { User, SiteSettings } from '@/db/models';

// ============================================
// Admin Settings API
// ============================================

// Helper to get or create settings
async function getSettings() {
  let settings = await SiteSettings.findOne();
  if (!settings) {
    settings = await SiteSettings.create({});
  }
  return settings;
}

// GET - Retrieve settings (admin only)
export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    // Verify admin role
    const user = await User.findById(session.user.id);
    if (!user || !['admin', 'super_admin'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const settings = await getSettings();
    
    // Mask deposit alert email for non-super admins
    const responseSettings = settings.toObject();
    if (user.role !== 'super_admin') {
      responseSettings.depositAlertEmail = responseSettings.depositAlertEmail 
        ? '••••••@••••••' 
        : '';
    }

    return NextResponse.json({
      success: true,
      settings: responseSettings,
      isSuperAdmin: user.role === 'super_admin',
    });
  } catch (error) {
    console.error('Settings fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

// PATCH - Update settings
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    // Verify admin role
    const user = await User.findById(session.user.id);
    if (!user || !['admin', 'super_admin'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const settings = await getSettings();
    
    // Fields that any admin can update
    const adminFields = [
      'maintenanceMode',
      'maintenanceMessage',
      'requireKycForWithdrawal',
      'autoLogoutEnabled',
      'sessionTimeoutMinutes',
      'withdrawalMinimum',
      'withdrawalDailyLimitUnverified',
      'withdrawalDailyLimitVerified',
      'withdrawalMonthlyLimitUnverified',
      'withdrawalMonthlyLimitVerified',
      'depositMinimum',
      'depositMaximum',
    ];

    // Fields only super_admin can update
    const superAdminFields = [
      'depositAlertEmail',
      'depositAlertEnabled',
    ];

    // Update admin-accessible fields
    for (const field of adminFields) {
      if (body[field] !== undefined) {
        (settings as any)[field] = body[field];
      }
    }

    // Update super-admin-only fields
    if (user.role === 'super_admin') {
      for (const field of superAdminFields) {
        if (body[field] !== undefined) {
          (settings as any)[field] = body[field];
        }
      }
    } else if (superAdminFields.some(f => body[f] !== undefined)) {
      return NextResponse.json(
        { error: 'Only super admins can update notification email settings' },
        { status: 403 }
      );
    }

    settings.updatedBy = user._id;
    await settings.save();

    return NextResponse.json({
      success: true,
      message: 'Settings updated successfully',
      settings,
    });
  } catch (error) {
    console.error('Settings update error:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}
