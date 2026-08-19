import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { auth } from '@/lib/auth';
import { connectToDatabase } from '@/db/connection';
import { User, CopyTrade, Trader, UserHolding, Transaction } from '@/db/models';

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

// GET - Fetch all copy trades (admin view)
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    // Check admin role
    const adminUserId = new mongoose.Types.ObjectId(session.user.id);
    const admin = await User.findById(adminUserId);
    const validAdminRoles = ['admin', 'superadmin', 'super_admin'];
    if (!admin || !validAdminRoles.includes(admin.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch all copy trades with user info
    const copyTrades = await CopyTrade.find()
      .populate('userId', 'firstName lastName email')
      .populate('traderId', 'name avatar winRate')
      .sort({ createdAt: -1 })
      .lean();

    // Separate by status
    const active = copyTrades.filter((c: any) => c.status === 'active' || c.status === 'paused');
    const stopped = copyTrades.filter((c: any) => c.status === 'stopped' || c.status === 'liquidated');

    // Calculate stats
    const stats = {
      totalActive: active.length,
      totalStopped: stopped.length,
      totalInvested: active.reduce((acc: number, c: any) => acc + c.amount, 0),
      totalPnL: copyTrades.reduce((acc: number, c: any) => acc + (c.profitLoss || 0), 0),
      totalTrades: copyTrades.reduce((acc: number, c: any) => acc + (c.tradesCount || 0), 0),
    };

    return NextResponse.json({
      copyTrades,
      active,
      stopped,
      stats,
    });
  } catch (error) {
    console.error('Admin copy trades fetch error:', (error as Error).message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH - Update copy trade (admin edit trades count, profit/loss, status)
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    // Check admin role
    const adminUserId = new mongoose.Types.ObjectId(session.user.id);
    const admin = await User.findById(adminUserId);
    const validAdminRoles = ['admin', 'superadmin', 'super_admin'];
    if (!admin || !validAdminRoles.includes(admin.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { copyTradeId, tradesCount, profitLoss, status, adminNote } = body;

    if (!copyTradeId) {
      return NextResponse.json({ error: 'Copy trade ID required' }, { status: 400 });
    }

    const copyTrade = await CopyTrade.findById(copyTradeId);
    if (!copyTrade) {
      return NextResponse.json({ error: 'Copy trade not found' }, { status: 404 });
    }

    // Update fields
    if (tradesCount !== undefined) copyTrade.tradesCount = tradesCount;
    if (profitLoss !== undefined) copyTrade.profitLoss = profitLoss;
    if (adminNote !== undefined) copyTrade.adminNote = adminNote;

    // Handle status change
    if (status && status !== copyTrade.status) {
      const previousStatus = copyTrade.status;
      copyTrade.status = status;

      // If stopping the copy trade, handle fund return
      if ((status === 'stopped' || status === 'liquidated') && 
          (previousStatus === 'active' || previousStatus === 'paused')) {
        copyTrade.stoppedAt = new Date();

        // Return funds to user's token holding
        const userId = copyTrade.userId;
        const user = await User.findById(userId);
        
        if (user) {
          // Calculate profit share
          const grossProfitLoss = copyTrade.profitLoss || 0;
          const profitSharePercent = copyTrade.trader?.profitShare || 10;
          
          let traderShare = 0;
          let netProfitLoss = grossProfitLoss;
          
          if (grossProfitLoss > 0) {
            traderShare = (grossProfitLoss * profitSharePercent) / 100;
            netProfitLoss = grossProfitLoss - traderShare;
          }
          
          const returnAmount = copyTrade.amount + netProfitLoss;
          const paymentToken = copyTrade.paymentToken || 'USDT';
          const tokenPrice = TOKEN_PRICES[paymentToken] || 1;
          const tokenAmount = returnAmount / tokenPrice;

          // Return to UserHolding
          let holding = await UserHolding.findOne({ userId, symbol: paymentToken });
          
          if (holding) {
            const totalValue = holding.amountUsd + returnAmount;
            const totalAmount = holding.amount + tokenAmount;
            holding.averagePrice = totalValue / totalAmount;
            holding.amountUsd += returnAmount;
            holding.amount += tokenAmount;
            await holding.save();
          } else {
            await UserHolding.create({
              userId,
              symbol: paymentToken,
              name: paymentToken,
              type: 'crypto',
              icon: copyTrade.paymentTokenIcon || '',
              amount: tokenAmount,
              amountUsd: returnAmount,
              averagePrice: tokenPrice,
            });
          }

          // Update user balance
          const balanceBefore = user.availableBalance || 0;
          user.availableBalance = balanceBefore + returnAmount;
          user.lockedBalance = Math.max(0, (user.lockedBalance || 0) - copyTrade.amount);
          await user.save();

          // Decrement trader copiers
          await Trader.findByIdAndUpdate(copyTrade.traderId, { $inc: { copiers: -1 } });

          // Create transaction - use valid type 'copy_trade'
          const traderShareText = traderShare > 0 ? ` (${profitSharePercent}% shared: $${traderShare.toFixed(2)})` : '';
          await Transaction.create({
            userId,
            type: 'copy_trade',
            amount: returnAmount,
            balanceBefore,
            balanceAfter: user.availableBalance,
            status: 'completed',
            description: `Admin closed copy trade - Net: $${netProfitLoss.toFixed(2)}${traderShareText}`,
            relatedId: copyTrade._id,
            relatedModel: 'CopyTrade',
          });

          // Add notification with profit share breakdown
          let profitText = '';
          if (grossProfitLoss > 0 && traderShare > 0) {
            profitText = `Gross profit: +$${grossProfitLoss.toFixed(2)}, Trader share (${profitSharePercent}%): $${traderShare.toFixed(2)}, Your profit: +$${netProfitLoss.toFixed(2)}`;
          } else if (grossProfitLoss < 0) {
            profitText = `Loss: -$${Math.abs(grossProfitLoss).toFixed(2)}`;
          } else {
            profitText = `No profit/loss`;
          }
          
          await User.findByIdAndUpdate(userId, {
            $push: {
              notifications: {
                $each: [{
                  type: 'copy_trade',
                  title: 'Copy Trading Closed',
                  message: `Your copy trade with ${copyTrade.trader.name} has been closed. ${profitText}. $${returnAmount.toFixed(2)} returned to ${paymentToken}.`,
                  read: false,
                  createdAt: new Date(),
                }],
                $position: 0,
              },
            },
          });

          console.log(`✅ Admin closed copy trade for user ${user.email}, returned $${returnAmount} to ${paymentToken} (trader share: $${traderShare.toFixed(2)})`);
        }
      }
    }

    await copyTrade.save();

    return NextResponse.json({
      message: 'Copy trade updated successfully',
      copyTrade,
    });
  } catch (error) {
    console.error('Admin copy trade update error:', (error as Error).message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
