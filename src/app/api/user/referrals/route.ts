import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { auth } from '@/lib/auth';
import { connectToDatabase } from '@/db/connection';
import { User, Referral, UserHolding, Transaction } from '@/db/models';

// Token prices for USD conversion
const TOKEN_PRICES: Record<string, number> = {
  BTC: 67234.50,
  ETH: 3456.78,
  USDT: 1.00,
  USDC: 1.00,
  BNB: 605.23,
  SOL: 178.45,
  XRP: 0.62,
  DOGE: 0.12,
  ADA: 0.45,
  AVAX: 35.67,
};

// Reward tiers based on total referrals
const REWARD_TIERS = [
  { minReferrals: 1, reward: 50, tier: 'Bronze' },
  { minReferrals: 5, reward: 75, tier: 'Silver' },
  { minReferrals: 10, reward: 100, tier: 'Gold' },
  { minReferrals: 25, reward: 150, tier: 'Platinum' },
  { minReferrals: 50, reward: 250, tier: 'Diamond' },
];

function getCurrentTier(totalReferrals: number) {
  let currentTier = REWARD_TIERS[0];
  for (const tier of REWARD_TIERS) {
    if (totalReferrals >= tier.minReferrals) {
      currentTier = tier;
    }
  }
  return currentTier;
}

// GET - Fetch referral data
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const userId = new mongoose.Types.ObjectId(session.user.id);

    // Fetch user
    const user = await User.findById(userId)
      .select('referralCode referralBalance availableBalance')
      .lean();
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Fetch all referrals by this user
    const referrals = await Referral.find({ referrerId: userId })
      .sort({ createdAt: -1 })
      .lean();

    // Calculate stats
    const totalReferrals = referrals.length;
    const pendingReferrals = referrals.filter((r) => r.status === 'pending').length;
    const activeReferrals = referrals.filter((r) => r.status === 'active').length;
    const completedReferrals = referrals.filter((r) => r.status === 'completed').length;
    const totalEarned = referrals
      .filter((r) => r.status === 'active' || r.status === 'completed')
      .reduce((acc, r) => acc + r.rewardAmount, 0);
    const pendingEarnings = referrals
      .filter((r) => r.status === 'pending')
      .reduce((acc, r) => acc + r.rewardAmount, 0);

    // Get current tier
    const currentTier = getCurrentTier(totalReferrals);

    return NextResponse.json({
      referralCode: user.referralCode,
      referralBalance: user.referralBalance || 0,
      availableBalance: user.availableBalance || 0,
      stats: {
        totalReferrals,
        pendingReferrals,
        activeReferrals,
        completedReferrals,
        totalEarned,
        pendingEarnings,
        currentTier: currentTier.tier,
        currentReward: currentTier.reward,
      },
      referrals: referrals.map((r) => ({
        _id: r._id.toString(),
        referredUser: {
          firstName: r.referredUser.firstName,
          lastName: r.referredUser.lastName,
          email: maskEmail(r.referredUser.email),
          initials: `${r.referredUser.firstName[0]}${r.referredUser.lastName[0]}`,
        },
        rewardAmount: r.rewardAmount,
        tier: r.tier,
        status: r.status,
        createdAt: r.createdAt,
        approvedAt: r.approvedAt,
      })),
      tiers: REWARD_TIERS,
    });
  } catch (error) {
    console.error('Error fetching referrals:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helper to mask email
function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (local.length <= 2) return email;
  return `${local[0]}***${local[local.length - 1]}@${domain}`;
}

// POST - Withdraw from referral balance to holdings
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const userId = new mongoose.Types.ObjectId(session.user.id);
    const body = await request.json();
    const { action, symbol, amount } = body;

    // Fetch user
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // =====================
    // WITHDRAW Action
    // =====================
    if (action === 'withdraw') {
      if (!symbol || !amount || amount <= 0) {
        return NextResponse.json({ error: 'Invalid withdraw parameters' }, { status: 400 });
      }

      const price = TOKEN_PRICES[symbol] || 1;
      const amountUsd = amount * price;

      if ((user.referralBalance || 0) < amountUsd) {
        return NextResponse.json({ error: 'Insufficient referral balance' }, { status: 400 });
      }

      // Track balance before
      const referralBalanceBefore = user.referralBalance || 0;

      // Deduct from referral balance and add to available balance
      user.referralBalance = referralBalanceBefore - amountUsd;
      user.availableBalance = (user.availableBalance || 0) + amountUsd;
      await user.save();

      // Find or create user holding using upsert
      await UserHolding.findOneAndUpdate(
        { userId, symbol },
        {
          $inc: { amount: amount, amountUsd: amountUsd },
          $setOnInsert: {
            name: symbol,
            type: 'crypto',
            icon: `/icons/${symbol.toLowerCase()}.svg`,
          },
        },
        { upsert: true, new: true }
      );

      // Create transaction with required fields
      await Transaction.create({
        userId,
        type: 'referral',
        amount: -amountUsd,
        balanceBefore: referralBalanceBefore,
        balanceAfter: user.referralBalance,
        status: 'completed',
        description: `Withdrew ${amount.toFixed(6)} ${symbol} from referral balance`,
      });

      // Add notification
      await User.findByIdAndUpdate(userId, {
        $push: {
          notifications: {
            $each: [{
              type: 'withdrawal',
              title: 'Referral Withdrawal',
              message: `Withdrew ${amount.toFixed(6)} ${symbol} ($${amountUsd.toFixed(2)}) from your referral balance`,
              read: false,
              createdAt: new Date(),
            }],
            $position: 0,
          },
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Withdrawal successful',
        referralBalance: user.referralBalance,
        availableBalance: user.availableBalance,
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error processing referral action:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
