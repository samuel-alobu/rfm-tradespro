import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { auth } from '@/lib/auth';
import { connectToDatabase } from '@/db/connection';
import { User, UserHolding, RealEstateInvestment, Transaction } from '@/db/models';

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

// GET - Fetch real estate balance, holdings, and investments
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const userId = new mongoose.Types.ObjectId(session.user.id);

    // Fetch user
    const user = await User.findById(userId).select('realEstateBalance availableBalance').lean();
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Fetch holdings with balance > 0
    const holdings = await UserHolding.find({
      userId,
      amount: { $gt: 0 },
    }).lean();

    // Transform holdings
    const transformedHoldings = holdings.map((h) => {
      const price = TOKEN_PRICES[h.symbol] || 1;
      return {
        _id: h._id.toString(),
        symbol: h.symbol,
        name: h.name || h.symbol,
        amount: h.amount,
        amountUsd: h.amount * price,
        price,
      };
    });

    // Fetch real estate investments
    const investments = await RealEstateInvestment.find({ userId })
      .sort({ investedAt: -1 })
      .lean();

    // Calculate portfolio value (only active investments)
    const activeInvestments = investments.filter((inv) => inv.status === 'active');
    const portfolioValue = activeInvestments.reduce((acc, inv) => acc + inv.amount, 0);

    return NextResponse.json({
      realEstateBalance: user.realEstateBalance || 0,
      availableBalance: user.availableBalance || 0,
      portfolioValue,
      holdings: transformedHoldings,
      investments: investments.map((inv) => ({
        _id: inv._id.toString(),
        propertyId: inv.propertyId.toString(),
        propertyName: inv.property?.name || 'Property',
        propertyImage: inv.property?.image || '',
        propertyLocation: inv.property?.location || '',
        amount: inv.amount,
        projectedReturn: inv.expectedReturn || 0,
        roi: inv.property?.roi || 0,
        durationDays: inv.durationDays || 365,
        status: inv.status,
        investedAt: inv.investedAt,
        expiresAt: inv.expiresAt,
        releasedAt: inv.releasedAt,
        releasedAmount: inv.releasedAmount,
      })),
    });
  } catch (error) {
    console.error('Error fetching real estate data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Deposit or withdraw
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
    // DEPOSIT Action
    // =====================
    if (action === 'deposit') {
      if (!symbol || !amount || amount <= 0) {
        return NextResponse.json({ error: 'Invalid deposit parameters' }, { status: 400 });
      }

      // Find user holding
      const holding = await UserHolding.findOne({ userId, symbol });
      if (!holding || holding.amount < amount) {
        return NextResponse.json({ error: 'Insufficient holding balance' }, { status: 400 });
      }

      const price = TOKEN_PRICES[symbol] || 1;
      const amountUsd = amount * price;

      // Deduct from holding
      holding.amount -= amount;
      holding.amountUsd = holding.amount * price;
      if (holding.amount <= 0) {
        await UserHolding.deleteOne({ _id: holding._id });
      } else {
        await holding.save();
      }

      // Track balances for transaction
      const realEstateBalanceBefore = user.realEstateBalance || 0;

      // Add to real estate balance and deduct from available balance
      user.realEstateBalance = realEstateBalanceBefore + amountUsd;
      user.availableBalance = Math.max(0, (user.availableBalance || 0) - amountUsd);
      await user.save();

      // Create transaction with required fields
      await Transaction.create({
        userId,
        type: 'fee', // Using 'fee' as a placeholder since 'real_estate' isn't in the enum
        amount: amountUsd,
        balanceBefore: realEstateBalanceBefore,
        balanceAfter: user.realEstateBalance,
        status: 'completed',
        description: `Deposited ${amount.toFixed(6)} ${symbol} to real estate balance`,
      });

      // Add notification
      await User.findByIdAndUpdate(userId, {
        $push: {
          notifications: {
            $each: [{
              type: 'deposit',
              title: 'Real Estate Deposit',
              message: `Deposited ${amount.toFixed(6)} ${symbol} ($${amountUsd.toFixed(2)}) to your real estate balance`,
              read: false,
              createdAt: new Date(),
            }],
            $position: 0,
          },
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Deposit successful',
        realEstateBalance: user.realEstateBalance,
        availableBalance: user.availableBalance,
      });
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

      if ((user.realEstateBalance || 0) < amountUsd) {
        return NextResponse.json({ error: 'Insufficient real estate balance' }, { status: 400 });
      }

      // Track balance before
      const realEstateBalanceBefore = user.realEstateBalance || 0;

      // Deduct from real estate balance and add to available balance
      user.realEstateBalance = realEstateBalanceBefore - amountUsd;
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
        type: 'fee',
        amount: -amountUsd,
        balanceBefore: realEstateBalanceBefore,
        balanceAfter: user.realEstateBalance,
        status: 'completed',
        description: `Withdrew ${amount.toFixed(6)} ${symbol} from real estate balance`,
      });

      // Add notification
      await User.findByIdAndUpdate(userId, {
        $push: {
          notifications: {
            $each: [{
              type: 'withdrawal',
              title: 'Real Estate Withdrawal',
              message: `Withdrew ${amount.toFixed(6)} ${symbol} ($${amountUsd.toFixed(2)}) from your real estate balance`,
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
        realEstateBalance: user.realEstateBalance,
        availableBalance: user.availableBalance,
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error processing real estate action:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
