import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { auth } from '@/lib/auth';
import { connectToDatabase } from '@/db/connection';
import { User, Deposit, Withdrawal, Transaction } from '@/db/models';

// ============================================
// Admin Dashboard Stats API
// ============================================

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    // Check admin role
    const adminUserId = new mongoose.Types.ObjectId(session.user.id);
    const admin = await User.findById(adminUserId);
    if (!admin || !['admin', 'superadmin', 'super_admin'].includes(admin.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get date ranges
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - 7);

    // Parallel fetch for performance
    const [
      totalUsers,
      usersThisMonth,
      usersLastMonth,
      activeUsers,
      verifiedUsers,
      pendingKycUsers,
      totalDeposits,
      depositsThisMonth,
      depositsLastMonth,
      pendingDeposits,
      totalWithdrawals,
      withdrawalsThisMonth,
      withdrawalsLastMonth,
      pendingWithdrawals,
      recentUsers,
      recentTransactions,
      topHolders,
    ] = await Promise.all([
      // User stats
      User.countDocuments({ role: 'user' }),
      User.countDocuments({ role: 'user', createdAt: { $gte: startOfMonth } }),
      User.countDocuments({ role: 'user', createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } }),
      User.countDocuments({ role: 'user', lastLogin: { $gte: startOfWeek } }),
      User.countDocuments({ role: 'user', verificationStatus: 'verified' }),
      User.countDocuments({ role: 'user', verificationStatus: 'pending' }),
      
      // Deposit stats
      Deposit.aggregate([
        { $match: { status: 'approved' } },
        { $group: { _id: null, total: { $sum: '$amountUsd' } } }
      ]),
      Deposit.aggregate([
        { $match: { status: 'approved', createdAt: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: '$amountUsd' } } }
      ]),
      Deposit.aggregate([
        { $match: { status: 'approved', createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } } },
        { $group: { _id: null, total: { $sum: '$amountUsd' } } }
      ]),
      Deposit.countDocuments({ status: 'pending' }),
      
      // Withdrawal stats
      Withdrawal.aggregate([
        { $match: { status: 'approved' } },
        { $group: { _id: null, total: { $sum: '$amountUsd' } } }
      ]),
      Withdrawal.aggregate([
        { $match: { status: 'approved', createdAt: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: '$amountUsd' } } }
      ]),
      Withdrawal.aggregate([
        { $match: { status: 'approved', createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } } },
        { $group: { _id: null, total: { $sum: '$amountUsd' } } }
      ]),
      Withdrawal.countDocuments({ status: 'pending' }),
      
      // Recent users (last 5)
      User.find({ role: 'user' })
        .select('firstName lastName email avatar verificationStatus availableBalance createdAt')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
      
      // Recent pending transactions (deposits + withdrawals)
      Promise.all([
        Deposit.find({ status: 'pending' })
          .populate('userId', 'firstName lastName email')
          .sort({ createdAt: -1 })
          .limit(5)
          .lean(),
        Withdrawal.find({ status: 'pending' })
          .populate('userId', 'firstName lastName email')
          .sort({ createdAt: -1 })
          .limit(5)
          .lean(),
      ]),
      
      // Top balance holders
      User.find({ role: 'user', availableBalance: { $gt: 0 } })
        .select('firstName lastName email avatar availableBalance')
        .sort({ availableBalance: -1 })
        .limit(5)
        .lean(),
    ]);

    // Calculate percentage changes
    const depositsThisMonthTotal = depositsThisMonth[0]?.total || 0;
    const depositsLastMonthTotal = depositsLastMonth[0]?.total || 0;
    const depositChange = depositsLastMonthTotal > 0 
      ? ((depositsThisMonthTotal - depositsLastMonthTotal) / depositsLastMonthTotal * 100).toFixed(1)
      : depositsThisMonthTotal > 0 ? 100 : 0;

    const withdrawalsThisMonthTotal = withdrawalsThisMonth[0]?.total || 0;
    const withdrawalsLastMonthTotal = withdrawalsLastMonth[0]?.total || 0;
    const withdrawalChange = withdrawalsLastMonthTotal > 0 
      ? ((withdrawalsThisMonthTotal - withdrawalsLastMonthTotal) / withdrawalsLastMonthTotal * 100).toFixed(1)
      : withdrawalsThisMonthTotal > 0 ? 100 : 0;

    const userChange = usersLastMonth > 0 
      ? ((usersThisMonth - usersLastMonth) / usersLastMonth * 100).toFixed(1)
      : usersThisMonth > 0 ? 100 : 0;

    // Format recent transactions
    const [pendingDepositsData, pendingWithdrawalsData] = recentTransactions;
    
    const formattedPendingActions = [
      ...pendingDepositsData.map((d: any) => ({
        id: d._id.toString(),
        type: 'deposit',
        user: d.userId ? `${d.userId.firstName || ''} ${d.userId.lastName || ''}`.trim() || 'Unknown' : 'Unknown',
        userEmail: d.userId?.email || '',
        amount: d.amountUsd || d.amount,
        token: d.token,
        reference: d.reference,
        time: d.createdAt,
      })),
      ...pendingWithdrawalsData.map((w: any) => ({
        id: w._id.toString(),
        type: 'withdrawal',
        user: w.userId ? `${w.userId.firstName || ''} ${w.userId.lastName || ''}`.trim() || 'Unknown' : 'Unknown',
        userEmail: w.userId?.email || '',
        amount: w.amountUsd || w.amount,
        token: w.token,
        reference: w.reference,
        time: w.createdAt,
      })),
    ]
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .slice(0, 8);

    // Format recent users
    const formattedRecentUsers = recentUsers.map((u: any) => ({
      id: u._id.toString(),
      name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'Unknown',
      email: u.email,
      avatar: u.avatar,
      status: u.verificationStatus === 'verified' ? 'verified' : u.verificationStatus === 'pending' ? 'pending' : 'unverified',
      balance: u.availableBalance || 0,
      joinedAt: u.createdAt,
    }));

    // Format top holders
    const formattedTopHolders = topHolders.map((u: any) => ({
      id: u._id.toString(),
      name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'Unknown',
      email: u.email,
      avatar: u.avatar,
      balance: u.availableBalance || 0,
    }));

    // Calculate net volume
    const totalDepositsAmount = totalDeposits[0]?.total || 0;
    const totalWithdrawalsAmount = totalWithdrawals[0]?.total || 0;
    const netVolume = totalDepositsAmount - totalWithdrawalsAmount;

    return NextResponse.json({
      success: true,
      stats: {
        totalUsers,
        usersThisMonth,
        userChange: parseFloat(userChange as string),
        activeUsers,
        verifiedUsers,
        
        totalDeposits: totalDepositsAmount,
        depositsThisMonth: depositsThisMonthTotal,
        depositChange: parseFloat(depositChange as string),
        pendingDeposits,
        
        totalWithdrawals: totalWithdrawalsAmount,
        withdrawalsThisMonth: withdrawalsThisMonthTotal,
        withdrawalChange: parseFloat(withdrawalChange as string),
        pendingWithdrawals,
        
        pendingKyc: pendingKycUsers,
        netVolume,
      },
      recentUsers: formattedRecentUsers,
      pendingActions: formattedPendingActions,
      topHolders: formattedTopHolders,
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
