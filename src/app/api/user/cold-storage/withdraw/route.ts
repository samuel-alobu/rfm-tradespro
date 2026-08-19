import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { auth } from '@/lib/auth';
import { connectToDatabase } from '@/db/connection';
import { User, ColdStorage, UserHolding } from '@/db/models';

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
  AVAX: { name: 'Avalanche', icon: 'https://assets.coingecko.com/coins/images/12559/small/Avalanche_Circle_RedWhite_Trans.png' },
};

// POST - Withdraw from cold storage (individual or all)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const body = await request.json();
    const { assetId, withdrawAll } = body;

    const userId = new mongoose.Types.ObjectId(session.user.id);

    if (withdrawAll) {
      // Withdraw all cold storage assets
      const coldStorageAssets = await ColdStorage.find({ userId, status: 'active' });
      
      if (coldStorageAssets.length === 0) {
        return NextResponse.json({ error: 'No assets in cold storage' }, { status: 400 });
      }

      // Calculate total value and update UserHoldings for each asset
      let totalValue = 0;
      
      for (const asset of coldStorageAssets) {
        const withdrawValue = asset.currentValue || 0;
        const quantity = asset.quantity || 0;
        totalValue += withdrawValue;

        // Add back to UserHolding
        await addToUserHolding(userId, asset.symbol, asset.name, asset.icon, quantity, withdrawValue);
      }

      // Mark all as withdrawn
      await ColdStorage.updateMany(
        { userId, status: 'active' },
        { $set: { status: 'withdrawn' } }
      );

      // Add to user balance
      await User.findByIdAndUpdate(userId, {
        $inc: { availableBalance: totalValue },
        $push: {
          notifications: {
            $each: [{
              type: 'cold_storage',
              title: 'Cold Storage Withdrawal',
              message: `Successfully withdrew all assets from cold storage. ${formatCurrency(totalValue)} added to your balance.`,
              read: false,
              createdAt: new Date(),
            }],
            $position: 0,
          },
        },
      });

      return NextResponse.json({
        success: true,
        message: `Successfully withdrew all assets worth ${formatCurrency(totalValue)}`,
        totalWithdrawn: totalValue,
        assetsWithdrawn: coldStorageAssets.length,
      });
    } else if (assetId) {
      // Withdraw single asset
      const coldStorageAsset = await ColdStorage.findOne({
        _id: new mongoose.Types.ObjectId(assetId),
        userId,
        status: 'active',
      });

      if (!coldStorageAsset) {
        return NextResponse.json({ error: 'Asset not found in cold storage' }, { status: 404 });
      }

      const withdrawValue = coldStorageAsset.currentValue || 0;
      const quantity = coldStorageAsset.quantity || 0;

      // Add back to UserHolding
      await addToUserHolding(
        userId, 
        coldStorageAsset.symbol, 
        coldStorageAsset.name, 
        coldStorageAsset.icon, 
        quantity, 
        withdrawValue
      );

      // Mark as withdrawn
      coldStorageAsset.status = 'withdrawn';
      await coldStorageAsset.save();

      // Add to user balance
      await User.findByIdAndUpdate(userId, {
        $inc: { availableBalance: withdrawValue },
        $push: {
          notifications: {
            $each: [{
              type: 'cold_storage',
              title: 'Cold Storage Withdrawal',
              message: `Successfully withdrew ${coldStorageAsset.quantity} ${coldStorageAsset.symbol} worth ${formatCurrency(withdrawValue)} from cold storage.`,
              read: false,
              createdAt: new Date(),
            }],
            $position: 0,
          },
        },
      });

      return NextResponse.json({
        success: true,
        message: `Successfully withdrew ${coldStorageAsset.quantity} ${coldStorageAsset.symbol}`,
        withdrawnValue: withdrawValue,
        symbol: coldStorageAsset.symbol,
        quantity: coldStorageAsset.quantity,
      });
    } else {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
  } catch (error) {
    console.error('Cold storage withdraw error:', (error as Error).message);
    return NextResponse.json({ error: 'Failed to withdraw from cold storage' }, { status: 500 });
  }
}

// Helper to add value back to UserHolding
async function addToUserHolding(
  userId: mongoose.Types.ObjectId,
  symbol: string,
  name: string,
  icon: string,
  quantity: number,
  amountUsd: number
) {
  const existingHolding = await UserHolding.findOne({ userId, symbol });

  if (existingHolding) {
    // Add to existing holding
    const newAmount = existingHolding.amount + quantity;
    const newAmountUsd = existingHolding.amountUsd + amountUsd;
    const newAvgPrice = newAmount > 0 ? newAmountUsd / newAmount : existingHolding.averagePrice;

    await UserHolding.findByIdAndUpdate(existingHolding._id, {
      $set: { 
        amount: newAmount, 
        amountUsd: newAmountUsd,
        averagePrice: newAvgPrice,
      },
    });
  } else {
    // Create new holding
    const info = tokenInfo[symbol] || { name: symbol, icon: '' };
    await UserHolding.create({
      userId,
      symbol,
      name: name || info.name,
      type: 'crypto',
      icon: icon || info.icon,
      amount: quantity,
      amountUsd,
      averagePrice: quantity > 0 ? amountUsd / quantity : 0,
    });
  }
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
}
