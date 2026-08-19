import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { auth } from '@/lib/auth';
import { connectToDatabase } from '@/db/connection';
import { TradingAccount, UserHolding, User } from '@/db/models';

// ============================================
// Trading Account API
// GET - Get trading account
// POST - Fund or withdraw from trading account
// ============================================

// GET - Get trading account balance and stats
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const userId = new mongoose.Types.ObjectId(session.user.id);

    // Find or create trading account
    let accountDoc = await TradingAccount.findOne({ userId });

    if (!accountDoc) {
      // Create new trading account
      accountDoc = await TradingAccount.create({ userId, balance: 0 });
    }

    const account = accountDoc.toObject();

    // Get user holdings for funding options
    const holdings = await UserHolding.find({ userId, amount: { $gt: 0 } })
      .select('symbol name icon amount amountUsd type')
      .lean();

    return NextResponse.json({
      account: {
        balance: account.balance,
        totalDeposited: account.totalDeposited,
        totalWithdrawn: account.totalWithdrawn,
        totalPnl: account.totalPnl,
        totalTrades: account.totalTrades,
        winningTrades: account.winningTrades,
        losingTrades: account.losingTrades,
        winRate: account.totalTrades > 0 
          ? ((account.winningTrades / account.totalTrades) * 100).toFixed(1) 
          : '0.0',
      },
      holdings: holdings.map((h: any) => ({
        id: h._id.toString(),
        symbol: h.symbol,
        name: h.name,
        icon: h.icon,
        amount: h.amount,
        amountUsd: h.amountUsd,
        type: h.type,
      })),
    });
  } catch (error) {
    console.error('Trading account error:', (error as Error).message);
    return NextResponse.json({ error: 'Failed to fetch trading account' }, { status: 500 });
  }
}

// POST - Fund or withdraw from trading account
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const body = await request.json();
    const { action, amount, token, tokenAmount } = body;

    if (!action || !['fund', 'withdraw'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action. Use "fund" or "withdraw"' }, { status: 400 });
    }

    const amountUsd = parseFloat(amount);
    if (isNaN(amountUsd) || amountUsd <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    if (amountUsd < 10) {
      return NextResponse.json({ error: 'Minimum amount is $10' }, { status: 400 });
    }

    const userId = new mongoose.Types.ObjectId(session.user.id);

    // Find or create trading account
    let account = await TradingAccount.findOne({ userId });
    if (!account) {
      account = await TradingAccount.create({ userId, balance: 0 });
    }

    if (action === 'fund') {
      // Validate token selection
      if (!token) {
        return NextResponse.json({ error: 'Token selection is required' }, { status: 400 });
      }

      // Find the user's holding for this token
      const holding = await UserHolding.findOne({ userId, symbol: token });
      if (!holding || holding.amountUsd < amountUsd) {
        return NextResponse.json({ 
          error: `Insufficient ${token} balance. Available: $${holding?.amountUsd?.toFixed(2) || '0.00'}` 
        }, { status: 400 });
      }

      // Calculate token amount to deduct
      const tokenAmountToDeduct = tokenAmount || (holding.amount * (amountUsd / holding.amountUsd));

      // Deduct from holding
      holding.amount -= tokenAmountToDeduct;
      holding.amountUsd -= amountUsd;
      
      // Remove holding if empty
      if (holding.amount <= 0 || holding.amountUsd <= 0) {
        await UserHolding.deleteOne({ _id: holding._id });
      } else {
        await holding.save();
      }

      // Add to trading account
      account.balance += amountUsd;
      account.totalDeposited += amountUsd;
      await account.save();

      // Add notification
      await User.findByIdAndUpdate(userId, {
        $push: {
          notifications: {
            $each: [{
              type: 'trading',
              title: 'Trading Account Funded',
              message: `Successfully funded $${amountUsd.toLocaleString()} from ${token} to your trading account.`,
              read: false,
              createdAt: new Date(),
            }],
            $position: 0,
          },
        },
      });

      return NextResponse.json({
        success: true,
        message: `Funded $${amountUsd.toLocaleString()} to trading account`,
        account: {
          balance: account.balance,
          totalDeposited: account.totalDeposited,
        },
      });

    } else if (action === 'withdraw') {
      // Check trading account balance
      if (account.balance < amountUsd) {
        return NextResponse.json({ 
          error: `Insufficient trading balance. Available: $${account.balance.toFixed(2)}` 
        }, { status: 400 });
      }

      // Validate token selection for withdrawal
      if (!token) {
        return NextResponse.json({ error: 'Token selection is required for withdrawal' }, { status: 400 });
      }

      // Deduct from trading account
      account.balance -= amountUsd;
      account.totalWithdrawn += amountUsd;
      await account.save();

      // Token info mapping
      const tokenInfo: Record<string, { name: string; icon: string }> = {
        BTC: { name: 'Bitcoin', icon: 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png' },
        ETH: { name: 'Ethereum', icon: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png' },
        USDT: { name: 'Tether', icon: 'https://assets.coingecko.com/coins/images/325/small/Tether.png' },
        USDC: { name: 'USD Coin', icon: 'https://assets.coingecko.com/coins/images/6319/small/usdc.png' },
        BNB: { name: 'BNB', icon: 'https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png' },
        SOL: { name: 'Solana', icon: 'https://assets.coingecko.com/coins/images/4128/small/solana.png' },
      };

      // Calculate token amount based on approximate price
      const prices: Record<string, number> = {
        BTC: 68000, ETH: 3500, USDT: 1, USDC: 1, BNB: 600, SOL: 150,
      };
      const tokenPrice = prices[token] || 1;
      const tokenAmountToAdd = amountUsd / tokenPrice;

      // Add to user holding
      const existingHolding = await UserHolding.findOne({ userId, symbol: token });
      if (existingHolding) {
        existingHolding.amount += tokenAmountToAdd;
        existingHolding.amountUsd += amountUsd;
        await existingHolding.save();
      } else {
        await UserHolding.create({
          userId,
          symbol: token,
          name: tokenInfo[token]?.name || token,
          type: 'crypto',
          icon: tokenInfo[token]?.icon || '',
          amount: tokenAmountToAdd,
          amountUsd: amountUsd,
          averagePrice: tokenPrice,
        });
      }

      // Add notification
      await User.findByIdAndUpdate(userId, {
        $push: {
          notifications: {
            $each: [{
              type: 'trading',
              title: 'Trading Withdrawal Complete',
              message: `Successfully withdrew $${amountUsd.toLocaleString()} as ${token} from your trading account.`,
              read: false,
              createdAt: new Date(),
            }],
            $position: 0,
          },
        },
      });

      return NextResponse.json({
        success: true,
        message: `Withdrew $${amountUsd.toLocaleString()} as ${token} from trading account`,
        account: {
          balance: account.balance,
          totalWithdrawn: account.totalWithdrawn,
        },
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Trading account action error:', (error as Error).message);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
