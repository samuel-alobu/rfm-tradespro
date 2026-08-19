import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { auth } from '@/lib/auth';
import { connectToDatabase } from '@/db/connection';
import { User, UserHolding } from '@/db/models';

// Token info for creating holdings
const tokenInfo: Record<string, { name: string; icon: string; price: number }> = {
  BTC: { name: 'Bitcoin', icon: 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png', price: 67234.50 },
  ETH: { name: 'Ethereum', icon: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png', price: 3456.78 },
  USDT: { name: 'Tether', icon: 'https://assets.coingecko.com/coins/images/325/small/Tether.png', price: 1.00 },
  USDC: { name: 'USD Coin', icon: 'https://assets.coingecko.com/coins/images/6319/small/usdc.png', price: 1.00 },
  BNB: { name: 'BNB', icon: 'https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png', price: 605.23 },
  SOL: { name: 'Solana', icon: 'https://assets.coingecko.com/coins/images/4128/small/solana.png', price: 178.45 },
  XRP: { name: 'Ripple', icon: 'https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png', price: 0.62 },
  DOGE: { name: 'Dogecoin', icon: 'https://assets.coingecko.com/coins/images/5/small/dogecoin.png', price: 0.12 },
  ADA: { name: 'Cardano', icon: 'https://assets.coingecko.com/coins/images/975/small/cardano.png', price: 0.45 },
  AVAX: { name: 'Avalanche', icon: 'https://assets.coingecko.com/coins/images/12559/small/Avalanche_Circle_RedWhite_Trans.png', price: 35.67 },
  DOT: { name: 'Polkadot', icon: 'https://assets.coingecko.com/coins/images/12171/small/polkadot.png', price: 7.23 },
  MATIC: { name: 'Polygon', icon: 'https://assets.coingecko.com/coins/images/4713/small/matic-token-icon.png', price: 0.58 },
  LINK: { name: 'Chainlink', icon: 'https://assets.coingecko.com/coins/images/877/small/chainlink-new-logo.png', price: 14.56 },
  UNI: { name: 'Uniswap', icon: 'https://assets.coingecko.com/coins/images/12504/small/uniswap-uni.png', price: 9.87 },
  ATOM: { name: 'Cosmos', icon: 'https://assets.coingecko.com/coins/images/1481/small/cosmos_hub.png', price: 8.45 },
  LTC: { name: 'Litecoin', icon: 'https://assets.coingecko.com/coins/images/2/small/litecoin.png', price: 84.56 },
  SHIB: { name: 'Shiba Inu', icon: 'https://assets.coingecko.com/coins/images/11939/small/shiba.png', price: 0.000024 },
  TRX: { name: 'TRON', icon: 'https://assets.coingecko.com/coins/images/1094/small/tron-logo.png', price: 0.12 },
  NEAR: { name: 'NEAR Protocol', icon: 'https://assets.coingecko.com/coins/images/10365/small/near.jpg', price: 5.23 },
  APT: { name: 'Aptos', icon: 'https://assets.coingecko.com/coins/images/26455/small/aptos_round.png', price: 9.45 },
  ARB: { name: 'Arbitrum', icon: 'https://assets.coingecko.com/coins/images/16547/small/photo_2023-03-29_21.47.00.jpeg', price: 1.12 },
  OP: { name: 'Optimism', icon: 'https://assets.coingecko.com/coins/images/25244/small/Optimism.png', price: 2.34 },
  FTM: { name: 'Fantom', icon: 'https://assets.coingecko.com/coins/images/4001/small/Fantom_round.png', price: 0.78 },
  AAVE: { name: 'Aave', icon: 'https://assets.coingecko.com/coins/images/12645/small/AAVE.png', price: 156.78 },
  CRO: { name: 'Cronos', icon: 'https://assets.coingecko.com/coins/images/7310/small/cro_token_logo.png', price: 0.12 },
};

// POST - Swap crypto (buy one token with another)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const body = await request.json();
    const { fromToken, toToken, amountUsd } = body;

    if (!fromToken || !toToken || !amountUsd || amountUsd <= 0) {
      return NextResponse.json({ error: 'Invalid swap request' }, { status: 400 });
    }

    if (fromToken === toToken) {
      return NextResponse.json({ error: 'Cannot swap a token for itself' }, { status: 400 });
    }

    const userId = new mongoose.Types.ObjectId(session.user.id);

    // Check user's from-token holding
    const fromHolding = await UserHolding.findOne({ userId, symbol: fromToken });

    if (!fromHolding || fromHolding.amountUsd < amountUsd) {
      return NextResponse.json({
        error: `Insufficient ${fromToken} balance. You have ${formatCurrency(fromHolding?.amountUsd || 0)} but need ${formatCurrency(amountUsd)}`,
      }, { status: 400 });
    }

    // Calculate amounts
    const fromTokenPrice = fromHolding.amount > 0 ? fromHolding.amountUsd / fromHolding.amount : 1;
    const fromAmountToDeduct = amountUsd / fromTokenPrice;

    const toInfo = tokenInfo[toToken] || { name: toToken, icon: '', price: 1 };
    const toTokenPrice = toInfo.price;
    const toAmountToAdd = amountUsd / toTokenPrice;

    // Deduct from source token
    const newFromAmount = fromHolding.amount - fromAmountToDeduct;
    const newFromUsd = fromHolding.amountUsd - amountUsd;

    if (newFromUsd <= 0.01) {
      await UserHolding.findByIdAndDelete(fromHolding._id);
    } else {
      await UserHolding.findByIdAndUpdate(fromHolding._id, {
        $set: { amount: newFromAmount, amountUsd: newFromUsd },
      });
    }

    // Add to destination token
    let toHolding = await UserHolding.findOne({ userId, symbol: toToken });

    if (toHolding) {
      const newToAmount = toHolding.amount + toAmountToAdd;
      const newToUsd = toHolding.amountUsd + amountUsd;
      const newAvgPrice = newToAmount > 0 ? newToUsd / newToAmount : toTokenPrice;

      await UserHolding.findByIdAndUpdate(toHolding._id, {
        $set: { amount: newToAmount, amountUsd: newToUsd, averagePrice: newAvgPrice },
      });
    } else {
      await UserHolding.create({
        userId,
        symbol: toToken,
        name: toInfo.name,
        type: 'crypto',
        icon: toInfo.icon,
        amount: toAmountToAdd,
        amountUsd: amountUsd,
        averagePrice: toTokenPrice,
      });
    }

    // Add notification
    await User.findByIdAndUpdate(userId, {
      $push: {
        notifications: {
          $each: [{
            type: 'swap',
            title: 'Crypto Swap',
            message: `Swapped ${formatCurrency(amountUsd)} worth of ${fromToken} for ${toAmountToAdd.toFixed(6)} ${toToken}`,
            read: false,
            createdAt: new Date(),
          }],
          $position: 0,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: `Successfully swapped ${formatCurrency(amountUsd)} of ${fromToken} for ${toAmountToAdd.toFixed(6)} ${toToken}`,
      swap: {
        fromToken,
        fromAmount: fromAmountToDeduct,
        toToken,
        toAmount: toAmountToAdd,
        amountUsd,
      },
    });
  } catch (error) {
    console.error('Crypto swap error:', (error as Error).message);
    return NextResponse.json({ error: 'Swap failed' }, { status: 500 });
  }
}

// GET - Get list of available tokens for swap
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Return all available tokens for swapping
    const tokens = Object.entries(tokenInfo).map(([symbol, info]) => ({
      symbol,
      name: info.name,
      icon: info.icon,
      price: info.price,
    }));

    return NextResponse.json({ tokens });
  } catch (error) {
    console.error('Get tokens error:', (error as Error).message);
    return NextResponse.json({ tokens: [] });
  }
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
}
