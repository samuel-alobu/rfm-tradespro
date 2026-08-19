import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { auth } from '@/lib/auth';
import { connectToDatabase } from '@/db/connection';
import { User, ColdStorage, UserHolding } from '@/db/models';

// Token icons mapping
const tokenIcons: Record<string, string> = {
  BTC: 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png',
  ETH: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png',
  USDT: 'https://assets.coingecko.com/coins/images/325/small/Tether.png',
  USDC: 'https://assets.coingecko.com/coins/images/6319/small/usdc.png',
  BNB: 'https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png',
  SOL: 'https://assets.coingecko.com/coins/images/4128/small/solana.png',
  XRP: 'https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png',
  DOGE: 'https://assets.coingecko.com/coins/images/5/small/dogecoin.png',
  ADA: 'https://assets.coingecko.com/coins/images/975/small/cardano.png',
  AVAX: 'https://assets.coingecko.com/coins/images/12559/small/Avalanche_Circle_RedWhite_Trans.png',
  DOT: 'https://assets.coingecko.com/coins/images/12171/small/polkadot.png',
  MATIC: 'https://assets.coingecko.com/coins/images/4713/small/matic-token-icon.png',
  LINK: 'https://assets.coingecko.com/coins/images/877/small/chainlink-new-logo.png',
  UNI: 'https://assets.coingecko.com/coins/images/12504/small/uniswap-uni.png',
  ATOM: 'https://assets.coingecko.com/coins/images/1481/small/cosmos_hub.png',
  LTC: 'https://assets.coingecko.com/coins/images/2/small/litecoin.png',
  SHIB: 'https://assets.coingecko.com/coins/images/11939/small/shiba.png',
  TRX: 'https://assets.coingecko.com/coins/images/1094/small/tron-logo.png',
  NEAR: 'https://assets.coingecko.com/coins/images/10365/small/near.jpg',
  APT: 'https://assets.coingecko.com/coins/images/26455/small/aptos_round.png',
  ARB: 'https://assets.coingecko.com/coins/images/16547/small/photo_2023-03-29_21.47.00.jpeg',
  OP: 'https://assets.coingecko.com/coins/images/25244/small/Optimism.png',
  FTM: 'https://assets.coingecko.com/coins/images/4001/small/Fantom_round.png',
  AAVE: 'https://assets.coingecko.com/coins/images/12645/small/AAVE.png',
  CRO: 'https://assets.coingecko.com/coins/images/7310/small/cro_token_logo.png',
};

const tokenNames: Record<string, string> = {
  BTC: 'Bitcoin', ETH: 'Ethereum', USDT: 'Tether', USDC: 'USD Coin',
  BNB: 'BNB', SOL: 'Solana', XRP: 'Ripple', DOGE: 'Dogecoin',
  ADA: 'Cardano', AVAX: 'Avalanche', DOT: 'Polkadot', MATIC: 'Polygon',
  LINK: 'Chainlink', UNI: 'Uniswap', ATOM: 'Cosmos', LTC: 'Litecoin',
  SHIB: 'Shiba Inu', TRX: 'TRON', NEAR: 'NEAR Protocol', APT: 'Aptos',
  ARB: 'Arbitrum', OP: 'Optimism', FTM: 'Fantom', AAVE: 'Aave', CRO: 'Cronos',
};

// GET - Fetch user's cold storage assets and wallet holdings from UserHolding
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const userId = new mongoose.Types.ObjectId(session.user.id);

    // Fetch in parallel: user balance, cold storage assets, user holdings
    const [user, coldStorageAssets, userHoldings] = await Promise.all([
      User.findById(userId).select('availableBalance').lean(),
      ColdStorage.find({ userId, status: 'active' })
        .sort({ createdAt: -1 })
        .lean(),
      UserHolding.find({ userId, amountUsd: { $gt: 0 } })
        .sort({ amountUsd: -1 })
        .lean(),
    ]);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Convert holdings to wallet format
    const walletHoldings = userHoldings.map((h: any) => ({
      symbol: h.symbol,
      name: h.name,
      icon: h.icon || tokenIcons[h.symbol] || '',
      amount: h.amount,
      amountUsd: h.amountUsd,
      price: h.amount > 0 ? h.amountUsd / h.amount : 0,
    }));

    // Calculate total cold storage value
    const totalColdStorageValue = coldStorageAssets.reduce(
      (sum: number, asset: any) => sum + (asset.currentValue || 0),
      0
    );

    return NextResponse.json({
      coldStorageAssets: coldStorageAssets.map((asset: any) => ({
        id: asset._id.toString(),
        symbol: asset.symbol,
        name: asset.name,
        type: asset.type,
        icon: asset.icon,
        quantity: asset.quantity,
        purchasePrice: asset.purchasePrice,
        currentPrice: asset.currentPrice,
        currentValue: asset.currentValue,
        createdAt: asset.createdAt,
      })),
      walletHoldings,
      totalColdStorageValue,
      availableBalance: user.availableBalance || 0,
    });
  } catch (error) {
    console.error('Cold storage fetch error:', (error as Error).message);
    return NextResponse.json({
      coldStorageAssets: [],
      walletHoldings: [],
      totalColdStorageValue: 0,
      availableBalance: 0,
    });
  }
}

// POST - Deposit asset to cold storage (deducts from UserHolding)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const body = await request.json();
    const { symbol, name, type, icon, quantity, price } = body;

    if (!symbol || !quantity || quantity <= 0 || !price) {
      return NextResponse.json({ error: 'Invalid deposit data' }, { status: 400 });
    }

    const userId = new mongoose.Types.ObjectId(session.user.id);
    const depositValue = quantity * price;

    // Check user's holding for this token
    const holding = await UserHolding.findOne({ userId, symbol });
    
    if (!holding || holding.amountUsd < depositValue) {
      return NextResponse.json({ 
        error: `Insufficient ${symbol} balance. You have ${formatCurrency(holding?.amountUsd || 0)} but need ${formatCurrency(depositValue)}` 
      }, { status: 400 });
    }

    // Check if user already has this asset in cold storage
    let coldStorageAsset = await ColdStorage.findOne({ userId, symbol, status: 'active' });

    if (coldStorageAsset) {
      // Add to existing cold storage entry
      coldStorageAsset.quantity += quantity;
      coldStorageAsset.currentPrice = price;
      coldStorageAsset.currentValue = coldStorageAsset.quantity * price;
      await coldStorageAsset.save();
    } else {
      // Create new cold storage entry
      coldStorageAsset = await ColdStorage.create({
        userId,
        symbol,
        name: name || tokenNames[symbol] || symbol,
        type: type || 'crypto',
        icon: icon || tokenIcons[symbol] || '',
        quantity,
        purchasePrice: price,
        currentPrice: price,
        currentValue: quantity * price,
        status: 'active',
      });
    }

    // Deduct from UserHolding (token balance)
    const newAmount = holding.amount - quantity;
    const newAmountUsd = holding.amountUsd - depositValue;
    
    if (newAmountUsd <= 0.01) {
      // Remove holding if balance is essentially zero
      await UserHolding.findByIdAndDelete(holding._id);
    } else {
      await UserHolding.findByIdAndUpdate(holding._id, {
        $set: { amount: newAmount, amountUsd: newAmountUsd },
      });
    }

    // Deduct from user's available balance (atomic update)
    await User.findByIdAndUpdate(userId, {
      $inc: { availableBalance: -depositValue },
      $push: {
        notifications: {
          $each: [{
            type: 'cold_storage',
            title: 'Cold Storage Deposit',
            message: `Successfully deposited ${quantity.toFixed(4)} ${symbol} (${formatCurrency(depositValue)}) to cold storage`,
            read: false,
            createdAt: new Date(),
          }],
          $position: 0,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: `Successfully deposited ${quantity} ${symbol} to cold storage`,
      asset: {
        id: coldStorageAsset._id.toString(),
        symbol: coldStorageAsset.symbol,
        name: coldStorageAsset.name,
        quantity: coldStorageAsset.quantity,
        currentPrice: coldStorageAsset.currentPrice,
        currentValue: coldStorageAsset.currentValue,
      },
    });
  } catch (error) {
    console.error('Cold storage deposit error:', (error as Error).message);
    return NextResponse.json({ error: 'Failed to deposit to cold storage' }, { status: 500 });
  }
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
}
