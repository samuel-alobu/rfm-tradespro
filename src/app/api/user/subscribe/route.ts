import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { auth } from '@/lib/auth';
import { connectToDatabase } from '@/db/connection';
import { User, UserHolding, Transaction } from '@/db/models';

// Token prices for conversion
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
  LTC: 84.56,
  ATOM: 8.45,
  UNI: 9.87,
};

// GET - Get subscribe balance and user holdings for deposit
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const userId = new mongoose.Types.ObjectId(session.user.id);

    // Get user with subscribe balance
    const user = await User.findById(userId).select('subscribeBalance availableBalance').lean();
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get user holdings with balance > 0
    const holdings = await UserHolding.find({ 
      userId, 
      amountUsd: { $gt: 0 } 
    }).lean();

    return NextResponse.json({
      subscribeBalance: user.subscribeBalance || 0,
      availableBalance: user.availableBalance || 0,
      holdings: holdings.map(h => ({
        _id: h._id,
        symbol: h.symbol,
        name: h.name,
        icon: h.icon,
        amount: h.amount,
        amountUsd: h.amountUsd,
        price: TOKEN_PRICES[h.symbol] || 1,
      })),
    });
  } catch (error) {
    console.error('Error fetching subscribe data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Deposit to subscribe balance or Withdraw from subscribe balance
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const body = await request.json();
    const { action, symbol, amount } = body;

    if (!action || !['deposit', 'withdraw'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    if (!symbol || !amount || amount <= 0) {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
    }

    const userId = new mongoose.Types.ObjectId(session.user.id);
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const tokenPrice = TOKEN_PRICES[symbol] || 1;
    const amountUsd = amount * tokenPrice;

    if (action === 'deposit') {
      // DEPOSIT: From holdings to subscribe balance
      const holding = await UserHolding.findOne({ userId, symbol });
      if (!holding || holding.amount < amount) {
        return NextResponse.json({ error: 'Insufficient token balance' }, { status: 400 });
      }

      // Deduct from holding
      holding.amount -= amount;
      holding.amountUsd -= amountUsd;
      if (holding.amount <= 0) {
        await UserHolding.deleteOne({ _id: holding._id });
      } else {
        await holding.save();
      }

      // Add to subscribe balance
      const balanceBefore = user.subscribeBalance || 0;
      user.subscribeBalance = balanceBefore + amountUsd;
      
      // Also deduct from available balance for consistency
      user.availableBalance = Math.max(0, (user.availableBalance || 0) - amountUsd);
      await user.save();

      // Create transaction record
      await Transaction.create({
        userId,
        type: 'subscription',
        amount: amountUsd,
        balanceBefore,
        balanceAfter: user.subscribeBalance,
        status: 'completed',
        description: `Deposited ${amount} ${symbol} to subscribe balance`,
      });

      // Add notification
      await User.findByIdAndUpdate(userId, {
        $push: {
          notifications: {
            $each: [{
              type: 'deposit',
              title: 'Subscribe Deposit',
              message: `Successfully deposited ${amount} ${symbol} ($${amountUsd.toLocaleString()}) to your subscribe balance.`,
              read: false,
              createdAt: new Date(),
            }],
            $position: 0,
          },
        },
      });

      return NextResponse.json({
        success: true,
        message: `Deposited ${amount} ${symbol} to subscribe balance`,
        subscribeBalance: user.subscribeBalance,
        amountUsd,
      });

    } else {
      // WITHDRAW: From subscribe balance to holdings
      if ((user.subscribeBalance || 0) < amountUsd) {
        return NextResponse.json({ error: 'Insufficient subscribe balance' }, { status: 400 });
      }

      // Deduct from subscribe balance
      const balanceBefore = user.subscribeBalance || 0;
      user.subscribeBalance = balanceBefore - amountUsd;
      
      // Add to available balance
      user.availableBalance = (user.availableBalance || 0) + amountUsd;
      await user.save();

      // Add to holdings (upsert)
      await UserHolding.findOneAndUpdate(
        { userId, symbol },
        {
          $inc: { amount: amount, amountUsd: amountUsd },
          $setOnInsert: {
            name: symbol,
            type: 'crypto',
            icon: `/icons/${symbol.toLowerCase()}.svg`,
            averagePrice: tokenPrice,
          },
        },
        { upsert: true, new: true }
      );

      // Create transaction record
      await Transaction.create({
        userId,
        type: 'subscription',
        amount: -amountUsd,
        balanceBefore,
        balanceAfter: user.subscribeBalance,
        status: 'completed',
        description: `Withdrew ${amount} ${symbol} from subscribe balance`,
      });

      // Add notification
      await User.findByIdAndUpdate(userId, {
        $push: {
          notifications: {
            $each: [{
              type: 'withdrawal',
              title: 'Subscribe Withdrawal',
              message: `Successfully withdrew ${amount} ${symbol} ($${amountUsd.toLocaleString()}) from your subscribe balance.`,
              read: false,
              createdAt: new Date(),
            }],
            $position: 0,
          },
        },
      });

      return NextResponse.json({
        success: true,
        message: `Withdrew ${amount} ${symbol} from subscribe balance`,
        subscribeBalance: user.subscribeBalance,
        amountUsd,
      });
    }
  } catch (error) {
    console.error('Error processing subscribe transaction:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
