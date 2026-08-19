import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { auth } from '@/lib/auth';
import { connectToDatabase } from '@/db/connection';
import { User, UserHolding, UserStake, Transaction } from '@/db/models';

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
  DOT: 7.23,
  MATIC: 0.58,
  LINK: 14.56,
  ATOM: 8.45,
};

// Check admin middleware
async function checkAdmin() {
  const session = await auth();
  if (!session?.user?.id) return null;
  
  await connectToDatabase();
  const user = await User.findById(session.user.id);
  if (!user || !['admin', 'super_admin'].includes(user.role)) return null;
  
  return user;
}

// GET - Fetch all stakes
export async function GET(request: NextRequest) {
  try {
    const admin = await checkAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const query: Record<string, unknown> = {};
    if (status && status !== 'all') query.status = status;

    const stakes = await UserStake.find(query)
      .populate('userId', 'firstName lastName email')
      .sort({ startDate: -1 })
      .lean();

    // Calculate stats
    const allStakes = await UserStake.find().lean();
    const stats = {
      total: allStakes.length,
      active: allStakes.filter((s) => s.status === 'active').length,
      completed: allStakes.filter((s) => s.status === 'completed').length,
      totalStakedUsd: allStakes.reduce((acc, s) => acc + s.amountUsd, 0),
      totalExpectedRewards: allStakes.filter((s) => s.status === 'active').reduce((acc, s) => acc + s.expectedReward * (TOKEN_PRICES[s.asset.symbol] || 1), 0),
      readyForRelease: allStakes.filter((s) => s.status === 'active' && new Date(s.endDate) <= new Date()).length,
    };

    return NextResponse.json({
      stakes: stakes.map((s: any) => ({
        _id: s._id.toString(),
        user: {
          _id: s.userId?._id?.toString() || '',
          name: s.userId ? `${s.userId.firstName} ${s.userId.lastName}` : 'Unknown',
          email: s.userId?.email || '',
        },
        asset: s.asset,
        amount: s.amount,
        amountUsd: s.amountUsd,
        cycleDays: s.cycleDays,
        apy: s.apy,
        expectedReward: s.expectedReward,
        startDate: s.startDate,
        endDate: s.endDate,
        status: s.status,
        earnedReward: s.earnedReward,
        releasedAmount: s.releasedAmount,
        releasedAt: s.releasedAt,
        releaseNote: s.releaseNote,
        isExpired: new Date(s.endDate) <= new Date(),
      })),
      stats,
    });
  } catch (error) {
    console.error('Error fetching stakes:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH - Release stake funds or update stake
export async function PATCH(request: NextRequest) {
  try {
    const admin = await checkAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { stakeId, action, releaseNote } = body;

    if (!stakeId) {
      return NextResponse.json({ error: 'Stake ID required' }, { status: 400 });
    }

    const stake = await UserStake.findById(stakeId);
    if (!stake) {
      return NextResponse.json({ error: 'Stake not found' }, { status: 404 });
    }

    // =====================
    // RELEASE Action
    // =====================
    if (action === 'release') {
      if (stake.status !== 'active') {
        return NextResponse.json({ error: 'Stake is not active' }, { status: 400 });
      }

      // Get the user
      const user = await User.findById(stake.userId);
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      // Calculate total to release (principal + expected reward)
      const totalTokenAmount = stake.amount + stake.expectedReward;
      const price = TOKEN_PRICES[stake.asset.symbol] || 1;
      const totalUsd = totalTokenAmount * price;

      // Add to user's holding
      await UserHolding.findOneAndUpdate(
        { userId: stake.userId, symbol: stake.asset.symbol },
        {
          $inc: { amount: totalTokenAmount, amountUsd: totalUsd },
          $setOnInsert: {
            name: stake.asset.name,
            type: 'crypto',
            icon: stake.asset.image,
          },
        },
        { upsert: true, new: true }
      );

      // Add to user's available balance
      const balanceBefore = user.availableBalance || 0;
      user.availableBalance = balanceBefore + totalUsd;
      await user.save();

      // Update stake
      stake.status = 'completed';
      stake.releasedAt = new Date();
      stake.releasedBy = admin._id;
      stake.releasedAmount = totalTokenAmount;
      stake.releaseNote = releaseNote || '';
      stake.earnedReward = stake.expectedReward;
      await stake.save();

      // Create transaction
      await Transaction.create({
        userId: stake.userId,
        type: 'bonus',
        amount: totalUsd,
        balanceBefore,
        balanceAfter: user.availableBalance,
        status: 'completed',
        description: `Stake completed: ${stake.amount} ${stake.asset.symbol} + ${stake.expectedReward.toFixed(6)} ${stake.asset.symbol} reward`,
      });

      // Add notification
      await User.findByIdAndUpdate(stake.userId, {
        $push: {
          notifications: {
            $each: [{
              type: 'stake',
              title: 'Stake Released',
              message: `Your ${stake.amount} ${stake.asset.symbol} stake has been completed! You received ${stake.expectedReward.toFixed(6)} ${stake.asset.symbol} as reward.`,
              read: false,
              createdAt: new Date(),
            }],
            $position: 0,
          },
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Stake released successfully',
        stake: {
          _id: stake._id.toString(),
          status: stake.status,
          releasedAmount: stake.releasedAmount,
          releasedAt: stake.releasedAt,
        },
        userNewBalance: user.availableBalance,
      });
    }

    // =====================
    // CANCEL Action
    // =====================
    if (action === 'cancel') {
      if (stake.status !== 'active') {
        return NextResponse.json({ error: 'Stake is not active' }, { status: 400 });
      }

      // Get the user
      const user = await User.findById(stake.userId);
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      // Return only principal (no reward)
      const price = TOKEN_PRICES[stake.asset.symbol] || 1;
      const totalUsd = stake.amount * price;

      // Add back to user's holding
      await UserHolding.findOneAndUpdate(
        { userId: stake.userId, symbol: stake.asset.symbol },
        {
          $inc: { amount: stake.amount, amountUsd: totalUsd },
        },
        { upsert: true, new: true }
      );

      // Add to user's available balance
      const balanceBefore = user.availableBalance || 0;
      user.availableBalance = balanceBefore + totalUsd;
      await user.save();

      // Update stake
      stake.status = 'cancelled';
      stake.releaseNote = releaseNote || 'Cancelled by admin';
      await stake.save();

      // Add notification
      await User.findByIdAndUpdate(stake.userId, {
        $push: {
          notifications: {
            $each: [{
              type: 'stake',
              title: 'Stake Cancelled',
              message: `Your ${stake.amount} ${stake.asset.symbol} stake has been cancelled. Principal returned to your balance.`,
              read: false,
              createdAt: new Date(),
            }],
            $position: 0,
          },
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Stake cancelled and principal returned',
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error updating stake:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
