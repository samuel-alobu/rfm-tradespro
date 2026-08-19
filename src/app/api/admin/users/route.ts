import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectToDatabase } from '@/db/connection';
import { User, UserHolding } from '@/db/models';

// ============================================
// Admin Users API - GET all users with stats
// ============================================

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    // Verify admin role
    const adminUser = await User.findById(session.user.id);
    if (!adminUser || !['admin', 'super_admin'].includes(adminUser.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse query params
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'all';
    const role = searchParams.get('role') || 'all';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Build query
    const query: Record<string, unknown> = {};
    
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }
    
    if (status !== 'all') {
      query.status = status;
    }
    
    if (role !== 'all') {
      query.role = role;
    }

    // Get total count
    const totalUsers = await User.countDocuments(query);

    // Get users with pagination
    const users = await User.find(query)
      .select('-password -emailVerificationToken -passwordResetToken -twoFactorSecret -twoFactorCode -deleteAccountCode')
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    // Get holdings for each user
    const usersWithHoldings = await Promise.all(
      users.map(async (user) => {
        const holdings = await UserHolding.find({ userId: user._id }).lean();
        const totalHoldingsValue = holdings.reduce((sum, h) => sum + h.amountUsd, 0);
        
        return {
          ...user,
          holdings,
          totalHoldingsValue,
        };
      })
    );

    // Get stats
    const stats = await getStats();

    return NextResponse.json({
      success: true,
      users: usersWithHoldings,
      pagination: {
        page,
        limit,
        total: totalUsers,
        pages: Math.ceil(totalUsers / limit),
      },
      stats,
    });
  } catch (error) {
    console.error('Admin users fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

// Helper function to get dashboard stats
async function getStats() {
  const [
    totalUsers,
    activeUsers,
    pendingUsers,
    suspendedUsers,
    pendingKYC,
    verifiedKYC,
    totalAdmins,
    todayUsers,
  ] = await Promise.all([
    User.countDocuments({}),
    User.countDocuments({ status: 'active' }),
    User.countDocuments({ status: 'pending' }),
    User.countDocuments({ status: 'suspended' }),
    User.countDocuments({ verificationStatus: 'pending' }),
    User.countDocuments({ verificationStatus: 'verified' }),
    User.countDocuments({ role: { $in: ['admin', 'super_admin'] } }),
    User.countDocuments({
      createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
    }),
  ]);

  // Get total balances
  const balanceAggregation = await User.aggregate([
    {
      $group: {
        _id: null,
        totalBalance: { $sum: '$totalBalance' },
        totalDeposits: { $sum: '$totalDeposits' },
        totalWithdrawals: { $sum: '$totalWithdrawals' },
      },
    },
  ]);

  const totals = balanceAggregation[0] || {
    totalBalance: 0,
    totalDeposits: 0,
    totalWithdrawals: 0,
  };

  return {
    totalUsers,
    activeUsers,
    pendingUsers,
    suspendedUsers,
    pendingKYC,
    verifiedKYC,
    totalAdmins,
    todayUsers,
    totalBalance: totals.totalBalance,
    totalDeposits: totals.totalDeposits,
    totalWithdrawals: totals.totalWithdrawals,
  };
}
