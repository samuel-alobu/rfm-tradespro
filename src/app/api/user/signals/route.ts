import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { auth } from '@/lib/auth';
import { connectToDatabase } from '@/db/connection';
import { User, UserHolding, Signal, SignalPurchase, Transaction } from '@/db/models';

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

// GET - Fetch signal balance, holdings, and purchases
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const userId = new mongoose.Types.ObjectId(session.user.id);

    // Fetch user
    const user = await User.findById(userId).select('signalBalance availableBalance').lean();
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

    // Fetch signal purchases
    const purchases = await SignalPurchase.find({ userId })
      .sort({ purchasedAt: -1 })
      .lean();

    // Find active signal (most recent active, non-expired purchase)
    const now = new Date();
    const activeSignalPurchase = purchases.find(
      (p) => p.status === 'active' && (!p.expiresAt || new Date(p.expiresAt) > now)
    );

    // Calculate current signal strength from active purchase
    const currentSignalStrength = activeSignalPurchase?.signalStrength || 0;
    const activeSignalName = activeSignalPurchase?.signalName || null;

    return NextResponse.json({
      signalBalance: user.signalBalance || 0,
      availableBalance: user.availableBalance || 0,
      currentSignalStrength,
      activeSignalName,
      holdings: transformedHoldings,
      purchases: purchases.map((p) => ({
        _id: p._id.toString(),
        signalId: p.signalId.toString(),
        signalName: p.signalName,
        signalPrice: p.signalPrice,
        signalStrength: p.signalStrength || 0,
        amount: p.amount,
        status: p.status,
        purchasedAt: p.purchasedAt,
        expiresAt: p.expiresAt,
      })),
    });
  } catch (error) {
    console.error('Error fetching signal data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Deposit, withdraw, or purchase
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const userId = new mongoose.Types.ObjectId(session.user.id);
    const body = await request.json();
    const { action, symbol, amount, signalId } = body;

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
      const signalBalanceBefore = user.signalBalance || 0;

      // Add to signal balance and deduct from available balance
      user.signalBalance = signalBalanceBefore + amountUsd;
      user.availableBalance = Math.max(0, (user.availableBalance || 0) - amountUsd);
      await user.save();

      // Create transaction with required fields
      await Transaction.create({
        userId,
        type: 'signal',
        amount: amountUsd,
        balanceBefore: signalBalanceBefore,
        balanceAfter: user.signalBalance,
        status: 'completed',
        description: `Deposited ${amount.toFixed(6)} ${symbol} to signal balance`,
      });

      // Add notification
      await User.findByIdAndUpdate(userId, {
        $push: {
          notifications: {
            $each: [{
              type: 'signal',
              title: 'Signal Deposit',
              message: `Deposited ${amount.toFixed(6)} ${symbol} ($${amountUsd.toFixed(2)}) to your signal balance`,
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
        signalBalance: user.signalBalance,
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

      if ((user.signalBalance || 0) < amountUsd) {
        return NextResponse.json({ error: 'Insufficient signal balance' }, { status: 400 });
      }

      // Track balance before
      const signalBalanceBefore = user.signalBalance || 0;

      // Deduct from signal balance and add to available balance
      user.signalBalance = signalBalanceBefore - amountUsd;
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
        type: 'signal',
        amount: -amountUsd,
        balanceBefore: signalBalanceBefore,
        balanceAfter: user.signalBalance,
        status: 'completed',
        description: `Withdrew ${amount.toFixed(6)} ${symbol} from signal balance`,
      });

      // Add notification
      await User.findByIdAndUpdate(userId, {
        $push: {
          notifications: {
            $each: [{
              type: 'signal',
              title: 'Signal Withdrawal',
              message: `Withdrew ${amount.toFixed(6)} ${symbol} ($${amountUsd.toFixed(2)}) from your signal balance`,
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
        signalBalance: user.signalBalance,
        availableBalance: user.availableBalance,
      });
    }

    // =====================
    // PURCHASE Action
    // =====================
    if (action === 'purchase') {
      if (!signalId || !amount || amount <= 0) {
        return NextResponse.json({ error: 'Invalid purchase parameters' }, { status: 400 });
      }

      // Find signal
      const signal = await Signal.findById(signalId);
      if (!signal) {
        return NextResponse.json({ error: 'Signal not found' }, { status: 404 });
      }

      if (!signal.isActive) {
        return NextResponse.json({ error: 'Signal is not active' }, { status: 400 });
      }

      if (amount < signal.amount) {
        return NextResponse.json({ error: `Minimum amount is $${signal.amount}` }, { status: 400 });
      }

      if ((user.signalBalance || 0) < amount) {
        return NextResponse.json({ error: 'Insufficient signal balance' }, { status: 400 });
      }

      // Track balance before
      const signalBalanceBefore = user.signalBalance || 0;

      // Deduct from signal balance
      user.signalBalance = signalBalanceBefore - amount;
      await user.save();

      // Increment signal subscribers
      signal.subscribers = (signal.subscribers || 0) + 1;
      await signal.save();

      // Calculate expiration date
      const purchasedAt = new Date();
      const durationDays = signal.durationDays || 30;
      const expiresAt = new Date(purchasedAt.getTime() + durationDays * 24 * 60 * 60 * 1000);

      // Create signal purchase
      const purchase = await SignalPurchase.create({
        userId,
        signalId: signal._id,
        signalName: signal.title,
        signalPrice: signal.price,
        signalStrength: signal.strength,
        amount,
        status: 'active',
        purchasedAt,
        expiresAt,
      });

      // Create transaction with required fields
      await Transaction.create({
        userId,
        type: 'signal',
        amount: -amount,
        balanceBefore: signalBalanceBefore,
        balanceAfter: user.signalBalance,
        status: 'completed',
        description: `Purchased ${signal.title} signal`,
        relatedId: purchase._id,
        relatedModel: 'SignalPurchase',
      });

      // Add notification
      await User.findByIdAndUpdate(userId, {
        $push: {
          notifications: {
            $each: [{
              type: 'signal',
              title: 'Signal Purchased',
              message: `Successfully purchased ${signal.title} signal for $${amount.toFixed(2)}`,
              read: false,
              createdAt: new Date(),
            }],
            $position: 0,
          },
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Signal purchased successfully',
        purchase: {
          _id: purchase._id.toString(),
          signalId: purchase.signalId.toString(),
          signalName: purchase.signalName,
          signalPrice: purchase.signalPrice,
          signalStrength: purchase.signalStrength,
          amount: purchase.amount,
          status: purchase.status,
          purchasedAt: purchase.purchasedAt,
          expiresAt: purchase.expiresAt,
        },
        signalBalance: user.signalBalance,
        currentSignalStrength: signal.strength,
        activeSignalName: signal.title,
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error processing signal action:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
