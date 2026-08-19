import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { auth } from '@/lib/auth';
import { connectToDatabase } from '@/db/connection';
import { Trader, CopyTrade, User, UserHolding, Transaction } from '@/db/models';

// GET - Fetch all active traders
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const style = searchParams.get('style');
    const sortBy = searchParams.get('sortBy') || 'totalReturn';

    const query: Record<string, unknown> = { isActive: true };
    if (style && style !== 'all') query.tradingStyle = style;

    const sortOptions: Record<string, 1 | -1> = {};
    if (sortBy === 'winRate') sortOptions.winRate = -1;
    else if (sortBy === 'copiers') sortOptions.copiers = -1;
    else sortOptions.totalReturn = -1;

    const traders = await Trader.find(query)
      .sort(sortOptions)
      .lean();

    return NextResponse.json({ traders });
  } catch (error) {
    console.error('Error fetching traders:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Start copying a trader
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const body = await request.json();
    const { traderId, amount, paymentToken, paymentTokenIcon, stopLoss, takeProfit } = body;

    // Validate
    if (!traderId || !amount || amount < 100) {
      return NextResponse.json({ error: 'Invalid copy trade data. Minimum amount is $100.' }, { status: 400 });
    }

    if (!paymentToken) {
      return NextResponse.json({ error: 'Payment token is required' }, { status: 400 });
    }

    const userId = new mongoose.Types.ObjectId(session.user.id);

    // Check trader exists
    const trader = await Trader.findById(traderId);
    if (!trader || !trader.isActive) {
      return NextResponse.json({ error: 'Trader not found or inactive' }, { status: 404 });
    }

    // Check min investment
    if (amount < trader.minInvestment) {
      return NextResponse.json({ 
        error: `Minimum investment is $${trader.minInvestment}` 
      }, { status: 400 });
    }

    // Check user and token balance
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check UserHolding for the payment token
    const holding = await UserHolding.findOne({ userId, symbol: paymentToken });
    if (!holding || holding.amountUsd < amount) {
      return NextResponse.json({ 
        error: `Insufficient ${paymentToken} balance. You have ${holding ? holding.amountUsd.toFixed(2) : '0'} USD` 
      }, { status: 400 });
    }

    // Check if already copying this trader
    const existingCopy = await CopyTrade.findOne({
      userId,
      traderId,
      status: { $in: ['active', 'paused'] },
    });
    if (existingCopy) {
      return NextResponse.json({ error: 'Already copying this trader' }, { status: 400 });
    }

    // Calculate token amount to deduct
    const tokenPrice = holding.amountUsd / holding.amount;
    const tokenAmountToDeduct = amount / tokenPrice;

    // Deduct from UserHolding
    holding.amountUsd -= amount;
    holding.amount -= tokenAmountToDeduct;
    
    // Remove holding if balance is too low
    if (holding.amountUsd < 0.01) {
      await UserHolding.deleteOne({ _id: holding._id });
    } else {
      await holding.save();
    }

    // Also deduct from user's availableBalance for consistency
    const balanceBefore = user.availableBalance || 0;
    user.availableBalance = Math.max(0, balanceBefore - amount);
    user.lockedBalance = (user.lockedBalance || 0) + amount;
    await user.save();

    // Create copy trade with payment token info and profit share
    const copyTrade = await CopyTrade.create({
      userId,
      traderId,
      trader: {
        name: trader.name,
        username: trader.username || trader.name.toLowerCase().replace(/\s+/g, ''),
        avatar: trader.avatar,
        winRate: trader.winRate || 0,
        profitShare: trader.profitShare || 10, // Store trader's profit share percentage
      },
      amount,
      paymentToken,
      paymentTokenIcon: paymentTokenIcon || '',
      stopLoss,
      takeProfit,
      profitLoss: 0,
      tradesCount: 0,
      status: 'active',
      startedAt: new Date(),
    });

    // Update trader copiers count
    await Trader.findByIdAndUpdate(traderId, { $inc: { copiers: 1 } });

    // Create transaction record
    await Transaction.create({
      userId,
      type: 'copy_trade',
      amount: -amount,
      balanceBefore,
      balanceAfter: user.availableBalance,
      status: 'completed',
      description: `Started copying ${trader.name} with ${paymentToken}`,
      relatedId: copyTrade._id,
      relatedModel: 'CopyTrade',
    });

    // Add notification
    await User.findByIdAndUpdate(userId, {
      $push: {
        notifications: {
          $each: [{
            type: 'copy_trade',
            title: 'Copy Trading Started',
            message: `You started copying ${trader.name} with ${amount.toFixed(2)} USD of ${paymentToken}`,
            read: false,
            createdAt: new Date(),
          }],
          $position: 0,
        },
      },
    });

    console.log(`✅ User ${user.email} started copying ${trader.name} with $${amount} (${paymentToken})`);

    return NextResponse.json({ 
      copyTrade, 
      message: 'Started copying trader successfully',
      newBalance: user.availableBalance,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating copy trade:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
