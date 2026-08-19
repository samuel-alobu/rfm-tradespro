import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { auth } from '@/lib/auth';
import { connectToDatabase } from '@/db/connection';
import { User, TradingAccount } from '@/db/models';

// GET - Fetch user balance (optimized - single query)
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const userId = new mongoose.Types.ObjectId(session.user.id);
    
    // Fetch user and trading account data in parallel
    const [user, tradingAccount] = await Promise.all([
      User.findById(userId)
        .select('email firstName lastName avatar verificationStatus referralCode availableBalance totalBalance lockedBalance totalDeposits totalWithdrawals totalProfit accountLevel')
        .lean(),
      TradingAccount.findOne({ userId })
        .select('totalTrades totalPnl')
        .lean(),
    ]);
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const availableBalance = user.availableBalance || 0;
    const totalBalance = user.totalBalance || 0;
    const lockedBalance = user.lockedBalance || 0;
    const totalProfit = user.totalProfit || (tradingAccount?.totalPnl || 0);
    const totalTrades = tradingAccount?.totalTrades || 0;

    // Account level percentages
    const levelPercentages: Record<string, string> = {
      starter: '1%',
      bronze: '2%',
      silver: '3%',
      gold: '5%',
      vip: '10%',
    };

    return NextResponse.json({
      balance: {
        available: availableBalance,
        total: totalBalance,
        locked: lockedBalance,
        invested: lockedBalance,
        pnl: totalProfit,
        equity: availableBalance + lockedBalance + totalProfit,
      },
      pending: {
        deposits: 0,
        depositCount: 0,
        withdrawals: 0,
        withdrawalCount: 0,
      },
      positions: {
        subscriptions: 0,
        copyTrades: 0,
        trades: totalTrades,
      },
      accountSummary: {
        totalDeposits: user.totalDeposits || 0,
        totalWithdrawals: user.totalWithdrawals || 0,
        totalProfits: totalProfit,
        totalTrades: totalTrades,
        accountLevel: user.accountLevel || 'starter',
        accountPercentage: levelPercentages[user.accountLevel || 'starter'] || '1%',
      },
      user: {
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
        verificationStatus: user.verificationStatus,
        referralCode: user.referralCode,
      },
    });
  } catch (error) {
    console.error('Balance error:', (error as Error).message);
    // Graceful degradation
    return NextResponse.json({
      balance: { available: 0, total: 0, locked: 0, invested: 0, pnl: 0, equity: 0 },
      pending: { deposits: 0, depositCount: 0, withdrawals: 0, withdrawalCount: 0 },
      positions: { subscriptions: 0, copyTrades: 0, trades: 0 },
      accountSummary: { totalDeposits: 0, totalWithdrawals: 0, totalProfits: 0, totalTrades: 0, accountLevel: 'starter', accountPercentage: '1%' },
      user: null,
    });
  }
}
