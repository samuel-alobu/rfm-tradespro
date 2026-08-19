import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { auth } from '@/lib/auth';
import { connectToDatabase } from '@/db/connection';
import { User, Deposit, Withdrawal, UserHolding } from '@/db/models';

// Token icon mapping
const tokenIcons: Record<string, string> = {
  BTC: 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png',
  ETH: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png',
  USDT: 'https://assets.coingecko.com/coins/images/325/small/Tether.png',
  USDC: 'https://assets.coingecko.com/coins/images/6319/small/usdc.png',
  BNB: 'https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png',
  SOL: 'https://assets.coingecko.com/coins/images/4128/small/solana.png',
  XRP: 'https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png',
  DOGE: 'https://assets.coingecko.com/coins/images/5/small/dogecoin.png',
};

const tokenNames: Record<string, string> = {
  BTC: 'Bitcoin', ETH: 'Ethereum', USDT: 'Tether', USDC: 'USD Coin',
  BNB: 'BNB', SOL: 'Solana', XRP: 'XRP', DOGE: 'Dogecoin',
};

// GET - Fetch dashboard data (optimized - using UserHolding for real holdings)
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const userId = new mongoose.Types.ObjectId(session.user.id);
    
    // Single user query with field selection for speed
    const user = await User.findById(userId)
      .select('email firstName lastName avatar availableBalance totalBalance lockedBalance totalDeposits totalWithdrawals verificationStatus referralCode')
      .lean();
      
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Fetch real holdings from UserHolding model, deposits and withdrawals in parallel
    const [userHoldings, deposits, withdrawals] = await Promise.all([
      UserHolding.find({ userId, amount: { $gt: 0 } })
        .select('symbol name icon amount amountUsd')
        .sort({ amountUsd: -1 })
        .lean(),
      Deposit.find({ userId })
        .select('token amount amountUsd status createdAt reference network method')
        .sort({ createdAt: -1 })
        .limit(20)
        .lean(),
      Withdrawal.find({ userId })
        .select('method amount amountUsd status createdAt reference')
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
    ]);

    // Calculate from user record (no extra queries)
    const availableBalance = user.availableBalance || 0;
    const totalBalance = user.totalBalance || 0;
    const lockedBalance = user.lockedBalance || 0;

    // Transform real holdings from UserHolding model
    const holdings = userHoldings.map((h: any) => ({
      symbol: h.symbol,
      name: h.name || tokenNames[h.symbol] || h.symbol,
      icon: h.icon || tokenIcons[h.symbol] || tokenIcons.BTC,
      amount: h.amount,
      amountUsd: h.amountUsd,
    }));

    // Build activities list
    const activities: any[] = [];

    deposits.slice(0, 5).forEach((d: any) => {
      activities.push({
        id: d._id.toString(),
        type: 'deposit',
        title: d.status === 'approved' ? 'Deposit Approved' : 
               d.status === 'pending' ? 'Deposit Pending' : 'Deposit Declined',
        description: `${d.token || 'USDT'} via ${d.network || 'Network'}`,
        amount: d.amountUsd || d.amount,
        status: d.status,
        createdAt: d.createdAt,
        reference: d.reference,
      });
    });

    withdrawals.slice(0, 5).forEach((w: any) => {
      activities.push({
        id: w._id.toString(),
        type: 'withdrawal',
        title: w.status === 'approved' ? 'Withdrawal Approved' : 
               w.status === 'pending' ? 'Withdrawal Pending' : 'Withdrawal Declined',
        description: w.method || 'Crypto',
        amount: w.amountUsd || w.amount,
        status: w.status,
        createdAt: w.createdAt,
        reference: w.reference,
      });
    });

    activities.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Count pending (from already fetched data - no extra queries)
    const pendingDeposits = deposits.filter((d: any) => d.status === 'pending');
    const pendingWithdrawals = withdrawals.filter((w: any) => w.status === 'pending');
    const pendingDepositTotal = pendingDeposits.reduce((sum: number, d: any) => sum + (d.amountUsd || 0), 0);
    const pendingWithdrawalTotal = pendingWithdrawals.reduce((sum: number, w: any) => sum + (w.amountUsd || 0), 0);

    return NextResponse.json({
      balance: {
        available: availableBalance,
        total: totalBalance,
        locked: lockedBalance,
        invested: lockedBalance,
        pnl: 0,
        equity: availableBalance + lockedBalance,
      },
      holdings,
      recentActivities: activities.slice(0, 10),
      categories: {
        deposits: { total: user.totalDeposits || 0, pending: pendingDepositTotal, pendingCount: pendingDeposits.length },
        withdrawals: { total: user.totalWithdrawals || 0, pending: pendingWithdrawalTotal, pendingCount: pendingWithdrawals.length },
      },
      pending: {
        deposits: pendingDepositTotal,
        depositCount: pendingDeposits.length,
        withdrawals: pendingWithdrawalTotal,
        withdrawalCount: pendingWithdrawals.length,
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
    console.error('Dashboard error:', (error as Error).message);
    // Graceful degradation - return empty data instead of error
    return NextResponse.json({
      balance: { available: 0, total: 0, locked: 0, invested: 0, pnl: 0, equity: 0 },
      holdings: [],
      recentActivities: [],
      categories: { deposits: { total: 0, pending: 0, pendingCount: 0 }, withdrawals: { total: 0, pending: 0, pendingCount: 0 } },
      pending: { deposits: 0, depositCount: 0, withdrawals: 0, withdrawalCount: 0 },
      user: null,
    });
  }
}
