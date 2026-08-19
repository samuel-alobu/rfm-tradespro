import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { auth } from '@/lib/auth';
import { connectToDatabase } from '@/db/connection';
import { CopyTrade, User, Trader, UserHolding, Transaction } from '@/db/models';

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

// GET - Fetch user's copy trades
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const userId = new mongoose.Types.ObjectId(session.user.id);

    const copyTrades = await CopyTrade.find({ userId })
      .populate('traderId', 'name username avatar tradingStyle winRate totalReturn')
      .sort({ createdAt: -1 })
      .lean();

    // Separate active and history
    const active = copyTrades.filter((c: any) => c.status === 'active' || c.status === 'paused');
    const history = copyTrades.filter((c: any) => c.status === 'stopped' || c.status === 'liquidated');

    // Calculate stats
    const stats = {
      totalActive: active.length,
      totalInvested: active.reduce((acc: number, c: any) => acc + c.amount, 0),
      totalPnL: active.reduce((acc: number, c: any) => acc + (c.profitLoss || 0), 0),
      totalClosed: history.length,
    };

    return NextResponse.json({
      copyTrades,
      active,
      history,
      stats,
    });
  } catch (error) {
    console.error('Error fetching copy trades:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Stop copying a trader (with token selection for withdrawal)
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const copyTradeId = searchParams.get('id');
    const withdrawToken = searchParams.get('withdrawToken'); // Token to receive funds in

    if (!copyTradeId) {
      return NextResponse.json({ error: 'Copy trade ID required' }, { status: 400 });
    }

    const userId = new mongoose.Types.ObjectId(session.user.id);

    // Find copy trade
    const copyTrade = await CopyTrade.findOne({ _id: copyTradeId, userId });
    if (!copyTrade) {
      return NextResponse.json({ error: 'Copy trade not found' }, { status: 404 });
    }

    if (copyTrade.status === 'stopped' || copyTrade.status === 'liquidated') {
      return NextResponse.json({ error: 'Copy trade already closed' }, { status: 400 });
    }

    // Get user
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Calculate profit share and final return
    const grossProfitLoss = copyTrade.profitLoss || 0;
    const profitSharePercent = copyTrade.trader?.profitShare || 10;
    
    // Only take profit share if there's profit (not on losses)
    let traderShare = 0;
    let netProfitLoss = grossProfitLoss;
    
    if (grossProfitLoss > 0) {
      traderShare = (grossProfitLoss * profitSharePercent) / 100;
      netProfitLoss = grossProfitLoss - traderShare;
    }
    
    // Final return: original amount + net profit (after trader's share)
    const returnAmount = copyTrade.amount + netProfitLoss;
    
    // Use withdrawToken if provided, otherwise fallback to original paymentToken
    const targetToken = withdrawToken || copyTrade.paymentToken || 'USDT';
    const tokenPrice = TOKEN_PRICES[targetToken] || 1;
    const tokenAmount = returnAmount / tokenPrice;

    // Return funds to UserHolding for the selected token
    let holding = await UserHolding.findOne({ userId, symbol: targetToken });
    
    if (holding) {
      // Recalculate average price
      const totalValue = holding.amountUsd + returnAmount;
      const totalAmount = holding.amount + tokenAmount;
      holding.averagePrice = totalValue / totalAmount;
      holding.amountUsd += returnAmount;
      holding.amount += tokenAmount;
      await holding.save();
    } else {
      // Create new holding for the selected token
      const tokenIcons: Record<string, string> = {
        BTC: 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png',
        ETH: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png',
        USDT: 'https://assets.coingecko.com/coins/images/325/small/Tether.png',
        USDC: 'https://assets.coingecko.com/coins/images/6319/small/usdc.png',
        BNB: 'https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png',
        SOL: 'https://assets.coingecko.com/coins/images/4128/small/solana.png',
      };
      
      await UserHolding.create({
        userId,
        symbol: targetToken,
        name: targetToken,
        type: 'crypto',
        icon: tokenIcons[targetToken] || `https://assets.coingecko.com/coins/images/325/small/Tether.png`,
        amount: tokenAmount,
        amountUsd: returnAmount,
        averagePrice: tokenPrice,
      });
    }

    // Also update user's availableBalance
    const balanceBefore = user.availableBalance || 0;
    user.availableBalance = balanceBefore + returnAmount;
    user.lockedBalance = Math.max(0, (user.lockedBalance || 0) - copyTrade.amount);
    await user.save();

    // Update copy trade status
    copyTrade.status = 'stopped';
    copyTrade.stoppedAt = new Date();
    await copyTrade.save();

    // Decrement trader copiers
    await Trader.findByIdAndUpdate(copyTrade.traderId, { $inc: { copiers: -1 } });

    // Create transaction record - use valid type 'copy_trade'
    const traderShareText = traderShare > 0 ? ` (${profitSharePercent}% shared with trader: $${traderShare.toFixed(2)})` : '';
    await Transaction.create({
      userId,
      type: 'copy_trade',
      amount: returnAmount,
      balanceBefore,
      balanceAfter: user.availableBalance,
      status: 'completed',
      description: `Stopped copying ${copyTrade.trader.name} - Net: $${netProfitLoss.toFixed(2)}${traderShareText} → ${targetToken}`,
      relatedId: copyTrade._id,
      relatedModel: 'CopyTrade',
    });

    // Add notification with profit share info
    let profitText = '';
    if (grossProfitLoss >= 0) {
      if (traderShare > 0) {
        profitText = `Gross profit: +$${grossProfitLoss.toFixed(2)}, Trader share (${profitSharePercent}%): $${traderShare.toFixed(2)}, Your profit: +$${netProfitLoss.toFixed(2)}`;
      } else {
        profitText = `No profit to share`;
      }
    } else {
      profitText = `Loss: -$${Math.abs(grossProfitLoss).toFixed(2)}`;
    }
    
    await User.findByIdAndUpdate(userId, {
      $push: {
        notifications: {
          $each: [{
            type: 'copy_trade',
            title: 'Copy Trading Stopped',
            message: `You stopped copying ${copyTrade.trader.name}. ${profitText}. $${returnAmount.toFixed(2)} deposited to ${targetToken}.`,
            read: false,
            createdAt: new Date(),
          }],
          $position: 0,
        },
      },
    });

    console.log(`✅ User ${user.email} stopped copy trade, returned $${returnAmount} to ${targetToken} (trader share: $${traderShare.toFixed(2)})`);

    return NextResponse.json({
      message: 'Stopped copying successfully',
      returnAmount,
      grossProfitLoss,
      traderShare,
      profitSharePercent,
      netProfitLoss,
      withdrawToken: targetToken,
      newBalance: user.availableBalance,
    });
  } catch (error) {
    console.error('Error stopping copy trade:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH - Update copy trade settings (pause/resume)
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const body = await request.json();
    const { copyTradeId, action, stopLoss, takeProfit } = body;

    if (!copyTradeId) {
      return NextResponse.json({ error: 'Copy trade ID required' }, { status: 400 });
    }

    const userId = new mongoose.Types.ObjectId(session.user.id);

    // Find copy trade
    const copyTrade = await CopyTrade.findOne({ 
      _id: copyTradeId, 
      userId, 
      status: { $in: ['active', 'paused'] } 
    });
    
    if (!copyTrade) {
      return NextResponse.json({ error: 'Active copy trade not found' }, { status: 404 });
    }

    // Handle pause/resume
    if (action === 'pause') {
      copyTrade.status = 'paused';
    } else if (action === 'resume') {
      copyTrade.status = 'active';
    }

    // Update settings
    if (stopLoss !== undefined) copyTrade.stopLoss = stopLoss;
    if (takeProfit !== undefined) copyTrade.takeProfit = takeProfit;

    await copyTrade.save();

    return NextResponse.json({
      message: `Copy trade ${action === 'pause' ? 'paused' : action === 'resume' ? 'resumed' : 'updated'}`,
      copyTrade,
    });
  } catch (error) {
    console.error('Error updating copy trade:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
