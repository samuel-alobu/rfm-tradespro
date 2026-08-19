import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectToDatabase } from '@/db/connection';
import { SiteSettings, User, Withdrawal } from '@/db/models';

// ============================================
// Public Settings API - For transaction validation
// ============================================

// Default settings values
const defaultSettings = {
  requireKycForWithdrawal: true,
  autoLogoutEnabled: true,
  sessionTimeoutMinutes: 30,
  withdrawalMinimum: 10,
  withdrawalDailyLimitUnverified: 1000,
  withdrawalDailyLimitVerified: 100000,
  withdrawalMonthlyLimitUnverified: 5000,
  withdrawalMonthlyLimitVerified: 1000000,
  depositMinimum: 100,
  depositMaximum: 1000000,
};

export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    // Get user's verification status
    const user = await User.findById(session.user.id).select('verificationStatus').lean();
    const isVerified = user?.verificationStatus === 'verified';

    // Get site settings with defaults
    const settingsDoc = await SiteSettings.findOne().lean();
    const settings = {
      requireKycForWithdrawal: settingsDoc?.requireKycForWithdrawal ?? defaultSettings.requireKycForWithdrawal,
      autoLogoutEnabled: settingsDoc?.autoLogoutEnabled ?? defaultSettings.autoLogoutEnabled,
      sessionTimeoutMinutes: settingsDoc?.sessionTimeoutMinutes ?? defaultSettings.sessionTimeoutMinutes,
      withdrawalMinimum: settingsDoc?.withdrawalMinimum ?? defaultSettings.withdrawalMinimum,
      withdrawalDailyLimitUnverified: settingsDoc?.withdrawalDailyLimitUnverified ?? defaultSettings.withdrawalDailyLimitUnverified,
      withdrawalDailyLimitVerified: settingsDoc?.withdrawalDailyLimitVerified ?? defaultSettings.withdrawalDailyLimitVerified,
      withdrawalMonthlyLimitUnverified: settingsDoc?.withdrawalMonthlyLimitUnverified ?? defaultSettings.withdrawalMonthlyLimitUnverified,
      withdrawalMonthlyLimitVerified: settingsDoc?.withdrawalMonthlyLimitVerified ?? defaultSettings.withdrawalMonthlyLimitVerified,
      depositMinimum: settingsDoc?.depositMinimum ?? defaultSettings.depositMinimum,
      depositMaximum: settingsDoc?.depositMaximum ?? defaultSettings.depositMaximum,
    };

    // Calculate user's withdrawal usage for today and this month
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [dailyWithdrawals, monthlyWithdrawals] = await Promise.all([
      Withdrawal.aggregate([
        {
          $match: {
            userId: session.user.id,
            status: { $in: ['pending', 'approved', 'completed'] },
            createdAt: { $gte: startOfDay },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' },
          },
        },
      ]),
      Withdrawal.aggregate([
        {
          $match: {
            userId: session.user.id,
            status: { $in: ['pending', 'approved', 'completed'] },
            createdAt: { $gte: startOfMonth },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' },
          },
        },
      ]),
    ]);

    const dailyUsed = dailyWithdrawals[0]?.total || 0;
    const monthlyUsed = monthlyWithdrawals[0]?.total || 0;

    // Get limits based on verification status
    const dailyLimit = isVerified 
      ? settings.withdrawalDailyLimitVerified 
      : settings.withdrawalDailyLimitUnverified;
    const monthlyLimit = isVerified 
      ? settings.withdrawalMonthlyLimitVerified 
      : settings.withdrawalMonthlyLimitUnverified;

    return NextResponse.json({
      success: true,
      isVerified,
      requireKycForWithdrawal: settings.requireKycForWithdrawal,
      autoLogoutEnabled: settings.autoLogoutEnabled,
      sessionTimeoutMinutes: settings.sessionTimeoutMinutes,
      withdrawal: {
        minimumWithdrawal: settings.withdrawalMinimum,
        dailyLimit,
        monthlyLimit,
        dailyUsed,
        monthlyUsed,
        dailyRemaining: Math.max(0, dailyLimit - dailyUsed),
        monthlyRemaining: Math.max(0, monthlyLimit - monthlyUsed),
      },
      deposit: {
        minimum: settings.depositMinimum,
        maximum: settings.depositMaximum,
      },
    });
  } catch (error) {
    console.error('Settings check error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}
