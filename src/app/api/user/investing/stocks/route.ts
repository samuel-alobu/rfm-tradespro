import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { auth } from '@/lib/auth';
import { connectToDatabase } from '@/db/connection';
import { User, UserHolding, StockPosition } from '@/db/models';

// Token info for creating holdings
const tokenInfo: Record<string, { name: string; icon: string }> = {
  BTC: { name: 'Bitcoin', icon: 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png' },
  ETH: { name: 'Ethereum', icon: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png' },
  USDT: { name: 'Tether', icon: 'https://assets.coingecko.com/coins/images/325/small/Tether.png' },
  USDC: { name: 'USD Coin', icon: 'https://assets.coingecko.com/coins/images/6319/small/usdc.png' },
  BNB: { name: 'BNB', icon: 'https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png' },
  SOL: { name: 'Solana', icon: 'https://assets.coingecko.com/coins/images/4128/small/solana.png' },
  XRP: { name: 'Ripple', icon: 'https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png' },
  DOGE: { name: 'Dogecoin', icon: 'https://assets.coingecko.com/coins/images/5/small/dogecoin.png' },
  ADA: { name: 'Cardano', icon: 'https://assets.coingecko.com/coins/images/975/small/cardano.png' },
};

// POST - Buy stock with token OR withdraw from stock to token
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const body = await request.json();
    const { action } = body;

    const userId = new mongoose.Types.ObjectId(session.user.id);

    if (action === 'buy') {
      // Buy stock with a token
      const { stockSymbol, stockName, stockIcon, stockPrice, quantity, payWithToken } = body;

      if (!stockSymbol || !stockPrice || !quantity || quantity <= 0 || !payWithToken) {
        return NextResponse.json({ error: 'Invalid buy request' }, { status: 400 });
      }

      const totalCost = quantity * stockPrice;

      // Check user's token holding
      const holding = await UserHolding.findOne({ userId, symbol: payWithToken });

      if (!holding || holding.amountUsd < totalCost) {
        return NextResponse.json({
          error: `Insufficient ${payWithToken} balance. You have ${formatCurrency(holding?.amountUsd || 0)} but need ${formatCurrency(totalCost)}`,
        }, { status: 400 });
      }

      // Deduct from token holding
      const tokenPricePerUnit = holding.amount > 0 ? holding.amountUsd / holding.amount : 1;
      const tokenAmountToDeduct = totalCost / tokenPricePerUnit;
      const newHoldingAmount = holding.amount - tokenAmountToDeduct;
      const newHoldingUsd = holding.amountUsd - totalCost;

      if (newHoldingUsd <= 0.01) {
        await UserHolding.findByIdAndDelete(holding._id);
      } else {
        await UserHolding.findByIdAndUpdate(holding._id, {
          $set: { amount: newHoldingAmount, amountUsd: newHoldingUsd },
        });
      }

      // Create or update stock position
      let stockPosition = await StockPosition.findOne({ userId, symbol: stockSymbol, status: 'active' });

      if (stockPosition) {
        // Average in the new purchase
        const newTotalQuantity = stockPosition.quantity + quantity;
        const newTotalInvested = stockPosition.totalInvested + totalCost;
        const newAvgPrice = newTotalInvested / newTotalQuantity;

        stockPosition.quantity = newTotalQuantity;
        stockPosition.totalInvested = newTotalInvested;
        stockPosition.purchasePrice = newAvgPrice;
        stockPosition.currentPrice = stockPrice;
        stockPosition.currentValue = newTotalQuantity * stockPrice;
        await stockPosition.save();
      } else {
        stockPosition = await StockPosition.create({
          userId,
          symbol: stockSymbol,
          name: stockName || stockSymbol,
          icon: stockIcon || '',
          quantity,
          purchasePrice: stockPrice,
          currentPrice: stockPrice,
          currentValue: totalCost,
          totalInvested: totalCost,
          status: 'active',
        });
      }

      // Add notification
      await User.findByIdAndUpdate(userId, {
        $push: {
          notifications: {
            $each: [{
              type: 'investment',
              title: 'Stock Purchase',
              message: `Bought ${quantity} shares of ${stockSymbol} for ${formatCurrency(totalCost)} using ${payWithToken}`,
              read: false,
              createdAt: new Date(),
            }],
            $position: 0,
          },
        },
      });

      return NextResponse.json({
        success: true,
        message: `Successfully bought ${quantity} shares of ${stockSymbol}`,
        stock: {
          id: stockPosition._id.toString(),
          symbol: stockPosition.symbol,
          quantity: stockPosition.quantity,
          currentValue: stockPosition.currentValue,
        },
      });

    } else if (action === 'withdraw') {
      // Withdraw from stock to a token
      const { stockId, withdrawAmount, withdrawToToken } = body;

      if (!stockId || !withdrawAmount || withdrawAmount <= 0 || !withdrawToToken) {
        return NextResponse.json({ error: 'Invalid withdraw request' }, { status: 400 });
      }

      // Find stock position
      const stockPosition = await StockPosition.findOne({
        _id: new mongoose.Types.ObjectId(stockId),
        userId,
        status: 'active',
      });

      if (!stockPosition) {
        return NextResponse.json({ error: 'Stock position not found' }, { status: 404 });
      }

      if (stockPosition.currentValue < withdrawAmount) {
        return NextResponse.json({
          error: `Insufficient stock value. You have ${formatCurrency(stockPosition.currentValue)} but want to withdraw ${formatCurrency(withdrawAmount)}`,
        }, { status: 400 });
      }

      // Calculate shares to sell
      const sharesToSell = withdrawAmount / stockPosition.currentPrice;
      const newQuantity = stockPosition.quantity - sharesToSell;
      const newCurrentValue = newQuantity * stockPosition.currentPrice;
      const proportionSold = sharesToSell / stockPosition.quantity;
      const investmentReturned = stockPosition.totalInvested * proportionSold;

      // Update or close stock position
      if (newQuantity <= 0.0001) {
        stockPosition.status = 'closed';
        stockPosition.quantity = 0;
        stockPosition.currentValue = 0;
      } else {
        stockPosition.quantity = newQuantity;
        stockPosition.currentValue = newCurrentValue;
        stockPosition.totalInvested = stockPosition.totalInvested - investmentReturned;
      }
      await stockPosition.save();

      // Add to user's token holding
      const info = tokenInfo[withdrawToToken] || { name: withdrawToToken, icon: '' };
      let existingHolding = await UserHolding.findOne({ userId, symbol: withdrawToToken });

      if (existingHolding) {
        const tokenPrice = existingHolding.amount > 0 ? existingHolding.amountUsd / existingHolding.amount : 1;
        const tokensToAdd = withdrawAmount / tokenPrice;
        await UserHolding.findByIdAndUpdate(existingHolding._id, {
          $inc: { amount: tokensToAdd, amountUsd: withdrawAmount },
        });
      } else {
        await UserHolding.create({
          userId,
          symbol: withdrawToToken,
          name: info.name,
          type: 'crypto',
          icon: info.icon,
          amount: withdrawAmount, // For stablecoins, amount = amountUsd
          amountUsd: withdrawAmount,
          averagePrice: 1,
        });
      }

      // Update user's available balance
      await User.findByIdAndUpdate(userId, {
        $inc: { availableBalance: withdrawAmount },
        $push: {
          notifications: {
            $each: [{
              type: 'investment',
              title: 'Stock Withdrawal',
              message: `Withdrew ${formatCurrency(withdrawAmount)} from ${stockPosition.symbol} to ${withdrawToToken}`,
              read: false,
              createdAt: new Date(),
            }],
            $position: 0,
          },
        },
      });

      return NextResponse.json({
        success: true,
        message: `Successfully withdrew ${formatCurrency(withdrawAmount)} from ${stockPosition.symbol} to ${withdrawToToken}`,
        withdrawnAmount: withdrawAmount,
        remainingValue: newCurrentValue,
      });
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Stock operation error:', (error as Error).message);
    return NextResponse.json({ error: 'Operation failed' }, { status: 500 });
  }
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
}
