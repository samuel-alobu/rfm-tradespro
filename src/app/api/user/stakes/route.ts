import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { auth } from '@/lib/auth';
import { connectToDatabase } from '@/db/connection';
import { User, UserHolding, UserStake, StakeAsset, Transaction } from '@/db/models';

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

// GET - Fetch user's stakes and available tokens
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const userId = new mongoose.Types.ObjectId(session.user.id);

    // Fetch user holdings
    const holdings = await UserHolding.find({ userId }).lean();
    
    // Fetch user's stakes
    const stakes = await UserStake.find({ userId })
      .sort({ startDate: -1 })
      .lean();

    // Calculate stats
    const activeStakes = stakes.filter((s) => s.status === 'active');
    const completedStakes = stakes.filter((s) => s.status === 'completed');
    
    const totalStaked = stakes.reduce((acc, s) => acc + s.amountUsd, 0);
    const activeStakedUsd = activeStakes.reduce((acc, s) => acc + s.amountUsd, 0);
    const completedStakedUsd = completedStakes.reduce((acc, s) => acc + s.amountUsd, 0);
    const totalRewards = completedStakes.reduce((acc, s) => acc + (s.releasedAmount ? s.releasedAmount - s.amountUsd : 0), 0);

    // Map holdings to a simple format
    const holdingsMap: Record<string, number> = {};
    holdings.forEach((h) => {
      holdingsMap[h.symbol] = h.amount || 0;
    });

    return NextResponse.json({
      holdings: holdingsMap,
      stakes: stakes.map((s) => ({
        _id: s._id.toString(),
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
      })),
      stats: {
        totalStaked,
        activeStakedUsd,
        completedStakedUsd,
        totalRewards,
        activeCount: activeStakes.length,
        completedCount: completedStakes.length,
        totalCount: stakes.length,
      },
    });
  } catch (error) {
    console.error('Error fetching user stakes:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create a new stake
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const userId = new mongoose.Types.ObjectId(session.user.id);
    const body = await request.json();
    const { stakeAssetId, amount, cycleDays } = body;

    if (!stakeAssetId || !amount || amount <= 0 || !cycleDays) {
      return NextResponse.json({ error: 'Invalid stake parameters' }, { status: 400 });
    }

    // Fetch the stake asset
    const stakeAsset = await StakeAsset.findById(stakeAssetId);
    if (!stakeAsset || !stakeAsset.isActive) {
      return NextResponse.json({ error: 'Staking pool not found or inactive' }, { status: 404 });
    }

    // Validate amount
    if (amount < stakeAsset.minAmount) {
      return NextResponse.json({ error: `Minimum stake is ${stakeAsset.minAmount} ${stakeAsset.symbol}` }, { status: 400 });
    }
    if (amount > stakeAsset.maxAmount) {
      return NextResponse.json({ error: `Maximum stake is ${stakeAsset.maxAmount} ${stakeAsset.symbol}` }, { status: 400 });
    }

    // Find the cycle and get APY
    const selectedCycle = stakeAsset.cycles.find((c: any) => c.days === cycleDays && c.isActive);
    if (!selectedCycle) {
      return NextResponse.json({ error: 'Invalid staking cycle' }, { status: 400 });
    }

    // Check user has enough of the token
    const userHolding = await UserHolding.findOne({ userId, symbol: stakeAsset.symbol });
    if (!userHolding || userHolding.amount < amount) {
      return NextResponse.json({ error: `Insufficient ${stakeAsset.symbol} balance` }, { status: 400 });
    }

    // Calculate USD value and expected reward
    const price = TOKEN_PRICES[stakeAsset.symbol] || 1;
    const amountUsd = amount * price;
    // Expected reward for the cycle duration based on APY
    const expectedReward = (amount * selectedCycle.apy / 100) * (cycleDays / 365);

    // Calculate end date
    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + cycleDays * 24 * 60 * 60 * 1000);

    // Deduct from user holding
    userHolding.amount -= amount;
    userHolding.amountUsd = userHolding.amount * price;
    await userHolding.save();

    // Deduct from user's available balance
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    const balanceBefore = user.availableBalance || 0;
    user.availableBalance = Math.max(0, balanceBefore - amountUsd);
    await user.save();

    // Create the stake
    const stake = await UserStake.create({
      userId,
      stakeAssetId: stakeAsset._id,
      asset: {
        name: stakeAsset.name,
        symbol: stakeAsset.symbol,
        image: stakeAsset.image,
      },
      amount,
      amountUsd,
      cycleDays,
      apy: selectedCycle.apy,
      expectedReward,
      startDate,
      endDate,
      status: 'active',
    });

    // Update stake asset stats
    await StakeAsset.findByIdAndUpdate(stakeAssetId, {
      $inc: { totalStaked: amount, totalStakers: 1 },
    });

    // Create transaction
    await Transaction.create({
      userId,
      type: 'fee',
      amount: -amountUsd,
      balanceBefore,
      balanceAfter: user.availableBalance,
      status: 'completed',
      description: `Staked ${amount} ${stakeAsset.symbol} for ${cycleDays} days at ${selectedCycle.apy}% APY`,
    });

    // Add notification
    await User.findByIdAndUpdate(userId, {
      $push: {
        notifications: {
          $each: [{
            type: 'stake',
            title: 'Stake Created',
            message: `You have staked ${amount} ${stakeAsset.symbol} for ${cycleDays} days. Expected reward: ${expectedReward.toFixed(6)} ${stakeAsset.symbol}`,
            read: false,
            createdAt: new Date(),
          }],
          $position: 0,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Stake created successfully',
      stake: {
        _id: stake._id.toString(),
        asset: stake.asset,
        amount: stake.amount,
        cycleDays: stake.cycleDays,
        apy: stake.apy,
        expectedReward: stake.expectedReward,
        startDate: stake.startDate,
        endDate: stake.endDate,
        status: stake.status,
      },
    });
  } catch (error) {
    console.error('Error creating stake:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
