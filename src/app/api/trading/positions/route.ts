import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { auth } from '@/lib/auth';
import { connectToDatabase } from '@/db/connection';
import { TradingPosition, TradingAccount, User } from '@/db/models';

// ============================================
// Trading Positions API
// GET - List positions
// POST - Open position
// PATCH - Close position
// ============================================

// Duration to milliseconds mapping
const durationToMs: Record<string, number> = {
  '1m': 60000,
  '2m': 120000,
  '5m': 300000,
  '15m': 900000,
  '30m': 1800000,
  '1h': 3600000,
  '4h': 14400000,
  '1d': 86400000,
  '1w': 604800000,
};

// GET - List user's trading positions
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const userId = new mongoose.Types.ObjectId(session.user.id);
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // 'open', 'closed', or null for all

    const query: any = { userId };
    if (status && ['open', 'closed'].includes(status)) {
      query.status = status;
    }

    const positions = await TradingPosition.find(query)
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    return NextResponse.json({
      positions: positions.map((p: any) => ({
        id: p.positionId,
        type: p.type,
        assetType: p.assetType,
        symbol: p.symbol,
        name: p.name,
        amount: p.amount,
        entryPrice: p.entryPrice,
        currentPrice: p.currentPrice,
        exitPrice: p.exitPrice,
        leverage: p.leverage,
        stopLoss: p.stopLoss,
        takeProfit: p.takeProfit,
        duration: p.duration,
        marginUsed: p.marginUsed,
        pnl: p.pnl,
        pnlPercent: p.pnlPercent,
        status: p.status,
        closeReason: p.closeReason,
        openedAt: p.openedAt,
        closedAt: p.closedAt,
        expiresAt: p.expiresAt,
      })),
      openCount: positions.filter((p: any) => p.status === 'open').length,
      closedCount: positions.filter((p: any) => p.status === 'closed').length,
    });
  } catch (error) {
    console.error('Positions fetch error:', (error as Error).message);
    return NextResponse.json({ positions: [], openCount: 0, closedCount: 0 });
  }
}

// POST - Open a new trading position
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const body = await request.json();
    const {
      type, // 'buy' or 'sell'
      assetType, // 'Crypto' or 'Stocks'
      symbol,
      name,
      amount, // Position size in USD
      entryPrice,
      leverage = 1,
      stopLoss,
      takeProfit,
      duration = '2m',
    } = body;

    // Validation
    if (!type || !['buy', 'sell'].includes(type)) {
      return NextResponse.json({ error: 'Invalid position type' }, { status: 400 });
    }

    if (!assetType || !['Crypto', 'Stocks'].includes(assetType)) {
      return NextResponse.json({ error: 'Invalid asset type' }, { status: 400 });
    }

    if (!symbol || !name) {
      return NextResponse.json({ error: 'Symbol and name are required' }, { status: 400 });
    }

    const positionAmount = parseFloat(amount);
    const positionEntryPrice = parseFloat(entryPrice);
    const positionLeverage = Math.min(Math.max(parseInt(leverage) || 1, 1), 100);

    if (isNaN(positionAmount) || positionAmount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    if (isNaN(positionEntryPrice) || positionEntryPrice <= 0) {
      return NextResponse.json({ error: 'Invalid entry price' }, { status: 400 });
    }

    const userId = new mongoose.Types.ObjectId(session.user.id);

    // Get trading account
    let account = await TradingAccount.findOne({ userId });
    if (!account) {
      account = await TradingAccount.create({ userId, balance: 0 });
    }

    // Calculate margin required
    const positionValue = positionAmount * positionEntryPrice;
    const marginRequired = positionValue / positionLeverage;

    if (account.balance < marginRequired) {
      return NextResponse.json({
        error: `Insufficient trading balance. Required margin: $${marginRequired.toFixed(2)}, Available: $${account.balance.toFixed(2)}`,
      }, { status: 400 });
    }

    // Generate unique position ID
    let positionId = '';
    let isUnique = false;
    while (!isUnique) {
      positionId = TradingPosition.generatePositionId();
      const existing = await TradingPosition.findOne({ positionId });
      if (!existing) isUnique = true;
    }

    // Calculate expiration
    const durationMs = durationToMs[duration] || 120000;
    const expiresAt = new Date(Date.now() + durationMs);

    // Create position
    const position = await TradingPosition.create({
      userId,
      positionId,
      type,
      assetType,
      symbol,
      name,
      amount: positionAmount,
      entryPrice: positionEntryPrice,
      currentPrice: positionEntryPrice,
      leverage: positionLeverage,
      stopLoss: stopLoss ? parseFloat(stopLoss) : null,
      takeProfit: takeProfit ? parseFloat(takeProfit) : null,
      duration,
      marginUsed: marginRequired,
      pnl: 0,
      pnlPercent: 0,
      status: 'open',
      openedAt: new Date(),
      expiresAt,
    });

    // Deduct margin from trading account
    account.balance -= marginRequired;
    account.totalTrades += 1;
    await account.save();

    // Add notification
    await User.findByIdAndUpdate(userId, {
      $push: {
        notifications: {
          $each: [{
            type: 'trading',
            title: 'Position Opened',
            message: `${type.toUpperCase()} ${positionAmount} ${symbol} @ $${positionEntryPrice.toFixed(2)} with ${positionLeverage}x leverage`,
            read: false,
            createdAt: new Date(),
          }],
          $position: 0,
        },
      },
    });

    return NextResponse.json({
      success: true,
      position: {
        id: position.positionId,
        type: position.type,
        assetType: position.assetType,
        symbol: position.symbol,
        name: position.name,
        amount: position.amount,
        entryPrice: position.entryPrice,
        currentPrice: position.currentPrice,
        leverage: position.leverage,
        stopLoss: position.stopLoss,
        takeProfit: position.takeProfit,
        duration: position.duration,
        marginUsed: position.marginUsed,
        pnl: position.pnl,
        pnlPercent: position.pnlPercent,
        status: position.status,
        openedAt: position.openedAt,
        expiresAt: position.expiresAt,
      },
      account: {
        balance: account.balance,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Open position error:', (error as Error).message);
    return NextResponse.json({ error: 'Failed to open position' }, { status: 500 });
  }
}

// PATCH - Close or update a position
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const body = await request.json();
    const { positionId, action, currentPrice, closeReason = 'manual' } = body;

    if (!positionId) {
      return NextResponse.json({ error: 'Position ID is required' }, { status: 400 });
    }

    const userId = new mongoose.Types.ObjectId(session.user.id);

    const position = await TradingPosition.findOne({ positionId, userId });
    if (!position) {
      return NextResponse.json({ error: 'Position not found' }, { status: 404 });
    }

    if (position.status !== 'open') {
      return NextResponse.json({ error: 'Position is already closed' }, { status: 400 });
    }

    if (action === 'update' && currentPrice) {
      // Just update price and PnL
      const price = parseFloat(currentPrice);
      const priceDiff = position.type === 'buy'
        ? price - position.entryPrice
        : position.entryPrice - price;
      const pnl = priceDiff * position.amount * position.leverage;
      const pnlPercent = (priceDiff / position.entryPrice) * 100 * position.leverage;

      position.currentPrice = price;
      position.pnl = pnl;
      position.pnlPercent = pnlPercent;
      await position.save();

      return NextResponse.json({
        success: true,
        position: {
          id: position.positionId,
          currentPrice: position.currentPrice,
          pnl: position.pnl,
          pnlPercent: position.pnlPercent,
        },
      });
    }

    if (action === 'close') {
      // Close the position
      const exitPrice = currentPrice ? parseFloat(currentPrice) : position.currentPrice;
      const priceDiff = position.type === 'buy'
        ? exitPrice - position.entryPrice
        : position.entryPrice - exitPrice;
      const pnl = priceDiff * position.amount * position.leverage;
      const pnlPercent = (priceDiff / position.entryPrice) * 100 * position.leverage;

      // Update position
      position.currentPrice = exitPrice;
      position.exitPrice = exitPrice;
      position.pnl = pnl;
      position.pnlPercent = pnlPercent;
      position.status = 'closed';
      position.closeReason = closeReason;
      position.closedAt = new Date();
      await position.save();

      // Return margin + PnL to trading account
      const account = await TradingAccount.findOne({ userId });
      if (account) {
        const returnAmount = position.marginUsed + pnl;
        account.balance += returnAmount;
        account.totalPnl += pnl;
        if (pnl > 0) {
          account.winningTrades += 1;
        } else if (pnl < 0) {
          account.losingTrades += 1;
        }
        await account.save();
      }

      // Add notification
      const pnlText = pnl >= 0 ? `+$${pnl.toFixed(2)}` : `-$${Math.abs(pnl).toFixed(2)}`;
      await User.findByIdAndUpdate(userId, {
        $push: {
          notifications: {
            $each: [{
              type: 'trading',
              title: 'Position Closed',
              message: `${position.symbol} position closed. PnL: ${pnlText} (${pnlPercent.toFixed(2)}%)`,
              read: false,
              createdAt: new Date(),
            }],
            $position: 0,
          },
        },
      });

      return NextResponse.json({
        success: true,
        position: {
          id: position.positionId,
          exitPrice: position.exitPrice,
          pnl: position.pnl,
          pnlPercent: position.pnlPercent,
          status: position.status,
          closeReason: position.closeReason,
          closedAt: position.closedAt,
        },
        account: account ? {
          balance: account.balance,
          totalPnl: account.totalPnl,
        } : null,
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Update position error:', (error as Error).message);
    return NextResponse.json({ error: 'Failed to update position' }, { status: 500 });
  }
}
